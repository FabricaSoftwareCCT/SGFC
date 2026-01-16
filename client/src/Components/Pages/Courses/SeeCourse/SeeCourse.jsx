import { useCallback, useEffect, useState } from 'react';
import './SeeCourse.css';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../../Layouts/Header/Header';
import { Footer } from '../../../Layouts/Footer/Footer';
import { Main } from '../../../Layouts/Main/Main';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../../../config/axiosInstance';
import calendar from '../../../../assets/Icons/calendar.png';
import { AssignInstructorCourse } from '../AssignInstructorCourse/AssignInstructorCourse';
import ViewCalendar from '../../../UI/Modal_Calendar/ViewCalendar/Calendar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPenToSquare, faBookOpen, faUsers, faExpandAlt, faXmark, faEye, faSpinner } from '@fortawesome/free-solid-svg-icons'
import ReporteEstudiantes from '../../GestionReporteEstadisticas/ReporteEstudiantes';

import 'sweetalert2/themes/bulma.css';

export const SeeCourse = () => {
	const { id } = useParams();
	const [curso, setCurso] = useState(null);
	const [isViewCalendarOpen, setIsViewCalendarOpen] = useState(false);
	const navigate = useNavigate();
	const [showModal, setShowModal] = useState(false);
	const [temario, setTemario] = useState([]);
	const [isUserEnrolled, setIsUserEnrolled] = useState(false);
	const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
	const [pantallaActual, setPantallaActual] = useState('verCurso');
	const [showTemaModal, setShowTemaModal] = useState(false);
	const [temaSeleccionado, setTemaSeleccionado] = useState({fecha: "", tema: ""});
	const [empresa, setEmpresa] = useState()

	const userSession =
		JSON.parse(localStorage.getItem('userSession')) ||
		JSON.parse(sessionStorage.getItem('userSession'));

	const fetchCurso = async () => {
		try {
			const response = await axiosInstance.get(`api/courses/cursos/${id}`);
			setCurso(response.data);
			// Cargar temario si existe
			if (response.data.temario) {
				try {
					const temarioParseado = JSON.parse(response.data.temario);
					setTemario(temarioParseado);
				} catch (error) {
					// console.error("Error al parsear el temario:", error);
					setTemario([]);
				}
			}
		} catch (error) {
			// console.error("Error al obtener el curso:", error);
			Swal.fire({
				icon: 'error',
				title: 'Error',
				text: 'No se pudo cargar la información del curso',
				confirmButtonText: 'Aceptar',
				theme: 'bulma'
			});
		}
	};

	const fetchEmpresa = async () => {
		try {
			const response = await axiosInstance.get(`api/users/empresa/id/${userSession.empresa_ID}`)
			setEmpresa(response.data)
		} catch (error) {
			// console.error("Error al obtener la empresa:", error);
		}
	};
	
	const handleSelectCurso = (curso) => {
  		const cupos = Number(curso.cupos_disponibles);

  		if (isNaN(cupos) || cupos >= 30) {
    		Swal.fire({
      		icon: "error",
      		title: "Error del sistema",
      		text: "Este curso no tiene empleados registrados. No se puede generar un reporte.",
      		confirmButtonText: "Okay",
      		theme: "bulma",
      		customClass: {
        	confirmButton: 'button is-primary',
        	actions: 'swal2-actions-centered'
      		}
    		});
    		return;
  		}
  		setCursoSeleccionado(curso);
  		setPantallaActual('reporteEstudiantes');
	};


	const handleVolverACursos = () => {
        setPantallaActual('verCurso');
        setCursoSeleccionado(null);
    };


	const checkEnrollmentStatus = useCallback(async () => {
		if (!userSession || userSession.accountType !== "Aprendiz") {
			setIsUserEnrolled(false);
			return;
		}

		try {
			const response = await axiosInstance.get(
				`api/courses/getAllInscripciones/${id}`
			);

			const userId = Number(userSession?.ID || userSession?.id);
			const estaInscrito = Array.isArray(response.data)
				? response.data.some((registro) => {
						const registroId = Number(registro?.id);
						const estado = (registro?.estado || "").toLowerCase();
						return registroId === userId && estado !== "rechazado";
				  })
				: false;

			setIsUserEnrolled(estaInscrito);
		} catch (error) {
			// console.error("Error al verificar la inscripción:", error);
			setIsUserEnrolled(false);
		}
	}, [id, userSession]);

	useEffect(() => {
		fetchCurso();
		if (userSession?.empresa_ID) {
			fetchEmpresa();
		}
	}, [id, userSession?.empresa_ID]);

	useEffect(() => {
		if (userSession?.accountType === "Aprendiz") {
			checkEnrollmentStatus();
		}
	}, [checkEnrollmentStatus, userSession?.accountType]);

	const verTemaCompleto = (tema) => {
		setTemaSeleccionado(tema);
		setShowTemaModal(true);
	};

	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('es-ES', {
			day: '2-digit',
			month: 'short'
		});
	};

	if (!curso) {
		return (
			<>
				<Header />
				<Main>
					<div className="loading-state-see-course">
						<div className="loading-spinner-see-course">
							<FontAwesomeIcon icon={faSpinner} spin />
						</div>
						<p>Cargando curso...</p>
					</div>
				</Main>
				<Footer />
			</>
		);
	}

	const calendarData = {
		startDate: curso.fecha_inicio ? curso.fecha_inicio.split('T')[0] : '',
		endDate: curso.fecha_fin ? curso.fecha_fin.split('T')[0] : '',
		slots_formacion: curso.slots_formacion ? JSON.parse(curso.slots_formacion) : []
	};

	if (pantallaActual === 'reporteEstudiantes') {
		return (
			<ReporteEstudiantes 
				cursoSeleccionado={cursoSeleccionado} 
				onVolver={handleVolverACursos} 
			/>
		)
	}

	const isApprentice = userSession?.accountType === "Aprendiz";
	const userCanSeeActivities = !isApprentice || isUserEnrolled;
	const userCanEnroll = isApprentice && !isUserEnrolled;

	return (
		<>
			<Header />
			<Main>
				<div className="see-course-container">
					{/* Header */}
					<div className="course-header">
						<div className="header-content">
							<h1>Ver <span>Curso</span></h1>
							<div className="ficha-container">
								<label>Ficha N°</label>
								<span className="ficha-number">{curso.ficha}</span>
							</div>
						</div>
					</div>

					{/* Grid Principal */}
					<div className="course-grid">
						{/* Columna Izquierda - Imagen e Info MÁS ANCHA */}
						<div className="side-panel">
							<div className="image-section">
								{curso.imagen ? (
									<img 
										src={`data:image/jpeg;base64,${curso.imagen}`} 
										alt="Imagen del curso" 
										className="course-preview-image" 
									/>
								) : (
									<div className='image-placeholder'>
										<p>No hay imagen disponible</p>
									</div>
								)}
							</div>

							<div className="quick-info">
								<div className="info-item">
									<label>Duración del Curso</label>
									<div className="info-value">
										{curso?.duracion_dias ? `${curso.duracion_dias} días` : "Sin determinar"}
									</div>
								</div>
								<div className="info-item">
									<label>Lugar de Formación</label>
									<div className="info-value">
										{curso?.lugar_formacion ? curso.lugar_formacion : "Sin especificar"}
									</div>
								</div>
								<div className="info-item">
									<label>Cupos Disponibles</label>
									<div className="info-value">
										{curso.cupos_usados ?? 0} / {curso.cupos_disponibles}
									</div>
								</div>
								<button className="schedule-btn" onClick={() => setIsViewCalendarOpen(true)}>
									<img src={calendar} alt="Calendario" />
									Ver Horarios
								</button>
							</div>
						</div>

						{/* Columna Central - Información Principal */}
						<div className="main-info">
							<div className="info-section">
								<label>Nombre del Curso</label>
								<div className="course-name-value">{curso.nombre_curso}</div>
							</div>

							<div className="info-section">
								<label>Descripción del Curso</label>
								<div className="description-text">
									{curso.descripcion}
								</div>
							</div>

							{/* CONFIGURACIÓN DEL CURSO */}
							<div className="course-config-section">
								<label>Configuración del Curso</label>
								<div className="config-grid">
									<div className="config-item">
										<span className="config-label">Tipo de Oferta:</span>
										<span className="config-value">{curso.tipo_oferta}</span>
									</div>
									<div className="config-item">
										<span className="config-label">Estado:</span>
										<span className={`config-value status-${curso.estado?.toLowerCase().replace(' ', '-')}`}>
											{curso.estado}
										</span>
									</div>
									<div className="config-item full-width">
										<span className="config-label">Instructor Asignado:</span>
										<span className="config-value instructor-name">
											{curso?.Instructor ? `${curso.Instructor.nombres} ${curso.Instructor.apellidos}` : "Sin asignar"}
										</span>
									</div>
								</div>
							</div>
						</div>

						{/* Columna Derecha - Temario y Acciones */}
						<div className="side-actions">
							{/* Sección del Temario */}
							<div className="syllabus-section">
								<div className="syllabus-header-container">
									<label>Temario del Curso</label>
									<span className="topic-count">{temario.length} Temas</span>
								</div>
								
								{temario.length > 0 ? (
									<div className="syllabus-list-container">
										<div className="syllabus-list">
											<div className="syllabus-header">
												<span className="header-date">FECHA</span>
												<span className="header-content">CONTENIDO</span>
												<span className="header-action">ACCIÓN</span>
											</div>
											{temario.map((item, index) => (
												<div key={index} className="syllabus-item">
													<span className="syllabus-date">{formatDate(item.fecha)}</span>
													<span className="syllabus-topic">
														{item.tema.length > 100 ? `${item.tema.substring(0, 100)}...` : item.tema}
													</span>
													{item.tema.length > 100 && (
														<button 
															className="view-tema-btn"
															onClick={() => verTemaCompleto(item)}
															title="Ver tema completo"
														>
															<FontAwesomeIcon icon={faEye} />
														</button>
													)}
													{item.tema.length <= 100 && (
														<div className="no-action-placeholder"></div>
													)}
												</div>
											))}
										</div>
									</div>
								) : (
									<div className="empty-syllabus">
										<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
											<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
											<polyline points="14 2 14 8 20 8"></polyline>
											<line x1="16" y1="13" x2="8" y2="13"></line>
											<line x1="16" y1="17" x2="8" y2="17"></line>
											<polyline points="10 9 9 9 8 9"></polyline>
										</svg>
										<p>No hay temas agregados al temario aún.</p>
									</div>
								)}
							</div>

							{/* Botones de Acción */}
							<div className="action-buttons">
								{userCanSeeActivities && (
									<button
										className="material-btn"
										onClick={() => navigate(`/Cursos/${id}/actividades`)}
									>
										<FontAwesomeIcon icon={faBookOpen} className="btn-icon" />
										Ver Actividades
									</button>
								)}
								
								<button className='material-btn' onClick={()=> navigate(`/SupportMaterialCourse/${id}`)}>
									<FontAwesomeIcon icon={faBookOpen} className="btn-icon" />
									Ver Material
								</button>

								{/* Botones condicionales */}
								{userSession && (userSession.accountType === 'Administrador' || userSession.accountType === 'Gestor') && (
									<button className='edit-btn' onClick={() => navigate(`/Cursos/ActualizarCurso/${id}`)}>
										 <FontAwesomeIcon icon={faPenToSquare} className="btn-icon" />
										Editar Curso
									</button>
								)}

								{userSession && (userSession.accountType === 'Administrador' || userSession.accountType === 'Gestor') && (
									<button className='edit-btn' onClick={() => navigate(`/Cursos/Inscripciones/${id}`)}>
										<FontAwesomeIcon icon={faUsers} className="btn-icon" />
										Ver Inscripciones
									</button>
								)}

								{userSession && userSession.accountType === 'Empresa' && !id && (
									<button className='request-btn' onClick={() => navigate(`/SolicitarCurso/${encodeURIComponent(curso.nombre_curso)}`)}>
										Solicitar Curso
									</button>
								)}

								{userSession && (userSession.accountType === 'Empresa' || userSession.accountType === 'Instructor') && (
									<button className='request-btn'
										onClick={(e) => {
											e.stopPropagation();
											handleSelectCurso(curso)
											}}
									>
										Reporte y Estadisticas
									</button>
								)}

								{userCanEnroll && (
									<button
										className="enroll-btn"
										onClick={() =>
											navigate(`/SolicitarCursoAp/${encodeURIComponent(curso.nombre_curso)}`)
										}
									>
										Inscribirse
									</button>
								)}

								{userSession && userSession.accountType === 'Instructor' && userSession.id === curso.Instructor?.ID && (
									<button className='manage-btn' onClick={() => navigate(`/Cursos/${id}/gestionar-asistencia`)}>
										Gestionar Asistencias
									</button>
								)}
							</div>
						</div>
					</div>
				</div>
			</Main>
			<Footer />

			{/* Modal para ver tema completo */}
			{showTemaModal && (
				<div className="tema-modal-overlay">
					<div className="tema-modal">
						<div className="tema-modal-header">
							<h3>Tema Completo</h3>
							<button 
								className="close-modal-btn"
								onClick={() => setShowTemaModal(false)}
							>
								<FontAwesomeIcon icon={faXmark} />
							</button>
						</div>
						<div className="tema-modal-content">
							<div className="tema-info">
								<div className="tema-fecha">
									<strong>Fecha:</strong> {temaSeleccionado.fecha}
								</div>
								<div className="tema-contenido">
									<strong>Contenido:</strong>
									<div className="tema-texto">
										{temaSeleccionado.tema}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{showModal && curso && (
				<AssignInstructorCourse 
					curso_ID={curso.ID} 
					onClose={() => setShowModal(false)} 
				/>
			)}

			{isViewCalendarOpen && (
				<ViewCalendar 
					calendarData={calendarData} 
					closeModal={() => setIsViewCalendarOpen(false)} 
				/>
			)}
		</>
	);
};