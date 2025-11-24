"use client"

import { useState, useRef, useEffect } from "react"
import "./NavBar.css"
import { useNavigate } from "react-router-dom"
import settings from "../../../assets/Icons/settings.png"
import notifications from "../../../assets/Icons/notifications.png"
import profile from "../../../assets/Icons/userGrey.png"
import logout from "../../../assets/Icons/cerrar-sesion.png"
import axiosInstance from "../../../config/axiosInstance"
import noRead from "../../../assets/Icons/mensaje-no-leido.png"
import ifRead from "../../../assets/Icons/mensaje-leido.png"
import { useModal } from "../../../Context/ModalContext"
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faTimes } from '@fortawesome/free-solid-svg-icons'

export const NavBar = ({ children }) => {
	const navigate = useNavigate()
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
	const { setShowSignIn } = useModal()
	const [notificationsList, setNotificationsList] = useState([])
	const [loadingNotifications, setLoadingNotifications] = useState(false)
	const [justifying, setJustifying] = useState(false)
	const [processingInvitation, setProcessingInvitation] = useState(null)
	const [processingSolicitud, setProcessingSolicitud] = useState(null)
	const [justificationDenial, setJustificationDenial] = useState("")
	const [activeNotification, setActiveNotification] = useState(null)
	const [Filter, setFilter] = useState([])
	const [inputElement, setInputElement] = useState("")
	const [Date, setDate] = useState("")
	const [DateEnd, setDateEnd] = useState("")
	const [showSettingsMenu, setShowSettingsMenu] = useState(false)
	const settingsMenuRef = useRef(null)
	const settingsButtonRef = useRef(null)
	

	const userSession =
		JSON.parse(localStorage.getItem("userSession")) || JSON.parse(sessionStorage.getItem("userSession"))

	const isLoggedIn = !!userSession

	const handleProfileClick = () => {
		if (userSession?.id) {
			navigate("/MiPerfil", { state: { userId: userSession.id } })
		}
	}

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
			}
		} catch (error) {
			console.error("Error al cerrar sesión:", error)
			localStorage.removeItem("userSession")
			sessionStorage.removeItem("userSession")
			navigate("/")
		}
	}

	const handleSignIn = () => {
		setShowSignIn(true)
	}

	const [showNotificationsMenu, setShowNotificationsMenu] = useState(false)
	const notificationsMenuRef = useRef(null)

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(event.target)) {
			//setShowNotificationsMenu(false)
			}
			if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target) && settingsButtonRef.current && 
				!settingsButtonRef.current.contains(event.target))  {
			setShowSettingsMenu(false)
			}
		}
		document.addEventListener("mousedown", handleClickOutside)
		return () => document.removeEventListener("mousedown", handleClickOutside)
	}, [])

	const fetchNotifications = async () => {
		setLoadingNotifications(true)
		try {
			const res = await axiosInstance.get('/api/notifications?limit=5');
			res.data.notifications = res.data.notifications.filter(notif => notif.estado !== 'aceptada' && notif.estado !== 'rechazada');
			setNotificationsList(res.data.notifications || []);
		} catch (err) {
			setNotificationsList([])
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
				theme:"bulma",
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
					theme:"bulma",
					customClass: { confirmButton: 'centered-swal-button' }
				})
				setShowModalGeneral(false)
				setProcessingSolicitud(false)
				setJustificationDenial("")
				setActiveNotification(null)
				setJustifying(false)
				return
			} else
				throw resp.data
		} catch (error) {
			await Swal.fire({
				icon: 'error',
				title: 'Error',
				text: 'Ocurrió un error al rechazar la solicitud',
				confirmButtonText: 'Aceptar',
				theme:"bulma",
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
				return
			} else
				throw resp.data
		} catch (error) {
			await Swal.fire({
				icon: 'error',
				title: 'Error',
				text: 'Ocurrió un error al aceptar la solicitud',
				confirmButtonText: 'Aceptar',
				theme:"bulma",
				customClass: { confirmButton: 'centered-swal-button' }
			})
			console.error(error)
			setProcessingSolicitud(false)
		}
	}

	const handleCloseNotificationModal = () => {
		setShowModalGeneral(false)
		setJustifying(false)
		setJustificationDenial("")
		setActiveNotification(null)
	}

	const handleNotificationClick = (notif) => {
		setActiveNotification(notif)
		setModalGeneralContent(
			<div className="notification-modal-overlay">
				<div className="notification-modal-container">
					{/* Header con botón de cerrar */}
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
							
							{/* Mostrar estado actual si ya fue respondida */}
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

						{/* Botones para invitaciones de curso */}
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

						{/* Botones para solicitudes de curso */}
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

					{/* Botón de volver en el footer */}
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

	// Resto del código se mantiene igual...
	const handleSearchState = (e) => {
		setLoadingNotifications(true);
		try {
			const value = e.target.value;
			if(value =="All"){
				setFilter(notificationsList)
				setLoadingNotifications(false)
				return;
			}

			const filter = notificationsList.filter((notif) => notif.estado === value);
			setFilter(filter);
		}catch(err){
			Swal.fire({
				icon: 'error',
				title: 'Error al filtrar',
				text: "Error al filtrar notificaciones, por favor, intentelo de nuevo",
				confirmButtonText: 'Aceptar',
				theme:"bulma",
				customClass: { confirmButton: 'centered-swal-button' }
			})
		}
		
		setLoadingNotifications(false);
	}

	useEffect(() => {
		setFilter(notificationsList)
		setLoadingNotifications(true);
		try{
			setFilter(notificationsList)
			const SearchName = notificationsList.filter((notif )=>  {
				const charNotifications = notif.titulo.toLowerCase().includes(inputElement.toLowerCase());
				const remitenteNotifications = notif.remitente?.nombres?.toLowerCase().includes(inputElement.toLowerCase());
				const dateMatch = !Date && !DateEnd || (notif.fecha_envio >= Date && notif.fecha_envio <= DateEnd);
				return charNotifications || remitenteNotifications || dateMatch;
		});
			setFilter(SearchName)
			setLoadingNotifications(false);
		}catch(err){
			Swal.fire({
				icon: 'error',
				title: 'Error al buscar notificaciones',
				text: "Error al buscar notificaciones por nombre, por favor, intentelo de nuevo",
				confirmButtonText: 'Aceptar',
				theme:"bulma",
				customClass: { confirmButton: 'centered-swal-button' }
			})
			setLoadingNotifications(false);
		}
	}, [inputElement])

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
				theme:"bulma",
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
								icon:"success",
								title:"Curso asignado",
								text:asignacionResponse.data.message || "Curso asignado correctamente al instructor.",
								theme:"bulma",
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
							confirmButtonColor:"#006c30",
							theme:"bulma",
							customClass: { confirmButton: 'centered-swal-button' }
						})
					}
				}
			}

			setShowModalGeneral(false)
		} catch (error) {
			console.error("Error al cambiar estado de invitación:", error)
			await Swal.fire({
				icon: 'error',
				title: 'Error',
				text: error.response?.data?.message || "Error al actualizar el estado de la invitación.",
				confirmButtonText: 'Aceptar',
				theme:"bulma",
				customClass: { confirmButton: 'centered-swal-button' }
			})
		} finally {
			setProcessingInvitation(null)
		}
	}

	const handlePoliticasSeguridad = () => {
		navigate("/politicas-seguridad")
		setShowSettingsMenu(false)
	}

	const handlePreguntaSeguridad = () => {
		navigate("/pregunta-seguridad");
		setShowSettingsMenu(false);
	};

	// El resto del return se mantiene igual...
	return (
		<div className="navBar">
			<div className="logo">SGFC</div>

			<button className="hamburger-btn" onClick={() => setIsMobileMenuOpen((prev) => !prev)}>
				☰
			</button>

			{/* Contenido móvil */}
			<div className={`mobile-menu ${isMobileMenuOpen ? "open" : "closed"}`}>
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
								className="btn-settings" ref={settingsButtonRef}
								onClick={() => setShowSettingsMenu(!showSettingsMenu)}
							>
								<img src={settings} alt="Configuración" />
							</button>
						</div>
						<button className="mobile-profile-btn" onClick={() => setShowNotificationsMenu((prev) => !prev)}>
							<span className="mobile-label">Notificaciones</span>
							<img className="desktop-icon" src={notifications} alt="Notificaciones" />
						</button>

						<button className="mobile-profile-btn" id="btn_profile" onClick={handleProfileClick}>
							<span className="mobile-label">Perfil</span>
							<img className="desktop-icon" src={profile} alt="Perfil" />
						</button>

						<button className="mobile-profile-btn" onClick={handleLogout}>
							<span className="mobile-label">Cerrar sesión</span>
							<img className="desktop-icon" src={logout} alt="Cerrar sesión" />
						</button>
					</div>
				)}
			</div>

			{/* Contenido escritorio */}
			<div className="desktop-options">
				<div className="container_options">{children}</div>

				{!isLoggedIn && (
					<button className="button_signIn" onClick={handleSignIn}>
						Iniciar sesión
					</button>
				)}

				{isLoggedIn && (
					<div className="container_options_profile">
						<button 
							className="btn-settings"
							onClick={() => setShowSettingsMenu(!showSettingsMenu)}
						>
							<img src={settings} alt="Configuración" />
						</button>

						<div className="notifications-menu">
							<button className="btn-notifications" onClick={() => setShowNotificationsMenu((prev) => !prev)}>
								<img className="img_notifications" src={notifications} alt="Notificaciones" />
							</button>
						</div>
						
						{showNotificationsMenu && (
							<div className="dropdown-notifications" ref={notificationsMenuRef}>
								<div className="content-SearchNotification">
									<h2 className="titleNotification"> Notificaciones </h2>
									<div className="search-notification">
										<input 
											className="inputSesarch" type="text" placeholder="Busar notificaciones por nombre" 
											value={inputElement} onChange={(e)=>setInputElement(e.target.value)} />
									</div>
									<div className="content-state">
										<button className="btnNotificationState" value="All" onClick={(e) => handleSearchState(e)}> Todos </button>
										<button className="btnNotificationState" value="enviada" onClick={(e) => handleSearchState(e)}> Enviada</button>
										<button className="btnNotificationState" value="leida"  onClick={(e) => handleSearchState(e)}> Leida</button>
										<button className="btnNotificationState" value="sin_leer" onClick={(e) => handleSearchState(e)}> Sin leer</button>
										<button className="btnNotificationState" value="pendiente" onClick={(e) => handleSearchState(e)}> Pendiente </button>
									</div>
									<div className="content-date">
										<h2 className="SubtitleNotification">Busar por fechas:</h2>
										<div className="SubContentDate">
											<div>	
												<label> Fecha inicio: </label>
												<input type="date" className="notificationsDate" placeholder="Ingrese fecha de inicio: " onChange={(e) => setDate(e.target.value)} />
											</div>
											<div>
												<label> Fecha Fin: </label>
												<input type="date" className="notificationsDate" placeholder="Ingrese fecha fin: " onChange={(e) => setDateEnd(e.target.value)} />
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

						<button id="btn_profile" onClick={handleProfileClick}>
							<img src={profile} alt="Perfil" />
						</button>

						<button onClick={handleLogout}>
							<img src={logout} alt="Cerrar sesión" />
						</button>
					</div>
				)}
			</div>
			
			{showSettingsMenu && (
				<div className="dropdown-settings" id="settings-menu" ref={settingsMenuRef} >
					<div className="arrow-up" />
					<button 
						className="settings-dropdown-item"
						onClick={handlePoliticasSeguridad}
					>
						Políticas y seguridad
					</button>
					<button 
						className="settings-dropdown-item"
						onClick={handlePreguntaSeguridad}
					>
						Pregunta de seguridad
					</button>
				</div>
			)}
		</div>
	)
}