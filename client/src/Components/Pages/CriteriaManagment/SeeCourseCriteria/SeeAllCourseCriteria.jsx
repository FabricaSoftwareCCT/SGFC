import "./SeeAllCourseCriteria.css"

import { useNavigate, useParams } from "react-router-dom"
import { Header } from "../../../Layouts/Header/Header"
import { Main } from "../../../Layouts/Main/Main"
import { useEffect, useRef, useState } from "react"
import { GoBackArrow } from "../../../UI/GoBackArrow/GoBackArrow"
import { PageMover } from "../../../UI/PageMover/PageMover"
import axiosInstance from "../../../../config/axiosInstance"
import { generarExcelCriterios } from "../../../../utils/Reports/Criterios"
import { ReportCriteria } from "./ReportCriteria/ReportCriteria"
import html2pdf from "html2pdf.js"
import Swal from "sweetalert2";
import 'sweetalert2/themes/bulma.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faFilter,
    faEdit,
    faSave,
    faTimes,
    faPlus,
    faDownload,
    faSearch,
    faCalendarAlt,
    faUser,
    faFileAlt,
    faFileExcel,
    faFilePdf,
    faChevronDown,
    faChevronUp,
    faClipboardCheck
} from '@fortawesome/free-solid-svg-icons'

export const SeeAllCourseCriteria = () => {
    const { id } = useParams()
    const navigate = useNavigate()

    const [editing, setEditing] = useState(false)
    const [loading, setLoading] = useState(true)
    const [criteria, setCriteria] = useState([])
    const [criteriaBackup, setCriteriaBackup] = useState([])
    const [curso, setCurso] = useState()

    const [filtering, setFiltering] = useState(false)
    const [searchName, setSearchName] = useState("")
    const [searchDate, setSearchDate] = useState("")
    const [searchAuthor, setSearchAuthor] = useState("")
    const [totalAmount, setTotalAmount] = useState(0)
    const [editedCriteria, setEditedCriteria] = useState([])

    const [generating, setGenerating] = useState(false)
    const [doneGenerating, setDoneGenerating] = useState(false)
    const [showingDownloadOptions, setShowingDownloadingOptions] = useState(false);
    const [reportContent, setReportContent] = useState(false)
    const [reportType, setReportType] = useState("pdf");
    
    const [page, setPage] = useState(0)
    const [pages, setPages] = useState(1)

    const pdfContent = useRef()

    const CourseCriteria = (criteriaData) => {
        if (editing) {
            let myBC = [...criteria]
            let myself = myBC[myBC.findIndex((c) => c.id == criteriaData.id)]
            function markEdited () {
                if (!editedCriteria.includes(criteriaData.id)) {
                    setEditedCriteria([
                        ...editedCriteria,
                        criteriaData.id
                    ])
                }
            }
            return (
                <div key={criteriaData.id} className="criteria-item editing" id={criteriaData.id}>
                    <div className="criteria-head">
                        <div className="criteria-title-section">
                            <input
                                className="editing-criteria-title"
                                value={criteriaData.title}
                                onChange={(e) => {
                                    markEdited()
                                    myself.title = e.target.value
                                    setCriteria(myBC)
                                }}
                                placeholder="Nombre del criterio"
                            />
                        </div>
                        
                        {criteriaData.has_value && (
                            <div className="criteria-values-section">
                                <div className="value-input-group">
                                    <span className="value-label">Actual</span>
                                    <input 
                                        className="value-input"
                                        value={criteriaData.value || 0}
                                        type="number"
                                        disabled
                                    />
                                </div>
                                <span className="value-separator">/</span>
                                <div className="value-input-group">
                                    <span className="value-label">Requerido</span>
                                    <input
                                        className="value-input"
                                        value={criteriaData.min}
                                        type="number"
                                        onChange={(e) => {
                                            markEdited()
                                            myself.min = e.target.value
                                            setCriteria(myBC)
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                        
                        <div className="bias-section">
                            <span className="bias-label">Ponderación</span>
                            <div className="bias-input-group">
                                <input
                                    className="bias-input"
                                    type="number"
                                    value={criteriaData.weight}
                                    onChange={(e) => {
                                        markEdited()
                                        myself.weight = e.target.value
                                        setCriteria(myBC)
                                    }}
                                    min="0"
                                    max="100"
                                />
                                <span className="percent-symbol">%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="criteria-body">
                        <textarea
                            className="editing-criteria-description"
                            value={criteriaData.description}
                            onChange={(e) => {
                                markEdited()
                                myself.description = e.target.value
                                setCriteria(myBC)
                            }}
                            placeholder="Descripción del criterio..."
                            rows="3"
                        />
                    </div>
                </div>
            )
        }
        
        return (
            <div className="criteria-item" id={criteriaData.id}>
                <div className="criteria-head">
                    <div className="criteria-title">
                        <FontAwesomeIcon icon={faClipboardCheck} className="criteria-icon" />
                        <h3>{criteriaData.title}</h3>
                    </div>
                    {criteriaData.has_value && (
                        <div className="criteria-values">
                            <span className="value-display">
                                {criteriaData.value ?? 0}<span className="value-divider">/</span>{criteriaData.min}
                            </span>
                            <span className="value-label">Progreso</span>
                        </div>
                    )}
                    <div className="criteria-weight">
                        <span className="weight-value">{criteriaData.weight}%</span>
                        <span className="weight-label">Ponderación</span>
                    </div>
                </div>
                
                <div className="criteria-body">
                    <p className="criteria-description">
                        {criteriaData.description}
                    </p>
                    
                    <div className="criteria-meta">
                        <div className="meta-item">
                            <FontAwesomeIcon icon={faUser} className="meta-icon" />
                            <span className="meta-text">Creado por {criteriaData.author}</span>
                        </div>
                        <div className="meta-item">
                            <FontAwesomeIcon icon={faCalendarAlt} className="meta-icon" />
                            <span className="meta-text">{criteriaData.creation.date} a las {criteriaData.creation.hour}</span>
                        </div>
                        
                        {criteriaData.last_edit && (
                            <>
                                <div className="meta-item">
                                    <FontAwesomeIcon icon={faUser} className="meta-icon" />
                                    <span className="meta-text">Editado por {criteriaData.last_edit.author}</span>
                                </div>
                                <div className="meta-item">
                                    <FontAwesomeIcon icon={faCalendarAlt} className="meta-icon" />
                                    <span className="meta-text">{criteriaData.last_edit.date} a las {criteriaData.last_edit.hour}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    async function saveChanges () {
        for (let criteriaID of editedCriteria) {
            try {
                let response = await axiosInstance.put(`/api/certification/update/${criteriaID}`, {
                    ...criteria.find((c) => c.id == criteriaID),
                    course: id
                })
                if (response.status != 200 && response.status != 304) {
                    throw response.data
                }
            } catch (error) {
                // console.error(error)
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Ocurrió un error al actualizar los criterios',
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#d33',
                    theme: "bulma",
                    customClass: {
                        confirmButton: 'centered-swal-button'
                    }
                }); return;
            }
        }

        await Swal.fire({
            icon: 'success',
            title: 'Cambios guardados',
            text: 'Los criterios se han actualizado correctamente',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#00843d',
            theme: "bulma",
            customClass: {
                confirmButton: 'button is-primary',
                actions: 'swal2-actions-centered'
            }
        });

        setEditing(false)
        fetchCriteria()
    }

    async function filter () {
        try {
            let response = await axiosInstance.get(`/api/certification/course/${id}?page=${page}${
                searchName.length > 0 ? `&name=${searchName}` : ""
            }${
                searchDate ? `&date=${(new Date(searchDate)).getTime()}` : ""
            }${
                searchAuthor.length > 0 ? `&author=${searchAuthor}` : ""
            }`)
            if (response.status != 200 && response.status != 304) {
                throw response.data
            }
            setCriteria(response.data.criteria)
            setCriteriaBackup(response.data.criteria)
            setPages(response.data.max_pages)
            setTotalAmount(response.data.total)
        } catch (e) {
            // console.log(e)
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Ocurrió un error al buscar los criterios',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#d33',
                theme: "bulma",
                customClass: {
                    confirmButton: 'centered-swal-button'
                }
            });
        }
    }

    async function fetchCriteria () {
        try {
            let response = await axiosInstance.get(`/api/certification/course/${id}?page=${page}`)
            if (response.status != 200 && response.status != 304) {
                throw response.data
            }
            setCriteria(response.data.criteria)
            setCriteriaBackup(response.data.criteria)
            setPages(response.data.max_pages)
            setTotalAmount(response.data.total)
            setLoading(false)
        } catch (e) {
            // console.log(e)
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Ocurrió un error al cargar los criterios',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#d33',
                theme: "bulma",
                customClass: {
                    confirmButton: 'centered-swal-button'
                }
            });
        }
    }

    async function fetchCourse() {
        try {
            const response = await axiosInstance.get(
                `api/courses/cursos/${id}`
            );
            setCurso(response.data);
        } catch (error) {
            // console.error("Error al obtener el curso:", error);
        }
    }

    const userSession = JSON.parse(localStorage.getItem("userSession")) || JSON.parse(sessionStorage.getItem("userSession"))
    const isLoggedIn = !!userSession
    const accountType = userSession?.accountType || null

    useEffect(() => {
        if (isLoggedIn && (accountType === "Instructor" || accountType == "Administrador" || accountType === "Gestor")) {
            fetchCriteria()
            fetchCourse()
        } else {
            navigate("/no-autorizado");
        }
    }, [id])

    useEffect(() => {
        setLoading(true)
        if (isLoggedIn && (accountType === "Instructor" || accountType == "Administrador" || accountType === "Gestor")) {
            fetchCriteria(page)
        } else {
            navigate("/no-autorizado");
        }
    }, [page])

    const generarReporte = async () => {
        try {
            if (reportType === "pdf") {
                if (!pdfContent.current)
                    return
                const worker = html2pdf().set({
                    margin: 10,
                    filename: "reporte_cursos.pdf",
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
                }).from(pdfContent.current)
                setGenerating(false)
                setDoneGenerating(true)
                setReportContent(await worker.output("bloburl"))
            }
        } catch (error) {
            // console.log(error)
            Swal.fire({
                icon:"error",
                title:"Error en reporte",
                text:"Ocurrió un error al generar el reporte",
                theme:"bulma",
                customClass:{
                    confirmButton: 'button is-primary',
                    actions: 'swal2-actions-centered'
                }
            })
            setDoneGenerating(false)
            setGenerating(false)
        }
    }

    const resetFilters = () => {
        setSearchName("")
        setSearchDate("")
        setSearchAuthor("")
        fetchCriteria()
    }

    return (
        <>
            <Header/>
            <Main>
                <div className="see-criteria-container">
                    <GoBackArrow/>
                    
                    <div className="criteria-header">
                        <h1>
                            <FontAwesomeIcon icon={faClipboardCheck} className="header-icon" />
                            Criterios de <span className="highlight">Certificación</span>
                        </h1>
                        <p className="subtitle">Gestión y visualización de criterios del curso</p>
                    </div>

                    <div className="criteria-actions">
                        <div className="actions-left">
                            {editing ? (
                                <>
                                    <button
                                        className="btn-secondary"
                                        onClick={() => {
                                            setEditing(false)
                                            setCriteria(criteriaBackup)
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                        <span>Cancelar</span>
                                    </button>
                                    <button
                                        className="btn-primary"
                                        onClick={() => saveChanges()}
                                    >
                                        <FontAwesomeIcon icon={faSave} />
                                        <span>Guardar Cambios</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        className="btn-primary"
                                        onClick={() => navigate(`/Gestiones/Criterios/Crear/${id}`)}
                                    >
                                        <FontAwesomeIcon icon={faPlus} />
                                        <span>Nuevo Criterio</span>
                                    </button>
                                    <button
                                        className="btn-secondary"
                                        onClick={() => setEditing(true)}
                                    >
                                        <FontAwesomeIcon icon={faEdit} />
                                        <span>Modo Edición</span>
                                    </button>
                                </>
                            )}
                        </div>

                        <div className="actions-right">
                            <button
                                className={`filter-toggle ${filtering ? 'active' : ''}`}
                                onClick={() => setFiltering(!filtering)}
                            >
                                <FontAwesomeIcon icon={faFilter} />
                                <span>Filtrar</span>
                                <FontAwesomeIcon icon={filtering ? faChevronUp : faChevronDown} className="chevron-icon" />
                            </button>
                            
                            <button
                                className="btn-secondary"
                                onClick={() => setShowingDownloadingOptions(true)}
                            >
                                <FontAwesomeIcon icon={faDownload} />
                                <span>Reporte</span>
                            </button>
                        </div>
                    </div>

                    {/* Panel de Filtros - Mejorado */}
                    {filtering && (
                        <div className="filters-panel">
                            <div className="filters-header">
                                <h3>
                                    <FontAwesomeIcon icon={faFilter} />
                                    Filtros de Búsqueda
                                </h3>
                                <button
                                    className="btn-clear-filters"
                                    onClick={resetFilters}
                                >
                                    Limpiar Filtros
                                </button>
                            </div>
                            
                            <div className="filters-grid">
                                <div className="filter-group">
                                    <label className="filter-label">
                                        <FontAwesomeIcon icon={faFileAlt} />
                                        Nombre del criterio
                                    </label>
                                    <div className="filter-input-group">
                                        <FontAwesomeIcon icon={faSearch} className="input-icon" />
                                        <input
                                            type="text"
                                            className="filter-input"
                                            placeholder="Buscar por nombre..."
                                            value={searchName}
                                            onChange={(e) => setSearchName(e.target.value)}
                                        />
                                    </div>
                                </div>
                                
                                <div className="filter-group">
                                    <label className="filter-label">
                                        <FontAwesomeIcon icon={faCalendarAlt} />
                                        Fecha de registro
                                    </label>
                                    <div className="filter-input-group">
                                        <FontAwesomeIcon icon={faCalendarAlt} className="input-icon" />
                                        <input
                                            type="date"
                                            className="filter-input"
                                            value={searchDate}
                                            onChange={(e) => setSearchDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                                
                                <div className="filter-group">
                                    <label className="filter-label">
                                        <FontAwesomeIcon icon={faUser} />
                                        Autor
                                    </label>
                                    <div className="filter-input-group">
                                        <FontAwesomeIcon icon={faUser} className="input-icon" />
                                        <input
                                            type="text"
                                            className="filter-input"
                                            placeholder="Buscar por autor..."
                                            value={searchAuthor}
                                            onChange={(e) => setSearchAuthor(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="filters-actions">
                                <button
                                    className="btn-secondary"
                                    onClick={() => setFiltering(false)}
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                    <span>Cerrar</span>
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={filter}
                                >
                                    <FontAwesomeIcon icon={faSearch} />
                                    <span>Aplicar Filtros</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Lista de Criterios */}
                    <div className="criteria-list-container">
                        {loading ? (
                            <div className="loading-state">
                                <div className="loading-spinner"></div>
                                <p>Cargando criterios...</p>
                            </div>
                        ) : criteria.length > 0 ? (
                            <>
                                <div className="criteria-stats">
                                    <span className="stats-item">
                                        <strong>{totalAmount}</strong> criterios totales
                                    </span>
                                    <span className="stats-item">
                                        Página <strong>{page + 1}</strong> de <strong>{pages}</strong>
                                    </span>
                                </div>
                                
                                <div className="criteria-grid">
                                    {criteria.map((c) => CourseCriteria(c))}
                                </div>
                                
                                <PageMover
                                    value={page + 1}
                                    max={pages}
                                    next={() => setPage(page + 1)}
                                    prev={() => setPage(page - 1)}
                                />
                            </>
                        ) : (
                            <div className="empty-state">
                                <FontAwesomeIcon icon={faClipboardCheck} className="empty-icon" />
                                <h3>No hay criterios disponibles</h3>
                                <p>Comienza creando tu primer criterio de certificación</p>
                                <button
                                    className="btn-primary"
                                    onClick={() => navigate(`/Gestiones/Criterios/Crear/${id}`)}
                                >
                                    <FontAwesomeIcon icon={faPlus} />
                                    <span>Crear Primer Criterio</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Modal de Descarga de Reportes */}
                    {showingDownloadOptions && (
                        <div className="modal-overlay">
                            <div className="modal-container">
                                <div className="modal-header">
                                    <h2>
                                        <FontAwesomeIcon icon={faDownload} />
                                        Generar Reporte
                                    </h2>
                                    <button
                                        className="modal-close-btn"
                                        onClick={() => setShowingDownloadingOptions(false)}
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                </div>
                                
                                <div className="modal-body">
                                    <div className="report-type-selector">
                                        <h3>Selecciona el tipo de reporte</h3>
                                        
                                        <div className="type-options">
                                            <button
                                                className={`type-option ${reportType === "pdf" ? 'selected' : ''}`}
                                                onClick={() => setReportType("pdf")}
                                            >
                                                <FontAwesomeIcon icon={faFilePdf} className="type-icon" />
                                                <div className="type-info">
                                                    <h4>PDF</h4>
                                                    <p>Documento optimizado para impresión</p>
                                                </div>
                                            </button>
                                            
                                            <button
                                                className={`type-option ${reportType === "excel" ? 'selected' : ''}`}
                                                onClick={() => setReportType("excel")}
                                            >
                                                <FontAwesomeIcon icon={faFileExcel} className="type-icon" />
                                                <div className="type-info">
                                                    <h4>Excel</h4>
                                                    <p>Hoja de cálculo con datos tabulados</p>
                                                </div>
                                            </button>
                                        </div>
                                        
                                        {reportType === "excel" ? (
                                            <div className="report-actions">
                                                <button
                                                    className="btn-primary"
                                                    onClick={() => {
                                                        generarExcelCriterios(id, curso)
                                                        setShowingDownloadingOptions(false)
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faDownload} />
                                                    <span>Descargar Excel</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="report-actions">
                                                <button
                                                    className="btn-primary"
                                                    onClick={() => setGenerating(true)}
                                                >
                                                    <FontAwesomeIcon icon={faFilePdf} />
                                                    <span>Generar PDF</span>
                                                </button>
                                            </div>
                                        )}
                                        
                                        {generating && (
                                            <ReportCriteria
                                                contentKey={pdfContent}
                                                curso={curso}
                                                criterios={criteria}
                                                done={() => {
                                                    generarReporte()
                                                }}
                                            />
                                        )}
                                        
                                        {doneGenerating && (
                                            <div className="download-ready">
                                                <FontAwesomeIcon icon={faFilePdf} className="download-icon" />
                                                <h4>Reporte listo para descargar</h4>
                                                <a
                                                    className="btn-primary"
                                                    href={reportContent}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={() => setShowingDownloadingOptions(false)}
                                                >
                                                    <FontAwesomeIcon icon={faDownload} />
                                                    <span>Descargar PDF</span>
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Main>
        </>
    )
}