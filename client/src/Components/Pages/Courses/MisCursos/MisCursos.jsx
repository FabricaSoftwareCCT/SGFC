import React, { useEffect, useState } from 'react';
import './MisCursos.css';
import { Footer } from '../../../Layouts/Footer/Footer';
import { Main } from '../../../Layouts/Main/Main';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../config/axiosInstance';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faArrowLeft, 
  faArrowRight,
  faGraduationCap,
  faChalkboardTeacher,
  faBookOpen,
  faCalendarAlt,
  faUserTie,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';

// 🔧 Función para normalizar texto (sin tildes, en minúsculas)
const normalizeText = (text) =>
  text.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const MisCursos = () => {
  const [cursos, setCursos] = useState([]);
  const [filteredCursos, setFilteredCursos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const userSession =
    JSON.parse(localStorage.getItem('userSession')) ||
    JSON.parse(sessionStorage.getItem('userSession'));

  const itemsPerSlide = 3;

  useEffect(() => {
    const fetchCursos = async () => {
      setIsLoading(true);
      try {
        let response;
        let fetchedCursos = [];

        if (!userSession?.ID && !userSession?.id) {
          setErrorMessage("No se pudo obtener el ID del usuario");
          setIsLoading(false);
          return;
        }

        switch (userSession?.accountType) {
          case 'Instructor':
            const instructorId = userSession.ID || userSession.id;
            response = await axiosInstance.get(`/api/courses/cursos-asignados/${instructorId}`);
            fetchedCursos = response.data.map(asignacion => ({
              ...asignacion.Curso,
              ID: asignacion.Curso.ID || asignacion.Curso.id || asignacion.curso_ID,
            }));
            break;

          case 'Aprendiz':
            const aprendizId = userSession.ID || userSession.id;
            response = await axiosInstance.get(`/api/courses/cursos-aprendiz/${aprendizId}`);
            fetchedCursos = response.data.map(curso => ({
              ...curso,
              ID: curso.ID || curso.id,
            }));
            break;

          case 'Administrador':
          case 'Gestor':
            response = await axiosInstance.get("/api/courses/cursos");
            fetchedCursos = response.data.map(curso => ({
              ...curso,
              ID: curso.ID || curso.id,
            }));
            break;

          default:
            setErrorMessage("No tienes permisos para ver esta página");
            setIsLoading(false);
            return;
        }

        setCursos(fetchedCursos);
        setFilteredCursos(fetchedCursos);
        setErrorMessage("");
      } catch (error) {
        // console.error("Error al obtener los cursos:", error);
        setErrorMessage("Error al cargar los cursos. Por favor, intenta de nuevo.");
      } finally {
        setIsLoading(false);
      }
    };

    if (userSession) {
      fetchCursos();
    } else {
      setErrorMessage("Debes iniciar sesión para ver tus cursos");
      setIsLoading(false);
    }
  }, []);

  // 🎯 Filtro de cursos reactivo
  useEffect(() => {
    const term = normalizeText(searchTerm.trim());

    if (!term) {
      setFilteredCursos(cursos);
      setCurrentSlide(0);
      return;
    }

    const filtered = cursos.filter((curso) => {
      const ficha = normalizeText(curso.ficha || '');
      const nombre = normalizeText(curso.nombre_curso || '');
      return ficha.includes(term) || nombre.includes(term);
    });

    setFilteredCursos(filtered);
    setCurrentSlide(0);
  }, [searchTerm, cursos]);

  // 👉 Cursos visibles en el carrusel
  const visibleCursos = filteredCursos.slice(
    currentSlide * itemsPerSlide,
    currentSlide * itemsPerSlide + itemsPerSlide
  );

  // 👉 Navegación del carrusel
  const nextSlide = () => {
    const totalSlides = Math.ceil(filteredCursos.length / itemsPerSlide);
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  // 👉 Ir al detalle del curso
  const handleCardClick = (ID) => {
    if (!ID) {
      // console.error("El ID del curso es undefined o null");
      return;
    }
    navigate(`/Cursos/${ID}`);
  };

  // 👉 Icono según tipo de usuario
  const getUserIcon = () => {
    switch (userSession?.accountType) {
      case 'Aprendiz': return faGraduationCap;
      case 'Instructor': return faChalkboardTeacher;
      case 'Administrador': return faUserTie;
      case 'Gestor': return faUserTie;
      default: return faBookOpen;
    }
  };

  // 👉 Título según tipo de usuario
  const getPageTitle = () => {
    switch (userSession?.accountType) {
      case 'Aprendiz': return "Mis Cursos";
      case 'Instructor': return "Cursos Asignados";
      case 'Administrador': 
      case 'Gestor': return "Todos los Cursos";
      default: return "Cursos";
    }
  };

  // 👉 Mostrar mensaje si hay error
  if (errorMessage && !isLoading) {
    return (
      <>
        <Main>
          <div className="mis-cursos-container">
            <div className="mis-cursos-header">
              <div className="header-content-mis-cursos">
                <h1 className="main-title-mis-cursos">
                  <FontAwesomeIcon icon={getUserIcon()} className="header-icon-mis-cursos" />
                  {getPageTitle()}
                </h1>
                <p className="error-state-mis-cursos">
                  <FontAwesomeIcon icon="exclamation-triangle" />
                  {errorMessage}
                </p>
              </div>
            </div>
          </div>
        </Main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Main>
        <div className="mis-cursos-container">
          {/* Header Principal */}
          <div className="mis-cursos-header">
            <div className="header-content-mis-cursos">
              <h1 className="main-title-mis-cursos">
                <FontAwesomeIcon icon={getUserIcon()} className="header-icon-mis-cursos" />
                {getPageTitle()}
              </h1>
              <p className="subtitle-mis-cursos">
                {userSession?.accountType === 'Aprendiz' 
                  ? "Visualiza y accede a todos tus cursos asignados"
                  : "Gestiona y navega por los cursos bajo tu responsabilidad"
                }
              </p>
            </div>
            
            <div className="header-stats-mis-cursos">
              <div className="stat-card-mis-cursos">
                <span className="stat-number-mis-cursos">{filteredCursos.length}</span>
                <span className="stat-label-mis-cursos">
                  {filteredCursos.length === 1 ? 'Curso' : 'Cursos'}
                </span>
              </div>
            </div>
          </div>

          {/* Panel de Búsqueda */}
          <div className="search-panel-mis-cursos">
            <div className="search-section-mis-cursos">
              <div className="search-input-container-mis-cursos">
                <input
                  type="text"
                  className="search-input-mis-cursos"
                  placeholder="Buscar por ficha o nombre del curso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FontAwesomeIcon icon={faSearch} className='search-icon-mis-cursos' />
              </div>
            </div>
          </div>

          {/* Estados de Carga y Resultados */}
          {isLoading ? (
            <div className="loading-state-mis-cursos">
              <div className="loading-spinner-mis-cursos">
                <FontAwesomeIcon icon={faSpinner} spin />
              </div>
              <p>Cargando tus cursos...</p>
            </div>
          ) : filteredCursos.length === 0 ? (
            <div className="no-results-state-mis-cursos">
              <div className="no-results-icon-mis-cursos">
                <FontAwesomeIcon icon={faBookOpen} />
              </div>
              <h3>No se encontraron cursos</h3>
              <p>No hay cursos disponibles con los criterios de búsqueda actuales.</p>
              {searchTerm && (
                <button 
                  className="reset-search-btn-mis-cursos"
                  onClick={() => setSearchTerm("")}
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            <div className="results-section-mis-cursos">
              {/* Header de Resultados */}
              <div className="results-header-mis-cursos">
                <h2 className="results-title-mis-cursos">
                  {filteredCursos.length === 1 ? "1 curso encontrado" : `${filteredCursos.length} cursos encontrados`}
                </h2>
                {filteredCursos.length > itemsPerSlide && (
                  <div className="carousel-controls-mis-cursos">
                    <span className="carousel-counter">
                      {currentSlide + 1} / {Math.ceil(filteredCursos.length / itemsPerSlide)}
                    </span>
                  </div>
                )}
              </div>

              {/* Carrusel de Cursos */}
              <div className="courses-carousel-container">
                <div className="carousel-wrapper-mis-cursos">
                  {filteredCursos.length > itemsPerSlide && (
                    <button
                      className={`carousel-arrow-mis-cursos left ${currentSlide === 0 ? 'disabled' : ''}`}
                      onClick={prevSlide}
                      disabled={currentSlide === 0}
                    >
                      <FontAwesomeIcon icon={faArrowLeft} />
                    </button>
                  )}

                  <div className="carousel-track-mis-cursos">
                    {visibleCursos.map((curso) => (
                      <div
                        className="course-card-carousel"
                        key={curso.ID}
                        onClick={() => handleCardClick(curso.ID)}
                      >
                        <div className="card-image-container-carousel">
                          <img
                            className="course-image-carousel"
                            src={`data:image/png;base64,${curso.imagen}`}
                            alt={curso.nombre_curso}
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjMDA4NDNkIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzAwODQzZCIgZm9udC1zaXplPSIxNCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIj5JbWFnZW4gTm8gRGlzcG9uaWJsZTwvdGV4dD4KPC9zdmc+';
                            }}
                          />
                          <div className="card-overlay-carousel">
                            <span className="view-course-text-carousel">
                              <FontAwesomeIcon icon={faBookOpen} />
                              Ver Curso
                            </span>
                          </div>
                        </div>
                        
                        <div className="card-content-carousel">
                          <div className="course-badge-carousel">
                            <FontAwesomeIcon icon={faCalendarAlt} />
                            <span>{curso.estado || "Sin estado"}</span>
                          </div>
                          <h3 className="course-title-carousel" title={curso.nombre_curso}>
                            {curso.nombre_curso}
                          </h3>
                          <p className="course-code-carousel">
                            <strong>Ficha:</strong> {curso.ficha}
                          </p>
                          <div className="course-meta-carousel">
                            <span className="offer-type-carousel">
                              {curso.tipo_oferta || "No especificado"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredCursos.length > itemsPerSlide && (
                    <button
                      className={`carousel-arrow-mis-cursos right ${currentSlide >= Math.ceil(filteredCursos.length / itemsPerSlide) - 1 ? 'disabled' : ''}`}
                      onClick={nextSlide}
                      disabled={currentSlide >= Math.ceil(filteredCursos.length / itemsPerSlide) - 1}
                    >
                      <FontAwesomeIcon icon={faArrowRight} />
                    </button>
                  )}
                </div>

                {/* Indicadores de carrusel */}
                {filteredCursos.length > itemsPerSlide && (
                  <div className="carousel-indicators-mis-cursos">
                    {Array.from({ length: Math.ceil(filteredCursos.length / itemsPerSlide) }).map((_, index) => (
                      <button
                        key={index}
                        className={`carousel-indicator ${index === currentSlide ? 'active' : ''}`}
                        onClick={() => setCurrentSlide(index)}
                        aria-label={`Ir a slide ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Mensaje informativo */}
              <div className="info-message-mis-cursos">
                <p>
                  <FontAwesomeIcon icon="info-circle" />
                  Haz clic en cualquier curso para ver su información detallada
                </p>
              </div>
            </div>
          )}
        </div>
      </Main>
      <Footer />
    </>
  );
};