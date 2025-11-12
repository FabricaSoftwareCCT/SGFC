import React, { useEffect, useState, useRef } from 'react';
import './MisCursos.css';
import '../Consult/ConsultCourses.css';
import { Footer } from '../../../Layouts/Footer/Footer';
import { Main } from '../../../Layouts/Main/Main';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../config/axiosInstance';
import arrowLeft from '../../../../assets/Icons/arrowLeft.png';
import arrowRight from '../../../../assets/Icons/arrowRight.png';

// 🔧 Función para normalizar texto (sin tildes, en minúsculas)
const normalizeText = (text) =>
  text.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const MisCursos = () => {
  const [cursos, setCursos] = useState([]);
  const [filteredCursos, setFilteredCursos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [startIndex, setStartIndex] = useState(0);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  const userSession =
    JSON.parse(localStorage.getItem('userSession')) ||
    JSON.parse(sessionStorage.getItem('userSession'));

  useEffect(() => {
    const fetchCursos = async () => {
      try {
        let response;

        if (!userSession?.ID && !userSession?.id) {
          setErrorMessage("No se pudo obtener el ID del usuario");
          return;
        }

        switch (userSession?.accountType) {
          case 'Instructor':
            const instructorId = userSession.ID || userSession.id;
            response = await axiosInstance.get(`/api/courses/cursos-asignados/${instructorId}`);
            const cursosAsignados = response.data.map(asignacion => ({
              ...asignacion.Curso,
              ID: asignacion.Curso.ID || asignacion.Curso.id || asignacion.curso_ID,
            }));
            setCursos(cursosAsignados);
            setFilteredCursos(cursosAsignados);
            break;

          case 'Administrador':
          case 'Gestor':
            response = await axiosInstance.get("/api/courses/cursos");
            const todosLosCursos = response.data.map(curso => ({
              ...curso,
              ID: curso.ID || curso.id,
            }));
            setCursos(todosLosCursos);
            setFilteredCursos(todosLosCursos);
            break;

          default:
            setErrorMessage("No tienes permisos para ver esta página");
            return;
        }
      } catch (error) {
        console.error("Error al obtener los cursos:", error);
        setErrorMessage("Error al cargar los cursos");
      }
    };

    if (userSession) {
      fetchCursos();
    } else {
      setErrorMessage("Debes iniciar sesión para ver tus cursos");
    }
  }, []);

  // 🎯 Filtro de cursos reactivo
  useEffect(() => {
    const term = normalizeText(searchTerm.trim());

    if (!term) {
      setFilteredCursos(cursos);
      return;
    }

    const filtered = cursos.filter((curso) => {
      const ficha = normalizeText(curso.ficha || '');
      const nombre = normalizeText(curso.nombre_curso || '');
      return ficha.includes(term) || nombre.includes(term);
    });

    setFilteredCursos(filtered);
    setStartIndex(0); // Reiniciar carrusel solo al aplicar filtro
  }, [searchTerm, cursos]);

  // 👉 Manejar input de búsqueda
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // 👉 Cursos visibles en el carrusel
  const visibleCursos = filteredCursos.slice(startIndex, startIndex + 3);

  // 👉 Scroll del carrusel
  const scroll = (direction) => {
    if (direction === 'left') {
      setStartIndex((prev) => Math.max(prev - 1, 0));
    } else {
      setStartIndex((prev) =>
        Math.min(prev + 1, filteredCursos.length - 3)
      );
    }
  };

  // 👉 Ir al detalle del curso
  const handleCardClick = (ID) => {
    if (!ID) {
      console.error("El ID del curso es undefined o null");
      return;
    }
    navigate(`/Cursos/${ID}`);
  };

  // 👉 Mostrar mensaje si hay error
  if (errorMessage) {
    return (
      <>
        <Main>
          <div className="container_misCursos">
            <h2>Cursos Asignados</h2>
            <p className="error-message">{errorMessage}</p>
          </div>
        </Main>
        <Footer />
      </>
    );
  }

  // 👉 Render principal
  return (
    <>
      <Main>
        <div className="container_misCursos">
          <h2>
            Cursossss <span className="complementary">Asignados</span>
          </h2>
          <p>Busca un curso por su ficha o nombre.</p>

          <div className="options_Search">
            <input
              type="text"
              placeholder="Buscar por ficha o nombre del curso"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

          <div className="container-carousel-illustration">
            <div className="illustration-container-misCursos">
              <img
                src="/src/assets/Ilustrations/Professor-amico.svg"
                alt="Ilustración de gestión de asistencia"
              />
            </div>

            {filteredCursos.length > 0 ? (
              <div className="carousel-container">
                <div className="carousel-wrapper">
                  {filteredCursos.length > 3 && (
                    <button
                      className="carousel-arrow left"
                      onClick={() => scroll('left')}
                      disabled={startIndex === 0}
                      style={{
                        opacity: startIndex === 0 ? 0.5 : 1,
                        cursor: startIndex === 0 ? "not-allowed" : "pointer",
                      }}
                    >
                      <img src={arrowLeft} alt="Flecha izquierda" />
                    </button>
                  )}

                  <div className="carousel-track-search-course" ref={scrollRef}>
                    {visibleCursos.map((curso) => (
                      <div
                        className="carousel-card-search-course"
                        key={curso.ID}
                        onClick={() => handleCardClick(curso.ID)}
                      >
                        <img
                          className="img_course"
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

                  {filteredCursos.length > 3 && (
                    <button
                      className="carousel-arrow right"
                      onClick={() => scroll('right')}
                      disabled={startIndex >= filteredCursos.length - 3}
                      style={{
                        opacity: startIndex >= filteredCursos.length - 3 ? 0.5 : 1,
                        cursor: startIndex >= filteredCursos.length - 3 ? "not-allowed" : "pointer",
                      }}
                    >
                      <img src={arrowRight} alt="Flecha derecha" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <p >
                No se encontraron resultados.
              </p>
            )}
          </div>
        </div>
      </Main>
      <Footer />
    </>
  );
};
