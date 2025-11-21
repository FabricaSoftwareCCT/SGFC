import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import "sweetalert2/themes/bulma.css";
import "./Activities.css";
import { Header } from "../../../Layouts/Header/Header";
import { Main } from "../../../Layouts/Main/Main";
import { Footer } from "../../../Layouts/Footer/Footer";
import {
	attachMaterialToActivity,
	detachMaterialFromActivity,
	getActivity,
	getCourseMaterials,
	getCourseParticipants,
	registerDelivery,
	reviewDelivery,
} from "../../../../api/activitiesApi";
import axiosInstance from "../../../../config/axiosInstance";
import { useUserSession } from "../../../../hooks/useUserSession";
import {
	DeliveryModal,
	MaterialSelectorModal,
	ReviewModal,
} from "./ActivityDialogs";

const swalConfig = {
	theme: "bulma",
	customClass: {
		confirmButton: "button is-primary",
		cancelButton: "button is-light",
		actions: "swal2-actions-centered",
		popup: "swal2-popup-centered",
	},
	buttonsStyling: false,
	confirmButtonText: "Aceptar",
	cancelButtonText: "Cancelar",
};

const formatDateTime = (value) => {
	if (!value) return "Sin definir";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "Sin definir";
	return date.toLocaleString("es-CO", {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

const downloadUrl = (relativePath) => {
	if (!relativePath) return null;
	const normalized = relativePath.startsWith("http")
		? relativePath
		: `http://localhost:3001${relativePath}`;
	return normalized;
};

const formatFileSize = (bytes) => {
	if (bytes === undefined || bytes === null) {
		return null;
	}

	const parsed = Number(bytes);
	if (Number.isNaN(parsed)) {
		return null;
	}

	const units = ["bytes", "KB", "MB", "GB"];
	let size = parsed;
	let unitIndex = 0;

	while (size >= 1024 && unitIndex < units.length - 1) {
		size /= 1024;
		unitIndex += 1;
	}

	return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const PARTICIPANTS_PAGE_SIZE = 10;

export const ActivityDetail = () => {
	const { id: cursoId, actividadId } = useParams();
	const navigate = useNavigate();
	const { isPrivileged, userId, accountType } = useUserSession();

	const [activity, setActivity] = useState(null);
	const [courseMaterials, setCourseMaterials] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const [showDeliveryModal, setShowDeliveryModal] = useState(false);
	const [showReviewModal, setShowReviewModal] = useState(false);
	const [reviewTarget, setReviewTarget] = useState(null);
	const [materialModalOpen, setMaterialModalOpen] = useState(false);
	const [isInstructorAssigned, setIsInstructorAssigned] = useState(false);
	const [participantsState, setParticipantsState] = useState({
		items: [],
		total: 0,
		page: 0,
		pages: 1,
	});
	const [participantsLoading, setParticipantsLoading] = useState(false);
	const [participantsError, setParticipantsError] = useState(null);

	const loadActivity = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await getActivity(actividadId);
			setActivity(data);
		} catch (err) {
			console.error("Error al obtener actividad:", err);
			setError(
				err?.message || "No se pudo obtener la información de la actividad."
			);
			await Swal.fire({
				...swalConfig,
				icon: "error",
				title: "Error",
				text:
					err?.message ||
					"Ocurrió un error al obtener los detalles de la actividad.",
			});
		} finally {
			setLoading(false);
		}
	}, [actividadId]);

	const loadCourseMaterials = useCallback(async () => {
		try {
			const materiales = await getCourseMaterials(cursoId);
			setCourseMaterials(materiales);
		} catch (error) {
			console.error("Error al cargar materiales del curso:", error);
		}
	}, [cursoId]);

	const loadParticipants = useCallback(
		async (page = 0, limit = PARTICIPANTS_PAGE_SIZE) => {
			if (!isPrivileged || !cursoId) {
				return;
			}

			setParticipantsLoading(true);
			setParticipantsError(null);

			try {
				const data = await getCourseParticipants(cursoId, { page, limit });
				setParticipantsState({
					items: data.participants || [],
					total: data.total ?? 0,
					page: data.page ?? page,
					pages:
						data.pages ??
						Math.max(
							1,
							Math.ceil((data.total ?? 0) / (limit || PARTICIPANTS_PAGE_SIZE))
						),
				});
			} catch (err) {
				console.error("Error al cargar los participantes del curso:", err);
				setParticipantsState((previous) => ({
					...previous,
					items: [],
				}));
				setParticipantsError(
					err?.message || "No se pudieron cargar los participantes del curso."
				);
			} finally {
				setParticipantsLoading(false);
			}
		},
		[cursoId, isPrivileged]
	);

	useEffect(() => {
		loadActivity();
		loadCourseMaterials();
	}, [loadActivity, loadCourseMaterials]);

	useEffect(() => {
		if (isPrivileged) {
			loadParticipants(0, PARTICIPANTS_PAGE_SIZE);
		}
	}, [isPrivileged, loadParticipants]);

	const attachedMaterialIds = useMemo(() => {
		return new Set((activity?.materiales || []).map((material) => material.ID));
	}, [activity]);

	const availableMaterials = useMemo(() => {
		return courseMaterials.filter((material) => !attachedMaterialIds.has(material.ID));
	}, [courseMaterials, attachedMaterialIds]);

	const canManageCourse = useMemo(() => {
		if (accountType === "administrador" || accountType === "gestor") {
			return true;
		}
		if (accountType === "instructor") {
			return isInstructorAssigned;
		}
		return false;
	}, [accountType, isInstructorAssigned]);

	const notifyManageRestriction = useCallback(() => {
		void Swal.fire({
			...swalConfig,
			icon: "info",
			title: "Sin permisos",
			text: "Solo el instructor asignado o un administrador/gestor puede realizar esta acción.",
		});
	}, []);

	useEffect(() => {
		if (accountType !== "instructor" || !userId) {
			setIsInstructorAssigned(false);
			return;
		}

		const fetchAssignments = async () => {
			try {
				const response = await axiosInstance.get(
					`/api/courses/cursos-asignados/${userId}`
				);
				const assignments = Array.isArray(response.data) ? response.data : [];
				const assigned = assignments.some((assignment) => {
					const estado = (
						assignment?.estado ||
						assignment?.estado_asignacion ||
						assignment?.estadoAsignacion ||
						""
					).toLowerCase();
					const cursoAssignment = assignment?.Curso || assignment;
					const assignedCourseId = Number(
						cursoAssignment?.ID ??
							cursoAssignment?.id ??
							assignment?.curso_ID ??
							assignment?.curso_id
					);
					return (
						estado === "aceptada" &&
						!Number.isNaN(assignedCourseId) &&
						assignedCourseId === Number(cursoId)
					);
				});
				setIsInstructorAssigned(assigned);
			} catch (error) {
				console.error("Error al obtener cursos asignados:", error);
				setIsInstructorAssigned(false);
			}
		};

		void fetchAssignments();
	}, [accountType, userId, cursoId]);

	const currentSubmission = useMemo(() => {
		if (!Array.isArray(activity?.entregas)) return null;
		return activity.entregas.find(
			(entrega) => Number(entrega.aprendiz_ID) === Number(userId)
		);
	}, [activity, userId]);

	const submissionOwnerName = useMemo(() => {
		if (!currentSubmission) {
			return null;
		}

		const { aprendiz } = currentSubmission;
		if (aprendiz?.nombres && aprendiz?.apellidos) {
			return `${aprendiz.nombres} ${aprendiz.apellidos}`;
		}

		return null;
	}, [currentSubmission]);

	const submissionFileName = useMemo(() => {
		if (!currentSubmission?.archivo_ruta) {
			return null;
		}

		if (currentSubmission?.nombre_archivo) {
			return currentSubmission.nombre_archivo;
		}

		return currentSubmission.archivo_ruta.split("/").pop();
	}, [currentSubmission]);

	const isDeliveryLocked = useMemo(() => {
		if (!currentSubmission) {
			return false;
		}
		return (
			(currentSubmission.estado_revision || "").toLowerCase() === "aprobada"
		);
	}, [currentSubmission]);

	const submissionsByApprentice = useMemo(() => {
		const map = new Map();
		(activity?.entregas ?? []).forEach((entrega) => {
			const apprenticeId = Number(entrega.aprendiz_ID);
			if (Number.isNaN(apprenticeId)) {
				return;
			}
			const existing = map.get(apprenticeId);
			if (!existing) {
				map.set(apprenticeId, entrega);
				return;
			}
			const existingTime = existing?.fecha_envio
				? new Date(existing.fecha_envio).getTime()
				: 0;
			const newTime = entrega?.fecha_envio
				? new Date(entrega.fecha_envio).getTime()
				: 0;
			if (newTime >= existingTime) {
				map.set(apprenticeId, entrega);
			}
		});
		return map;
	}, [activity?.entregas]);

	const activityState = useMemo(
		() => (activity?.estado || "").toLowerCase(),
		[activity?.estado]
	);
	const isActivityActive = activityState === "activa";
	const isActivityClosed = activityState === "cerrada";
	const activityStatusLabel = useMemo(() => {
		if (isActivityActive) {
			return "Activa";
		}
		if (isActivityClosed) {
			return "Cerrada";
		}
		return activity?.estado || "Sin estado";
	}, [activity?.estado, isActivityActive, isActivityClosed]);
	const activityClosingLabel = useMemo(() => {
		const reference = activity?.fecha_cierre || activity?.fecha_limite;
		return reference ? formatDateTime(reference) : null;
	}, [activity?.fecha_cierre, activity?.fecha_limite]);

	const participantRows = useMemo(() => {
		if (!Array.isArray(participantsState.items)) {
			return [];
		}

		const map = new Map(
			(activity?.entregas || []).map((entrega) => [
				Number(entrega.aprendiz_ID),
				entrega,
			])
		);

		return participantsState.items.map((record) => {
			const apprenticeId = Number(record?.aprendiz_ID);
			const submission =
				map.get(apprenticeId) || submissionsByApprentice.get(apprenticeId) || null;

			return {
				record,
				apprentice: record?.aprendiz || submission?.aprendiz || null,
				submission,
			};
		});
	}, [participantsState.items, activity?.entregas, submissionsByApprentice]);

	const handleDelivery = () => {
		if (isDeliveryLocked) {
			void Swal.fire({
				...swalConfig,
				icon: "info",
				title: "Entrega aprobada",
				text: "Esta actividad ya fue aprobada. No es necesario registrar una nueva entrega.",
			});
			return;
		}
		setShowDeliveryModal(true);
	};

	const handleSubmitDelivery = async ({ file, comment }) => {
		const formData = new FormData();
		if (file) {
			formData.append("archivo_entrega", file);
		}
		if (comment) {
			formData.append("comentario", comment);
		}

		try {
			await registerDelivery(actividadId, formData);
			await Swal.fire({
				...swalConfig,
				icon: "success",
				title: "Entrega registrada",
				text: "Tu entrega fue registrada correctamente.",
			});
			setShowDeliveryModal(false);
			await loadActivity();
		} catch (error) {
			console.error("Error al registrar entrega:", error);
			const message =
				error?.response?.data?.message ||
				error?.message ||
				"Ocurrió un error al registrar la entrega. Revisa el archivo e inténtalo nuevamente.";
			await Swal.fire({
				...swalConfig,
				icon: "error",
				title: "No se pudo guardar",
				text: message,
			});
		}
	};

	const handleReview = (entrega) => {
		if (!canManageCourse) {
			notifyManageRestriction();
			return;
		}
		setReviewTarget(entrega);
		setShowReviewModal(true);
	};

	const handleSubmitReview = async ({ estado, retroalimentacion, file }) => {
		if (!reviewTarget) return;

		const formData = new FormData();
		if (estado) formData.append("estado_revision", estado);
		if (retroalimentacion) formData.append("retroalimentacion", retroalimentacion);
		if (file) formData.append("archivo_retroalimentacion", file);

		try {
			await reviewDelivery(reviewTarget.ID, formData);
			await Swal.fire({
				...swalConfig,
				icon: "success",
				title: "Retroalimentación registrada",
				text: "Se guardó la retroalimentación correctamente.",
			});
			setShowReviewModal(false);
			setReviewTarget(null);
			await loadActivity();
		} catch (error) {
			console.error("Error al guardar la retroalimentación:", error);
			const message =
				error?.response?.data?.message ||
				error?.message ||
				"No se pudo registrar la retroalimentación. Revisa la información e inténtalo nuevamente.";
			await Swal.fire({
				...swalConfig,
				icon: "error",
				title: "No se pudo guardar",
				text: message,
			});
		}
	};

	const handleAttachMaterials = async (selectedIds) => {
		if (!canManageCourse) {
			notifyManageRestriction();
			return;
		}
		const idsToAttach = selectedIds.filter((id) => !attachedMaterialIds.has(id));
		if (idsToAttach.length === 0) {
			setMaterialModalOpen(false);
			return;
		}

		try {
			await Promise.all(
				idsToAttach.map((materialId) =>
					attachMaterialToActivity(actividadId, materialId)
				)
			);
			await Swal.fire({
				...swalConfig,
				icon: "success",
				title: "Material actualizado",
				text: "Los materiales se asociaron correctamente a la actividad.",
			});
			setMaterialModalOpen(false);
			await loadActivity();
		} catch (error) {
			console.error("Error al asociar materiales:", error);
			await Swal.fire({
				...swalConfig,
				icon: "error",
				title: "Error",
				text:
					error?.message ||
					"No se pudieron asociar los materiales seleccionados.",
			});
		}
	};

	const handleDetachMaterial = async (material) => {
		if (!canManageCourse) {
			notifyManageRestriction();
			return;
		}
		const result = await Swal.fire({
			...swalConfig,
			icon: "question",
			title: "Eliminar material",
			text: "¿Deseas desasociar este material de la actividad?",
			showCancelButton: true,
		});

		if (!result.isConfirmed) return;

		try {
			await detachMaterialFromActivity(actividadId, material.ID);
			await Swal.fire({
				...swalConfig,
				icon: "success",
				title: "Material desasociado",
				text: "El material ya no está ligado a la actividad.",
			});
			await loadActivity();
		} catch (error) {
			console.error("Error al desasociar material:", error);
			await Swal.fire({
				...swalConfig,
				icon: "error",
				title: "Error",
				text:
					error?.message ||
					"No se pudo desasociar el material. Intenta nuevamente.",
			});
		}
	};

	const handleParticipantsPageChange = (direction) => {
		const totalPages =
			participantsState.pages ||
			Math.max(
				1,
				Math.ceil(participantsState.total / PARTICIPANTS_PAGE_SIZE)
			);
		const currentPage = participantsState.page || 0;
		const nextPage = currentPage + direction;

		if (
			nextPage < 0 ||
			nextPage >= totalPages ||
			participantsLoading
		) {
			return;
		}

		loadParticipants(nextPage, PARTICIPANTS_PAGE_SIZE);
	};

	const renderSubmissionCard = () => {
		if (!currentSubmission) {
			return (
				<div className="empty-state" style={{ padding: "1.5rem", marginTop: "1rem" }}>
					<strong>Aún no has registrado una entrega.</strong>
					{isActivityClosed ? (
						<span>
							La actividad está cerrada
							{activityClosingLabel ? ` desde el ${activityClosingLabel}` : ""}. No puedes registrar nuevas entregas.
						</span>
					) : (
						<>
							<span>
								Súbelo en ZIP, PDF o el formato indicado antes de la fecha límite para recibir retroalimentación.
							</span>
							{activityClosingLabel && (
								<small style={{ display: "block", marginTop: "0.4rem", color: "#9adbb6" }}>
									Fecha límite: {activityClosingLabel}
								</small>
							)}
						</>
					)}
				</div>
			);
		}

		const getVisualStatus = () => {
			const revisionState = (currentSubmission.estado_revision || "pendiente").toLowerCase();
			const dueDate = activity?.fecha_limite ? new Date(activity.fecha_limite) : null;
			const sentDate = currentSubmission.fecha_envio ? new Date(currentSubmission.fecha_envio) : null;
			const isLate =
				dueDate && sentDate ? sentDate.getTime() > dueDate.getTime() : false;

			if (revisionState === "aprobada") {
				return {
					variant: isLate ? "warning" : "success",
					icon: isLate ? "⚠" : "✓",
					label: isLate ? "Entrega tardía" : "Entregado a tiempo",
				};
			}

			if (revisionState === "rechazada") {
				return {
					variant: "danger",
					icon: "⚠",
					label: "Pendiente de corrección",
				};
			}

			return {
				variant: isLate ? "warning" : "neutral",
				icon: isLate ? "⚠" : "⏱",
				label: isLate ? "Entrega tardía" : "Pendiente",
			};
		};

		const submissionStatus = getVisualStatus();
		const ownerLabel =
			submissionOwnerName || activity?.curso?.nombre_curso || "Tu entrega";
		const fileName = submissionFileName || "archivo_entrega";
		const formattedSize = formatFileSize(currentSubmission?.peso_archivo);
		const fileExtension =
			submissionFileName && submissionFileName.includes(".")
				? submissionFileName.split(".").pop().toUpperCase()
				: null;
		const hasFeedback =
			Boolean(currentSubmission?.retroalimentacion) ||
			Boolean(currentSubmission?.retro_archivo_ruta);

		return (
			<div className="submission-card">
				<header className="submission-card__header">
					<div className="submission-card__title">
						<span className="submission-card__name">{ownerLabel}</span>
						<span className={`submission-status submission-status--${submissionStatus.variant}`}>
							<span className="submission-status__icon">{submissionStatus.icon}</span>
							{submissionStatus.label}
						</span>
					</div>
					<small className="submission-card__helper">
						Actualizada el {formatDateTime(currentSubmission.fecha_envio)}
					</small>
				</header>

				<section className="submission-card__section">
					<h3>Fecha de entrega</h3>
					<p>{formatDateTime(currentSubmission.fecha_envio)}</p>
				</section>

				{currentSubmission.comentario && (
					<section className="submission-card__section">
						<h3>Comentario</h3>
						<p className="submission-card__comment">{currentSubmission.comentario}</p>
					</section>
				)}

				{currentSubmission.archivo_ruta && (
					<section className="submission-card__section submission-card__section--file">
						<h3>Archivo adjunto</h3>
						<div className="submission-file">
							<div className="submission-file__meta">
								{fileExtension && (
									<span className="submission-file__badge">{fileExtension}</span>
								)}
								<span className="submission-file__name">{fileName}</span>
							</div>
							{formattedSize && (
								<span className="submission-file__size">{formattedSize}</span>
							)}
							<a
								href={downloadUrl(currentSubmission.archivo_ruta)}
								className="submission-file__download"
								target="_blank"
								rel="noopener noreferrer"
							>
								Descargar
							</a>
						</div>
					</section>
				)}

				{hasFeedback && (
					<section className="submission-card__section submission-card__feedback">
						<h3>Retroalimentación del instructor</h3>
						{currentSubmission.retroalimentacion ? (
							<p>{currentSubmission.retroalimentacion}</p>
						) : (
							<p className="submission-card__feedback-text">
								El instructor adjuntó un archivo con observaciones.
							</p>
						)}
						{currentSubmission.retro_archivo_ruta && (
							<a
								className="submission-file__download"
								href={downloadUrl(currentSubmission.retro_archivo_ruta)}
								target="_blank"
								rel="noopener noreferrer"
							>
								Descargar feedback
							</a>
						)}
					</section>
				)}

				{!hasFeedback && (
					<section className="submission-card__section submission-card__feedback submission-card__feedback--empty">
						<h3>Retroalimentación del instructor</h3>
						<p className="submission-card__feedback-empty">
							Sin retroalimentación disponible
						</p>
					</section>
				)}

				<footer className="submission-card__footer">
					{isActivityActive && !isDeliveryLocked && (
						<button
							type="button"
							className="btn-primary btn-primary--loud"
							onClick={handleDelivery}
						>
							Actualizar entrega
						</button>
					)}

					{isDeliveryLocked && (
						<span className="submission-card__note">
							Tu entrega fue aprobada. No necesitas enviar otra para esta actividad.
						</span>
					)}

					{isActivityClosed && !isDeliveryLocked && (
						<span className="submission-card__note">
							La actividad está cerrada. Ya no es posible actualizar esta entrega.
						</span>
					)}
				</footer>
			</div>
		);
	};

	const renderInstructorTable = () => {
		const rows = participantRows;
		const totalPages =
			participantsState.pages ||
			Math.max(
				1,
				Math.ceil(participantsState.total / PARTICIPANTS_PAGE_SIZE)
			);
		const currentPage = participantsState.page || 0;
		let startRange = 0;
		let endRange = 0;

		if (participantsState.total > 0) {
			startRange = currentPage * PARTICIPANTS_PAGE_SIZE + 1;
			endRange = Math.min(
				participantsState.total,
				(currentPage + 1) * PARTICIPANTS_PAGE_SIZE
			);
		}

		return (
			<div className="deliveries-table">
				<div className="deliveries-table__head">
					<span>Aprendiz</span>
					<span>Documento</span>
					<span>Fecha de entrega</span>
					<span>Estado</span>
					<span>Archivo</span>
					<span>Acciones</span>
				</div>
				<div className="deliveries-table__body">
					{participantsLoading ? (
						<div className="deliveries-table__empty">
							Cargando aprendices...
						</div>
					) : participantsError ? (
						<div className="deliveries-table__empty">
							{participantsError}
						</div>
					) : rows.length === 0 ? (
						<div className="deliveries-table__empty">
							No hay aprendices inscritos en este curso.
						</div>
					) : (
						rows.map((row) => {
							const { record, apprentice, submission } = row;
							let displayName = `Aprendiz ${record?.aprendiz_ID ?? ""}`;
							if (apprentice) {
								const baseName = `${apprentice.nombres || ""} ${
									apprentice.apellidos || ""
								}`.trim();
								if (baseName.length > 0) {
									displayName = baseName;
								}
							}
							const email = apprentice?.email || "Sin correo registrado";
							const documentNumber =
								apprentice?.documento || "Sin documento";
							const deliveredAt = submission?.fecha_envio
								? formatDateTime(submission.fecha_envio)
								: "Sin entrega";
							const formattedSize = formatFileSize(
								submission?.peso_archivo
							);
							let fileLabel = "Sin entrega";
							if (submission) {
								if (submission.nombre_archivo) {
									fileLabel = submission.nombre_archivo;
								} else if (submission.archivo_ruta) {
									const segments = submission.archivo_ruta.split("/");
									fileLabel =
										segments[segments.length - 1] || "Sin archivo adjunto";
								} else {
									fileLabel = "Sin archivo adjunto";
								}
							}
							const revisionState = submission?.estado_revision || "";
							const dueDate = activity?.fecha_limite
								? new Date(activity.fecha_limite)
								: null;
							const sentDate = submission?.fecha_envio
								? new Date(submission.fecha_envio)
								: null;
							const isLate =
								dueDate && sentDate
									? sentDate.getTime() > dueDate.getTime()
									: false;

							let statusVariant = "none";
							let statusMessage = "No entregado";

							if (submission) {
								const normalized = revisionState.toLowerCase();
								if (normalized === "aprobada") {
									statusVariant = isLate ? "warning" : "success";
									statusMessage = isLate
										? "Entrega tardía"
										: "Aprobado";
								} else if (normalized === "rechazada") {
									statusVariant = "danger";
									statusMessage = "Rechazada";
								} else {
									statusVariant = isLate ? "warning" : "neutral";
									statusMessage = isLate
										? "Entrega tardía"
										: "Pendiente de revisión";
								}
							}

							const canDownload = Boolean(submission?.archivo_ruta);
							const canReview = Boolean(submission);

							return (
								<div
									className="deliveries-table__row"
									key={record?.ID || `participant-${record?.aprendiz_ID}`}
								>
									<div className="deliveries-table__cell deliveries-table__cell--apprentice">
										<span className="deliveries-table__name">{displayName}</span>
										<span className="deliveries-table__meta">{email}</span>
										{submission?.comentario && (
											<span className="deliveries-table__comment">
												Comentario: {submission.comentario}
											</span>
										)}
									</div>
									<div className="deliveries-table__cell">{documentNumber}</div>
									<div className="deliveries-table__cell">{deliveredAt}</div>
									<div className="deliveries-table__cell">
										<span
											className={`submission-status submission-status--${statusVariant}`}
										>
											{statusMessage}
										</span>
									</div>
									<div className="deliveries-table__cell">
										{submission ? (
											<div className="deliveries-table__file">
												<span
													className="deliveries-table__file-name"
													title={fileLabel}
												>
													{fileLabel}
												</span>
												{formattedSize && (
													<span className="deliveries-table__file-size">
														{formattedSize}
													</span>
												)}
											</div>
										) : (
											<span className="deliveries-table__file-empty">
												Sin entrega
											</span>
										)}
									</div>
									<div className="deliveries-table__cell deliveries-table__actions">
										{canManageCourse ? (
											<>
												{canDownload && (
													<a
														className="deliveries-table__button deliveries-table__button--ghost"
														href={downloadUrl(submission.archivo_ruta)}
														target="_blank"
														rel="noopener noreferrer"
													>
														Descargar
													</a>
												)}
												{canReview && (
													<button
														type="button"
														className="deliveries-table__button"
														onClick={() => handleReview(submission)}
													>
														Revisar
													</button>
												)}
											</>
										) : (
											<span className="deliveries-table__hint">Sin permisos</span>
										)}
									</div>
								</div>
							);
						})
					)}
				</div>
				<div className="deliveries-table__footer">
					<span className="deliveries-table__page-info">
						{participantsState.total === 0
							? "Sin aprendices registrados"
							: `Mostrando ${startRange} - ${endRange} de ${participantsState.total}`}
					</span>
					<div className="deliveries-table__pagination">
						<button
							type="button"
							className="deliveries-table__pagination-button"
							onClick={() => handleParticipantsPageChange(-1)}
							disabled={participantsLoading || currentPage === 0}
						>
							Anterior
						</button>
						<span className="deliveries-table__page-indicator">
							Página {currentPage + 1} de {totalPages}
						</span>
						<button
							type="button"
							className="deliveries-table__pagination-button"
							onClick={() => handleParticipantsPageChange(1)}
							disabled={
								participantsLoading || currentPage >= totalPages - 1
							}
						>
							Siguiente
						</button>
					</div>
				</div>
			</div>
		);
	};

	if (loading) {
		return (
			<>
				<Header />
				<div className="activities-wrapper">
					<Main>
						<div className="activities-loading">Cargando actividad...</div>
					</Main>
					<Footer />
				</div>
			</>
		);
	}

	if (error) {
		return (
			<>
				<Header />
				<div className="activities-wrapper">
					<Main>
						<div className="empty-state">
							<strong>Ocurrió un error.</strong>
							<span>{error}</span>
							<button
								type="button"
									className="btn-primary btn-primary--loud"
								onClick={loadActivity}
								style={{ marginTop: "0.8rem" }}
							>
								Reintentar
							</button>
						</div>
					</Main>
					<Footer />
				</div>
			</>
		);
	}

	if (!activity) {
		return null;
	}

	return (
		<>
			<Header />
			<div className="activities-wrapper">
				<Main>
					<div className="activities-main" style={{ gap: "1.6rem" }}>
						<div className="activities-header">
							<div className="activities-header-top">
								<h1>
									{activity.titulo}
									<span>
										{activity.curso?.nombre_curso
											? `Curso: ${activity.curso.nombre_curso}`
											: "Detalle de actividad"}
									</span>
								</h1>

								<div className="activities-actions">
									<button
										type="button"
										className="btn-secondary"
										onClick={() => navigate(`/Cursos/${cursoId}/actividades`)}
									>
										Volver a actividades
									</button>
									<button
										type="button"
										className="btn-secondary"
										onClick={() => navigate(`/Cursos/${cursoId}`)}
									>
										Ver curso
									</button>
									{canManageCourse && availableMaterials.length > 0 && (
										<button
											type="button"
											className="btn-primary"
											onClick={() => setMaterialModalOpen(true)}
										>
											Asociar material
										</button>
									)}
								</div>
							</div>

							<div className="course-summary">
								<div className="summary-card">
									<label>Estado</label>
									<span>{activityStatusLabel}</span>
									{isActivityClosed && activityClosingLabel && (
										<small
											style={{
												display: "block",
												marginTop: "0.2rem",
												color: "#9adbb6",
											}}
										>
											Cerrada el {activityClosingLabel}
										</small>
									)}
								</div>
								<div className="summary-card">
									<label>Publicación</label>
									<span>{formatDateTime(activity.fecha_publicacion)}</span>
								</div>
								<div className="summary-card">
									<label>Fecha límite</label>
									<span>{formatDateTime(activity.fecha_limite)}</span>
								</div>
								{activity.porcentaje_aporte !== null &&
									activity.porcentaje_aporte !== undefined && (
										<div className="summary-card">
											<label>Aporte</label>
											<span>{activity.porcentaje_aporte}%</span>
										</div>
									)}
							</div>
						</div>

						<section
							style={{
								background: "rgba(0,0,0,0.25)",
								borderRadius: "18px",
								padding: "1.5rem",
								border: "1px solid rgba(0,230,118,0.18)",
								display: "flex",
								flexDirection: "column",
								gap: "1rem",
							}}
						>
							<h2>Descripción</h2>
							<p style={{ lineHeight: 1.7, color: "rgba(235,248,239,0.85)" }}>
								{activity.descripcion || "Esta actividad no tiene descripción registrada."}
							</p>
						</section>

						<section
							style={{
								background: "rgba(0,0,0,0.25)",
								borderRadius: "18px",
								padding: "1.5rem",
								border: "1px solid rgba(0,230,118,0.18)",
								display: "flex",
								flexDirection: "column",
								gap: "1rem",
							}}
						>
							<div style={{ display: "flex", justifyContent: "space-between" }}>
								<h2>Material asociado</h2>
								{canManageCourse && activity.materiales?.length > 0 && (
									<span style={{ fontSize: "0.85rem", opacity: 0.7 }}>
										Puedes remover material individual usando el menú de cada elemento.
									</span>
								)}
							</div>
							{activity.materiales?.length > 0 ? (
								<div className="materials-grid">
									{activity.materiales.map((material) => (
										<div key={material.ID} className="material-pill">
											<strong>{material.nombre_original || material.contenido}</strong>
											<span style={{ fontSize: "0.8rem", opacity: 0.75 }}>
												{material.tipo_contenido?.toUpperCase()}
											</span>
											<div style={{ display: "flex", gap: "0.5rem", marginTop: "0.6rem" }}>
												{material.tipo_contenido === "link" ? (
													<a
														href={material.contenido}
														target="_blank"
														rel="noopener noreferrer"
														style={{
															padding: "0.35rem 0.7rem",
															borderRadius: "10px",
															background: "rgba(0,0,0,0.35)",
															border: "1px solid rgba(255,255,255,0.12)",
															color: "#d4ffe5",
														}}
													>
														Abrir enlace
													</a>
												) : (
													<a
														href={downloadUrl(material.contenido)}
														target="_blank"
														rel="noopener noreferrer"
														style={{
															padding: "0.35rem 0.7rem",
															borderRadius: "10px",
															background: "rgba(0,0,0,0.35)",
															border: "1px solid rgba(255,255,255,0.12)",
															color: "#d4ffe5",
														}}
													>
														Descargar
													</a>
												)}
												{canManageCourse && (
													<button
														type="button"
														onClick={() => handleDetachMaterial(material)}
														style={{
															padding: "0.35rem 0.7rem",
															borderRadius: "10px",
															border: "1px solid rgba(255,82,82,0.32)",
															background: "rgba(255,82,82,0.12)",
															color: "#ffcdd2",
															cursor: "pointer",
														}}
													>
														Quitar
													</button>
												)}
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="materials-empty">
									No hay materiales asociados a la actividad.
									{canManageCourse && availableMaterials.length > 0 && (
										<>
											<br />
											<button
												type="button"
												className="btn-primary"
												onClick={() => setMaterialModalOpen(true)}
												style={{ marginTop: "0.8rem" }}
											>
												Asociar materiales
											</button>
										</>
									)}
								</div>
							)}
						</section>

						<section
							style={{
								background: "rgba(0,0,0,0.25)",
								borderRadius: "18px",
								padding: "1.5rem",
								border: "1px solid rgba(0,230,118,0.18)",
								display: "flex",
								flexDirection: "column",
								gap: "1rem",
							}}
						>
							<div style={{ display: "flex", justifyContent: "space-between" }}>
								<h2>Entregas</h2>
								{!isPrivileged && isActivityActive && !currentSubmission && (
										<button
											type="button"
											className="btn-primary btn-primary--loud"
											onClick={handleDelivery}
										>
											Registrar entrega
										</button>
									)}
							</div>

							{isPrivileged ? renderInstructorTable() : renderSubmissionCard()}
						</section>
					</div>
				</Main>
				<Footer />
			</div>

			{showDeliveryModal && (
				<DeliveryModal
					open={showDeliveryModal}
					onClose={() => setShowDeliveryModal(false)}
					activity={activity}
					existingSubmission={currentSubmission}
					onSubmit={handleSubmitDelivery}
				/>
			)}

			{showReviewModal && reviewTarget && (
				<ReviewModal
					open={showReviewModal}
					onClose={() => {
						setShowReviewModal(false);
						setReviewTarget(null);
					}}
					entrega={reviewTarget}
					actividad={activity}
					onSubmit={handleSubmitReview}
				/>
			)}

			{materialModalOpen && (
				<MaterialSelectorModal
					open={materialModalOpen}
					onClose={() => setMaterialModalOpen(false)}
					materials={availableMaterials}
					onConfirm={handleAttachMaterials}
					title="Selecciona los materiales que quieres asociar"
				/>
			)}
		</>
	);
};

export default ActivityDetail;


