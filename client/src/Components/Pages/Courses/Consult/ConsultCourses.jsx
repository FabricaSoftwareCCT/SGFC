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


import arrowLeft from '../../../../assets/Icons/arrowLeft.png';
import arrowRight from '../../../../assets/Icons/arrowRight.png';

export const ConsultCourses = () => {
  const [cursos, setCursos] = useState([]);
  const [allCursos, setAllCursos] = useState([]); // Para guardar todos los cursos
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [startIndex, setStartIndex] = useState(0);
  const scrollRef = useRef(null);
  const navigate = useNavigate();
  const userData =
    JSON.parse(localStorage.getItem("userSession")) ||
    JSON.parse(sessionStorage.getItem("userSession")) ||
    {};
  const tipoCuenta = userData.accountType || "invitado";

  // Obtener todos los cursos al cargar la página
  useEffect(() => {
    const fetchCursos = async () => {
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
      }
    };
    fetchCursos();
  }, []);
  // Resetear el carrusel al cambiar cursos
  useEffect(() => {
    setStartIndex(0);
  }, [cursos]);

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

  // Cursos a mostrar en el carrusel
  const visibleCursos = cursos.slice(startIndex, startIndex + 3);

  // Scroll carrusel
  const scroll = (direction) => {
    if (direction === 'left') {
      setStartIndex((prev) => Math.max(prev - 1, 0));
    } else {
      setStartIndex((prev) =>
        Math.min(prev + 1, cursos.length - 3)
      );
    }
  };

  // filtrar por categoria
  const handleCategoryChange = (e) => {
    const category = e.target.value;
    console.log(cursos);
    cursos.sort((a, b) => {
      if (category === "Estado") {
        console.log(a.estado, b.estado);
        return a.estado.localeCompare(b.estado);
      } else if (category === "Oferta") {
        console.log(a.tipo_oferta, b.tipo_oferta);
        return a.tipo_oferta === b.tipo_oferta ? 0 : a.tipo_oferta ? -1 : 1;
      }
    });
    setSelectedCategory(category);
    setCursos([...cursos]);
  }

  return (
    <>
      <Main>
        <div className="container_consultCourse">
          <img className='nub1' src={nub1} alt="" />
          <img className='nub2' src={nub2} alt="" />
          <img className='nub3' src={nub3} alt="" />

          <img className='illustration_search' src={ilustrationSearch} alt="" />
          <h2>
            Buscar <span className='complementary'>Cursos</span>
          </h2>
          <p>Busca un curso por su <b>nombre</b> o <b>ficha</b>.</p>

        <div className="options_Search">
          {/* Select Estado */}
          <div className="custom-select-container">
            <label htmlFor="estado">Estado</label>
            <select
              className="custom-select"
              //value={selectedEstado}
              //onChange={handleEstadoChange}
            >
              <option value="activo">Activo</option>
              <option value="en_oferta">En oferta</option>
            </select>
          </div>

          {/* Select Oferta */}
          <div className="custom-select-container">
            <label htmlFor="oferta">Oferta</label>
            <select
              className="custom-select"
              //value={selectedOferta}
              //onChange={handleOfertaChange}
            >
              <option value="abierta">Abierta</option>
              <option value="cerrada">Cerrada</option>
            </select>
          </div>

          {/* Input de búsqueda */}
          <input
            type="text"
            className="search-input"
            placeholder="Nombre o ficha del curso"
            //value={searchTerm}
            //onChange={handleSearchChange}
          />
        </div>

          {errorMessage && (
            <p className="error-message-search" style={{ marginTop: 8, marginBottom: 0 }}>
              {errorMessage}
            </p>
          )}

          {cursos.length > 0 && (
            <div className="carousel-container">
              <h2 className="carousel-title">
                {cursos.length === 1
                  ? "1 resultado"
                  : `${cursos.length} resultados`}
              </h2>
              <div className="carousel-wrapper">
                {cursos.length > 3 && (
                  <button
                    className="carousel-arrow left"
                    onClick={() => scroll('left')}
                    disabled={startIndex === 0}
                    style={{ opacity: startIndex === 0 ? 0.5 : 1, cursor: startIndex === 0 ? "not-allowed" : "pointer" }}
                  >
                    <img src={arrowLeft} alt="Flecha izquierda" />
                  </button>
                )}
                <div className="carousel-track-search-course" ref={scrollRef}>
                  {visibleCursos.map((curso) => (
                    <div
                      className="carousel-card-search-course"
                      key={curso.ID || curso.id}
                      onClick={() => handleCardClick(curso.ID || curso.id)}
                    >
                      <img
                        className='img_course'
                        src={`data:image/png;base64,${curso.imagen}`}
                        alt={curso.nombre_curso}
                      />
                      <div className="card-text-search-course">
                        <h4>{curso.nombre_curso}</h4>
                        <p>{curso.ficha}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {cursos.length > 3 && (
                  <button
                    className="carousel-arrow right"
                    onClick={() => scroll('right')}
                    disabled={startIndex >= cursos.length - 3}
                    style={{ opacity: startIndex >= cursos.length - 3 ? 0.5 : 1, cursor: startIndex >= cursos.length - 3 ? "not-allowed" : "pointer" }}
                  >
                    <img src={arrowRight} alt="Flecha derecha" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </Main>
      <Footer />
    </>
  );
};