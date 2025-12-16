"use client"

import { useState, useRef, useEffect } from "react"
import "./NavBar.css"
import { useNavigate, NavLink } from "react-router-dom"
import axiosInstance from "../../../config/axiosInstance"
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
			setIsMobileMenuOpen(false); // Este sí debe cerrar
			setShowNotificationsMenu(false);
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
			console.error("Error al cerrar sesión:", error)
			localStorage.removeItem("userSession")
			sessionStorage.removeItem("userSession")
			navigate("/")
			setIsMobileMenuOpen(false)
		}
		setIsMobileMenuOpen(false);
	}

	const handleSignIn = () => {
		setShowSignIn(true)
		setIsMobileMenuOpen(false)
	}

	useEffect(() => {
		const handleClickOutside = (event) => {
			// En móvil con menú abierto, no cerrar las notificaciones automáticamente
			if (isMobileView && isMobileMenuOpen && showNotificationsMenu) {
				// Solo cerrar si se hace clic fuera del contenedor de notificaciones
				if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(event.target)) {
					const notificationButton = event.target.closest('.mobile-profile-btn');
					if (!notificationButton || !notificationButton.querySelector('.fa-bell')) {
						setShowNotificationsMenu(false);
					}
				}
				return;
			}

			// Cerrar menú de notificaciones si se hace clic fuera (escritorio)
			if (!isMobileView && notificationsMenuRef.current && !notificationsMenuRef.current.contains(event.target)) {
				setShowNotificationsMenu(false);
			}

			// Cerrar menú de configuración si se hace clic fuera
			if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target) &&
				settingsButtonRef.current && !settingsButtonRef.current.contains(event.target)) {
				setShowSettingsMenu(false);
			}

			// Cerrar menú móvil si se hace clic fuera (solo en móvil)
			if (isMobileView && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) &&
				!event.target.classList.contains('hamburger-btn') &&
				!event.target.closest('.hamburger-btn')) {
				setIsMobileMenuOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [isMobileView, isMobileMenuOpen, showNotificationsMenu]);

	const fetchNotifications = async () => {
		if (!isLoggedIn) return

		setLoadingNotifications(true)
		try {
			const res = await axiosInstance.get('/api/notifications?limit=5');
			res.data.notifications = res.data.notifications.filter(notif => notif.estado !== 'aceptada' && notif.estado !== 'rechazada');
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
				fetchNotifications() // Refrescar notificaciones
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
			console.error(error)
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
				fetchNotifications() // Refrescar notificaciones
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
			console.error(error)
			setProcessingSolicitud(false)
		}
	}

	const handleCloseNotificationModal = () => {
		setShowModalGeneral(false);
		setJustifying(false);
		setJustificationDenial("");
		setActiveNotification(null);
		// NO cerrar menús aquí para móvil
		// Solo cerrar el modal
	};

	const handleNotificationClick = (notif) => {
		setActiveNotification(notif)
		setModalGeneralContent(
			<div className="notification-modal-overlay">
				<div className="notification-modal-container">
					<div className="notification-modal-header">
						<div className="notification-header-content">
							<h2 className="notification-modal-title">{notif.titulo}</h2>
							<button
								className="notification-close-btn"
								onClick={handleCloseNotificationModal}
							>
								<FontAwesomeIcon icon={faTimes} />
							</button>
						</div>
					</div>

					<div className="notification-modal-body">
						<div className="notification-modal-info">
							<p className="notification-modal-sender">
								<strong>De:</strong> {notif.remitente?.nombres ? `${notif.remitente.nombres} ${notif.remitente.apellidos}` : "SGFC"}
							</p>

							<div className="notification-modal-message-section">
								<p className="notification-modal-message-label"><strong>Mensaje:</strong></p>
								<div
									className="notification-modal-message-content"
									dangerouslySetInnerHTML={{ __html: notif.mensaje }}
								/>
							</div>

							{notif.estadoInvitacion && notif.estadoInvitacion !== 'pendiente' && (
								<div className="notification-modal-status">
									<p><strong>Estado:</strong>
										<span className={`notification-status-${notif.estadoInvitacion}`}>
											{notif.estadoInvitacion === 'aceptada' ? ' Aceptada' : ' Rechazada'}
										</span>
									</p>
								</div>
							)}

							{notif.archivo && (
								<div className="notification-modal-attachment">
									<a
										href={`http://localhost:3001/uploads/solicitudes/${notif.archivo}`}
										target="_blank"
										rel="noopener noreferrer"
										className="notification-attachment-link"
									>
										📎 Ver PDF adjunto
									</a>
								</div>
							)}
						</div>

						{notif.tipo === "invitacion_cursoInstructor" && notif.invitacion_ID && (
							<div className="notification-modal-actions">
								<button
									className={`notification-btn-accept ${notif.estadoInvitacion ? 'disabled' : ''}`}
									onClick={() => cambiarEstadoInvitacion(notif.invitacion_ID, "aceptada")}
									disabled={notif.estadoInvitacion || processingInvitation === notif.invitacion_ID}
								>
									{processingInvitation === notif.invitacion_ID ? 'Procesando...' :
										notif.estadoInvitacion === 'aceptada' ? '✓ Aceptada' : 'Aceptar'}
								</button>
								<button
									className={`notification-btn-reject ${notif.estadoInvitacion ? 'disabled' : ''}`}
									onClick={() => cambiarEstadoInvitacion(notif.invitacion_ID, "rechazada")}
									disabled={notif.estadoInvitacion || processingInvitation === notif.invitacion_ID}
								>
									{processingInvitation === notif.invitacion_ID ? 'Procesando...' :
										notif.estadoInvitacion === 'rechazada' ? '✗ Rechazada' : 'Rechazar'}
								</button>
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
										{processingSolicitud ? "Procesando..." : "Aceptar"}
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
										{processingSolicitud ? "Procesando..." : "Rechazar"}
									</button>
								</div>
							</div>
						)}

						{notif.tipo === "solicitud_curso" && notif.estado === "leida" && (
							<div className="notification-processed-message">
								<strong>Se ha procesado esta solicitud.</strong>
							</div>
						)}
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
		if (!isMobileView) {
			setShowNotificationsMenu(false);
		}
		// setShowNotificationsMenu(false)
		// setIsMobileMenuOpen(false)
	}

	const handleSearchState = (e) => {
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
						console.error("Error al asignar instructor:", asignacionError)
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
			fetchNotifications() // Refrescar notificaciones
		} catch (error) {
			console.error("Error al cambiar estado de invitación:", error)
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

	const handlePoliticasSeguridad = () => {
		navigate("/politicas-seguridad");
		setShowSettingsMenu(false);
		// NO cerrar el menú móvil inmediatamente en móvil
		if (!isMobileView) {
			setIsMobileMenuOpen(false);
		}
		// En móvil, esperar un poco para que la navegación se complete
		if (isMobileView) {
			setTimeout(() => {
				setIsMobileMenuOpen(false);
			}, 100);
		}
	};

	const handlePreguntaSeguridad = () => {
		navigate("/pregunta-seguridad");
		setShowSettingsMenu(false);
		// NO cerrar el menú móvil inmediatamente en móvil
		if (!isMobileView) {
			setIsMobileMenuOpen(false);
		}
		// En móvil, esperar un poco para que la navegación se complete
		if (isMobileView) {
			setTimeout(() => {
				setIsMobileMenuOpen(false);
			}, 100);
		}
	};

	const toggleMobileMenu = () => {
		setIsMobileMenuOpen(!isMobileMenuOpen)
		if (!isMobileMenuOpen) {
			setShowNotificationsMenu(false)
			setShowSettingsMenu(false)
		}
	}

	const toggleNotificationsMenu = () => {
		if (isMobileView) {
			// En móvil, abrir notificaciones dentro del menú
			setShowNotificationsMenu(!showNotificationsMenu)
			if (!showNotificationsMenu) {
				fetchNotifications()
			}
		} else {
			// En escritorio, comportamiento normal
			setShowNotificationsMenu(!showNotificationsMenu)
			if (!showNotificationsMenu) {
				fetchNotifications()
			}
		}
	}

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
								onClick={() => setShowSettingsMenu(!showSettingsMenu)}
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
									<NavLink
										to="/politicas-seguridad"
										className="settings-dropdown-item"
										onClick={() => {
											setShowSettingsMenu(false);
											setIsMobileMenuOpen(false);
										}}
									>
										<FontAwesomeIcon icon={faFileAlt} className="settings-icon" />
										Políticas y seguridad
									</NavLink>
									<NavLink
										to="/pregunta-seguridad"
										className="settings-dropdown-item"
										onClick={() => {
											setShowSettingsMenu(false);
											setIsMobileMenuOpen(false);
										}}
									>
										<FontAwesomeIcon icon={faFileAlt} className="settings-icon" />
										Pregunta de seguridad
									</NavLink>
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
								<div className="dropdown-notifications-mobile" ref={notificationsMenuRef}>
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
											<button className="btnNotificationState" value="All" onClick={(e) => handleSearchState(e)}>
												<FontAwesomeIcon icon={faFilter} /> Todos
											</button>
											<button className="btnNotificationState" value="enviada" onClick={(e) => handleSearchState(e)}>
												Enviada
											</button>
											<button className="btnNotificationState" value="leida" onClick={(e) => handleSearchState(e)}>
												Leída
											</button>
											<button className="btnNotificationState" value="sin_leer" onClick={(e) => handleSearchState(e)}>
												Sin leer
											</button>
											<button className="btnNotificationState" value="pendiente" onClick={(e) => handleSearchState(e)}>
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
											<button className="btnNotificationState" value="All" onClick={(e) => handleSearchState(e)}>
												<FontAwesomeIcon icon={faFilter} /> Todos
											</button>
											<button className="btnNotificationState" value="enviada" onClick={(e) => handleSearchState(e)}>
												Enviada
											</button>
											<button className="btnNotificationState" value="leida" onClick={(e) => handleSearchState(e)}>
												Leída
											</button>
											<button className="btnNotificationState" value="sin_leer" onClick={(e) => handleSearchState(e)}>
												Sin leer
											</button>
											<button className="btnNotificationState" value="pendiente" onClick={(e) => handleSearchState(e)}>
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