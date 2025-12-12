"use client";

import { useState, useRef, useEffect } from "react";
import { NavBar } from "../../UI/NavBar/NavBar";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import "./Header.css";

export const Header = ({
	setShowSignIn,
	setShowSignUp,
	setShowAccountType,
}) => {
	const [showCoursesMenu, setShowCoursesMenu] = useState(false);
	const [showGestionesMenu, setShowGestionesMenu] = useState(false);
	const [showEmpleadosMenu, setShowEmpleadosMenu] = useState(false);
	const [hoverTimeout, setHoverTimeout] = useState(null);

	const coursesMenuRef = useRef(null);
	const gestionesMenuRef = useRef(null);
	const empleadosMenuRef = useRef(null);

	const navigate = useNavigate();
	const location = useLocation();

	const userSession =
		JSON.parse(localStorage.getItem("userSession")) ||
		JSON.parse(sessionStorage.getItem("userSession"));

	const isLoggedIn = !!userSession;
	const accountType = userSession?.accountType || null;

	const toggleCoursesMenu = () => {
		setShowGestionesMenu(false);
		setShowEmpleadosMenu(false);
		setShowCoursesMenu((prev) => !prev);
	};

	const toggleGestionesMenu = () => {
		setShowCoursesMenu(false);
		setShowEmpleadosMenu(false);
		setShowGestionesMenu((prev) => !prev);
	};

	const toggleEmpleadosMenu = () => {
		setShowCoursesMenu(false);
		setShowGestionesMenu(false);
		setShowEmpleadosMenu((prev) => !prev);
	};

	const handleMenuClick = (path) => {
		navigate(path);
		setShowCoursesMenu(false);
		setShowGestionesMenu(false);
		setShowEmpleadosMenu(false);
	};

	// Cerrar menús al hacer clic fuera
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (
				!coursesMenuRef.current?.contains(event.target) &&
				!gestionesMenuRef.current?.contains(event.target) &&
				!empleadosMenuRef.current?.contains(event.target)
			) {
				setShowCoursesMenu(false);
				setShowGestionesMenu(false);
				setShowEmpleadosMenu(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Limpiar timeout al desmontar
	useEffect(() => {
		return () => {
			if (hoverTimeout) {
				clearTimeout(hoverTimeout);
			}
		};
	}, [hoverTimeout]);

	// Funciones para manejar hover
	const handleMouseEnterCourses = () => {
		if (window.innerWidth >= 769) {
			if (hoverTimeout) {
				clearTimeout(hoverTimeout);
				setHoverTimeout(null);
			}
			setShowGestionesMenu(false);
			setShowEmpleadosMenu(false);
			setShowCoursesMenu(true);
		}
	};

	const handleMouseLeaveCourses = () => {
		if (window.innerWidth >= 769) {
			const timeout = setTimeout(() => {
				setShowCoursesMenu(false);
			}, 300); // 300ms de retraso
			setHoverTimeout(timeout);
		}
	};

	const handleMouseEnterGestiones = () => {
		if (window.innerWidth >= 769) {
			if (hoverTimeout) {
				clearTimeout(hoverTimeout);
				setHoverTimeout(null);
			}
			setShowCoursesMenu(false);
			setShowEmpleadosMenu(false);
			setShowGestionesMenu(true);
		}
	};

	const handleMouseLeaveGestiones = () => {
		if (window.innerWidth >= 769) {
			const timeout = setTimeout(() => {
				setShowGestionesMenu(false);
			}, 300);
			setHoverTimeout(timeout);
		}
	};

	// Función para mantener abierto el dropdown cuando el mouse está sobre él
	const handleDropdownMouseEnter = () => {
		if (window.innerWidth >= 769) {
			if (hoverTimeout) {
				clearTimeout(hoverTimeout);
				setHoverTimeout(null);
			}
		}
	};

	const handleDropdownMouseLeave = () => {
		if (window.innerWidth >= 769) {
			const timeout = setTimeout(() => {
				setShowCoursesMenu(false);
				setShowGestionesMenu(false);
			}, 300);
			setHoverTimeout(timeout);
		}
	};

	// Detectar rutas activas
	const isCoursesActive = [
		"/Cursos/MisCursos",
		"/Cursos/MisCursosAsignados",
		"/Cursos/BuscarCursos",
		"/Cursos/CrearCurso",
		"/SolicitarCurso",
		"/Cursos",
	].some((path) => location.pathname.startsWith(path));

	const isGestionesActive = [
		"/Gestiones/Instructor",
		"/Gestiones/Gestor",
		"/Gestiones/Actas",
		"/Gestiones/Criterios",
		"/Empleados/MisEmpleados",
		"/GestionReporteEstadisticas/ReporteEstadisticas",
		"/reportes/asistencia-progreso",
	].some((path) => location.pathname.startsWith(path));

	const showDropdown = (optionsCount) => optionsCount > 1;

	return (
		<div className="header-container">
			<NavBar
				setShowSignIn={setShowSignIn}
				setShowSignUp={setShowSignUp}
				setShowAccountType={setShowAccountType}
			>
				<NavLink
					to="/"
					className={({ isActive }) =>
						isActive ? "header-link active" : "header-link"
					}
					end
				>
					Inicio
				</NavLink>

				<NavLink
					to="/QuienesSomos"
					className={({ isActive }) =>
						isActive ? "header-link active" : "header-link"
					}
				>
					Quienes somos
				</NavLink>

				{/* Cursos */}
				{(() => {
					let options = [];

					if (!isLoggedIn) {
						return (
							<NavLink
								to="/Cursos/BuscarCursos"
								className={({ isActive }) =>
									isActive ? "header-link active" : "header-link"
								}
							>
								Cursos
							</NavLink>
						);
					}

					switch (accountType) {
						case "Administrador":
							options = [
								{ label: "Mis cursos", path: "/Cursos/MisCursos" },
								{ label: "Buscar cursos", path: "/Cursos/BuscarCursos" },
								{ label: "Crear curso", path: "/Cursos/CrearCurso" },
								{ label: "Material de Apoyo", path: "/SupportMaterial" },
							];
							break;
						case "Instructor":
							options = [
								{ label: "Mis cursos", path: "/Cursos/MisCursosAsignados" },
								{ label: "Buscar cursos", path: "/Cursos/BuscarCursos" },
								{ label: "Material de Apoyo", path: "/SupportMaterial" },
								{ label: "Criterios de certificación", path: "/Gestiones/Criterios" },
							];
							break;
						case "Gestor":
							options = [
								{ label: "Mis cursos", path: "/Cursos/MisCursos" },
								{ label: "Buscar cursos", path: "/Cursos/BuscarCursos" },
								{ label: "Crear curso", path: "/Cursos/CrearCurso" },
								{ label: "Material de Apoyo", path: "/SupportMaterial" },
							];
							break;
						case "Empresa":
							options = [
								{ label: "Mis cursos", path: "/Cursos/MisCursos" },
								{ label: "Buscar cursos", path: "/Cursos/BuscarCursos" },
								{ label: "Solicitar curso", path: "/SolicitarCurso" },
								{ label: "Material de Apoyo", path: "/SupportMaterial" },
							];
							break;
						case "Aprendiz":
							options = [
								{ label: "Mis cursos", path: "/Cursos/MisCursosAsignados" },
								{ label: "Buscar cursos", path: "/Cursos/BuscarCursos" },
								{ label: "Solicitar curso", path: "/SolicitarCursoAp" },
							];
							break;
						default:
							return null;
					}

					return showDropdown(options.length) ? (
						<div
							className="header-dropdown-container"
							ref={coursesMenuRef}
							onMouseEnter={handleMouseEnterCourses}
							onMouseLeave={handleMouseLeaveCourses}
						>
							<button
								className={`header-dropdown-button${showCoursesMenu || isCoursesActive ? " active" : ""
									}`}
								onClick={toggleCoursesMenu}
							>
								Cursos
								<span className="dropdown-arrow">▼</span>
							</button>
							{(showCoursesMenu || (window.innerWidth >= 769 && showCoursesMenu)) && (
								<div
									className="header-dropdown-content"
									onMouseEnter={handleDropdownMouseEnter}
									onMouseLeave={handleDropdownMouseLeave}
								>
									{options.map((opt, index) => (
										<button
											key={index}
											className={
												location.pathname.startsWith(opt.path) ? "active" : ""
											}
											onClick={() => handleMenuClick(opt.path)}
										>
											{opt.label}
										</button>
									))}
								</div>
							)}
						</div>
					) : (
						<NavLink
							to={options[0].path}
							className={({ isActive }) =>
								isActive ? "header-link active" : "header-link"
							}
						>
							Cursos
						</NavLink>
					);
				})()}

				{/* Gestiones - Administrador */}
				{isLoggedIn && accountType === "Administrador" && (
					<div
						className="header-dropdown-container"
						ref={gestionesMenuRef}
						onMouseEnter={handleMouseEnterGestiones}
						onMouseLeave={handleMouseLeaveGestiones}
					>
						<button
							className={`header-dropdown-button${showGestionesMenu || isGestionesActive ? " active" : ""
								}`}
							onClick={toggleGestionesMenu}
						>
							Gestiones
							<span className="dropdown-arrow">▼</span>
						</button>
						{(showGestionesMenu || (window.innerWidth >= 769 && showGestionesMenu)) && (
							<div
								className="header-dropdown-content"
								onMouseEnter={handleDropdownMouseEnter}
								onMouseLeave={handleDropdownMouseLeave}
							>
								<button
									className={
										location.pathname.startsWith("/Gestiones/Instructor") ? "active" : ""
									}
									onClick={() => handleMenuClick("/Gestiones/Instructor")}
								>
									Gestión de Instructores
								</button>
								<button
									className={
										location.pathname.startsWith("/Gestiones/Gestor") ? "active" : ""
									}
									onClick={() => handleMenuClick("/Gestiones/Gestor")}
								>
									Gestión de Gestores
								</button>
								<button
									className={
										location.pathname.startsWith("/Gestiones/Actas") ? "active" : ""
									}
									onClick={() => handleMenuClick("/Gestiones/Actas")}
								>
									Gestión de Actas
								</button>
								<button
									className={
										location.pathname.startsWith("/Gestiones/Criterios") ? "active" : ""
									}
									onClick={() => handleMenuClick("/Gestiones/Criterios")}
								>
									Criterios de certificación
								</button>
								<button
									className={
										location.pathname.startsWith("/Empleados/MisEmpleados") ? "active" : ""
									}
									onClick={() => handleMenuClick("/Empleados/MisEmpleados")}
								>
									Gestión de Empleados
								</button>
								<button
									className={
										location.pathname.startsWith("/Gestiones/Usuarios") ? "active" : ""
									}
									onClick={() => handleMenuClick("/Gestiones/Usuarios")}
								>
									Gestión de Usuarios
								</button>
								<button
									className={
										location.pathname.startsWith("/GestionReporteEstadisticas/ReporteEstadisticas") ? "active" : ""
									}
									onClick={() => handleMenuClick("/GestionReporteEstadisticas/ReporteEstadisticas")}
								>
									Reporte y Estadísticas
								</button>
								<button
									className={
										location.pathname.startsWith("/reportes/asistencia-progreso") ? "active" : ""
									}
									onClick={() => handleMenuClick("/reportes/asistencia-progreso")}
								>
									Asistencia y Progreso
								</button>
							</div>
						)}
					</div>
				)}

				{/* Gestiones - Gestor */}
				{isLoggedIn && accountType === "Gestor" && (
					<div
						className="header-dropdown-container"
						ref={gestionesMenuRef}
						onMouseEnter={handleMouseEnterGestiones}
						onMouseLeave={handleMouseLeaveGestiones}
					>
						<button
							className={`header-dropdown-button${showGestionesMenu || isGestionesActive ? " active" : ""
								}`}
							onClick={toggleGestionesMenu}
						>
							Gestiones
							<span className="dropdown-arrow">▼</span>
						</button>
						{(showGestionesMenu || (window.innerWidth >= 769 && showGestionesMenu)) && (
							<div
								className="header-dropdown-content"
								onMouseEnter={handleDropdownMouseEnter}
								onMouseLeave={handleDropdownMouseLeave}
							>
								<button
									className={
										location.pathname.startsWith("/Gestiones/Instructor") ? "active" : ""
									}
									onClick={() => handleMenuClick("/Gestiones/Instructor")}
								>
									Gestión de Instructores
								</button>
								<button
									className={
										location.pathname.startsWith("/Empleados/MisEmpleados") ? "active" : ""
									}
									onClick={() => handleMenuClick("/Empleados/MisEmpleados")}
								>
									Gestión de Empleados
								</button>
								<button
									className={
										location.pathname.startsWith("/GestionReporteEstadisticas/ReporteEstadisticas") ? "active" : ""
									}
									onClick={() => handleMenuClick("/GestionReporteEstadisticas/ReporteEstadisticas")}
								>
									Reporte y Estadísticas
								</button>
								<button
									className={
										location.pathname.startsWith("/reportes/asistencia-progreso") ? "active" : ""
									}
									onClick={() => handleMenuClick("/reportes/asistencia-progreso")}
								>
									Asistencia y Progreso
								</button>
								<button
									className={
										location.pathname.startsWith("/Gestiones/Actas") ? "active" : ""
									}
									onClick={() => handleMenuClick("/Gestiones/Actas")}
								>
									Gestión de Actas
								</button>
								<button
									className={
										location.pathname.startsWith("/Gestiones/Criterios") ? "active" : ""
									}
									onClick={() => handleMenuClick("/Gestiones/Criterios")}
								>
									Criterios de Certificación
								</button>
							</div>
						)}
					</div>
				)}

				{/* Mis Actas - Instructor */}
				{isLoggedIn && accountType === "Instructor" && (
					<NavLink
						to="/Gestiones/Actas"
						className={({ isActive }) =>
							isActive ? "header-link active" : "header-link"
						}
					>
						Mis Actas
					</NavLink>
				)}

				{/* Empresas e Historial - Administrador */}
				{isLoggedIn && accountType === "Administrador" && (
					<>
						<NavLink
							to="/Gestiones/Empresas"
							className={({ isActive }) =>
								isActive ? "header-link active" : "header-link"
							}
						>
							Empresas
						</NavLink>
						<NavLink
							to="/Gestiones/Historial"
							className={({ isActive }) =>
								isActive ? "header-link active" : "header-link"
							}
						>
							Historial
						</NavLink>
					</>
				)}

				{/* Empleados - Empresa */}
				{isLoggedIn && accountType === "Empresa" && (
					<NavLink
						to="/Empleados/MisEmpleados"
						className={({ isActive }) =>
							isActive ? "header-link active" : "header-link"
						}
					>
						Empleados
					</NavLink>
				)}
			</NavBar>
		</div>
	);
};