import React, { useState, useEffect } from "react";
import "./ManageCompany.css";
import axiosInstance from "../../../../config/axiosInstance";
import PropTypes from "prop-types";
import fotoPerfilDefect from "../../../../assets/Icons/userDefect.png";
import { validateEmail, validateNumber, validateText, validateAddress, validateNIT } from "../../../../utils/Validators/formValidator";
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBuilding, faIdCard, faPhone, faEnvelope, faMapMarkerAlt, faCamera, faTag } from '@fortawesome/free-solid-svg-icons';

export const ManageCompany = ({ empresa, onClose }) => {
	const datosEmpresa = empresa || {};
	const userId = empresa?.ID;
	const [isEditing, setIsEditing] = useState(false);
	const [departamentos, setDepartamentos] = useState([]);
	const [ciudades, setCiudades] = useState([]);
	const [formData, setFormData] = useState({
		userId: userId,
		nombre_empresa: datosEmpresa.nombre_empresa || "",
		NIT: datosEmpresa.NIT || "",
		categoria: datosEmpresa.categoria || "",
		estado: (datosEmpresa.estado || "").toLowerCase(),
		telefono: datosEmpresa.telefono || "",
		direccion: datosEmpresa.direccion || "",
		email_empresa: datosEmpresa.email_empresa || "",
		ciudad_ID: datosEmpresa?.Ciudad?.ID || datosEmpresa.ciudad_ID || null,
		departamento_ID: datosEmpresa?.Ciudad?.Departamento?.ID || null,
		logo: datosEmpresa.img_empresa || null,
	});

	useEffect(() => {
		const fetchDepartamentos = async () => {
			try {
				const res = await axiosInstance.get("/api/ubicaciones/departamentos");
				const payload = Array.isArray(res.data)
					? res.data
					: (res.data?.data || res.data?.departamentos || []);
				setDepartamentos(payload || []);
			} catch (_) { setDepartamentos([]); }
		};
		fetchDepartamentos();
	}, []);

	useEffect(() => {
		const fetchDepartamentoFromCiudad = async () => {
			if (formData.ciudad_ID && !formData.departamento_ID) {
				try {
					const res = await axiosInstance.get(`/api/ubicaciones/ciudades/${formData.ciudad_ID}`);
					if (res.data?.Departamento?.ID) {
						setFormData(prev => ({ ...prev, departamento_ID: res.data.Departamento.ID }));
					}
				} catch (_) {
					// console.log("No se pudo obtener el departamento de la ciudad");
				}
			}
		};
		fetchDepartamentoFromCiudad();
	}, [formData.ciudad_ID]);

	useEffect(() => {
		const fetchCiudades = async () => {
			if (!formData.departamento_ID && !formData.ciudad_ID) return;
			try {
				const deptoId = formData.departamento_ID;
				if (deptoId) {
					const res = await axiosInstance.get(`/api/ubicaciones/departamentos/${deptoId}/ciudades`);
					const payload = Array.isArray(res.data)
						? res.data
						: (res.data?.data || res.data?.ciudades || []);
					setCiudades(payload || []);
					if (formData.ciudad_ID && !payload.find(c => c.ID === formData.ciudad_ID)) {
						setFormData(prev => ({ ...prev, ciudad_ID: null }));
					}
				}
			} catch (_) { setCiudades([]); }
		};
		fetchCiudades();
	}, [formData.departamento_ID, formData.ciudad_ID]);

	const closeModalCompany = () => {
		if (onClose) onClose();
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSelectDepartamento = (e) => {
		const value = e.target.value;
		const departamento_ID = value ? Number(value) : null;
		setFormData((prev) => ({ ...prev, departamento_ID, ciudad_ID: null }));
	};

	const handleSelectCiudad = (e) => {
		const value = e.target.value;
		const ciudad_ID = value ? Number(value) : null;
		setFormData((prev) => ({ ...prev, ciudad_ID }));
	};

	const handleImageChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			setFormData((prev) => ({
				...prev,
				logo: file,
			}));
		}
	};

	const handleEstadoChange = (estado) => {
		setFormData((prev) => ({ ...prev, estado: estado.toLowerCase() }));
	};

	const validateFields = () => {
		const errors = [];
		
		if (formData.nombre_empresa.trim() === '') {
			errors.push('El nombre de la empresa es obligatorio');
		}
		
		const nitError = validateNIT(formData.NIT);
		if (nitError) errors.push(nitError);
		
		if (formData.categoria.trim() === '') {
			errors.push('La categoría es obligatoria');
		}
		
		const telefonoError = validateNumber(formData.telefono);
		if (telefonoError) errors.push(telefonoError);
		
		const direccionError = validateAddress(formData.direccion);
		if (direccionError) errors.push(direccionError);
		
		const emailError = validateEmail(formData.email_empresa);
		if (emailError) errors.push(emailError);
		
		return errors;
	};

	const getImageSrc = (logo) => {
		if (!logo) return fotoPerfilDefect;
		if (logo instanceof File) return URL.createObjectURL(logo);
		if (typeof logo === "string") {
			if (logo.startsWith('data:') || logo.startsWith('http')) return logo;
			if (/(\.png|\.jpg|\.jpeg|\.gif)$/i.test(logo)) return fotoPerfilDefect;
			if (logo.startsWith('iVBOR')) return `data:image/png;base64,${logo}`;
			if (logo.startsWith('/9j/')) return `data:image/jpeg;base64,${logo}`;
			if (logo.length < 100) return fotoPerfilDefect;
			return `data:image/jpeg;base64,${logo}`;
		}
		return fotoPerfilDefect;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!isEditing) {
			setIsEditing(true);
			return;
		}

		if (!formData.userId) {
			await Swal.fire({
				icon: 'error',
				title: 'Error de identificación',
				text: 'No se pudo identificar el usuario de la empresa.',
				confirmButtonColor: '#d33',
				theme: "bulma",
				customClass: { confirmButton: 'centered-swal-button' }
			});
			return;
		}

		const errors = validateFields();
		if (errors.length > 0) {
			await Swal.fire({
				icon: 'warning',
				title: 'Errores de validación',
				html: `
					<div style="text-align: left;">
						<p>Por favor corrija los siguientes errores:</p>
						<ul style="margin-top: 10px; padding-left: 20px;">
							${errors.map(error => `<li>${error}</li>`).join('')}
						</ul>
					</div>
				`,
				confirmButtonText: 'Entendido',
				confirmButtonColor: '#3085d6',
				theme: "bulma",
				customClass: { confirmButton: 'centered-swal-button' }
			});
			return;
		}

		try {
			const body = new FormData();
			const empresaPayload = {
				NIT: formData.NIT,
				categoria: formData.categoria,
				direccion: formData.direccion,
				email_empresa: formData.email_empresa,
				estado: formData.estado,
				img_empresa: typeof formData.logo === "string" ? formData.logo : undefined,
				nombre_empresa: formData.nombre_empresa,
				telefono: formData.telefono,
				ciudad_ID: formData.ciudad_ID || null,
				departamento_ID: formData.departamento_ID || null,
			};
			
			body.append("NIT", empresaPayload.NIT);
			body.append("categoria", empresaPayload.categoria);
			body.append("direccion", empresaPayload.direccion);
			body.append("email_empresa", empresaPayload.email_empresa);
			body.append("estado", empresaPayload.estado);
			body.append("img_empresa", empresaPayload.img_empresa);
			body.append("nombre_empresa", empresaPayload.nombre_empresa);
			body.append("telefono", empresaPayload.telefono);
			body.append("ciudad_ID", empresaPayload.ciudad_ID);
			body.append("departamento_ID", empresaPayload.departamento_ID);
			if (formData.logo instanceof File) {
				body.append("img_empresa", formData.logo);
			}

			const response = await axiosInstance.put(`/api/empresa/actualizar/${userId}`, body, {
				headers: { "Content-Type": "multipart/form-data" },
			});

			if (response?.status >= 200 && response?.status < 300) {
				await Swal.fire({
					icon: 'success',
					title: '¡Éxito!',
					text: response?.data?.message || "Empresa actualizada correctamente",
					confirmButtonColor: '#3085d6',
					timer: 3000,
					timerProgressBar: true,
					theme: "bulma",
					customClass: { confirmButton: 'centered-swal-button' }
				});
			} else {
				await Swal.fire({
					icon: 'error',
					title: 'Error',
					text: 'No se pudo actualizar la empresa.',
					confirmButtonColor: '#d33',
					theme: "bulma",
					customClass: { confirmButton: 'centered-swal-button' }
				});
				return;
			}
			setIsEditing(false);
			window.location.reload();
			closeModalCompany();
		} catch (error) {
			// console.error(`Error al actualizar la empresa:`, error.response?.data || error.message);
			await Swal.fire({
				icon: 'error',
				title: 'Error al actualizar',
				text: 'Hubo un error al actualizar la empresa. Por favor, inténtelo de nuevo.',
				confirmButtonColor: '#d33',
				theme: "bulma",
				customClass: { confirmButton: 'centered-swal-button' }
			});
		}
	};

	if (!empresa) return null;

	return (
		<div id="modal-overlayManageCompany" className="modal-overlay-company">
			<div className="modal-container-company">
				<div className="modal-header-company">
					<div className="header-content-company">
						<h2>
							<FontAwesomeIcon icon={faBuilding} className="header-icon-company" />
							Perfil de la Empresa
						</h2>
						<button 
							type="button" 
							onClick={closeModalCompany}
							className="close-btn-company"
						>
							<FontAwesomeIcon icon={faArrowLeft} />
							<span>Volver</span>
						</button>
					</div>
				</div>

				<form className="modal-body-company" onSubmit={handleSubmit}>
					<div className="modal-content-company">
						{/* Columna izquierda - Información */}
						<div className="info-column-company">
							<div className="form-section-company">
								<h3 className="section-title-company">Información de la Empresa</h3>
								<div className="form-grid-company">
									<div className="input-group-company">
										<label className="input-label-company">
											<FontAwesomeIcon icon={faBuilding} />
											Nombre
										</label>
										{isEditing ? (
											<input
												type="text"
												name="nombre_empresa"
												value={formData.nombre_empresa || ""}
												onChange={handleChange}
												className="input-field-company"
												placeholder="Ingrese el nombre de la empresa"
											/>
										) : (
											<div className="display-field-company">
												{formData.nombre_empresa || "No especificado"}
											</div>
										)}
									</div>

									<div className="input-group-company">
										<label className="input-label-company">
											<FontAwesomeIcon icon={faIdCard} />
											NIT
										</label>
										{isEditing ? (
											<input
												type="text"
												name="NIT"
												value={formData.NIT || ""}
												onChange={handleChange}
												className="input-field-company"
												placeholder="Ingrese el NIT"
											/>
										) : (
											<div className="display-field-company">
												{formData.NIT || "No especificado"}
											</div>
										)}
									</div>

									<div className="input-group-company">
										<label className="input-label-company">
											<FontAwesomeIcon icon={faTag} />
											Categoría
										</label>
										{isEditing ? (
											<input
												type="text"
												name="categoria"
												value={formData.categoria || ""}
												onChange={handleChange}
												className="input-field-company"
												placeholder="Ingrese la categoría"
											/>
										) : (
											<div className="display-field-company">
												{formData.categoria || "No especificado"}
											</div>
										)}
									</div>

									<div className="input-group-company">
										<label className="input-label-company">
											<FontAwesomeIcon icon={faMapMarkerAlt} />
											Departamento
										</label>
										{isEditing ? (
											<select 
												value={formData.departamento_ID || ""} 
												onChange={handleSelectDepartamento}
												className="input-field-company"
											>
												<option value="">Seleccione...</option>
												{departamentos.map((d) => (
													<option key={d.ID} value={d.ID}>{d.nombre}</option>
												))}
											</select>
										) : (
											<div className="display-field-company">
												{departamentos.find(d => d.ID === formData.departamento_ID)?.nombre || "No especificado"}
											</div>
										)}
									</div>

									<div className="input-group-company">
										<label className="input-label-company">
											<FontAwesomeIcon icon={faMapMarkerAlt} />
											Ciudad
										</label>
										{isEditing ? (
											<select 
												value={formData.ciudad_ID || ""} 
												onChange={handleSelectCiudad} 
												disabled={!formData.departamento_ID}
												className="input-field-company"
											>
												<option value="">Seleccione...</option>
												{ciudades.map((c) => (
													<option key={c.ID} value={c.ID}>{c.nombre}</option>
												))}
											</select>
										) : (
											<div className="display-field-company">
												{ciudades.find(c => c.ID === formData.ciudad_ID)?.nombre || "No especificado"}
											</div>
										)}
									</div>

									<div className="input-group-company">
										<label className="input-label-company">
											<FontAwesomeIcon icon={faPhone} />
											Teléfono
										</label>
										{isEditing ? (
											<input
												type="text"
												name="telefono"
												value={formData.telefono || ""}
												onChange={handleChange}
												className="input-field-company"
												placeholder="Ingrese el teléfono"
											/>
										) : (
											<div className="display-field-company">
												{formData.telefono || "No especificado"}
											</div>
										)}
									</div>

									<div className="input-group-company">
										<label className="input-label-company">
											<FontAwesomeIcon icon={faMapMarkerAlt} />
											Dirección
										</label>
										{isEditing ? (
											<input
												type="text"
												name="direccion"
												value={formData.direccion || ""}
												onChange={handleChange}
												className="input-field-company"
												placeholder="Ingrese la dirección"
											/>
										) : (
											<div className="display-field-company">
												{formData.direccion || "No especificado"}
											</div>
										)}
									</div>

									<div className="input-group-company">
										<label className="input-label-company">
											<FontAwesomeIcon icon={faEnvelope} />
											Email
										</label>
										{isEditing ? (
											<input
												type="email"
												name="email_empresa"
												value={formData.email_empresa || ""}
												onChange={handleChange}
												className="input-field-company"
												placeholder="Ingrese el email"
											/>
										) : (
											<div className="display-field-company">
												{formData.email_empresa || "No especificado"}
											</div>
										)}
									</div>

									<div className="input-group-company">
										<label className="input-label-company">Estado</label>
										{isEditing ? (
											<div className="status-buttons-company">
												{["Activo", "Inactivo", "Suspendido"].map((estado) => {
													const isSelected = (formData.estado || "").toLowerCase() === estado.toLowerCase();
													return (
														<button
															key={estado}
															type="button"
															className={`status-btn-company ${isSelected ? "active" : ""}`}
															onClick={() => handleEstadoChange(estado)}
														>
															<span className="status-dot-company"></span>
															{estado}
														</button>
													);
												})}
											</div>
										) : (
											<div className={`status-display-company ${formData.estado?.toLowerCase()}`}>
												<span className="status-dot-company"></span>
												{formData.estado || "No especificado"}
											</div>
										)}
									</div>
								</div>
							</div>
						</div>

						{/* Columna derecha - Imagen */}
						<div className="image-column-company">
							<div className="image-section-company">
								<div className="image-container-company">
									{isEditing ? (
										<>
											<input
												type="file"
												accept="image/*"
												onChange={handleImageChange}
												id="imageUploadCompany"
												className="file-input-company"
											/>
											<label
												className="image-upload-company editable"
												htmlFor="imageUploadCompany"
											>
												{formData.logo instanceof File ? (
													<img
														src={URL.createObjectURL(formData.logo)}
														alt="Vista previa"
														className="profile-image-company"
														onError={(e) => {
															e.target.src = fotoPerfilDefect;
														}}
													/>
												) : formData.logo ? (
													<img
														src={getImageSrc(formData.logo)}
														alt="Logo de la empresa"
														className="profile-image-company"
														onError={(e) => {
															e.target.src = fotoPerfilDefect;
														}}
													/>
												) : (
													<div className="image-placeholder-company">
														<FontAwesomeIcon icon={faCamera} className="placeholder-icon-company" />
														<span>Haz clic para subir logo</span>
													</div>
												)}
												<div className="upload-overlay-company">
													<FontAwesomeIcon icon={faCamera} />
													<span>Cambiar logo</span>
												</div>
											</label>
										</>
									) : (
										<div className="image-display-company">
											{formData.logo ? (
												<img
													src={getImageSrc(formData.logo)}
													alt="Logo de la empresa"
													className="profile-image-company"
													onError={(e) => {
														e.target.src = fotoPerfilDefect;
													}}
												/>
											) : (
												<div className="image-placeholder-company">
													<FontAwesomeIcon icon={faBuilding} className="placeholder-icon-company" />
													<span>Sin logo</span>
												</div>
											)}
										</div>
									)}
								</div>
								
								{!isEditing && (
									<div className="image-info-company">
										<p>Activa el modo edición para cambiar el logo</p>
									</div>
								)}
							</div>

							<button type="submit" className="submit-btn-company">
								{isEditing ? (
									<>
										<FontAwesomeIcon icon={faBuilding} />
										<span>Guardar Cambios</span>
									</>
								) : (
									<>
										<FontAwesomeIcon icon={faBuilding} />
										<span>Editar Empresa</span>
									</>
								)}
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
};

ManageCompany.propTypes = {
	empresa: PropTypes.shape({
		ID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		Empresa: PropTypes.shape({
			ID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
			nombre_empresa: PropTypes.string,
			NIT: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
			categoria: PropTypes.string,
			estado: PropTypes.string,
			telefono: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
			direccion: PropTypes.string,
			email_empresa: PropTypes.string,
			img_empresa: PropTypes.any,
			ciudad_ID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		}),
	}),
	onClose: PropTypes.func,
};