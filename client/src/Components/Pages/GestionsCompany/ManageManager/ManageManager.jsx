import React, { useState } from "react";
import "./ManageManager.css";
import fotoPerfilDefect from "../../../../assets/Icons/userDefect.png";
import axiosInstance from "../../../../config/axiosInstance";
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faUser, faIdCard, faPhone, faEnvelope, faCamera, faBuilding } from '@fortawesome/free-solid-svg-icons';

export const ManageManager = ({ data, isAdmin, onClose, update }) => {
	const [manager, setManager] = useState(data);
	const [isEditing, setIsEditing] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!isEditing) {
			setIsEditing(true);
			return;
		}

		if (manager === data) return;
		
		try {
			const resp = await axiosInstance.put(`/api/users/perfil/actualizar/${manager.ID}`, {
				email: manager.email,
				nombres: manager.nombres,
				apellidos: manager.apellidos,
				celular: manager.celular,
				documento: manager.documento,
				estado: manager.estado
			});

			if (resp?.status >= 200 && resp?.status < 300) {
				Swal.fire({
					icon: 'success',
					title: 'Manager actualizado',
					text: resp?.data?.message || 'Se ha actualizado el manager',
					theme: "bulma",
					confirmButtonText: 'Aceptar',
					confirmButtonColor: '#00843d',
					customClass: {
						confirmButton: 'centered-swal-button'
					}
				});
			} else {
				Swal.fire({
					icon: 'error',
					title: 'Error',
					text: 'No se pudo actualizar el manager',
					confirmButtonText: 'Aceptar',
					confirmButtonColor: '#d33',
					theme: "bulma",
					customClass: { confirmButton: 'centered-swal-button' }
				});
				return;
			}

			if (data.foto_perfil !== manager.foto_perfil) {
				const body = new FormData();
				body.append("foto_perfil", manager.foto_perfil);
				await axiosInstance.put(`/api/users/perfil/actualizar/${manager.ID}`, body, {
					headers: { "Content-Type": "multipart/form-data" },
				});
			}

			onClose();
			update();
		} catch (error) {
			console.log(error);
			Swal.fire({
				icon: 'error',
				title: 'Error',
				text: 'Ocurrió un error al actualizar el manager',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#d33',
				theme: "bulma",
				customClass: { confirmButton: 'centered-swal-button' }
			});
		}
	};

	const getImageSrc = (data) => {
		if (!data) return fotoPerfilDefect;
		if (data instanceof File) return URL.createObjectURL(data);
		if (typeof data === "string") {
			if (data.startsWith('data:') || data.startsWith('http')) return data;
			if (/(\.png|\.jpg|\.jpeg|\.gif)$/i.test(data)) return fotoPerfilDefect;
			if (data.startsWith('iVBOR')) return `data:image/png;base64,${data}`;
			if (data.startsWith('/9j/')) return `data:image/jpeg;base64,${data}`;
			if (data.length < 100) return fotoPerfilDefect;
			return `data:image/jpeg;base64,${data}`;
		}
		return fotoPerfilDefect;
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setManager(prev => ({ ...prev, [name]: value }));
	};

	const handleImageChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			setManager(prev => ({
				...prev,
				foto_perfil: file,
			}));
		}
	};

	const handleEstadoChange = (estado) => {
		setManager(prev => ({ ...prev, estado: estado.toLowerCase() }));
	};

	const closeModalManager = () => {
		if (onClose) onClose();
	};

	return (
		<div id="modal-overlayManageManager" className="modal-overlay-manager">
			<div className="modal-container-manager">
				<div className="modal-header-manager">
					<div className="header-content-manager">
						<h2>
							<FontAwesomeIcon icon={faUser} className="header-icon-manager" />
							Perfil del Manager
						</h2>
						<button 
							type="button" 
							onClick={closeModalManager}
							className="close-btn-manager"
						>
							<FontAwesomeIcon icon={faArrowLeft} />
							<span>Volver</span>
						</button>
					</div>
				</div>

				<form className="modal-body-manager" onSubmit={handleSubmit}>
					<div className="modal-content-manager">
						{/* Columna izquierda - Información */}
						<div className="info-column-manager">
							<div className="form-section-manager">
								<h3 className="section-title-manager">Información Personal</h3>
								<div className="form-grid-manager">
									<div className="input-group-manager">
										<label className="input-label-manager">
											<FontAwesomeIcon icon={faBuilding} />
											Empresa
										</label>
										<div className="display-field-manager">
											{manager.Empresa?.nombre_empresa || "No especificado"}
										</div>
									</div>

									<div className="input-group-manager">
										<label className="input-label-manager">
											<FontAwesomeIcon icon={faUser} />
											Nombres
										</label>
										{isEditing ? (
											<input
												type="text"
												name="nombres"
												value={manager.nombres || ""}
												onChange={handleChange}
												className="input-field-manager"
												placeholder="Ingrese los nombres"
											/>
										) : (
											<div className="display-field-manager">
												{manager.nombres || "No especificado"}
											</div>
										)}
									</div>

									<div className="input-group-manager">
										<label className="input-label-manager">
											<FontAwesomeIcon icon={faUser} />
											Apellidos
										</label>
										{isEditing ? (
											<input
												type="text"
												name="apellidos"
												value={manager.apellidos || ""}
												onChange={handleChange}
												className="input-field-manager"
												placeholder="Ingrese los apellidos"
											/>
										) : (
											<div className="display-field-manager">
												{manager.apellidos || "No especificado"}
											</div>
										)}
									</div>

									<div className="input-group-manager">
										<label className="input-label-manager">
											<FontAwesomeIcon icon={faIdCard} />
											Documento
										</label>
										{isEditing ? (
											<input
												type="text"
												name="documento"
												value={manager.documento || ""}
												onChange={handleChange}
												className="input-field-manager"
												placeholder="Ingrese el documento"
											/>
										) : (
											<div className="display-field-manager">
												{manager.documento || "No especificado"}
											</div>
										)}
									</div>

									<div className="input-group-manager">
										<label className="input-label-manager">
											<FontAwesomeIcon icon={faPhone} />
											Celular
										</label>
										{isEditing ? (
											<input
												type="text"
												name="celular"
												value={manager.celular || ""}
												onChange={handleChange}
												className="input-field-manager"
												placeholder="Ingrese el celular"
											/>
										) : (
											<div className="display-field-manager">
												{manager.celular || "No especificado"}
											</div>
										)}
									</div>

									<div className="input-group-manager">
										<label className="input-label-manager">
											<FontAwesomeIcon icon={faEnvelope} />
											Email
										</label>
										{isEditing ? (
											<input
												type="email"
												name="email"
												value={manager.email || ""}
												onChange={handleChange}
												className="input-field-manager"
												placeholder="Ingrese el email"
											/>
										) : (
											<div className="display-field-manager">
												{manager.email || "No especificado"}
											</div>
										)}
									</div>

									<div className="input-group-manager">
										<label className="input-label-manager">Estado</label>
										{isEditing ? (
											<div className="status-buttons-manager">
												{["Activo", "Inactivo"].map((estado) => {
													const isSelected = (manager.estado || "").toLowerCase() === estado.toLowerCase();
													return (
														<button
															key={estado}
															type="button"
															className={`status-btn-manager ${isSelected ? "active" : ""}`}
															onClick={() => handleEstadoChange(estado)}
														>
															<span className="status-dot-manager"></span>
															{estado}
														</button>
													);
												})}
											</div>
										) : (
											<div className={`status-display-manager ${manager.estado?.toLowerCase()}`}>
												<span className="status-dot-manager"></span>
												{manager.estado || "No especificado"}
											</div>
										)}
									</div>
								</div>
							</div>
						</div>

						{/* Columna derecha - Imagen */}
						<div className="image-column-manager">
							<div className="image-section-manager">
								<div className="image-container-manager">
									{isEditing && isAdmin ? (
										<>
											<input
												type="file"
												accept="image/*"
												onChange={handleImageChange}
												id="imageUploadManager"
												className="file-input-manager"
											/>
											<label
												className="image-upload-manager editable"
												htmlFor="imageUploadManager"
											>
												{manager.foto_perfil instanceof File ? (
													<img
														src={URL.createObjectURL(manager.foto_perfil)}
														alt="Vista previa"
														className="profile-image-manager"
														onError={(e) => {
															e.target.src = fotoPerfilDefect;
														}}
													/>
												) : manager.foto_perfil ? (
													<img
														src={getImageSrc(manager.foto_perfil)}
														alt="Foto de perfil"
														className="profile-image-manager"
														onError={(e) => {
															e.target.src = fotoPerfilDefect;
														}}
													/>
												) : (
													<div className="image-placeholder-manager">
														<FontAwesomeIcon icon={faCamera} className="placeholder-icon-manager" />
														<span>Haz clic para subir imagen</span>
													</div>
												)}
												<div className="upload-overlay-manager">
													<FontAwesomeIcon icon={faCamera} />
													<span>Cambiar imagen</span>
												</div>
											</label>
										</>
									) : (
										<div className="image-display-manager">
											{manager.foto_perfil ? (
												<img
													src={getImageSrc(manager.foto_perfil)}
													alt="Foto de perfil"
													className="profile-image-manager"
													onError={(e) => {
														e.target.src = fotoPerfilDefect;
													}}
												/>
											) : (
												<div className="image-placeholder-manager">
													<FontAwesomeIcon icon={faUser} className="placeholder-icon-manager" />
													<span>Sin imagen</span>
												</div>
											)}
										</div>
									)}
								</div>
								
								{!isEditing && isAdmin && (
									<div className="image-info-manager">
										<p>Activa el modo edición para cambiar la imagen</p>
									</div>
								)}
							</div>

							{isAdmin && (
								<button type="submit" className="submit-btn-manager">
									{isEditing ? (
										<>
											<FontAwesomeIcon icon={faUser} />
											<span>Guardar Cambios</span>
										</>
									) : (
										<>
											<FontAwesomeIcon icon={faUser} />
											<span>Editar Perfil</span>
										</>
									)}
								</button>
							)}
						</div>
					</div>
				</form>
			</div>
		</div>
	);
};