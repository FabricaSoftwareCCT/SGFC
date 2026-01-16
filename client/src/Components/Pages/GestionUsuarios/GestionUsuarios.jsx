import { useRef, useState } from "react"
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
import debounce from "lodash.debounce"

export const GestionUsuarios = () => {
	const navigate = useNavigate()

	const userSession = JSON.parse(localStorage.getItem("userSession")) || JSON.parse(sessionStorage.getItem("userSession"))

	const [allUsers, setAllUsers] = useState([]) // Todos los usuarios
	const [users, setUsers] = useState([]) // Usuarios de la página actual
	const [total, setTotal] = useState(0)
	const [totalPages, setTotalPages] = useState(0)
	const [page, setPage] = useState(0)
	const [name, setName] = useState("")
	const [document, setDocument] = useState("")
	const [selectedUser, setSelectedUser] = useState(null)
	const [isEditing, setIsEditing] = useState(false)
	const [formData, setFormData] = useState(null)
	const [empresaNIT, setEmpresaNIT] = useState("")
	const [showEmpresas, setShowEmpresas] = useState(false)
	const [resultadosEmpresa, setResultadosEmpresa] = useState([])
	const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null)
	
	const isLoggedIn = !!userSession
	const accountType = userSession?.accountType || null

	const buscarEmpresaPorNIT = async (nit) => {
		if (!nit.trim()) {
			setResultadosEmpresa([])
			return
		}
		try {
			const response = await axiosInstance.get(`/api/users/empresa/${nit}`)
			setResultadosEmpresa([response.data])
			setShowEmpresas(true)
		} catch {
			setResultadosEmpresa([])
			setShowEmpresas(false)
		}
	};

	const debouncedBuscarEmpresa = useRef(debounce(buscarEmpresaPorNIT, 500)).current;

	useEffect(() => {
		debouncedBuscarEmpresa(empresaNIT);
		return () => debouncedBuscarEmpresa.cancel();
	}, [empresaNIT, debouncedBuscarEmpresa]);

	const ITEMS_PER_PAGE = 10 // Número de usuarios por página

	const fetchUsuarios = async () => {
		try {
			const resp = await axiosInstance.get(`/api/users/users?name=${name}&doc=${document}`)
			
			// Guardar todos los usuarios
			setAllUsers(resp.data.usuarios || [])
			setTotal(resp.data.usuarios?.length || 0)
			
			// Calcular paginación
			const totalItems = resp.data.usuarios?.length || 0
			const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
			setTotalPages(totalPages > 0 ? totalPages : 1)
			
			// Obtener usuarios de la página actual
			const startIndex = page * ITEMS_PER_PAGE
			const endIndex = startIndex + ITEMS_PER_PAGE
			const paginatedUsers = resp.data.usuarios?.slice(startIndex, endIndex) || []
			setUsers(paginatedUsers)
			
		} catch (error) {
			// console.log(error)
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

	// Efecto para cargar usuarios inicialmente
	useEffect(() => {
		if (isLoggedIn && accountType == "Administrador") {
			fetchUsuarios()
		} else {
			navigate("/no-autorizado");
		}
	}, [])

	// Efecto para cambiar de página
	useEffect(() => {
		if (allUsers.length > 0) {
			const startIndex = page * ITEMS_PER_PAGE
			const endIndex = startIndex + ITEMS_PER_PAGE
			const paginatedUsers = allUsers.slice(startIndex, endIndex)
			setUsers(paginatedUsers)
		}
	}, [page, allUsers])

	// Efecto para resetear a página 0 cuando se cambian los filtros
	useEffect(() => {
		setPage(0)
	}, [name, document])

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
		setEmpresaSeleccionada(null)
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
			if (empresaSeleccionada)
				formDataToSend.append('empresa_asignada', empresaSeleccionada.ID)

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
			setEmpresaNIT("")
			setEmpresaSeleccionada(null)
			handleCloseModal();
			fetchUsuarios(); // Recargar los datos
		} catch (error) {
			// console.error("Error al actualizar el usuario:", error.response?.data || error.message);
			
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

	const handlePageChange = (newPage) => {
		setPage(newPage)
	}

	const renderUser = (user) => {
		const nombre = user.nombres ? `${user.nombres} ${user.apellidos}` : "Sin definir"
		const documento = user.documento ?? "Sin definir"
		const rol = user.accountType
		const pfp = user.foto_perfil
		const pfpSrc = getLogoSrc(pfp)
		const estado = user.estado

		return (
			<tr key={user.ID} className="gu-company-row">
				<td className="gu-company-logo-cell">
					<img 
						className="gu-company-logo" 
						src={pfpSrc} 
						alt="foto"
					/>
				</td>
				<td className="gu-company-name-cell">
					{nombre}
				</td>
				<td className="gu-company-nit-cell">
					{documento}
				</td>
				<td className="gu-company-category-cell">
					{rol}
				</td>
				<td className="gu-company-status-cell">
					<span className={`gu-status-pill ${estado === 'activo' ? 'gu-status-active' : estado === 'inactivo' ? 'gu-status-inactive' : 'gu-status-unknown'}`}>
						{estado === 'activo' ? 'Activo' : estado === 'inactivo' ? 'Inactivo' : 'Sin estado'}
					</span>
				</td>
				<td>
					<button
						className="gu-manage-button"
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
		<div className="gu-pantalla">
			<Header/>
			<Main>
				<section className="gu-section-principal">
					<section className="gu-section-header">
						<div className="gu-header-title-container">
							<p className="gu-titulo">
								Usuarios <span className="gu-titulo-verde">Registrados</span>
							</p>
						</div>
						<p className="gu-paragraph">
							Consulta y gestiona usuarios registrados en el sistema. 
						</p>
					</section>
					<section className="gu-section-body">
						<section className="gu-filter">
							<strong className="gu-titulo-filtrar">Filtrar</strong>
							<article className="gu-filter-options">
								<div className="gu-filter-option-name">
									<label className="gu-label-filter-option">Nombre</label>
									<div className="gu-input-filter-option">
										<input
											className="gu-input-filter-text"
											type="text"
											placeholder="Escriba el nombre del usuario"
											value={name}
											onChange={(e) => setName(e.target.value)}
										/>
									</div>
								</div>
								<div className="gu-filter-option-name">
									<label className="gu-label-filter-option">Documento</label>
									<div className="gu-input-filter-option">
										<input
											className="gu-input-filter-text"
											type="text"
											placeholder="Escriba el número de documento"
											value={document}
											onChange={(e) => setDocument(e.target.value)}
										/>
									</div>
								</div>
								<button
									className="gu-button"
									onClick={() => {
										setPage(0); // Resetear a la primera página
										fetchUsuarios();
									}}	
								>Filtrar</button>
							</article>
						</section>
						<section className="gu-result-table">
							<div className="gu-results-header">
								<label className="gu-label-filter-result">
									{total} Resultados · Página {page + 1} de {totalPages}
								</label>
								<div className="gu-items-per-page">
									<span>Mostrando {users.length} de {total} usuarios</span>
								</div>
							</div>
							<div className="gu-table-wrapper">
								<div className="gu-table-container">
									{users.length > 0 ?
										<table className="gu-companies-table">
											<thead>
												<tr className="gu-table-header">
													<th className="gu-header-logo">Foto</th>
													<th className="gu-header-name">Nombre</th>
													<th className="gu-header-nit">Documento</th>
													<th className="gu-header-rol">Rol</th>
													<th className="gu-header-category">Estado</th>
													<th className="gu-header-actions">Acciones</th>
												</tr>
											</thead>
											<tbody>
												{users.map(renderUser)}
											</tbody>
										</table>
									:
										<div className="gu-no-results">No se encontraron usuarios.</div>
									}
								</div>
							</div>
							<div className="gu-pagination-container">
								<PageMover
									value={page + 1}
									max={totalPages}
									next={() => {
										if (page + 1 < totalPages) {
											setPage(page + 1)
										}
									}}
									prev={() => {
										if (page > 0) {
											setPage(page - 1)
										}
									}}
								/>
								<div className="gu-page-numbers">
									{Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
										<button
											key={pageNum}
											className={`gu-page-number ${page + 1 === pageNum ? 'active' : ''}`}
											onClick={() => setPage(pageNum - 1)}
										>
											{pageNum}
										</button>
									))}
								</div>
							</div>
						</section>

						{/* Modal Actualizado */}
						{selectedUser && formData && (
							<div className="gu-modal-overlay">
								<div className="gu-modal-container">
									<div className="gu-modal-header">
										<div className="gu-header-content">
											<h2>
												<FontAwesomeIcon icon={faUser} className="gu-header-icon" />
												Perfil del Usuario
											</h2>
											<button 
												type="button" 
												onClick={handleCloseModal}
												className="gu-close-btn"
											>
												<FontAwesomeIcon icon={faArrowLeft} />
												<span>Volver</span>
											</button>
										</div>
									</div>

									<form className="gu-modal-body" onSubmit={handleSubmit}>
										<div className="gu-modal-content">
											{/* Columna izquierda - Información */}
											<div className="gu-info-column">
												<div className="gu-form-section">
													<h3 className="gu-section-title">Información Personal</h3>
													<div className="gu-form-grid">
														<div className="gu-input-group">
															<label className="gu-input-label">
																<FontAwesomeIcon icon={faUser} />
																Nombres
															</label>
															{isEditing ? (
																<input
																	type="text"
																	name="nombres"
																	value={formData.nombres || ""}
																	onChange={handleChange}
																	className="gu-input-field"
																	placeholder="Ingrese los nombres"
																/>
															) : (
																<div className="gu-display-field">
																	{formData.nombres || "No especificado"}
																</div>
															)}
														</div>

														<div className="gu-input-group">
															<label className="gu-input-label">
																<FontAwesomeIcon icon={faUser} />
																Apellidos
															</label>
															{isEditing ? (
																<input
																	type="text"
																	name="apellidos"
																	value={formData.apellidos || ""}
																	onChange={handleChange}
																	className="gu-input-field"
																	placeholder="Ingrese los apellidos"
																/>
															) : (
																<div className="gu-display-field">
																	{formData.apellidos || "No especificado"}
																</div>
															)}
														</div>

														<div className="gu-input-group">
															<label className="gu-input-label">
																<FontAwesomeIcon icon={faIdCard} />
																Documento
															</label>
															{isEditing ? (
																<input
																	type="text"
																	name="documento"
																	value={formData.documento || ""}
																	onChange={handleChange}
																	className="gu-input-field"
																	placeholder="Ingrese el documento"
																/>
															) : (
																<div className="gu-display-field">
																	{formData.documento || "No especificado"}
																</div>
															)}
														</div>

														<div className="gu-input-group">
															<label className="gu-input-label">
																<FontAwesomeIcon icon={faPhone} />
																Celular
															</label>
															{isEditing ? (
																<input
																	type="text"
																	name="celular"
																	value={formData.celular || ""}
																	onChange={handleChange}
																	className="gu-input-field"
																	placeholder="Ingrese el celular"
																/>
															) : (
																<div className="gu-display-field">
																	{formData.celular || "No especificado"}
																</div>
															)}
														</div>

														<div className="gu-input-group">
															<label className="gu-input-label">
																<FontAwesomeIcon icon={faEnvelope} />
																Email
															</label>
															{isEditing ? (
																<input
																	type="email"
																	name="email"
																	value={formData.email || ""}
																	onChange={handleChange}
																	className="gu-input-field"
																	placeholder="Ingrese el email"
																/>
															) : (
																<div className="gu-display-field">
																	{formData.email || "No especificado"}
																</div>
															)}
														</div>

														<div className="gu-input-group">
															<label className="gu-input-label">
																<FontAwesomeIcon icon={faBuilding} />
																Empresa
															</label>
															{isEditing ?
																<>
																	<input
																		className="gu-input-field"
																		type="text"
																		placeholder="Buscar por NIT de empresa"
																		value={empresaNIT}
																		onChange={(e) => {
																			setEmpresaNIT(e.target.value)
																			setShowEmpresas(true)
																		}}
																		autoComplete="off"
																	/>
																	{empresaNIT.trim() !== "" && showEmpresas && (
																		<ul className="company-results-normal">
																			{resultadosEmpresa.length > 0 ? (
																				resultadosEmpresa.map((empresa) => (
																					<li
																						key={empresa.ID}
																						onClick={() => {
																							setEmpresaSeleccionada(empresa)
																							setShowEmpresas(false)
																							setEmpresaNIT(empresa.nombre_empresa)
																						}}
																					>
																						{empresa.nombre_empresa}
																					</li>
																				))
																			) : (
																				<li style={{ color: "#ff6b6b" }}>No se encontraron empresas</li>
																			)}
																		</ul>
																	)}
																</>
																
															:
																<div className="gu-display-field">
																	{selectedUser.Empresa?.nombre_empresa || "No asignada"}
																</div>
															}		
														</div>
														<div className="gu-input-group">
															<label className="gu-input-label">Estado</label>
															{isEditing ? (
																<div className="gu-status-buttons">
																	{["Activo", "Inactivo"].map((estado) => {
																		const isSelected = (formData.estado || "").toLowerCase() === estado.toLowerCase();
																		return (
																			<button
																				key={estado}
																				type="button"
																				className={`gu-status-btn ${isSelected ? "active" : ""}`}
																				onClick={() => handleEstadoChange(estado)}
																			>
																				<span className="gu-status-dot"></span>
																				{estado}
																			</button>
																		);
																	})}
																</div>
															) : (
																<div className={`gu-status-display ${formData.estado?.toLowerCase()}`}>
																	<span className="gu-status-dot"></span>
																	{formData.estado || "No especificado"}
																</div>
															)}
														</div>

														<div className="gu-input-group">
															<label className="gu-input-label">
																<FontAwesomeIcon icon={faShield} />
																Rol
															</label>
															{isEditing ? (
																<div className="gu-status-buttons">
																	{['Aprendiz', 'Instructor', 'Administrador', 'Gestor'].map((rol) => (
																		<button
																			key={rol}
																			type="button"
																			className={`gu-status-btn ${formData.accountType === rol ? "active" : ""}`}
																			onClick={() => handleRolChange(rol)}
																		>
																			<span className="gu-status-dot"></span>
																			{rol}
																		</button>
																	))}
																</div>
															) : (
																<div className="gu-display-field">
																	{formData.accountType || "No especificado"}
																</div>
															)}
														</div>
													</div>
												</div>
											</div>

											{/* Columna derecha - Imagen */}
											<div className="gu-image-column">
												<div className="gu-image-section">
													<div className="gu-image-container">
														{isEditing ? (
															<>
																<input
																	type="file"
																	accept="image/*"
																	onChange={handleImageChange}
																	id="gu-imageUpload"
																	className="gu-file-input"
																/>
																<label
																	className="gu-image-upload editable"
																	htmlFor="gu-imageUpload"
																>
																	{formData.foto_perfil instanceof File ? (
																		<img
																			src={URL.createObjectURL(formData.foto_perfil)}
																			alt="Vista previa"
																			className="gu-profile-image"
																			onError={(e) => {
																				e.target.src = fotoPerfilDefect;
																			}}
																		/>
																	) : formData.foto_perfil ? (
																		<img
																			src={getLogoSrc(formData.foto_perfil)}
																			alt="Foto de perfil"
																			className="gu-profile-image"
																			onError={(e) => {
																				e.target.src = fotoPerfilDefect;
																			}}
																		/>
																	) : (
																		<div className="gu-image-placeholder">
																			<FontAwesomeIcon icon={faCamera} className="gu-placeholder-icon" />
																			<span>Haz clic para subir imagen</span>
																		</div>
																	)}
																	<div className="gu-upload-overlay">
																		<FontAwesomeIcon icon={faCamera} />
																		<span>Cambiar imagen</span>
																	</div>
																</label>
															</>
														) : (
															<div className="gu-image-display">
																{formData.foto_perfil ? (
																	<img
																		src={getLogoSrc(formData.foto_perfil)}
																		alt="Foto de perfil"
																		className="gu-profile-image"
																		onError={(e) => {
																			e.target.src = fotoPerfilDefect;
																		}}
																	/>
																) : (
																	<div className="gu-image-placeholder">
																		<FontAwesomeIcon icon={faUser} className="gu-placeholder-icon" />
																		<span>Sin imagen</span>
																	</div>
																)}
															</div>
														)}
													</div>
													
													{!isEditing && (
														<div className="gu-image-info">
															<p>Activa el modo edición para cambiar la imagen</p>
														</div>
													)}
												</div>

												<button type="submit" className="gu-submit-btn">
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