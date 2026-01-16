import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../../../Layouts/Header/Header';
import { Main } from '../../../Layouts/Main/Main';
import './SupportMaterialCourse.css';
import axiosInstance from '../../../../config/axiosInstance';
import { API_URL } from '../../../../config/env';
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css';
import { useUserSession } from '../../../../hooks/useUserSession';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faArrowLeft, 
    faUpload, 
    faDownload, 
    faEdit, 
    faTrash, 
    faLink, 
    faFilePdf, 
    faVideo,
    faTimes,
    faPlus,
    faBookOpen,
    faCloudUploadAlt,
    faCheck,
    faCalendarAlt,
    faFileAlt,
    faExternalLinkAlt,
    faFolderOpen
} from '@fortawesome/free-solid-svg-icons';

// Configuración de SweetAlert2 con z-index alto
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

// Configuración global para SweetAlert2 - AUMENTAR Z-INDEX
Swal.mixin({
    customClass: {
        popup: 'swal2-popup-custom'
    }
});

export const SupportMaterialCourse = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [subiendoArchivo, setSubiendoArchivo] = useState(false);
    const [cursoActual, setCursoActual] = useState(null);
    const [archivos, setArchivos] = useState([]);
    const [showMaterialCreation, setShowMaterialCreation] = useState(false);
    const [materialType, setMaterialType] = useState('PDF');
    const [material, setMaterial] = useState('');
    const [pendingFiles, setPendingFiles] = useState([]);
    const [pendingLinks, setPendingLinks] = useState([]);
    const [editingMaterial, setEditingMaterial] = useState(null);
    const fileInputRef = useRef(null);
    const { session, accountType, userId } = useUserSession();
    const isLoggedIn = Boolean(session?.accountType);
    const isAdmin = accountType === "administrador";
    const isGestor = accountType === "gestor";
    const isInstructor = accountType === "instructor";
    const [isInstructorAssigned, setIsInstructorAssigned] = useState(false);

    useEffect(() => {
        if (!isInstructor || !userId) {
            setIsInstructorAssigned(false);
            return;
        }

        const fetchAssignment = async () => {
            try {
                const response = await axiosInstance.get(
                    `/api/courses/cursos-asignados/${userId}`
                );
                const assignments = Array.isArray(response.data)
                    ? response.data
                    : [];
                const assigned = assignments.some((assignment) => {
                    const estado = (
                        assignment?.estado ||
                        assignment?.estado_asignacion ||
                        assignment?.estadoAsignacion ||
                        ""
                    ).toLowerCase();
                    const cursoAssignment = assignment?.Curso || assignment;
                    const assignedCourseId = Number(
                        cursoAssignment?.ID ??
                            cursoAssignment?.id ??
                            assignment?.curso_ID ??
                            assignment?.curso_id
                    );
                    return (
                        estado === "aceptada" &&
                        !Number.isNaN(assignedCourseId) &&
                        assignedCourseId === Number(id)
                    );
                });
                setIsInstructorAssigned(assigned);
            } catch (error) {
                // console.error("Error al obtener cursos asignados:", error);
                setIsInstructorAssigned(false);
            }
        };

        void fetchAssignment();
    }, [isInstructor, userId, id]);

    const puedeGestionar =
        isLoggedIn &&
        (isAdmin || isGestor || (isInstructor && isInstructorAssigned));
    const puedeSubirArchivos = puedeGestionar;
    const puedeEliminarArchivos = puedeGestionar;
    const puedeEditarMaterial = puedeGestionar;

    const notifyPermissionError = () => {
        void Swal.fire({
            ...swalConfig,
            icon: "info",
            title: "Sin permisos",
            text: "Solo el instructor asignado o un administrador/gestor puede modificar el material de este curso.",
        });
    };

    const fetchCurso = async () => {
        try {
            const resp = await axiosInstance.get(`api/courses/cursos/${id}`);
            setCursoActual(resp.data);
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo cargar la información del curso',
                confirmButtonText: "Okay",
                theme: "bulma",
                customClass: {
                    confirmButton: 'button is-primary',
                    actions: 'swal2-actions-centered'
                }
            });
        }
    };

    const fetchMaterial = async () => {
        try {
            const resp = await axiosInstance.get(`/api/material/${id}`);
            setArchivos(Array.isArray(resp.data.materiales) ? resp.data.materiales : []);
        } catch (e) {
            // console.error('Error al consultar material', e);
            setArchivos([]);
        }
    };

    const onLocalFilePicked = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) setPendingFiles((prev) => [...prev, ...files]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const crearMaterial = async () => {
        if (!puedeSubirArchivos) {
            notifyPermissionError();
            return;
        }
        
        setSubiendoArchivo(true);
        try {
            let requests = [];
            if (materialType === 'PDF' || materialType === 'Video') {
                const fieldName = materialType === 'PDF' ? 'document_pdf' : 'video';
                const tipo = materialType.toLowerCase();
                if (pendingFiles.length === 0) {
                    await Swal.fire({
                        icon: 'warning',
                        title: 'Archivos requeridos',
                        text: `Selecciona uno o más archivos ${materialType}`,
                        confirmButtonText: "Okay",
                        theme: "bulma",
                        customClass: {
                            confirmButton: 'button is-primary',
                            actions: 'swal2-actions-centered'
                        }
                    });
                    setSubiendoArchivo(false);
                    return;
                }
                requests = pendingFiles.map((file) => {
                    const body = new FormData();
                    body.append(fieldName, file);
                    body.append('tipo', tipo);
                    return axiosInstance.post(`/api/material/create/${id}`, body, { headers: { 'Content-Type': 'multipart/form-data' } });
                });
            } else if (materialType === 'Enlace') {
                const linksToSend = pendingLinks.filter((l) => (l || '').trim().length > 0);
                if (linksToSend.length === 0 && material.length > 0) linksToSend.push(material);
                if (linksToSend.length === 0) {
                    await Swal.fire({
                        icon: 'warning',
                        title: 'Enlaces requeridos',
                        text: 'Agrega uno o más enlaces',
                        confirmButtonText: "Okay",
                        theme: "bulma",
                        customClass: {
                            confirmButton: 'button is-primary',
                            actions: 'swal2-actions-centered'
                        }
                    });
                    setSubiendoArchivo(false);
                    return;
                }
                requests = linksToSend.map((link) => axiosInstance.post(`/api/material/create/${id}`, { tipo: 'enlace', link }));
            }
            
            const responses = await Promise.all(requests);
            const firstMsg = responses[0]?.data?.message;
            
            // Cerrar modal primero
            setShowMaterialCreation(false);
            setPendingFiles([]);
            setPendingLinks([]);
            setMaterial('');
            
            // Esperar un poco para que se cierre el modal completamente
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Mostrar alerta después de cerrar el modal
            if (firstMsg) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Éxito',
                    text: firstMsg,
                    confirmButtonText: "Okay",
                    theme: "bulma",
                    customClass: {
                        confirmButton: 'button is-primary',
                        actions: 'swal2-actions-centered'
                    }
                });
            }
            
            await fetchMaterial();
        } catch (e) {
            // console.error('Error al crear material:', e);
            // Asegurarse de resetear el estado de carga incluso en caso de error
            setSubiendoArchivo(false);
            
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Ocurrió un error al crear el material de apoyo',
                confirmButtonText: "Okay",
                theme: "bulma",
                customClass: {
                    confirmButton: 'button is-primary',
                    actions: 'swal2-actions-centered'
                }
            });
        } finally {
            // Asegurarse de que siempre se reinicie el estado de carga
            setSubiendoArchivo(false);
        }
    };

    const handleEliminarArchivo = async (archivoId) => {
        if (!puedeEliminarArchivos) {
            notifyPermissionError();
            return;
        }
        const result = await Swal.fire({
            icon: 'question',
            title: '¿Eliminar archivo?',
            text: '¿Estás seguro de que quieres eliminar este archivo?',
            showCancelButton: true,
            confirmButtonText: "Aceptar",
            cancelButtonText: "Cancelar",
            theme: "bulma",
            customClass: {
                confirmButton: 'button is-primary',
                cancelButton: "swal-cancel-custom",
                actions: 'swal2-actions-centered'
            }

        });

        if (result.isConfirmed) {
            try {
                await axiosInstance.delete(`/api/material/delete/${archivoId}`);
                
                await Swal.fire({
                    icon: 'success',
                    title: 'Eliminado',
                    text: 'Archivo eliminado correctamente',
                    confirmButtonText: "Okay",
                    theme: "bulma",
                    customClass: {
                        confirmButton: 'button is-primary',
                        actions: 'swal2-actions-centered'
                    }
                });
                
                await fetchMaterial();
            } catch (error) {
                // console.error('Error al eliminar archivo:', error);
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo eliminar el archivo',
                    confirmButtonText: "Okay",
                    theme: "bulma",
                    customClass: {
                        confirmButton: 'button is-primary',
                        actions: 'swal2-actions-centered'
                    }
                });
            }
        }
    };

    const editarMaterial = async () => {
        if (!puedeEditarMaterial) {
            notifyPermissionError();
            return;
        }
        try {
            if (editingMaterial?.tipo_contenido === 'link') {
                if (!editingMaterial.contenido) {
                    Swal.fire({
                        icon: "info",
                        title: "Proporcionar un enlace",
                        text: "Se debe proporcionar un enlace, por favor, ponga uno",
                        confirmButtonText: "Aceptar",
                        theme: "bulma",
                        customClass: {
                            confirmButton: 'button is-primary',
                            actions: 'swal2-actions-centered'
                        }
                    })
                    return;
                }
                const resp = await axiosInstance.put(`/api/material/update/${editingMaterial.ID}`, { link: editingMaterial.contenido });
                await fetchMaterial();
                if (resp?.data?.message)
                    Swal.fire({
                        icon: "success",
                        title: "Actualizado",
                        text: resp.data.message,
                        theme: "bulma",
                        customClass: {
                            confirmButton: 'button is-primary',
                            actions: 'swal2-actions-centered'
                        }
                    })
            }
        } catch {
            Swal.fire({
                icon: "error",
                title: "Error al actualizar",
                text: "Ocurrió un error al actualizar el material de apoyo",
                confirmButtonText: "Okay",
                theme: "bulma",
                customClass: {
                    confirmButton: 'button is-primary',
                    actions: 'swal2-actions-centered'
                }
            })
        } finally {
            setEditingMaterial(null);
        }
    };

    useEffect(() => {
        fetchCurso();
        fetchMaterial();
    }, [id]);

    const getFileTypeIcon = (tipo) => {
        switch (tipo) {
            case 'pdf': return <FontAwesomeIcon icon={faFilePdf} className="sm-icon-pdf" />;
            case 'video': return <FontAwesomeIcon icon={faVideo} className="sm-icon-video" />;
            case 'enlace': return <FontAwesomeIcon icon={faLink} className="sm-icon-link" />;
            case 'link': return <FontAwesomeIcon icon={faLink} className="sm-icon-link" />;
            default: return <FontAwesomeIcon icon={faFileAlt} />;
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const truncarNombreArchivo = (nombre, maxLongitud = 25) => {
        if (!nombre) return '';
        const ultimoPunto = nombre.lastIndexOf('.');
        if (ultimoPunto === -1) {
            return nombre.length > maxLongitud
                ? `${nombre.slice(0, maxLongitud)}...`
                : nombre;
        }
        const nombreParte = nombre.slice(0, ultimoPunto);
        const extension = nombre.slice(ultimoPunto);
        if (nombreParte.length <= maxLongitud) {
            return nombre;
        }
        return `${nombreParte.slice(0, maxLongitud)}...${extension}`;
    };

    return (
        <>
            <Header />
            <Main className="material-main">
                <div className="material-container">
                    <div className="material-header">
                        <div className="header-content">
                            <div className="title-section">
                                <div className="title-left">
                                    <FontAwesomeIcon icon={faBookOpen} className="title-icon" />
                                    <div className="title-text">
                                        <h1 className="main-title">Material de Apoyo</h1>
                                        <p className="subtitle">Gestiona y consulta el material educativo del curso</p>
                                    </div>
                                </div>
                                <button className='btn-back' onClick={() => navigate(-1)}>
                                    <FontAwesomeIcon icon={faArrowLeft} />
                                    <span>Volver al Curso</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="material-content">
                        <div className="course-info-card">
                            <div className="course-header">
                                <div className="course-title-wrapper">
                                    <h2>
                                        <FontAwesomeIcon icon={faBookOpen} />
                                        {cursoActual?.nombre_curso || 'Curso'}
                                    </h2>
                                    <div className="course-status">
                                        <span className={`status-badge ${cursoActual?.estado?.toLowerCase()}`}>
                                            {cursoActual?.estado || 'No disponible'}
                                        </span>
                                    </div>
                                </div>
                                <div className="course-meta">
                                    <div className="meta-item">
                                        <span className="meta-label">Ficha:</span>
                                        <span className="meta-value">{cursoActual?.ficha || 'N/A'}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Materiales:</span>
                                        <span className="meta-value">{archivos.length} archivos</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="materials-section">
                            <div className="section-header">
                                <div className="section-title-wrapper">
                                    <FontAwesomeIcon icon={faFolderOpen} className="section-icon" />
                                    <h2>Material de Apoyo</h2>
                                </div>
                                
                                {puedeSubirArchivos && archivos.length > 0 && (
                                    <button
                                        className="create-btn"
                                        onClick={() => setShowMaterialCreation(true)}
                                        disabled={subiendoArchivo}
                                    >
                                        <FontAwesomeIcon icon={faPlus} />
                                        <span>Agregar Material</span>
                                    </button>
                                )}
                            </div>

                            <div className="materials-list">
                                {archivos.length === 0 ? (
                                    <div className="no-materials">
                                        <FontAwesomeIcon icon={faFileAlt} className="no-materials-icon" />
                                        <h3>No hay materiales disponibles</h3>
                                        <p>Este curso aún no tiene materiales de apoyo. {puedeSubirArchivos && '¡Puedes agregar el primero!'}</p>
                                        {puedeSubirArchivos && (
                                            <button
                                                className="create-btn"
                                                onClick={() => setShowMaterialCreation(true)}
                                                disabled={subiendoArchivo}
                                            >
                                                <FontAwesomeIcon icon={faPlus} />
                                                <span>Agregar primer material</span>
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    archivos.map((archivo) => (
                                        <div key={archivo.ID} className="material-card">
                                            <div className="material-header-card">
                                                <div className="file-type-icon">
                                                    {getFileTypeIcon(archivo.tipo_contenido)}
                                                </div>
                                                <div className="material-main-info">
                                                    <div className="material-title-section">
                                                        {editingMaterial && archivo.ID == editingMaterial.ID ? (
                                                            <input
                                                                className="material-link-input"
                                                                type="text"
                                                                value={editingMaterial.contenido}
                                                                onChange={(e) => setEditingMaterial({
                                                                    ...editingMaterial,
                                                                    contenido: e.target.value
                                                                })}
                                                                placeholder="Ingrese el enlace..."
                                                            />
                                                        ) : archivo.tipo_contenido !== "link" && archivo.tipo_contenido !== "enlace" ? (
                                                            <h4 className="material-title">
                                                                {truncarNombreArchivo(archivo.nombre_original, 25)}
                                                            </h4>
                                                        ) : (
                                                            <a
                                                                className="material-link"
                                                                href={archivo.contenido}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                {archivo.contenido}
                                                                <FontAwesomeIcon icon={faExternalLinkAlt} className="external-link-icon" />
                                                            </a>
                                                        )}
                                                        <span className="file-type-label">
                                                            {archivo.tipo_contenido === 'pdf' ? 'PDF' : 
                                                             archivo.tipo_contenido === 'video' ? 'Video' : 
                                                             archivo.tipo_contenido === 'link' || archivo.tipo_contenido === 'enlace' ? 'Enlace' : 'Archivo'}
                                                        </span>
                                                    </div>
                                                    <div className="material-meta">
                                                        {archivo.tipo_contenido !== "link" && archivo.tipo_contenido !== "enlace" && (
                                                            <span className="file-size">
                                                                {formatFileSize(archivo.tamanio)}
                                                            </span>
                                                        )}
                                                        <span className="file-date">
                                                            <FontAwesomeIcon icon={faCalendarAlt} />
                                                            {new Date(archivo.fecha_subida).toLocaleDateString("es-CO")}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="material-actions">
                                                {editingMaterial && archivo.ID == editingMaterial.ID ? (
                                                    <div className="edit-actions">
                                                        <button
                                                            className="action-btn save-btn"
                                                            onClick={() => editarMaterial()}
                                                        >
                                                            <FontAwesomeIcon icon={faCheck} />
                                                            <span>Guardar</span>
                                                        </button>
                                                        <button
                                                            className="action-btn cancel-btn"
                                                            onClick={() => setEditingMaterial(null)}
                                                        >
                                                            <FontAwesomeIcon icon={faTimes} />
                                                            <span>Cancelar</span>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {(archivo.tipo_contenido !== "link" && archivo.tipo_contenido !== "enlace") && (
                                                            <a
                                                                className="action-btn download-btn"
                                                                href={`${API_URL}${archivo.contenido}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                download
                                                            >
                                                                <FontAwesomeIcon icon={faDownload} />
                                                                <span>Descargar</span>
                                                            </a>
                                                        )}

                                                        {puedeEliminarArchivos && puedeEditarMaterial && (
                                                            <div className="manage-actions">
                                                                {(archivo.tipo_contenido === "link" || archivo.tipo_contenido === "enlace") && (
                                                                    <button
                                                                        className="action-btn edit-btn"
                                                                        onClick={() => setEditingMaterial(archivo)}
                                                                    >
                                                                        <FontAwesomeIcon icon={faEdit} />
                                                                        <span>Editar</span>
                                                                    </button>
                                                                )}

                                                                <button
                                                                    className="action-btn delete-btn"
                                                                    onClick={() => handleEliminarArchivo(archivo.ID)}
                                                                >
                                                                    <FontAwesomeIcon icon={faTrash} />
                                                                    <span>Eliminar</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Main>

            {/* MODAL DE CREAR MATERIAL */}
            {showMaterialCreation && (
                <div className="modal-overlay-material">
                    <div className="modal-container-material">
                        <div className="modal-header-material">
                            <div className="header-content-material">
                                <h2>
                                    <FontAwesomeIcon icon={faCloudUploadAlt} className="header-icon-material" />
                                    Nuevo Material de Apoyo
                                </h2>
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setShowMaterialCreation(false);
                                        setPendingFiles([]);
                                        setPendingLinks([]);
                                        setMaterial('');
                                    }}
                                    className="close-btn-material"
                                    disabled={subiendoArchivo}
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                    <span>Cancelar</span>
                                </button>
                            </div>
                        </div>

                        <div className="modal-body-material">
                            <div className="modal-content-material">
                                <div className="form-section-material">
                                    <h3 className="section-title-material">
                                        <FontAwesomeIcon icon={faBookOpen} />
                                        Curso Seleccionado
                                    </h3>
                                    <div className="course-info-material">
                                        <span className="course-name-material">{cursoActual?.nombre_curso}</span>
                                    </div>
                                </div>

                                <div className="form-section-material">
                                    <h3 className="section-title-material">
                                        <FontAwesomeIcon icon={faFileAlt} />
                                        Tipo de Material
                                    </h3>
                                    <div className="material-type-selector-material">
                                        {["PDF", "Video", "Enlace"].map((t) => (
                                            <button
                                                key={t}
                                                className={`type-option-material ${materialType === t ? 'active' : ''}`}
                                                onClick={() => {
                                                    if (!subiendoArchivo) {
                                                        setMaterialType(t);
                                                        setPendingFiles([]);
                                                        setPendingLinks([]);
                                                        setMaterial("");
                                                    }
                                                }}
                                                disabled={subiendoArchivo}
                                            >
                                                <div className="type-icon-material">
                                                    {t === "PDF" && <FontAwesomeIcon icon={faFilePdf} />}
                                                    {t === "Video" && <FontAwesomeIcon icon={faVideo} />}
                                                    {t === "Enlace" && <FontAwesomeIcon icon={faLink} />}
                                                </div>
                                                <span className="type-label-material">{t}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-section-material">
                                    <h3 className="section-title-material">
                                        <FontAwesomeIcon icon={faCloudUploadAlt} />
                                        {(materialType === "PDF" || materialType === "Video")
                                            ? `Subir ${materialType === "PDF" ? "Archivos PDF" : "Videos"}`
                                            : "Agregar Enlaces"}
                                    </h3>

                                    {(materialType === "PDF" || materialType === "Video") ? (
                                        <>
                                            <div className="upload-area-material">
                                                <input
                                                    id="file-upload-material"
                                                    type="file"
                                                    multiple
                                                    onChange={onLocalFilePicked}
                                                    disabled={subiendoArchivo}
                                                    ref={fileInputRef}
                                                    className="file-input-material"
                                                    accept={materialType === "PDF" ? ".pdf" : "video/*"}
                                                />
                                                <label htmlFor="file-upload-material" className="upload-dropzone-material">
                                                    <FontAwesomeIcon icon={faCloudUploadAlt} className="upload-icon-material" />
                                                    <div className="upload-text-material">
                                                        <p className="upload-title-material">Haz clic para subir archivos</p>
                                                        <p className="upload-subtitle-material">
                                                            Arrastra o selecciona archivos {materialType === "PDF" ? "PDF" : "de video"}
                                                        </p>
                                                        <p className="upload-hint-material">
                                                            Formatos: {materialType === "PDF" ? ".pdf" : ".mp4, .avi, .mov"}
                                                        </p>
                                                    </div>
                                                </label>
                                            </div>

                                            {pendingFiles.length > 0 && (
                                                <div className="pending-files-material">
                                                    <h4 className="pending-title-material">
                                                        Archivos seleccionados ({pendingFiles.length})
                                                    </h4>
                                                    <div className="pending-list-material">
                                                        {pendingFiles.map((f, idx) => (
                                                            <div key={`${idx}-${f.name}`} className="pending-item-material">
                                                                <div className="pending-item-info-material">
                                                                    <FontAwesomeIcon
                                                                        icon={materialType === "PDF" ? faFilePdf : faVideo}
                                                                        className={`pending-icon-material ${materialType.toLowerCase()}`}
                                                                    />
                                                                    <div className="pending-details-material">
                                                                        <span className="pending-name-material">{truncarNombreArchivo(f.name, 30)}</span>
                                                                        <span className="pending-size-material">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type='button'
                                                                    className='remove-btn-material'
                                                                    onClick={() => setPendingFiles((prev) => prev.filter((_, i) => i !== idx))}
                                                                    disabled={subiendoArchivo}
                                                                >
                                                                    <FontAwesomeIcon icon={faTimes} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="links-input-material">
                                            <div className="link-input-group-material">
                                                <input
                                                    className="link-input-material"
                                                    type="text"
                                                    placeholder='https://ejemplo.com/material'
                                                    value={material}
                                                    onChange={(e) => setMaterial(e.target.value)}
                                                    disabled={subiendoArchivo}
                                                />
                                                <button
                                                    type='button'
                                                    className='add-link-btn-material'
                                                    onClick={() => {
                                                        if ((material || '').trim().length > 0) {
                                                            setPendingLinks((prev) => [...prev, material.trim()]);
                                                            setMaterial('');
                                                        }
                                                    }}
                                                    disabled={subiendoArchivo}
                                                >
                                                    <FontAwesomeIcon icon={faPlus} />
                                                    <span>Agregar</span>
                                                </button>
                                            </div>

                                            {pendingLinks.length > 0 && (
                                                <div className="pending-links-material">
                                                    <h4 className="pending-title-material">
                                                        Enlaces agregados ({pendingLinks.length})
                                                    </h4>
                                                    <div className="pending-list-material">
                                                        {pendingLinks.map((l, idx) => (
                                                            <div key={`${idx}-${l}`} className="pending-item-material">
                                                                <div className="pending-item-info-material">
                                                                    <FontAwesomeIcon 
                                                                        icon={faLink} 
                                                                        className="pending-icon-material link" 
                                                                    />
                                                                    <input
                                                                        className='link-edit-input-material'
                                                                        type='text'
                                                                        value={l}
                                                                        onChange={(e) => {
                                                                            const copy = [...pendingLinks];
                                                                            copy[idx] = e.target.value;
                                                                            setPendingLinks(copy);
                                                                        }}
                                                                        placeholder="URL del enlace"
                                                                        disabled={subiendoArchivo}
                                                                    />
                                                                </div>
                                                                <button
                                                                    type='button'
                                                                    className='remove-btn-material'
                                                                    onClick={() => setPendingLinks((prev) => prev.filter((_, i) => i !== idx))}
                                                                    disabled={subiendoArchivo}
                                                                >
                                                                    <FontAwesomeIcon icon={faTimes} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {puedeSubirArchivos && (
                                    <div className="modal-actions-material">
                                        <button
                                            className="submit-btn-material secondary"
                                            onClick={() => {
                                                if (!subiendoArchivo) {
                                                    setShowMaterialCreation(false);
                                                    setPendingFiles([]);
                                                    setPendingLinks([]);
                                                    setMaterial("");
                                                }
                                            }}
                                            disabled={subiendoArchivo}
                                        >
                                            <FontAwesomeIcon icon={faTimes} />
                                            <span>Cancelar</span>
                                        </button>
                                        <button
                                            className="submit-btn-material primary"
                                            onClick={crearMaterial}
                                            disabled={subiendoArchivo || 
                                                ((materialType === "PDF" || materialType === "Video") && pendingFiles.length === 0) ||
                                                (materialType === "Enlace" && pendingLinks.length === 0 && material.trim().length === 0)}
                                        >
                                            {subiendoArchivo ? (
                                                <>
                                                    <div className="spinner"></div>
                                                    <span>Subiendo...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FontAwesomeIcon icon={faCheck} />
                                                    <span>Crear Material</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};