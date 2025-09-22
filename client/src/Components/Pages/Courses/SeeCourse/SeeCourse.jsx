import React, { useEffect, useState } from 'react';
import './SeeCourse.css';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate
import { Header } from '../../../Layouts/Header/Header';
import { Footer } from '../../../Layouts/Footer/Footer';
import { Main } from '../../../Layouts/Main/Main';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../../../config/axiosInstance';
import calendar from '../../../../assets/Icons/calendar.png';
import buttonEdit from '../../../../assets/Icons/buttonEdit.png';
import { AssignInstructorCourse } from '../AssignInstructorCourse/AssignInstructorCourse';
import ViewCalendar from '../../../UI/Modal_Calendar/ViewCalendar/Calendar';

export const SeeCourse = () => {

    const { id } = useParams(); // Obtener el ID del curso desde la URL
    const [curso, setCurso] = useState(null); // Estado para almacenar los datos del curso
    const [isViewCalendarOpen, setIsViewCalendarOpen] = useState(false);
    const navigate = useNavigate(); // Hook para redirigir
    const [showModal, setShowModal] = useState(false);


    const showModalAssignInstructor = () => {
        console.log("Mostrando modal con ID:", curso?.ID);
        setShowModal(true);
    };

    const userSession =
        JSON.parse(localStorage.getItem('userSession')) ||
        JSON.parse(sessionStorage.getItem('userSession'));



    // Obtener los datos del curso al cargar la página
    useEffect(() => {
        const fetchCurso = async () => {
            try {
                const response = await axiosInstance.get(`api/courses/cursos/${id}`); // Solicitud al endpoint de obtener curso por ID
                setCurso(response.data); // Guardar los datos del curso en el estado
            } catch (error) {
                console.error("Error al obtener el curso:", error);
            }
        };

        fetchCurso();
    }, [id]);

    if (!curso) {
        return <p>Cargando...</p>; // Mostrar un mensaje mientras se cargan los datos
    }

    // Prepare calendar data for ViewCalendar component
    const calendarData = {
        startDate: curso.fecha_inicio ? curso.fecha_inicio.split('T')[0] : '',
        endDate: curso.fecha_fin ? curso.fecha_fin.split('T')[0] : '',
        slots_formacion: curso.slots_formacion ? JSON.parse(curso.slots_formacion) : []
    };


    return (
        <>
            <Header />
            <Main>
                <div className='container_createCourse'>
                    <h2 id='title_seeCourse'>
                        {curso.nombre_curso}
                    </h2>

                    <div className='containerInformation_CreateCourse'>
                        <label className='containerImgCourse'>
                            {curso.imagen ? (
                                <img
                                    src={`data:image/jpeg;base64,${curso.imagen}`}
                                    alt="Imagen del curso"
                                    className="imgCourse"
                                />
                            ) : (
                                <div className='upload-placeholder'>
                                    <p>No hay imagen disponible</p>
                                </div>
                            )}
                        </label>

                        <div className='containerDetails_course'>
                            <div id='containerInput_ficha'>
                                <label className='fichaCourseLabel' htmlFor="fichaCourse">Ficha: {curso.ficha} </label>

                            </div>

                            <p id='descripcionSeeCurso'>{curso.descripcion}</p>

                            <div className='containerDetails_course2'>
                                <div>
                                    <div className="offer-type-container">
                                        <span>Tipo de oferta: {curso.tipo_oferta} </span>

                                    </div>
                                    <div className="offer-type-container">
                                        <span>Estado: {curso.estado} </span>

                                    </div>
                                    <div className="offer-type-container">
                                        <span>
                                            Empresa: {curso.Empresa?.nombre_empresa ? curso.Empresa.nombre_empresa : "Sin empresa asignada"}
                                        </span>
                                    </div>
                                    <div className="offer-type-container">
                                        <span>
                                            Instructor: {curso?.Instructor? `${curso.Instructor.nombres} ${curso.Instructor.apellidos}`: "Sin asignar"}
                                        </span>
                                        
                                    </div>

                                </div>

                                <div>

                                    {/* Botón para abrir el modal general */}
                                    <button className='addDate' onClick={() => setIsViewCalendarOpen(true)}>
                                        <img src={calendar} alt="" />
                                        Ver fechas y horarios
                                    </button>
                                </div>
                            </div>
                            {/* Mostrar botón solo si el usuario es Administrador o Gestor */}
                            {userSession && (userSession.accountType === 'Administrador' || userSession.accountType === 'Gestor') && (
                                <button
                                    className='editCourse'
                                    onClick={() => navigate(`/Cursos/ActualizarCurso/${id}`)}
                                >
                                    Editar Curso
                                </button>
                            )}
                            {/* Mostrar botón solo si el usuario es Empresa */}
                            {userSession && (userSession.accountType === 'Empresa') && (
                                <button
                                    className='editCourse'
                                    onClick={() => navigate(`/SolicitarCurso/${encodeURIComponent(curso.nombre_curso)}`)}                                >
                                    Solicitar Curso
                                </button>
                            )}
                            {/* Mostrar botón solo si el usuario es Instructor */}
                            {userSession && (userSession.accountType === 'Instructor') && (
                                <button
                                    className='manageAttendance'
                                    onClick={() => navigate(`/Cursos/${id}/gestionar-asistencia`)}
                                >
                                    Gestionar Asistencias
                                </button>
                            )}
                        </div>
                    </div>

                </div>

            </Main>
            <Footer />
            {showModal && curso && (
                <AssignInstructorCourse
                    curso_ID={curso.ID}
                    onClose={() => setShowModal(false)} // Para poder cerrarlo desde dentro
                />

            )}
            {isViewCalendarOpen && (
                <ViewCalendar
                    calendarData={calendarData}
                    closeModal={() => setIsViewCalendarOpen(false)}
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