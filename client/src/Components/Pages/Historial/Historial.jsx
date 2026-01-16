import { useNavigate } from "react-router-dom"
import { Header } from "../../Layouts/Header/Header"
import { Main } from "../../Layouts/Main/Main"
import "./Historial.css"
import { useEffect, useState, useMemo } from "react"
import axiosInstance from "../../../config/axiosInstance"
import Swal from 'sweetalert2'
import 'sweetalert2/themes/bulma.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faHistory,
    faCalendarAlt,
    faInfoCircle,
    faUser,
    faBuilding,
    faClipboardCheck,
    faExchangeAlt,
    faFilter,
    faSearch,
    faSort,
    faSortUp,
    faSortDown,
    faChevronLeft,
    faChevronRight,
    faClock,
    faDatabase,
    faEye,
    faTrash,
    faSync,
    faFileAlt
} from '@fortawesome/free-solid-svg-icons'

export const Historial = () => {
    const navigate = useNavigate()
    const userSession = JSON.parse(localStorage.getItem("userSession")) || JSON.parse(sessionStorage.getItem("userSession"))
    const isLoggedIn = !!userSession
    const accountType = userSession?.accountType || null

    const [page, setPage] = useState(0)
    const [total, setTotal] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [historial, setHistorial] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [sortBy, setSortBy] = useState("fecha_desc")
    const [filterType, setFilterType] = useState("all")
    const [itemsPerPage] = useState(10)

    // Tipos de acciones para filtrar
    const actionTypes = [
        { value: "all", label: "Todos los tipos", icon: faHistory },
        { value: "usuario", label: "Usuarios", icon: faUser },
        { value: "empresa", label: "Empresas", icon: faBuilding },
        { value: "curso", label: "Cursos", icon: faClipboardCheck },
        { value: "inscripcion", label: "Inscripciones", icon: faFileAlt }
    ]

    const fetchHistorial = async () => {
        setLoading(true)
        try {
            const resp = await axiosInstance.get(`/api/historial/admin?page=${page}`)
            setTotal(resp.data.total || 0)
            setHistorial(resp.data.historial || [])
            setTotalPages(Math.ceil((resp.data.total || 0) / itemsPerPage))
        } catch (error) {
            // console.error("Error fetching history:", error)
            Swal.fire({
                icon: "error",
                title: "Error al consultar historial",
                text: "Ocurrió un error al consultar el historial de cambios",
                confirmButtonText: "Aceptar",
                theme: "bulma",
                customClass: {
                    confirmButton: 'ht-button-primary',
                    popup: 'ht-swal-popup'
                }
            })
            setHistorial([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isLoggedIn && accountType === "Administrador") {
            fetchHistorial()
        } else {
            navigate("/no-autorizado")
        }
    }, [page])

    useEffect(() => {
        if (isLoggedIn && accountType === "Administrador") {
            fetchHistorial()
        }
    }, [])

    // Filtrar y ordenar datos
    const filteredAndSortedHistorial = useMemo(() => {
        let filtered = historial.filter(item => {
            const matchesSearch = searchTerm === "" || 
                item.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.usuario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.tipo?.toLowerCase().includes(searchTerm.toLowerCase())
            
            const matchesFilter = filterType === "all" || 
                item.tipo?.toLowerCase().includes(filterType.toLowerCase())
            
            return matchesSearch && matchesFilter
        })

        // Ordenar
        filtered.sort((a, b) => {
            const dateA = new Date(a.fecha)
            const dateB = new Date(b.fecha)
            
            if (sortBy === "fecha_desc") {
                return dateB - dateA
            } else if (sortBy === "fecha_asc") {
                return dateA - dateB
            } else if (sortBy === "tipo") {
                return (a.tipo || "").localeCompare(b.tipo || "")
            }
            return dateB - dateA
        })

        return filtered
    }, [historial, searchTerm, sortBy, filterType])

    // Paginación manual para datos filtrados
    const paginatedHistorial = filteredAndSortedHistorial.slice(
        page * itemsPerPage,
        (page + 1) * itemsPerPage
    )

    // Determinar ícono según tipo de acción
    const getActionIcon = (tipo) => {
        switch (tipo?.toLowerCase()) {
            case 'usuario': return faUser
            case 'empresa': return faBuilding
            case 'curso': return faClipboardCheck
            case 'inscripcion': return faFileAlt
            default: return faExchangeAlt
        }
    }

    // Determinar color según tipo de acción
    const getActionColor = (tipo) => {
        switch (tipo?.toLowerCase()) {
            case 'usuario': return '#00c853'
            case 'empresa': return '#2196f3'
            case 'curso': return '#ff9800'
            case 'inscripcion': return '#9c27b0'
            default: return '#757575'
        }
    }

    // Formatear fecha
    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return {
            date: date.toLocaleDateString('es-CO', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }),
            time: date.toLocaleTimeString('es-CO', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            full: date.toLocaleString('es-CO', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })
        }
    }

    // Obtener ícono de ordenamiento
    const getSortIcon = (field) => {
        if (sortBy === `${field}_desc`) return faSortDown
        if (sortBy === `${field}_asc`) return faSortUp
        return faSort
    }

    // Manejar cambio de ordenamiento
    const handleSort = (field) => {
        if (sortBy === `${field}_desc`) {
            setSortBy(`${field}_asc`)
        } else {
            setSortBy(`${field}_desc`)
        }
    }

    // Renderizar elemento de historial
    const renderHistorialItem = (item, index) => {
        const formattedDate = formatDate(item.fecha)
        const actionIcon = getActionIcon(item.tipo)
        const actionColor = getActionColor(item.tipo)
        
        return (
            <div key={item.ID || index} className="ht-history-item">
                <div className="ht-history-icon" style={{ color: actionColor }}>
                    <FontAwesomeIcon icon={actionIcon} />
                </div>
                
                <div className="ht-history-content">
                    <div className="ht-history-header">
                        <div className="ht-history-meta">
                            <span className="ht-history-type" style={{ color: actionColor }}>
                                {item.tipo || 'Acción del sistema'}
                            </span>
                            <span className="ht-history-date">
                                <FontAwesomeIcon icon={faClock} />
                                {formattedDate.date} - {formattedDate.time}
                            </span>
                        </div>
                        {item.usuario && (
                            <div className="ht-history-user">
                                <FontAwesomeIcon icon={faUser} />
                                <span>{item.usuario}</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="ht-history-description">
                        {item.descripcion || 'Descripción no disponible'}
                    </div>
                    
                    <div className="ht-history-footer">
                        <span className="ht-history-full-date" title={formattedDate.full}>
                            {formattedDate.full}
                        </span>
                    </div>
                </div>
            </div>
        )
    }

    // Renderizar paginación
    const renderPagination = () => {
        if (totalPages <= 1) return null

        const pages = []
        const maxVisiblePages = 5
        
        if (totalPages <= maxVisiblePages) {
            for (let i = 0; i < totalPages; i++) {
                pages.push(i)
            }
        } else {
            let start = Math.max(0, page - 2)
            let end = Math.min(totalPages - 1, start + maxVisiblePages - 1)
            
            if (end - start + 1 < maxVisiblePages) {
                start = Math.max(0, end - maxVisiblePages + 1)
            }
            
            if (start > 0) {
                pages.push(0)
                if (start > 1) pages.push('...')
            }
            
            for (let i = start; i <= end; i++) {
                pages.push(i)
            }
            
            if (end < totalPages - 1) {
                if (end < totalPages - 2) pages.push('...')
                pages.push(totalPages - 1)
            }
        }

        return (
            <div className="ht-pagination">
                <div className="ht-pagination-info">
                    Mostrando <strong>{Math.min(page * itemsPerPage + 1, filteredAndSortedHistorial.length)}</strong>-
                    <strong>{Math.min((page + 1) * itemsPerPage, filteredAndSortedHistorial.length)}</strong> de 
                    <strong> {filteredAndSortedHistorial.length}</strong> registros
                </div>
                <div className="ht-pagination-controls">
                    <button
                        onClick={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0}
                        className="ht-pagination-btn ht-prev-btn"
                    >
                        <FontAwesomeIcon icon={faChevronLeft} />
                        <span>Anterior</span>
                    </button>
                    
                    <div className="ht-page-numbers">
                        {pages.map((pageNum, index) => (
                            pageNum === '...' ? (
                                <span key={`ellipsis-${index}`} className="ht-page-ellipsis">
                                    ...
                                </span>
                            ) : (
                                <button
                                    key={pageNum}
                                    onClick={() => setPage(pageNum)}
                                    className={`ht-page-btn ${page === pageNum ? 'ht-page-active' : ''}`}
                                >
                                    {pageNum + 1}
                                </button>
                            )
                        ))}
                    </div>
                    
                    <button
                        onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                        disabled={page >= totalPages - 1}
                        className="ht-pagination-btn ht-next-btn"
                    >
                        <span>Siguiente</span>
                        <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="ht-container">
            <Header/>
            <Main>
                <div className="ht-wrapper">
                    {/* Header */}
                    <div className="ht-header">
                        <div className="ht-header-content">
                            <div className="ht-title-section">
                                <div className="ht-title-icon">
                                    <FontAwesomeIcon icon={faHistory} />
                                </div>
                                <div className="ht-title-content">
                                    <h1 className="ht-title">
                                        Historial de <span className="ht-title-highlight">Cambios</span>
                                    </h1>
                                    <p className="ht-subtitle">
                                        Registro completo de todas las acciones realizadas en el sistema
                                    </p>
                                </div>
                            </div>
                            
                            <div className="ht-stats">
                                <div className="ht-stat-card">
                                    <FontAwesomeIcon icon={faDatabase} className="ht-stat-icon total" />
                                    <div className="ht-stat-content">
                                        <span className="ht-stat-label">Total Registros</span>
                                        <span className="ht-stat-value">{total}</span>
                                    </div>
                                </div>
                                <div className="ht-stat-card">
                                    <FontAwesomeIcon icon={faSync} className="ht-stat-icon filtered" />
                                    <div className="ht-stat-content">
                                        <span className="ht-stat-label">Filtrados</span>
                                        <span className="ht-stat-value">{filteredAndSortedHistorial.length}</span>
                                    </div>
                                </div>
                                <div className="ht-stat-card">
                                    <FontAwesomeIcon icon={faClock} className="ht-stat-icon recent" />
                                    <div className="ht-stat-content">
                                        <span className="ht-stat-label">Página</span>
                                        <span className="ht-stat-value">{page + 1} de {totalPages}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filtros y controles */}
                    <div className="ht-controls">
                        <div className="ht-search-container">
                            <FontAwesomeIcon icon={faSearch} className="ht-search-icon" />
                            <input
                                type="text"
                                placeholder="Buscar en descripciones, usuarios o tipos..."
                                className="ht-search-input"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    setPage(0)
                                }}
                            />
                            {searchTerm && (
                                <button 
                                    className="ht-search-clear"
                                    onClick={() => setSearchTerm("")}
                                >
                                    ×
                                </button>
                            )}
                        </div>
                        
                        <div className="ht-controls-right">                           <div className="ht-sort-group">
                                <FontAwesomeIcon icon={faSort} className="ht-sort-icon" />
                                <select
                                    className="ht-sort-select"
                                    value={sortBy}
                                    onChange={(e) => {
                                        setSortBy(e.target.value)
                                        setPage(0)
                                    }}
                                >
                                    <option value="fecha_desc">Más recientes primero</option>
                                    <option value="fecha_asc">Más antiguos primero</option>
                                    <option value="tipo">Ordenar por tipo</option>
                                </select>
                            </div>
                            
                            <button 
                                className="ht-refresh-btn"
                                onClick={fetchHistorial}
                                disabled={loading}
                            >
                                <FontAwesomeIcon icon={faSync} spin={loading} />
                                <span>{loading ? "Actualizando..." : "Actualizar"}</span>
                            </button>
                        </div>
                    </div>

                    {/* Contenido principal */}
                    <div className="ht-content">
                        <div className="ht-card">
                            {loading && historial.length === 0 ? (
                                <div className="ht-loading">
                                    <div className="ht-spinner"></div>
                                    <p>Cargando historial...</p>
                                </div>
                            ) : filteredAndSortedHistorial.length === 0 ? (
                                <div className="ht-empty-state">
                                    <FontAwesomeIcon icon={faHistory} className="ht-empty-icon" />
                                    <h3>No hay registros de historial</h3>
                                    <p>
                                        {searchTerm || filterType !== "all"
                                            ? "No se encontraron registros con los filtros aplicados"
                                            : "No hay registros de cambios en el sistema"
                                        }
                                    </p>
                                    {(searchTerm || filterType !== "all") && (
                                        <button 
                                            className="ht-clear-filters"
                                            onClick={() => {
                                                setSearchTerm("")
                                                setFilterType("all")
                                            }}
                                        >
                                            Limpiar filtros
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className="ht-history-list">
                                        {paginatedHistorial.map(renderHistorialItem)}
                                    </div>
                                    
                                    {renderPagination()}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </Main>
        </div>
    )
}