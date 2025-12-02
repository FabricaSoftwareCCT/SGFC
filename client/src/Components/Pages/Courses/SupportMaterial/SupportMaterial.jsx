import React, { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../../../Layouts/Header/Header';
import { Footer } from '../../../Layouts/Footer/Footer';
import { Main } from '../../../Layouts/Main/Main';
import './SupportMaterial.css';
import axiosInstance from '../../../../config/axiosInstance';
import { useEffect } from 'react';
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css';
import { useUserSession } from '../../../../hooks/useUserSession';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBookOpen,
    faFilePdf,
    faVideo,
    faLink,
    faDownload,
    faEdit,
    faTrash,
    faPlus,
    faTimes,
    faCheck,
    faCloudUploadAlt,
    faExternalLinkAlt,
    faCalendarAlt,
    faFileAlt,
    faGraduationCap,
    faArrowLeft
} from '@fortawesome/free-solid-svg-icons';

export const SupportMaterial = () => {
    const { curso } = useParams()
    const navigate = useNavigate();

    const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
    const [editingMaterial, setEditingMaterial] = useState(false)
    const [subiendoArchivo, setSubiendoArchivo] = useState(false);
    const [showMaterialCreation, setShowMaterialCreation] = useState(false);
    const [materialType, setMaterialType] = useState("PDF");
    const [material, setMaterial] = useState("");
    const [cursos, setCursos] = useState([]);
    const [archivos, setArchivos] = useState([]);
    const [uploadFile, setUploadFile] = useState()
    const [pendingFiles, setPendingFiles] = useState([]);
    const [pendingLinks, setPendingLinks] = useState([]);
    const fileInputRef = useRef(null);
    const [activeTab, setActiveTab] = useState('all');

    const { session, accountType, userId } = useUserSession();
    const isAdmin = accountType === "administrador";
    const isGestor = accountType === "gestor";
    const isInstructor = accountType === "instructor";
    const [assignedCourseIds, setAssignedCourseIds] = useState(new Set());

    const fetchCursos = async () => {
        try {
            const resp = await axiosInstance.get("/api/courses/cursos")
            setCursos(resp.data)
            if (curso) {
                setCursoSeleccionado(resp.data.find((c) => c.ID == curso))
            }
        } catch (error) {
            console.log(error)
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Ocurrió un error al consultar los cursos',
                confirmButtonText: "Entendido",
                confirmButtonColor: "#00843d",
                theme: 'bulma',
                customClass: {
                    confirmButton: 'centered-swal-button'
                }
            });
        }
    }

    const fetchMaterial = async (curso) => {
        try {
            const resp = await axiosInstance.get(`/api/material/${curso.ID}`)
            setArchivos(resp.data.materiales)
        } catch (error) {
            console.log(error)
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Ocurrió un error al consultar el material de apoyo del curso',
                confirmButtonColor: "#00843d",
                theme: 'bulma',
                customClass: {
                    confirmButton: 'centered-swal-button'
                }
            });
        }
    }

    const handleSeleccionarCurso = (curso) => {
        setCursoSeleccionado(curso);
        fetchMaterial(curso)
    }

    const handleFileUpload = (event) => {
        const files = Array.from(event.target.files || []);
        if (!cursoSeleccionado || files.length === 0) return;
        setPendingFiles((prev) => [...prev, ...files]);
        event.target.value = '';
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    const handleEliminarArchivo = (archivoId) => {
        Swal.fire({
            title: '¿Estás seguro?',
            text: "¿Quieres eliminar este material? Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            confirmButtonColor: "#006f33",
            cancelButtonText: 'Cancelar',
            cancelButtonColor: "#c63223",
            theme: "bulma",
            customClass: {
                confirmButton: 'centered-swal-button'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                eliminarMaterial(archivoId)
            }
        });
    }

    const truncarNombreArchivo = (nombre, maxLongitud = 20) => {
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

    const getFileTypeIcon = (tipo) => {
        switch (tipo) {
            case 'pdf': return <FontAwesomeIcon icon={faFilePdf} className="sm-icon-pdf" />;
            case 'video': return <FontAwesomeIcon icon={faVideo} className="sm-icon-video" />;
            case 'link': return <FontAwesomeIcon icon={faLink} className="sm-icon-link" />;
            default: return <FontAwesomeIcon icon={faFileAlt} />;
        }
    };

    const getFileTypeLabel = (tipo) => {
        switch (tipo) {
            case 'pdf': return 'PDF';
            case 'video': return 'Video';
            case 'link': return 'Enlace';
            default: return 'Archivo';
        }
    };

    const crearMaterial = async () => {
        if (!puedeSubirArchivos) {
            notifyPermissionError();
            return;
        }
        setSubiendoArchivo(true);
        try {
            let requests = [];
            if (materialType === "PDF" || materialType === "Video") {
                const fieldName = materialType === "PDF" ? "document_pdf" : "video";
                const tipo = materialType.toLowerCase();
                if (pendingFiles.length === 0) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Archivo requerido',
                        text: `Selecciona uno o más archivos ${materialType}`,
                        confirmButtonColor: "#00843d",
                        confirmButtonText: "Entendido",
                        theme: 'bulma',
                        customClass: {
                            confirmButton: 'centered-swal-button'
                        }
                    });
                    setSubiendoArchivo(false);
                    return;
                }
                requests = pendingFiles.map((file) => {
                    const body = new FormData();
                    body.append(fieldName, file);
                    body.append("tipo", tipo);
                    return axiosInstance.post(`/api/material/create/${cursoSeleccionado.ID}`, body, {
                        headers: { "Content-Type": "multipart/form-data" },
                    });
                });
            } else if (materialType === "Enlace") {
                const linksToSend = pendingLinks.filter((l) => (l || "").trim().length > 0);
                if (linksToSend.length === 0 && material.length > 0) {
                    linksToSend.push(material);
                }
                if (linksToSend.length === 0) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Enlace requerido',
                        text: 'Agrega uno o más enlaces',
                        confirmButtonText: "Entendido",
                        confirmButtonColor: "#00843d",
                        theme: 'bulma',
                        customClass: {
                            confirmButton: 'centered-swal-button'
                        }
                    });
                    setSubiendoArchivo(false);
                    return;
                }
                requests = linksToSend.map((link) => axiosInstance.post(`/api/material/create/${cursoSeleccionado.ID}`, {
                    tipo: 'enlace',
                    link
                }));
            }

            const responses = await Promise.all(requests);
            const firstMsg = responses[0]?.data?.message;
            if (firstMsg) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Material creado!',
                    text: firstMsg,
                    confirmButtonText: "Perfecto",
                    confirmButtonColor: "#00843d",
                    theme: 'bulma',
                    customClass: {
                        confirmButton: 'centered-swal-button'
                    }
                });
            }
            setShowMaterialCreation(false)
            setUploadFile(null)
            setPendingFiles([])
            setPendingLinks([])
            setMaterial("")
            fetchMaterial(cursoSeleccionado)
            setSubiendoArchivo(false)
            await axiosInstance.post("/api/notifications/materialApoyo", {
                curso_ID: cursoSeleccionado.ID
            })
        } catch (error) {
            console.log(error)
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Ocurrió un error al crear el material de apoyo',
                confirmButtonText: "Entendido",
                confirmButtonColor: "#00843d",
                theme: 'bulma',
                customClass: {
                    confirmButton: 'centered-swal-button'
                }
            });
            setSubiendoArchivo(false)
        }
    }

    const editarMaterial = async () => {
        if (!puedeGestionarMaterial) {
            notifyPermissionError();
            return;
        }
        try {
            switch (editingMaterial.tipo_contenido) {
                case "pdf":
                    break
                case "video":
                    break
                case "link":
                    if (editingMaterial.contenido.length < 1) {
                        Swal.fire({
                            icon: 'warning',
                            title: 'Enlace requerido',
                            text: 'Se debe proporcionar un enlace',
                            confirmButtonText: "Entendido",
                            confirmButtonColor: "#00843d",
                            theme: 'bulma',
                            customClass: {
                                confirmButton: 'centered-swal-button'
                            }
                        });
                        return
                    }
                    const resp = await axiosInstance.put(`/api/material/update/${editingMaterial.ID}`, {
                        link: editingMaterial.contenido
                    })
                    fetchMaterial(cursoSeleccionado)
                    Swal.fire({
                        icon: 'success',
                        title: '¡Enlace actualizado!',
                        text: resp.data.message,
                        confirmButtonText: "Entendido",
                        confirmButtonColor: "#00843d",
                        theme: 'bulma',
                        customClass: {
                            confirmButton: 'centered-swal-button'
                        }
                    });
                    setEditingMaterial(null)
                    break
            }
        } catch (error) {
            console.log(error)
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Ocurrió un error al actualizar el material de apoyo',
                confirmButtonText: "Entendido",
                confirmButtonColor: "#00843d",
                theme: 'bulma',
                customClass: {
                    confirmButton: 'centered-swal-button'
                }
            });
            setEditingMaterial(null)
        }
    }

    const eliminarMaterial = async (id) => {
        if (!puedeEliminarArchivos) {
            notifyPermissionError();
            return;
        }
        try {
            const resp = await axiosInstance.delete(`/api/material/delete/${id}`)
            fetchMaterial(cursoSeleccionado)
            Swal.fire({
                icon: 'success',
                title: 'Material eliminado',
                text: resp.data.message,
                confirmButtonText: "Entendido",
                confirmButtonColor: "#00843d",
                theme: 'bulma',
                customClass: {
                    confirmButton: 'centered-swal-button'
                }
            });
        } catch (error) {
            console.log(error)
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Ocurrió un error al eliminar el material de apoyo',
                confirmButtonText: "Entendido",
                confirmButtonColor: "#00843d",
                theme: 'bulma',
                customClass: {
                    confirmButton: 'centered-swal-button'
                }
            });
        }
    }

    const ownsSelectedCourse =
        isInstructor &&
        cursoSeleccionado &&
        userId != null &&
        assignedCourseIds.has(Number(cursoSeleccionado.ID));
    const puedeGestionarMaterial =
        isAdmin || isGestor || ownsSelectedCourse;
    const puedeSubirArchivos = puedeGestionarMaterial;
    const puedeEliminarArchivos = puedeGestionarMaterial;

    const notifyPermissionError = () => {
        Swal.fire({
            icon: 'info',
            title: 'Sin permisos',
            text: 'Solo el instructor asignado o un administrador/gestor puede modificar el material de este curso.',
            confirmButtonColor: "#00843d",
            theme: 'bulma',
            customClass: {
                confirmButton: 'centered-swal-button'
            }
        });
    };

    const filteredArchivos = archivos.filter(archivo => {
        if (activeTab === 'all') return true;
        return archivo.tipo_contenido === activeTab;
    });

    useEffect(() => {
        fetchCursos();

        if (isInstructor && userId) {
            const fetchAssignments = async () => {
                try {
                    const response = await axiosInstance.get(
                        `/api/courses/cursos-asignados/${userId}`
                    );
                    const assignments = Array.isArray(response.data)
                        ? response.data
                        : [];
                    const acceptedIds = assignments
                        .filter((assignment) => {
                            const estado = (
                                assignment?.estado ||
                                assignment?.estado_asignacion ||
                                assignment?.estadoAsignacion ||
                                ""
                            ).toLowerCase();
                            return estado === "aceptada";
                        })
                        .map((assignment) => {
                            const cursoAssignment = assignment?.Curso || assignment;
                            return Number(
                                cursoAssignment?.ID ??
                                cursoAssignment?.id ??
                                assignment?.curso_ID ??
                                assignment?.curso_id
                            );
                        })
                        .filter((courseId) => !Number.isNaN(courseId));
                    setAssignedCourseIds(new Set(acceptedIds));
                } catch (error) {
                    console.error("Error al obtener cursos asignados:", error);
                    setAssignedCourseIds(new Set());
                }
            };

            fetchAssignments();
        } else {
            setAssignedCourseIds(new Set());
        }
    }, [isInstructor, userId]);

    return (
        <>
            <Header />
            <Main className="support-main">
                <div className="support-container">
                    <div className="support-header">
                        <div className="support-header-content">
                            <div className="support-title-section">
                                <FontAwesomeIcon icon={faBookOpen} className="support-title-icon" />
                                <div>
                                    <h1 className="support-title">Material de Apoyo</h1>
                                    <p className="support-subtitle">Gestiona y consulta el material educativo de tus cursos</p>
                                </div>
                            </div>
                            {cursoSeleccionado && puedeSubirArchivos && (
                                <button
                                    className="support-create-btn"
                                    onClick={() => setShowMaterialCreation(true)}
                                >
                                    <FontAwesomeIcon icon={faPlus} />
                                    <span>Nuevo Material</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="support-content">
                        <div className="support-cursos-section">
                            <div className="section-header">
                                <h2><FontAwesomeIcon icon={faGraduationCap} /> Cursos Disponibles</h2>
                                <span className="section-count">{cursos.length} cursos</span>
                            </div>
                            <div className="support-cursos-grid">
                                {cursos.map(curso => (
                                    <div
                                        key={curso.ID}
                                        className={`support-curso-card ${cursoSeleccionado?.ID === curso.ID ? 'selected' : ''}`}
                                        onClick={() => handleSeleccionarCurso(curso)}
                                    >
                                        <div className="curso-card-header">
                                            <div className="curso-icon">
                                                <FontAwesomeIcon icon={faBookOpen} />
                                            </div>
                                            <div className="curso-info">
                                                <h3>{truncarNombreArchivo(curso.nombre_curso, 25)}</h3>
                                                <div className="curso-details">
                                                    <span className="curso-ficha">Ficha: {curso.ficha}</span>
                                                    <span className={`curso-status ${curso.estado?.toLowerCase()}`}>
                                                        {curso.estado}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {cursoSeleccionado?.ID === curso.ID && (
                                            <div className="curso-selected-indicator">
                                                <FontAwesomeIcon icon={faCheck} />
                                                <span>Seleccionado</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {cursoSeleccionado && (
                            <div className="support-archivos-section">
                                <div className="section-header">
                                    <div>
                                        <h2>Material del Curso</h2>
                                        <p className="course-name">{cursoSeleccionado.nombre_curso}</p>
                                    </div>
                                    <div className="material-stats">
                                        <div className="stat-item">
                                            <span className="stat-value">{archivos.length}</span>
                                            <span className="stat-label">Materiales</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="material-tabs">
                                    <button
                                        className={`material-tab ${activeTab === 'all' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('all')}
                                    >
                                        Todos los materiales
                                    </button>
                                    <button
                                        className={`material-tab ${activeTab === 'pdf' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('pdf')}
                                    >
                                        <FontAwesomeIcon icon={faFilePdf} /> PDFs
                                    </button>
                                    <button
                                        className={`material-tab ${activeTab === 'video' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('video')}
                                    >
                                        <FontAwesomeIcon icon={faVideo} /> Videos
                                    </button>
                                    <button
                                        className={`material-tab ${activeTab === 'link' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('link')}
                                    >
                                        <FontAwesomeIcon icon={faLink} /> Enlaces
                                    </button>
                                </div>

                                <div className="support-archivos-list">
                                    {filteredArchivos.length === 0 ? (
                                        <div className="no-materials">
                                            <FontAwesomeIcon icon={faFileAlt} className="no-materials-icon" />
                                            <h3>No hay materiales disponibles</h3>
                                            <p>Este curso aún no tiene materiales de apoyo. {puedeSubirArchivos && '¡Puedes agregar el primero!'}</p>
                                            {puedeSubirArchivos && (
                                                <button
                                                    className="support-create-btn outline"
                                                    onClick={() => setShowMaterialCreation(true)}
                                                >
                                                    <FontAwesomeIcon icon={faPlus} />
                                                    <span>Agregar primer material</span>
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        filteredArchivos.map(archivo => (
                                            <div key={archivo.id} className="support-archivo-card">
                                                <div className="archivo-header">
                                                    <div className="file-type-icon">
                                                        {getFileTypeIcon(archivo.tipo_contenido)}
                                                    </div>
                                                    <div className="archivo-main-info">
                                                        <div className="archivo-title-section">
                                                            {editingMaterial && archivo.ID == editingMaterial.ID ? (
                                                                <input
                                                                    className="support-material-input"
                                                                    type="text"
                                                                    value={editingMaterial.contenido}
                                                                    onChange={(e) => {
                                                                        setEditingMaterial({
                                                                            ...editingMaterial,
                                                                            contenido: e.target.value
                                                                        })
                                                                    }}
                                                                    placeholder="Ingrese el enlace..."
                                                                />
                                                            ) : archivo.tipo_contenido != "link" ? (
                                                                <h4 className="archivo-title">
                                                                    {truncarNombreArchivo(archivo.nombre_original, 25)}
                                                                </h4>
                                                            ) : (
                                                                <a
                                                                    className="archivo-title-link"
                                                                    href={archivo.contenido}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    {archivo.contenido}
                                                                    <FontAwesomeIcon icon={faExternalLinkAlt} className="external-link-icon" />
                                                                </a>
                                                            )}
                                                            <span className="file-type-label">
                                                                {getFileTypeLabel(archivo.tipo_contenido)}
                                                            </span>
                                                        </div>
                                                        <div className="archivo-meta">
                                                            {archivo.tipo_contenido != "link" && (
                                                                <span className="file-size">
                                                                    {(archivo.tamanio / 1024 / 1024).toFixed(2)} MB
                                                                </span>
                                                            )}
                                                            <span className="file-date">
                                                                <FontAwesomeIcon icon={faCalendarAlt} />
                                                                {new Date(archivo.fecha_subida).toLocaleDateString("es-CO")}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="archivo-actions">
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
                                                            {archivo.tipo_contenido != "link" && (
                                                                <a
                                                                    className="action-btn download-btn"
                                                                    href={`http://localhost:3001${archivo.contenido}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    download
                                                                >
                                                                    <FontAwesomeIcon icon={faDownload} />
                                                                    <span>Descargar</span>
                                                                </a>
                                                            )}

                                                            {puedeEliminarArchivos && (
                                                                <div className="manage-actions">
                                                                    {(archivo.tipo_contenido === "link") && (
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
                        )}
                    </div>
                </div>
            </Main>
            <Footer />

            {/* MODAL REDISEÑADO - ESTILOS UNIFICADOS */}
            {showMaterialCreation && (
                <div className="modal-overlay-support">
                    <div className="modal-container-support">
                        <div className="modal-header-support">
                            <div className="header-content-support">
                                <h2>
                                    <FontAwesomeIcon icon={faCloudUploadAlt} className="header-icon-support" />
                                    Nuevo Material de Apoyo
                                </h2>
                                <button 
                                    type="button" 
                                    onClick={() => setShowMaterialCreation(false)}
                                    className="close-btn-support"
                                >
                                    <FontAwesomeIcon icon={faArrowLeft} />
                                    <span>Volver</span>
                                </button>
                            </div>
                        </div>

                        <div className="modal-body-support">
                            <div className="modal-content-support">
                                <div className="form-section-support">
                                    <h3 className="section-title-support">
                                        <FontAwesomeIcon icon={faBookOpen} />
                                        Curso Seleccionado
                                    </h3>
                                    <div className="course-info-support">
                                        <span className="course-name-support">{cursoSeleccionado?.nombre_curso}</span>
                                    </div>
                                </div>

                                <div className="form-section-support">
                                    <h3 className="section-title-support">
                                        <FontAwesomeIcon icon={faFileAlt} />
                                        Tipo de Material
                                    </h3>
                                    <div className="material-type-selector-support">
                                        {["PDF", "Video", "Enlace"].map((t) => (
                                            <button
                                                key={t}
                                                className={`type-option-support ${materialType === t ? 'active' : ''}`}
                                                onClick={() => {
                                                    setMaterialType(t);
                                                    setPendingFiles([]);
                                                    setPendingLinks([]);
                                                    setMaterial("");
                                                }}
                                            >
                                                <div className="type-icon-support">
                                                    {t === "PDF" && <FontAwesomeIcon icon={faFilePdf} />}
                                                    {t === "Video" && <FontAwesomeIcon icon={faVideo} />}
                                                    {t === "Enlace" && <FontAwesomeIcon icon={faLink} />}
                                                </div>
                                                <span className="type-label-support">{t}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-section-support">
                                    <h3 className="section-title-support">
                                        <FontAwesomeIcon icon={faCloudUploadAlt} />
                                        {(materialType === "PDF" || materialType === "Video")
                                            ? `Subir ${materialType === "PDF" ? "Archivos PDF" : "Videos"}`
                                            : "Agregar Enlaces"}
                                    </h3>

                                    {(materialType === "PDF" || materialType === "Video") ? (
                                        <>
                                            <div className="upload-area-support">
                                                <input
                                                    id="file-upload-support"
                                                    type="file"
                                                    multiple
                                                    onChange={handleFileUpload}
                                                    disabled={subiendoArchivo}
                                                    ref={fileInputRef}
                                                    className="file-input-support"
                                                    accept={materialType === "PDF" ? ".pdf" : "video/*"}
                                                />
                                                <label htmlFor="file-upload-support" className="upload-dropzone-support">
                                                    <FontAwesomeIcon icon={faCloudUploadAlt} className="upload-icon-support" />
                                                    <div className="upload-text-support">
                                                        <p className="upload-title-support">Haz clic para subir archivos</p>
                                                        <p className="upload-subtitle-support">
                                                            Arrastra o selecciona archivos {materialType === "PDF" ? "PDF" : "de video"}
                                                        </p>
                                                        <p className="upload-hint-support">
                                                            Formatos: {materialType === "PDF" ? ".pdf" : ".mp4, .avi, .mov"}
                                                        </p>
                                                    </div>
                                                </label>
                                            </div>

                                            {pendingFiles.length > 0 && (
                                                <div className="pending-files-support">
                                                    <h4 className="pending-title-support">
                                                        Archivos seleccionados ({pendingFiles.length})
                                                    </h4>
                                                    <div className="pending-list-support">
                                                        {pendingFiles.map((f, idx) => (
                                                            <div key={`${idx}-${f.name}`} className="pending-item-support">
                                                                <div className="pending-item-info-support">
                                                                    <FontAwesomeIcon
                                                                        icon={materialType === "PDF" ? faFilePdf : faVideo}
                                                                        className={`pending-icon-support ${materialType.toLowerCase()}`}
                                                                    />
                                                                    <div className="pending-details-support">
                                                                        <span className="pending-name-support">{truncarNombreArchivo(f.name, 30)}</span>
                                                                        <span className="pending-size-support">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type='button'
                                                                    className='remove-btn-support'
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
                                        <div className="links-input-support">
                                            <div className="link-input-group-support">
                                                <input
                                                    className="link-input-support"
                                                    type="text"
                                                    placeholder='https://ejemplo.com/material'
                                                    value={material}
                                                    onChange={(e) => setMaterial(e.target.value)}
                                                    disabled={subiendoArchivo}
                                                />
                                                <button
                                                    type='button'
                                                    className='add-link-btn-support'
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
                                                <div className="pending-links-support">
                                                    <h4 className="pending-title-support">
                                                        Enlaces agregados ({pendingLinks.length})
                                                    </h4>
                                                    <div className="pending-list-support">
                                                        {pendingLinks.map((l, idx) => (
                                                            <div key={`${idx}-${l}`} className="pending-item-support">
                                                                <div className="pending-item-info-support">
                                                                    <FontAwesomeIcon 
                                                                        icon={faLink} 
                                                                        className="pending-icon-support link" 
                                                                    />
                                                                    <input
                                                                        className='link-edit-input-support'
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
                                                                    className='remove-btn-support'
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
                                    <div className="modal-actions-support">
                                        <button
                                            className="submit-btn-support secondary"
                                            onClick={() => {
                                                setShowMaterialCreation(false);
                                                setPendingFiles([]);
                                                setPendingLinks([]);
                                                setMaterial("");
                                            }}
                                            disabled={subiendoArchivo}
                                        >
                                            <FontAwesomeIcon icon={faTimes} />
                                            <span>Cancelar</span>
                                        </button>
                                        <button
                                            className="submit-btn-support primary"
                                            onClick={crearMaterial}
                                            disabled={subiendoArchivo || 
                                                ((materialType === "PDF" || materialType === "Video") && pendingFiles.length === 0) ||
                                                (materialType === "Enlace" && pendingLinks.length === 0 && material.trim().length === 0)}
                                        >
                                            {subiendoArchivo ? (
                                                <>
                                                    <FontAwesomeIcon icon="spinner" spin />
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
}