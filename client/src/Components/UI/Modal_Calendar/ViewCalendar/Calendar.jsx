import React, { useState, useEffect } from 'react';
import './VCalendar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, 
  faCalendarCheck, 
  faClock, 
  faTimes, 
  faCheck, 
  faCalendarDay,
  faCalendarWeek,
  faEye,
  faClockRotateLeft,
  faCalendarDays,
  faListCheck,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';

const times = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00'
];

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const dayAbbreviations = {
  'Lunes': 'Lun',
  'Martes': 'Mar',
  'Miércoles': 'Mié',
  'Jueves': 'Jue',
  'Viernes': 'Vie',
  'Sábado': 'Sáb'
};

const ViewCalendar = ({ calendarData, closeModal }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSlots, setSelectedSlots] = useState(new Set());
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [showList, setShowList] = useState(false);
  const [totalSessions, setTotalSessions] = useState(0);

  useEffect(() => {
    if (calendarData) {
      setStartDate(calendarData.startDate || calendarData.fecha_inicio || '');
      setEndDate(calendarData.endDate || calendarData.fecha_fin || '');

      let slotsArr = [];

      // Validar y parsear slots_formacion
      if (calendarData.slots_formacion) {
        try {
          slotsArr = Array.isArray(calendarData.slots_formacion)
            ? calendarData.slots_formacion
            : JSON.parse(calendarData.slots_formacion);
        } catch (e) {
          slotsArr = [];
        }

        // Establecer los slots seleccionados
        setSelectedSlots(new Set(slotsArr));
        setTotalSessions(slotsArr.length);

        // Extraer solo las horas
        const horas = slotsArr.map(slot => slot.split('-')[1]);
        if (horas.length > 0) {
          const sortedHoras = [...horas].sort();
          setHoraInicio(sortedHoras[0]);
          setHoraFin(sortedHoras[sortedHoras.length - 1]);
        } else {
          setHoraInicio('');
          setHoraFin(''); 
        }
      }
    }
  }, [calendarData]);

  const handleCancel = () => {
    closeModal();
  };

  // Formatear fecha para mostrar
  const formatDate = (dateString) => {
    if (!dateString) return 'No definida';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Formatear fecha corta
  const formatDateShort = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };

  // Calcular duración en días
  const calculateDuration = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  // Calcular total de horas
  const calculateTotalHours = () => {
    return totalSessions * 1; // Cada sesión es de 1 hora
  };

  // Obtener horarios seleccionados organizados
  const getSelectedSlotsByDay = () => {
    const slotsByDay = {};
    selectedSlots.forEach(slot => {
      const [day, time] = slot.split('-');
      if (!slotsByDay[day]) {
        slotsByDay[day] = [];
      }
      slotsByDay[day].push(time);
    });
    
    // Ordenar los horarios
    Object.keys(slotsByDay).forEach(day => {
      slotsByDay[day].sort((a, b) => {
        const timeA = parseInt(a.replace(':', ''));
        const timeB = parseInt(b.replace(':', ''));
        return timeA - timeB;
      });
    });
    
    return slotsByDay;
  };

  // Obtener días con horarios
  const getDaysWithSchedules = () => {
    return Object.keys(getSelectedSlotsByDay());
  };

  // Obtener horario por día
  const getScheduleByDay = (day) => {
    const slots = getSelectedSlotsByDay()[day] || [];
    if (slots.length === 0) return '';
    
    // Si hay un solo horario, mostrar solo ese
    if (slots.length === 1) return slots[0];
    
    // Si hay múltiples horarios, mostrar rango
    return `${slots[0]} - ${slots[slots.length - 1]}`;
  };

  return (
    <div className="modal-overlay-view">
      <div className="modal-container-view">
        {/* Header del Modal */}
        <div className="modal-header-view">
          <div className="modal-header-left">
            <FontAwesomeIcon icon={faEye} className="modal-icon-view" />
            <div className="modal-title-section">
              <h2 className="modal-title-view">
                Horarios del Curso
              </h2>
              <p className="modal-subtitle-view">
                Visualización de fechas y horarios programados
              </p>
            </div>
          </div>
          <button className="modal-close-btn-view" onClick={handleCancel}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="modal-content-view">
          {/* Resumen General */}
          <div className="summary-section-view">
            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-icon">
                  <FontAwesomeIcon icon={faCalendarDays} />
                </div>
                <div className="summary-content">
                  <span className="summary-label">Período</span>
                  <span className="summary-value">
                    {startDate && endDate ? (
                      <>
                        {formatDateShort(startDate)} - {formatDateShort(endDate)}
                      </>
                    ) : 'No definido'}
                  </span>
                </div>
              </div>
              
              <div className="summary-card">
                <div className="summary-icon">
                  <FontAwesomeIcon icon={faClock} />
                </div>
                <div className="summary-content">
                  <span className="summary-label">Horario</span>
                  <span className="summary-value">
                    {horaInicio && horaFin ? (
                      `${horaInicio} - ${horaFin}`
                    ) : 'No definido'}
                  </span>
                </div>
              </div>
              
              <div className="summary-card">
                <div className="summary-icon">
                  <FontAwesomeIcon icon={faListCheck} />
                </div>
                <div className="summary-content">
                  <span className="summary-label">Sesiones</span>
                  <span className="summary-value">
                    {totalSessions} sesione{totalSessions !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              
              <div className="summary-card">
                <div className="summary-icon">
                  <FontAwesomeIcon icon={faClockRotateLeft} />
                </div>
                <div className="summary-content">
                  <span className="summary-label">Horas Totales</span>
                  <span className="summary-value">
                    {calculateTotalHours()} hora{calculateTotalHours() !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Detalles de Fechas */}
          <div className="details-section-view">
            <div className="section-header-view">
              <FontAwesomeIcon icon={faCalendarCheck} className="section-icon" />
              <h3>Detalles del Período</h3>
            </div>
            
            <div className="details-grid">
              <div className="detail-card">
                <div className="detail-header">
                  <FontAwesomeIcon icon={faCalendarDay} />
                  <span>Fecha de Inicio</span>
                </div>
                <div className="detail-value">
                  {startDate ? formatDate(startDate) : 'No definida'}
                </div>
              </div>
              
              <div className="detail-card">
                <div className="detail-header">
                  <FontAwesomeIcon icon={faCalendarWeek} />
                  <span>Fecha de Fin</span>
                </div>
                <div className="detail-value">
                  {endDate ? formatDate(endDate) : 'No definida'}
                </div>
              </div>
              
              <div className="detail-card">
                <div className="detail-header">
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  <span>Duración Total</span>
                </div>
                <div className="detail-value">
                  {calculateDuration()} día{calculateDuration() !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Sección de Horarios */}
          <div className="schedule-section-view">
            <div className="section-header-view">
              <FontAwesomeIcon icon={faClock} className="section-icon" />
              <div className="schedule-header-content">
                <h3>Horarios Programados</h3>
                <div className="view-controls">
                  <button 
                    className="toggle-view-btn"
                    onClick={() => setShowList(!showList)}
                  >
                    {showList ? 'Ver Calendario' : 'Ver Lista'}
                  </button>
                </div>
              </div>
              <div className="selected-count-view">
                <span className="count-number-view">{totalSessions}</span>
                <span className="count-label-view">sesiones programadas</span>
              </div>
            </div>

            {!showList ? (
              /* Vista de Calendario */
              <div className="calendar-wrapper-view">
                <div className="calendar-container-view">
                  <div className="calendar-scroll-area-view">
                    <table className="calendar-table-view">
                      <thead>
                        <tr>
                          <th className="time-header-view">Hora</th>
                          {days.map((day) => (
                            <th key={day} className="day-header-view">
                              <span className="day-full-view">{day}</span>
                              <span className="day-abbr-view">{dayAbbreviations[day]}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {times.map((time) => (
                          <tr key={time} className="time-row-view">
                            <td className="time-cell-view">{time}</td>
                            {days.map((day) => {
                              const slot = `${day}-${time}`;
                              const isSelected = selectedSlots.has(slot);
                              return (
                                <td
                                  key={slot}
                                  className={`slot-cell-view ${isSelected ? 'selected-view' : ''}`}
                                >
                                  <div className="slot-content-view">
                                    {isSelected && (
                                      <FontAwesomeIcon icon={faCheck} className="slot-icon-view" />
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="calendar-legend-view">
                  <div className="legend-item-view">
                    <div className="legend-box-view available-view"></div>
                    <span>Sin sesión</span>
                  </div>
                  <div className="legend-item-view">
                    <div className="legend-box-view selected-view"></div>
                    <span>Sesión programada</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Vista de Lista */
              <div className="list-view-container">
                <div className="list-view-header">
                  <div className="list-summary">
                    <span className="list-total">{totalSessions} sesiones programadas</span>
                    <span className="list-hours">({calculateTotalHours()} horas totales)</span>
                  </div>
                </div>
                
                <div className="list-view-content">
                  {selectedSlots.size === 0 ? (
                    <div className="empty-list-view">
                      <FontAwesomeIcon icon={faClock} className="empty-icon-view" />
                      <p>No hay sesiones programadas</p>
                    </div>
                  ) : (
                    <div className="schedule-list-view">
                      {Object.entries(getSelectedSlotsByDay()).map(([day, times]) => (
                        <div key={day} className="day-schedule-group">
                          <div className="day-schedule-header">
                            <h4 className="day-schedule-title">{day}</h4>
                            <span className="day-schedule-count">
                              {times.length} sesione{times.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="day-schedule-slots">
                            {times.map((time, index) => (
                              <div key={`${day}-${time}`} className="schedule-slot-item">
                                <div className="slot-time-view">{time}</div>
                                <div className="slot-status-view">
                                  <FontAwesomeIcon icon={faCheck} className="slot-status-icon" />
                                  <span>Sesión {index + 1}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Resumen de Días */}
          <div className="days-summary-view">
            <div className="section-header-view">
              <FontAwesomeIcon icon={faCalendarCheck} className="section-icon" />
              <h3>Días con Sesiones</h3>
            </div>
            <div className="days-list-view">
              {getDaysWithSchedules().length === 0 ? (
                <div className="no-days-view">
                  No hay días con sesiones programadas
                </div>
              ) : (
                getDaysWithSchedules().map((day) => (
                  <div key={day} className="day-item-view">
                    <div className="day-name-view">{day}</div>
                    <div className="day-schedule-view">{getScheduleByDay(day)}</div>
                    <div className="day-count-view">
                      {getSelectedSlotsByDay()[day].length} sesione{getSelectedSlotsByDay()[day].length !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer del Modal */}
        <div className="modal-footer-view">
          <button className="close-btn-view" onClick={handleCancel}>
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Cerrar Vista</span>
          </button>
          <div className="footer-info-view">
            <span className="duration-view">
              {calculateDuration()} día{calculateDuration() !== 1 ? 's' : ''} • {totalSessions} sesione{totalSessions !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewCalendar;