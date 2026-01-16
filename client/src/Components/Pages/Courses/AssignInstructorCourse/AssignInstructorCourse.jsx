import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./AssignInstructorCourse.css";
import axiosInstance from "../../../../config/axiosInstance";
import Swal from "sweetalert2";
import 'sweetalert2/themes/bulma.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faIdCard, faSearch, faArrowLeft, faGraduationCap, faEnvelope } from '@fortawesome/free-solid-svg-icons';

export const AssignInstructorCourse = ({ curso_ID, onClose }) => {
  const userSessionString = sessionStorage.getItem("userSession");
  const userSession = userSessionString ? JSON.parse(userSessionString) : null;

  const [filteredInstructors, setFilteredInstructors] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [availability, setAvailability] = useState({});
  const [filter, setFilter] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inviting, setInviting] = useState(false);

  const fetchInstructors = async () => {
    try {
      const response = await axiosInstance.get('/api/users/instructores');
      setInstructors(response.data);
      setFilteredInstructors(response.data);

      const checks = await Promise.all(
        (response.data || []).map(async (inst) => {
          try {
            const res = await axiosInstance.get(`/api/courses/instructores/${inst.ID || inst.id}/disponibilidad`);
            return { id: inst.ID || inst.id, data: res.data };
          } catch (e) {
            return { id: inst.ID || inst.id, data: { disponible: false, estado: inst.estado } };
          }
        })
      );
      
      const availabilityMap = {};
      checks.forEach(({ id, data }) => { 
        availabilityMap[id] = data; 
      });
      setAvailability(availabilityMap);
    } catch (error) {
      // console.error('Error al obtener los instructores:', error);
      await Swal.fire({
        icon: "error",
        title: "Error en el sistema",
        text: "Hubo un problema al cargar los instructores. Por favor, inténtalo más tarde.",
        confirmButtonText: "Okay",
        timer: 4000,
        timerProgressBar: true,
        theme: 'bulma',
        customClass: { confirmButton: 'centered-swal-button' }
      });
    }
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  useEffect(() => {
    const value = filter.toLowerCase();
    const filtered = instructors.filter(
      (instructor) =>
        (instructor.nombres || "").toLowerCase().includes(value) ||
        (instructor.apellidos || "").toLowerCase().includes(value) ||
        (instructor.documento || "").toLowerCase().includes(value)
    );
    setFilteredInstructors(filtered);
    setCurrentIndex(0);
  }, [filter, instructors]);

  const handleNextInstructor = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredInstructors.length);
  };

  const handlePrevInstructor = () => {
    setCurrentIndex((prev) => 
      (prev - 1 + filteredInstructors.length) % filteredInstructors.length
    );
  };

  const getImageSrcFromBase64 = (base64) => {
    if (!base64) return '/default-profile.png';

    if (base64.startsWith('iVBOR')) {
      return `data:image/png;base64,${base64}`;
    } else if (base64.startsWith('/9j/')) {
      return `data:image/jpeg;base64,${base64}`;
    } else {
      return `data:image/jpeg;base64,${base64}`;
    }
  };

  const handleInviteInstructor = async (instructor_ID) => {
    try {
      setInviting(true);
      
      // Verificar disponibilidad
      try {
        const res = await axiosInstance.get(`/api/courses/instructores/${instructor_ID}/disponibilidad`);
        if (!res.data?.disponible) {
          await Swal.fire({
            icon: "info",
            title: "No se puede enviar invitación",
            text: "Este instructor está inactivo.",
            confirmButtonText: "Okay",
            timer: 4000,
            timerProgressBar: true,
            theme: 'bulma',
            customClass: { confirmButton: 'centered-swal-button' }
          });
          return;
        }
      } catch (e) {
        await Swal.fire({
          icon: "error",
          title: "Error en el sistema",
          text: "No se pudo verificar la disponibilidad del instructor. Intenta más tarde.",
          confirmButtonText: "Okay",
          theme: 'bulma',
          customClass: { confirmButton: 'centered-swal-button' }
        });
        return;
      }

      // Enviar invitación
      const response = await axiosInstance.post('/api/courses/enviarInvitacionCursoInstructor', {
        instructor_ID,
        curso_ID
      });

      const invitacion_ID = response.data.invitacion?.id || response.data.invitacion?.ID;

      // Enviar notificación
      await axiosInstance.post('/api/notifications/invitacionCursoInstructor', {
        remitente_ID: userSession?.id,
        destinatario_ID: instructor_ID,
        curso_ID,
        invitacion_ID
      });

      await Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: response.data.message || "Invitación y notificación enviadas correctamente",
        confirmButtonText: 'Aceptar',
        theme: 'bulma',
        customClass: { confirmButton: 'centered-swal-button' }
      });
      
      if (onClose) onClose();
      
    } catch (error) {
      setInviting(false);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || "Error al enviar la invitación o la notificación. Intenta de nuevo.",
        confirmButtonText: 'Aceptar',
        theme: 'bulma',
        customClass: { confirmButton: 'centered-swal-button' }
      });
    }
  };

  const closeModalAssignInstructor = () => {
    if (onClose) onClose();
    const overlay = document.getElementById("modal-overlayAssignInstructor");
    if (overlay) overlay.style.display = "none";
  };

  const currentInstructor = filteredInstructors[currentIndex];
  const currentInstructorId = currentInstructor?.ID || currentInstructor?.id;
  const isAvailable = availability[currentInstructorId]?.disponible !== false && 
                     currentInstructor?.estado !== 'inactivo';
  const estadoTexto = availability[currentInstructorId]?.estado || currentInstructor?.estado;

  return (
    <div id="modal-overlayAssignInstructor" className="modal-overlay-assign">
      <div className="modal-container-assign">
        {/* Header */}
        <div className="modal-header-assign">
          <div className="header-content-assign">
            <h2>
              <FontAwesomeIcon icon={faUser} className="header-icon" />
              Asignar Instructor al Curso
            </h2>
            <button 
              type="button" 
              onClick={closeModalAssignInstructor}
              className="close-btn-assign"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>Volver</span>
            </button>
          </div>
        </div>

        <div className="modal-body-assign">
          {/* Barra de búsqueda */}
          <div className="search-section-assign">
            <div className="search-container-assign">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                placeholder="Buscar instructor por nombre, apellido o cédula..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="search-input-assign"
              />
            </div>
          </div>

          {/* Contenido principal */}
          <div className="content-section-assign">
            {/* Carrusel de instructores */}
            <div className="carousel-section-assign">
              {filteredInstructors.length > 1 && (
                <button 
                  className="carousel-arrow-assign carousel-arrow-prev"
                  onClick={handlePrevInstructor}
                >
                  ❮
                </button>
              )}

              <div className="carousel-container-assign">
                <div className="carousel-track-assign">
                  {filteredInstructors.length === 0 ? (
                    <div className="no-results-assign">
                      <FontAwesomeIcon icon={faUser} className="no-results-icon" />
                      <p>No se encontraron instructores</p>
                    </div>
                  ) : (
                    // Mostrar hasta 3 instructores en el carrusel
                    [-1, 0, 1].map((offset) => {
                      const index = (currentIndex + offset + filteredInstructors.length) % filteredInstructors.length;
                      const instructor = filteredInstructors[index];
                      
                      if (!instructor) return null;

                      let positionClass = '';
                      if (offset === 0) positionClass = 'card-center-assign';
                      else if (offset === -1) positionClass = 'card-left-assign';
                      else positionClass = 'card-right-assign';

                      return (
                        <div 
                          className={`carousel-card-assign ${positionClass}`} 
                          key={instructor.ID || instructor.id}
                        >
                          <div className="card-image-container-assign">
                            <img
                              src={getImageSrcFromBase64(instructor.foto_perfil)}
                              alt={`${instructor.nombres} ${instructor.apellidos}`}
                              className="card-image-assign"
                              onError={(e) => {
                                e.target.src = '/default-profile.png';
                              }}
                            />
                          </div>
                          {offset === 0 && (
                            <div className="card-active-indicator-assign">
                              <span className="active-dot-assign"></span>
                              Seleccionado
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {filteredInstructors.length > 1 && (
                <button 
                  className="carousel-arrow-assign carousel-arrow-next"
                  onClick={handleNextInstructor}
                >
                  ❯
                </button>
              )}
            </div>

            {/* Información del instructor seleccionado */}
            {currentInstructor && (
              <div className="instructor-info-assign">
                <div className="instructor-details-assign">
                  <h3 className="instructor-name-assign">
                    {currentInstructor.nombres} {currentInstructor.apellidos}
                  </h3>
                  <p className="instructor-title-assign">
                    <FontAwesomeIcon icon={faGraduationCap} />
                    {currentInstructor.titulo_profesional || "Sin título especificado"}
                  </p>
                  <p className="instructor-document-assign">
                    <FontAwesomeIcon icon={faIdCard} />
                    Cédula: {currentInstructor.documento || "No especificado"}
                  </p>
                  <div className={`instructor-status-assign ${estadoTexto?.toLowerCase()}`}>
                    <span className="status-dot-assign"></span>
                    Estado: {estadoTexto || "No especificado"}
                    {availability[currentInstructorId]?.disponible === false && ' (No disponible)'}
                  </div>
                </div>

                <button
                  className={`invite-btn-assign ${!isAvailable ? 'disabled' : ''}`}
                  disabled={!isAvailable || inviting}
                  onClick={() => handleInviteInstructor(currentInstructorId)}
                >
                  <FontAwesomeIcon icon={faEnvelope} />
                  {inviting ? "Enviando invitación..." : "Invitar al Curso"}
                </button>
              </div>
            )}
          </div>

          {/* Contador de resultados */}
          {filteredInstructors.length > 0 && (
            <div className="results-counter-assign">
              {currentIndex + 1} de {filteredInstructors.length} instructores
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

AssignInstructorCourse.propTypes = {
  curso_ID: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  onClose: PropTypes.func,
};