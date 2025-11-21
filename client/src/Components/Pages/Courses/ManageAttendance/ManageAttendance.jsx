import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Main } from '../../../Layouts/Main/Main';
import { Footer } from '../../../Layouts/Footer/Footer';
import axiosInstance from '../../../../config/axiosInstance';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { AttendanceManagement } from '../SeeCourse/AttendanceManagement';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCalendarAlt, faChevronLeft, faChevronRight, faCheckCircle, faClock } from '@fortawesome/free-solid-svg-icons';
import './ManageAttendance.css';

export const ManageAttendance = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [curso, setCurso] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [showAttendanceManagement, setShowAttendanceManagement] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [trainingDays, setTrainingDays] = useState([]);

    useEffect(() => {
        const fetchCurso = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await axiosInstance.get(`/api/courses/cursos/${id}`);
                console.log('Datos del curso recibidos:', response.data);
                setCurso(response.data);

                if (response.data.dias_formacion) {
                    try {
                        const diasFormacion = JSON.parse(response.data.dias_formacion);
                        console.log('Días de formación procesados:', diasFormacion);
                        const diasProcesados = diasFormacion.map(dia => {
                            if (typeof dia === 'string') {
                                return dia;
                            } else if (dia.dia && dia.hora) {
                                return `${dia.dia}-${dia.hora}`;
                            }
                            return null;
                        }).filter(Boolean);

                        console.log('Días de formación procesados:', diasProcesados);
                        setTrainingDays(diasProcesados);
                    } catch (error) {
                        console.error('Error al procesar los días de formación:', error);
                        setTrainingDays([]);
                    }
                } else {
                    console.log('No hay días de formación definidos');
                    setTrainingDays([]);
                }
            } catch (error) {
                console.error("Error al obtener el curso:", error);
                setError("Error al cargar los datos del curso. Por favor, intente nuevamente.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchCurso();
    }, [id]);

    const handleDateSelect = (date) => {
        console.log('Fecha seleccionada:', date);
        if (date) {
            console.log('Actualizando estado con fecha:', date);
            setSelectedDate(date);
            setShowAttendanceManagement(true);
        }
    };

    const handleCloseAttendanceManagement = () => {
        setShowAttendanceManagement(false);
        setSelectedDate('');
    };

    const handleMonthChange = (direction) => {
        setCurrentMonth(prev => {
            return direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1);
        });
    };

    // Función CORREGIDA: Permite seleccionar cualquier día desde el inicio del curso
    const isSelectableDate = (date) => {
        if (!curso?.fecha_inicio || !curso?.fecha_fin) {
            return false;
        }
        
        const startDateObj = parseISO(curso.fecha_inicio);
        const endDateObj = parseISO(curso.fecha_fin);
        const today = new Date();
        const currentDate = date;
        
        // Crear fechas sin hora para comparación
        const startDateOnly = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate());
        const endDateOnly = new Date(endDateObj.getFullYear(), endDateObj.getMonth(), endDateObj.getDate());
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        
        // Verificar si la fecha está dentro del rango del curso
        const isInCourseRange = currentDateOnly >= startDateOnly && currentDateOnly <= endDateOnly;
        
        // Verificar si la fecha es hoy o una fecha pasada
        const isTodayOrPast = currentDateOnly <= todayOnly;
        
        console.log('=== VERIFICANDO FECHA ===');
        console.log('Fecha a verificar:', format(currentDateOnly, 'yyyy-MM-dd'));
        console.log('Inicio curso:', format(startDateOnly, 'yyyy-MM-dd'));
        console.log('Fin curso:', format(endDateOnly, 'yyyy-MM-dd'));
        console.log('Hoy:', format(todayOnly, 'yyyy-MM-dd'));
        console.log('Está en rango:', isInCourseRange);
        console.log('Es hoy o pasado:', isTodayOrPast);
        console.log('Es seleccionable:', isInCourseRange && isTodayOrPast);
        
        return isInCourseRange && isTodayOrPast;
    };

    // Función para verificar si es día de formación (solo para mostrar visualmente)
    const isTrainingDay = (date) => {
        if (!trainingDays.length || !curso?.fecha_inicio || !curso?.fecha_fin) return false;
        
        const startDateObj = parseISO(curso.fecha_inicio);
        const endDateObj = parseISO(curso.fecha_fin);
        const currentDate = date;
        
        // Crear fechas sin hora para comparación
        const startDateOnly = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate());
        const endDateOnly = new Date(endDateObj.getFullYear(), endDateObj.getMonth(), endDateObj.getDate());
        const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        
        // Verificar si la fecha está dentro del rango del curso
        if (!(currentDateOnly >= startDateOnly && currentDateOnly <= endDateOnly)) {
            return false;
        }
        
        const dayName = format(date, 'EEE', { locale: es }).toLowerCase().substring(0, 3);
        return trainingDays.some(trainingDay => 
            trainingDay.toLowerCase().startsWith(dayName)
        );
    };

    const getTrainingTime = (date) => {
        if (!trainingDays.length) return '';
        const dayName = format(date, 'EEE', { locale: es }).toLowerCase().substring(0, 3);
        const trainingDay = trainingDays.find(td => 
            td.toLowerCase().startsWith(dayName)
        );
        return trainingDay ? trainingDay.split('-')[1] : '';
    };

    if (isLoading) {
        return (
            <Main>
                <div className="manage-attendance-container">
                    <div className="loading-spinner"></div>
                    <p>Cargando datos del curso...</p>
                </div>
            </Main>
        );
    }

    if (error) {
        return (
            <Main>
                <div className="manage-attendance-container">
                    <p className="error-message">{error}</p>
                    <button
                        className="back-button-manageAttendance"
                        onClick={() => navigate(`/Cursos/${id}`)}
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        Volver al curso
                    </button>
                </div>
            </Main>
        );
    }

    if (!curso) {
        return (
            <Main>
                <div className="manage-attendance-container">
                    <p>No se encontró información del curso.</p>
                    <button
                        className="back-button-manageAttendance"
                        onClick={() => navigate(`/Cursos/${id}`)}
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        Volver al curso
                    </button>
                </div>
            </Main>
        );
    }

    if (!curso.fecha_inicio || !curso.fecha_fin) {
        return (
            <Main>
                <div className="manage-attendance-container">
                    <p>El curso no tiene fechas definidas.</p>
                    <button
                        className="back-button-manageAttendance"
                        onClick={() => navigate(`/Cursos/${id}`)}
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        Volver al curso
                    </button>
                </div>
            </Main>
        );
    }

    return (
        <>
            <Main>
                <div className="manage-attendance-container">
                    <div className="attendance-header">
                        <h2>
                            <FontAwesomeIcon icon={faCalendarAlt} className="header-icon" />
                            Gestión de <span className="complementary">Asistencias</span>
                        </h2>
                        <div className="course-info">
                            <p className="course-ficha">Ficha: <strong>{curso.ficha}</strong></p>
                            <p className="course-dates">
                                {format(parseISO(curso.fecha_inicio), "dd 'de' MMMM 'de' yyyy", { locale: es })} - {format(parseISO(curso.fecha_fin), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                            </p>
                        </div>
                    </div>

                    <div className="attendance-content">
                        <div className="calendar-section">
                            <div className="calendar-container">
                                <div className="calendar-header">
                                    <button 
                                        className="month-nav-btn"
                                        onClick={() => handleMonthChange('prev')}
                                    >
                                        <FontAwesomeIcon icon={faChevronLeft} />
                                    </button>
                                    <h3 className="current-month">
                                        {format(currentMonth, 'MMMM yyyy', { locale: es })}
                                    </h3>
                                    <button 
                                        className="month-nav-btn"
                                        onClick={() => handleMonthChange('next')}
                                    >
                                        <FontAwesomeIcon icon={faChevronRight} />
                                    </button>
                                </div>

                                <div className="calendar-grid">
                                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
                                        <div key={index} className="calendar-day-header">
                                            {day}
                                        </div>
                                    ))}
                                    
                                    {generateCalendarDays(
                                        currentMonth, 
                                        curso.fecha_inicio, 
                                        curso.fecha_fin, 
                                        isTrainingDay, 
                                        getTrainingTime, 
                                        selectedDate, 
                                        handleDateSelect,
                                        isSelectableDate
                                    )}
                                </div>

                                <div className="calendar-legend">
                                    <div className="legend-item">
                                        <div className="legend-color training-day"></div>
                                        <span>Día con formación</span>
                                    </div>
                                    <div className="legend-item">
                                        <div className="legend-color selected-day"></div>
                                        <span>Seleccionado</span>
                                    </div>
                                    <div className="legend-item">
                                        <div className="legend-color current-day"></div>
                                        <span>Hoy</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="sidebar-section">
                            <div className="training-info">
                                <h4>
                                    <FontAwesomeIcon icon={faCheckCircle} />
                                    Horarios del Curso
                                </h4>
                                <div className="training-days-list">
                                    {trainingDays.length > 0 ? (
                                        trainingDays.map((day, index) => {
                                            const [dia, hora] = day.split('-');
                                            return (
                                                <div key={index} className="training-day-item">
                                                    <div className="training-day-name">{dia}</div>
                                                    <div className="training-day-time">
                                                        <FontAwesomeIcon icon={faClock} />
                                                        {hora}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="no-training-days">No hay días de formación definidos</p>
                                    )}
                                </div>
                            </div>

                            <div className="instructions">
                                <p>Haga clic en cualquier día desde el inicio del curso hasta hoy para gestionar las asistencias</p>
                            </div>

                            <button 
                                className="back-button-manageAttendance" 
                                onClick={() => navigate(`/Cursos/${id}`)}
                            >
                                <FontAwesomeIcon icon={faArrowLeft} />
                                Volver al Curso
                            </button>
                        </div>
                    </div>
                </div>
            </Main>
            <Footer />

            {selectedDate && showAttendanceManagement && (
                <AttendanceManagement
                    open={showAttendanceManagement}
                    onClose={handleCloseAttendanceManagement}
                    courseId={curso.ID}
                    selectedDate={selectedDate}
                />
            )}
        </>
    );
};

// Función auxiliar para generar los días del calendario - CORREGIDA
const generateCalendarDays = (currentMonth, startDate, endDate, isTrainingDay, getTrainingTime, selectedDate, onDateSelect, isSelectableDate) => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    
    const calendarDays = [];
    
    allDays.forEach(day => {
        const isCurrentMonth = isSameMonth(day, currentMonth);
        const isToday = isSameDay(day, new Date());
        const isSelected = selectedDate && isSameDay(day, parseISO(selectedDate));
        const hasTraining = isTrainingDay(day);
        const isSelectable = isSelectableDate(day) && isCurrentMonth;
        const trainingTime = getTrainingTime(day);
        
        const dayClassNames = [
            'calendar-day',
            !isCurrentMonth && 'other-month',
            isToday && 'today',
            isSelected && 'selected',
            hasTraining && isCurrentMonth && 'training-day',
            isSelectable && 'selectable'
        ].filter(Boolean).join(' ');
        
        calendarDays.push(
            <div
                key={day.toISOString()}
                className={dayClassNames}
                onClick={() => {
                    if (isSelectable) {
                        onDateSelect(format(day, 'yyyy-MM-dd'));
                    }
                }}
                title={isSelectable ? 
                    `Gestionar asistencia - ${hasTraining ? `Horario: ${trainingTime}` : 'Día disponible'}` : 
                    'No disponible para gestión de asistencia'
                }
            >
                <div className="day-content">
                    <span className="day-number">{format(day, 'd')}</span>
                    {hasTraining && isCurrentMonth && (
                        <div className="training-indicator" title={`Horario: ${trainingTime}`}>
                            <FontAwesomeIcon icon={faClock} />
                        </div>
                    )}
                </div>
            </div>
        );
    });
    
    return calendarDays;
};