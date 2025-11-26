"use client"
import { useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import "./GestionsEmployes.css"
import { Header } from "../../Layouts/Header/Header"
import { Footer } from "../../../Components/Layouts/Footer/Footer"
import { Main } from "../../../Components/Layouts/Main/Main"
import { UpdateEmploye } from "./UpdateEmploye/UpdateEmploye"
import axiosInstance from "../../../config/axiosInstance"
import { useModal } from "../../../Context/ModalContext"
import { InscribeEmployes } from "../GestionsEmployes/InscribeEmployes/InscribeEmployes"
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css'
import { ReportEmployee } from "./ReportEmployee/ReportEmployee"
import { generarExcelEmpleado } from "../../../utils/Reports/Empleados"
import html2pdf from "html2pdf.js"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUserPlus, faChartLine, faCheck, faUsers, faSearch, faFolderOpen, faIdCard, faPhone, faEnvelope, faBuilding, faFileAlt, faFilter, faDownload } from '@fortawesome/free-solid-svg-icons'

export const GestionsEmployes = () => {
	const [employes, setEmployes] = useState([])
	const [filteredEmployes, setFilteredEmployes] = useState([])
	const [filter, setFilter] = useState("")
	const [current, setCurrent] = useState(0)
	const [selectedState, setSelectedState] = useState("todos")
	const [selectedEmploye, setSelectedEmploye] = useState(null)
	const [showUpdateModal, setShowUpdateModal] = useState(false) // ✅ NUEVO ESTADO PARA CONTROLAR EL MODAL

	const [empresas, setEmpresas] = useState([])
	const [selectedEmpresa, setSelectedEmpresa] = useState("")
	const [selectedTipoDocumento, setSelectedTipoDocumento] = useState("")
	const [currentPage, setCurrentPage] = useState(1)
	const [totalPages, setTotalPages] = useState(1)
	const [totalItems, setTotalItems] = useState(0)
	const [loading, setLoading] = useState(false)
	const [showReportOptions, setShowReportOptions] = useState(false)
	const [reportType, setReportType] = useState("pdf")
	const [generating, setGenerating] = useState(false)
	const [doneGenerating, setDoneGenerating] = useState(false)
	const [reportContent, setReportContent] = useState(false)
	const [showFilters, setShowFilters] = useState(false)
	const [filters, setFilters] = useState({
		personalData: true,
		presence: true,
		criteria: true
	})

	const pdfContent = useRef()

	const { setShowModalCreateEmployee } = useModal()
	const navigate = useNavigate()
	const userSession =
		JSON.parse(localStorage.getItem("userSession")) || JSON.parse(sessionStorage.getItem("userSession"))

	const isLoggedIn = !!userSession
	const accountType = userSession?.accountType || null
	const isAdmin = accountType === "Administrador" || accountType === "Gestor"

	const fetchEmployes = async (page = 1) => {
		setLoading(true)
		try {
			if (isAdmin) {
				const params = new URLSearchParams({
					page: page.toString(),
					limit: "10",
					search: filter,
					empresaId: selectedEmpresa,
					estado: selectedState === "todos" ? "" : selectedState,
					tipoDocumento: selectedTipoDocumento,
				})

				const response = await axiosInstance.get(`/api/users/admin/empleados?${params}`)
				const data = response.data || {}
				const empleados = data.empleados || []
				setEmployes(empleados)
				setFilteredEmployes(empleados)
				setCurrentPage(data.pagination?.currentPage || 1)
				setTotalPages(data.pagination?.totalPages || 1)
				setTotalItems(data.pagination?.totalItems || 0)
			} else {
				const userSessionString = localStorage.getItem("userSession") || sessionStorage.getItem("userSession")
				if (!userSessionString) {
					Swal.fire({
						icon:"info",
						title:"Error en el sistema",
						text:"No se encontró la sesión de usuario.",
						confirmButtonText:"Okay",
						theme:"bulma",
						customClass: { confirmButton: 'centered-swal-button' }
					})
					return
				}
				const userSession = JSON.parse(userSessionString)
				const empresaId = userSession.empresa_ID

				const response = await axiosInstance.get(`/api/users/empresa/${empresaId}/empleados`)
				const data = response.data || {}
				const empleados = data.empleados || []
				setEmployes(empleados)
				setFilteredEmployes(empleados)
				setSelectedEmploye(empleados[0])
			}
		} catch (error) {
			console.error("Error al obtener los empleados:", error)
			Swal.fire({
				icon:"error",
				title:"Error en el sistema",
				text:"Hubo un problema al cargar los empleados. Por favor, inténtalo más tarde.",
				confirmButtonText:"Okay",
				theme:"bulma",
				customClass: { confirmButton: 'centered-swal-button' }
			})
		} finally {
			setLoading(false)
		}
	}

	const fetchEmpresas = async () => {
		if (!isAdmin) return

		try {
			const response = await axiosInstance.get("/api/users/admin/empresas")
			setEmpresas(response.data.empresas || [])
		} catch (error) {
			console.error("Error al obtener las empresas:", error)
		}
	}

	useEffect(() => {
		fetchEmployes()
		if (isAdmin) {
			fetchEmpresas()
		}
		
		// Exponer función para refrescar desde otros componentes
		window.refreshEmployesList = () => {
			if (isAdmin) {
				fetchEmployes(currentPage)
			} else {
				fetchEmployes()
			}
		}
		
		// Exponer función para actualizar empleado específico
		window.updateSelectedEmploye = (updatedEmploye) => {
			setSelectedEmploye(updatedEmploye)
		}
		
		// Cleanup
		return () => {
			delete window.refreshEmployesList
			delete window.updateSelectedEmploye
		}
	}, [])

	useEffect(() => {
		if (isAdmin) {
			fetchEmployes(1)
		} else {
			applyFilters()
		}
	}, [selectedState, filter, selectedEmpresa, selectedTipoDocumento])

	useEffect(() => {
		if (isAdmin) {
			const timeoutId = setTimeout(() => {
				fetchEmployes(1)
			}, 500)
			return () => clearTimeout(timeoutId)
		}
	}, [filter])

	const applyFilters = () => {
		const filtered = employes.filter(
			(employe) =>
			(employe.nombres || "").toLowerCase().includes(filter.toLowerCase()) ||
			(employe.apellidos || "").toLowerCase().includes(filter.toLowerCase()) ||
				(employe.documento || "").toLowerCase().includes(filter.toLowerCase()) ||
				(employe.email || "").toLowerCase().includes(filter.toLowerCase()),
		)

		const filteredByState = filtered.filter((employe) => {
			const estado = (employe.estado || "").toLowerCase()
			if (selectedState === "todos") return true
			return estado === selectedState
		})

		setFilteredEmployes(filteredByState)
		setCurrent(0)
	}

	const handleFilterChange = (e) => {
		setFilter(e.target.value)
	}

	const handleEmpresaChange = (e) => {
		setSelectedEmpresa(e.target.value)
	}

	const handleTipoDocumentoChange = (e) => {
		setSelectedTipoDocumento(e.target.value)
	}

	const handlePageChange = (newPage) => {
		if (newPage >= 1 && newPage <= totalPages) {
			fetchEmployes(newPage)
		}
	}

	const next = () => {
		if (isAdmin) {
			handlePageChange(currentPage + 1)
		} else {
			setCurrent((prev) => (prev + 1) % filteredEmployes.length)
		}
	}

	const prev = () => {
		if (isAdmin) {
			handlePageChange(currentPage - 1)
		} else {
			setCurrent((prev) => (prev - 1 + filteredEmployes.length) % filteredEmployes.length)
		}
	}

	const showModalCreateEmploye = () => {
		setShowModalCreateEmployee(true)
		setTimeout(() => {
			const modalCreateEmploye = document.getElementById("modal-overlayCreateEmploye")
			if (modalCreateEmploye) {
				modalCreateEmploye.style.display = "flex"
			}
		}, 100)
	}

	// ✅ FUNCIÓN CORREGIDA PARA ABRIR EL MODAL
	const showModalSeeProfile = (employe) => {
		setSelectedEmploye(employe)
		setShowUpdateModal(true) // ✅ Usar estado de React en lugar de manipular el DOM
	}

	// ✅ FUNCIÓN PARA CERRAR EL MODAL
	const handleCloseUpdateModal = () => {
		setShowUpdateModal(false)
		setSelectedEmploye(null)
	}

	const handleInscribeEmployes = () => {
		navigate("/Empleados/InscribirEmpleados")
	}

	const getImageSrcFromBase64 = (imageData) => {
		
		// Si no hay datos de imagen, usar imagen por defecto
		if (!imageData) {
			return "/src/assets/Icons/userDefect.png"
		}
		
		// Si es base64
		if (typeof imageData === 'string') {
			// Verificar si ya es una URL de datos completa
			if (imageData.startsWith("data:")) {
				return imageData // Ya es una URL de datos
			}
			
			// Verificar si es PNG base64
			if (imageData.startsWith("iVBORw0KGgo") || imageData.startsWith("iVBOR")) {
				return `data:image/png;base64,${imageData}`
			}
			
			// Verificar si es JPEG base64
			if (imageData.startsWith("/9j/")) {
				return `data:image/jpeg;base64,${imageData}`
			}
			
			// Verificar si es una cadena muy larga (probablemente base64)
			if (imageData.length > 1000) {
				return `data:image/jpeg;base64,${imageData}`
			}
			
			// Verificar si contiene caracteres base64 válidos
			const base64Regex = /^[A-Za-z0-9+/=]+$/
			if (imageData.length > 50 && base64Regex.test(imageData)) {
				return `data:image/jpeg;base64,${imageData}`
			}
			
			// Si es una ruta de archivo (empieza con ../ o /) - solo después de verificar base64
			if (imageData.startsWith('../') || imageData.startsWith('/')) {
				// Convertir ruta relativa a ruta absoluta
				if (imageData.startsWith('../Img/')) {
					const newPath = imageData.replace('../Img/', '/src/assets/Icons/')
					return newPath
				}
				return imageData
			}
			
			return "/src/assets/Icons/userDefect.png"
		}
		
		return "/src/assets/Icons/userDefect.png"
	}

	const generarReporte = async () => {
		try {
			if (reportType === "pdf") {
				if (!pdfContent.current)
					return
				const worker = html2pdf().set({
					margin: 10,
					filename: `reporte ${selectedEmploye.nombres} ${selectedEmploye.apellidos}.pdf`,
					html2canvas: { scale: 1 },
					jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
				}).from(pdfContent.current)
				setGenerating(false)
				setDoneGenerating(true)
				setReportContent(await worker.output("bloburl"))
			}
		} catch (error) {
			console.log(error)
			Swal.fire({
				icon:"error",
				title:"Error al generar el reporte",
				text:"Ocurrió un error al generar el reporte, intentelo otra vez",
			})
			setDoneGenerating(false)
			setGenerating(false)
		}
	}

	const generarPdf = async () => {
		setGenerating(true)
	}

	return (
		<>
			<Header />
			<Main>
				<div className="gestion-employees-container">
					{/* Header Mejorado */}
					<div className="employees-header-improved">
						<div className="header-content-improved">
							<h1>
								{isAdmin ? "Gestión de " : "Mis "}
								<span className="complementary">Empleados</span>
							</h1>
							<div className="header-stats-improved">
								<div className="stat-item-improved">
									<span className="stat-number">{isAdmin ? totalItems : filteredEmployes.length}</span>
									<span className="stat-label">
										{selectedState === 'activo' ? 'Activos' : 
										 selectedState === 'inactivo' ? 'Inactivos' : 'Total'}
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* Layout Principal - EMPLEADOS EN EL CENTRO */}
					<div className="main-content-improved">
						{/* Sección Principal - EMPLEADOS EN EL CENTRO */}
						<div className="main-employees-section">
							{loading ? (
								<div className="loading-state-improved">
									<div className="loading-spinner-improved"></div>
									<p>Cargando empleados...</p>
								</div>
							) : isAdmin ? (
								<div className="admin-results-improved">
									<div className="results-header-improved">
										<h3>Lista de Empleados</h3>
										<span className="results-count">{totalItems} resultados</span>
									</div>

									{filteredEmployes.length === 0 ? (
										<div className="no-results-improved">
											<div className="no-results-icon">
												<FontAwesomeIcon icon={faFolderOpen} />
											</div>
											<h3>No se encontraron empleados</h3>
											<p>No hay empleados disponibles con los filtros seleccionados</p>
										</div>
									) : (
										<>
											<div className="employees-grid-improved">
												{filteredEmployes.map((employe) => (
													<div key={employe.ID} className="employee-card-improved">
														<div className="employee-image-section-improved">
															<img
																src={getImageSrcFromBase64(employe?.foto_perfil)}
																alt={`${employe.nombres || 'Sin nombre'} ${employe.apellidos || 'Sin apellido'}`}
																className="employee-image-improved"
																onError={(e) => {   
																	e.target.src = "/src/assets/Icons/userDefect.png";
																}}
															/>
															<div className={`status-badge-improved ${employe.estado?.toLowerCase() || 'inactivo'}`}>
																{employe.estado || 'Inactivo'}
															</div>
														</div>
														
														<div className="employee-info-improved">
															<h4>{employe.nombres || "Sin nombre"} {employe.apellidos || "Sin apellido"}</h4>
															<div className="employee-details-improved">
																<div className="detail-item">
																	<FontAwesomeIcon icon={faIdCard} />
																	<span>{employe.documento || "N/A"}</span>
																</div>
																<div className="detail-item">
																	<FontAwesomeIcon icon={faEnvelope} />
																	<span>{employe.email || "N/A"}</span>
																</div>
																{isAdmin && (
																	<div className="detail-item">
																		<FontAwesomeIcon icon={faBuilding} />
																		<span>{employe.Empresa?.nombre_empresa || "Sin empresa"}</span>
																	</div>
																)}
															</div>
														</div>
														
														<button 
															className="profile-btn-improved" 
															onClick={() => showModalSeeProfile(employe)}
														>
															Ver / Editar
														</button>
													</div>
												))}
											</div>

											{totalPages > 1 && (
												<div className="pagination-improved">
													<button 
														className="pagination-btn" 
														disabled={currentPage === 1} 
														onClick={() => handlePageChange(currentPage - 1)}
													>
														❮ Anterior
													</button>
													<span className="pagination-info">
														Página {currentPage} de {totalPages}
													</span>
													<button 
														className="pagination-btn" 
														disabled={currentPage === totalPages} 
														onClick={() => handlePageChange(currentPage + 1)}
													>
														Siguiente ❯
													</button>
												</div>
											)}
										</>
									)}
								</div>
							) : (
								<div className="carousel-section-improved">
									<div className="carousel-panel-improved">
										{filteredEmployes.length === 0 ? (
											<div className="no-employees-improved">
												<div className="no-employees-icon">
													<FontAwesomeIcon icon={faFolderOpen} />
												</div>
												<h3>No se encontraron empleados</h3>
												<p>No hay empleados disponibles con los filtros seleccionados</p>
											</div>
										) : (
											<div className="carousel-content-improved">
												{/* Navegación del Carrusel */}
												{filteredEmployes.length > 1 && (
													<div className="carousel-navigation">
														<button className="carousel-arrow-improved left" onClick={prev}>
															❮
														</button>
														<button className="carousel-arrow-improved right" onClick={next}>
															❯
														</button>
													</div>
												)}

												{/* Carrusel de Empleados */}
												<div className="carousel-track-improved">
													{filteredEmployes.length === 1 ? (
														<div className="instructor-card-improved card-center-improved">
															<div className="instructor-image-container">
																<img
																	src={getImageSrcFromBase64(filteredEmployes[0]?.foto_perfil)}
																	alt="Employe"
																	className="instructor-image-improved"
																	onError={(e) => (e.target.src = "/src/assets/Icons/userDefect.png")}
																/>
																<div className={`status-badge ${filteredEmployes[0]?.estado?.toLowerCase() || 'inactivo'}`}>
																	{filteredEmployes[0]?.estado || 'Inactivo'}
																</div>
															</div>
														</div>
													) : filteredEmployes.length === 2 ? (
														[0].map((offset) => {
															const index = (current + offset) % filteredEmployes.length
															const employe = filteredEmployes[index]
															return (
																<div className="instructor-card-improved card-center-improved" key={index}>
																	<div className="instructor-image-container">
																		<img
																			src={getImageSrcFromBase64(employe?.foto_perfil)}
																			alt="Employe"
																			className="instructor-image-improved"
																			onError={(e) => (e.target.src = "/src/assets/Icons/userDefect.png")}
																		/>
																		<div className={`status-badge ${employe?.estado?.toLowerCase() || 'inactivo'}`}>
																			{employe?.estado || 'Inactivo'}
																		</div>
																	</div>
																</div>
															)
														})
													) : (
														[0, 1, 2].map((offset) => {
															const index = (current + offset) % filteredEmployes.length
															const employe = filteredEmployes[index]
															const positionClass = offset === 1 ? "card-center-improved" : "card-side-improved"
															return (
																<div className={`instructor-card-improved ${positionClass}`} key={index}>
																	<div className="instructor-image-container">
																		<img
																			src={getImageSrcFromBase64(employe?.foto_perfil)}
																			alt="Employe"
																			className="instructor-image-improved"
																			onError={(e) => (e.target.src = "/src/assets/Icons/userDefect.png")}
																		/>
																		<div className={`status-badge ${employe?.estado?.toLowerCase() || 'inactivo'}`}>
																			{employe?.estado || 'Inactivo'}
																		</div>
																	</div>
																	{offset === 1 && (
																		<div className="instructor-mini-info">
																			<h4>{employe.nombres} {employe.apellidos}</h4>
																		</div>
																	)}
																</div>
															)
														})
													)}
												</div>

												{/* Información del Empleado Central */}
												{filteredEmployes.length > 0 && (
													<div className="instructor-info-improved">
														<div className="instructor-details-card">
															<h3>
																{filteredEmployes[(current + 1) % filteredEmployes.length]?.nombres}{" "}
																{filteredEmployes[(current + 1) % filteredEmployes.length]?.apellidos}
															</h3>
															
															<div className="instructor-contact-info">
																<div className="contact-item">
																	<FontAwesomeIcon icon={faIdCard} />
																	<span>Documento: {filteredEmployes[(current + 1) % filteredEmployes.length]?.documento}</span>
																</div>
																<div className="contact-item">
																	<FontAwesomeIcon icon={faEnvelope} />
																	<span>Email: {filteredEmployes[(current + 1) % filteredEmployes.length]?.email}</span>
																</div>
															</div>

															<div className="action-buttons">
																<button
																	className="view-profile-btn-improved"
																	onClick={() => showModalSeeProfile(filteredEmployes[(current + 1) % filteredEmployes.length])}
																>
																	Ver Perfil Completo
																</button>
																{(accountType === "Administrador" || accountType === "Empresa" || accountType === "Instructor") && (
																	<button
																		className="report-btn-improved"
																		onClick={() => setShowReportOptions(true)}
																	>
																		<FontAwesomeIcon icon={faFileAlt} />
																		Generar Reporte
																	</button>
																)}
															</div>
														</div>
													</div>
												)}

												{/* Indicador de Posición */}
												{filteredEmployes.length > 1 && (
													<div className="carousel-indicator-improved">
														<span className="current-position">
															{current + 1} de {filteredEmployes.length}
														</span>
													</div>
												)}
											</div>
										)}
									</div>
								</div>
							)}
						</div>

						{/* Panel de Control Derecho */}
						<div className="control-panel-improved">
							<div className="filters-card-improved">
								<h3>
									<FontAwesomeIcon icon={faFilter} />
									Filtros y Búsqueda
								</h3>
								
								<div className="search-container-improved">
									<div className="input-search-improved">
										<FontAwesomeIcon icon={faSearch} className="search-icon" />
										<input
											type="text"
											placeholder="Buscar empleado..."
											value={filter}
											onChange={handleFilterChange}
											className="search-input"
										/>
									</div>
								</div>

								{isAdmin && (
									<>
										<div className="filter-group">
											<label>Empresa</label>
											<select
												value={selectedEmpresa}
												onChange={handleEmpresaChange}
												className="filter-select-improved"
											>
												<option value="">Todas las empresas</option>
												{empresas.map((empresa) => (
													<option key={empresa.ID} value={empresa.ID}>
														{empresa.nombre_empresa}
													</option>
												))}
											</select>
										</div>

										<div className="filter-group">
											<label>Tipo de Documento</label>
											<select
												value={selectedTipoDocumento}
												onChange={handleTipoDocumentoChange}
												className="filter-select-improved"
											>
												<option value="">Todos los tipos</option>
												<option value="CedulaCiudadania">Cédula de Ciudadanía</option>
												<option value="TarjetaIdentidad">Tarjeta de Identidad</option>
												<option value="PPT">Pasaporte</option>
												<option value="CedulaExtranjeria">Cédula de Extranjería</option>
											</select>
										</div>
									</>
								)}

								<div className="filter-group">
									<label>Estado del Empleado</label>
									<div className="status-filters-improved">
										{["todos", "activo", "inactivo"].map((op) => (
											<button
												key={op}
												className={`status-filter-btn ${selectedState === op ? 'active' : ''}`}
												onClick={() => setSelectedState(op)}
											>
												<span className={`status-indicator ${op}`}></span>
												{op === 'todos' ? 'Todos' : op === 'activo' ? 'Activos' : 'Inactivos'}
											</button>
										))}
									</div>
								</div>

								<button className="create-employee-btn-improved" onClick={showModalCreateEmploye}>
									<FontAwesomeIcon icon={faUserPlus} />
									<span>Agregar Empleado</span>
								</button>

								<button className="inscribe-employees-btn-improved" onClick={handleInscribeEmployes}>
									<FontAwesomeIcon icon={faUsers} />
									<span>Inscribir a Cursos</span>
								</button>
							</div>

							{/* Estadísticas */}
							<div className="stats-card-improved">
								<h3>
									<FontAwesomeIcon icon={faChartLine} />
									Estadísticas
								</h3>
								<div className="stats-grid-improved">
									<div className="stat-card-improved">
										<div className="stat-icon">
											<FontAwesomeIcon icon={faUsers} />
										</div>
										<div className="stat-content">
											<span className="stat-value">{isAdmin ? totalItems : employes.length}</span>
											<span className="stat-label">Total Empleados</span>
										</div>
									</div>
									<div className="stat-card-improved">
										<div className="stat-icon">
											<FontAwesomeIcon icon={faCheck} />
										</div>
										<div className="stat-content">
											<span className="stat-value">
												{employes.filter(e => e.estado?.toLowerCase() === 'activo').length}
											</span>
											<span className="stat-label">Activos</span>
										</div>
									</div>
									<div className="stat-card-improved">
										<div className="stat-icon">
											<FontAwesomeIcon icon={faBuilding} />
										</div>
										<div className="stat-content">
											<span className="stat-value">
												{isAdmin ? new Set(employes.map(e => e.empresa_ID)).size : 1}
											</span>
											<span className="stat-label">Empresas</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</Main>

			{/* ✅ MODAL CORREGIDO - CONTROLADO POR ESTADO */}
			{showUpdateModal && selectedEmploye && (
				<UpdateEmploye 
					empleado={selectedEmploye} 
					onClose={handleCloseUpdateModal}
				/>
			)}
			
			{/* Modal de Reportes */}
			{showReportOptions && (
				<div className="modal-overlay">
					<div
						className="modal-background"
						style={{
							height: "fit-content",
							paddingBottom: "20px",
							width: "35%",
						}}
					>
						<div className="container_return_EditCalendar">
							<h5
								onClick={() =>
									setShowReportOptions(false)
								}
								style={{ cursor: "pointer" }}
							>
								Volver
							</h5>
							<button
								onClick={() =>
									setShowReportOptions(false)
								}
								className="closeModal"
							></button>
						</div>
						<h2 className="modal-title-edit-calendar">
							Tipo de reporte
						</h2>
						<div
							className="statusButtons"
							style={{
								width: "90%",
							}}
						>
							<button
								className={`status-btn ${
									reportType == "pdf" && "selected"
								}`}
								onClick={() => setReportType("pdf")}
							>
								PDF
							</button>
							<button
								className={`status-btn ${
									reportType == "excel" && "selected"
								}`}
								onClick={() => setReportType("excel")}
							>
								Excel
							</button>
						</div>
						{reportType === "excel" ?
							<button
								className="button"
								style={{
									marginTop: "20px",
								}}
								onClick={() => generarExcelEmpleado(selectedEmploye, () => setShowReportOptions(false), filters)}
							>Descargar reporte</button>
						:
							<>
								<button
									className="button"
									style={{
										marginTop: "20px",
									}}
									onClick={() => generarPdf()}
								>Generar reporte</button>
								{generating &&
									<ReportEmployee
										contentKey={pdfContent}
										empleado={selectedEmploye}
										done={() => {
											generarReporte()
										}}
										filters={filters}
									/>
								}
							</>
						}
						{doneGenerating && reportType === "pdf" && (
							<a
								className="button"
								href={reportContent}
								target="_blank"
								rel="noopener noreferrer"
								style={{
									marginTop: "20px",
									textDecoration: "none"
								}}
							>Descargar</a>
						)}
						<button
							className="filtersButtonEmployee"
							onClick={() => setShowFilters(!showFilters)}
						>Filtros {!showFilters ? <>&#x25BC;</> : <>&#x25B2;</>}</button>
						{showFilters && (
							<div
								className="filterListEmployeeReport"
							>
								<div>
									<input
										type="checkbox"
										className="employee-checkbox"
										style={{marginRight: "5px"}}
										checked={filters.personalData}
										onChange={() => setFilters({...filters, personalData: !filters.personalData})}
									/>
									<label
										className="checkbox-label"
									>Incluir datos personales</label><br/>
								</div>
								<div>
									<input
										type="checkbox"
										className="employee-checkbox"
										style={{marginRight: "5px"}}
										checked={filters.presence}
										onChange={() => setFilters({...filters, presence: !filters.presence})}
									/>
									<label
										className="checkbox-label"
									>Incluir asistencias</label><br/>
								</div>
								<div>
									<input
										type="checkbox"
										className="employee-checkbox"
										style={{marginRight: "5px"}}
										checked={filters.criteria}
										onChange={() => setFilters({...filters, criteria: !filters.criteria})}
									/>
									<label
										className="checkbox-label"
									>Incluir criterios de certificación de cada curso</label><br/>
								</div>
							</div>
						)}
					</div>
				</div>
			)}
			<Footer />
		</>
	)
}