import { useState, useEffect } from "react";
import "./GestionsInstructor.css";
import { Header } from "../../../Components/Layouts/Header/Header";
import { Footer } from "../../../Components/Layouts/Footer/Footer";
import { Main } from "../../../Components/Layouts/Main/Main";
import { UpdateInstructor } from "./UpdateInstructor/UpdateInstructor";
import axiosInstance from "../../../config/axiosInstance";
// import { useNavigate } from "react-router-dom";

export const GestionsInstructor = () => {
  const [instructors, setInstructors] = useState([]); // Estado para almacenar los instructores
  const [filteredInstructors, setFilteredInstructors] = useState([]); // Estado para los instructores filtrados
  const [filter, setFilter] = useState(""); // Estado para el valor del filtro
  const [current, setCurrent] = useState(0); // Estado para el carrusel
  const [selectedState, setSelectedState] = useState({
    activo: true,
    inactivo: true,
  });
  const [selectedInstructor, setSelectedInstructor] = useState(null); // Estado para el instructor seleccionado


  // Validación de sesión de usuario y rol de administrador
  // const userSessionString = sessionStorage.getItem("userSession");
  // const userSession = userSessionString ? JSON.parse(userSessionString) : null;

  const showModalSeeProfile = (instructor) => {
    setSelectedInstructor(instructor);
  };


  // Función para obtener los instructores desde el backend
  const fetchInstructors = async () => {
    try {
      const response = await axiosInstance.get('/api/users/instructores');
      setInstructors(response.data); // Guardar los datos en el estado
      setFilteredInstructors(response.data); // Inicialmente, los instructores filtrados son todos
    } catch (error) {
      console.error('Error al obtener los instructores:', error);
      alert('Hubo un problema al cargar los instructores. Por favor, inténtalo más tarde.');
    }
  };

  // Llamar a la función al cargar el componente
  useEffect(() => {
    fetchInstructors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    applyFilters();
  }, [selectedState, filter, instructors]);

  // Función para manejar el cambio en el input de filtro
  const handleFilterChange = (e) => {
    const value = e.target.value.toLowerCase();
    setFilter(value);

    // Filtrar los instructores según el nombre, apellidos o cédula
    const filtered = instructors.filter((instructor) =>
      instructor.nombres.toLowerCase().includes(value) ||
      instructor.apellidos.toLowerCase().includes(value) ||
      instructor.documento.toLowerCase().includes(value)
    );

    // Aplicar también el filtro de estado
    const filteredByState = filtered.filter((instructor) => {
      if (selectedState.activo && instructor.estado.toLowerCase() === 'activo') {
        return true;
      }
      if (selectedState.inactivo && instructor.estado.toLowerCase() === 'inactivo') {
        return true;
      }
      return false;
    });

    setFilteredInstructors(filteredByState);
    setCurrent(0); // Reiniciar el índice del carrusel
  };

  const applyFilters = () => {
    const filtered = instructors.filter((instructor) =>
      (instructor.nombres || '').toLowerCase().includes(filter.toLowerCase()) ||
      (instructor.apellidos || '').toLowerCase().includes(filter.toLowerCase()) ||
      (instructor.documento || '').toLowerCase().includes(filter.toLowerCase())
    );

    const filteredByState = filtered.filter((instructor) => {
      const estado = (instructor.estado || '').toLowerCase();
      if (selectedState.activo && estado === 'activo') {
        return true;
      }
      if (selectedState.inactivo && estado === 'inactivo') {
        return true;
      }
      return false;
    });

    setFilteredInstructors(filteredByState);
    setCurrent(0);
  };



  const next = () => setCurrent((prev) => (prev + 1) % filteredInstructors.length);
  const prev = () => setCurrent((prev) => (prev - 1 + filteredInstructors.length) % filteredInstructors.length);

  const showModalCreateInstructor = () => {
    const modalCreateInstructor = document.getElementById("modal-overlayCreateInstructor");
    if (modalCreateInstructor) {
      modalCreateInstructor.style.display = "flex"; // Cambia el display a flex para mostrar el modal
    }
  };

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

  return (
    <>
      <Header />
      <Main>
        <div className="container_GestionsInstructor">
          <h2>
            Mis <span className="complementary">Instructores</span>
          </h2>

          <div className="containerGestionsInstructorOptions">
            <div className="containerConsultInstructor">
              <p>Filtrar por:</p>
              <div className="containerFiltersInstructor">
                <label htmlFor="inputNameCC">Nombre o Cédula</label>
                <div className="inputSearchContainer">
                  <input
                    type="text"
                    id="inputNameCC"
                    placeholder="Escriba el nombre o la cédula"
                    value={filter}
                    onChange={handleFilterChange} // Manejar el cambio en el input
                  />
                </div>

                <label>Estado</label>
                <div className="statusButtons">
                  <button
                    className={`inactive ${selectedState.inactivo ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedState((prevState) => ({
                        ...prevState,
                        inactivo: !prevState.inactivo,
                      }));
                    }}
                  >
                    Inactivos
                  </button>
                  <button
                    className={`active ${selectedState.activo ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedState((prevState) => ({
                        ...prevState,
                        activo: !prevState.activo,
                      }));
                    }}
                  >
                    Activos
                  </button>
                </div>
              </div>
              <button className="btn_createInstructor" onClick={showModalCreateInstructor}>Agregar Instructor</button>

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

                {/* Mostrar información del instructor actual (centrado) */}
                {filteredInstructors.length > 0 && (() => {
                  const centerIndex = (current + 1) % filteredInstructors.length;
                  const currentInstructor = filteredInstructors[centerIndex];
                  return (
                    <div className="instructor-info">
                      <h3>{currentInstructor?.nombres} {currentInstructor?.apellidos}</h3>
                      <p>{currentInstructor?.titulo_profesional}</p>
                      <button
                        className="profile-btn"
                        onClick={() => showModalSeeProfile(currentInstructor)}
                      >
                        Ver perfil
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* Mostrar flecha derecha solo si hay más de un resultado */}
              {filteredInstructors.length > 1 && (
                <button className="arrow-results right" onClick={next}>❯</button>
              )}
            </div>
          </div>
        </div>
      </Main>
      {selectedInstructor && (
        <UpdateInstructor
          instructor={selectedInstructor}
          onClose={() => setSelectedInstructor(null)}
        />
      )}

      <Footer />
    </>
  );

};
