import "./Criteria.css"
import { useNavigate } from "react-router-dom";
import { Header } from "../../Layouts/Header/Header";
import { useEffect, useState } from "react";
import { Main } from "../../Layouts/Main/Main";
import axiosInstance from "../../../config/axiosInstance";
import { CourseList } from "../../UI/CourseList/CourseList";
import Swal from "sweetalert2";
import 'sweetalert2/themes/bulma.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCertificate, faHistory, faEye, faListCheck, faChartLine, faCheck, faFolderOpen } from '@fortawesome/free-solid-svg-icons';

export const CriteriaManagement = () => {
	const navigate = useNavigate()

	const userSession = JSON.parse(localStorage.getItem("userSession")) || JSON.parse(sessionStorage.getItem("userSession"))

	const isLoggedIn = !!userSession
	const accountType = userSession?.accountType || null

	const [cursos, setCursos] = useState([])
	const [todosLosCursos, setTodosLosCursos] = useState([])
	const [loading, setLoading] = useState(true)
	const [current, setCurrent] = useState(0)

	async function fetchCourses() {
		let response = null
		let courses = []
		try {
			switch (accountType) {
				case "Administrador":
					response = await axiosInstance.get("/api/courses/cursos")
					courses = response.data
					break
				case "Instructor":
					const instructorId = userSession.ID || userSession.id;
					response = await axiosInstance.get(`/api/courses/cursos-asignados/${instructorId}`)
					courses = response.data.map((curso) => ({
						...curso.Curso
					}))
					break
				case "Gestor":
					response = await axiosInstance.get("/api/courses/cursos")
					courses = response.data
					break
			}
			if (response.status != 200 && response.status != 304) {
				throw response.data
			}
			const todosLosCursos = courses.map(curso => ({
				...curso,
				ID: curso.ID || curso.id,
			}));
			setTodosLosCursos(todosLosCursos)
			setCursos(todosLosCursos)
			setLoading(false)
		} catch (e) {
			console.log(e)
			await Swal.fire({
				icon: 'error',
				title: 'Error',
				text: 'Ocurrió un error al cargar los cursos',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#d33',
				theme: "bulma",
				customClass: {
					confirmButton: 'centered-swal-button'
				}
			});
		}
	}

	function getCurso() {
		const index = (current + cursos.length) % cursos.length;
		return cursos[index];
	};

	function seeCourseCriteria() {
		if (cursos.length > 0) {
			navigate(`/Gestiones/Criterios/Ver/${getCurso().ID}`)
		} else {
			Swal.fire({
				icon: 'warning',
				title: 'Sin cursos',
				text: 'No hay cursos disponibles para ver criterios',
				confirmButtonText: 'Entendido',
				confirmButtonColor: '#3085d6',
				theme: "bulma",
				customClass: { confirmButton: 'centered-swal-button' }
			});
		}
	}

	function seeCourseCriteriaHistorial() {
		if (cursos.length > 0) {
			navigate(`/Gestiones/Criterios/Historial/${getCurso().ID}`)
		} else {
			Swal.fire({
				icon: 'warning',
				title: 'Sin cursos',
				text: 'No hay cursos disponibles para ver el historial',
				confirmButtonText: 'Entendido',
				confirmButtonColor: '#3085d6',
				theme: "bulma",
				customClass: { confirmButton: 'centered-swal-button' }
			});
		}
	}

	useEffect(() => {
		if (isLoggedIn && (accountType === "Instructor" || accountType == "Administrador" || accountType === "Gestor")) {
			fetchCourses()
		} else {
			navigate("/no-autorizado");
		}
	}, [])

	return (
		<>
			<Header />
			<Main>
				<div className="criteria-management-container">
					{/* Header Mejorado */}
					<div className="criteria-header-improved">
						<div className="header-content-improved">
							<h1>Criterios de <span>Certificación</span></h1>
							<div className="header-stats-improved">
								<div className="stat-item-improved">
									<span className="stat-number">{cursos.length}</span>
									<span className="stat-label">Cursos Disponibles</span>
								</div>
							</div>
						</div>
					</div>

					{/* Contenido Principal */}
					<div className="main-content-improved">
						{/* Panel de Carrusel */}
						<div className="carousel-panel">
							{loading ? (
								<div className="loading-state-improved">
									<div className="loading-spinner-improved"></div>
									<p>Cargando cursos...</p>
								</div>
							) : cursos.length > 0 ? (
								<div className="carousel-content">
									<CourseList
										cursos={cursos}
										loading={loading}
										onChange={(c) => setCurrent(c)}
										compact={true}
									/>

									<div className="carousel-controls">
										<div className="carousel-info-improved">
											<span className="current-course-info">
												Curso {current + 1} de {cursos.length}
											</span>
											{cursos[current] && (
												<span className="course-ficha-info">
													Ficha: {cursos[current].ficha}
												</span>
											)}
										</div>

										<div className="carousel-actions">
											<button
												className="criteria-btn-improved primary"
												onClick={seeCourseCriteria}
											>
												<FontAwesomeIcon icon={faEye} className="btn-icon" />
												Ver Criterios
											</button>
											<button
												className="criteria-btn-improved secondary"
												onClick={seeCourseCriteriaHistorial}
											>
												<FontAwesomeIcon icon={faHistory} className="btn-icon" />
												Ver Historial
											</button>
										</div>
									</div>

									{/* Información del Curso Seleccionado */}
									{cursos.length > 0 && getCurso() && (
										<div className="selected-course-info-improved">
											<div className="selected-course-card">
												<FontAwesomeIcon icon={faCertificate} className="selected-course-icon" />
												<div className="selected-course-content">
													<h4 className="course-name">{getCurso().nombre_curso}</h4>
													<p className="course-details">
														Ficha: <strong>{getCurso().ficha}</strong> |
														Estado: <span className={`status-badge status-${getCurso().estado?.toLowerCase() || 'desconocido'}`}>
															{getCurso().estado || 'Sin estado'}
														</span>
													</p>
												</div>
											</div>
										</div>
									)}
								</div>
							) : (
								<div className="no-courses-improved">
									<div className="no-courses-icon"><FontAwesomeIcon icon={faFolderOpen} /></div>
									<h3>No se encontraron cursos</h3>
									<p>No hay cursos disponibles para gestionar criterios</p>
									<button
										className="reset-filters-btn-improved"
										onClick={() => fetchCourses()}
									>
										Reintentar carga
									</button>
								</div>
							)}
						</div>

						{/* Panel de Información Lateral */}
						<div className="info-panel-improved">
							<div className="side-panel-card">
								<div className="side-panel-header">
									<h3>Gestión de Criterios</h3>
									<p>Administra y consulta los criterios de certificación para cada curso</p>
								</div>

								<div className="stats-grid-improved">
									<div className="stat-card-improved">
										<div className="stat-icon-container">
											<FontAwesomeIcon icon={faChartLine} className="stat-icon" />
										</div>
										<div className="stat-content">
											<span className="stat-value">{todosLosCursos.length}</span>
											<span className="stat-label">Total Cursos</span>
										</div>
									</div>
									<div className="stat-card-improved">
										<div className="stat-icon-container">
											<FontAwesomeIcon icon={faCheck} className="stat-icon" />
										</div>
										<div className="stat-content">
											<span className="stat-value">
												{todosLosCursos.filter(c => c.estado?.toLowerCase() === 'activo').length}
											</span>
											<span className="stat-label">Cursos Activos</span>
										</div>
									</div>
								</div>

								<div className="quick-info-improved">
									<h4>¿Qué puedes hacer?</h4>
									<ul>
										<li>Ver criterios de certificación</li>
										<li>Consultar historial de cambios</li>
										<li>Gestionar evaluaciones</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				</div>
			</Main>
		</>
	);
}