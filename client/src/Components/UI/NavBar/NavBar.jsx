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

export const NavBar = ({ children }) => {
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { setShowSignIn } = useModal()
  const [notificationsList, setNotificationsList] = useState([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [processingInvitation, setProcessingInvitation] = useState(null) // Nuevo estado para controlar procesamiento

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
        setShowNotificationsMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (!isLoggedIn) return
    if (!showNotificationsMenu) return

    const fetchNotifications = async () => {
      setLoadingNotifications(true)
      try {
        const res = await axiosInstance.get('/api/notifications?limit=5');
        // no mostrar notificaciones aceptadas o rechazadas
        res.data.notifications = res.data.notifications.filter(notif => notif.estado !== 'aceptada' && notif.estado !== 'rechazada');
        setNotificationsList(res.data.notifications || []);
      } catch (err) {
        setNotificationsList([])
      }
      setLoadingNotifications(false)
    }

    fetchNotifications()
  }, [showNotificationsMenu, isLoggedIn])

  const { setShowModalGeneral, setModalGeneralContent } = useModal()

  const handleNotificationClick = (notif) => {
    setModalGeneralContent(
      <div className="notification-modal">
        <h2>{notif.titulo}</h2>
        <p>
          <b>De:</b> {notif.remitente?.nombres ? `${notif.remitente.nombres} ${notif.remitente.apellidos}` : "SGFC"}
        </p>
        <p>
          <b>Mensaje:</b>
        </p>
        <div className="notification-message" dangerouslySetInnerHTML={{ __html: notif.mensaje }} />
        
        {/* Mostrar estado actual si ya fue respondida */}
        {notif.estadoInvitacion && notif.estadoInvitacion !== 'pendiente' && (
          <div className="notification-status">
            <p><b>Estado:</b> 
              <span className={`status-${notif.estadoInvitacion}`}>
                {notif.estadoInvitacion === 'aceptada' ? ' Aceptada' : ' Rechazada'}
              </span>
            </p>
          </div>
        )}
        
        {notif.tipo === "invitacion_cursoInstructor" && notif.invitacion_ID && (
          <div className="notification-buttons-container">
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
        {notif.archivo && (
          <div className="notification-attachment">
            <a
              href={`http://localhost:3001/uploads/solicitudes/${notif.archivo}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#007bff", textDecoration: "underline" }}
            >
              Ver PDF adjunto
            </a>
          </div>
        )}
      </div>,
    )
    setShowModalGeneral(true)
  }

  const cambiarEstadoInvitacion = async (invitacionId, nuevoEstado) => {
    // Si ya se está procesando esta invitación, no hacer nada
    if (processingInvitation === invitacionId) return
    
    setProcessingInvitation(invitacionId)

    try {
      const response = await axiosInstance.put(`/api/courses/cambiarEstadoInvitacion/${invitacionId}`, { nuevoEstado })
      
      // Actualizar el estado local de las notificaciones
      setNotificationsList(prevNotifications => 
        prevNotifications.map(notif => 
          notif.invitacion_ID === invitacionId 
            ? { ...notif, estadoInvitacion: nuevoEstado }
            : notif
        )
      )

      alert(response.data.message || "Estado actualizado correctamente")

      // Si fue aceptada, asigna el curso al instructor
      if (nuevoEstado === "aceptada") {
        const notif = notificationsList.find((n) => n.invitacion_ID === invitacionId)
        if (notif) {
          try {
            const asignacionResponse = await axiosInstance.post("/api/courses/asignaciones", {
              instructor_ID: notif.destinatario_ID,
              curso_ID: notif.curso_ID,
            })
            alert(asignacionResponse.data.message || "Curso asignado correctamente al instructor.")
          } catch (asignacionError) {
            console.error("Error al asignar instructor:", asignacionError)
            alert(asignacionError.response?.data?.message || "Error al asignar el instructor al curso.")
          }
        }
      }

      setShowModalGeneral(false)
      
    } catch (error) {
      console.error("Error al cambiar estado de invitación:", error)
      alert(error.response?.data?.message || "Error al actualizar el estado de la invitación.")
    } finally {
      setProcessingInvitation(null)
    }
  }

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
            <button className="mobile-profile-btn">
              <span className="mobile-label">Configuración</span>
              <img className="desktop-icon" src={settings} alt="Configuración" />
            </button>

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
            <button>
              <img src={settings} alt="Configuración" />
            </button>

            <div className="notifications-menu" ref={notificationsMenuRef}>
              <button className="btn-notifications" onClick={() => setShowNotificationsMenu((prev) => !prev)}>
                <img className="img_notifications" src={notifications} alt="Notificaciones" />
              </button>
              {showNotificationsMenu && (
                <div className="dropdown-notifications">
                  <div className="arrow-up" />
                  {loadingNotifications ? (
                    <div className="notification-item">Cargando...</div>
                  ) : notificationsList.length === 0 ? (
                    <div className="notification-item">Sin notificaciones</div>
                  ) : (
                    notificationsList.map((notif) => (
                      <div
                        className="notification-item"
                        key={notif.ID}
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
                    ))
                  )}
                </div>
              )}
            </div>

            <button id="btn_profile" onClick={handleProfileClick}>
              <img src={profile} alt="Perfil" />
            </button>

            <button onClick={handleLogout}>
              <img src={logout} alt="Cerrar sesión" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}