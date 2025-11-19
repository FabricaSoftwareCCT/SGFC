import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/themes/bulma.css";
import "./Activities.css";

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

const groupMaterialsByType = (materialsList) => {
	if (!Array.isArray(materialsList)) {
		return [];
	}

	const groups = materialsList.reduce((accumulator, material) => {
		const rawType = material?.tipo_contenido ?? "OTROS";
		const normalizedType = String(rawType).trim().toUpperCase() || "OTROS";
		if (!accumulator[normalizedType]) {
			accumulator[normalizedType] = [];
		}
		accumulator[normalizedType].push(material);
		return accumulator;
	}, {});

	return Object.entries(groups)
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

const formatDateTime = (value) => {
	if (!value) {
		return "Sin definir";
	}
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return "Sin definir";
	}
	return date.toLocaleString("es-CO", {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
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

export const DeliveryModal = ({
	open,
	onClose,
	onSubmit,
	activity,
	existingSubmission,
}) => {
	const [file, setFile] = useState(null);
	const [comment, setComment] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (!open) {
			return;
		}
		setComment(existingSubmission?.comentario ?? "");
		setFile(null);
	}, [existingSubmission, open]);

	if (!open) {
		return null;
	}

	const handleSubmit = async (event) => {
		event.preventDefault();

		if (!file && !existingSubmission?.archivo_ruta) {
			await Swal.fire({
				...swalConfig,
				icon: "warning",
				title: "Archivo requerido",
				text: "Selecciona un archivo para enviar la actividad.",
			});
			return;
		}

		try {
			setIsSubmitting(true);
			await onSubmit({ file, comment });
			setFile(null);
			setComment("");
		} catch (error) {
			await Swal.fire({
				...swalConfig,
				icon: "error",
				title: "Error",
				text:
					error?.message ||
					"Ocurrió un error al registrar la entrega. Intenta nuevamente.",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleOverlayClick = (event) => {
		if (event.target === event.currentTarget && !isSubmitting) {
			onClose();
		}
	};

	return (
		<div
			className="modal-overlay"
			role="dialog"
			aria-modal="true"
			onMouseDown={handleOverlayClick}
		>
			<form
				className="modal-card"
				onSubmit={handleSubmit}
				onMouseDown={(event) => event.stopPropagation()}
			>
				<div className="modal-header">
					<div className="modal-title-block">
						<h2>{existingSubmission ? "Actualizar entrega" : "Enviar entrega"}</h2>
					</div>
					<button
						type="button"
						className="modal-close"
						onClick={() => {
							if (!isSubmitting) {
								onClose();
							}
						}}
					>
						×
					</button>
				</div>

				<div className="modal-body">
					<div className="form-field">
						<label>Actividad</label>
						<span>{activity?.titulo ?? "Actividad sin título"}</span>
						<small className="form-field-helper">
							Fecha límite: {formatDateTime(activity?.fecha_limite)}
						</small>
					</div>

					<div className="form-field">
						<label>Archivo de entrega</label>
						<label className="file-input">
							<input
								type="file"
								name="archivo_entrega"
								onChange={(event) => setFile(event.target.files?.[0] ?? null)}
								disabled={isSubmitting}
							/>
							<span className="file-name">
								{file
									? file.name
									: existingSubmission?.nombre_archivo
									? `Archivo actual: ${existingSubmission.nombre_archivo}`
									: "Selecciona un archivo desde tu equipo"}
							</span>
						</label>
					</div>

					<div className="form-field">
						<label>Comentario para el instructor (opcional)</label>
						<textarea
							placeholder="Añade notas relevantes a tu entrega..."
							value={comment}
							onChange={(event) => setComment(event.target.value)}
							rows={3}
							disabled={isSubmitting}
						/>
					</div>
				</div>

				<div className="modal-footer">
					<button
						type="button"
						className="btn-muted"
						onClick={() => {
							if (!isSubmitting) {
								onClose();
							}
						}}
					>
						Cancelar
					</button>
					<button
						type="submit"
						className="btn-cta"
						disabled={isSubmitting}
					>
						{isSubmitting ? "Enviando..." : "Guardar entrega"}
					</button>
				</div>
			</form>
		</div>
	);
};

export const ReviewModal = ({
	open,
	onClose,
	onSubmit,
	entrega,
	actividad,
}) => {
	const [estado, setEstado] = useState(entrega?.estado_revision ?? "pendiente");
	const [retro, setRetro] = useState(entrega?.retroalimentacion ?? "");
	const [file, setFile] = useState(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (!open) {
			return;
		}
		setEstado(entrega?.estado_revision ?? "pendiente");
		setRetro(entrega?.retroalimentacion ?? "");
		setFile(null);
	}, [entrega, open]);

	if (!open) {
		return null;
	}

	const handleSubmit = async (event) => {
		event.preventDefault();
		try {
			setIsSubmitting(true);
			await onSubmit({
				estado,
				retroalimentacion: retro,
				file,
			});
			setFile(null);
		} catch (error) {
			await Swal.fire({
				...swalConfig,
				icon: "error",
				title: "Error",
				text:
					error?.message ||
					"No se pudo registrar la retroalimentación. Intenta nuevamente.",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleOverlayClick = (event) => {
		if (event.target === event.currentTarget && !isSubmitting) {
			onClose();
		}
	};

	return (
		<div
			className="modal-overlay"
			role="dialog"
			aria-modal="true"
			onMouseDown={handleOverlayClick}
		>
			<form
				className="modal-card"
				onSubmit={handleSubmit}
				onMouseDown={(event) => event.stopPropagation()}
			>
				<div className="modal-header">
					<div className="modal-title-block">
						<h2>Revisar entrega</h2>
					</div>
					<button
						type="button"
						className="modal-close"
						onClick={() => {
							if (!isSubmitting) {
								onClose();
							}
						}}
					>
						×
					</button>
				</div>

				<div className="modal-body">
					<div className="form-field">
						<label>Aprendiz</label>
						<span>
							{entrega?.aprendiz
								? `${entrega.aprendiz.nombres} ${entrega.aprendiz.apellidos}`
								: "Aprendiz"}
						</span>
						<small className="form-field-helper">
							Actividad: {actividad?.titulo ?? "Sin título"}
						</small>
					</div>

					<div className="form-field">
						<label>Estado de la revisión</label>
						<select
							value={estado}
							onChange={(event) => setEstado(event.target.value)}
							disabled={isSubmitting}
						>
							<option value="pendiente">Pendiente</option>
							<option value="aprobada">Aprobada</option>
							<option value="rechazada">Rechazada</option>
						</select>
					</div>

					<div className="form-field">
						<label>Retroalimentación</label>
						<textarea
							rows={4}
							value={retro}
							onChange={(event) => setRetro(event.target.value)}
							placeholder="Escribe comentarios y observaciones para el aprendiz..."
							disabled={isSubmitting}
						/>
					</div>

					<div className="form-field">
						<label>Adjuntar archivo (opcional)</label>
						<label className="file-input">
							<input
								type="file"
								name="archivo_retroalimentacion"
								onChange={(event) => setFile(event.target.files?.[0] ?? null)}
								disabled={isSubmitting}
							/>
							<span className="file-name">
								{file
									? file.name
									: entrega?.retro_archivo_ruta
									? "Actualmente existe un adjunto cargado."
									: "Selecciona un archivo de soporte"}
							</span>
						</label>
					</div>
				</div>

				<div className="modal-footer">
					<button
						type="button"
						className="btn-muted"
						onClick={() => {
							if (!isSubmitting) {
								onClose();
							}
						}}
					>
						Cancelar
					</button>
					<button
						type="submit"
						className="btn-cta"
						disabled={isSubmitting}
					>
						{isSubmitting ? "Guardando..." : "Guardar revisión"}
					</button>
				</div>
			</form>
		</div>
	);
};

export const MaterialSelectorModal = ({
	open,
	onClose,
	materials,
	selectedIds = [],
	onConfirm,
	title = "Selecciona los materiales que quieres asociar",
}) => {
	const [internalSelection, setInternalSelection] = useState(
		() => new Set(Array.isArray(selectedIds) ? selectedIds : [])
	);

	const serializedSelection = useMemo(
		() => JSON.stringify(Array.isArray(selectedIds) ? selectedIds : []),
		[selectedIds]
	);

	useEffect(() => {
		if (!open) {
			return;
		}
		try {
			const parsed = JSON.parse(serializedSelection);
			setInternalSelection(new Set(parsed));
		} catch (error) {
			setInternalSelection(new Set());
		}
	}, [open, serializedSelection]);

	const toggleMaterial = (materialId) => {
		setInternalSelection((previous) => {
			const next = new Set(previous);
			if (next.has(materialId)) {
				next.delete(materialId);
			} else {
				next.add(materialId);
			}
			return next;
		});
	};

	const groupedMaterials = useMemo(
		() => groupMaterialsByType(Array.isArray(materials) ? materials : []),
		[materials]
	);

	const totalMaterials = useMemo(
		() =>
			groupedMaterials.reduce(
				(accumulator, group) => accumulator + group.items.length,
				0
			),
		[groupedMaterials]
	);

	if (!open) {
		return null;
	}

	return (
		<div
			className="modal-overlay"
			role="dialog"
			aria-modal="true"
			onMouseDown={(event) => {
				if (event.target === event.currentTarget) {
					onClose();
				}
			}}
		>
			<div
				className="modal-card modal-card-materials"
				onMouseDown={(event) => event.stopPropagation()}
			>
				<div className="modal-header">
					<div className="modal-title-block">
						<h2>{title}</h2>
						{totalMaterials > 0 && (
							<span className="modal-header-meta">
								{internalSelection.size} de {totalMaterials} materiales
								seleccionados
							</span>
						)}
					</div>
					<button type="button" className="modal-close" onClick={onClose}>
						×
					</button>
				</div>

				<div className="modal-body materials-body">
					{totalMaterials > 0 && (
						<div className="materials-selection-summary">
							<span>
								<strong>{internalSelection.size}</strong> seleccionados
							</span>
							<span>{totalMaterials} materiales disponibles</span>
						</div>
					)}
					{groupedMaterials.length === 0 ? (
						<div className="materials-empty">
							No hay materiales disponibles en este curso. Agrega nuevos desde
							la sección de material de apoyo.
						</div>
					) : (
						<div className="materials-groups">
							{groupedMaterials.map(({ type, items }) => (
								<section key={type} className="materials-group">
									<header className="materials-group-header">
										<span className="materials-group-title">{type}</span>
										<span className="materials-group-count">
											{items.length} {items.length === 1 ? "material" : "materiales"}
										</span>
									</header>
									<div className="materials-grid">
										{items.map((material) => {
											const isSelected = internalSelection.has(material.ID);
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
														<p className="material-pill-description">{description}</p>
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

				<div className="modal-footer">
					<button type="button" className="btn-muted" onClick={onClose}>
						Cancelar
					</button>
					<button
						type="button"
						className="btn-cta"
						onClick={() => onConfirm(Array.from(internalSelection))}
					>
						Guardar selección
					</button>
				</div>
			</div>
		</div>
	);
};


