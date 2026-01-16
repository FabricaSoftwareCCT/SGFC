import React, { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./RegistrationsGestor.css";
import { getAllInscripciones, updateBulkStatus, getIdCurso } from '../../../API/ApiRpeort';
import { Header } from "../../../Layouts/Header/Header";
import { Main } from "../../../Layouts/Main/Main";
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch,
    faFilter,
    faCheckCircle,
    faTimesCircle,
    faCalendarAlt,
    faUser,
    faBuilding,
    faEnvelope,
    faPhone,
    faClock,
    faClipboardCheck,
    faUsers,
    faChevronLeft,
    faChevronRight,
    faSort,
    faSortUp,
    faSortDown,
    faListCheck
} from '@fortawesome/free-solid-svg-icons';

export const RegistrationsGestor = () => {
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("fecha_desc");
    const [sortDirection, setSortDirection] = useState("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const [inscritos, setInscritos] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [title, setTitle] = useState("");
    const [loading, setLoading] = useState(true);
    const itemsPerPage = 10;
    const { id } = useParams();

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getAllInscripciones(id);
            const data2 = await getIdCurso(id);
            
            if (!data || !data2) {
                Swal.fire({
                    icon: "error",
                    title: "Error al cargar los datos",
                    text: "No se cargaron los datos en el sistema, intentelo otra vez",
                    confirmButtonText: "Okay",
                    theme: "bulma",
                    customClass: {
                        confirmButton: 'rg-button-primary',
                        popup: 'rg-swal-popup'
                    }
                });
                setLoading(false);
                return;
            }
            setInscritos(data);
            setTitle(data2.nombre_curso);
        } catch (error) {
            // console.log(error);
            Swal.fire({
                icon: "error",
                title: "Error en el servidor",
                text: "No respondió el servidor, intentelo más tarde",
                confirmButtonText: "Okay",
                theme: "bulma",
                customClass: {
                    confirmButton: 'rg-button-primary',
                    popup: 'rg-swal-popup'
                }
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const filteredAndSortedData = useMemo(() => {
        let result = inscritos.filter(
            (item) =>
                item.nombres?.toLowerCase().includes(search.toLowerCase()) ||
                item.apellidos?.toLowerCase().includes(search.toLowerCase()) ||
                item.email?.toLowerCase().includes(search.toLowerCase()) ||
                item.empresa?.toLowerCase().includes(search.toLowerCase()) ||
                item.celular?.includes(search)
        );

        // Aplicar ordenamiento
        result.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case "nombre":
                    aValue = `${a.nombres} ${a.apellidos}`.toLowerCase();
                    bValue = `${b.nombres} ${b.apellidos}`.toLowerCase();
                    return sortDirection === "asc" 
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                        
                case "fecha":
                    aValue = new Date(a.fecha_inscripcion);
                    bValue = new Date(b.fecha_inscripcion);
                    return sortDirection === "asc"
                        ? aValue - bValue
                        : bValue - aValue;
                        
                case "empresa":
                    aValue = a.empresa?.toLowerCase() || "";
                    bValue = b.empresa?.toLowerCase() || "";
                    return sortDirection === "asc"
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                        
                case "estado":
                    const estadoOrder = { "activo": 1, "pendiente": 2, "rechazado": 3 };
                    aValue = estadoOrder[a.estado] || 4;
                    bValue = estadoOrder[b.estado] || 4;
                    return sortDirection === "asc"
                        ? aValue - bValue
                        : bValue - aValue;
                        
                default:
                    aValue = new Date(a.fecha_inscripcion);
                    bValue = new Date(b.fecha_inscripcion);
                    return bValue - aValue;
            }
        });

        return result;
    }, [inscritos, search, sortBy, sortDirection]);

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortDirection("asc");
        }
    };

    const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);

    const handleSelectItem = (id) => {
        setSelectedItems(prev =>
            prev.includes(id)
                ? prev.filter(itemId => itemId !== id)
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedItems([]);
        } else {
            const currentPageIds = paginatedData.map(item => item.id);
            setSelectedItems(currentPageIds);
        }
        setSelectAll(!selectAll);
    };

    const handleBulkStatusChange = async (newStatus) => {
        if (selectedItems.length === 0) {
            Swal.fire({
                icon: "info",
                title: "Selecciona una inscripción",
                text: "Por favor selecciona al menos una inscripción",
                confirmButtonText: "Okay",
                theme: "bulma",
                customClass: {
                    confirmButton: 'rg-button-primary',
                    popup: 'rg-swal-popup'
                }
            });
            return;
        }

        const pendingSelectedData = inscritos.filter(item =>
            selectedItems.includes(item.id) && item.estado === "pendiente"
        );

        if (pendingSelectedData.length === 0) {
            Swal.fire({
                icon: "info",
                title: "No hay inscripciones pendientes seleccionadas",
                text: "Solo puedes cambiar el estado de inscripciones pendientes.",
                confirmButtonText: "Okay",
                theme: "bulma",
                customClass: {
                    confirmButton: 'rg-button-primary',
                    popup: 'rg-swal-popup'
                }
            });
            return;
        }

        const nonPendingCount = selectedItems.length - pendingSelectedData.length;
        if (nonPendingCount > 0) {
            const result = await Swal.fire({
                icon: "warning",
                title: "Inscripciones no procesables",
                html: `
                    <div class="rg-swal-content">
                        <p>${nonPendingCount} inscripción(es) no se pueden modificar porque ya no están pendientes.</p>
                        <p><strong>¿Deseas procesar las ${pendingSelectedData.length} inscripción(es) pendientes?</strong></p>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: "Sí, procesar",
                cancelButtonText: "Cancelar",
                theme: "bulma",
                customClass: {
                    confirmButton: 'rg-button-primary',
                    cancelButton: 'rg-button-secondary',
                    popup: 'rg-swal-popup'
                }
            });

            if (!result.isConfirmed) return;
        }

        const estados = pendingSelectedData.map(item => ({
            id: item.id,
            estado: newStatus
        }));

        try {
            await updateBulkStatus(estados);
            Swal.fire({
                icon: "success",
                title: "¡Éxito!",
                text: `${pendingSelectedData.length} inscripción(es) actualizadas correctamente`,
                confirmButtonText: "Aceptar",
                theme: "bulma",
                customClass: {
                    confirmButton: 'rg-button-primary',
                    popup: 'rg-swal-popup'
                }
            });
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Error al actualizar",
                text: err?.message || "No se logro actualizar, por favor, intente nuevamente",
                confirmButtonText: "Aceptar",
                theme: "bulma",
                customClass: {
                    confirmButton: 'rg-button-primary',
                    popup: 'rg-swal-popup'
                }
            });
        }

        fetchData();
        setSelectedItems([]);
        setSelectAll(false);
    };

    const getStatusStats = () => {
        const stats = {
            total: filteredAndSortedData.length,
            activo: filteredAndSortedData.filter(item => item.estado === "activo").length,
            pendiente: filteredAndSortedData.filter(item => item.estado === "pendiente").length,
            rechazado: filteredAndSortedData.filter(item => item.estado === "rechazado").length
        };
        return stats;
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            setSelectAll(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const getSortIcon = (field) => {
        if (sortBy !== field) return faSort;
        return sortDirection === "asc" ? faSortUp : faSortDown;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const renderPaginationNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        
        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            let start = Math.max(1, currentPage - 2);
            let end = Math.min(totalPages, start + maxVisiblePages - 1);
            
            if (end - start + 1 < maxVisiblePages) {
                start = Math.max(1, end - maxVisiblePages + 1);
            }
            
            if (start > 1) {
                pages.push(1);
                if (start > 2) pages.push('...');
            }
            
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
            
            if (end < totalPages) {
                if (end < totalPages - 1) pages.push('...');
                pages.push(totalPages);
            }
        }
        
        return pages;
    };

    return (
        <>
            <Header />
            <Main>
                <div className="rg-container">
                    {/* Header con estadísticas */}
                    <div className="rg-header">
                        <div className="rg-header-content">
                            <div className="rg-title-section">
                                <div className="rg-title-icon">
                                    <FontAwesomeIcon icon={faClipboardCheck} />
                                </div>
                                <div className="rg-title-wrapper">
                                    <h1 className="rg-title">
                                        {title || "Cargando..."}
                                    </h1>
                                    <p className="rg-subtitle">Gestión de Inscripciones</p>
                                </div>
                            </div>
                            
                            <div className="rg-stats-grid">
                                <div className="rg-stat-card rg-stat-total">
                                    <div className="rg-stat-icon">
                                        <FontAwesomeIcon icon={faUsers} />
                                    </div>
                                    <div className="rg-stat-content">
                                        <span className="rg-stat-label">Total Inscritos</span>
                                        <span className="rg-stat-value">{getStatusStats().total}</span>
                                    </div>
                                </div>
                                
                                <div className="rg-stat-card rg-stat-active">
                                    <div className="rg-stat-icon">
                                        <FontAwesomeIcon icon={faCheckCircle} />
                                    </div>
                                    <div className="rg-stat-content">
                                        <span className="rg-stat-label">Activos</span>
                                        <span className="rg-stat-value">{getStatusStats().activo}</span>
                                    </div>
                                </div>
                                
                                <div className="rg-stat-card rg-stat-pending">
                                    <div className="rg-stat-icon">
                                        <FontAwesomeIcon icon={faClock} />
                                    </div>
                                    <div className="rg-stat-content">
                                        <span className="rg-stat-label">Pendientes</span>
                                        <span className="rg-stat-value">{getStatusStats().pendiente}</span>
                                    </div>
                                </div>
                                
                                <div className="rg-stat-card rg-stat-rejected">
                                    <div className="rg-stat-icon">
                                        <FontAwesomeIcon icon={faTimesCircle} />
                                    </div>
                                    <div className="rg-stat-content">
                                        <span className="rg-stat-label">Rechazados</span>
                                        <span className="rg-stat-value">{getStatusStats().rechazado}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contenido principal */}
                    <div className="rg-content">
                        <div className="rg-card">
                            {/* Barra de filtros */}
                            <div className="rg-filter-bar">
                                <div className="rg-search-container">
                                    <div className="rg-search-icon">
                                        <FontAwesomeIcon icon={faSearch} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre, apellido, email, empresa o teléfono..."
                                        className="rg-search-input"
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    />
                                    {search && (
                                        <button 
                                            className="rg-search-clear"
                                            onClick={() => setSearch("")}
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                                
                                <div className="rg-filter-controls">
                                    <div className="rg-filter-group">
                                        <div className="rg-filter-select-wrapper">
                                            <FontAwesomeIcon icon={faFilter} className="rg-filter-icon" />
                                            <select
                                                className="rg-filter-select"
                                                value={sortBy}
                                                onChange={(e) => setSortBy(e.target.value)}
                                            >
                                                <option value="fecha_desc">Más recientes primero</option>
                                                <option value="fecha_asc">Más antiguos primero</option>
                                                <option value="nombre">Ordenar por nombre</option>
                                                <option value="empresa">Ordenar por empresa</option>
                                                <option value="estado">Ordenar por estado</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Acciones masivas */}
                            {selectedItems.length > 0 && (
                                <div className="rg-bulk-actions">
                                    <div className="rg-selection-info">
                                        <FontAwesomeIcon icon={faListCheck} />
                                        <span>{selectedItems.length} inscripciones seleccionadas</span>
                                    </div>
                                    <div className="rg-bulk-buttons">
                                        <button
                                            className="rg-bulk-btn rg-bulk-accept"
                                            onClick={() => handleBulkStatusChange("activo")}
                                        >
                                            <FontAwesomeIcon icon={faCheckCircle} />
                                            <span>Aceptar Seleccionados</span>
                                        </button>
                                        <button
                                            className="rg-bulk-btn rg-bulk-reject"
                                            onClick={() => handleBulkStatusChange("rechazado")}
                                        >
                                            <FontAwesomeIcon icon={faTimesCircle} />
                                            <span>Rechazar Seleccionados</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Tabla */}
                            <div className="rg-table-section">
                                {loading ? (
                                    <div className="rg-loading">
                                        <div className="rg-spinner"></div>
                                        <p>Cargando inscripciones...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="rg-table-wrapper">
                                            <table className="rg-table">
                                                <thead className="rg-table-header">
                                                    <tr>
                                                        <th className="rg-col-select">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectAll}
                                                                onChange={handleSelectAll}
                                                                className="rg-select-all"
                                                            />
                                                        </th>
                                                        <th 
                                                            className="rg-col-name"
                                                            onClick={() => handleSort("nombre")}
                                                        >
                                                            <span className="rg-col-header">
                                                                <FontAwesomeIcon icon={faUser} />
                                                                <span>Participante</span>
                                                                <FontAwesomeIcon 
                                                                    icon={getSortIcon("nombre")} 
                                                                    className="rg-sort-icon"
                                                                />
                                                            </span>
                                                        </th>
                                                        <th 
                                                            className="rg-col-company"
                                                            onClick={() => handleSort("empresa")}
                                                        >
                                                            <span className="rg-col-header">
                                                                <FontAwesomeIcon icon={faBuilding} />
                                                                <span>Empresa</span>
                                                                <FontAwesomeIcon 
                                                                    icon={getSortIcon("empresa")} 
                                                                    className="rg-sort-icon"
                                                                />
                                                            </span>
                                                        </th>
                                                        <th className="rg-col-email">
                                                            <span className="rg-col-header">
                                                                <FontAwesomeIcon icon={faEnvelope} />
                                                                <span>Email</span>
                                                            </span>
                                                        </th>
                                                        <th className="rg-col-phone">
                                                            <span className="rg-col-header">
                                                                <FontAwesomeIcon icon={faPhone} />
                                                                <span>Teléfono</span>
                                                            </span>
                                                        </th>
                                                        <th 
                                                            className="rg-col-date"
                                                            onClick={() => handleSort("fecha")}
                                                        >
                                                            <span className="rg-col-header">
                                                                <FontAwesomeIcon icon={faCalendarAlt} />
                                                                <span>Fecha Inscripción</span>
                                                                <FontAwesomeIcon 
                                                                    icon={getSortIcon("fecha")} 
                                                                    className="rg-sort-icon"
                                                                />
                                                            </span>
                                                        </th>
                                                        <th 
                                                            className="rg-col-status"
                                                            onClick={() => handleSort("estado")}
                                                        >
                                                            <span className="rg-col-header">
                                                                <FontAwesomeIcon icon={faSort} />
                                                                <span>Estado</span>
                                                                <FontAwesomeIcon 
                                                                    icon={getSortIcon("estado")} 
                                                                    className="rg-sort-icon"
                                                                />
                                                            </span>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="rg-table-body">
                                                    {paginatedData.length > 0 ? (
                                                        paginatedData.map((item) => (
                                                            <tr 
                                                                key={item.id} 
                                                                className={`rg-table-row ${selectedItems.includes(item.id) ? 'rg-row-selected' : ''}`}
                                                            >
                                                                <td className="rg-col-select">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedItems.includes(item.id)}
                                                                        onChange={() => handleSelectItem(item.id)}
                                                                        className="rg-row-checkbox"
                                                                    />
                                                                </td>
                                                                <td className="rg-col-name">
                                                                    <div className="rg-participant">
                                                                        <div className="rg-participant-name">
                                                                            {item.nombres} {item.apellidos}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="rg-col-company">
                                                                    <div className="rg-company">
                                                                        {item.empresa || "No especificado"}
                                                                    </div>
                                                                </td>
                                                                <td className="rg-col-email">
                                                                    <a 
                                                                        href={`mailto:${item.email}`} 
                                                                        className="rg-email-link"
                                                                    >
                                                                        {item.email}
                                                                    </a>
                                                                </td>
                                                                <td className="rg-col-phone">
                                                                    <span className="rg-phone">
                                                                        {item.celular || "No especificado"}
                                                                    </span>
                                                                </td>
                                                                <td className="rg-col-date">
                                                                    <div className="rg-date">
                                                                        <FontAwesomeIcon icon={faCalendarAlt} />
                                                                        <span>{formatDate(item.fecha_inscripcion)}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="rg-col-status">
                                                                    <div className={`rg-status ${item.estado?.toLowerCase()}`}>
                                                                        {item.estado === "activo" && <FontAwesomeIcon icon={faCheckCircle} />}
                                                                        {item.estado === "pendiente" && <FontAwesomeIcon icon={faClock} />}
                                                                        {item.estado === "rechazado" && <FontAwesomeIcon icon={faTimesCircle} />}
                                                                        <span className="rg-status-text">{item.estado}</span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr className="rg-empty-row">
                                                            <td colSpan="7">
                                                                <div className="rg-empty-state">
                                                                    <FontAwesomeIcon icon={faUsers} className="rg-empty-icon" />
                                                                    <h3>No se encontraron inscripciones</h3>
                                                                    <p>
                                                                        {search 
                                                                            ? "No hay inscripciones que coincidan con tu búsqueda"
                                                                            : "No hay inscripciones registradas para este curso"
                                                                        }
                                                                    </p>
                                                                    {search && (
                                                                        <button 
                                                                            className="rg-clear-search-btn"
                                                                            onClick={() => setSearch("")}
                                                                        >
                                                                            Limpiar búsqueda
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Paginación */}
                                        {filteredAndSortedData.length > 0 && (
                                            <div className="rg-pagination">
                                                <div className="rg-pagination-info">
                                                    Mostrando <strong>{startIndex + 1}</strong> a <strong>{Math.min(startIndex + itemsPerPage, filteredAndSortedData.length)}</strong> de <strong>{filteredAndSortedData.length}</strong> inscripciones
                                                </div>
                                                <div className="rg-pagination-controls">
                                                    <button
                                                        onClick={() => handlePageChange(currentPage - 1)}
                                                        disabled={currentPage === 1}
                                                        className="rg-pagination-btn rg-prev-btn"
                                                    >
                                                        <FontAwesomeIcon icon={faChevronLeft} />
                                                        <span>Anterior</span>
                                                    </button>
                                                    
                                                    <div className="rg-page-numbers">
                                                        {renderPaginationNumbers().map((pageNum, index) => (
                                                            pageNum === '...' ? (
                                                                <span key={`ellipsis-${index}`} className="rg-page-ellipsis">
                                                                    ...
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    key={pageNum}
                                                                    onClick={() => handlePageChange(pageNum)}
                                                                    className={`rg-page-btn ${currentPage === pageNum ? 'rg-page-active' : ''}`}
                                                                >
                                                                    {pageNum}
                                                                </button>
                                                            )
                                                        ))}
                                                    </div>
                                                    
                                                    <button
                                                        onClick={() => handlePageChange(currentPage + 1)}
                                                        disabled={currentPage === totalPages}
                                                        className="rg-pagination-btn rg-next-btn"
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
        </>
    );
};