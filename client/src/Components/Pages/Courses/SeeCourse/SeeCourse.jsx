import { useEffect, useState } from 'react';
import './SeeCourse.css';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../../Layouts/Header/Header';
import { Footer } from '../../../Layouts/Footer/Footer';
import { Main } from '../../../Layouts/Main/Main';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../../../config/axiosInstance';
import calendar from '../../../../assets/Icons/calendar.png';
import buttonEdit from '../../../../assets/Icons/buttonEdit.png';
import materialIcon from '../../../../assets/Icons/material.png'; 
import { AssignInstructorCourse } from '../AssignInstructorCourse/AssignInstructorCourse';
import ViewCalendar from '../../../UI/Modal_Calendar/ViewCalendar/Calendar';

export const SeeCourse = () => {
	const { id } = useParams();
	const [curso, setCurso] = useState(null);
	const [isViewCalendarOpen, setIsViewCalendarOpen] = useState(false);
	const navigate = useNavigate();
	const [showModal, setShowModal] = useState(false);
	const [temario, setTemario] = useState([]);
	
	// Estado para la duración del curso
	const [duracionCurso, setDuracionCurso] = useState({
		cantidad: "",
		unidad: "horas"
	});
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
					console.error("Error al parsear el temario:", error);
					setTemario([]);
				}
			}
		} catch (error) {
			console.error("Error al obtener el curso:qq", error);
		}
	};

	const fetchEmpresa = async () => {
		try {
			const response = await axiosInstance.get(`api/users/empresa/id/${userSession.empresa_ID}`)
			setEmpresa(response.data)
		} catch (error) {
			console.error("Error al obtener la empresa:", error);
		}
	};

	useEffect(() => {
		fetchCurso();
		if (userSession && userSession.empresa_ID) {
			fetchEmpresa()
		}
	}, [id]);

	if (!curso) {
		return <p>Cargando...</p>;
	}

	const calendarData = {
		startDate: curso.fecha_inicio ? curso.fecha_inicio.split('T')[0] : '',
		endDate: curso.fecha_fin ? curso.fecha_fin.split('T')[0] : '',
		slots_formacion: curso.slots_formacion ? JSON.parse(curso.slots_formacion) : []
	};

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
						{/* Columna Izquierda - Imagen e Info */}
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

							<div className="details-grid">
								<div className="detail-group">
									<label>Configuración del Curso</label>
									<div className="detail-pair">
										<div className="detail-item">
											<span className="detail-label">Tipo de Oferta:</span>
											<span className="detail-value">{curso.tipo_oferta}</span>
										</div>
										<div className="detail-item">
											<span className="detail-label">Estado:</span>
											<span className={`detail-value status-${curso.estado?.toLowerCase().replace(' ', '-')}`}>
												{curso.estado}
											</span>
										</div>
									</div>
								</div>

								<div className="detail-group">
									<label>Instructor</label>
									<div className="detail-item full-width">
										<span className="detail-label">Instructor Asignado:</span>
										<span className="detail-value">
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
								<label>Temario del Curso</label>
								
								{temario.length > 0 ? (
									<div className="syllabus-list">
										<div className="syllabus-header">
											<span>FECHA</span>
											<span>CONTENIDO</span>
										</div>
										{temario.map((item, index) => (
											<div key={index} className="syllabus-item">
												<span className="syllabus-date">{item.fecha}</span>
												<span className="syllabus-topic">{item.tema}</span>
											</div>
										))}
									</div>
								) : (
									<div className="empty-syllabus">
										No hay temas agregados al temario.
									</div>
								)}
							</div>

							{/* Botones de Acción */}
							<div className="action-buttons">
								<button className='material-btn' onClick={()=> navigate(`/SupportMaterialCourse/${id}`)}>
									<img src={materialIcon} alt="Material del curso" className="btn-icon" />
									Ver Material
								</button>

								{/* Botones condicionales */}
								{userSession && (userSession.accountType === 'Administrador' || userSession.accountType === 'Gestor') && (
									<button className='edit-btn' onClick={() => navigate(`/Cursos/ActualizarCurso/${id}`)}>
										<img src={buttonEdit} alt="Editar" className="btn-icon" />
										Editar Curso
									</button>
								)}

								{userSession && (userSession.accountType === 'Administrador' || userSession.accountType === 'Gestor') && (
									<button className='edit-btn' onClick={() => navigate(`/Cursos/Inscripciones/${id}`)}>
										Ver Inscripciones
									</button>
								)}

								{userSession && userSession.accountType === 'Empresa' && (
									<button className='request-btn' onClick={() => navigate(`/SolicitarCurso/${encodeURIComponent(curso.nombre_curso)}`)}>
										Solicitar Curso
									</button>
								)}

								{userSession && userSession.accountType === "Aprendiz" &&(
									<button className='enroll-btn' onClick={() => navigate(`/SolicitarCursoAp/${encodeURIComponent(curso.nombre_curso)}`)}>
										Inscribirse
									</button>
								)}

								{userSession && userSession.accountType === 'Instructor' && (
									<button className='manage-btn' onClick={() => navigate(`/Cursos/${id}/gestionar-asistencia`)}>
										Gestionar Asistencias
									</button>
								)}
								
								{userSession && userSession.accountType === 'Gestor' && (
									<button className='enroll-btn' onClick={() => navigate(`/Cursos/${id}/inscribir-aprendices`)}>
										Inscribir Aprendices
									</button>
								)}	
							</div>
						</div>
					</div>
				</div>
			</Main>
			<Footer />

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