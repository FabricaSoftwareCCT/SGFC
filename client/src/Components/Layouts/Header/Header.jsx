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
	const [isMobileView, setIsMobileView] = useState(false);

	const coursesMenuRef = useRef(null);
	const gestionesMenuRef = useRef(null);
	const empleadosMenuRef = useRef(null);

	const navigate = useNavigate();
	const location = useLocation();

	// Detectar tamaño de pantalla
	useEffect(() => {
		const checkMobile = () => {
			setIsMobileView(window.innerWidth <= 768);
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);

		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	}, []);

	const userSession =
		JSON.parse(localStorage.getItem("userSession")) ||
		JSON.parse(sessionStorage.getItem("userSession"));

	const isLoggedIn = !!userSession;
	const accountType = userSession?.accountType || null;

	const toggleCoursesMenu = (e) => {
		if (e) e.stopPropagation();
		setShowGestionesMenu(false);
		setShowEmpleadosMenu(false);
		setShowCoursesMenu((prev) => !prev);
	};

	const toggleGestionesMenu = (e) => {
		if (e) e.stopPropagation();
		setShowCoursesMenu(false);
		setShowEmpleadosMenu(false);
		setShowGestionesMenu((prev) => !prev);
	};

	const toggleEmpleadosMenu = (e) => {
		if (e) e.stopPropagation();
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

	// Cerrar menús al hacer clic fuera (solo en escritorio)
	useEffect(() => {
		// Si es móvil, no usar este listener
		if (isMobileView) {
			return;
		}

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
	}, [isMobileView]);

	// Limpiar timeout al desmontar
	useEffect(() => {
		return () => {
			if (hoverTimeout) {
				clearTimeout(hoverTimeout);
			}
		};
	}, [hoverTimeout]);

	// Funciones para manejar hover (solo escritorio)
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
			}, 300);
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

	// Función para renderizar opciones del dropdown
	const renderDropdownOptions = (options) => {
		if (isMobileView) {
			// En móvil, usar NavLink que funcionará con react-router
			return options.map((opt, index) => (
				<NavLink
					key={index}
					to={opt.path}
					className={({ isActive }) =>
						isActive
							? "header-dropdown-link mobile-dropdown-link active"
							: "header-dropdown-link mobile-dropdown-link"
					}
					onClick={(e) => {
						e.stopPropagation();
						setShowCoursesMenu(false);
						setShowGestionesMenu(false);
						setShowEmpleadosMenu(false);
					}}
					end
				>
					{opt.label}
				</NavLink>
			));
		} else {
			// En escritorio, usar button con onClick
			return options.map((opt, index) => (
				<button
					key={index}
					className={
						location.pathname.startsWith(opt.path) ? "active" : ""
					}
					onClick={() => handleMenuClick(opt.path)}
				>
					{opt.label}
				</button>
			));
		}
	};

	// Función para renderizar opciones de gestión
	const renderGestionesOptions = (options) => {
		if (isMobileView) {
			return options.map((opt, index) => (
				<NavLink
					key={index}
					to={opt.path}
					className={({ isActive }) =>
						isActive
							? "header-dropdown-link mobile-dropdown-link active"
							: "header-dropdown-link mobile-dropdown-link"
					}
					onClick={(e) => {
						e.stopPropagation();
						setShowGestionesMenu(false);
					}}
					end
				>
					{opt.label}
				</NavLink>
			));
		} else {
			return options.map((opt, index) => (
				<button
					key={index}
					className={
						location.pathname.startsWith(opt.path) ? "active" : ""
					}
					onClick={() => handleMenuClick(opt.path)}
				>
					{opt.label}
				</button>
			));
		}
	};

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
					onClick={() => {
						if (isMobileView) {
							setShowCoursesMenu(false);
							setShowGestionesMenu(false);
						}
					}}
				>
					Inicio
				</NavLink>

				<NavLink
					to="/QuienesSomos"
					className={({ isActive }) =>
						isActive ? "header-link active" : "header-link"
					}
					onClick={() => {
						if (isMobileView) {
							setShowCoursesMenu(false);
							setShowGestionesMenu(false);
						}
					}}
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
								onClick={() => {
									if (isMobileView) {
										setShowCoursesMenu(false);
										setShowGestionesMenu(false);
									}
								}}
							>
								Cursos
							</NavLink>
						);
					}

					switch (accountType) {
						case "Administrador":
							options = [								
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
							onClick={(e) => e.stopPropagation()}
						>
							<button
								className={`header-dropdown-button${showCoursesMenu || isCoursesActive ? " active" : ""
									}`}
								onClick={toggleCoursesMenu}
							>
								Cursos
								<span className={`dropdown-arrow ${showCoursesMenu ? "open" : ""}`}>
									▼
								</span>
							</button>
							{(showCoursesMenu || (window.innerWidth >= 769 && showCoursesMenu)) && (
								<div className="header-dropdown-content" onClick={(e) => e.stopPropagation()}>
									{renderDropdownOptions(options)}
								</div>
							)}
						</div>
					) : (
						<NavLink
							to={options[0].path}
							className={({ isActive }) =>
								isActive ? "header-link active" : "header-link"
							}
							onClick={() => {
								if (isMobileView) {
									setShowCoursesMenu(false);
									setShowGestionesMenu(false);
								}
							}}
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
						onClick={(e) => e.stopPropagation()}
					>
						<button
							className={`header-dropdown-button${showGestionesMenu || isGestionesActive ? " active" : ""
								}`}
							onClick={toggleGestionesMenu}
						>
							Gestiones
							<span className={`dropdown-arrow ${showGestionesMenu ? "open" : ""}`}>
								▼
							</span>
						</button>
						{(showGestionesMenu || (window.innerWidth >= 769 && showGestionesMenu)) && (
							<div className="header-dropdown-content" onClick={(e) => e.stopPropagation()}>
								{renderGestionesOptions([
									{ label: "Gestión de Instructores", path: "/Gestiones/Instructor" },
									{ label: "Gestión de Gestores", path: "/Gestiones/Gestor" },
									{ label: "Gestión de Actas", path: "/Gestiones/Actas" },
									{ label: "Criterios de certificación", path: "/Gestiones/Criterios" },
									{ label: "Gestión de Empleados", path: "/Empleados/MisEmpleados" },
									{ label: "Gestión de Usuarios", path: "/Gestiones/Usuarios" },
									{ label: "Reporte y Estadísticas", path: "/GestionReporteEstadisticas/ReporteEstadisticas" },
									{ label: "Asistencia y Progreso", path: "/reportes/asistencia-progreso" },
								])}
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
						onClick={(e) => e.stopPropagation()}
					>
						<button
							className={`header-dropdown-button${showGestionesMenu || isGestionesActive ? " active" : ""
								}`}
							onClick={toggleGestionesMenu}
						>
							Gestiones
							<span className={`dropdown-arrow ${showGestionesMenu ? "open" : ""}`}>
								▼
							</span>
						</button>
						{(showGestionesMenu || (window.innerWidth >= 769 && showGestionesMenu)) && (
							<div className="header-dropdown-content" onClick={(e) => e.stopPropagation()}>
								{renderGestionesOptions([
									{ label: "Gestión de Instructores", path: "/Gestiones/Instructor" },
									{ label: "Gestión de Empleados", path: "/Empleados/MisEmpleados" },
									{ label: "Reporte y Estadísticas", path: "/GestionReporteEstadisticas/ReporteEstadisticas" },
									{ label: "Asistencia y Progreso", path: "/reportes/asistencia-progreso" },
									{ label: "Gestión de Actas", path: "/Gestiones/Actas" },
									{ label: "Criterios de Certificación", path: "/Gestiones/Criterios" },
								])}
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
						onClick={() => {
							if (isMobileView) {
								setShowCoursesMenu(false);
								setShowGestionesMenu(false);
							}
						}}
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
							onClick={() => {
								if (isMobileView) {
									setShowCoursesMenu(false);
									setShowGestionesMenu(false);
								}
							}}
						>
							Empresas
						</NavLink>
						<NavLink
							to="/Gestiones/Historial"
							className={({ isActive }) =>
								isActive ? "header-link active" : "header-link"
							}
							onClick={() => {
								if (isMobileView) {
									setShowCoursesMenu(false);
									setShowGestionesMenu(false);
								}
							}}
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
						onClick={() => {
							if (isMobileView) {
								setShowCoursesMenu(false);
								setShowGestionesMenu(false);
							}
						}}
					>
						Empleados
					</NavLink>
				)}
			</NavBar>
		</div>
	);
};