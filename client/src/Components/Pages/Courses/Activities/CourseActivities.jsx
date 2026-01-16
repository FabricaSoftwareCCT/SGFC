/* eslint-disable react/prop-types */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import "sweetalert2/themes/bulma.css";
import "./Activities.css";
import { Header } from "../../../Layouts/Header/Header";
import { Main } from "../../../Layouts/Main/Main";
import { Footer } from "../../../Layouts/Footer/Footer";
import axiosInstance from "../../../../config/axiosInstance";
import { useUserSession } from "../../../../hooks/useUserSession";
import {
	createActivity,
	deleteActivity,
	getActivities,
	getCourseMaterials,
	registerDelivery,
	updateActivity,
} from "../../../../api/activitiesApi";
import { DeliveryModal } from "./ActivityDialogs";

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

const formatDateForInput = (value) => {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	const tzOffset = date.getTimezoneOffset() * 60000;
	const localISOTime = new Date(date.getTime() - tzOffset)
		.toISOString()
		.slice(0, 16);
	return localISOTime;
};

const formatRegisteredDate = (value) => {
	if (!value) {
		return null;
	}
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return null;
	}
	return date.toLocaleDateString("es-CO", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
};

const groupMaterialsByType = (materialsList) => {
	if (!Array.isArray(materialsList)) {
		return [];
	}

	const grouped = materialsList.reduce((accumulator, material) => {
		const rawType = material?.tipo_contenido ?? "OTROS";
		const normalizedType = String(rawType).trim().toUpperCase() || "OTROS";
		if (!accumulator[normalizedType]) {
			accumulator[normalizedType] = [];
		}
		accumulator[normalizedType].push(material);
		return accumulator;
	}, {});

	return Object.entries(grouped)
		.sort(([typeA], [typeB]) => typeA.localeCompare(typeB, "es"))
		.map(([type, items]) => ({
			type,
			items: items.slice().sort((itemA, itemB) => {
				const nameA = (itemA?.nombre_original || itemA?.contenido || "").toLowerCase();
				const nameB = (itemB?.nombre_original || itemB?.contenido || "").toLowerCase();
				return nameA.localeCompare(nameB, "es");
			}),
		}));
};

const getSubmissionLabel = (submission) => {
	if (!submission) {
		return "Sin entrega registrada";
	}
	const estado = submission.estado_revision || "pendiente";
	const fecha = submission.fecha_envio
		? formatDateTime(submission.fecha_envio)
		: "Fecha no disponible";
	return `${estado.charAt(0).toUpperCase() + estado.slice(1)} • ${fecha}`;
};

const getApiErrorMessage = (error, fallbackMessage) =>
	error?.response?.data?.message || error?.message || fallbackMessage;

const mapActivityToFormDefaults = (actividad) => {
	if (!actividad) {
		return null;
	}

	const materialIds = Array.isArray(actividad.materiales)
		? actividad.materiales.map((material) => material.ID)
		: [];

	return {
		ID: actividad.ID,
		titulo: actividad.titulo ?? "",
		descripcion: actividad.descripcion ?? "",
		fecha_limite: actividad.fecha_limite ?? null,
		porcentaje_aporte: actividad.porcentaje_aporte ?? "",
		materialIds,
	};
};

const ActivityFormModal = ({
	open,
	mode = "create",
	onClose,
	onSubmit,
	materials,
	isSubmitting,
	defaultValues = {},
}) => {
	const isEditMode = mode === "edit";
	const [title, setTitle] = useState(defaultValues.titulo ?? "");
	const [description, setDescription] = useState(
		defaultValues.descripcion ?? ""
	);
	const [dueDate, setDueDate] = useState(
		formatDateForInput(defaultValues.fecha_limite)
	);
	const [aporte, setAporte] = useState(
		defaultValues.porcentaje_aporte ?? ""
	);
	const [selectedIds, setSelectedIds] = useState(
		defaultValues.materialIds ?? []
	);

	useEffect(() => {
		if (open) {
			setTitle(defaultValues.titulo ?? "");
			setDescription(defaultValues.descripcion ?? "");
			setDueDate(formatDateForInput(defaultValues.fecha_limite));
			setAporte(
				defaultValues.porcentaje_aporte ?? defaultValues.porcentajeAporte ?? ""
			);
			setSelectedIds(defaultValues.materialIds ?? []);
		}
	}, [
		open,
		defaultValues?.titulo,
		defaultValues?.descripcion,
		defaultValues?.fecha_limite,
		defaultValues?.porcentaje_aporte,
		JSON.stringify(defaultValues?.materialIds ?? []),
	]);

	const materialsByType = useMemo(
		() => groupMaterialsByType(Array.isArray(materials) ? materials : []),
		[materials]
	);

	const totalMaterials = useMemo(
		() =>
			materialsByType.reduce(
				(accumulator, group) => accumulator + group.items.length,
				0
			),
		[materialsByType]
	);

	const selectedMaterialsCount = selectedIds.length;

	if (!open) return null;

	const toggleMaterial = (materialId) => {
		setSelectedIds((prev) =>
			prev.includes(materialId)
				? prev.filter((id) => id !== materialId)
				: [...prev, materialId]
		);
	};

	const handleSubmit = (event) => {
		event.preventDefault();
		onSubmit({
			titulo: title.trim(),
			descripcion: description.trim(),
			fechaLimite: dueDate ? new Date(dueDate).toISOString() : null,
			porcentajeAporte: aporte !== "" ? Number(aporte) : null,
			materialIds: selectedIds,
		});
	};

	return (
		<div className="modal-overlay" role="dialog" aria-modal="true">
			<form className="modal-card" onSubmit={handleSubmit}>
				<div className="modal-header">
					<div className="modal-title-block">
						<h2>{isEditMode ? "Editar actividad" : "Crear actividad"}</h2>
						{totalMaterials > 0 && (
							<span className="modal-header-meta">
								{selectedMaterialsCount} de {totalMaterials} materiales
								seleccionados
							</span>
						)}
					</div>
					<button type="button" className="modal-close" onClick={onClose}>
						×
					</button>
				</div>

				<div className="modal-body">
					<div className="form-field">
						<label>Título de la actividad *</label>
						<input
							type="text"
							value={title}
							onChange={(event) => setTitle(event.target.value)}
							placeholder="Ej: Taller de cierre"
							required
						/>
					</div>

					<div className="form-field">
						<label>Descripción</label>
						<textarea
							value={description}
							onChange={(event) => setDescription(event.target.value)}
							placeholder="Describe las instrucciones, criterios y alcance de la actividad."
						/>
					</div>

					<div className="form-field">
						<label>Fecha límite</label>
						<input
							type="datetime-local"
							value={dueDate}
							onChange={(event) => setDueDate(event.target.value)}
						/>
					</div>

					<div className="form-field">
						<label>Porcentaje aporte (opcional)</label>
						<input
							type="number"
							min="0"
							max="100"
							step="0.1"
							value={aporte}
							onChange={(event) => setAporte(event.target.value)}
							placeholder="Ej: 20"
						/>
					</div>

					<div className="form-field">
						<label>Materiales del curso</label>
						{totalMaterials > 0 && (
							<div className="materials-selection-summary">
								<span>
									<strong>{selectedMaterialsCount}</strong> seleccionados
								</span>
								<span>{totalMaterials} materiales disponibles</span>
							</div>
						)}
						{materialsByType.length === 0 ? (
							<div className="materials-empty">
								No hay materiales registrados. Puedes agregarlos en la sección
								de material de apoyo.
							</div>
						) : (
							<div className="materials-groups">
								{materialsByType.map(({ type, items }) => (
									<section className="materials-group" key={type}>
										<header className="materials-group-header">
											<span className="materials-group-title">{type}</span>
											<span className="materials-group-count">
												{items.length}{" "}
												{items.length === 1 ? "material" : "materiales"}
											</span>
										</header>
										<div className="materials-grid">
											{items.map((material) => {
												const isSelected = selectedIds.includes(material.ID);
												const formattedRegistered = formatRegisteredDate(
													material.createdAt ||
														material.created_at ||
														material.fecha_creacion ||
														null
												);
												const description =
													material.descripcion ||
													material.descripcion_material ||
													material.descripcionContenido ||
													material.detalle ||
													"";
												return (
													<label
														key={material.ID}
														className={`material-pill${
															isSelected ? " material-pill-selected" : ""
														}`}
													>
														<div className="material-pill-top">
															<span className="material-pill-title">
																{material.nombre_original ||
																	material.contenido ||
																	"Sin nombre"}
															</span>
															<span className="material-pill-checkbox-visual">
																<input
																	className="material-pill-checkbox"
																	type="checkbox"
																	checked={isSelected}
																	onChange={() => toggleMaterial(material.ID)}
																	aria-label={`Seleccionar ${material.nombre_original || material.contenido || "material"}`}
																/>
																<span
																	className="material-pill-checkbox-indicator"
																	aria-hidden="true"
																/>
															</span>
														</div>
														<div className="material-pill-meta">
															<span className="material-pill-meta-type">{type}</span>
															{formattedRegistered && (
																<span className="material-pill-meta-date">
																	Registrado el {formattedRegistered}
																</span>
															)}
														</div>
														{description && (
															<p className="material-pill-description">
																{description}
															</p>
														)}
													</label>
												);
											})}
										</div>
									</section>
								))}
							</div>
						)}
					</div>
				</div>

				<div className="modal-footer">
					<button type="button" className="btn-muted" onClick={onClose}>
						Cancelar
					</button>
					<button type="submit" className="btn-cta" disabled={isSubmitting}>
						{isSubmitting
							? "Guardando..."
							: isEditMode
								? "Guardar cambios"
								: "Crear actividad"}
					</button>
				</div>
			</form>
		</div>
	);
};

const ActivityCard = ({
	actividad,
	isPrivileged,
	canManageCourse,
	onView,
	onToggleState,
	onDeliver,
	onEdit,
	onDelete,
	userId,
}) => {
	const submission = useMemo(() => {
		if (!Array.isArray(actividad?.entregas)) return null;
		if (isPrivileged) return null;
		return actividad.entregas.find(
			(ent) => Number(ent.aprendiz_ID) === Number(userId)
		);
	}, [actividad, isPrivileged, userId]);

	const entregarDisabled =
		actividad?.estado === "cerrada" ||
		(!isPrivileged && submission && submission.estado_revision === "aprobada");

	return (
		<div className="activity-card">
			<div className="activity-header">
				<div className="activity-title">{actividad.titulo}</div>
				<div className={`activity-status-chip ${actividad.estado}`}>
					{actividad.estado === "activa" ? "Activa" : "Cerrada"}
				</div>
			</div>

			<p className="activity-desc">{actividad.descripcion || "Sin descripción"}</p>

			<div className="activity-meta">
				<div className="meta-item">
					<span>Fecha publicación</span>
					<strong>{formatDateTime(actividad.fecha_publicacion)}</strong>
				</div>
				<div className="meta-item">
					<span>Fecha límite</span>
					<strong>{formatDateTime(actividad.fecha_limite)}</strong>
				</div>
				{actividad.porcentaje_aporte !== null &&
					actividad.porcentaje_aporte !== undefined && (
						<div className="meta-item">
							<span>Aporte</span>
							<strong>{actividad.porcentaje_aporte}%</strong>
						</div>
					)}
			</div>

			{!isPrivileged && (
				<div
					className={`submission-badge ${
						(submission?.estado_revision || "pendiente").toLowerCase()
					}`}
				>
					{getSubmissionLabel(submission)}
				</div>
			)}

			<div className="activity-actions">
				<button type="button" className="btn-outline" onClick={onView}>
					Ver detalle
				</button>
				{canManageCourse ? (
					<>
						<button type="button" className="btn-link" onClick={onEdit}>
							Editar
						</button>
						<button
							type="button"
							className="btn-link btn-danger"
							onClick={onDelete}
						>
							Eliminar
						</button>
						<button
							type="button"
							className="btn-link"
							onClick={onToggleState}
						>
							{actividad.estado === "activa" ? "Cerrar actividad" : "Reabrir"}
						</button>
					</>
				) : !isPrivileged ? (
					<button
						type="button"
						className="btn-link"
						onClick={onDeliver}
						disabled={entregarDisabled}
						style={entregarDisabled ? { opacity: 0.5, cursor: "not-allowed" } : {}}
					>
						{submission ? "Actualizar entrega" : "Enviar entrega"}
					</button>
				) : (
					<span className="activity-hint">
						Solo el instructor asignado o un gestor puede gestionar esta actividad.
					</span>
				)}
			</div>
		</div>
	);
};

export const CourseActivities = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const { isPrivileged, userId, accountType } = useUserSession();

	const [course, setCourse] = useState(null);
	const [activities, setActivities] = useState([]);
	const [materials, setMaterials] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const [activityFormState, setActivityFormState] = useState({
		open: false,
		mode: "create",
		defaults: null,
	});
	const [showDeliveryModal, setShowDeliveryModal] = useState(false);
	const [selectedActivity, setSelectedActivity] = useState(null);
	const [isSaving, setIsSaving] = useState(false);

	const loadData = async () => {
		setLoading(true);
		setError(null);
		try {
			const [courseResp, actividadesResp, materialesResp] = await Promise.all([
				axiosInstance.get(`/api/courses/cursos/${id}`),
				getActivities(id),
				getCourseMaterials(id),
			]);

			setCourse(courseResp.data);
			setActivities(Array.isArray(actividadesResp) ? actividadesResp : []);
			setMaterials(Array.isArray(materialesResp) ? materialesResp : []);
		} catch (err) {
			// console.error("Error al cargar datos de actividades:", err);
			setError(
				err?.message ||
					"No se pudieron cargar las actividades del curso. Intenta nuevamente."
			);
			await Swal.fire({
				...swalConfig,
				icon: "error",
				title: "Error",
				text:
					err?.message ||
					"Ocurrió un error al cargar la información de las actividades.",
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, [id]);

	const orderedActivities = useMemo(() => {
		const list = Array.isArray(activities) ? [...activities] : [];
		return list.sort((a, b) => {
			const dateA = new Date(a.fecha_publicacion || a.created_at || 0).getTime();
			const dateB = new Date(b.fecha_publicacion || b.created_at || 0).getTime();
			return dateB - dateA;
		});
	}, [activities]);

	const [isInstructorAssigned, setIsInstructorAssigned] = useState(false);

	const refreshInstructorAssignment = useCallback(async () => {
		if (accountType !== "instructor" || !userId) {
			setIsInstructorAssigned(false);
			return;
		}

		try {
			const response = await axiosInstance.get(
				`/api/courses/cursos-asignados/${userId}`
			);
			const assignments = Array.isArray(response.data) ? response.data : [];
			const currentCourseId = Number(id);

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
					assignedCourseId === currentCourseId
				);
			});

			setIsInstructorAssigned(assigned);
		} catch (error) {
			// console.error("Error al obtener cursos asignados:", error);
			setIsInstructorAssigned(false);
		}
	}, [accountType, userId, id]);

	useEffect(() => {
		if (accountType === "instructor" && userId) {
			void refreshInstructorAssignment();
		} else {
			setIsInstructorAssigned(false);
		}
	}, [accountType, userId, refreshInstructorAssignment]);

	const canManageCourse = useMemo(() => {
		if (accountType === "administrador" || accountType === "gestor") {
			return true;
		}
		if (accountType === "instructor") {
			return isInstructorAssigned;
		}
		return false;
	}, [accountType, isInstructorAssigned]);

	const closeActivityForm = () =>
		setActivityFormState((previous) => ({
			...previous,
			open: false,
			defaults: null,
			mode: "create",
		}));

	const notifyManageRestriction = () => {
		void Swal.fire({
			...swalConfig,
			icon: "info",
			title: "Sin permisos",
			text: "Solo el instructor asignado o un administrador/gestor puede realizar esta acción.",
		});
	};

	const openCreateActivityForm = () => {
		if (!canManageCourse) {
			notifyManageRestriction();
			return;
		}
		setActivityFormState({
			open: true,
			mode: "create",
			defaults: null,
		});
	};

	const openEditActivityForm = (actividad) => {
		if (!canManageCourse) {
			notifyManageRestriction();
			return;
		}
		setActivityFormState({
			open: true,
			mode: "edit",
			defaults: mapActivityToFormDefaults(actividad),
		});
	};

	const handleActivityFormSubmit = async (payload) => {
		if (!canManageCourse) {
			notifyManageRestriction();
			closeActivityForm();
			return;
		}

		const normalizedPayload = {
			...payload,
			materialIds: Array.isArray(payload.materialIds) ? payload.materialIds : [],
		};

		const isEditMode =
			activityFormState.mode === "edit" && activityFormState.defaults?.ID;
		const successTitle = isEditMode ? "Actividad actualizada" : "Actividad creada";
		const successText = isEditMode
			? "Los cambios se guardaron correctamente."
			: "La actividad se creó correctamente.";
		const errorFallback = isEditMode
			? "No se pudo actualizar la actividad. Verifica la información e intenta nuevamente."
			: "No se pudo crear la actividad. Verifica la información e intenta nuevamente.";

		try {
			setIsSaving(true);
			if (isEditMode) {
				await updateActivity(activityFormState.defaults.ID, normalizedPayload);
			} else {
				await createActivity(id, normalizedPayload);
			}

			await Swal.fire({
				...swalConfig,
				icon: "success",
				title: successTitle,
				text: successText,
			});
			closeActivityForm();
			await loadData();
		} catch (error) {
			// console.error("Error al guardar actividad:", error);
			await Swal.fire({
				...swalConfig,
				icon: "error",
				title: "Error",
				text: getApiErrorMessage(error, errorFallback),
			});
		} finally {
			setIsSaving(false);
		}
	};

	const handleDeleteActivity = async (actividad) => {
		if (!canManageCourse) {
			notifyManageRestriction();
			return;
		}
		try {
			const result = await Swal.fire({
				...swalConfig,
				icon: "warning",
				title: "Eliminar actividad",
				text: "Esta acción no se puede deshacer. ¿Deseas continuar?",
				showCancelButton: true,
				confirmButtonText: "Eliminar",
			});

			if (!result.isConfirmed) {
				return;
			}

			await deleteActivity(actividad.ID);
			await Swal.fire({
				...swalConfig,
				icon: "success",
				title: "Actividad eliminada",
				text: "La actividad se eliminó correctamente.",
			});
			await loadData();
		} catch (error) {
			// console.error("Error al eliminar actividad:", error);
			await Swal.fire({
				...swalConfig,
				icon: "error",
				title: "Error",
				text: getApiErrorMessage(
					error,
					"No se pudo eliminar la actividad. Intenta nuevamente."
				),
			});
		}
	};

	const handleToggleEstado = async (actividad) => {
		if (!canManageCourse) {
			notifyManageRestriction();
			return;
		}
		const nuevoEstado = actividad.estado === "activa" ? "cerrada" : "activa";
		try {
			const result = await Swal.fire({
				...swalConfig,
				icon: "question",
				title: nuevoEstado === "cerrada" ? "Cerrar actividad" : "Reabrir actividad",
				text:
					nuevoEstado === "cerrada"
						? "No se recibirán más entregas después de cerrarla. ¿Deseas continuar?"
						: "La actividad volverá a estar disponible para recibir entregas.",
				showCancelButton: true,
			});

			if (!result.isConfirmed) return;

			await updateActivity(actividad.ID, { estado: nuevoEstado });
			await loadData();
			await Swal.fire({
				...swalConfig,
				icon: "success",
				title: "Estado actualizado",
				text:
					nuevoEstado === "cerrada"
						? "La actividad se cerró correctamente."
						: "La actividad se reabrió correctamente.",
			});
		} catch (error) {
			// console.error("Error al actualizar estado:", error);
			await Swal.fire({
				...swalConfig,
				icon: "error",
				title: "Error",
				text: getApiErrorMessage(
					error,
					"No se pudo actualizar el estado de la actividad. Intenta nuevamente."
				),
			});
		}
	};

	const handleOpenDelivery = (activity) => {
		setSelectedActivity(activity);
		setShowDeliveryModal(true);
	};

	const handleSubmitDelivery = async ({ file, comment }) => {
		if (!selectedActivity) return;

		const formData = new FormData();
		if (file) {
			formData.append("archivo_entrega", file);
		}
		if (comment) {
			formData.append("comentario", comment);
		}

		await registerDelivery(selectedActivity.ID, formData);
		await Swal.fire({
			...swalConfig,
			icon: "success",
			title: "Entrega registrada",
			text: "Tu entrega se registró correctamente.",
		});
		setShowDeliveryModal(false);
		setSelectedActivity(null);
		await loadData();
	};

	const actividadesActivas = orderedActivities.filter(
		(act) => act.estado === "activa"
	);
	const actividadesCerradas = orderedActivities.filter(
		(act) => act.estado === "cerrada"
	);

	return (
		<>
			<Header />
			<div className="activities-wrapper">
				<Main>
					<div className="activities-main">
						<div className="activities-header">
							<div className="activities-header-top">
								<h1>
									Gestión de actividades
									<span>
										{course?.nombre_curso
											? `Curso: ${course.nombre_curso}`
											: "Selecciona una actividad para ver el detalle"}
									</span>
								</h1>

								<div className="activities-actions">
									<button
										type="button"
										className="btn-secondary"
										onClick={() => navigate(`/Cursos/${id}`)}
									>
										Volver al curso
									</button>
									{canManageCourse && (
										<button
											type="button"
											className="btn-primary"
											onClick={openCreateActivityForm}
										>
											Nueva actividad
										</button>
									)}
								</div>
							</div>

							<div className="course-summary">
								<div className="summary-card">
									<label>Activas</label>
									<span>{actividadesActivas.length}</span>
								</div>
								<div className="summary-card">
									<label>Cerradas</label>
									<span>{actividadesCerradas.length}</span>
								</div>
								<div className="summary-card">
									<label>Total</label>
									<span>{orderedActivities.length}</span>
								</div>
							</div>
						</div>

						{loading ? (
							<div className="activities-loading">Cargando actividades...</div>
						) : error ? (
							<div className="empty-state">
								<strong>Ocurrió un error.</strong>
								<span>{error}</span>
								<button
									type="button"
									className="btn-primary"
									onClick={loadData}
									style={{ marginTop: "0.8rem" }}
								>
									Reintentar
								</button>
							</div>
						) : orderedActivities.length === 0 ? (
							<div className="empty-state">
								<strong>No hay actividades registradas.</strong>
								{isPrivileged ? (
									<span>
										Comienza creando la primera actividad para este curso y asocia
										el material de apoyo existente.
									</span>
								) : (
									<span>
										El instructor aún no ha publicado actividades. Te notificaremos
										cuando haya novedades.
									</span>
								)}
							</div>
						) : (
							<>
								{actividadesActivas.length > 0 && (
									<section>
										<h2 style={{ marginBottom: "0.9rem" }}>Actividades activas</h2>
										<div className="activities-grid">
											{actividadesActivas.map((actividad) => (
												<ActivityCard
													key={actividad.ID}
													actividad={actividad}
													isPrivileged={isPrivileged}
													canManageCourse={canManageCourse}
													userId={userId}
													onView={() =>
														navigate(`/Cursos/${id}/actividades/${actividad.ID}`)
													}
													onToggleState={() => handleToggleEstado(actividad)}
													onDeliver={() => handleOpenDelivery(actividad)}
													onEdit={() => openEditActivityForm(actividad)}
													onDelete={() => handleDeleteActivity(actividad)}
												/>
											))}
										</div>
									</section>
								)}

								{actividadesCerradas.length > 0 && (
									<section>
										<h2 style={{ margin: "2rem 0 0.9rem" }}>Actividades cerradas</h2>
										<div className="activities-grid">
											{actividadesCerradas.map((actividad) => (
												<ActivityCard
													key={actividad.ID}
													actividad={actividad}
													isPrivileged={isPrivileged}
													canManageCourse={canManageCourse}
													userId={userId}
													onView={() =>
														navigate(`/Cursos/${id}/actividades/${actividad.ID}`)
													}
													onToggleState={() => handleToggleEstado(actividad)}
													onDeliver={() => handleOpenDelivery(actividad)}
													onEdit={() => openEditActivityForm(actividad)}
													onDelete={() => handleDeleteActivity(actividad)}
												/>
											))}
										</div>
									</section>
								)}
							</>
						)}
					</div>
				</Main>
				<Footer />
			</div>

			{activityFormState.open && (
				<ActivityFormModal
					open={activityFormState.open}
					mode={activityFormState.mode}
					onClose={closeActivityForm}
					onSubmit={handleActivityFormSubmit}
					materials={materials}
					isSubmitting={isSaving}
					defaultValues={activityFormState.defaults || {}}
				/>
			)}

			{showDeliveryModal && selectedActivity && (
				<DeliveryModal
					open={showDeliveryModal}
					onClose={() => {
						setShowDeliveryModal(false);
						setSelectedActivity(null);
					}}
					activity={selectedActivity}
					existingSubmission={
						selectedActivity.entregas?.find(
							(ent) => Number(ent.aprendiz_ID) === Number(userId)
						) || null
					}
					onSubmit={handleSubmitDelivery}
				/>
			)}
		</>
	);
};

export default CourseActivities;


