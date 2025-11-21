import { useState, useEffect } from "react";
import { Header } from "../../Layouts/Header/Header";
import { Main } from "../../Layouts/Main/Main";
import "./GestionsActas.css";
import { Footer } from "../../Layouts/Footer/Footer";
import axiosInstance from "../../../config/axiosInstance";
import seePasswordIcon from "../../../assets/Icons/seePassword.png";
import { useModal } from "../../../Context/ModalContext";
import { NavLink, useNavigate } from "react-router-dom";
import { Modal_General } from '../../UI/Modal_General/Modal_General';
import agregarArchivo from '../../../assets/Icons/agregar-archivo.png';
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFileAlt, faFilePdf, faUpload, faCalendarAlt, faFilter, faArrowLeft, faEye } from '@fortawesome/free-solid-svg-icons';

const categoriasDisponibles = [
	'Solicitud', 'Concertacion', 'Lugar_formacion', 'Matricula'
];
const estadosDisponibles = ['pendiente', 'aprobada', 'rechazada'];

export const GestionsActas = () => {
	const [actas, setActas] = useState([]);
	const [actasOriginales, setActasOriginales] = useState([]);
	const [filtro, setFiltro] = useState("");
	const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([]);
	const [estadosSeleccionados, setEstadosSeleccionados] = useState([]);
	const [usuarioLogueado, setUsuarioLogueado] = useState(null);
	const { setShowModalGeneral, setModalGeneralContent } = useModal();
	const [showTipoActaModal, setShowTipoActaModal] = useState(false);
	const [tipoActaSeleccionada, setTipoActaSeleccionada] = useState(null);
	const [fechaInicio, setFechaInicio] = useState("");
	const [fechaFin, setFechaFin] = useState("");
	const [observation, setObservation] = useState()
	const [selectedActa, setSelectedActa] = useState()
	const [newState, setNewState] = useState("")
	const navigate = useNavigate();

	useEffect(() => {
		const fetchActas = async () => {
			try {
				const res = await axiosInstance.get("/api/actas/actas");
				setActasOriginales(res.data);

				const userData = JSON.parse(sessionStorage.getItem('userSession') || '{}');

				if (userData.accountType === 'Administrador' || userData.accountType === "Gestor") {
					setActas(res.data);
				} else if (userData.accountType === 'Instructor') {
					const actasDelInstructor = res.data.filter(acta =>
						acta.instructor_ID === userData.id || acta.instructorId === userData.id
					);
					setActas(actasDelInstructor);
				} else {
					setActas([]);
				}

			} catch (error) {
				setActas([]);
				setActasOriginales([]);
				console.error("Error al cargar actas:", error);
				await Swal.fire({
					icon: "error",
					title: "Error al cargar actas",
					text: "Ha ocurrido un error al cargar el acta, por favor vuelva a intentarlo más tarde",
					confirmButtonText: "Entendido",
					confirmButtonColor: "#d33",
					theme: "bulma",
					customClass: { confirmButton: 'centered-swal-button' }
				});
			}
		};

		const obtenerUsuarioLogueado = async () => {
			try {
				const userData = JSON.parse(sessionStorage.getItem('userSession') || '{}');
				setUsuarioLogueado(userData);
			} catch (error) {
				console.error('Error al obtener datos del usuario:', error);
				await Swal.fire({
					icon: 'error',
					title: 'Error de sesión',
					text: 'No se pudieron cargar los datos del usuario. Por favor, inicie sesión nuevamente.',
					confirmButtonColor: '#d33',
					theme: "bulma",
					customClass: { confirmButton: 'centered-swal-button' }
				});
				setUsuarioLogueado(null);
			}
		};

		obtenerUsuarioLogueado();
		fetchActas();
	}, []);

	const esAdministrador = () => {
		return usuarioLogueado && usuarioLogueado.accountType === 'Administrador';
	};

	const esGestor = () => {
		return usuarioLogueado && usuarioLogueado.accountType === 'Gestor';
	};

	const esInstructor = () => {
		return usuarioLogueado && usuarioLogueado.accountType === 'Instructor';
	};

	const handleCategoriaClick = (categoria) => {
		setCategoriasSeleccionadas((prev) =>
			prev.includes(categoria)
				? prev.filter((cat) => cat !== categoria)
				: [...prev, categoria]
		);
	};

	const handleEstadoClick = (estado) => {
		setEstadosSeleccionados((prev) =>
			prev.includes(estado)
				? prev.filter((e) => e !== estado)
				: [...prev, estado]
		);
	};

	// Filtrar actas basado en todos los criterios
	const actasFiltradas = actas.filter((acta) => {
		const idMatch = filtro === "" || String(acta.ID).includes(filtro);
		const estadoMatch = estadosSeleccionados.length === 0 || estadosSeleccionados.includes(acta.estado_acta);
		const categoriaMatch = categoriasSeleccionadas.length === 0 || categoriasSeleccionadas.includes(acta.tipo_acta);
		const dateMatch = !fechaInicio && !fechaFin || (acta.fecha_acta >= fechaInicio && acta.fecha_acta <= fechaFin);
		return idMatch && estadoMatch && categoriaMatch && dateMatch;
	});

	const handleVerOpcionesPDF = (acta) => {
		if (!newState)
			setNewState(acta.estado_acta)
		if (!observation && acta.observacion)
			setObservation(acta.observacion)

		setSelectedActa(acta)

		const handleChangeEstado = async () => {
			if (!esAdministrador()) {
				await Swal.fire({
					icon: "info",
					title: "No tiene permiso",
					text: "Solo los administradores pueden cambiar el estado del acta",
					confirmButtonText: "Okay",
					confirmButtonColor: "#3085d6",
					timer: 3500,
					timerProgressBar: true,
					theme: "bulma",
					customClass: { confirmButton: 'centered-swal-button' }
				});
				return;
			}

			try {
				const userData = JSON.parse(sessionStorage.getItem('userSession') || '{}');
				const respo = await axiosInstance.put(`/api/actas/${acta.ID}/estado`, { estado_acta: newState, observacion: observation });
				const updatedEstado = respo.data.acta;
				setNewState()
				setObservation()
				try {
					const response = await axiosInstance.post('/api/notifications/solicitudNotificacion', {
						remitente_ID: userData.id,
						actaID: acta.ID,
						estado: updatedEstado,
					})
					await Swal.fire({
						icon: "success",
						title: "¡Éxito!",
						text: "Notificación de estado de solicitud de curso enviada correctamente",
						confirmButtonText: "Entiendo",
						confirmButtonColor: "#00843d",
						timer: 5000,
						timerProgressBar: true,
						theme: "bulma",
						customClass: { confirmButton: 'centered-swal-button' }
					});
				} catch (error) {
					console.error('Error al enviar notificación de estado de solicitud de curso:', error);
					await Swal.fire({
						icon: "error",
						title: "Error al enviar notificación",
						text: "Ha ocurrido un error al enviar una notificación de estado de solicitud de curso, por favor, intentelo más tarde.",
						confirmButtonText: "Okay",
						confirmButtonColor: "#d33",
						theme: "bulma",
						customClass: { confirmButton: 'centered-swal-button' }
					});
				}
				setShowModalGeneral(false);
				window.location.reload();
			} catch (error) {
				await Swal.fire({
					icon: "error",
					title: "Error",
					text: "Error al actualizar el estado del acta",
					confirmButtonColor: "#d33",
					theme: "bulma",
					customClass: { confirmButton: 'centered-swal-button' }
				});
			}
		};

		setModalGeneralContent(
			<div className="modal-actas-overlay">
				<div className="modal-actas-container">
					<div className="modal-actas-header">
						<div className="modal-actas-header-content">
							<h2>
								<FontAwesomeIcon icon={faFileAlt} className="modal-actas-header-icon" />
								Opciones del Acta #{acta.ID}
							</h2>
							<button
								type="button"
								onClick={() => setShowModalGeneral(false)}
								className="modal-actas-close-btn"
							>
								<FontAwesomeIcon icon={faArrowLeft} />
								<span>Volver</span>
							</button>
						</div>
					</div>

					<div className="modal-actas-body">
						<div className="modal-actas-content">
							<div className="modal-actas-options">
								<NavLink
									to="#"
									onClick={e => {
										e.preventDefault();
										const baseUrl = acta.tipo_acta === 'Solicitud'
											? 'http://localhost:3001/uploads/solicitudes'
											: 'http://localhost:3001/uploads/documentos';
										window.open(`${baseUrl}/${acta.pdf_acta}`, "_blank");
									}}
									className="modal-actas-btn"
								>
									<FontAwesomeIcon icon={faFileAlt} className="btn-icon" />
									Ver Acta
								</NavLink>
								<NavLink
									to="#"
									onClick={e => {
										e.preventDefault();
										if (acta.pdf_radicado) {
											const baseUrl = acta.tipo_acta === 'Solicitud'
												? 'http://localhost:3001/uploads/solicitudes'
												: 'http://localhost:3001/uploads/documentos';
											window.open(`${baseUrl}/${acta.pdf_radicado}`, "_blank");
										}
									}}
									className="modal-actas-btn"
									style={{
										opacity: acta.pdf_radicado ? 1 : 0.5,
										pointerEvents: acta.pdf_radicado ? "auto" : "none",
									}}
								>
									<FontAwesomeIcon icon={faFilePdf} className="btn-icon" />
									Ver Radicado
								</NavLink>
								<label className="modal-actas-upload-label">
									<FontAwesomeIcon icon={faUpload} className="btn-icon" />
									Subir PDF Radicado
									<input
										type="file"
										accept="application/pdf"
										className="modal-actas-upload-input"
										onChange={e => {
											const file = e.target.files[0];
											if (file) {
												handleUploadRadicado(acta.ID, file);
											}
										}}
									/>
								</label>

								{esAdministrador() && (
									<div className="modal-actas-change-state-section">
										<label className="modal-actas-state-label">
											Cambiar estado del acta:
										</label>
										<select
											value={newState}
											onChange={e => { setNewState(e.target.value) }}
											className="modal-actas-state-select"
										>
											<option value="pendiente">Pendiente</option>
											<option value="aprobada">Aprobada</option>
											<option value="rechazada">Rechazada</option>
										</select>
										{newState !== "pendiente" &&
											<>
												<label className="modal-actas-observation-label">
													Observación
												</label>
												<textarea
													className="modal-actas-observation-textarea"
													placeholder="Escriba aquí una observación respecto al acta..."
													value={observation}
													onChange={(e) => {
														setObservation(e.target.value)
													}}
												/>
											</>
										}
										<button
											onClick={handleChangeEstado}
											className="modal-actas-save-state-btn"
										>
											Guardar Estado
										</button>
									</div>
								)}

								{!esAdministrador() && (
									<>
										<div className="modal-actas-info-message">
											Solo los administradores pueden cambiar el estado del acta
										</div>
										{acta.observacion && (
											<div className="modal-actas-observation-display">
												<b>Observación:</b>
												<p>{acta.observacion}</p>
											</div>
										)}
									</>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		);
		setShowModalGeneral(true);
	};

	const handleUploadRadicado = async (actaId, file) => {
		const formData = new FormData();
		formData.append('pdf', file);

		try {
			await axiosInstance.post(`/api/actas/${actaId}/upload-radicado`, formData, {
				headers: { 'Content-Type': 'multipart/form-data' }
			});
			await Swal.fire({
				icon: "success",
				title: "¡Éxito!",
				text: "PDF radicado subido correctamente",
				confirmButtonColor: "#3085d6",
				timer: 3000,
				timerProgressBar: true,
				theme: "bulma",
				customClass: { confirmButton: 'centered-swal-button' }
			});

			setShowModalGeneral(false);
			window.location.reload();
		} catch (error) {
			await Swal.fire({
				icon: "error",
				title: "Error",
				text: "Error al subir el PDF radicado",
				confirmButtonColor: "#d33",
				theme: "bulma",
				customClass: { confirmButton: 'centered-swal-button' }
			});
		}
	};

	useEffect(() => {
		if (selectedActa)
			handleVerOpcionesPDF(selectedActa)
	}, [newState, selectedActa, observation])

	return (
		<>
			<Header />
			<Main>
				<div className="gestions-actas-container">
					{/* Header Principal */}
					<div className="actas-header">
						<div className="header-content">
							<h1 className="main-title">
								Gestión de <span className="accent-text">Actas</span>
							</h1>
							<p className="subtitle">
								Administra y consulta las <strong>actas</strong> del sistema
							</p>
						</div>

						<div className="header-stats">
							<div className="stat-card">
								<span className="stat-number">{actasFiltradas.length}</span>
								<span className="stat-label">Actas Encontradas</span>
							</div>
						</div>
					</div>

					{/* Panel de Búsqueda y Filtros */}
					<div className="search-panel">
						<div className="search-section">
							<div className="search-input-container">
								<FontAwesomeIcon icon={faSearch} className="search-icon-left" />
								<input
									type="text"
									className="search-input"
									placeholder="Buscar por ID del acta..."
									value={filtro}
									onChange={(e) => setFiltro(e.target.value)}
								/>
							</div>
						</div>

						<div className="filters-section-actas">
							<div className="filter-dates-group">
								<div className="filter-group">
									<label className="filter-label">
										<FontAwesomeIcon icon={faCalendarAlt} className="filter-icon" />
										Fecha Inicio
									</label>
									<input
										type="date"
										className="filter-date-input"
										value={fechaInicio}
										onChange={(e) => setFechaInicio(e.target.value)}
									/>
								</div>
								<div className="filter-group">
									<label className="filter-label">
										<FontAwesomeIcon icon={faCalendarAlt} className="filter-icon" />
										Fecha Fin
									</label>
									<input
										type="date"
										className="filter-date-input"
										value={fechaFin}
										onChange={(e) => setFechaFin(e.target.value)}
									/>
								</div>
							</div>

							<div className="filter-group">
								<label className="filter-label">
									<FontAwesomeIcon icon={faFilter} className="filter-icon" />
									Estado del Acta
								</label>
								<div className="filter-chips-container">
									{estadosDisponibles.map((estado) => (
										<button
											key={estado}
											className={`filter-chip ${estadosSeleccionados.includes(estado) ? "selected" : ""}`}
											onClick={() => handleEstadoClick(estado)}
										>
											{estado}
										</button>
									))}
								</div>
							</div>

							<div className="filter-group">
								<label className="filter-label">
									<FontAwesomeIcon icon={faFilter} className="filter-icon" />
									Tipo de Acta
								</label>
								<div className="filter-chips-container">
									{categoriasDisponibles.map((categoria) => (
										<button
											key={categoria}
											className={`filter-chip ${categoriasSeleccionadas.includes(categoria) ? "selected" : ""}`}
											onClick={() => handleCategoriaClick(categoria)}
										>
											{categoria.replaceAll("_", " ")}
										</button>
									))}
								</div>
							</div>
						</div>

						{/* Botón Generar Acta */}
						{(esInstructor() || esAdministrador() || esGestor()) && (
							<div className="generate-acta-section">
								<button
									className="generate-acta-btn"
									onClick={() => setShowTipoActaModal(true)}
								>
									<FontAwesomeIcon icon={faFileAlt} className="btn-icon" />
									Generar Nueva Acta
								</button>
							</div>
						)}
					</div>

					{/* Estados de Carga y Resultados */}
					{actas.length === 0 ? (
						<div className="no-results-state">
							<div className="no-results-icon">📋</div>
							<h3>No hay actas registradas</h3>
							<p>No se han encontrado actas en el sistema.</p>
						</div>
					) : actasFiltradas.length === 0 ? (
						<div className="no-results-state">
							<div className="no-results-icon">🔍</div>
							<h3>No se encontraron actas</h3>
							<p>No hay actas que coincidan con los filtros aplicados.</p>
							<button
								className="reset-filters-btn"
								onClick={() => {
									setFiltro("");
									setCategoriasSeleccionadas([]);
									setEstadosSeleccionados([]);
									setFechaInicio("");
									setFechaFin("");
								}}
							>
								Mostrar todas las actas
							</button>
						</div>
					) : (
						<div className="results-section">
							{/* Header de Resultados */}
							<div className="results-header">
								<h2 className="results-title">
									{actasFiltradas.length === 1 ? "1 acta encontrada" : `${actasFiltradas.length} actas encontradas`}
								</h2>
							</div>

							{/* Grid de Actas */}
							<div className="actas-grid-container">
								<div className="actas-grid">
									{actasFiltradas.map((acta, index) => (
										<div
											className="acta-card"
											key={acta.ID || acta.id}
										>
											<div className="card-header-acta">
												<div className={`acta-badge estado-${acta.estado_acta}`}>
													{acta.estado_acta || "Sin estado"}
												</div>
												<span className="acta-date">
													{acta.fecha_acta?.slice(0, 10)}
												</span>
											</div>

											<div className="card-content-acta">
												<h3 className="acta-title">Acta #{acta.ID}</h3>
												<p className="acta-type">
													Tipo: {acta.tipo_acta.replaceAll("_", " ")}
												</p>

												<div className="acta-actions">
													<button
														className="view-acta-btn"
														onClick={() => {
															setNewState()
															setObservation()
															handleVerOpcionesPDF(acta)
														}}
													>
														<FontAwesomeIcon icon={faEye} className="btn-icon" />
														Ver Detalles
													</button>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					)}
				</div>
			</Main>
			<Footer />

			{/* Modal Tipo Acta */}
			{showTipoActaModal && (
				<Modal_General closeModal={() => setShowTipoActaModal(false)}>
					<div className="modal-actas-overlay">
						<div className="modal-actas-container">
							<div className="modal-actas-header">
								<div className="modal-actas-header-content">
									<h2>
										<FontAwesomeIcon icon={faFileAlt} className="modal-actas-header-icon" />
										Seleccione el tipo de acta
									</h2>
									<button
										type="button"
										onClick={() => setShowTipoActaModal(false)}
										className="modal-actas-close-btn"
									>
										<FontAwesomeIcon icon={faArrowLeft} />
										<span>Volver</span>
									</button>
								</div>
							</div>

							<div className="modal-actas-body">
								<div className="modal-acta-type-content">
									<div className="modal-acta-type-options">
										<div
											className="modal-acta-type-option"
											onClick={() => {
												setTipoActaSeleccionada('concertacion');
												setShowTipoActaModal(false);
												navigate('/Actas/Concertacion');
											}}
										>
											<div className="modal-acta-type-icon-container">
												<FontAwesomeIcon icon={faFileAlt} className="modal-acta-type-icon" />
											</div>
											<p>Concertación</p>
										</div>
										<div
											className="modal-acta-type-option"
											onClick={() => {
												setTipoActaSeleccionada('lugar-formacion');
												setShowTipoActaModal(false);
												navigate('/Actas/Lugar-formacion');
											}}
										>
											<div className="modal-acta-type-icon-container">
												<FontAwesomeIcon icon={faFileAlt} className="modal-acta-type-icon" />
											</div>
											<p>Lugar de Formación</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</Modal_General>
			)}
		</>
	);
};