import { useState, useEffect } from "react";
import "./GestionsInstructor.css";
import { Header } from "../../../Components/Layouts/Header/Header";
import { Footer } from "../../../Components/Layouts/Footer/Footer";
import { Main } from "../../../Components/Layouts/Main/Main";
import { UpdateInstructor } from "./UpdateInstructor/UpdateInstructor";
import axiosInstance from "../../../config/axiosInstance";
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faChartLine, faCheck, faUsers, faSearch, faFolderOpen, faIdCard, faPhone, faEnvelope } from '@fortawesome/free-solid-svg-icons';

export const GestionsInstructor = () => {
  const [instructors, setInstructors] = useState([]);
  const [filteredInstructors, setFilteredInstructors] = useState([]);
  const [filter, setFilter] = useState("");
  const [current, setCurrent] = useState(0);
  const [selectedState, setSelectedState] = useState({
    activo: true,
    inactivo: true,
  });
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInstructors = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/users/instructores');
      setInstructors(response.data);
      setFilteredInstructors(response.data);
    } catch (error) {
      console.error('Error al obtener los instructores:', error);
      Swal.fire({
        icon: "error",
        title: "Error en el sistema",
        text: "Hubo un problema al cargar los instructores. Por favor, inténtalo más tarde.",
        confirmButtonText: "Okay",
        theme: "bulma",
        customClass: { confirmButton: 'centered-swal-button' }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedState, filter, instructors]);

  const handleFilterChange = (e) => {
    const value = e.target.value.toLowerCase();
    setFilter(value);
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

  const next = () => {
    if (filteredInstructors.length > 1) {
      setCurrent((prev) => (prev + 1) % filteredInstructors.length);
    }
  };

  const prev = () => {
    if (filteredInstructors.length > 1) {
      setCurrent((prev) => (prev - 1 + filteredInstructors.length) % filteredInstructors.length);
    }
  };

  const showModalCreateInstructor = () => {
    const modalCreateInstructor = document.getElementById("modal-overlayCreateInstructor");
    if (modalCreateInstructor) {
      modalCreateInstructor.style.display = "flex";
    }
  };

  const showModalSeeProfile = (instructor) => {
    setSelectedInstructor(instructor);
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

  const getVisibleInstructors = () => {
    if (filteredInstructors.length === 0) return [];
    if (filteredInstructors.length === 1) return [filteredInstructors[0]];
    
    const visible = [];
    for (let i = 0; i < Math.min(3, filteredInstructors.length); i++) {
      const index = (current + i) % filteredInstructors.length;
      visible.push(filteredInstructors[index]);
    }
    return visible;
  };

  const visibleInstructors = getVisibleInstructors();
  const centerInstructor = filteredInstructors.length > 0 ? 
    filteredInstructors[(current + 1) % filteredInstructors.length] : null;

  return (
    <>
      <Header />
      <Main>
        <div className="gestion-instructors-container">
          {/* Header */}
          <div className="instructors-header-improved">
            <div className="header-content-improved">
              <h1>Gestión de <span>Instructores</span></h1>
              <div className="header-stats-improved">
                <div className="stat-item-improved">
                  <span className="stat-number">{filteredInstructors.length}</span>
                  <span className="stat-label">
                    {selectedState.activo && !selectedState.inactivo ? 'Activos' : 
                     !selectedState.activo && selectedState.inactivo ? 'Inactivos' : 'Filtrados'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Layout Principal */}
          <div className="main-content-improved">
            {/* Columna Izquierda - Carrusel */}
            <div className="carousel-section-improved">
              <div className="carousel-panel-improved">
                {loading ? (
                  <div className="loading-state-improved">
                    <div className="loading-spinner-improved"></div>
                    <p>Cargando instructores...</p>
                  </div>
                ) : filteredInstructors.length > 0 ? (
                  <div className="carousel-content-improved">
                    {/* Navegación del Carrusel */}
                    <div className="carousel-navigation">
                      {filteredInstructors.length > 1 && (
                        <>
                          <button className="carousel-arrow-improved left" onClick={prev}>
                            ❮
                          </button>
                          <button className="carousel-arrow-improved right" onClick={next}>
                            ❯
                          </button>
                        </>
                      )}
                    </div>

                    {/* Carrusel de Instructores */}
                    <div className="carousel-track-improved">
                      {visibleInstructors.map((instructor, index) => {
                        const isCenter = filteredInstructors.length === 1 ? true : 
                                       filteredInstructors.length === 2 ? index === 0 : index === 1;
                        const positionClass = isCenter ? 'card-center-improved' : 'card-side-improved';
                        
                        return (
                          <div className={`instructor-card-improved ${positionClass}`} key={instructor.ID || index}>
                            <div className="instructor-image-container">
                              <img
                                src={getImageSrcFromBase64(instructor?.foto_perfil)}
                                alt={`${instructor.nombres} ${instructor.apellidos}`}
                                className="instructor-image-improved"
                                onError={(e) => {
                                  e.target.src = '/default-profile.png';
                                }}
                              />
                              <div className={`status-badge ${instructor?.estado?.toLowerCase()}`}>
                                {instructor?.estado}
                              </div>
                            </div>
                            {isCenter && (
                              <div className="instructor-mini-info">
                                <h4>{instructor.nombres} {instructor.apellidos}</h4>
                                <p>{instructor.titulo_profesional}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Información Detallada del Instructor Central */}
                    {centerInstructor && (
                      <div className="instructor-info-improved">
                        <div className="instructor-details-card">
                          <h3>{centerInstructor.nombres} {centerInstructor.apellidos}</h3>
                          <p className="instructor-title">{centerInstructor.titulo_profesional}</p>
                          
                          <div className="instructor-contact-info">
                            <div className="contact-item">
                              <FontAwesomeIcon icon={faIdCard} />
                              <span>Cédula: {centerInstructor.documento}</span>
                            </div>
                            <div className="contact-item">
                              <FontAwesomeIcon icon={faPhone} />
                              <span>Celular: {centerInstructor.celular}</span>
                            </div>
                            <div className="contact-item">
                              <FontAwesomeIcon icon={faEnvelope} />
                              <span>Email: {centerInstructor.email}</span>
                            </div>
                          </div>

                          <button
                            className="view-profile-btn-improved"
                            onClick={() => showModalSeeProfile(centerInstructor)}
                          >
                            Ver Perfil Completo
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Indicador de Posición */}
                    {filteredInstructors.length > 1 && (
                      <div className="carousel-indicator-improved">
                        <span className="current-position">
                          {current + 1} de {filteredInstructors.length}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="no-instructors-improved">
                    <div className="no-instructors-icon">
                      <FontAwesomeIcon icon={faFolderOpen} />
                    </div>
                    <h3>No se encontraron instructores</h3>
                    <p>No hay instructores disponibles con los filtros seleccionados</p>
                    <button
                      className="reset-filters-btn-improved"
                      onClick={() => {
                        setFilter("");
                        setSelectedState({ activo: true, inactivo: true });
                      }}
                    >
                      Mostrar todos los instructores
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Columna Derecha - Panel de Control */}
            <div className="control-panel-improved">
              {/* Filtros y Búsqueda */}
              <div className="filters-card-improved">
                <h3>Filtros y Búsqueda</h3>
                
                <div className="search-container-improved">
                  <div className="input-search-improved">
                    <FontAwesomeIcon icon={faSearch} className="search-icon" />
                    <input
                      type="text"
                      placeholder="Buscar instructor..."
                      value={filter}
                      onChange={handleFilterChange}
                      className="search-input"
                    />
                  </div>
                </div>

                <div className="filters-group">
                  <label>Estado del Instructor</label>
                  <div className="status-filters-improved">
                    <button
                      className={`status-filter-btn ${selectedState.activo ? 'active' : ''}`}
                      onClick={() => setSelectedState(prev => ({ ...prev, activo: !prev.activo }))}
                    >
                      <span className="status-indicator active"></span>
                      Activos
                    </button>
                    <button
                      className={`status-filter-btn ${selectedState.inactivo ? 'active' : ''}`}
                      onClick={() => setSelectedState(prev => ({ ...prev, inactivo: !prev.inactivo }))}
                    >
                      <span className="status-indicator inactive"></span>
                      Inactivos
                    </button>
                  </div>
                </div>

                <button className="create-instructor-btn-improved" onClick={showModalCreateInstructor}>
                  <FontAwesomeIcon icon={faUserPlus} />
                  <span>Agregar Instructor</span>
                </button>
              </div>

              {/* Estadísticas */}
              <div className="stats-card-improved">
                <h3>Estadísticas</h3>
                <div className="stats-grid-improved">
                  <div className="stat-card-improved">
                    <div className="stat-icon">
                      <FontAwesomeIcon icon={faUsers} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-value">{instructors.length}</span>
                      <span className="stat-label">Total Instructores</span>
                    </div>
                  </div>
                  <div className="stat-card-improved">
                    <div className="stat-icon">
                      <FontAwesomeIcon icon={faCheck} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-value">
                        {instructors.filter(i => i.estado?.toLowerCase() === 'activo').length}
                      </span>
                      <span className="stat-label">Activos</span>
                    </div>
                  </div>
                  <div className="stat-card-improved">
                    <div className="stat-icon">
                      <FontAwesomeIcon icon={faChartLine} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-value">
                        {instructors.filter(i => i.estado?.toLowerCase() === 'inactivo').length}
                      </span>
                      <span className="stat-label">Inactivos</span>
                    </div>
                  </div>
                </div>
              </div>
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