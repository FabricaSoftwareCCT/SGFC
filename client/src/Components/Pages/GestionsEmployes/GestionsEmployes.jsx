"use client"
import { useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import "./GestionsEmployes.css"
import { Header } from "../../Layouts/Header/Header"
import { Footer } from "../../../Components/Layouts/Footer/Footer"
import { Main } from "../../../Components/Layouts/Main/Main"
import { UpdateEmploye } from "./UpdateEmploye/UpdateEmploye"
import axiosInstance from "../../../config/axiosInstance"
import { useModal } from "../../../Context/ModalContext"
import { BulkUploadModal } from "./BulkUploadModal/BulkUploadModal"
import { InscribeEmployes } from "../GestionsEmployes/InscribeEmployes/InscribeEmployes"
import Swal from 'sweetalert2'
import 'sweetalert2/themes/bulma.css'
import { ReportEmployee } from "./ReportEmployee/ReportEmployee"
import { generarExcelEmpleado } from "../../../utils/Reports/Empleados"
import html2pdf from "html2pdf.js"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faUserPlus,
    faChartLine,
    faCheck,
    faUsers,
    faSearch,
    faFolderOpen,
    faIdCard,
    faPhone,
    faEnvelope,
    faBuilding,
    faFileAlt,
    faFilter,
    faDownload,
    faTimes,
    faFilePdf,
    faFileExcel,
    faArrowLeft,
    faSpinner,
    faChevronLeft,
    faChevronRight,
    faEye,
    faFileExport,
    faUpload,
    faFileArrowDown
} from '@fortawesome/free-solid-svg-icons'

export const GestionsEmployes = () => {
    const [employes, setEmployes] = useState([])
    const [filteredEmployes, setFilteredEmployes] = useState([])
    const [filter, setFilter] = useState("")
    const [selectedState, setSelectedState] = useState("todos")
    const [selectedEmploye, setSelectedEmploye] = useState(null)
    const [showUpdateModal, setShowUpdateModal] = useState(false)
    const [showBulkModal, setShowBulkModal] = useState(false)


    const [empresas, setEmpresas] = useState([])
    const [selectedEmpresa, setSelectedEmpresa] = useState("")
    const [selectedTipoDocumento, setSelectedTipoDocumento] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [loading, setLoading] = useState(false)
    const [showReportOptions, setShowReportOptions] = useState(false)
    const [reportType, setReportType] = useState("pdf")
    const [generating, setGenerating] = useState(false)
    const [doneGenerating, setDoneGenerating] = useState(false)
    const [showFilters, setShowFilters] = useState(false)
    const [filters, setFilters] = useState({
        personalData: true,
        presence: true,
        criteria: true
    })

    const pdfContent = useRef()
    const reportModalRef = useRef(null)

    const { setShowModalCreateEmployee } = useModal()
    const navigate = useNavigate()
    const userSession =
        JSON.parse(localStorage.getItem("userSession")) || JSON.parse(sessionStorage.getItem("userSession"))

    const isLoggedIn = !!userSession
    const accountType = userSession?.accountType || null
    const isAdmin = accountType === "Administrador" || accountType === "Gestor"

    const fetchEmployes = async (page = 1) => {
        setLoading(true)
        try {
            if (isAdmin) {
                const params = new URLSearchParams({
                    page: page.toString(),
                    limit: "10",
                    search: filter,
                    empresaId: selectedEmpresa,
                    estado: selectedState === "todos" ? "" : selectedState,
                    tipoDocumento: selectedTipoDocumento,
                })

                const response = await axiosInstance.get(`/api/users/admin/empleados?${params}`)
                const data = response.data || {}
                const empleados = data.empleados || []
                setEmployes(empleados)
                setFilteredEmployes(empleados)
                setCurrentPage(data.pagination?.currentPage || 1)
                setTotalPages(data.pagination?.totalPages || 1)
                setTotalItems(data.pagination?.totalItems || 0)
            } else {
                const userSessionString = localStorage.getItem("userSession") || sessionStorage.getItem("userSession")
                if (!userSessionString) {
                    Swal.fire({
                        icon: "info",
                        title: "Error en el sistema",
                        text: "No se encontró la sesión de usuario.",
                        confirmButtonText: "Okay",
                        theme: "bulma",
                        customClass: { confirmButton: 'centered-swal-button' }
                    })
                    return
                }
                const userSession = JSON.parse(userSessionString)
                const empresaId = userSession.empresa_ID

                const response = await axiosInstance.get(`/api/users/empresa/${empresaId}/empleados`)
                const data = response.data || {}
                const empleados = data.empleados || []
                setEmployes(empleados)
                setFilteredEmployes(empleados)
                setCurrentPage(1)
                setTotalPages(1)
                setTotalItems(empleados.length)
            }
        } catch (error) {
            console.error("Error al obtener los empleados:", error)
            Swal.fire({
                icon: "error",
                title: "Error en el sistema",
                text: "Hubo un problema al cargar los empleados. Por favor, inténtalo más tarde.",
                confirmButtonText: "Okay",
                theme: "bulma",
                customClass: { confirmButton: 'centered-swal-button' }
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchEmpresas = async () => {
        if (!isAdmin) return

        try {
            const response = await axiosInstance.get("/api/users/admin/empresas")
            setEmpresas(response.data.empresas || [])
        } catch (error) {
            console.error("Error al obtener las empresas:", error)
        }
    }

    useEffect(() => {
        fetchEmployes()
        if (isAdmin) {
            fetchEmpresas()
        }

        window.refreshEmployesList = () => {
            if (isAdmin) {
                fetchEmployes(currentPage)
            } else {
                fetchEmployes()
            }
        }

        window.updateSelectedEmploye = (updatedEmploye) => {
            setSelectedEmploye(updatedEmploye)
        }

        return () => {
            delete window.refreshEmployesList
            delete window.updateSelectedEmploye
        }
    }, [])

    useEffect(() => {
        if (isAdmin) {
            fetchEmployes(1)
        } else {
            applyFilters()
        }
    }, [selectedState, filter, selectedEmpresa, selectedTipoDocumento])

    useEffect(() => {
        if (isAdmin) {
            const timeoutId = setTimeout(() => {
                fetchEmployes(1)
            }, 500)
            return () => clearTimeout(timeoutId)
        }
    }, [filter])

    const applyFilters = () => {
        const filtered = employes.filter(
            (employe) =>
                (employe.nombres || "").toLowerCase().includes(filter.toLowerCase()) ||
                (employe.apellidos || "").toLowerCase().includes(filter.toLowerCase()) ||
                (employe.documento || "").toLowerCase().includes(filter.toLowerCase()) ||
                (employe.email || "").toLowerCase().includes(filter.toLowerCase()),
        )

        const filteredByState = filtered.filter((employe) => {
            const estado = (employe.estado || "").toLowerCase()
            if (selectedState === "todos") return true
            return estado === selectedState
        })

        setFilteredEmployes(filteredByState)
        setTotalItems(filteredByState.length)
    }

    const handleFilterChange = (e) => {
        setFilter(e.target.value)
    }

    const handleEmpresaChange = (e) => {
        setSelectedEmpresa(e.target.value)
    }

    const handleTipoDocumentoChange = (e) => {
        setSelectedTipoDocumento(e.target.value)
    }

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchEmployes(newPage)
        }
    }

    const showModalCreateEmploye = () => {
        setShowModalCreateEmployee(true)
        setTimeout(() => {
            const modalCreateEmploye = document.getElementById("modal-overlayCreateEmploye")
            if (modalCreateEmploye) {
                modalCreateEmploye.style.display = "flex"
            }
        }, 100)
    }

    const showModalSeeProfile = (employe) => {
        setSelectedEmploye(employe)
        setShowUpdateModal(true)
    }

    const handleCloseUpdateModal = () => {
        setShowUpdateModal(false)
        setSelectedEmploye(null)
    }

    const handleInscribeEmployes = () => {
        navigate("/Empleados/InscribirEmpleados")
    }

    const getImageSrcFromBase64 = (imageData) => {
        if (!imageData) {
            return "/src/assets/Icons/userDefect.png"
        }

        if (typeof imageData === 'string') {
            if (imageData.startsWith("data:")) {
                return imageData
            }

            if (imageData.startsWith("iVBORw0KGgo") || imageData.startsWith("iVBOR")) {
                return `data:image/png;base64,${imageData}`
            }

            if (imageData.startsWith("/9j/")) {
                return `data:image/jpeg;base64,${imageData}`
            }

            if (imageData.length > 1000) {
                return `data:image/jpeg;base64,${imageData}`
            }

            const base64Regex = /^[A-Za-z0-9+/=]+$/
            if (imageData.length > 50 && base64Regex.test(imageData)) {
                return `data:image/jpeg;base64,${imageData}`
            }

            if (imageData.startsWith('../') || imageData.startsWith('/')) {
                if (imageData.startsWith('../Img/')) {
                    const newPath = imageData.replace('../Img/', '/src/assets/Icons/')
                    return newPath
                }
                return imageData
            }

            return "/src/assets/Icons/userDefect.png"
        }

        return "/src/assets/Icons/userDefect.png"
    }

    const generarReporte = async () => {
        try {
            if (reportType === "pdf") {
                if (!pdfContent.current) return
                const worker = html2pdf().set({
                    margin: 10,
                    filename: `reporte ${selectedEmploye.nombres} ${selectedEmploye.apellidos}.pdf`,
                    html2canvas: { scale: 1 },
                    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
                }).from(pdfContent.current)
                setGenerating(false)
                setDoneGenerating(true)

                // Descargar automáticamente
                const blob = await worker.output("blob")
                const blobUrl = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = blobUrl
                a.download = `reporte ${selectedEmploye.nombres} ${selectedEmploye.apellidos}.pdf`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)

                Swal.fire({
                    icon: 'success',
                    title: '¡Reporte generado!',
                    text: 'El PDF se ha descargado exitosamente',
                    confirmButtonText: 'Excelente',
                    confirmButtonColor: '#00843d',
                    theme: 'bulma'
                })
            }
        } catch (error) {
            console.log(error)
            Swal.fire({
                icon: "error",
                title: "Error al generar el reporte",
                text: "Ocurrió un error al generar el reporte, intentelo otra vez",
                confirmButtonText: "Okay",
                theme: "bulma",
                customClass: { confirmButton: 'centered-swal-button' }
            })
            setDoneGenerating(false)
            setGenerating(false)
        } finally {
            setShowReportOptions(false)
        }
    }

    const generarPdf = async () => {
        setGenerating(true)
    }

    const handleExcelDownload = () => {
        generarExcelEmpleado(selectedEmploye, () => {
            setShowReportOptions(false)
            Swal.fire({
                icon: 'success',
                title: '¡Reporte generado!',
                text: 'El Excel se ha descargado exitosamente',
                confirmButtonText: 'Excelente',
                confirmButtonColor: '#00843d',
                theme: 'bulma'
            })
        }, filters)
    }

    // Cerrar modal al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(event) {
            if (showReportOptions && reportModalRef.current && !reportModalRef.current.contains(event.target)) {
                setShowReportOptions(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showReportOptions])

    // Calcular empleados por página para no-admin
    const getCurrentPosts = () => {
        if (!isAdmin) {
            const postsPerPage = 10
            const indexOfLastPost = currentPage * postsPerPage
            const indexOfFirstPost = indexOfLastPost - postsPerPage
            return filteredEmployes.slice(indexOfFirstPost, indexOfLastPost)
        }
        return filteredEmployes
    }

    // Calcular total de páginas para no-admin
    useEffect(() => {
        if (!isAdmin) {
            const postsPerPage = 10
            const total = Math.ceil(filteredEmployes.length / postsPerPage)
            setTotalPages(total)
        }
    }, [filteredEmployes, isAdmin])

    const showModalBulkUpload = () => {
        setShowBulkModal(true)
    }

    return (
        <>
            <Header />
            <Main>
                <div className="gestion-employees-container">
                    <div className="employees-header-improved">
                        <div className="header-content-improved">
                            <h1>
                                {isAdmin ? "Gestión de " : "Mis "}
                                <span className="complementary">Empleados</span>
                            </h1>
                            <div className="header-stats-improved">
                                <div className="stat-card-header">
                                    <div className="stat-icon">
                                        <FontAwesomeIcon icon={faUsers} />
                                    </div>
                                    <div className="stat-content">
                                        <span className="stat-value">{isAdmin ? totalItems : employes.length}</span>
                                        <span className="stat-label">Total Empleados</span>
                                    </div>
                                </div>
                                <div className="stat-card-header">
                                    <div className="stat-icon">
                                        <FontAwesomeIcon icon={faCheck} />
                                    </div>
                                    <div className="stat-content">
                                        <span className="stat-value">
                                            {employes.filter(e => e.estado?.toLowerCase() === 'activo').length}
                                        </span>
                                        <span className="stat-label">Activos</span>
                                    </div>
                                </div>
                                <div className="stat-card-header">
                                    <div className="stat-icon">
                                        <FontAwesomeIcon icon={faBuilding} />
                                    </div>
                                    <div className="stat-content">
                                        <span className="stat-value">
                                            {isAdmin ? new Set(employes.map(e => e.empresa_ID)).size : 1}
                                        </span>
                                        <span className="stat-label">Empresas</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="main-content-improved">
                        <div className="main-employees-section">
                            {loading ? (
                                <div className="loading-state-improved">
                                    <div className="loading-spinner-improved"></div>
                                    <p>Cargando empleados...</p>
                                </div>
                            ) : (
                                <div className="admin-results-improved">
                                    <div className="results-header-improved">
                                        <h3>{isAdmin ? "Lista de Empleados" : "Mis Empleados"}</h3>
                                        <span className="results-count">{totalItems} resultados</span>
                                    </div>

                                    {filteredEmployes.length === 0 ? (
                                        <div className="no-results-improved">
                                            <div className="no-results-icon">
                                                <FontAwesomeIcon icon={faFolderOpen} />
                                            </div>
                                            <h3>No se encontraron empleados</h3>
                                            <p>No hay empleados disponibles con los filtros seleccionados</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="employees-grid-improved">
                                                {getCurrentPosts().map((employe) => (
                                                    <div key={employe.ID} className="employee-card-improved">
                                                        <div className="employee-image-section-improved">
                                                            <img
                                                                src={getImageSrcFromBase64(employe?.foto_perfil)}
                                                                alt={`${employe.nombres || 'Sin nombre'} ${employe.apellidos || 'Sin apellido'}`}
                                                                className="employee-image-improved"
                                                                onError={(e) => {
                                                                    e.target.src = "/src/assets/Icons/userDefect.png"
                                                                }}
                                                            />
                                                            <div className={`status-badge-improved ${employe.estado?.toLowerCase() || 'inactivo'}`}>
                                                                {employe.estado || 'Inactivo'}
                                                            </div>
                                                        </div>

                                                        <div className="employee-info-improved">
                                                            <h4>{employe.nombres || "Sin nombre"} {employe.apellidos || "Sin apellido"}</h4>
                                                            <div className="employee-details-improved">
                                                                <div className="detail-item">
                                                                    <FontAwesomeIcon icon={faIdCard} />
                                                                    <span>{employe.documento || "N/A"}</span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <FontAwesomeIcon icon={faEnvelope} />
                                                                    <span>{employe.email || "N/A"}</span>
                                                                </div>
                                                                {isAdmin && (
                                                                    <div className="detail-item">
                                                                        <FontAwesomeIcon icon={faBuilding} />
                                                                        <span>{employe.Empresa?.nombre_empresa || "Sin empresa"}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="employee-actions-improved">
                                                            <button
                                                                className="profile-btn-improved"
                                                                onClick={() => showModalSeeProfile(employe)}
                                                            >
                                                                <FontAwesomeIcon icon={faEye} />
                                                                <span>Ver Perfil</span>
                                                            </button>
                                                            {(accountType === "Empresa" || accountType === "Instructor") && (
                                                                <button
                                                                    className="report-btn-improved"
                                                                    onClick={() => {
                                                                        setSelectedEmploye(employe)
                                                                        setShowReportOptions(true)
                                                                    }}
                                                                >
                                                                    <FontAwesomeIcon icon={faFileExport} />
                                                                    <span>Reporte</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {totalPages > 1 && (
                                                <div className="pagination-improved">
                                                    <button
                                                        className="pagination-btn"
                                                        disabled={currentPage === 1}
                                                        onClick={() => handlePageChange(currentPage - 1)}
                                                    >
                                                        <FontAwesomeIcon icon={faChevronLeft} />
                                                        <span>Anterior</span>
                                                    </button>
                                                    <span className="pagination-info">
                                                        Página {currentPage} de {totalPages}
                                                    </span>
                                                    <button
                                                        className="pagination-btn"
                                                        disabled={currentPage === totalPages}
                                                        onClick={() => handlePageChange(currentPage + 1)}
                                                    >
                                                        <span>Siguiente</span>
                                                        <FontAwesomeIcon icon={faChevronRight} />
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="control-panel-improved">
                            <div className="filters-card-improved">
                                <h3>
                                    <FontAwesomeIcon icon={faFilter} />
                                    <span>Filtros y Búsqueda</span>
                                </h3>

                                <div className="search-container-improved">
                                    <div className="input-search-improved">
                                        <FontAwesomeIcon icon={faSearch} className="search-icon" />
                                        <input
                                            type="text"
                                            placeholder="Buscar empleado..."
                                            value={filter}
                                            onChange={handleFilterChange}
                                            className="search-input"
                                        />
                                    </div>
                                </div>

                                {isAdmin && (
                                    <>
                                        <div className="filter-group">
                                            <label>Empresa</label>
                                            <select
                                                value={selectedEmpresa}
                                                onChange={handleEmpresaChange}
                                                className="filter-select-improved"
                                            >
                                                <option value="">Todas las empresas</option>
                                                {empresas.map((empresa) => (
                                                    <option key={empresa.ID} value={empresa.ID}>
                                                        {empresa.nombre_empresa}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="filter-group">
                                            <label>Tipo de Documento</label>
                                            <select
                                                value={selectedTipoDocumento}
                                                onChange={handleTipoDocumentoChange}
                                                className="filter-select-improved"
                                            >
                                                <option value="">Todos los tipos</option>
                                                <option value="CedulaCiudadania">Cédula de Ciudadanía</option>
                                                <option value="TarjetaIdentidad">Tarjeta de Identidad</option>
                                                <option value="PPT">Pasaporte</option>
                                                <option value="CedulaExtranjeria">Cédula de Extranjería</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                <div className="filter-group">
                                    <label>Estado del Empleado</label>
                                    <div className="status-filters-improved">
                                        {["todos", "activo", "inactivo"].map((op) => (
                                            <button
                                                key={op}
                                                className={`status-filter-btn ${selectedState === op ? 'active' : ''}`}
                                                onClick={() => setSelectedState(op)}
                                            >
                                                <span className={`status-indicator ${op}`}></span>
                                                {op === 'todos' ? 'Todos' : op === 'activo' ? 'Activos' : 'Inactivos'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button className="create-employee-btn-improved" onClick={showModalCreateEmploye}>
                                    <FontAwesomeIcon icon={faUserPlus} />
                                    <span>Agregar Empleado</span>
                                </button>

                                <button className="bulk-upload-btn-improved" onClick={showModalBulkUpload}>
                                    <FontAwesomeIcon icon={faFileExcel} />
                                    <span>Carga Masiva</span>
                                </button>

                                <button className="inscribe-employees-btn-improved" onClick={handleInscribeEmployes}>
                                    <FontAwesomeIcon icon={faUsers} />
                                    <span>Inscribir a Cursos</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Main>

            {showUpdateModal && selectedEmploye && (
                <UpdateEmploye
                    empleado={selectedEmploye}
                    onClose={handleCloseUpdateModal}
                />
            )}

            {showReportOptions && selectedEmploye && (
                <div className="report-modal-overlay">
                    <div className="report-modal" ref={reportModalRef}>
                        <div className="report-modal-header">
                            <div className="modal-header-content">
                                <FontAwesomeIcon icon={faFileAlt} className="modal-header-icon" />
                                <div>
                                    <h2 className="modal-title">Generar Reporte</h2>
                                    <p className="modal-subtitle">Selecciona el formato del reporte</p>
                                </div>
                            </div>
                            <button
                                className="report-modal-close"
                                onClick={() => setShowReportOptions(false)}
                                disabled={generating}
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        <div className="report-modal-content">
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

                            <div className="filter-section">
                                <button
                                    className="filter-toggle-btn"
                                    onClick={() => setShowFilters(!showFilters)}
                                >
                                    <FontAwesomeIcon icon={faFilter} />
                                    <span>Filtros {!showFilters ? <>&#x25BC;</> : <>&#x25B2;</>}</span>
                                </button>

                                {showFilters && (
                                    <div className="filter-options-list">
                                        <div className="filter-option-item">
                                            <input
                                                type="checkbox"
                                                className="filter-checkbox"
                                                checked={filters.personalData}
                                                onChange={() => setFilters({ ...filters, personalData: !filters.personalData })}
                                            />
                                            <label>Incluir datos personales</label>
                                        </div>
                                        <div className="filter-option-item">
                                            <input
                                                type="checkbox"
                                                className="filter-checkbox"
                                                checked={filters.presence}
                                                onChange={() => setFilters({ ...filters, presence: !filters.presence })}
                                            />
                                            <label>Incluir asistencias</label>
                                        </div>
                                        <div className="filter-option-item">
                                            <input
                                                type="checkbox"
                                                className="filter-checkbox"
                                                checked={filters.criteria}
                                                onChange={() => setFilters({ ...filters, criteria: !filters.criteria })}
                                            />
                                            <label>Incluir criterios de certificación</label>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="modal-actions">
                                <button
                                    className="modal-btn secondary"
                                    onClick={() => setShowReportOptions(false)}
                                    disabled={generating}
                                >
                                    <FontAwesomeIcon icon={faArrowLeft} />
                                    <span>Cancelar</span>
                                </button>

                                <button
                                    className="modal-btn primary"
                                    onClick={() => {
                                        if (reportType === "excel") {
                                            handleExcelDownload()
                                        } else {
                                            generarPdf()
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
                                    <ReportEmployee
                                        contentKey={pdfContent}
                                        empleado={selectedEmploye}
                                        done={() => generarReporte()}
                                        filters={filters}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {showBulkModal && (
                <BulkUploadModal
                    isOpen={showBulkModal}
                    onClose={() => setShowBulkModal(false)}
                    empresaId={userSession?.empresa_ID}
                />
            )}
            <Footer />
        </>
    )
}