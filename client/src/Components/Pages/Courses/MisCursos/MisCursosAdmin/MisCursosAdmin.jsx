import React, { useState, useEffect } from "react";
import "./MisCursosAdmin.css";
import { Header } from "../../../../Layouts/Header/Header";
import { Footer } from "../../../../Layouts/Footer/Footer";
import { Main } from "../../../../Layouts/Main/Main";
import axiosInstance from "../../../../../config/axiosInstance";
import { useNavigate } from "react-router-dom";
import { CourseList } from "../../../../UI/CourseList/CourseList";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartSimple, faTag, faChartLine, faCheck, faCirclePlus, faFolderOpen } from '@fortawesome/free-solid-svg-icons'

export const MisCursosAdmin = () => {
    const [todosLosCursos, setTodosLosCursos] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [current, setCurrent] = useState(0);
    const [filtroActivo, setFiltroActivo] = useState("Todos");
    const [loading, setLoading] = useState(true);
    const [accountType, setAccountType] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        const fetchCursos = async () => {
            setLoading(true);
            try {
                const userSession =
                    JSON.parse(localStorage.getItem("userSession")) ||
                    JSON.parse(sessionStorage.getItem("userSession")) ||
                    {};

                const accountType = userSession.accountType;
                const empresaId = userSession.Empresa?.ID || userSession.empresa_ID;

                let response;
                if (accountType === "Administrador" || accountType === "Gestor") {
                    response = await axiosInstance.get("/api/courses/cursos");
                    setTodosLosCursos(response.data);
                    setCursos(response.data);
                } else if (accountType === "Empresa" && empresaId) {
                    response = await axiosInstance.get(`/api/courses/empresa/${empresaId}`);
                    setTodosLosCursos(response.data.cursos || []);
                    setCursos(response.data.cursos || []);
                } else {
                    setTodosLosCursos([]);
                    setCursos([]);
                }
                setAccountType(accountType);
            } catch (error) {
                console.error("Error al cargar los cursos:", error);
                setTodosLosCursos([]);
                setCursos([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCursos();
    }, []); 

    // Filtros según tipo de cuenta
    const filtros =
        accountType === "Empresa"
            ? ["Todos", "Activos", "Finalizados", "Pendientes", "Cancelados", "En oferta"]
            : [
                "Todos",
                "Finalizados",
                "Oferta abierta",
                "Oferta cerrada",
            ];

    const filtrarCursos = (filtro) => {
        setFiltroActivo(filtro);
        setCurrent(0);

        if (filtro === "Todos") {
            setCursos(todosLosCursos);
        } else if (filtro === "Oferta abierta") {
            setCursos(
                todosLosCursos.filter((curso) =>
                    curso.tipo_oferta?.toLowerCase() === "abierta"
                )
            );
        } else if (filtro === "Activos") {
            setCursos(
                todosLosCursos.filter((curso) =>
                    curso.estado?.toLowerCase() === "activo"
                )
            );
        } else if (filtro === "Finalizados") {
            setCursos(
                todosLosCursos.filter((curso) =>
                    curso.estado?.toLowerCase() === "finalizado"
                )
            );
        } else if (filtro === "Pendientes") {
            setCursos(
                todosLosCursos.filter((curso) =>
                    curso.estado?.toLowerCase() === "pendiente"
                )
            );
        } else if (filtro === "Cancelados") {
            setCursos(
                todosLosCursos.filter((curso) =>
                    curso.estado?.toLowerCase() === "cancelado"
                )
            );
        } else if (filtro === "Oferta cerrada") {
            setCursos(
                todosLosCursos.filter((curso) =>
                    curso.tipo_oferta?.toLowerCase() === "cerrada"
                )
            );
        } else {
            setCursos(
                todosLosCursos.filter((curso) =>
                    curso.estado?.toLowerCase().includes(filtro.toLowerCase())
                )
            );
        }
    };

    const handleVerCurso = () => {
        if (cursos.length > 0 && cursos[current]) {
            const curso = cursos[current];
            if (curso.ID || curso.id) {
                navigate(`/Cursos/${curso.ID || curso.id}`);
            }
        }
    };

    return (
        <>
            <Header />
            <Main>
                <div className="mis-cursos-admin-container">
                    {/* Header Mejorado */}
                    <div className="course-header-improved">
                        <div className="header-content-improved">
                            <h1>Mis <span>Cursos</span></h1>
                            <div className="header-stats-improved">
                                <div className="stat-item-improved">
                                    <span className="stat-number">{cursos.length}</span>
                                    <span className="stat-label">
                                        {filtroActivo !== "Todos" ? filtroActivo : "Total"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filtros Mejorados */}
                    <div className="filters-section-improved">
                        <div className="filters-container-improved">
                            {filtros.map((filtro, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => filtrarCursos(filtro)}
                                    className={`filter-btn-improved ${filtroActivo === filtro ? "active" : ""}`}
                                >
                                    <span className="filter-text">{filtro}</span>
                                    {filtroActivo === filtro && (
                                        <span className="filter-indicator"></span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Contenido Principal */}
                    <div className="main-content-improved">
                        {/* Panel de Carrusel */}
                        <div className="carousel-panel">
                            {loading ? (
                                <div className="loading-state-improved">
                                    <div className="loading-spinner-improved"></div>
                                    <p>Cargando cursos...</p>
                                </div>
                            ) : cursos.length > 0 ? (
                                <div className="carousel-content">
                                    <CourseList
                                        loading={loading}
                                        cursos={cursos}
                                        onChange={(s) => setCurrent(s)}
                                        compact={true}
                                    />

                                    <div className="carousel-controls">
                                        <div className="carousel-info-improved">
                                            <span className="current-course-info">
                                                Curso {current + 1} de {cursos.length}
                                            </span>
                                            {cursos[current] && (
                                                <span className="course-ficha-info">
                                                    Ficha: {cursos[current].ficha}
                                                </span>
                                            )}
                                        </div>

                                        <button
                                            className="ver-curso-btn-improved"
                                            onClick={handleVerCurso}
                                        >
                                            Ver Curso Seleccionado
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="no-courses-improved">
                                    <div className="no-courses-icon"><FontAwesomeIcon icon={faFolderOpen} /></div>
                                    <h3>No se encontraron cursos</h3>
                                    <p>No hay cursos disponibles con los filtros seleccionados</p>
                                    <button
                                        className="reset-filters-btn-improved"
                                        onClick={() => filtrarCursos("Todos")}
                                    >
                                        Mostrar todos los cursos
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Panel de Información Lateral */}
                        {/* Panel de Información Lateral */}
                        <div className="info-panel-improved">
                            <div className="info-card-improved">
                                <div className="info-header-improved">
                                    <h3>Gestión de Cursos</h3>
                                    <p>Administra y visualiza todos tus cursos de forma organizada</p>
                                </div>

                                <div className="quick-actions-improved">
                                    {/* Botón condicional para Administrador y Gestor */}
                                    {accountType && (accountType === 'Administrador' || accountType === 'Gestor') && (
                                        <button
                                            className="action-btn-improved primary"
                                            onClick={() => navigate('/Cursos/CrearCurso')}
                                        >
                                            <div className="">
                                                <FontAwesomeIcon icon={faCirclePlus} className="add-courses-icon" />
                                                <span className="">Crear nuevo curso</span>
                                            </div>
                                        </button>
                                    )}
                                    
                                    <button
                                        className="action-btn-improved secondary"
                                        onClick={() => filtrarCursos("Activos")}
                                    >
                                        <div className="ViewCoursesIcon">
                                            <FontAwesomeIcon icon={faChartSimple} />
                                            <span>Ver Cursos Activos</span>
                                        </div>
                                    </button>
                                    <button
                                        className="action-btn-improved secondary"
                                        onClick={() => filtrarCursos("En oferta")}
                                    >
                                        <div className="ViewCoursesIcon">
                                            <FontAwesomeIcon icon={faTag} />
                                            <span>Ver en oferta</span>
                                        </div>
                                    </button>
                                </div>

                                <div className="stats-grid-improved">
                                    <div className="stat-card-improved">
                                        <div className="ViewCoursesIcon">
                                            <FontAwesomeIcon icon={faChartLine} className="total-courses" />
                                        </div>
                                        <div className="stat-content">
                                            <span className="stat-value">{todosLosCursos.length}</span>
                                            <span className="stat-label">Total</span>
                                        </div>
                                    </div>
                                    <div className="stat-card-improved">
                                        <div className="ViewCoursesIcon">
                                            <FontAwesomeIcon icon={faCheck} className="check-icon" />
                                        </div>
                                        <div className="stat-content">
                                            <span className="stat-value">
                                                {todosLosCursos.filter(c => c.estado?.toLowerCase() === 'activo').length}
                                            </span>
                                            <span className="stat-label">Activos</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Main>
            <Footer />
        </>
    );
};