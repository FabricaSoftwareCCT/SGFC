import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "./InscribeEmployes.css"
import { Header } from "../../../../Components/Layouts/Header/Header"
import { Footer } from "../../../../Components/Layouts/Footer/Footer"
import { Main } from "../../../../Components/Layouts/Main/Main"
import { Modal_Inscripcion } from "../../../UI/Modal_Inscripcion/Modal_Inscripcion"
import axiosInstance from "../../../../config/axiosInstance"
import Swal from 'sweetalert2'
import 'sweetalert2/themes/bulma.css'
import { Modal_Empresa } from "../../../UI/Modal_Empresa/Modal_Empresa"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faUser,
    faUsers,
    faIdCard,
    faEnvelope,
    faCheckCircle,
    faTimesCircle,
    faChevronLeft,
    faChevronRight,
    faBuilding,
    faBookOpen,
    faCalendarAlt,
    faFilter,
    faSearch,
    faCheckSquare,
    faSquare,
    faArrowRight
} from '@fortawesome/free-solid-svg-icons'

export const InscribeEmployes = () => {
    const [selectedEmployees, setSelectedEmployees] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const [employeesPerPage] = useState(6) 
    const [showInscripcionModal, setShowInscripcionModal] = useState(false)
    const [showEmpresaModal, setShowEmpresaModal] = useState(false)
    const [selectedCourse, setSelectedCourse] = useState(null)
    const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null)
    const [employes, setEmployes] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterStatus, setFilterStatus] = useState("all")
    
    const navigate = useNavigate()
    const userSessionString = localStorage.getItem("userSession") || sessionStorage.getItem("userSession")

    // Función para abrir modal de inscripción
    const handleOpenInscripcionModal = () => {
        if (selectedEmployees.length === 0) {
            Swal.fire({
                icon: "info",
                title: "Selecciona empleados",
                text: "Debes seleccionar al menos un empleado para inscribir",
                confirmButtonText: "Aceptar",
                theme: "bulma",
                customClass: {
                    confirmButton: 'ie-button-primary',
                    popup: 'ie-swal-popup'
                }
            })
            return
        }
        setShowInscripcionModal(true)
    }

    // Función para cerrar modal de inscripción
    const handleCloseInscripcionModal = () => {
        setShowInscripcionModal(false)
    }

    // Función para manejar empresa seleccionada
    const handleEmpresaSeleccionada = (empresa) => {
        setEmpresaSeleccionada(empresa)
        setShowEmpresaModal(false)
        
        if (empresa && (empresa.ID || empresa.id)) {
            fetchEmpleadosByEmpresa(empresa.ID || empresa.id)
        }
    }

    // Función para manejar cursos seleccionados
    const handleCursosSeleccionados = (cursos) => {
        if (cursos && cursos.length > 0) {
            const curso = cursos[0]
            setSelectedCourse(curso)
            setShowInscripcionModal(false)
            handleInscripcion(curso)
        }
    }

    // Función para manejar la inscripción al backend
    const handleInscripcion = async (curso) => {
        if (!curso || selectedEmployees.length === 0) {
            Swal.fire({
                icon: "info",
                title: "Datos incompletos",
                text: "No hay curso seleccionado o empleados seleccionados",
                confirmButtonText: "Aceptar",
                theme: "bulma",
                customClass: {
                    confirmButton: 'ie-button-primary',
                    popup: 'ie-swal-popup'
                }
            })
            return
        }

        try {
            const curso_ID = curso.ID || curso.id
            const empleados = selectedEmployees.map(id => ({ ID: id }))

            const response = await axiosInstance.post("/api/courses/inscripcionEmpleados", {
                empleados,
                curso_ID
            })

            // Verificar si hay empleados que no se pudieron inscribir
            if (response.data.noInscritos && response.data.noInscritos.length > 0) {
                const hayConflictos = response.data.noInscritos.some(emp => emp.verificar === true)
                
                if (hayConflictos) {
                    const empleadosConConflictos = response.data.noInscritos
                        .filter(emp => emp.verificar === true)
                        .map(emp => `${emp.nombre || ''} ${emp.apellidos || ''}`.trim())
                        .filter(nombre => nombre !== '')

                    if (empleadosConConflictos.length > 0) {
                        const mensaje = `Se inscribieron los empleados, sin embargo los siguientes empleados tienen cursos con los mismos horarios de formación y no se pudieron inscribir:\n\n${empleadosConConflictos.join('\n')}`
                        
                        Swal.fire({
                            icon: "info",
                            title: "Conflictos de horario",
                            text: mensaje,
                            confirmButtonText: "Aceptar",
                            theme: "bulma",
                            customClass: {
                                confirmButton: 'ie-button-primary',
                                popup: 'ie-swal-popup'
                            }
                        })
                    }
                }
            }

            // Mostrar éxito
            await Swal.fire({
                icon: 'success',
                title: 'Inscripción exitosa',
                html: `
                    <div class="ie-success-message">
                        <div class="ie-success-icon">✓</div>
                        <h3>${selectedEmployees.length} empleado(s) inscrito(s)</h3>
                        <p>Curso: <strong>${curso.nombre_curso}</strong></p>
                        ${curso.cupos_disponibles ? `<p>Cupos restantes: ${curso.cupos_disponibles}</p>` : ''}
                    </div>
                `,
                confirmButtonText: 'Continuar',
                theme: "bulma",
                customClass: {
                    confirmButton: 'ie-button-primary',
                    popup: 'ie-swal-popup'
                }
            })

            // Limpiar selecciones
            setSelectedEmployees([])
            setSelectedCourse(null)
            setSearchTerm("")

        } catch (error) {
            // console.error("Error al realizar la inscripción:", error)
            
            let errorMessage = "Hubo un error al realizar la inscripción"
            if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message
            }
            
            Swal.fire({
                icon: "error",
                title: "Error en el sistema",
                text: errorMessage,
                confirmButtonText: 'Aceptar',
                theme: "bulma",
                customClass: {
                    confirmButton: 'ie-button-primary',
                    popup: 'ie-swal-popup'
                }
            })
        }
    }

    // Función para cargar empleados por empresa
    const fetchEmpleadosByEmpresa = async (empresaId) => {
        setLoading(true)
        try {
            const response = await axiosInstance.get(`/api/users/empresa/${empresaId}/empleados`)
            const data = response.data || {}
            const empleados = data.empleados || []
            setEmployes(empleados)
        } catch (error) {
            // console.error("Error al cargar empleados de la empresa:", error)
            Swal.fire({
                icon: "error",
                title: "Error al cargar empleados",
                text: "No se logró cargar los empleados de la empresa seleccionada",
                confirmButtonText: "Aceptar",
                theme: "bulma",
                customClass: {
                    confirmButton: 'ie-button-primary',
                    popup: 'ie-swal-popup'
                }
            })
            setEmployes([])
        } finally {
            setLoading(false)
        }
    }

    // Función para cargar empleados
    const fetchEmpleados = async () => {
        setLoading(true)
        try {
            const userSession = JSON.parse(userSessionString)
            
            // Si es Gestor o Administrador, abrir modal de empresa
            if (userSession.accountType === "Gestor" || userSession.accountType === "Administrador") {
                setShowEmpresaModal(true)
                setLoading(false)
                return
            }
            
            // Para otros tipos de usuario
            const empresaId = userSession.empresa_ID
            await fetchEmpleadosByEmpresa(empresaId)
            
        } catch (error) {
            // console.error(error)
            Swal.fire({
                icon: "error",
                title: "Error al cargar empleados",
                text: "No se logró cargar la lista de empleados del sistema",
                confirmButtonText: 'Aceptar',
                theme: "bulma",
                customClass: {
                    confirmButton: 'ie-button-primary',
                    popup: 'ie-swal-popup'
                }
            })
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchEmpleados()
    }, [])

    // Filtrar empleados
    const filteredEmployees = employes.filter(emp => {
        const matchesSearch = searchTerm === "" || 
            emp.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.documento?.includes(searchTerm) ||
            emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
        
        const matchesStatus = filterStatus === "all" || 
            emp.estado?.toLowerCase() === filterStatus.toLowerCase()
        
        return matchesSearch && matchesStatus
    })

    // Calcular empleados para la página actual
    const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage)
    const indexOfLastEmployee = currentPage * employeesPerPage
    const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage
    const currentEmployees = filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee)

    // Funciones de paginación
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    // Funciones de selección
    const handleEmployeeSelection = (employeeId) => {
        setSelectedEmployees(prev => {
            if (prev.includes(employeeId)) {
                return prev.filter(id => id !== employeeId)
            } else {
                return [...prev, employeeId]
            }
        })
    }

    const handleSelectAllCurrentPage = () => {
        const currentPageEmployeeIds = currentEmployees.map(emp => emp.ID)
        const allCurrentSelected = currentPageEmployeeIds.every(id => 
            selectedEmployees.includes(id)
        )

        if (allCurrentSelected) {
            setSelectedEmployees(prev => 
                prev.filter(id => !currentPageEmployeeIds.includes(id))
            )
        } else {
            setSelectedEmployees(prev => {
                const newSelection = [...prev]
                currentPageEmployeeIds.forEach(id => {
                    if (!newSelection.includes(id)) {
                        newSelection.push(id)
                    }
                })
                return newSelection
            })
        }
    }

    const handleSelectAll = () => {
        if (selectedEmployees.length === filteredEmployees.length) {
            setSelectedEmployees([])
        } else {
            setSelectedEmployees(filteredEmployees.map(emp => emp.ID))
        }
    }

    const getImageSrcFromBase64 = (imageData) => {
        if (!imageData) {
            return "/src/assets/Icons/userDefect.png"
        }
        
        if (imageData.startsWith('data:') || imageData.startsWith('http')) {
            return imageData
        }
        
        if (imageData.startsWith('iVBOR')) {
            return `data:image/png;base64,${imageData}`
        }
        
        if (imageData.startsWith('/9j/')) {
            return `data:image/jpeg;base64,${imageData}`
        }
        
        return "/src/assets/Icons/userDefect.png"
    }

    // Información del usuario
    const userSession = JSON.parse(userSessionString)
    const isGestorOrAdmin = userSession.accountType === "Gestor" || userSession.accountType === "Administrador"
    const isCourseButtonDisabled = selectedEmployees.length <= 0 || (isGestorOrAdmin && !empresaSeleccionada)

    // Renderizar números de página
    const renderPageNumbers = () => {
        const pages = []
        const maxVisiblePages = 5
        
        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            let start = Math.max(1, currentPage - 2)
            let end = Math.min(totalPages, start + maxVisiblePages - 1)
            
            if (end - start + 1 < maxVisiblePages) {
                start = Math.max(1, end - maxVisiblePages + 1)
            }
            
            if (start > 1) {
                pages.push(1)
                if (start > 2) pages.push('...')
            }
            
            for (let i = start; i <= end; i++) {
                pages.push(i)
            }
            
            if (end < totalPages) {
                if (end < totalPages - 1) pages.push('...')
                pages.push(totalPages)
            }
        }
        
        return pages
    }

    return (
        <>
            <Header />
            <Main>
                <div className="ie-container">
                    {/* Header principal */}
                    <div className="ie-header">
                        <div className="ie-title-section">
                            <div className="ie-title-icon">
                                <FontAwesomeIcon icon={faUsers} />
                            </div>
                            <div className="ie-title-content">
                                <h1 className="ie-title">
                                    Inscripción de <span className="ie-title-highlight">Empleados</span>
                                </h1>
                                <p className="ie-subtitle">
                                    Selecciona empleados para inscribirlos en cursos disponibles
                                </p>
                            </div>
                        </div>

                        {/* Información de selección actual */}
                        <div className="ie-selection-info">
                            <div className="ie-selection-stats">
                                <div className="ie-stat-card">
                                    <FontAwesomeIcon icon={faUsers} className="ie-stat-icon total" />
                                    <div className="ie-stat-content">
                                        <span className="ie-stat-label">Total Empleados</span>
                                        <span className="ie-stat-value">{filteredEmployees.length}</span>
                                    </div>
                                </div>
                                <div className="ie-stat-card">
                                    <FontAwesomeIcon icon={faCheckCircle} className="ie-stat-icon selected" />
                                    <div className="ie-stat-content">
                                        <span className="ie-stat-label">Seleccionados</span>
                                        <span className="ie-stat-value">{selectedEmployees.length}</span>
                                    </div>
                                </div>
                                {empresaSeleccionada && (
                                    <div className="ie-stat-card">
                                        <FontAwesomeIcon icon={faBuilding} className="ie-stat-icon company" />
                                        <div className="ie-stat-content">
                                            <span className="ie-stat-label">Empresa</span>
                                            <span className="ie-stat-value">{empresaSeleccionada.nombre_empresa}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Información del curso seleccionado */}
                    {selectedCourse && (
                        <div className="ie-course-selected">
                            <div className="ie-course-info">
                                <FontAwesomeIcon icon={faBookOpen} className="ie-course-icon" />
                                <div className="ie-course-details">
                                    <h3 className="ie-course-title">{selectedCourse.nombre_curso}</h3>
                                    <div className="ie-course-meta">
                                        {selectedCourse.cupos_disponibles && (
                                            <span className="ie-course-quota">
                                                <FontAwesomeIcon icon={faUsers} />
                                                {selectedCourse.cupos_disponibles} cupos disponibles
                                            </span>
                                        )}
                                        <button 
                                            className="ie-course-change"
                                            onClick={handleOpenInscripcionModal}
                                        >
                                            Cambiar curso
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Contenido principal */}
                    <div className="ie-content">
                        <div className="ie-card">
                            {/* Barra de controles */}
                            <div className="ie-controls-bar">
                                {/* Búsqueda */}
                                <div className="ie-search-container">
                                    <FontAwesomeIcon icon={faSearch} className="ie-search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Buscar empleados por nombre, documento o email..."
                                        className="ie-search-input"
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value)
                                            setCurrentPage(1)
                                        }}
                                    />
                                    {searchTerm && (
                                        <button 
                                            className="ie-search-clear"
                                            onClick={() => setSearchTerm("")}
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>

                                {/* Filtros */}
                                <div className="ie-filter-controls">
                                    <div className="ie-filter-group">
                                        <FontAwesomeIcon icon={faFilter} className="ie-filter-icon" />
                                        <select 
                                            className="ie-filter-select"
                                            value={filterStatus}
                                            onChange={(e) => {
                                                setFilterStatus(e.target.value)
                                                setCurrentPage(1)
                                            }}
                                        >
                                            <option value="all">Todos los estados</option>
                                            <option value="activo">Solo activos</option>
                                            <option value="inactivo">Solo inactivos</option>
                                        </select>
                                    </div>

                                    {/* Botones de selección */}
                                    <div className="ie-selection-buttons">
                                        <button
                                            className="ie-selection-btn ie-select-page"
                                            onClick={handleSelectAllCurrentPage}
                                            disabled={currentEmployees.length === 0}
                                        >
                                            <FontAwesomeIcon icon={
                                                currentEmployees.every(emp => selectedEmployees.includes(emp.ID)) 
                                                    ? faCheckSquare 
                                                    : faSquare
                                            } />
                                            {currentEmployees.every(emp => selectedEmployees.includes(emp.ID)) 
                                                ? "Deseleccionar página" 
                                                : "Seleccionar página"
                                            }
                                        </button>
                                        <button
                                            className="ie-selection-btn ie-select-all"
                                            onClick={handleSelectAll}
                                            disabled={filteredEmployees.length === 0}
                                        >
                                            <FontAwesomeIcon icon={
                                                selectedEmployees.length === filteredEmployees.length 
                                                    ? faCheckSquare 
                                                    : faSquare
                                            } />
                                            {selectedEmployees.length === filteredEmployees.length 
                                                ? "Deseleccionar todos" 
                                                : "Seleccionar todos"
                                            }
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Botón de curso */}
                            <div className="ie-course-action">
                                <button 
                                    className={`ie-course-btn ${isCourseButtonDisabled ? 'ie-btn-disabled' : ''}`}
                                    onClick={handleOpenInscripcionModal}
                                    disabled={isCourseButtonDisabled}
                                >
                                    <FontAwesomeIcon icon={faBookOpen} />
                                    {selectedCourse ? "Cambiar Curso" : "Seleccionar Curso"}
                                    <FontAwesomeIcon icon={faArrowRight} className="ie-btn-arrow" />
                                </button>
                            </div>

                            {/* Lista de empleados */}
                            <div className="ie-employees-section">
                                {loading ? (
                                    <div className="ie-loading">
                                        <div className="ie-spinner"></div>
                                        <p>Cargando empleados...</p>
                                    </div>
                                ) : filteredEmployees.length === 0 ? (
                                    <div className="ie-empty-state">
                                        <FontAwesomeIcon icon={faUsers} className="ie-empty-icon" />
                                        <h3>No se encontraron empleados</h3>
                                        <p>
                                            {searchTerm || filterStatus !== "all"
                                                ? "No hay empleados que coincidan con los filtros aplicados"
                                                : empresaSeleccionada
                                                    ? "No hay empleados en la empresa seleccionada"
                                                    : "No hay empleados registrados"
                                            }
                                        </p>
                                        {(searchTerm || filterStatus !== "all") && (
                                            <button 
                                                className="ie-clear-filters"
                                                onClick={() => {
                                                    setSearchTerm("")
                                                    setFilterStatus("all")
                                                }}
                                            >
                                                Limpiar filtros
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <div className="ie-employees-grid">
                                            {currentEmployees.map((employe) => {
                                                const isSelected = selectedEmployees.includes(employe.ID)
                                                
                                                return (
                                                    <div 
                                                        key={employe.ID} 
                                                        className={`ie-employee-card ${isSelected ? 'ie-employee-selected' : ''}`}
                                                        onClick={() => handleEmployeeSelection(employe.ID)}
                                                    >
                                                        <div className="ie-employee-checkbox">
                                                            <input
                                                                type="checkbox"
                                                                id={`employee-${employe.ID}`}
                                                                checked={isSelected}
                                                                onChange={(e) => {
                                                                    e.stopPropagation()
                                                                    handleEmployeeSelection(employe.ID)
                                                                }}
                                                                className="ie-checkbox-input"
                                                            />
                                                            <label 
                                                                htmlFor={`employee-${employe.ID}`}
                                                                className="ie-checkbox-label"
                                                            >
                                                                <div className="ie-checkbox-custom">
                                                                    {isSelected && <FontAwesomeIcon icon={faCheckCircle} />}
                                                                </div>
                                                            </label>
                                                        </div>
                                                        
                                                        <div className="ie-employee-content">
                                                            <div className="ie-employee-avatar">
                                                                <img
                                                                    src={getImageSrcFromBase64(employe?.foto_perfil)}
                                                                    alt={`${employe.nombres || 'Sin nombre'} ${employe.apellidos || 'Sin apellido'}`}
                                                                    className="ie-avatar-img"
                                                                    onError={(e) => {   
                                                                        e.target.src = "/src/assets/Icons/userDefect.png"
                                                                    }}
                                                                />
                                                            </div>
                                                            
                                                            <div className="ie-employee-info">
                                                                <div className="ie-employee-header">
                                                                    <h4 className="ie-employee-name">
                                                                        {employe.nombres || "Sin nombre"} {employe.apellidos || "Sin apellido"}
                                                                    </h4>
                                                                    <div className={`ie-employee-status ${employe.estado?.toLowerCase() || "inactivo"}`}>
                                                                        <span className="ie-status-dot"></span>
                                                                        {employe.estado || "Inactivo"}
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="ie-employee-details">
                                                                    <div className="ie-detail-item">
                                                                        <FontAwesomeIcon icon={faIdCard} className="ie-detail-icon" />
                                                                        <span className="ie-detail-text">{employe.documento || "N/A"}</span>
                                                                    </div>
                                                                    <div className="ie-detail-item">
                                                                        <FontAwesomeIcon icon={faEnvelope} className="ie-detail-icon" />
                                                                        <span className="ie-detail-text">{employe.email || "N/A"}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        {/* Paginación */}
                                        {totalPages > 1 && (
                                            <div className="ie-pagination">
                                                <div className="ie-pagination-info">
                                                    Mostrando <strong>{indexOfFirstEmployee + 1}</strong> a <strong>{Math.min(indexOfLastEmployee, filteredEmployees.length)}</strong> de <strong>{filteredEmployees.length}</strong> empleados
                                                </div>
                                                <div className="ie-pagination-controls">
                                                    <button
                                                        onClick={prevPage}
                                                        disabled={currentPage === 1}
                                                        className="ie-pagination-btn ie-prev-btn"
                                                    >
                                                        <FontAwesomeIcon icon={faChevronLeft} />
                                                        <span>Anterior</span>
                                                    </button>
                                                    
                                                    <div className="ie-page-numbers">
                                                        {renderPageNumbers().map((pageNum, index) => (
                                                            pageNum === '...' ? (
                                                                <span key={`ellipsis-${index}`} className="ie-page-ellipsis">
                                                                    ...
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    key={pageNum}
                                                                    onClick={() => handlePageChange(pageNum)}
                                                                    className={`ie-page-btn ${currentPage === pageNum ? 'ie-page-active' : ''}`}
                                                                >
                                                                    {pageNum}
                                                                </button>
                                                            )
                                                        ))}
                                                    </div>
                                                    
                                                    <button
                                                        onClick={nextPage}
                                                        disabled={currentPage === totalPages}
                                                        className="ie-pagination-btn ie-next-btn"
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
                        </div>
                    </div>
                </div>
            </Main>
            <Footer />
            
            {/* Modal de Inscripción */}
            {showInscripcionModal && (
                <Modal_Inscripcion 
                    onClose={handleCloseInscripcionModal} 
                    onCursosSeleccionados={handleCursosSeleccionados}
                    id={empresaSeleccionada}
                    selectedCount={selectedEmployees.length}
                />
            )}

            {/* Modal de Empresa */}
            {showEmpresaModal && (
                <Modal_Empresa 
                    onClose={() => setShowEmpresaModal(false)}
                    onEmpresaSeleccionada={handleEmpresaSeleccionada}
                />
            )}
        </>
    )
}