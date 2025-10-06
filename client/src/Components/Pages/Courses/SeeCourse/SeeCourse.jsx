import React, { useEffect, useState } from 'react';
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
    const [showMaterial, setShowMaterial] = useState(false); // Cambié el nombre para evitar conflicto con el import

    const showModalAssignInstructor = () => {
        console.log("Mostrando modal con ID:", curso?.ID);
        setShowModal(true);
    };

    const userSession =
        JSON.parse(localStorage.getItem('userSession')) ||
        JSON.parse(sessionStorage.getItem('userSession'));

    useEffect(() => {
        const fetchCurso = async () => {
            try {
                const response = await axiosInstance.get(`api/courses/cursos/${id}`);
                setCurso(response.data);
            } catch (error) {
                console.error("Error al obtener el curso:", error);
            }
        };

        fetchCurso();
    }, [id]);

    if (!curso) {
        return <p>Cargando...</p>;
    }

    const calendarData = {
        startDate: curso.fecha_inicio ? curso.fecha_inicio.split('T')[0] : '',
        endDate: curso.fecha_fin ? curso.fecha_fin.split('T')[0] : '',
        slots_formacion: curso.slots_formacion ? JSON.parse(curso.slots_formacion) : []
    };

    const handleMaterialClick = () => {
        navigate('/SupportMaterial')
    }

    return (
        <>
            <Header />
            <Main className="course-page-main">
                <div className='course-page-container'>
                    <div className='course-date'>
                        Ficha: {curso.ficha}
                    </div>

                    <div className='course-content'>
                        <div className='course-left-section'>
                            <h1 className='course-title'>
                                {curso.nombre_curso}
                            </h1>
                            
                            <div className='course-image-container'>
                                {curso.imagen ? (
                                    <img 
                                        src={`data:image/jpeg;base64,${curso.imagen}`} 
                                        alt="Imagen del curso" 
                                        className="course-image" 
                                    />
                                ) : (
                                    <div className='image-placeholder'>
                                        <p>No hay imagen disponible</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className='course-info'>
                            <div className='course-description'>
                                <p>{curso.descripcion}</p>
                            </div>

                            <div className='course-details-grid'>
                                <div className='detail-row'>
                                    <div className='detail-item'>
                                        <span className='detail-label'>Tipo de oferta:</span>
                                        <span className='detail-value'>{curso.tipo_oferta}</span>
                                    </div>
                                    <div className='detail-item'>
                                        <span className='detail-label'>Estado:</span>
                                        <span className='detail-value detail-status'>{curso.estado}</span>
                                    </div>
                                </div>

                                <div className='detail-row'>
                                    <div className='detail-item'>
                                        <span className='detail-label'>Instructor:</span>
                                        <span className='detail-value'>
                                            {curso?.Instructor ? `${curso.Instructor.nombres} ${curso.Instructor.apellidos}` : "Sin asignar"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className='action-buttons'>
                                {/* Botón de Calendario */}
                                <button className='calendar-btn' onClick={() => setIsViewCalendarOpen(true)}>
                                    <img src={calendar} alt="Calendario" className="btn-icon" />
                                    Ver fechas y horarios
                                </button>

                                {/* Botón de Material */}
                                <button className='material-btn' onClick={()=> navigate(`/SupportMaterialCourse`)}>
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

                                {userSession && userSession.accountType === 'Empresa' && (
                                    <button className='edit-btn' onClick={() => navigate(`/SolicitarCurso/${encodeURIComponent(curso.nombre_curso)}`)}>
                                        Solicitar Curso
                                    </button>
                                )}

              {userSession && userSession.accountType === "Aprendiz" &&(
                <button className='edit-btn' onClick={() => navigate(`/SolicitarCursoAp/${encodeURIComponent(curso.nombre_curso)}`)}>
                  Inscribirse
                </button>
              )}

                                {userSession && userSession.accountType === 'Instructor' && (
                                    <button className='edit-btn' onClick={() => navigate(`/Cursos/${id}/gestionar-asistencia`)}>
                                        Gestionar Asistencias
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