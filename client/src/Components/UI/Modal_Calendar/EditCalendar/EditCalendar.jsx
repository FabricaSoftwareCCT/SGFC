import React, { useState, useEffect } from 'react';
import './ECalendar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, 
  faCalendarCheck, 
  faClock, 
  faTimes, 
  faCheck, 
  faArrowLeft,
  faCalendarDay,
  faCalendarWeek,
  faPlus,
  faTrashAlt
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

export const EditCalendar = ({ closeModal, onSave, initialData }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSlots, setSelectedSlots] = useState(new Set());
  const [error, setError] = useState('');
  const [showSelectedSlots, setShowSelectedSlots] = useState(false);

  // Initialize state from initialData when modal opens
  useEffect(() => {
    if (initialData) {
      setStartDate(initialData.startDate || '');
      setEndDate(initialData.endDate || '');
      setSelectedSlots(new Set(initialData.selectedSlots || []));
    }
  }, [initialData]);

  const validateDates = () => {
    if (!startDate || !endDate) {
      setError('Por favor, selecciona las fechas de inicio y fin');
      return false;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      setError('La fecha de inicio no puede ser anterior a hoy');
      return false;
    }

    if (end < start) {
      setError('La fecha de fin no puede ser anterior a la fecha de inicio');
      return false;
    }

    // Validar que no sea más de 6 meses
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
    if (end > sixMonthsLater) {
      setError('La fecha de fin no puede ser mayor a 6 meses desde hoy');
      return false;
    }

    setError('');
    return true;
  };

  const toggleSlot = (day, time) => {
    if (!startDate || !endDate) {
      setError('Por favor, selecciona primero las fechas de inicio y fin');
      return;
    }

    const slot = `${day}-${time}`;
    const newSelected = new Set(selectedSlots);
    if (newSelected.has(slot)) {
      newSelected.delete(slot);
    } else {
      newSelected.add(slot);
    }
    setSelectedSlots(newSelected);
  };

  const clearAllSlots = () => {
    setSelectedSlots(new Set());
  };

  const handleSave = () => {
    if (!validateDates()) {
      return;
    }

    if (selectedSlots.size === 0) {
      setError('Por favor, selecciona al menos un horario');
      return;
    }

    // Pass selected data back to parent component
    if (onSave) {
      onSave({
        startDate,
        endDate,
        selectedSlots: Array.from(selectedSlots),
      });
    }
    closeModal();
  };

  const handleCancel = () => {
    closeModal();
  };

  // Formatear fecha para mostrar
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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

  return (
    <div className="modal-overlay-calendar">
      <div className="modal-container-calendar">
        {/* Header del Modal */}
        <div className="modal-header-calendar">
          <div className="modal-header-left">
            <FontAwesomeIcon icon={faCalendarAlt} className="modal-icon-calendar" />
            <div className="modal-title-section">
              <h2 className="modal-title-calendar">
                Configurar Horarios del Curso
              </h2>
              <p className="modal-subtitle-calendar">
                Define las fechas y horarios de las sesiones
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={handleCancel}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="modal-content-calendar">
          {/* Sección de Fechas */}
          <div className="dates-section-calendar">
            <div className="section-header-calendar">
              <FontAwesomeIcon icon={faCalendarCheck} className="section-icon" />
              <h3>Fechas del Curso</h3>
            </div>
            
            <div className="date-inputs-grid">
              <div className="date-input-group">
                <label className="date-input-label">
                  <span className="label-text">Fecha de Inicio</span>
                  <span className="label-hint">Primer día del curso</span>
                </label>
                <div className="date-input-wrapper">
                  <FontAwesomeIcon icon={faCalendarDay} className="input-icon" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setEndDate(''); // Reset end date if start changes
                      setError('');
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className="date-input-field"
                  />
                  {startDate && (
                    <span className="date-preview">
                      {formatDate(startDate)}
                    </span>
                  )}
                </div>
              </div>

              <div className="date-input-group">
                <label className="date-input-label">
                  <span className="label-text">Fecha de Fin</span>
                  <span className="label-hint">Último día del curso</span>
                </label>
                <div className="date-input-wrapper">
                  <FontAwesomeIcon icon={faCalendarWeek} className="input-icon" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setError('');
                    }}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    className="date-input-field"
                    disabled={!startDate}
                  />
                  {endDate && (
                    <span className="date-preview">
                      {formatDate(endDate)}
                    </span>
                  )}
                </div>
              </div>

              {/* Resumen de Fechas */}
              {startDate && endDate && (
                <div className="date-summary">
                  <div className="summary-item">
                    <span className="summary-label">Duración:</span>
                    <span className="summary-value">{calculateDuration()} días</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Rango:</span>
                    <span className="summary-value">
                      {formatDate(startDate)} → {formatDate(endDate)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className="error-container-calendar">
              <FontAwesomeIcon icon={faTimes} className="error-icon" />
              <span className="error-text-calendar">{error}</span>
            </div>
          )}

          {/* Sección de Horarios */}
          <div className="schedule-section-calendar">
            <div className="section-header-calendar">
              <FontAwesomeIcon icon={faClock} className="section-icon" />
              <div className="schedule-header-content">
                <h3>Seleccionar Horarios</h3>
                <div className="schedule-controls">
                  <button 
                    className="toggle-slots-btn"
                    onClick={() => setShowSelectedSlots(!showSelectedSlots)}
                  >
                    {showSelectedSlots ? 'Ver Calendario' : 'Ver Seleccionados'}
                  </button>
                  <button 
                    className="clear-slots-btn"
                    onClick={clearAllSlots}
                    disabled={selectedSlots.size === 0}
                  >
                    <FontAwesomeIcon icon={faTrashAlt} />
                    <span>Limpiar Todo</span>
                  </button>
                </div>
              </div>
              <div className="selected-count">
                <span className="count-number">{selectedSlots.size}</span>
                <span className="count-label">horarios seleccionados</span>
              </div>
            </div>

            {!showSelectedSlots ? (
              /* Calendario de Horarios */
              <div className="calendar-wrapper-calendar">
                <div className="calendar-container-calendar">
                  <div className="calendar-scroll-area">
                    <table className="calendar-table-calendar">
                      <thead>
                        <tr>
                          <th className="time-header">Hora</th>
                          {days.map((day) => (
                            <th key={day} className="day-header">
                              <span className="day-full">{day}</span>
                              <span className="day-abbr">{dayAbbreviations[day]}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {times.map((time) => (
                          <tr key={time} className="time-row">
                            <td className="time-cell">{time}</td>
                            {days.map((day) => {
                              const slot = `${day}-${time}`;
                              const isSelected = selectedSlots.has(slot);
                              return (
                                <td
                                  key={slot}
                                  className={`slot-cell-calendar ${isSelected ? 'selected' : ''}`}
                                  onClick={() => toggleSlot(day, time)}
                                >
                                  <div className="slot-content">
                                    {isSelected ? (
                                      <FontAwesomeIcon icon={faCheck} className="slot-icon" />
                                    ) : (
                                      <FontAwesomeIcon icon={faPlus} className="slot-icon" />
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
                <div className="calendar-legend">
                  <div className="legend-item">
                    <div className="legend-box available"></div>
                    <span>Disponible</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-box selected"></div>
                    <span>Seleccionado</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Vista de Horarios Seleccionados */
              <div className="selected-slots-view">
                {selectedSlots.size === 0 ? (
                  <div className="no-slots-selected">
                    <FontAwesomeIcon icon={faClock} className="empty-icon" />
                    <p>No hay horarios seleccionados</p>
                    <p className="hint-text">Haz clic en el calendario para seleccionar horarios</p>
                  </div>
                ) : (
                  <div className="selected-slots-grid">
                    {Object.entries(getSelectedSlotsByDay()).map(([day, times]) => (
                      <div key={day} className="day-slots-group">
                        <h4 className="day-slots-title">{day}</h4>
                        <div className="day-slots-list">
                          {times.map((time) => (
                            <div key={`${day}-${time}`} className="selected-slot-item">
                              <span className="slot-time">{time}</span>
                              <button 
                                className="remove-slot-btn"
                                onClick={() => toggleSlot(day, time)}
                              >
                                <FontAwesomeIcon icon={faTimes} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer del Modal */}
        <div className="modal-footer-calendar">
          <button className="cancel-btn-calendar" onClick={handleCancel}>
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Cancelar</span>
          </button>
          <div className="footer-info">
            <span className="slots-count">
              {selectedSlots.size} horario{selectedSlots.size !== 1 ? 's' : ''} seleccionado{selectedSlots.size !== 1 ? 's' : ''}
            </span>
            {startDate && endDate && (
              <span className="duration-info">
                • {calculateDuration()} día{calculateDuration() !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button 
            className="save-btn-calendar" 
            onClick={handleSave}
            disabled={selectedSlots.size === 0 || !startDate || !endDate}
          >
            <FontAwesomeIcon icon={faCheck} />
            <span>Guardar Horarios</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditCalendar;