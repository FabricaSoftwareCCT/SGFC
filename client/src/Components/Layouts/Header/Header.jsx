"use client"

import { useState, useRef, useEffect } from "react"
import { NavBar } from "../../UI/NavBar/NavBar"
import { NavLink, useNavigate, useLocation } from "react-router-dom"
import "./Header.css"

export const Header = ({ setShowSignIn, setShowSignUp, setShowAccountType }) => {
  const [showCoursesMenu, setShowCoursesMenu] = useState(false)
  const [showGestionesMenu, setShowGestionesMenu] = useState(false)
  const [showEmpleadosMenu, setShowEmpleadosMenu] = useState(false)
  const coursesMenuRef = useRef(null)
  const gestionesMenuRef = useRef(null)
  const empleadosMenuRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  const userSession =
    JSON.parse(localStorage.getItem("userSession")) || JSON.parse(sessionStorage.getItem("userSession"))

  const isLoggedIn = !!userSession
  const accountType = userSession?.accountType || null

  const toggleCoursesMenu = () => {
    setShowGestionesMenu(false)
    setShowEmpleadosMenu(false)
    setShowCoursesMenu((prev) => !prev)
  }

  const toggleGestionesMenu = () => {
    setShowCoursesMenu(false)
    setShowEmpleadosMenu(false)
    setShowGestionesMenu((prev) => !prev)
  }

  const toggleEmpleadosMenu = () => {
    setShowCoursesMenu(false)
    setShowGestionesMenu(false)
    setShowEmpleadosMenu((prev) => !prev)
  }

  const handleMenuClick = (path) => {
    navigate(path)
    setShowCoursesMenu(false)
    setShowGestionesMenu(false)
    setShowEmpleadosMenu(false)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !coursesMenuRef.current?.contains(event.target) &&
        !gestionesMenuRef.current?.contains(event.target) &&
        !empleadosMenuRef.current?.contains(event.target)
      ) {
        setShowCoursesMenu(false)
        setShowGestionesMenu(false)
        setShowEmpleadosMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Detectar rutas activas para menús con subopciones
  const isCoursesActive = [
    "/Cursos/MisCursos",
    "/Cursos/MisCursosAsignados",
    "/Cursos/BuscarCursos",
    "/Cursos/CrearCurso",
    "/SolicitarCurso",
    "/Cursos",
  ].some((path) => location.pathname.startsWith(path))

  const isGestionesActive = [
    "/Gestiones/Instructor", 
    "/Gestiones/Gestor", 
    "/Gestiones/Actas",
    "/GestionReporteEstadisticas/ReporteEstadisticas"
  ].some((path) => location.pathname.startsWith(path))

  const isEmpresasActive = location.pathname.startsWith("/Gestiones/Empresas")

  const isEmpleadosActive = [
    "/Empleados/MisEmpleados",
    "/Empleados/CrearEmpleado",
    "/Empleados/CrearVariosEmpleados",
  ].some((path) => location.pathname.startsWith(path))

  const showDropdown = (optionsCount) => optionsCount > 1

  return (
    <div className="header">
      <NavBar setShowSignIn={setShowSignIn} setShowSignUp={setShowSignUp} setShowAccountType={setShowAccountType}>
        <NavLink to="/" className={({ isActive }) => (isActive ? "startOption active" : "startOption")}>
          Inicio
        </NavLink>

        <NavLink to="/QuienesSomos" className={({ isActive }) => (isActive ? "whoWeAre active" : "whoWeAre")}>
          Quienes somos
        </NavLink>

        {/* Cursos */}
        {(() => {
          let options = []

          if (!isLoggedIn) {
            return (
              <NavLink
                to="/Cursos/BuscarCursos"
                className={({ isActive }) => (isActive ? "courses active" : "courses")}
              >
                Cursos
              </NavLink>
            )
          }

          switch (accountType) {
            case "Administrador":
              options = [
                { label: "Mis cursos", path: "/Cursos/MisCursos" },
                { label: "Buscar cursos", path: "/Cursos/BuscarCursos" },
                { label: "Crear curso", path: "/Cursos/CrearCurso" },
              ]
              break
            case "Instructor":
              options = [
                { label: "Mis cursos", path: "/Cursos/MisCursosAsignados" },
                { label: "Buscar cursos", path: "/Cursos/BuscarCursos" },
              ]
              break
            case "Gestor":
              options = [
                { label: "Mis cursos", path: "/Cursos/MisCursos" },
                { label: "Buscar cursos", path: "/Cursos/BuscarCursos" },
                { label: "Crear curso", path: "/Cursos/CrearCurso" },
              ]
              break
            case "Empresa":
              options = [
                { label: "Mis cursos", path: "/Cursos/MisCursos" },
                { label: "Buscar cursos", path: "/Cursos/BuscarCursos" },
              ]
              break
            default:
              return null
          }

          return showDropdown(options.length) ? (
            <div className="courses-menu" ref={coursesMenuRef}>
              <button
                className={`courses${showCoursesMenu || isCoursesActive ? " active" : ""}`}
                onClick={toggleCoursesMenu}
              >
                Cursos
              </button>
              {showCoursesMenu && (
                <div className="dropdown-courses">
                  <div className="arrow-up" />
                  {options.map((opt, index) => (
                    <button
                      key={index}
                      className={location.pathname.startsWith(opt.path) ? "active" : ""}
                      onClick={() => handleMenuClick(opt.path)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <NavLink to={options[0].path} className={({ isActive }) => (isActive ? "courses active" : "courses")}>
              Cursos
            </NavLink>
          )
        })()}

        {/* Gestiones - Menú completo para Administrador */}
        {isLoggedIn && accountType === "Administrador" && (
          <div className="gestiones-menu" ref={gestionesMenuRef}>
            <button
              className={`gestiones${showGestionesMenu || isGestionesActive ? " active" : ""}`}
              onClick={toggleGestionesMenu}
            >
              Gestiones
            </button>
            {showGestionesMenu && (
              <div className="dropdown-gestiones">
                <div className="arrow-up" />
                <button
                  className={location.pathname.startsWith("/Gestiones/Instructor") ? "active" : ""}
                  onClick={() => handleMenuClick("/Gestiones/Instructor")}
                >
                  Gestión de Instructores
                </button>
                <button
                  className={location.pathname.startsWith("/Gestiones/Gestor") ? "active" : ""}
                  onClick={() => handleMenuClick("/Gestiones/Gestor")}
                >
                  Gestión de Gestores
                </button>
                <button
                  className={location.pathname.startsWith("/Gestiones/Actas") ? "active" : ""}
                  onClick={() => handleMenuClick("/Gestiones/Actas")}
                >
                  Gestión de Actas
                </button>
                <button
                  className={location.pathname.startsWith("/GestionReporteEstadisticas/ReporteEstadisticas") ? "active" : ""}
                  onClick={() => handleMenuClick("/GestionReporteEstadisticas/ReporteEstadisticas")}
                >
                  Reporte y Estadísticas
                </button>
              </div>
            )}
          </div>
        )}

        {/* Gestión de Actas - Solo para Instructor (enlace directo) */}
        {isLoggedIn && accountType === "Instructor" && (
          <NavLink to="/Gestiones/Actas" className={({ isActive }) => (isActive ? "gestiones active" : "gestiones")}>
            Mis Actas
          </NavLink>
        )}

        {/* Empresas (solo Administrador) */}
        {isLoggedIn && accountType === "Administrador" && (
          <NavLink to="/Gestiones/Empresas" className={({ isActive }) => (isActive ? "empresas active" : "empresas")}>
            Empresas
          </NavLink>
        )}

        {/* Empleados (solo Empresa) */}
        {isLoggedIn && accountType === "Empresa" && (
          <NavLink
            to="/Empleados/MisEmpleados"
            className={({ isActive }) => (isActive ? "empleados active" : "empleados")}
          >
            Empleados
          </NavLink>
        )}
      </NavBar>
    </div>
  )
}