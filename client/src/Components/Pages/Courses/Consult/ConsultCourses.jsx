import React, { useState, useRef, useEffect } from 'react';
import './ConsultCourses.css';
import { Footer } from '../../../Layouts/Footer/Footer';
import { Main } from '../../../Layouts/Main/Main';
import axiosInstance from '../../../../config/axiosInstance';
import { useNavigate } from 'react-router-dom';
import ilustrationSearch from '../../../../assets/Ilustrations/search_course.svg';
import nub1 from '../../../../assets/Ilustrations/nub1.svg';
import nub2 from '../../../../assets/Ilustrations/nub2.svg';
import nub3 from '../../../../assets/Ilustrations/nub3.svg';

import {FontAwesomeIcon} from '@fortawesome/react-fontawesome' 
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import arrowLeft from '../../../../assets/Icons/arrowLeft.png';
import arrowRight from '../../../../assets/Icons/arrowRight.png';

export const ConsultCourses = () => {
  const [cursos, setCursos] = useState([]);
  const [allCursos, setAllCursos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedEstado, setSelectedEstado] = useState("");
  const [selectedOferta, setSelectedOferta] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const userData =
    JSON.parse(localStorage.getItem("userSession")) ||
    JSON.parse(sessionStorage.getItem("userSession")) ||
    {};
  const tipoCuenta = userData.accountType || "invitado";

  // Obtener todos los cursos al cargar la página
  useEffect(() => {
    const fetchCursos = async () => {
      setIsLoading(true);
      try {
        const response = await axiosInstance.get('/api/courses/cursos');
        let cursosFiltrados = response.data;

        const restringidos = ["invitado", "Empresa", "Aprendiz"];
        if (restringidos.includes(tipoCuenta)) {
          cursosFiltrados = cursosFiltrados.filter(
            (curso) => curso.estado?.toLowerCase() === "en oferta"
          );
        }

        setCursos(cursosFiltrados);
        setAllCursos(cursosFiltrados);
        setErrorMessage("");
      } catch (error) {
        setCursos([]);
        setAllCursos([]);
        setErrorMessage("Error al cargar los cursos.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCursos();
  }, []);

  // Búsqueda en tiempo real con debounce
  useEffect(() => {
    if (!searchTerm.trim()) {
      setCursos(allCursos);
      setErrorMessage("");
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const response = await axiosInstance.get(
          `/api/courses/searchCurso?input=${encodeURIComponent(searchTerm.trim())}`
        );
        let cursosFiltrados = response.data;

        if (
          tipoCuenta === "invitado" ||
          tipoCuenta === "Empresa" ||
          tipoCuenta === "Aprendiz"
        ) {
          cursosFiltrados = cursosFiltrados.filter(
            (curso) => curso.estado?.toLowerCase() === "en oferta"
          );
        }

        setCursos(cursosFiltrados);
        setErrorMessage("");
      } catch (error) {
        setCursos([]);
        if (error.response && error.response.status === 404) {
          setErrorMessage("No se encontraron resultados.");
        } else {
          setErrorMessage("Error al buscar el curso. Intenta nuevamente.");
        }
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, allCursos]);

  // Redirigir a ver curso
  const handleCardClick = (ID) => {
    if (!ID) return;
    navigate(`/Cursos/${ID}`);
  };

  // filtrar por categoria estado
  const handleCategoryChangeEstado = (e) => {
    const category = e.target.value;
    setSelectedEstado(category);
    let filtered = allCursos;
    if (category) {
      filtered = filtered.filter(
        (curso) => curso.estado?.toLowerCase() === category.toLowerCase()
      );
    }
    setCursos(filtered);
  }

  // filtrar por categoria oferta
  const handleOfertaChange = (e) => {
    const oferta = e.target.value;
    setSelectedOferta(oferta);
    let filtered = allCursos;
    if (oferta) {
      filtered = filtered.filter(
        (curso) => curso.tipo_oferta?.toLowerCase() === oferta.toLowerCase()
      );
    }
    setCursos(filtered);
  };

  return (
    <>
      <Main>
        <div className="consult-courses-container">
          {/* Header Principal */}
          <div className="courses-header">
            <div className="header-content">
              <h1 className="main-title">
                Buscar <span className="accent-text">Cursos</span>
              </h1>
              <p className="subtitle">
                Encuentra el curso perfecto por <strong>nombre</strong> o <strong>ficha</strong>
              </p>
            </div>
            
            <div className="header-stats">
              <div className="stat-card">
                <span className="stat-number">{cursos.length}</span>
                <span className="stat-label">Cursos Disponibles</span>
              </div>
            </div>
          </div>

          {/* Panel de Búsqueda y Filtros */}
          <div className="search-panel">
            <div className="search-section">
              <div className="search-input-container">
                <input
                  type="text"
                  className="search-input"
                  placeholder="¿Qué curso estás buscando?"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FontAwesomeIcon icon={faMagnifyingGlass} className='search-icon' />
                {/* <span className="search-icon">🔍</span> */}
              </div>
            </div>

            <div className="filters-section-c">
              <div className="filter-group">
                <label className="filter-label">Estado del Curso</label>
                <select
                  className="filter-select"
                  value={selectedEstado}
                  onChange={handleCategoryChangeEstado}
                >
                  <option value="">Todos los estados</option>
                  <option value="en oferta">En oferta</option>
                  <option value="activo">Activo</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Tipo de Oferta</label>
                <select
                  className="filter-select"
                  value={selectedOferta}
                  onChange={handleOfertaChange}
                >
                  <option value="">Todas las ofertas</option>
                  <option value="abierta">Abierta</option>
                  <option value="cerrada">Cerrada</option>
                </select>
              </div>
            </div>
          </div>

          {/* Estados de Carga y Resultados */}
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Cargando cursos disponibles...</p>
            </div>
          ) : errorMessage ? (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <h3>Error en la búsqueda</h3>
              <p>{errorMessage}</p>
            </div>
          ) : cursos.length === 0 ? (
            <div className="no-results-state">
              <div className="no-results-icon">📚</div>
              <h3>No se encontraron cursos</h3>
              <div className="no-results-message">
                {selectedEstado && !selectedOferta && (
                  <p>No hay cursos con estado: <strong>{selectedEstado}</strong></p>
                )}
                {selectedOferta && !selectedEstado && (
                  <p>No hay cursos con oferta: <strong>{selectedOferta}</strong></p>
                )}
                {selectedEstado && selectedOferta && (
                  <p>No hay cursos con estado <strong>{selectedEstado}</strong> y oferta <strong>{selectedOferta}</strong></p>
                )}
                {!selectedEstado && !selectedOferta && (
                  <p>No se encontraron cursos disponibles con los criterios actuales.</p>
                )}
              </div>
              <button 
                className="reset-filters-btn"
                onClick={() => {
                  setSelectedEstado("");
                  setSelectedOferta("");
                  setSearchTerm("");
                  setCursos(allCursos);
                }}
              >
                Mostrar todos los cursos
              </button>
            </div>
          ) : (
            <div className="results-section">
              {/* Header de Resultados */}
              <div className="results-header">
                <h2 className="results-title">
                  {cursos.length === 1 ? "1 curso encontrado" : `${cursos.length} cursos encontrados`}
                </h2>
              </div>

              {/* Grid de Cursos */}
              <div className="courses-grid-container">
                <div className="courses-grid">
                  {cursos.map((curso, index) => (
                    <div
                      className="course-card"
                      key={curso.ID || curso.id}
                      onClick={() => handleCardClick(curso.ID || curso.id)}
                    >
                      <div className="card-image-container">
                        <img
                          className='course-image'
                          src={`data:image/png;base64,${curso.imagen}`}
                          alt={curso.nombre_curso}
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjMDA4NDNkIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzAwODQzZCIgZm9udC1zaXplPSIxNCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIj5DbHVybyBObyBEaXNwb25pYmxlPC90ZXh0Pgo8L3N2Zz4K';
                          }}
                        />
                        <div className="card-overlay">
                          <span className="view-course-text">Ver Curso</span>
                        </div>
                      </div>
                      
                      <div className="card-content">
                        <div className="course-badge">
                          {curso.estado || "Sin estado"}
                        </div>
                        <h3 className="course-title">{curso.nombre_curso}</h3>
                        <p className="course-code">Ficha: {curso.ficha}</p>
                        <div className="course-meta">
                          <span className="offer-type">
                            {curso.tipo_oferta || "No especificado"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Main>
      <Footer />
    </>
  );
};