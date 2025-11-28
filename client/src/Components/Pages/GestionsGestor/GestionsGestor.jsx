import { useState, useEffect } from "react";
import "./GestionsGestor.css";
import { Header } from "../../Layouts/Header/Header";
import { Footer } from "../../Layouts/Footer/Footer";
import { Main } from "../../Layouts/Main/Main";
import { UpdateGestor } from "./UpdateGestor/UpdateGestor";
import axiosInstance from "../../../config/axiosInstance";
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faChartLine, faCheck, faUsers, faSearch, faFolderOpen, faIdCard, faPhone, faEnvelope } from '@fortawesome/free-solid-svg-icons';

export const GestionsGestor = () => {
  const [gestores, setGestores] = useState([]);
  const [filteredGestors, setfilteredGestorses] = useState([]);
  const [filter, setFilter] = useState("");
  const [current, setCurrent] = useState(0);
  const [selectedState, setSelectedState] = useState({
    activo: true,
    inactivo: true,
  });
  const [selectedGestor, setSelectedGestor] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchGestor = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/users/gestores');
      setGestores(response.data);
      setfilteredGestorses(response.data);
    } catch (error) {
      console.error('Error al obtener los Gestores:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al cargar los Gestores. Por favor, inténtalo más tarde.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#00a144',
        theme: "bulma",
        customClass: { confirmButton: 'centered-swal-button' }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGestor();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedState, filter, gestores]);

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

  const next = () => {
    if (filteredGestors.length > 1) {
      setCurrent((prev) => (prev + 1) % filteredGestors.length);
    }
  };

  const prev = () => {
    if (filteredGestors.length > 1) {
      setCurrent((prev) => (prev - 1 + filteredGestors.length) % filteredGestors.length);
    }
  };

  const showModalCreateGestor = () => {
    const modalCreateGestor = document.getElementById("modal-overlayCreateGestor");
    if (modalCreateGestor) {
      modalCreateGestor.style.display = "flex";
    }
  };

  const showModalSeeProfile = (gestor) => {
    setSelectedGestor(gestor);
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

  const getVisibleGestores = () => {
    if (filteredGestors.length === 0) return [];
    if (filteredGestors.length === 1) return [filteredGestors[0]];
    
    const visible = [];
    for (let i = 0; i < Math.min(3, filteredGestors.length); i++) {
      const index = (current + i) % filteredGestors.length;
      visible.push(filteredGestors[index]);
    }
    return visible;
  };

  const visibleGestores = getVisibleGestores();
  const centerGestor = filteredGestors.length > 0 ? 
    filteredGestors[(current + 1) % filteredGestors.length] : null;

  return (
    <>
      <Header />
      <Main>
        <div className="gg-container">
          {/* Header */}
          <div className="gg-header">
            <div className="gg-header-content">
              <h1>Gestión de <span>Gestores</span></h1>
              <div className="gg-header-stats">
                <div className="gg-stat-item">
                  <span className="gg-stat-number">{filteredGestors.length}</span>
                  <span className="gg-stat-label">
                    {selectedState.activo && !selectedState.inactivo ? 'Activos' : 
                     !selectedState.activo && selectedState.inactivo ? 'Inactivos' : 'Filtrados'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Layout Principal */}
          <div className="gg-main-content">
            {/* Columna Izquierda - Carrusel */}
            <div className="gg-carousel-section">
              <div className="gg-carousel-panel">
                {loading ? (
                  <div className="gg-loading-state">
                    <div className="gg-loading-spinner"></div>
                    <p>Cargando gestores...</p>
                  </div>
                ) : filteredGestors.length > 0 ? (
                  <div className="gg-carousel-content">
                    {/* Navegación del Carrusel */}
                    <div className="gg-carousel-navigation">
                      {filteredGestors.length > 1 && (
                        <>
                          <button className="gg-carousel-arrow left" onClick={prev}>
                            ❮
                          </button>
                          <button className="gg-carousel-arrow right" onClick={next}>
                            ❯
                          </button>
                        </>
                      )}
                    </div>

                    {/* Carrusel de Gestores */}
                    <div className="gg-carousel-track">
                      {visibleGestores.map((gestor, index) => {
                        const isCenter = filteredGestors.length === 1 ? true : 
                                       filteredGestors.length === 2 ? index === 0 : index === 1;
                        const positionClass = isCenter ? 'gg-card-center' : 'gg-card-side';
                        
                        return (
                          <div className={`gg-gestor-card ${positionClass}`} key={gestor.ID || index}>
                            <div className="gg-gestor-image-container">
                              <img
                                src={getImageSrcFromBase64(gestor?.foto_perfil)}
                                alt={`${gestor.nombres} ${gestor.apellidos}`}
                                className="gg-gestor-image"
                                onError={(e) => {
                                  e.target.src = '/default-profile.png';
                                }}
                              />
                              <div className={`gg-status-badge ${gestor?.estado?.toLowerCase()}`}>
                                {gestor?.estado}
                              </div>
                            </div>
                            {isCenter && (
                              <div className="gg-gestor-mini-info">
                                <h4>{gestor.nombres} {gestor.apellidos}</h4>
                                <p>{gestor.titulo_profesional || 'Gestor'}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Información Detallada del Gestor Central */}
                    {centerGestor && (
                      <div className="gg-gestor-info">
                        <div className="gg-gestor-details-card">
                          <h3>{centerGestor.nombres} {centerGestor.apellidos}</h3>
                          <p className="gg-gestor-title">{centerGestor.titulo_profesional || 'Gestor'}</p>
                          
                          <div className="gg-gestor-contact-info">
                            <div className="gg-contact-item">
                              <FontAwesomeIcon icon={faIdCard} />
                              <span>Cédula: {centerGestor.documento}</span>
                            </div>
                            <div className="gg-contact-item">
                              <FontAwesomeIcon icon={faPhone} />
                              <span>Celular: {centerGestor.celular}</span>
                            </div>
                            <div className="gg-contact-item">
                              <FontAwesomeIcon icon={faEnvelope} />
                              <span>Email: {centerGestor.email}</span>
                            </div>
                          </div>

                          <button
                            className="gg-view-profile-btn"
                            onClick={() => showModalSeeProfile(centerGestor)}
                          >
                            Ver Perfil Completo
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Indicador de Posición */}
                    {filteredGestors.length > 1 && (
                      <div className="gg-carousel-indicator">
                        <span className="gg-current-position">
                          {current + 1} de {filteredGestors.length}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="gg-no-gestores">
                    <div className="gg-no-gestores-icon">
                      <FontAwesomeIcon icon={faFolderOpen} />
                    </div>
                    <h3>No se encontraron gestores</h3>
                    <p>No hay gestores disponibles con los filtros seleccionados</p>
                    <button
                      className="gg-reset-filters-btn"
                      onClick={() => {
                        setFilter("");
                        setSelectedState({ activo: true, inactivo: true });
                      }}
                    >
                      Mostrar todos los gestores
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Columna Derecha - Panel de Control */}
            <div className="gg-control-panel">
              {/* Filtros y Búsqueda */}
              <div className="gg-filters-card">
                <h3>Filtros y Búsqueda</h3>
                
                <div className="gg-search-container">
                  <div className="gg-input-search">
                    <FontAwesomeIcon icon={faSearch} className="gg-search-icon" />
                    <input
                      type="text"
                      placeholder="Buscar gestor..."
                      value={filter}
                      onChange={handleFilterChange}
                      className="gg-search-input"
                    />
                  </div>
                </div>

                <div className="gg-filters-group">
                  <label>Estado del Gestor</label>
                  <div className="gg-status-filters">
                    <button
                      className={`gg-status-filter-btn ${selectedState.activo ? 'active' : ''}`}
                      onClick={() => setSelectedState(prev => ({ ...prev, activo: !prev.activo }))}
                    >
                      <span className="gg-status-indicator active"></span>
                      Activos
                    </button>
                    <button
                      className={`gg-status-filter-btn ${selectedState.inactivo ? 'active' : ''}`}
                      onClick={() => setSelectedState(prev => ({ ...prev, inactivo: !prev.inactivo }))}
                    >
                      <span className="gg-status-indicator inactive"></span>
                      Inactivos
                    </button>
                  </div>
                </div>

                <button className="gg-create-gestor-btn" onClick={showModalCreateGestor}>
                  <FontAwesomeIcon icon={faUserPlus} />
                  <span>Agregar Gestor</span>
                </button>
              </div>

              {/* Estadísticas */}
              <div className="gg-stats-card">
                <h3>Estadísticas</h3>
                <div className="gg-stats-grid">
                  <div className="gg-stat-card">
                    <div className="gg-stat-icon">
                      <FontAwesomeIcon icon={faUsers} />
                    </div>
                    <div className="gg-stat-content">
                      <span className="gg-stat-value">{gestores.length}</span>
                      <span className="gg-stat-label">Total Gestores</span>
                    </div>
                  </div>
                  <div className="gg-stat-card">
                    <div className="gg-stat-icon">
                      <FontAwesomeIcon icon={faCheck} />
                    </div>
                    <div className="gg-stat-content">
                      <span className="gg-stat-value">
                        {gestores.filter(g => g.estado?.toLowerCase() === 'activo').length}
                      </span>
                      <span className="gg-stat-label">Activos</span>
                    </div>
                  </div>
                  <div className="gg-stat-card">
                    <div className="gg-stat-icon">
                      <FontAwesomeIcon icon={faChartLine} />
                    </div>
                    <div className="gg-stat-content">
                      <span className="gg-stat-value">
                        {gestores.filter(g => g.estado?.toLowerCase() === 'inactivo').length}
                      </span>
                      <span className="gg-stat-label">Inactivos</span>
                    </div>
                  </div>
                </div>
              </div>
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
};