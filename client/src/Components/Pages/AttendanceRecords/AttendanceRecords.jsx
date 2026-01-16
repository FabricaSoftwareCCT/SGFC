import React, { useState, useEffect } from 'react';
import './AttendanceRecords.css';
import { Footer } from '../../../Components/Layouts/Footer/Footer';
import { Main } from '../../../Components/Layouts/Main/Main';
import axiosInstance from '../../../config/axiosInstance';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Swal from 'sweetalert2';

export const AttendanceRecords = () => {
    const [records, setRecords] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [courses, setCourses] = useState([]);
    const [filter, setFilter] = useState('');
    const [current, setCurrent] = useState(0);
    const [selectedStatus, setSelectedStatus] = useState({
        Presente: true,
        Ausente: true,
        Justificado: true
    });
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');

    // Obtener registros de asistencia
    const fetchRecords = async () => {
        try {
            const userSession = JSON.parse(localStorage.getItem('userSession')) || 
                              JSON.parse(sessionStorage.getItem('userSession'));
            
            if (!userSession) {
                await Swal.fire({
                    icon: 'warning',
                    title: 'Sesión no encontrada',
                    text: 'No se encontró la sesión de usuario.',
                    confirmButtonText: 'Aceptar',
                    theme: "bulma",
                    customClass: {
                        actions: 'swal2-center-actions'
                    }
                });
                return;
            }

            const params = {};
            
            if (selectedDate) {
                params.startDate = selectedDate;
                params.endDate = selectedDate;
            }

            if (selectedCourse) {
                params.courseId = selectedCourse;
            }

            const response = await axiosInstance.get('/api/attendance/records', { params });
            
            if (response.data.success) {
                setRecords(response.data.records);
                setFilteredRecords(response.data.records);
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al cargar los registros de asistencia',
                    confirmButtonText: 'Aceptar',
                    theme: "bulma",
                    customClass: {
                        actions: 'swal2-center-actions'
                    }
                });
            }
        } catch (error) {
            // console.error('Error al obtener los registros:', error);
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al cargar los registros de asistencia',
                confirmButtonText: 'Aceptar',
                theme: "bulma",
                customClass: {
                    actions: 'swal2-center-actions'
                }
            });
        }
    };

    // Obtener cursos disponibles
    const fetchCourses = async () => {
        try {
            const response = await axiosInstance.get('/api/courses/cursos');
            setCourses(response.data);
        } catch (error) {
            // console.error('Error al obtener los cursos:', error);
                        await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al cargar la lista de cursos',
                confirmButtonText: 'Aceptar',
                theme: "bulma",
                customClass: {
                    actions: 'swal2-center-actions'
                }
            });
        }
    };

    useEffect(() => {
        fetchCourses();
        fetchRecords();
    }, [selectedDate, selectedCourse]);

    useEffect(() => {
        applyFilters();
    }, [selectedStatus, filter, records]);

    const applyFilters = () => {
        let filtered = records;

        // Filtrar por estado
        filtered = filtered.filter(record => 
            selectedStatus[record.estado]
        );

        // Filtrar por texto (nombre del participante o curso)
        if (filter) {
            const searchTerm = filter.toLowerCase();
            filtered = filtered.filter(record =>
                record.aprendiz.nombres.toLowerCase().includes(searchTerm) ||
                record.aprendiz.apellidos.toLowerCase().includes(searchTerm) ||
                record.Sesion.Curso.nombre_curso.toLowerCase().includes(searchTerm)
            );
        }

        setFilteredRecords(filtered);
        setCurrent(0);
    };

    const handleFilterChange = (e) => {
        setFilter(e.target.value.toLowerCase());
    };

    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
    };

    const handleCourseChange = (e) => {
        setSelectedCourse(e.target.value);
    };

    const next = () => setCurrent((prev) => (prev + 1) % filteredRecords.length);
    const prev = () => setCurrent((prev) => (prev - 1 + filteredRecords.length) % filteredRecords.length);

    return (
        <>
            <Main>
                <div className="container_AttendanceRecords">
                    <h2>
                        Registros de <span className="complementary">Asistencia</span>
                    </h2>

                    <div className="containerAttendanceRecordsOptions">
                        <div className="containerConsultAttendance">
                            <p>Filtrar por:</p>
                            <div className="containerFiltersAttendance">
                                <label htmlFor="inputSearch">Nombre o Curso</label>
                                <div className="inputSearchContainer">
                                    <input
                                        type="text"
                                        id="inputSearch"
                                        placeholder="Escriba el nombre o el curso"
                                        value={filter}
                                        onChange={handleFilterChange}
                                    />
                                </div>

                                <label>Fecha</label>
                                <div className="dateFilter">
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={handleDateChange}
                                    />
                                </div>

                                <label>Curso</label>
                                <div className="courseFilter">
                                    <select value={selectedCourse} onChange={handleCourseChange}>
                                        <option value="">Todos los cursos</option>
                                        {courses.map(course => (
                                            <option key={course.ID} value={course.ID}>
                                                {course.nombre_curso}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <label>Estado</label>
                                <div className="statusButtons">
                                    <button
                                        className={`status-btn ${selectedStatus.Presente ? 'selected' : ''}`}
                                        onClick={() => setSelectedStatus(prev => ({
                                            ...prev,
                                            Presente: !prev.Presente
                                        }))}
                                    >
                                        Presente
                                    </button>
                                    <button
                                        className={`status-btn ${selectedStatus.Ausente ? 'selected' : ''}`}
                                        onClick={() => setSelectedStatus(prev => ({
                                            ...prev,
                                            Ausente: !prev.Ausente
                                        }))}
                                    >
                                        Ausente
                                    </button>
                                    <button
                                        className={`status-btn ${selectedStatus.Justificado ? 'selected' : ''}`}
                                        onClick={() => setSelectedStatus(prev => ({
                                            ...prev,
                                            Justificado: !prev.Justificado
                                        }))}
                                    >
                                        Justificado
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="containerAttendanceRecordsResults">
                            {filteredRecords.length > 1 && (
                                <button className="arrow left" onClick={prev}>❮</button>
                            )}

                            <div className="carousel-container">
                                <div className="carousel-track">
                                    {filteredRecords.length === 0 ? (
                                        <p className="no-results">No hay registros de asistencia</p>
                                    ) : (
                                        filteredRecords.slice(current, current + 3).map((record, index) => (
                                            <div 
                                                key={record.ID} 
                                                className={`carousel-card ${index === 1 ? 'card-center' : 'card-side'}`}
                                            >
                                                <div className="attendance-info">
                                                    <h3>{record.aprendiz.nombres} {record.aprendiz.apellidos}</h3>
                                                    <p className="course-name">{record.Sesion.Curso.nombre_curso}</p>
                                                    <p className="attendance-date">
                                                        {format(new Date(record.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                                                    </p>
                                                    <p className={`attendance-status ${record.estado.toLowerCase()}`}>
                                                        {record.estado}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {filteredRecords.length > 1 && (
                                <button className="arrow right" onClick={next}>❯</button>
                            )}
                        </div>
                    </div>
                </div>
            </Main>
            <Footer />
        </>
    );
}; 