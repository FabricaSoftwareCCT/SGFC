import React, { useState, useEffect } from "react";
import "./AssignInstructorCourse.css";
import axiosInstance from "../../../../config/axiosInstance";
import { Routes, Route, useNavigate } from "react-router-dom";

export const AssignInstructorCourse = ({ curso_ID, onClose }) => {
  const navigate = useNavigate();

  // Validación de sesión de usuario y rol de administrador
  const userSessionString = sessionStorage.getItem("userSession");
  const userSession = userSessionString ? JSON.parse(userSessionString) : null;

  const [filteredInstructors, setFilteredInstructors] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [filter, setFilter] = useState("");
  const [current, setCurrent] = useState(0);
  const [selectedState, setSelectedState] = useState({
    activo: true,
    inactivo: true,
  });

  // Obtener instructores del backend
  const fetchInstructors = async () => {
    try {
      const response = await axiosInstance.get('/api/users/instructores');
      setInstructors(response.data);
      setFilteredInstructors(response.data);
    } catch (error) {
      console.error('Error al obtener los instructores:', error);
      alert('Hubo un problema al cargar los instructores. Por favor, inténtalo más tarde.');
    }
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedState, filter, instructors]);

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const applyFilters = () => {
    const value = filter.toLowerCase();
    const filtered = instructors.filter(
      (instructor) =>
        (instructor.nombres || "").toLowerCase().includes(value) ||
        (instructor.apellidos || "").toLowerCase().includes(value) ||
        (instructor.documento || "").toLowerCase().includes(value)
    );
    setFilteredInstructors(filtered);
    setCurrent(0);
  };

  const next = () =>
    setCurrent((prev) => (prev + 1) % filteredInstructors.length);
  const prev = () =>
    setCurrent(
      (prev) =>
        (prev - 1 + filteredInstructors.length) % filteredInstructors.length
    );



  const getImageSrcFromBase64 = (base64) => {
    if (!base64) return 'default-profile.png'; // Ruta a imagen por defecto

    // Detectar tipo MIME por encabezado base64
    if (base64.startsWith('iVBOR')) {
      return `data:image/png;base64,${base64}`;
    } else if (base64.startsWith('/9j/')) {
      return `data:image/jpeg;base64,${base64}`;
    } else {
      // Si no puedes detectar, asume jpeg por defecto
      return `data:image/jpeg;base64,${base64}`;
    }
  };

  const invitarInstructor = async (instructor_ID) => {
    try {
      // 1. Enviar la invitación
      const response = await axiosInstance.post('/api/courses/enviarInvitacionCursoInstructor', {
        instructor_ID,
        curso_ID
      });

      // Obtén el ID de la invitación creada
      const invitacion_ID = response.data.invitacion?.id || response.data.invitacion?.ID;

      // 2. Enviar la notificación, incluyendo invitacion_ID
      await axiosInstance.post('/api/notifications/invitacionCursoInstructor', {
        remitente_ID: userSession?.id,
        destinatario_ID: instructor_ID,
        curso_ID,
        invitacion_ID
      });

      alert(response.data.message || "Invitación y notificación enviadas correctamente");
      if (onClose) onClose();
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Error al enviar la invitación o la notificación. Intenta de nuevo."
      );
    }
  };
  return (
    <div id="modal-assingInstructorCourse">
      <div className="modal-bodyAssignInstructorCourse">
        <h2 className="titleAssignInstructorCourse">
          Invitar <span className="complementary">Instructor</span>
        </h2>

        <div className="containerConsultInstructor">
          <div className="containerFiltersInstructor">
            <div className="inputSearchContainer">
              <input
                type="text"
                id="inputNameCC"
                placeholder="Buscar por nombre o cédula"
                value={filter}
                onChange={handleFilterChange} // Manejar el cambio en el input
              />
            </div>

          </div>

        </div>
        <div className="containerGestionsInstructorResults">

          {/* Mostrar flecha izquierda solo si hay más de un resultado */}
          {filteredInstructors.length > 1 && (
            <button className="arrow-results left" onClick={prev}>❮</button>
          )}

          <div className="carousel-container_2-results">
            <div className="carousel-track-results">
              {filteredInstructors.length === 0 ? (
                // Mostrar mensaje si no hay resultados
                <p className="no-results">No hay resultados</p>
              ) : (
                // Mostrar una carta si hay un solo resultado
                filteredInstructors.length === 1 ? (
                  <div className="carousel-card-results card-center">
                    <img
                      src={getImageSrcFromBase64(filteredInstructors[0]?.foto_perfil)}
                      alt="Instructor"
                      className="carousel-image-results"
                    />
                  </div>
                ) : (
                  // Mostrar una carta centrada con flechas si hay dos resultados
                  filteredInstructors.length === 2 ? (
                    [0].map((offset) => {
                      const index = (current + offset) % filteredInstructors.length;
                      const instructor = filteredInstructors[index];

                      return (
                        <div className="carousel-card-results card-center" key={index}>
                          <img
                            src={getImageSrcFromBase64(instructor?.foto_perfil)}
                            alt="Instructor"
                            className="carousel-image-results"
                          />
                        </div>
                      );
                    })
                  ) : (
                    // Mostrar tres cartas si hay tres o más resultados
                    [0, 1, 2].map((offset) => {
                      const index = (current + offset) % filteredInstructors.length;
                      const instructor = filteredInstructors[index];

                      let positionClass = '';
                      if (offset === 1) {
                        positionClass = 'card-center';
                      } else {
                        positionClass = 'card-side';
                      }

                      return (
                        <div className={`carousel-card-results ${positionClass}`} key={index}>
                          <img
                            src={getImageSrcFromBase64(instructor?.foto_perfil)}
                            alt="Instructor"
                            className="carousel-image-results"
                          />
                        </div>
                      );
                    })
                  )
                )
              )}
            </div>

            {/* Mostrar información del instructor actual */}
            {filteredInstructors.length > 0 && (
              <div className="instructor-info">
                <h3>{filteredInstructors[(current + 1) % filteredInstructors.length]?.nombres} {filteredInstructors[(current + 1) % filteredInstructors.length]?.apellidos}</h3>
                <p>{filteredInstructors[(current + 1) % filteredInstructors.length]?.titulo_profesional}</p>
                <button
                  className="profile-btn"
                  onClick={() => invitarInstructor(filteredInstructors[current + 1]?.ID)}
                >
                  Invitar Instructor
                </button>
              </div>
            )}
          </div>

          {/* Mostrar flecha derecha solo si hay más de un resultado */}
          {filteredInstructors.length > 1 && (
            <button className="arrow-results right" onClick={next}>❯</button>
          )}
        </div>

        <div className="container_return_AssignInstructor">
          <h5>Volver</h5>
          <button
            type="button"
            onClick={onClose}
            className="closeModal"
          ></button>
        </div>
      </div>
    </div>
  );

};
