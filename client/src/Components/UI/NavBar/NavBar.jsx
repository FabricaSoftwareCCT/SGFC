"use client"

import { useState, useRef, useEffect } from "react"
import "./NavBar.css"
import { useNavigate, NavLink } from "react-router-dom"
import axiosInstance from "../../../config/axiosInstance"
import { API_URL } from "../../../config/env"
import noRead from "../../../assets/Icons/mensaje-no-leido.png"
import ifRead from "../../../assets/Icons/mensaje-leido.png"
import { useModal } from "../../../Context/ModalContext"
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faArrowLeft,
	faTimes,
	faCog,
	faBell,
	faUser,
	faSignOutAlt,
	faSearch,
	faFilter,
	faCalendarAlt,
	faCommentAlt,
	faFileAlt,
	faChevronDown,
	faChevronUp,
	faBars,
	faTimesCircle
} from '@fortawesome/free-solid-svg-icons'

export const NavBar = ({ children, setShowSignIn }) => {
	const navigate = useNavigate()
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
	const [notificationsList, setNotificationsList] = useState([])
	const [loadingNotifications, setLoadingNotifications] = useState(false)
	const [justifying, setJustifying] = useState(false)
	const [processingInvitation, setProcessingInvitation] = useState(null)
	const [processingSolicitud, setProcessingSolicitud] = useState(null)
	const [justificationDenial, setJustificationDenial] = useState("")
	const [activeNotification, setActiveNotification] = useState(null)
	const [Filter, setFilter] = useState("All")
	const [filteredNotifications, setFilteredNotifications] = useState([]);
	const [inputElement, setInputElement] = useState("")
	const [Date, setDate] = useState("")
	const [DateEnd, setDateEnd] = useState("")
	const [showSettingsMenu, setShowSettingsMenu] = useState(false)
	const [showNotificationsMenu, setShowNotificationsMenu] = useState(false)
	const [isMobileView, setIsMobileView] = useState(false)
	const settingsMenuRef = useRef(null)
	const settingsButtonRef = useRef(null)
	const notificationsMenuRef = useRef(null)
	const mobileMenuRef = useRef(null)

	const userSession =
		JSON.parse(localStorage.getItem("userSession")) || JSON.parse(sessionStorage.getItem("userSession"))

	const isLoggedIn = !!userSession

	// Detectar tamaño de pantalla
	useEffect(() => {
		const checkMobile = () => {
			setIsMobileView(window.innerWidth <= 768)
		}

		checkMobile()
		window.addEventListener('resize', checkMobile)

		return () => {
			window.removeEventListener('resize', checkMobile)
		}
	}, [])

	const handleProfileClick = () => {
		if (userSession?.id) {
			navigate("/MiPerfil", { state: { userId: userSession.id } });
			setIsMobileMenuOpen(false);
			setShowNotificationsMenu(false);
			setShowSettingsMenu(false);
		}
	};

	const handleLogout = async () => {
		try {
			const response = await axiosInstance.post(
				"/api/users/logout",
				{},
				{
					withCredentials: true,
					headers: {
						"Content-Type": "application/json",
					},
				},
			)

			if (response.status === 200) {
				localStorage.removeItem("userSession")
				sessionStorage.removeItem("userSession")
				navigate("/")
				setIsMobileMenuOpen(false)
			}
		} catch (error) {
			// console.error("Error al cerrar sesión:", error)
			localStorage.removeItem("userSession")
			sessionStorage.removeItem("userSession")
			navigate("/")
			setIsMobileMenuOpen(false)
		}
		setIsMobileMenuOpen(false);
		setShowNotificationsMenu(false);
		setShowSettingsMenu(false);
	}

	const handleSignIn = () => {
		setShowSignIn(true)
		setIsMobileMenuOpen(false)
	}

	useEffect(() => {
		const handleClickOutside = (event) => {
			// Verificar si el clic fue en el botón hamburguesa
			const hamburgerBtn = event.target.closest('.hamburger-btn');
			if (hamburgerBtn) {
				// El botón ya maneja su propio toggle, no hacer nada aquí
				return;
			}

			// En móvil, cerrar menús si se hace clic fuera
			if (isMobileView && isMobileMenuOpen) {
				// Verificar si el clic fue dentro del menú móvil
				if (mobileMenuRef.current && mobileMenuRef.current.contains(event.target)) {
					return; // No hacer nada si el clic fue dentro del menú móvil
				}
				// Si el clic fue fuera del menú móvil, cerrarlo todo
				setIsMobileMenuOpen(false);
				setShowNotificationsMenu(false);
				setShowSettingsMenu(false);
				return;
			}

			// Comportamiento para escritorio
			if (!isMobileView) {
				// Cerrar menú de notificaciones si se hace clic fuera
				if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(event.target)) {
					const notificationButton = event.target.closest('.btn-notifications');
					if (!notificationButton) {
						setShowNotificationsMenu(false);
					}
				}

				// Cerrar menú de configuración si se hace clic fuera
				if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target) &&
					settingsButtonRef.current && !settingsButtonRef.current.contains(event.target)) {
					setShowSettingsMenu(false);
				}
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [isMobileView, isMobileMenuOpen]);

	const fetchNotifications = async () => {
		if (!isLoggedIn) return

		setLoadingNotifications(true)
		try {
			const res = await axiosInstance.get('/api/notifications?limit=5');
			res.data.notifications = res.data.notifications.filter(notif => notif.estado !== 'aceptada' && notif.estado !== 'rechazada' && notif.estado !== 'leida');
			setNotificationsList(res.data.notifications || []);
			setFilteredNotifications(res.data.notifications || []);
		} catch (err) {
			setNotificationsList([])
			setFilteredNotifications([])
		}
		setLoadingNotifications(false)
	}

	useEffect(() => {
		if (!isLoggedIn) return
		if (!showNotificationsMenu) return

		fetchNotifications()
	}, [showNotificationsMenu, isLoggedIn])

	const { setShowModalGeneral, setModalGeneralContent } = useModal()

	const rechazarSolicitudCurso = async (notif) => {
		if (justificationDenial.length < 1) {
			await Swal.fire({
				icon: 'warning',
				title: 'Justificación requerida',
				text: 'Se debe justificar el rechazo',
				confirmButtonText: 'Entendido',
				theme: "bulma",
				customClass: { confirmButton: 'centered-swal-button' }
			})
			return
		}
		setProcessingSolicitud(true)
		try {
			const resp = await axiosInstance.post(`/api/actas/rechazar-solicitud-curso/${notif.ID}`, {
				justification: justificationDenial
			})
			if (resp.status == 200) {
				await Swal.fire({
					icon: 'success',
					title: 'Solicitud rechazada',
					text: 'Se rechazó la solicitud correctamente',
					confirmButtonText: 'Aceptar',
					theme: "bulma",
					customClass: { confirmButton: 'centered-swal-button' }
				})
				setShowModalGeneral(false)
				setProcessingSolicitud(false)
				setJustificationDenial("")
				setActiveNotification(null)
				setJustifying(false)
				fetchNotifications()
				return
			} else
				throw resp.data
		} catch (error) {
			await Swal.fire({
				icon: 'error',
				title: 'Error',
				text: 'Ocurrió un error al rechazar la solicitud',
				confirmButtonText: 'Aceptar',
				theme: "bulma",
				customClass: { confirmButton: 'centered-swal-button' }
			})
			// console.error(error)
			setProcessingSolicitud(false)
		}
	}

	const aceptarSolicitudCurso = async (notif) => {
		setProcessingSolicitud(true)
		setJustifying(false)
		try {
			const resp = await axiosInstance.post(`/api/actas/aceptar-solicitud-curso/${notif.ID}`)
			if (resp.status == 200) {
				navigate("/Cursos/CrearCurso")
				setShowModalGeneral(false)
				setProcessingSolicitud(false)
				fetchNotifications()
				return
			} else
				throw resp.data
		} catch (error) {
			await Swal.fire({
				icon: 'error',
				title: 'Error',
				text: 'Ocurrió un error al aceptar la solicitud',
				confirmButtonText: 'Aceptar',
				theme: "bulma",
				customClass: { confirmButton: 'centered-swal-button' }
			})
			// console.error(error)
			setProcessingSolicitud(false)
		}
	}

	const handleCloseNotificationModal = () => {
		setShowModalGeneral(false);
		setJustifying(false);
		setJustificationDenial("");
		setActiveNotification(null);
	};

	const handleNotificationClick = (notif) => {
		setActiveNotification(notif);
		
		// Cerrar todos los menús antes de abrir el modal
		if (isMobileView) {
			// En móvil, mantener el menú hamburguesa abierto pero cerrar submenús
			setShowNotificationsMenu(false); // Cerrar panel de notificaciones
			setShowSettingsMenu(false);
		} else {
			// En escritorio, cerrar el panel de notificaciones
			setShowNotificationsMenu(false);
			setShowSettingsMenu(false);
		}
		
		setModalGeneralContent(
			<div className="notification-modal-overlay">
				<div className="notification-modal-container">
					<div className="notification-modal-header">
						<div className="notification-header-content">
							<h2 className="notification-modal-title">
								<FontAwesomeIcon icon={faBell} style={{ color: '#00c853' }} />
								{notif.titulo}
							</h2>
							<button
								className="notification-close-btn"
								onClick={handleCloseNotificationModal}
							>
								<FontAwesomeIcon icon={faTimes} />
							</button>
						</div>
					</div>

					<div className="notification-modal-body">
						<div className="notification-modal-content">
							<div className="notification-modal-info">
								<p className="notification-modal-sender">
									<FontAwesomeIcon icon={faUser} style={{ marginRight: '0.5rem', color: '#00c853' }} />
									<strong>De:</strong> {notif.remitente?.nombres ? `${notif.remitente.nombres} ${notif.remitente.apellidos}` : "SGFC"}
								</p>

								<div className="notification-modal-message-section">
									<p className="notification-modal-message-label">
										<FontAwesomeIcon icon={faCommentAlt} />
										<strong>Mensaje:</strong>
									</p>
									<div
										className="notification-modal-message-content"
										dangerouslySetInnerHTML={{ __html: notif.mensaje }}
									/>
								</div>

								{notif.estadoInvitacion && notif.estadoInvitacion !== 'pendiente' && (
									<div className="notification-modal-status">
										<p>
											<FontAwesomeIcon icon={faFileAlt} style={{ marginRight: '0.5rem' }} />
											<strong>Estado:</strong>
											<span className={`notification-status-${notif.estadoInvitacion}`}>
												{notif.estadoInvitacion === 'aceptada' ? ' Aceptada' : ' Rechazada'}
											</span>
										</p>
									</div>
								)}

								{notif.archivo && (
									<div className="notification-modal-attachment">
										<a
											href={`${API_URL}/uploads/solicitudes/${notif.archivo}`}
											target="_blank"
											rel="noopener noreferrer"
											className="notification-attachment-link"
										>
											<FontAwesomeIcon icon={faFileAlt} />
											📎 Ver PDF adjunto
										</a>
									</div>
								)}
							</div>

							{notif.tipo === "invitacion_cursoInstructor" && notif.invitacion_ID && (
								<div className="notification-modal-actions">
									<div className="notification-action-buttons">
										<button
											className={`notification-btn-accept ${notif.estadoInvitacion ? 'disabled' : ''}`}
											onClick={() => cambiarEstadoInvitacion(notif.invitacion_ID, "aceptada")}
											disabled={notif.estadoInvitacion || processingInvitation === notif.invitacion_ID}
										>
											{processingInvitation === notif.invitacion_ID ? (
												<>
													<FontAwesomeIcon icon={faBell} spin style={{ marginRight: '0.5rem' }} />
													Procesando...
												</>
											) : notif.estadoInvitacion === 'aceptada' ? (
												<>
													<FontAwesomeIcon icon={faBell} style={{ marginRight: '0.5rem' }} />
													✓ Aceptada
												</>
											) : (
												<>
													<FontAwesomeIcon icon={faBell} style={{ marginRight: '0.5rem' }} />
													Aceptar
												</>
											)}
										</button>
										<button
											className={`notification-btn-reject ${notif.estadoInvitacion ? 'disabled' : ''}`}
											onClick={() => cambiarEstadoInvitacion(notif.invitacion_ID, "rechazada")}
											disabled={notif.estadoInvitacion || processingInvitation === notif.invitacion_ID}
										>
											{processingInvitation === notif.invitacion_ID ? (
												<>
													<FontAwesomeIcon icon={faBell} spin style={{ marginRight: '0.5rem' }} />
													Procesando...
												</>
											) : notif.estadoInvitacion === 'rechazada' ? (
												<>
													<FontAwesomeIcon icon={faTimes} style={{ marginRight: '0.5rem' }} />
													✗ Rechazada
												</>
											) : (
												<>
													<FontAwesomeIcon icon={faTimes} style={{ marginRight: '0.5rem' }} />
													Rechazar
												</>
											)}
										</button>
									</div>
								</div>
							)}

							{notif.tipo === "solicitud_curso" && notif.estado !== "leida" && (
								<div className="notification-modal-actions">
									{justifying && (
										<div className="notification-justification-section">
											<textarea
												className="notification-justification-textarea"
												placeholder="Escriba el motivo por el que se rechazó la solicitud"
												value={justificationDenial}
												onChange={(e) => setJustificationDenial(e.target.value)}
												rows="4"
											/>
										</div>
									)}

									<div className="notification-action-buttons">
										<button
											className={`notification-btn-accept ${processingSolicitud ? "disabled" : ""}`}
											onClick={() => aceptarSolicitudCurso(notif)}
											disabled={processingSolicitud}
										>
											{processingSolicitud ? (
												<>
													<FontAwesomeIcon icon={faBell} spin style={{ marginRight: '0.5rem' }} />
													Procesando...
												</>
											) : (
												<>
													<FontAwesomeIcon icon={faBell} style={{ marginRight: '0.5rem' }} />
													Aceptar
												</>
											)}
										</button>
										<button
											className={`notification-btn-reject ${processingSolicitud ? "disabled" : ""}`}
											onClick={() => {
												if (justifying)
													rechazarSolicitudCurso(notif)
												else {
													setJustifying(true)
												}
											}}
											disabled={processingSolicitud}
										>
											{processingSolicitud ? (
												<>
													<FontAwesomeIcon icon={faBell} spin style={{ marginRight: '0.5rem' }} />
													Procesando...
												</>
											) : (
												<>
													<FontAwesomeIcon icon={faTimes} style={{ marginRight: '0.5rem' }} />
													{justifying ? 'Confirmar Rechazo' : 'Rechazar'}
												</>
											)}
										</button>
									</div>
								</div>
							)}

							{notif.tipo === "solicitud_curso" && notif.estado === "leida" && (
								<div className="notification-processed-message">
									<FontAwesomeIcon icon={faFileAlt} style={{ marginRight: '0.5rem' }} />
									<strong>Se ha procesado esta solicitud.</strong>
								</div>
							)}
						</div>
					</div>

					<div className="notification-modal-footer">
						<button
							className="notification-back-btn"
							onClick={handleCloseNotificationModal}
						>
							<FontAwesomeIcon icon={faArrowLeft} />
							Volver
						</button>
					</div>
				</div>
			</div>
		)
		setShowModalGeneral(true)
	}

	const handleSearchState = (e) => {
		e.stopPropagation(); // Prevenir propagación del evento
		setLoadingNotifications(true);
		try {
			const value = e.target.value;
			if (value == "All") {
				setFilter(notificationsList)
				setLoadingNotifications(false)
				return;
			}

			const filter = notificationsList.filter((notif) => notif.estado === value);
			setFilter(filter);
		} catch (err) {
			Swal.fire({
				icon: 'error',
				title: 'Error al filtrar',
				text: "Error al filtrar notificaciones, por favor, intentelo de nuevo",
				confirmButtonText: 'Aceptar',
				theme: "bulma",
				customClass: { confirmButton: 'centered-swal-button' }
			})
		}

		setLoadingNotifications(false);
	}

	useEffect(() => {
		if (!loadingNotifications)
			setLoadingNotifications(true);
		try {
			const SearchName = notificationsList.filter((notif) => {
				const charNotifications = notif.titulo.toLowerCase().includes(inputElement.toLowerCase());
				const remitenteNotifications = notif.remitente?.nombres?.toLowerCase().includes(inputElement.toLowerCase());
				const dateMatch = !Date && !DateEnd || (notif.fecha_envio >= Date && notif.fecha_envio <= DateEnd);
				return charNotifications || remitenteNotifications || dateMatch;
			});
			setFilter(SearchName)
			setLoadingNotifications(false);
		} catch (err) {
			Swal.fire({
				icon: 'error',
				title: 'Error al buscar notificaciones',
				text: "Error al buscar notificaciones por nombre, por favor, intentelo de nuevo",
				confirmButtonText: 'Aceptar',
				theme: "bulma",
				customClass: { confirmButton: 'centered-swal-button' }
			})
			setLoadingNotifications(false);
		}
	}, [inputElement, notificationsList, Date, DateEnd])

	useEffect(() => {
		if (activeNotification)
			handleNotificationClick(activeNotification)
		else
			setShowModalGeneral(false)
	}, [justifying, justificationDenial, processingSolicitud])

	const cambiarEstadoInvitacion = async (invitacionId, nuevoEstado) => {
		if (processingInvitation === invitacionId) return

		setProcessingInvitation(invitacionId)

		try {
			const response = await axiosInstance.put(`/api/courses/cambiarEstadoInvitacion/${invitacionId}`, { nuevoEstado })

			setNotificationsList(prevNotifications =>
				prevNotifications.map(notif =>
					notif.invitacion_ID === invitacionId
						? { ...notif, estadoInvitacion: nuevoEstado }
						: notif
				)
			)
			await Swal.fire({
				icon: 'success',
				title: 'Estado actualizado',
				text: response.data.message || "Estado actualizado correctamente",
				confirmButtonText: 'Aceptar',
				theme: "bulma",
				customClass: { confirmButton: 'centered-swal-button' }
			})

			if (nuevoEstado === "aceptada") {
				const notif = notificationsList.find((n) => n.invitacion_ID === invitacionId)
				if (notif) {
					try {
						const asignacionResponse = await axiosInstance.post("/api/courses/asignaciones", {
							instructor_ID: notif.destinatario_ID,
							curso_ID: notif.curso_ID,
						})
						if (asignacionResponse.status >= 200 && asignacionResponse.status < 300) {
							Swal.fire({
								icon: "success",
								title: "Curso asignado",
								text: asignacionResponse.data.message || "Curso asignado correctamente al instructor.",
								theme: "bulma",
								confirmButtonText: 'Aceptar',
								customClass: { confirmButton: 'centered-swal-button' }
							})
						} else {
							throw new Error(asignacionResponse.data.message || "Error en la asignación")
						}
					} catch (asignacionError) {
						// console.error("Error al asignar instructor:", asignacionError)
						await Swal.fire({
							icon: 'error',
							title: 'Error en asignación',
							text: asignacionError.response?.data?.message || "Error al asignar el instructor al curso.",
							confirmButtonText: 'Aceptar',
							confirmButtonColor: "#006c30",
							theme: "bulma",
							customClass: { confirmButton: 'centered-swal-button' }
						})
					}
				}
			}

			setShowModalGeneral(false)
			fetchNotifications()
		} catch (error) {
			// console.error("Error al cambiar estado de invitación:", error)
			await Swal.fire({
				icon: 'error',
				title: 'Error',
				text: error.response?.data?.message || "Error al actualizar el estado de la invitación.",
				confirmButtonText: 'Aceptar',
				theme: "bulma",
				customClass: { confirmButton: 'centered-swal-button' }
			})
		} finally {
			setProcessingInvitation(null)
		}
	}

	const handlePoliticasSeguridad = (e) => {
		if (e) e.stopPropagation(); // Prevenir propagación
		navigate("/politicas-seguridad");
		setShowSettingsMenu(false);
		setIsMobileMenuOpen(false);
	};

	const handlePreguntaSeguridad = (e) => {
		if (e) e.stopPropagation(); // Prevenir propagación
		navigate("/pregunta-seguridad");
		setShowSettingsMenu(false);
		setIsMobileMenuOpen(false);
	};

	const toggleMobileMenu = () => {
		setIsMobileMenuOpen(!isMobileMenuOpen);
		// Cuando se abre el menú móvil, cerrar otros menús
		if (!isMobileMenuOpen) {
			setShowNotificationsMenu(false);
			setShowSettingsMenu(false);
		}
	};

	const toggleNotificationsMenu = (e) => {
		e.stopPropagation(); // Prevenir que el clic cierre el menú móvil
		const newState = !showNotificationsMenu;
		setShowNotificationsMenu(newState);
		
		if (newState) {
			fetchNotifications();
		}
		
		// Cerrar configuración si está abierta
		if (showSettingsMenu) {
			setShowSettingsMenu(false);
		}
	};

	const toggleSettingsMenu = (e) => {
		e.stopPropagation(); // Prevenir que el clic cierre el menú móvil
		setShowSettingsMenu(!showSettingsMenu);
		// Cerrar notificaciones si están abiertas
		if (showNotificationsMenu) {
			setShowNotificationsMenu(false);
		}
	};

	return (
		<div className="navBar">
			<div className="logo" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
				SGFC
			</div>

			<button
				className="hamburger-btn"
				onClick={toggleMobileMenu}
				aria-label="Menú"
			>
				<FontAwesomeIcon icon={isMobileMenuOpen ? faTimesCircle : faBars} />
			</button>

			{/* Menú móvil */}
			<div
				className={`mobile-menu ${isMobileMenuOpen ? "open" : "closed"}`}
				ref={mobileMenuRef}
			>
				<div className="container_options">{children}</div>

				{!isLoggedIn && (
					<button className="button_signIn" onClick={handleSignIn}>
						Iniciar sesión
					</button>
				)}

				{isLoggedIn && (
					<div className="container_options_profile">
						<div className="settings-menu-mobile">
							<button
								className="mobile-profile-btn"
								onClick={toggleSettingsMenu}
							>
								<FontAwesomeIcon icon={faCog} className="mobile-icon" />
								<span className="mobile-label">Configuración</span>
								<FontAwesomeIcon
									icon={showSettingsMenu ? faChevronUp : faChevronDown}
									className="mobile-chevron"
								/>
							</button>

							{showSettingsMenu && (
								<div className="dropdown-settings-mobile">
									<button
										className="settings-dropdown-item"
										onClick={handlePoliticasSeguridad}
									>
										<FontAwesomeIcon icon={faFileAlt} className="settings-icon" />
										Políticas y seguridad
									</button>
									<button
										className="settings-dropdown-item"
										onClick={handlePreguntaSeguridad}
									>
										<FontAwesomeIcon icon={faFileAlt} className="settings-icon" />
										Pregunta de seguridad
									</button>
								</div>
							)}
						</div>

						{/* Notificaciones en móvil */}
						<div className="notifications-menu-mobile">
							<button
								className="mobile-profile-btn"
								onClick={toggleNotificationsMenu}
							>
								<FontAwesomeIcon icon={faBell} className="mobile-icon" />
								<span className="mobile-label">Notificaciones</span>
								<FontAwesomeIcon
									icon={showNotificationsMenu ? faChevronUp : faChevronDown}
									className="mobile-chevron"
								/>
							</button>

							{showNotificationsMenu && (
								<div className="dropdown-notifications-mobile" ref={notificationsMenuRef} onClick={(e) => e.stopPropagation()}>
									<div className="content-SearchNotification">
										<h2 className="titleNotification">
											<FontAwesomeIcon icon={faBell} /> Notificaciones
										</h2>
										<div className="search-notification">
											<div className="search-input-container">
												<FontAwesomeIcon icon={faSearch} className="search-icon" />
												<input
													className="inputSesarch"
													type="text"
													placeholder="Buscar notificaciones por nombre"
													value={inputElement}
													onChange={(e) => setInputElement(e.target.value)}
													onClick={(e) => e.stopPropagation()}
												/>
											</div>
										</div>
										<div className="content-state">
											<button className="btnNotificationState" value="All" onClick={handleSearchState}>
												<FontAwesomeIcon icon={faFilter} /> Todos
											</button>
											<button className="btnNotificationState" value="enviada" onClick={handleSearchState}>
												Enviada
											</button>
											<button className="btnNotificationState" value="leida" onClick={handleSearchState}>
												Leída
											</button>
											<button className="btnNotificationState" value="sin_leer" onClick={handleSearchState}>
												Sin leer
											</button>
											<button className="btnNotificationState" value="pendiente" onClick={handleSearchState}>
												Pendiente
											</button>
										</div>
										<div className="content-date">
											<h2 className="SubtitleNotification">
												<FontAwesomeIcon icon={faCalendarAlt} /> Buscar por fechas:
											</h2>
											<div className="SubContentDate">
												<div className="date-input-group">
													<label>Fecha inicio:</label>
													<div className="date-input-container">
														<FontAwesomeIcon icon={faCalendarAlt} className="date-icon" />
														<input 
															type="date" 
															className="notificationsDate" 
															onChange={(e) => setDate(e.target.value)}
															onClick={(e) => e.stopPropagation()}
														/>
													</div>
												</div>
												<div className="date-input-group">
													<label>Fecha Fin:</label>
													<div className="date-input-container">
														<FontAwesomeIcon icon={faCalendarAlt} className="date-icon" />
														<input 
															type="date" 
															className="notificationsDate" 
															onChange={(e) => setDateEnd(e.target.value)}
															onClick={(e) => e.stopPropagation()}
														/>
													</div>
												</div>
											</div>
										</div>
									</div>
									<div className="notification-item">
										{loadingNotifications ? (
											<div className="loading-notifications">Cargando notificaciones...</div>
										) : Filter.length === 0 ? (
											<div className="no-notifications">No hay notificaciones</div>
										) : (
											Filter.map((notif) => (
												<div className="notification" key={notif.ID}>
													<div
														className="SubContentNotif"
														style={{ cursor: "pointer" }}
														onClick={(e) => {
															e.stopPropagation();
															handleNotificationClick(notif);
														}}
													>
														<div className="container-img-notifications">
															<img src={notif.estado === "sin_leer" ? noRead : ifRead} alt="" />
														</div>
														<div className="container-text-notifications">
															<p className="notification-sender">
																{notif.remitente?.nombres
																	? `${notif.remitente.nombres} ${notif.remitente.apellidos}`
																	: "SGFC"}
															</p>
															<span className="notification-affair">{notif.titulo}</span>
														</div>
													</div>
												</div>
											))
										)}
									</div>
								</div>
							)}
						</div>

						<button
							className="mobile-profile-btn"
							id="btn_profile"
							onClick={handleProfileClick}
						>
							<FontAwesomeIcon icon={faUser} className="mobile-icon" />
							<span className="mobile-label">Perfil</span>
						</button>

						<button className="mobile-profile-btn" onClick={handleLogout}>
							<FontAwesomeIcon icon={faSignOutAlt} className="mobile-icon" />
							<span className="mobile-label">Cerrar sesión</span>
						</button>
					</div>
				)}
			</div>

			{/* Menú escritorio */}
			<div className="desktop-options">
				<div className="container_options">{children}</div>

				{!isLoggedIn && (
					<button className="button_signIn" onClick={handleSignIn}>
						Iniciar sesión
					</button>
				)}

				{isLoggedIn && (
					<div className="container_options_profile">
						<div className="settings-menu" ref={settingsMenuRef}>
							<button
								className="btn-settings"
								ref={settingsButtonRef}
								onClick={() => setShowSettingsMenu(!showSettingsMenu)}
							>
								<FontAwesomeIcon icon={faCog} className="settings-icon" />
							</button>
						</div>

						<div className="notifications-menu">
							<button
								className="btn-notifications"
								onClick={toggleNotificationsMenu}
							>
								<FontAwesomeIcon icon={faBell} className="img_notifications" />
								{notificationsList.length > 0 && (
									<span className="notification-badge">{notificationsList.length}</span>
								)}
							</button>

							{showNotificationsMenu && (
								<div className="dropdown-notifications" ref={notificationsMenuRef}>
									<div className="content-SearchNotification">
										<h2 className="titleNotification">
											<FontAwesomeIcon icon={faBell} /> Notificaciones
										</h2>
										<div className="search-notification">
											<div className="search-input-container">
												<FontAwesomeIcon icon={faSearch} className="search-icon" />
												<input
													className="inputSesarch"
													type="text"
													placeholder="Buscar notificaciones por nombre"
													value={inputElement}
													onChange={(e) => setInputElement(e.target.value)}
												/>
											</div>
										</div>
										<div className="content-state">
											<button className="btnNotificationState" value="All" onClick={handleSearchState}>
												<FontAwesomeIcon icon={faFilter} /> Todos
											</button>
											<button className="btnNotificationState" value="enviada" onClick={handleSearchState}>
												Enviada
											</button>
											<button className="btnNotificationState" value="leida" onClick={handleSearchState}>
												Leída
											</button>
											<button className="btnNotificationState" value="sin_leer" onClick={handleSearchState}>
												Sin leer
											</button>
											<button className="btnNotificationState" value="pendiente" onClick={handleSearchState}>
												Pendiente
											</button>
										</div>
										<div className="content-date">
											<h2 className="SubtitleNotification">
												<FontAwesomeIcon icon={faCalendarAlt} /> Buscar por fechas:
											</h2>
											<div className="SubContentDate">
												<div className="date-input-group">
													<label>Fecha inicio:</label>
													<div className="date-input-container">
														<FontAwesomeIcon icon={faCalendarAlt} className="date-icon" />
														<input type="date" className="notificationsDate" onChange={(e) => setDate(e.target.value)} />
													</div>
												</div>
												<div className="date-input-group">
													<label>Fecha Fin:</label>
													<div className="date-input-container">
														<FontAwesomeIcon icon={faCalendarAlt} className="date-icon" />
														<input type="date" className="notificationsDate" onChange={(e) => setDateEnd(e.target.value)} />
													</div>
												</div>
											</div>
										</div>
									</div>
									<div className="notification-item">
										{loadingNotifications ? (
											<div className="loading-notifications">Cargando notificaciones...</div>
										) : Filter.length === 0 ? (
											<div className="no-notifications">No hay notificaciones</div>
										) : (
											Filter.map((notif) => (
												<div className="notification" key={notif.ID}>
													<div
														className="SubContentNotif"
														style={{ cursor: "pointer" }}
														onClick={() => handleNotificationClick(notif)}
													>
														<div className="container-img-notifications">
															<img src={notif.estado === "sin_leer" ? noRead : ifRead} alt="" />
														</div>
														<div className="container-text-notifications">
															<p className="notification-sender">
																{notif.remitente?.nombres
																	? `${notif.remitente.nombres} ${notif.remitente.apellidos}`
																	: "SGFC"}
															</p>
															<span className="notification-affair">{notif.titulo}</span>
														</div>
													</div>
												</div>
											))
										)}
									</div>
								</div>
							)}
						</div>

						<button id="btn_profile" onClick={handleProfileClick}>
							<FontAwesomeIcon icon={faUser} />
						</button>

						<button onClick={handleLogout}>
							<FontAwesomeIcon icon={faSignOutAlt} />
						</button>
					</div>
				)}
			</div>

			{showSettingsMenu && !isMobileView && (
				<div className="dropdown-settings" id="settings-menu" ref={settingsMenuRef}>
					<button
						className="settings-dropdown-item"
						onClick={handlePoliticasSeguridad}
					>
						<FontAwesomeIcon icon={faFileAlt} className="settings-icon" />
						Políticas y seguridad
					</button>
					<button
						className="settings-dropdown-item"
						onClick={handlePreguntaSeguridad}
					>
						<FontAwesomeIcon icon={faFileAlt} className="settings-icon" />
						Pregunta de seguridad
					</button>
				</div>
			)}
		</div>
	)
}