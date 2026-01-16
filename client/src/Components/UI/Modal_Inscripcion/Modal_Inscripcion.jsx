import { useState, useEffect } from "react";
import "./Modal_Inscripcion.css";
import axiosInstance from '../../../config/axiosInstance';
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css'

export const Modal_Inscripcion = ({ onClose, onCursosSeleccionados, id }) => {
  const [cursosDisponibles, setCursosDisponibles] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const userSessionString = localStorage.getItem("userSession") || sessionStorage.getItem("userSession");

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Cargar cursos disponibles del empresario
  useEffect(() => {
    const cargarCursosDisponibles = async () => {
      setLoading(true);
      try {
        if(id){
          const cursosRes = await axiosInstance.get(`/api/courses/empresa/${id.ID}`); 
          const cursosData = Array.isArray(cursosRes.data) ? cursosRes.data : cursosRes.data.cursos || [];
          setCursosDisponibles(cursosData);   
        } else {
          const userSession = JSON.parse(userSessionString);
          const empresaId = userSession.empresa_ID;
          const cursosRes = await axiosInstance.get(`/api/courses/empresa/${empresaId}`); 
          const cursosData = Array.isArray(cursosRes.data) ? cursosRes.data : cursosRes.data.cursos || [];
          setCursosDisponibles(cursosData);
        }
      } catch (error) {
        // console.error('Error al cargar cursos:', error);
        setCursosDisponibles([]);
      } finally {
        setLoading(false);
      }
    };
    cargarCursosDisponibles();
  }, []);

  // Manejar selección de curso (solo uno)
  const handleCursoChange = (cursoId) => {
    setCursoSeleccionado(cursoId === cursoSeleccionado ? null : cursoId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!cursoSeleccionado) {
Swal.fire({
    icon: "info",
    title: "Elige un curso",
    text: "Por favor selecciona un curso",
    confirmButtonText: "Okay",
    theme:"bulma",
    customClass: {
        actions: 'swal2-actions-centered',
        popup: 'swal2-popup-centered'
    }
})
      return;
    }

    try {
      const cursoCompleto = cursosDisponibles.find(curso => 
        curso.ID === cursoSeleccionado || curso.id === cursoSeleccionado
      );

      if (onCursosSeleccionados) {
        onCursosSeleccionados([cursoCompleto]);
      }
      
await Swal.fire({
    icon: 'success',
    title: 'Curso seleccionado',
    text: `Curso "${cursoCompleto?.nombre_curso}" seleccionado correctamente`,
    confirmButtonText: 'Aceptar',
    confirmButtonColor: '#006f33',
    theme: "bulma",
    customClass: {
        actions: 'swal2-actions-centered',
        popup: 'swal2-popup-centered'
    }
});
      onClose();
      
    } catch (error) {
      // console.error("Error al procesar el curso:", error);
await Swal.fire({
    icon: 'error',
    title: 'Error',
    text: 'Hubo un error al procesar la selección del curso',
    confirmButtonText: 'Entendido',
    confirmButtonColor: '#d33',
    theme: "bulma",
    customClass: {
        actions: 'swal2-actions-centered',
        popup: 'swal2-popup-centered'
    }
});
    }
  };

  // Cerrar modal al hacer clic fuera
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Cerrar modal con tecla ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Inscripción a Cursos</h2>
          <button 
            className="close-button"
            onClick={onClose}
            type="button"
            aria-label="Cerrar modal"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Selecciona un curso para la inscripción *</label>
            
            {loading ? (
              <div className="loading-state">Cargando cursos disponibles...</div>
            ) : cursosDisponibles.length === 0 ? (
              <div className="empty-state">
                No tiene cursos asignados aún
              </div>
            ) : (
              <div className="cursos-list">
                {cursosDisponibles.map((curso) => (
                  <div 
                    key={curso.ID || curso.id} 
                    className={`curso-option ${cursoSeleccionado === (curso.ID || curso.id) ? 'curso-selected' : ''}`}
                    onClick={() => handleCursoChange(curso.ID || curso.id)}
                  >
                    <div className="radio-container">
                      <input
                        type="radio"
                        name="cursoSeleccionado"
                        checked={cursoSeleccionado === (curso.ID || curso.id)}
                        onChange={() => handleCursoChange(curso.ID || curso.id)}
                        className="radio-input"
                      />
                      <span className="radio-checkmark"></span>
                    </div>
                    <div className="curso-details">
                      <div className="curso-title">{curso.nombre_curso}</div>
                      {curso.cupos_disponibles !== undefined && (
                        <div className="curso-cupos">
                          Cupos disponibles: {curso.cupos_disponibles}
                        </div>
                      )}
                      {curso.descripcion && (
                        <div className="curso-description">
                          {curso.descripcion}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {cursoSeleccionado && (
              <div className="selected-info">
                <strong>Curso seleccionado:</strong> {
                  cursosDisponibles.find(curso => 
                    curso.ID === cursoSeleccionado || curso.id === cursoSeleccionado
                  )?.nombre_curso
                }
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button 
              type="button"
              className="btn-cancel"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="btn-confirm"
              disabled={!cursoSeleccionado}
            >
              Confirmar Inscripción
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};