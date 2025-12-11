import { useState, useMemo, useEffect, useRef } from 'react';
import './ReporteEstadisticas.css';
import ReporteEstudiantes from './ReporteEstudiantes';
import { getCursos } from '../../API/ApiRpeort';
import html2pdf from "html2pdf.js"
import { FormatCourse } from './FormatCourse/FormatCourse';
import axiosInstance from '../../../config/axiosInstance';
import * as xlsx from "xlsx"
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChartLine,
    faFilter,
    faFilePdf,
    faFileExcel,
    faDownload,
    faSearch,
    faUsers,
    faChalkboardTeacher,
    faCheckCircle,
    faTimesCircle,
    faArrowLeft,
    faCogs,
    faSortAmountDown,
    faCalendarAlt,
    faBuilding,
    faGraduationCap,
    faFileExport,
    faSpinner,
    faChevronLeft,
    faChevronRight,
    faExclamationTriangle,
    faClock,
    faTag,
    faQuestionCircle,
    faFlagCheckered,
    faCalendarCheck,
    faEye
} from '@fortawesome/free-solid-svg-icons';

const swalConfig = {
    theme: "bulma",
    customClass: {
        confirmButton: "button is-primary",
        cancelButton: "button is-light",
        actions: "swal2-actions-centered",
        popup: "swal2-popup-centered",
    },
    buttonsStyling: false,
    confirmButtonText: "Aceptar",
    cancelButtonText: "Cancelar",
};

export default function ReporteEstadisticas() {
    const [pantallaActual, setPantallaActual] = useState('cursos');
    const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
    const [mostrarFiltro, setMostrarFiltro] = useState(false);
    const [datosCurso, setdatosCurso] = useState([]);
    const [showDownloadOptions, setShowDownloadOptions] = useState(false)
    const [reportType, setReportType] = useState("pdf")
    const [generating, setGenerating] = useState(false)
    const [doneGenerating, setDoneGenerating] = useState(false)
    const [reportContent, setReportContent] = useState(false)
    const [reportFilename, setReportFilename] = useState("reporte_cursos.pdf")
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [loading, setLoading] = useState(true);

    const pdfContent = useRef()
    const filtroRef = useRef(null);
    const searchInputRef = useRef(null);
    const containerRef = useRef(null);

    // Helper para formatear errores con contexto detallado
    const formatDetailedError = (error) => {
        const statusCode = error?.response?.status
        const statusText = error?.response?.statusText
        const responseData = error?.response?.data
        const requestUrl = error?.config?.url
        const method = error?.config?.method
        const baseMessage = error?.message || "Error desconocido"
        try {
            const responsePreview = typeof responseData === "string" ? responseData : JSON.stringify(responseData)
            return [
                `Mensaje: ${baseMessage}`,
                requestUrl ? `Endpoint: [${method?.toUpperCase()}] ${requestUrl}` : undefined,
                statusCode ? `HTTP: ${statusCode} ${statusText || ""}`.trim() : undefined,
                responseData ? `Respuesta: ${responsePreview}` : undefined,
            ].filter(Boolean).join("\n")
        } catch (_) {
            return [
                `Mensaje: ${baseMessage}`,
                requestUrl ? `Endpoint: [${method?.toUpperCase()}] ${requestUrl}` : undefined,
                statusCode ? `HTTP: ${statusCode} ${statusText || ""}`.trim() : undefined,
                responseData ? `Respuesta: [no serializable]` : undefined,
            ].filter(Boolean).join("\n")
        }
    }

    // Estados de paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [postsPerPage] = useState(10);

    const [filtros, setFiltros] = useState({
        estado: {
            activo: false,
            cancelado: false,
            finalizado: false,
            pendiente: false,
            'en oferta': false
        },
        empleados: {
            '0-10': false,
            '11-20': false,
            '21-30': false,
            '31-40+': false
        },
        curso: '',
        instructor: ''
    });

    // Cerrar filtros al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(event) {
            if (mostrarFiltro && filtroRef.current && !filtroRef.current.contains(event.target)) {
                const botonFiltro = document.querySelector('.re-button-filtro');
                if (botonFiltro && !botonFiltro.contains(event.target)) {
                    setMostrarFiltro(false);
                }
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [mostrarFiltro]);

    // Cargar datos iniciales
    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const data = await getCursos(currentPage);
                if (!data) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error al cargar datos',
                        text: 'No se pudieron cargar los datos de los cursos',
                        confirmButtonText: 'Aceptar',
                        confirmButtonColor: '#d33',
                        theme: "bulma",
                        customClass: { confirmButton: 'centered-swal-button' }
                    });
                }
                setdatosCurso(data);
            } catch (err) {
                console.log(err)
                Swal.fire({
                    icon: 'error',
                    title: 'Error del servidor',
                    text: 'Error en servidor al cargar los datos',
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#d33',
                    theme: "bulma",
                    customClass: { confirmButton: 'centered-swal-button' }
                });
            } finally {
                setLoading(false);
            }
        }
        fetchData()
    }, []);

    // Resetear página cuando cambien filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [filtros, searchTerm]);

    // Función para determinar el rango de empleados
    const getRangoEmpleados = (cantidad) => {
        if (cantidad <= 10) return '0-10';
        if (cantidad <= 20) return '11-20';
        if (cantidad <= 30) return '21-30';
        return '31-40+';
    };

    // Función para obtener configuración de estado
    const getEstadoConfig = (estado) => {
        const estadoLower = estado?.toLowerCase();
        switch (estadoLower) {
            case 'activo':
                return { 
                    className: 'activo', 
                    icon: faCheckCircle, 
                    label: 'Activo',
                    color: '#4CAF50'
                };
            case 'cancelado':
                return { 
                    className: 'cancelado', 
                    icon: faTimesCircle, 
                    label: 'Cancelado',
                    color: '#F44336'
                };
            case 'finalizado':
                return { 
                    className: 'finalizado', 
                    icon: faFlagCheckered, 
                    label: 'Finalizado',
                    color: '#2196F3'
                };
            case 'pendiente':
                return { 
                    className: 'pendiente', 
                    icon: faClock, 
                    label: 'Pendiente',
                    color: '#FF9800'
                };
            case 'en oferta':
                return { 
                    className: 'en-oferta', 
                    icon: faTag, 
                    label: 'En Oferta',
                    color: '#9C27B0'
                };
            default:
                return { 
                    className: 'desconocido', 
                    icon: faQuestionCircle, 
                    label: estado || 'Desconocido',
                    color: '#757575'
                };
        }
    };

    // Función para aplicar filtros y ordenamiento
    const cursosFiltrados = useMemo(() => {
        if (!datosCurso || datosCurso.length === 0) return [];

        let filtered = datosCurso.filter(curso => {
            // Filtro por estado
            const estadosSeleccionados = Object.keys(filtros.estado)
                .filter(estadoKey => filtros.estado[estadoKey])
                .map(key => key.toLowerCase());

            if (estadosSeleccionados.length > 0) {
                const estadoCurso = curso.estado?.toLowerCase() || '';
                if (!estadosSeleccionados.includes(estadoCurso)) {
                    return false;
                }
            }

            // Filtro por rango de empleados
            const rangosSeleccionados = Object.keys(filtros.empleados).filter(rango => filtros.empleados[rango]);
            if (rangosSeleccionados.length > 0) {
                const rangoEmpleado = getRangoEmpleados(curso.empleados);
                if (!rangosSeleccionados.includes(rangoEmpleado)) {
                    return false;
                }
            }

            // Filtro por nombre del curso
            if (filtros.curso && !curso.curso?.toLowerCase().includes(filtros.curso.toLowerCase())) {
                return false;
            }

            // Filtro por nombre del instructor
            if (filtros.instructor && curso.instructor) {
                const instructorLower = curso.instructor.toLowerCase();
                const filtroLower = filtros.instructor.toLowerCase();
                if (!instructorLower.includes(filtroLower)) {
                    return false;
                }
            }

            // Filtro de búsqueda global
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const cursoMatch = curso.curso?.toLowerCase().includes(searchLower) || false;
                const fichaMatch = curso.ficha?.toLowerCase().includes(searchLower) || false;
                const instructorMatch = curso.instructor?.toLowerCase().includes(searchLower) || false;
                const estadoMatch = curso.estado?.toLowerCase().includes(searchLower) || false;

                if (!(cursoMatch || fichaMatch || instructorMatch || estadoMatch)) {
                    return false;
                }
            }

            return true;
        });

        // Ordenamiento
        if (sortConfig.key) {
            filtered.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Manejar valores nulos
                if (aValue === null || aValue === undefined) aValue = '';
                if (bValue === null || bValue === undefined) bValue = '';

                // Ordenar números
                if (sortConfig.key === 'empleados') {
                    aValue = parseInt(aValue) || 0;
                    bValue = parseInt(bValue) || 0;
                }

                // Ordenar texto
                if (typeof aValue === 'string') aValue = aValue.toLowerCase();
                if (typeof bValue === 'string') bValue = bValue.toLowerCase();

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return filtered;
    }, [filtros, datosCurso, sortConfig, searchTerm]);

    // Cálculo para paginación
    const indexOfLastPost = currentPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    const currentPosts = cursosFiltrados?.slice(indexOfFirstPost, indexOfLastPost);

    // Función para manejar el clic en una fila
    const handleFilaClick = (curso) => {
        if (!curso.empleados || curso.empleados === 0) {
            Swal.fire({
                icon: "error",
                title: "Error del sistema",
                text: "Este curso no tiene empleados registrados. No se puede generar un reporte.",
                confirmButtonText: "Okay",
                theme: "bulma",
                customClass: {
                    confirmButton: 'button is-primary',
                    actions: 'swal2-actions-centered'
                }
            })
            return;
        }
        setCursoSeleccionado(curso);
        setPantallaActual('estudiantes');
    };

    // Función para volver a la pantalla de cursos
    const handleVolverACursos = () => {
        setPantallaActual('cursos');
        setCursoSeleccionado(null);
    };

    const toggleFiltro = () => {
        setMostrarFiltro(!mostrarFiltro);
    };

    const handleCheckboxChange = (categoria, opcion) => {
        setFiltros(prev => ({
            ...prev,
            [categoria]: {
                ...prev[categoria],
                [opcion]: !prev[categoria][opcion]
            }
        }));
    };

    const handleInputChange = (campo, valor) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    const limpiarFiltros = () => {
        setFiltros({
            estado: {
                activo: false,
                cancelado: false,
                finalizado: false,
                pendiente: false,
                'en oferta': false
            },
            empleados: {
                '0-10': false,
                '11-20': false,
                '21-30': false,
                '31-40+': false
            },
            curso: '',
            instructor: ''
        });
        setSearchTerm('');
        setSortConfig({ key: null, direction: 'asc' });
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const generarExcelHistorial = async () => {
        try {
            const empleados = (await axiosInstance.get(`/api/users/admin/empleados?limit=99999`)).data.empleados
            let cursosIds = (cursosFiltrados.length > 0 ? cursosFiltrados : datosCurso).map((c) => c.id)
            let cursosData = []
            let empleadosData = []

            for (let cursoId of cursosIds) {
                const curso = (await axiosInstance.get(`/api/courses/cursos/${cursoId}`)).data
                cursosData.push({
                    "Curso": curso.nombre_curso,
                    "Tipo": curso.tipo_oferta,
                    "Estado": curso.estado,
                    "Ficha": curso.ficha,
                    "Inicio": new Date(curso.fecha_inicio).toLocaleDateString("es-CO"),
                    "Fin": new Date(curso.fecha_fin).toLocaleDateString("es-CO"),
                    "Duración en días": curso.duracion_dias ?? "Sin determinar",
                    "Lugar de formación": curso.lugar_formacion ?? "Sin especificar",
                    "Instructor": curso.Instructor ? `${curso.Instructor.nombres} ${curso.Instructor.apellidos}` : "Pendiente",
                    "Cantidad de aprendices": curso.cupos_usados,
                })
            }

            empleadosData = empleados.map((e) => ({
                "Nombre": `${e.nombres} ${e.apellidos}`,
                "Documento": e.documento,
                "Numero teléfonico": e.celular,
                "Email": e.email,
                "Estado": e.estado,
                "Cursos": Array.isArray(e.cursos) ? e.cursos.join("\n") : "",
                "Empresa": e?.Empresa?.nombre_empresa || "Sin empresa"
            }))

            const workBook = xlsx.utils.book_new()
            xlsx.utils.book_append_sheet(workBook, xlsx.utils.json_to_sheet(cursosData), "Cursos")
            xlsx.utils.book_append_sheet(workBook, xlsx.utils.json_to_sheet(empleadosData), "Empleados")
            xlsx.writeFile(workBook, "reporte.xlsx", { compression: true })

            Swal.fire({
                icon: 'success',
                title: '¡Reporte Excel generado!',
                text: 'El archivo se ha descargado exitosamente',
                confirmButtonText: 'Excelente',
                confirmButtonColor: '#00843d',
                theme: 'bulma'
            });
        } catch (error) {
            console.error("Error generando Excel:", error)
            Swal.fire({
                icon: "error",
                title: "Error al generar Excel",
                text: `Error al generar Excel\n\n${formatDetailedError(error)}`,
                confirmButtonText: "Okay",
                theme: "bulma",
                customClass: {
                    confirmButton: 'button is-primary',
                    actions: 'swal2-actions-centered'
                }
            })
        } finally {
            setGenerating(false)
            setShowDownloadOptions(false);
        }
    }

    const generarReporteDesdeElemento = async (targetElement) => {
        try {
            if (reportType === "pdf") {
                if (!targetElement) throw new Error("No hay contenido para generar el PDF")

                await new Promise(r => setTimeout(r, 150))

                const worker = html2pdf().set({
                    margin: 10,
                    filename: "reporte_cursos.pdf",
                    html2canvas: {
                        scale: 2,
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#FFFFFF',
                    },
                    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
                    pagebreak: { mode: ['css', 'avoid-all', 'legacy'] }
                }).from(targetElement)

                const blob = await worker.output("blob")
                const blobUrl = URL.createObjectURL(blob)
                const filename = "reporte_cursos.pdf"
                setReportFilename(filename)
                setReportContent(blobUrl)

                const a = document.createElement('a')
                a.href = blobUrl
                a.download = filename
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)

                setDoneGenerating(true)

                Swal.fire({
                    icon: 'success',
                    title: '¡Reporte PDF generado!',
                    text: 'El archivo se ha descargado exitosamente',
                    confirmButtonText: 'Excelente',
                    confirmButtonColor: '#00843d',
                    theme: 'bulma'
                });
            }
        } catch (err) {
            console.error("Error generando PDF:", err)
            Swal.fire({
                icon: "error",
                title: "Error al generar PDF",
                text: `Error al generar PDF\n\n${formatDetailedError(err)}`,
                confirmButtonText: "Okay",
                theme: "bulma",
                customClass: {
                    confirmButton: 'button is-primary',
                    actions: 'swal2-actions-centered'
                }
            })
            setDoneGenerating(false)
        } finally {
            setGenerating(false)
            setShowDownloadOptions(false);
        }
    };

    // Contador de filtros activos
    const filtrosActivos = () => {
        let count = 0;
        if (Object.values(filtros.estado).some(val => val)) count++;
        if (Object.values(filtros.empleados).some(val => val)) count++;
        if (filtros.curso) count++;
        if (filtros.instructor) count++;
        if (searchTerm) count++;
        if (sortConfig.key) count++;
        return count;
    };

    // Si estamos en la pantalla de estudiantes, mostrar ese componente
    if (pantallaActual === 'estudiantes') {
        return (
            <ReporteEstudiantes
                cursoSeleccionado={cursoSeleccionado}
                onVolver={handleVolverACursos}
            />
        );
    }

    // Pantalla de cursos
    return (
        <div className="reporte-estadisticas-container" ref={containerRef}>
            <div className="re-header">
                <div className="re-header-content">
                    <div className="re-title-section">
                        <FontAwesomeIcon icon={faChartLine} className="re-title-icon" />
                        <div>
                            <h1 className="re-title">Reportes y Estadísticas</h1>
                            <p className="re-subtitle">Análisis detallado de cursos y estudiantes</p>
                        </div>
                    </div>
                </div>
                
                <div className="re-stats-section">
                    <div className="stat-card">
                        <FontAwesomeIcon icon={faGraduationCap} className="stat-icon" />
                        <div className="stat-content">
                            <span className="stat-value">{datosCurso?.length || 0}</span>
                            <span className="stat-label">Cursos Totales</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <FontAwesomeIcon icon={faUsers} className="stat-icon" />
                        <div className="stat-content">
                            <span className="stat-value">
                                {datosCurso?.reduce((sum, curso) => sum + (parseInt(curso.empleados) || 0), 0)}
                            </span>
                            <span className="stat-label">Empleados</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <FontAwesomeIcon icon={faChalkboardTeacher} className="stat-icon" />
                        <div className="stat-content">
                            <span className="stat-value">
                                {[...new Set(datosCurso?.map(c => c.instructor).filter(Boolean))].length}
                            </span>
                            <span className="stat-label">Instructores</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="re-controls">
                <div className="re-search-container">
                    <FontAwesomeIcon icon={faSearch} className="search-icon" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        className="re-search-input"
                        placeholder="Buscar cursos, fichas, instructores..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => setIsSearching(true)}
                        onBlur={() => setIsSearching(false)}
                    />
                    {searchTerm && (
                        <button
                            className="re-clear-search"
                            onClick={() => setSearchTerm('')}
                        >
                            <FontAwesomeIcon icon={faTimesCircle} />
                        </button>
                    )}
                </div>

                <div className="re-action-buttons">
                    <button
                        className="re-button re-button-filtro"
                        onClick={toggleFiltro}
                        data-count={filtrosActivos() > 0 ? filtrosActivos() : ''}
                    >
                        <FontAwesomeIcon icon={faFilter} />
                        <span>Filtros</span>
                        {filtrosActivos() > 0 && (
                            <span className="filter-count">{filtrosActivos()}</span>
                        )}
                    </button>

                    <button
                        className="re-button re-button-generar"
                        onClick={() => setShowDownloadOptions(true)}
                    >
                        <FontAwesomeIcon icon={faFileExport} />
                        <span>Generar Reporte</span>
                    </button>
                </div>
            </div>

            {mostrarFiltro && (
                <div className="re-filtro-menu" ref={filtroRef}>
                    <div className="filtro-header">
                        <h3><FontAwesomeIcon icon={faFilter} /> Filtros Avanzados</h3>
                        <button className="filtro-clear-all" onClick={limpiarFiltros}>
                            Limpiar todo
                        </button>
                    </div>

                    <div className="filtro-grid">
                        <div className="filtro-group">
                            <label className="filtro-label">
                                <FontAwesomeIcon icon={faCheckCircle} /> Estado del Curso
                            </label>
                            <div className="filtro-options">
                                {['activo', 'cancelado', 'finalizado', 'pendiente', 'en oferta'].map((estado) => {
                                    const estadoConfig = getEstadoConfig(estado);
                                    return (
                                        <div
                                            key={estado}
                                            className={`filtro-option ${filtros.estado[estado] ? 'selected' : ''}`}
                                            onClick={() => handleCheckboxChange('estado', estado)}
                                        >
                                            <div className="filtro-checkbox">
                                                {filtros.estado[estado] && <FontAwesomeIcon icon={faCheckCircle} />}
                                            </div>
                                            <FontAwesomeIcon 
                                                icon={estadoConfig.icon} 
                                                className="filtro-estado-icon"
                                                style={{ color: estadoConfig.color }}
                                            />
                                            <span>{estadoConfig.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="filtro-group">
                            <label className="filtro-label">
                                <FontAwesomeIcon icon={faUsers} /> Cantidad de Empleados
                            </label>
                            <div className="filtro-options">
                                {['0-10', '11-20', '21-30', '31-40+'].map((rango) => (
                                    <div
                                        key={rango}
                                        className={`filtro-option ${filtros.empleados[rango] ? 'selected' : ''}`}
                                        onClick={() => handleCheckboxChange('empleados', rango)}
                                    >
                                        <div className="filtro-checkbox">
                                            {filtros.empleados[rango] && <FontAwesomeIcon icon={faCheckCircle} />}
                                        </div>
                                        <span>{rango}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="filtro-group">
                            <label className="filtro-label">
                                <FontAwesomeIcon icon={faGraduationCap} /> Nombre del Curso
                            </label>
                            <input
                                type="text"
                                className="filtro-input"
                                placeholder="Buscar curso..."
                                value={filtros.curso}
                                onChange={(e) => handleInputChange('curso', e.target.value)}
                            />
                        </div>

                        <div className="filtro-group">
                            <label className="filtro-label">
                                <FontAwesomeIcon icon={faChalkboardTeacher} /> Instructor
                            </label>
                            <input
                                type="text"
                                className="filtro-input"
                                placeholder="Buscar instructor..."
                                value={filtros.instructor}
                                onChange={(e) => handleInputChange('instructor', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="filtro-footer">
                        <div className="filtro-results">
                            <span className="results-count">{cursosFiltrados?.length || 0}</span>
                            <span> de {datosCurso?.length || 0} cursos encontrados</span>
                        </div>
                        {filtrosActivos() > 0 && (
                            <div className="filtro-active-badge">
                                {filtrosActivos()} filtro(s) activo(s)
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="re-content">
                {loading ? (
                    <div className="re-loading">
                        <div className="loading-spinner">
                            <FontAwesomeIcon icon={faSpinner} spin />
                        </div>
                        <p>Cargando datos...</p>
                    </div>
                ) : (
                    <>
                        <div className="re-table-container">
                            <div className="re-table-header">
                                <div
                                    className={`re-table-column sortable ${sortConfig.key === 'curso' ? 'sorting' : ''}`}
                                    onClick={() => handleSort('curso')}
                                >
                                    <span>Curso</span>
                                    {sortConfig.key === 'curso' && (
                                        <FontAwesomeIcon
                                            icon={faSortAmountDown}
                                            className={`sort-icon ${sortConfig.direction === 'desc' ? 'desc' : ''}`}
                                        />
                                    )}
                                </div>
                                <div className="re-table-column">
                                    <span>Ficha</span>
                                </div>
                                <div
                                    className={`re-table-column sortable ${sortConfig.key === 'instructor' ? 'sorting' : ''}`}
                                    onClick={() => handleSort('instructor')}
                                >
                                    <span>Instructor</span>
                                    {sortConfig.key === 'instructor' && (
                                        <FontAwesomeIcon
                                            icon={faSortAmountDown}
                                            className={`sort-icon ${sortConfig.direction === 'desc' ? 'desc' : ''}`}
                                        />
                                    )}
                                </div>
                                <div
                                    className={`re-table-column sortable ${sortConfig.key === 'estado' ? 'sorting' : ''}`}
                                    onClick={() => handleSort('estado')}
                                >
                                    <span>Estado</span>
                                    {sortConfig.key === 'estado' && (
                                        <FontAwesomeIcon
                                            icon={faSortAmountDown}
                                            className={`sort-icon ${sortConfig.direction === 'desc' ? 'desc' : ''}`}
                                        />
                                    )}
                                </div>
                                <div
                                    className={`re-table-column sortable ${sortConfig.key === 'empleados' ? 'sorting' : ''}`}
                                    onClick={() => handleSort('empleados')}
                                >
                                    <span>Empleados</span>
                                    {sortConfig.key === 'empleados' && (
                                        <FontAwesomeIcon
                                            icon={faSortAmountDown}
                                            className={`sort-icon ${sortConfig.direction === 'desc' ? 'desc' : ''}`}
                                        />
                                    )}
                                </div>
                                <div className="re-table-column">
                                    <span>Acciones</span>
                                </div>
                            </div>

                            <div className="re-table-body">
                                {currentPosts?.length > 0 ? (
                                    currentPosts.map((curso) => {
                                        const tieneEmpleados = curso.empleados && curso.empleados > 0;
                                        const estadoConfig = getEstadoConfig(curso.estado);
                                        return (
                                            <div
                                                key={curso.id}
                                                className={`re-table-row ${!tieneEmpleados ? 'disabled' : ''}`}
                                                onClick={() => tieneEmpleados && handleFilaClick(curso)}
                                                title={!tieneEmpleados ? 'Este curso no tiene empleados registrados' : ''}
                                            >
                                                <div className="re-table-cell" data-label="Curso">
                                                    <div className="curso-info">
                                                        <FontAwesomeIcon icon={faGraduationCap} className="curso-icon" />
                                                        <div className="curso-details">
                                                            <span className="curso-nombre">{curso.curso}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="re-table-cell" data-label="Ficha">
                                                    <span className="curso-ficha">{curso.ficha}</span>
                                                </div>
                                                <div className="re-table-cell" data-label="Instructor">
                                                    <div className="instructor-info">
                                                        <FontAwesomeIcon icon={faChalkboardTeacher} className="instructor-icon" />
                                                        <span className="instructor-nombre">{curso.instructor || 'No asignado'}</span>
                                                    </div>
                                                </div>
                                                <div className="re-table-cell" data-label="Estado">
                                                    <span 
                                                        className={`curso-estado ${estadoConfig.className}`}
                                                        style={{ color: estadoConfig.color }}
                                                    >
                                                        <FontAwesomeIcon icon={estadoConfig.icon} />
                                                        <span>{estadoConfig.label}</span>
                                                    </span>
                                                </div>
                                                <div className="re-table-cell" data-label="Empleados">
                                                    <div className="empleados-count">
                                                        <FontAwesomeIcon icon={faUsers} />
                                                        <span>{curso.empleados || 0}</span>
                                                    </div>
                                                </div>
                                                <div className="re-table-cell" data-label="Acciones">
                                                    <button
                                                        className={`re-action-button ${!tieneEmpleados ? 'disabled' : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (tieneEmpleados) handleFilaClick(curso);
                                                        }}
                                                        disabled={!tieneEmpleados}
                                                    >
                                                        <FontAwesomeIcon icon={faEye} />
                                                        <span>Ver Reporte</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="re-empty-state">
                                        <FontAwesomeIcon icon={faExclamationTriangle} className="empty-icon" />
                                        <h3>No se encontraron cursos</h3>
                                        <p>No hay cursos que coincidan con los filtros aplicados</p>
                                        <button className="re-button re-button-secondary" onClick={limpiarFiltros}>
                                            Limpiar filtros
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {cursosFiltrados?.length > postsPerPage && (
                            <div className="re-pagination">
                                <div className="pagination-info">
                                    Mostrando {Math.min(indexOfFirstPost + 1, cursosFiltrados.length)}-
                                    {Math.min(indexOfLastPost, cursosFiltrados.length)} de {cursosFiltrados.length} cursos
                                </div>
                                <div className="pagination-controls">
                                    <button
                                        className="pagination-button"
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <FontAwesomeIcon icon={faChevronLeft} />
                                        <span>Anterior</span>
                                    </button>

                                    <div className="pagination-numbers">
                                        {Array.from({ length: Math.ceil(cursosFiltrados.length / postsPerPage) }, (_, i) => i + 1)
                                            .filter(number => {
                                                if (number === 1 || number === Math.ceil(cursosFiltrados.length / postsPerPage)) return true;
                                                if (number >= currentPage - 1 && number <= currentPage + 1) return true;
                                                return false;
                                            })
                                            .map((number, index, array) => {
                                                if (index > 0 && number - array[index - 1] > 1) {
                                                    return (
                                                        <React.Fragment key={`ellipsis-${number}`}>
                                                            <span className="pagination-ellipsis">...</span>
                                                            <button
                                                                key={number}
                                                                className={`pagination-number ${currentPage === number ? 'active' : ''}`}
                                                                onClick={() => setCurrentPage(number)}
                                                            >
                                                                {number}
                                                            </button>
                                                        </React.Fragment>
                                                    );
                                                }
                                                return (
                                                    <button
                                                        key={number}
                                                        className={`pagination-number ${currentPage === number ? 'active' : ''}`}
                                                        onClick={() => setCurrentPage(number)}
                                                    >
                                                        {number}
                                                    </button>
                                                );
                                            })}
                                    </div>

                                    <button
                                        className="pagination-button"
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(cursosFiltrados.length / postsPerPage)))}
                                        disabled={currentPage === Math.ceil(cursosFiltrados.length / postsPerPage)}
                                    >
                                        <span>Siguiente</span>
                                        <FontAwesomeIcon icon={faChevronRight} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {showDownloadOptions && (
                <div className="re-modal-overlay">
                    <div className="re-modal">
                        <div className="re-modal-header">
                            <div className="modal-header-content">
                                <FontAwesomeIcon icon={faFileExport} className="modal-header-icon" />
                                <div>
                                    <h2 className="modal-title">Generar Reporte</h2>
                                    <p className="modal-subtitle">Selecciona el formato del reporte</p>
                                </div>
                            </div>
                            <button
                                className="re-modal-close"
                                onClick={() => setShowDownloadOptions(false)}
                                disabled={generating}
                            >
                                <FontAwesomeIcon icon={faTimesCircle} />
                            </button>
                        </div>

                        <div className="re-modal-content">
                            <div className="format-selector">
                                <div className="format-options">
                                    <button
                                        className={`format-option ${reportType === "pdf" ? 'selected' : ''}`}
                                        onClick={() => setReportType("pdf")}
                                        disabled={generating}
                                    >
                                        <div className="format-icon">
                                            <FontAwesomeIcon icon={faFilePdf} />
                                        </div>
                                        <div className="format-info">
                                            <h4>PDF</h4>
                                            <p>Formato óptimo para impresión</p>
                                        </div>
                                    </button>

                                    <button
                                        className={`format-option ${reportType === "excel" ? 'selected' : ''}`}
                                        onClick={() => setReportType("excel")}
                                        disabled={generating}
                                    >
                                        <div className="format-icon">
                                            <FontAwesomeIcon icon={faFileExcel} />
                                        </div>
                                        <div className="format-info">
                                            <h4>Excel</h4>
                                            <p>Formato para análisis de datos</p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button
                                    className="re-button re-button-secondary"
                                    onClick={() => setShowDownloadOptions(false)}
                                    disabled={generating}
                                >
                                    <FontAwesomeIcon icon={faArrowLeft} />
                                    <span>Cancelar</span>
                                </button>

                                <button
                                    className="re-button re-button-primary"
                                    onClick={() => {
                                        setGenerating(true);
                                        if (reportType === "excel") {
                                            generarExcelHistorial();
                                        }
                                    }}
                                    disabled={generating}
                                >
                                    {generating ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} className="spinner" />
                                            <span>Generando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faDownload} />
                                            <span>Generar Reporte</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {(generating && reportType === "pdf") && (
                                <div style={{ position: "absolute", left: "-10000px", top: 0 }}>
                                    <FormatCourse
                                        contentKey={pdfContent}
                                        cursos={(cursosFiltrados.length > 0 ? cursosFiltrados : datosCurso).map((c) => c.id)}
                                        onReady={(el) => generarReporteDesdeElemento(el)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}