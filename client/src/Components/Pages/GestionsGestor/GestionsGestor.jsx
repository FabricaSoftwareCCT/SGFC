import { useState, useEffect } from "react";
import "./GestionsGestor.css";
import { Header } from "../../Layouts/Header/Header";
import { Footer } from "../../Layouts/Footer/Footer";
import { Main } from "../../Layouts/Main/Main";
import { UpdateGestor } from "./UpdateGestor/UpdateGestor";
import axiosInstance from "../../../config/axiosInstance";
// import { useNavigate } from "react-router-dom";

export const GestionsGestor = () => {
  // const navigate = useNavigate();
  const [gestores, setGestores] = useState([]); // Estado para almacenar los gestores
  const [filteredGestors, setfilteredGestorses] = useState([]); // Estado para los gestores filtrados
  const [filter, setFilter] = useState(""); // Estado para el valor del filtro
  const [current, setCurrent] = useState(0); // Estado para el carrusel
  const [selectedState, setSelectedState] = useState({
    activo: true,
    inactivo: true,
  });

  // Validación de sesión de usuario y rol de administrador
  // const userSessionString = sessionStorage.getItem("userSession");
  // const userSession = userSessionString ? JSON.parse(userSessionString) : null;

  const [selectedGestor, setSelectedGestor] = useState(null); // Estado para el instructor seleccionado

  const showModalSeeProfile = (gestor) => {
    setSelectedGestor(gestor);
  };



  // Función para obtener los gestores desde el backend
  const fetchGestor = async () => {
    try {
      const response = await axiosInstance.get('/api/users/gestores');
      setGestores(response.data); // Guardar los datos en el estado
      setfilteredGestorses(response.data); // Inicialmente, los gestores filtrados son todos
    } catch (error) {
      console.error('Error al obtener los Gestores:', error);
      alert('Hubo un problema al cargar los Gestores. Por favor, inténtalo más tarde.');
    }
  };

  // Llamar a la función al cargar el componente
  useEffect(() => {
    fetchGestor();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    applyFilters();
  }, [selectedState, filter, gestores]);


  // Función para manejar el cambio en el input de filtro
  const handleFilterChange = (e) => {
    const value = e.target.value.toLowerCase();
    setFilter(value);
  };

  const applyFilters = () => {
    const filtered = gestores.filter((gestor) =>
      (gestor.nombres || '').toLowerCase().includes(filter.toLowerCase()) ||
      (gestor.apellidos || '').toLowerCase().includes(filter.toLowerCase()) ||
      (gestor.documento || '').toLowerCase().includes(filter.toLowerCase())
    );

    const filteredByState = filtered.filter((gestor) => {
      const estado = (gestor.estado || '').toLowerCase();
      if (selectedState.activo && estado === 'activo') {
        return true;
      }
      if (selectedState.inactivo && estado === 'inactivo') {
        return true;
      }
      return false;
    });

    setfilteredGestorses(filteredByState);
    setCurrent(0);
  };

  const next = () => setCurrent((prev) => (prev + 1) % filteredGestors.length);
  const prev = () => setCurrent((prev) => (prev - 1 + filteredGestors.length) % filteredGestors.length);

  const showModalCreateGestor = () => {
    const modalCreateGestor = document.getElementById("modal-overlayCreateGestor");
    if (modalCreateGestor) {
      modalCreateGestor.style.display = "flex"; // Cambia el display a flex para mostrar el modal
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
      <> <Header />
        <Main>
          <div className="container_GestionsGestor">
            <h2>
              Mis <span className="complementary">Gestores</span>
            </h2>

            <div className="containerGestionsGestorOptions">
              <div className="containerConsultGestor">
                <p>Filtrar por:</p>
                <div className="containerFiltersGestor">
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
                <button className="btn_createGestor" onClick={showModalCreateGestor}>Agregar Gestor</button>

              </div>

              <div className="containerGestionsGestorResults">
                {/* Mostrar flecha izquierda solo si hay más de un resultado */}
                {filteredGestors.length > 1 && (
                  <button className="arrow-results left" onClick={prev}>❮</button>
                )}

              <div className="carousel-container_2-results">
                <div className="carousel-track-results">
                  {filteredGestors.length === 0 ? (
                    // Mostrar mensaje si no hay resultados
                    <p className="no-results">No hay resultados</p>
                  ) : (
                    // Mostrar una carta si hay un solo resultado
                    filteredGestors.length === 1 ? (
                      <div className="carousel-card-results card-center">
                        <img
                          src={getImageSrcFromBase64(filteredGestors[0]?.foto_perfil)}
                          alt="gestor"
                          className="carousel-image-results"
                        />
                      </div>
                    ) : (
                      // Mostrar una carta centrada con flechas si hay dos resultados
                      filteredGestors.length === 2 ? (
                        [0].map((offset) => {
                          const index = (current + offset) % filteredGestors.length;
                          const gestor = filteredGestors[index];

                          return (
                            <div className="carousel-card-results card-center" key={index}>
                              <img
                                src={getImageSrcFromBase64(gestor?.foto_perfil)}
                                alt="gestor"
                                className="carousel-image-results"
                              />                 
                            </div>
                          );
                        })
                      ) : (
                        // Mostrar tres cartas si hay tres o más resultados
                        [0, 1, 2].map((offset) => {
                          const index = (current + offset) % filteredGestors.length;
                          const gestor = filteredGestors[index];

                          let positionClass = '';
                          if (offset === 1) {
                            positionClass = 'card-center';
                          } else {
                            positionClass = 'card-side';
                          }

                          return (
                            <div className={`carousel-card-results ${positionClass}`} key={index}>
                              <img
                                src={getImageSrcFromBase64(gestor?.foto_perfil)}
                                alt="gestor"
                                className="carousel-image-results"
                              />
                            </div>
                          );
                        })
                      )
                    )
                  )}
                </div>

                {/* Mostrar información del gestor actual (centrado) */}
                {filteredGestors.length > 0 && (() => {
                  const centerIndex = (current + 1) % filteredGestors.length;
                  const currentGestor = filteredGestors[centerIndex];
                  return (
                    <div className="instructor-info">
                      <h3>{currentGestor?.nombres} {currentGestor?.apellidos}</h3>
                      <p>{currentGestor?.titulo_profesional}</p>
                      <button
                        className="profile-btn"
                        onClick={() => showModalSeeProfile(currentGestor)}
                      >
                        Ver perfil
                      </button>
                    </div>
                  );
                })()}
              </div>


                {/* Mostrar flecha derecha solo si hay más de un resultado */}
                {filteredGestors.length > 1 && (
                  <button className="arrow-results right" onClick={next}>❯</button>
                )}
              </div>
            </div>
          </div>
        </Main>
        {selectedGestor && (
          <UpdateGestor
            gestor={selectedGestor}
            onClose={() => setSelectedGestor(null)}
          />
        )}
        <Footer />
      </>
    );
  }
  
