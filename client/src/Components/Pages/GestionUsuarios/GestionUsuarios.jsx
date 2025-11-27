import { useState } from "react"
import { Header } from "../../Layouts/Header/Header"
import { Main } from "../../Layouts/Main/Main"
import "./GestionUsuarios.css"
import { useNavigate } from "react-router-dom"
import axiosInstance from "../../../config/axiosInstance"
import { useEffect } from "react"
import { PageMover } from "../../UI/PageMover/PageMover"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faUser, faIdCard, faPhone, faEnvelope, faCamera, faBuilding, faShield } from '@fortawesome/free-solid-svg-icons'

import fotoPerfilDefect from "../../../assets/Icons/userDefect.png"
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css'

export const GestionUsuarios = () => {
	const navigate = useNavigate()

	const userSession = JSON.parse(localStorage.getItem("userSession")) || JSON.parse(sessionStorage.getItem("userSession"))

	const [users, setUsers] = useState([])
	const [total, setTotal] = useState(0)
	const [totalPages, setTotalPages] = useState(0)
	const [page, setPage] = useState(0)
	const [name, setName] = useState("")
	const [document, setDocument] = useState("")
	const [selectedUser, setSelectedUser] = useState(null)
	const [isEditing, setIsEditing] = useState(false)
	const [formData, setFormData] = useState(null)
	
	const isLoggedIn = !!userSession
	const accountType = userSession?.accountType || null

	const fetchUsuarios = async () => {
		try {
			const resp = await axiosInstance.get(`/api/users/users?name=${name}&doc=${document}`)
			setUsers(resp.data.usuarios)
			setTotal(parseInt(resp.data.total))
			setTotalPages(parseInt(resp.data.total / 10) + 1)
		} catch (error) {
			console.log(error)
			Swal.fire({
				icon:"error",
				title:"Error al consultar los usuarios",
				text:"Ocurrió un error al consultar los usuarios, intentelo de nuevo",
				confirmButtonText:"Okay",
				theme:"bulma",
				customClass:{
					confirmButton: 'centered-swal-button'
				}
			})
		}
	} 

	useEffect(() => {
		if (isLoggedIn && accountType == "Administrador") {
			fetchUsuarios()
		} else {
			navigate("/no-autorizado");
		}
	}, [page])

	const getLogoSrc = (logo) => {
		if (!logo) return fotoPerfilDefect;

		if (typeof logo === "string") {
			if (logo.startsWith('data:') || logo.startsWith('http')) {
				return logo;
			}

			if (/(\.png|\.jpg|\.jpeg|\.gif)$/i.test(logo)) {
				return fotoPerfilDefect;
			}

			if (logo.startsWith('iVBOR')) {
				return `data:image/png;base64,${logo}`;
			}
			if (logo.startsWith('/9j/')) {
				return `data:image/jpeg;base64,${logo}`;
			}

			if (logo.length < 100) {
				return fotoPerfilDefect;
			}

			return `data:image/jpeg;base64,${logo}`;
		}
		
		return fotoPerfilDefect;
	}

	const handleOpenModal = (user) => {
		setSelectedUser(user)
		setFormData({ ...user })
		setIsEditing(false)
	}

	const handleCloseModal = () => {
		setSelectedUser(null)
		setFormData(null)
		setIsEditing(false)
	}

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	}

	const handleImageChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			setFormData((prev) => ({
				...prev,
				foto_perfil: file,
			}));
		}
	}

	const handleEstadoChange = (estado) => {
		setFormData((prev) => ({ ...prev, estado: estado.toLowerCase() }));
	}

	const handleRolChange = (rol) => {
		setFormData((prev) => ({ ...prev, accountType: rol }));
	}

	const validateFields = () => {
		const errors = [];
		
		if (!formData.nombres || formData.nombres.trim() === '') {
			errors.push('Los nombres son requeridos');
		} else if (formData.nombres.trim().length < 2) {
			errors.push('Los nombres deben tener al menos 2 caracteres');
		}
		
		if (!formData.apellidos || formData.apellidos.trim() === '') {
			errors.push('Los apellidos son requeridos');
		} else if (formData.apellidos.trim().length < 2) {
			errors.push('Los apellidos deben tener al menos 2 caracteres');
		}
		
		if (!formData.documento || formData.documento.trim() === '') {
			errors.push('El número de documento es requerido');
		} else if (!/^\d+$/.test(formData.documento.trim())) {
			errors.push('El número de documento debe contener solo números');
		} else if (formData.documento.trim().length < 6) {
			errors.push('El número de documento debe tener al menos 6 dígitos');
		}
		
		if (!formData.celular || formData.celular.trim() === '') {
			errors.push('El número de celular es requerido');
		} else if (!/^\d+$/.test(formData.celular.trim())) {
			errors.push('El número de celular debe contener solo números');
		} else if (formData.celular.trim().length < 10) {
			errors.push('El número de celular debe tener al menos 10 dígitos');
		}
		
		if (!formData.email || formData.email.trim() === '') {
			errors.push('El email es requerido');
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
			errors.push('Debe ingresar un email válido');
		}
		
		return errors;
	}

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!isEditing) {
			setIsEditing(true);
			return;
		}

		const errors = validateFields();
		if (errors.length > 0) {
			await Swal.fire({
				icon: "warning",
				title: "Campos requeridos",
				html: `
					<div style="text-align: left;">
						<p>Por favor corrija los siguientes errores:</p>
						<ul style="margin-top: 10px; padding-left: 20px;">
							${errors.map(error => `<li>${error}</li>`).join('')}
						</ul>
					</div>
				`,
				confirmButtonText: "Entendido",
				theme: "bulma",
				customClass: { confirmButton: 'centered-swal-button' }
			});
			return;
		}

		try {
			const formDataToSend = new FormData();
			
			// Agregar campos básicos
			formDataToSend.append('nombres', formData.nombres);
			formDataToSend.append('apellidos', formData.apellidos);
			formDataToSend.append('documento', formData.documento);
			formDataToSend.append('celular', formData.celular);
			formDataToSend.append('email', formData.email);
			formDataToSend.append('estado', formData.estado);

			// Agregar imagen si es un archivo nuevo
			if (formData.foto_perfil instanceof File) {
				formDataToSend.append('foto_perfil', formData.foto_perfil);
			}

			// Actualizar datos básicos
			const response = await axiosInstance.put(
				`/api/users/perfil/actualizar/${formData.ID}`,
				formDataToSend,
				{
					headers: {
						'Content-Type': 'multipart/form-data',
					}
				}
			);

			// Cambiar rol si es necesario
			if (formData.accountType !== selectedUser.accountType) {
				await axiosInstance.put(`/api/users/admin/changerole/${formData.ID}`, {
					role: formData.accountType
				});
			}

			await Swal.fire({
				icon: "success",
				title: "¡Éxito!",
				text: "Usuario actualizado correctamente",
				confirmButtonText: "Aceptar",
				theme: "bulma",
				customClass: { confirmButton: 'centered-swal-button' }
			});
			
			setIsEditing(false);
			handleCloseModal();
			fetchUsuarios();
		} catch (error) {
			console.error("Error al actualizar el usuario:", error.response?.data || error.message);
			
			let errorMessage = "Hubo un error al actualizar el usuario. Por favor, inténtelo de nuevo.";
			
			if (error.response?.status === 400) {
				const errorMsg = error.response?.data?.message;
				if (errorMsg === "El correo electrónico ya está registrado.") {
					errorMessage = "El correo electrónico ya está registrado en el sistema. Por favor, use un correo diferente.";
				} else if (errorMsg === "El documento ya está registrado.") {
					errorMessage = "El número de documento ya está registrado en el sistema. Por favor, verifique el documento.";
				} else if (errorMsg === "El número de celular ya está registrado.") {
					errorMessage = "El número de celular ya está registrado en el sistema. Por favor, use un número diferente.";
				} else {
					errorMessage = errorMsg || errorMessage;
				}
			}

			await Swal.fire({
				icon: "error",
				title: "Error",
				text: errorMessage,
				confirmButtonText: "Aceptar",
				theme: "bulma",
				customClass: { confirmButton: 'centered-swal-button' }
			});
		}
	}

	const renderUser = (user) => {
		const nombre = user.nombres ? `${user.nombres} ${user.apellidos}` : "Sin definir"
		const documento = user.documento ?? "Sin definir"
		const rol = user.accountType
		const pfp = user.foto_perfil
		const pfpSrc = getLogoSrc(pfp)
		const estado = user.estado

		return (
			<tr key={user.ID} className="company-row">
				<td className="company-logo-cell">
					<img 
						className="company-logo" 
						src={pfpSrc} 
						alt="foto"
					/>
				</td>
				<td className="company-name-cell">
					{nombre}
				</td>
				<td className="company-nit-cell">
					{documento}
				</td>
				<td className="company-category-cell">
					{rol}
				</td>
				<td className="company-status-cell">
					<span className={`status-pill ${estado === 'activo' ? 'status-active' : estado === 'inactivo' ? 'status-inactive' : 'status-unknown'}`}>
						{estado === 'activo' ? 'Activo' : estado === 'inactivo' ? 'Inactivo' : 'Sin estado'}
					</span>
				</td>
				<td>
					<button
						className="manage-button"
						type="button"
						onClick={() => handleOpenModal(user)}
						data-adblock-bypass="true"
						aria-label="Ver usuario"
					>Ver usuario</button>
				</td>
			</tr>
		)
	}

	return (
		<div className="pantallaGestionsCompany">
			<Header/>
			<Main>
				<section className="sectionPrincipalGestionsCompany">
					<section className="sectionGestionsCompanyHeader">
						<div className="header-title-container">
							<p className="tituloGestionsCompany">
								Usuarios <span className="tituloVerde">Registrados</span>
							</p>
						</div>
						<p className="paragraphGestionsCompany">
							Consulta y gestiona usuarios registrados en el sistema. 
						</p>
					</section>
					<section className="sectionGestionsCompanyBody">
						<section className="filterGestionsCompany">
							<strong className="tituloFiltrar">Filtrar</strong>
							<article className="filterOptionsGestionsCompany">
								<div className="filterOptionName">
									<label className="labelFilterOption1">Nombre</label>
									<div className="inputFilterOption1">
										<input
											className="inputFilterOptionText"
											type="text"
											placeholder="Escriba el nombre del usuario"
											value={name}
											onChange={(e) => setName(e.target.value)}
										/>
									</div>
								</div>
								<div className="filterOptionName">
									<label className="labelFilterOption1">Documento</label>
									<div className="inputFilterOption1">
										<input
											className="inputFilterOptionText"
											type="text"
											placeholder="Escriba el nombre del usuario"
											value={document}
											onChange={(e) => setDocument(e.target.value)}
										/>
									</div>
								</div>
								<button
									className="button"
									onClick={() => fetchUsuarios()}	
								>Filtrar</button>
							</article>
						</section>
						<section className="resultTableGestionsCompany">
							<div className="results-header">
								<label className="labelFilterOption12">
									{total} Resultados · Página {page + 1} de {totalPages}
								</label>
							</div>
							<div className="table-container">
								{users.length > 0 ?
									<table className="companies-table">
										<thead>
											<tr className="table-heade">
												<th className="header-logo">Foto</th>
												<th className="header-name">Nombre</th>
												<th className="header-nit">Documento</th>
												<th className="header-name">Rol</th>
												<th className="header-category">Estado</th>
												<th className="header-actions">Acciones</th>
											</tr>
										</thead>
										<tbody>
											{users.map(renderUser)}
										</tbody>
									</table>
								:
									<div className="no-results">No se encontraron usuarios.</div>
								}
							</div>
							<div className="pagination-container">
								<PageMover
									value={page + 1}
									max={totalPages}
									next={() => {
										setPage(page + 1)
									}}
									prev={() => {
										setPage(page - 1)
									}}
								/>
							</div>
						</section>

						{/* Modal Actualizado */}
						{selectedUser && formData && (
							<div className="modal-overlay-usuario">
								<div className="modal-container-usuario">
									<div className="modal-header-usuario">
										<div className="header-content-usuario">
											<h2>
												<FontAwesomeIcon icon={faUser} className="header-icon-usuario" />
												Perfil del Usuario
											</h2>
											<button 
												type="button" 
												onClick={handleCloseModal}
												className="close-btn-usuario"
											>
												<FontAwesomeIcon icon={faArrowLeft} />
												<span>Volver</span>
											</button>
										</div>
									</div>

									<form className="modal-body-usuario" onSubmit={handleSubmit}>
										<div className="modal-content-usuario">
											{/* Columna izquierda - Información */}
											<div className="info-column-usuario">
												<div className="form-section-usuario">
													<h3 className="section-title-usuario">Información Personal</h3>
													<div className="form-grid-usuario">
														<div className="input-group-usuario">
															<label className="input-label-usuario">
																<FontAwesomeIcon icon={faUser} />
																Nombres
															</label>
															{isEditing ? (
																<input
																	type="text"
																	name="nombres"
																	value={formData.nombres || ""}
																	onChange={handleChange}
																	className="input-field-usuario"
																	placeholder="Ingrese los nombres"
																/>
															) : (
																<div className="display-field-usuario">
																	{formData.nombres || "No especificado"}
																</div>
															)}
														</div>

														<div className="input-group-usuario">
															<label className="input-label-usuario">
																<FontAwesomeIcon icon={faUser} />
																Apellidos
															</label>
															{isEditing ? (
																<input
																	type="text"
																	name="apellidos"
																	value={formData.apellidos || ""}
																	onChange={handleChange}
																	className="input-field-usuario"
																	placeholder="Ingrese los apellidos"
																/>
															) : (
																<div className="display-field-usuario">
																	{formData.apellidos || "No especificado"}
																</div>
															)}
														</div>

														<div className="input-group-usuario">
															<label className="input-label-usuario">
																<FontAwesomeIcon icon={faIdCard} />
																Documento
															</label>
															{isEditing ? (
																<input
																	type="text"
																	name="documento"
																	value={formData.documento || ""}
																	onChange={handleChange}
																	className="input-field-usuario"
																	placeholder="Ingrese el documento"
																/>
															) : (
																<div className="display-field-usuario">
																	{formData.documento || "No especificado"}
																</div>
															)}
														</div>

														<div className="input-group-usuario">
															<label className="input-label-usuario">
																<FontAwesomeIcon icon={faPhone} />
																Celular
															</label>
															{isEditing ? (
																<input
																	type="text"
																	name="celular"
																	value={formData.celular || ""}
																	onChange={handleChange}
																	className="input-field-usuario"
																	placeholder="Ingrese el celular"
																/>
															) : (
																<div className="display-field-usuario">
																	{formData.celular || "No especificado"}
																</div>
															)}
														</div>

														<div className="input-group-usuario">
															<label className="input-label-usuario">
																<FontAwesomeIcon icon={faEnvelope} />
																Email
															</label>
															{isEditing ? (
																<input
																	type="email"
																	name="email"
																	value={formData.email || ""}
																	onChange={handleChange}
																	className="input-field-usuario"
																	placeholder="Ingrese el email"
																/>
															) : (
																<div className="display-field-usuario">
																	{formData.email || "No especificado"}
																</div>
															)}
														</div>

														<div className="input-group-usuario">
															<label className="input-label-usuario">
																<FontAwesomeIcon icon={faBuilding} />
																Empresa
															</label>
															<div className="display-field-usuario">
																{selectedUser.Empresa?.nombre_empresa || "No asignada"}
															</div>
														</div>

														<div className="input-group-usuario">
															<label className="input-label-usuario">Estado</label>
															{isEditing ? (
																<div className="status-buttons-usuario">
																	{["Activo", "Inactivo"].map((estado) => {
																		const isSelected = (formData.estado || "").toLowerCase() === estado.toLowerCase();
																		return (
																			<button
																				key={estado}
																				type="button"
																				className={`status-btn-usuario ${isSelected ? "active" : ""}`}
																				onClick={() => handleEstadoChange(estado)}
																			>
																				<span className="status-dot-usuario"></span>
																				{estado}
																			</button>
																		);
																	})}
																</div>
															) : (
																<div className={`status-display-usuario ${formData.estado?.toLowerCase()}`}>
																	<span className="status-dot-usuario"></span>
																	{formData.estado || "No especificado"}
																</div>
															)}
														</div>

														<div className="input-group-usuario">
															<label className="input-label-usuario">
																<FontAwesomeIcon icon={faShield} />
																Rol
															</label>
															{isEditing ? (
																<div className="status-buttons-usuario">
																	{['Aprendiz', 'Instructor', 'Administrador', 'Gestor'].map((rol) => (
																		<button
																			key={rol}
																			type="button"
																			className={`status-btn-usuario ${formData.accountType === rol ? "active" : ""}`}
																			onClick={() => handleRolChange(rol)}
																		>
																			<span className="status-dot-usuario"></span>
																			{rol}
																		</button>
																	))}
																</div>
															) : (
																<div className="display-field-usuario">
																	{formData.accountType || "No especificado"}
																</div>
															)}
														</div>
													</div>
												</div>
											</div>

											{/* Columna derecha - Imagen */}
											<div className="image-column-usuario">
												<div className="image-section-usuario">
													<div className="image-container-usuario">
														{isEditing ? (
															<>
																<input
																	type="file"
																	accept="image/*"
																	onChange={handleImageChange}
																	id="imageUploadUsuario"
																	className="file-input-usuario"
																/>
																<label
																	className="image-upload-usuario editable"
																	htmlFor="imageUploadUsuario"
																>
																	{formData.foto_perfil instanceof File ? (
																		<img
																			src={URL.createObjectURL(formData.foto_perfil)}
																			alt="Vista previa"
																			className="profile-image-usuario"
																			onError={(e) => {
																				e.target.src = fotoPerfilDefect;
																			}}
																		/>
																	) : formData.foto_perfil ? (
																		<img
																			src={getLogoSrc(formData.foto_perfil)}
																			alt="Foto de perfil"
																			className="profile-image-usuario"
																			onError={(e) => {
																				e.target.src = fotoPerfilDefect;
																			}}
																		/>
																	) : (
																		<div className="image-placeholder-usuario">
																			<FontAwesomeIcon icon={faCamera} className="placeholder-icon-usuario" />
																			<span>Haz clic para subir imagen</span>
																		</div>
																	)}
																	<div className="upload-overlay-usuario">
																		<FontAwesomeIcon icon={faCamera} />
																		<span>Cambiar imagen</span>
																	</div>
																</label>
															</>
														) : (
															<div className="image-display-usuario">
																{formData.foto_perfil ? (
																	<img
																		src={getLogoSrc(formData.foto_perfil)}
																		alt="Foto de perfil"
																		className="profile-image-usuario"
																		onError={(e) => {
																			e.target.src = fotoPerfilDefect;
																		}}
																	/>
																) : (
																	<div className="image-placeholder-usuario">
																		<FontAwesomeIcon icon={faUser} className="placeholder-icon-usuario" />
																		<span>Sin imagen</span>
																	</div>
																)}
															</div>
														)}
													</div>
													
													{!isEditing && (
														<div className="image-info-usuario">
															<p>Activa el modo edición para cambiar la imagen</p>
														</div>
													)}
												</div>

												<button type="submit" className="submit-btn-usuario">
													{isEditing ? (
														<>
															<FontAwesomeIcon icon={faUser} />
															<span>Guardar Cambios</span>
														</>
													) : (
														<>
															<FontAwesomeIcon icon={faUser} />
															<span>Editar Usuario</span>
														</>
													)}
												</button>
											</div>
										</div>
									</form>
								</div>
							</div>
						)}
					</section>
				</section>
			</Main>
		</div>
	)
}