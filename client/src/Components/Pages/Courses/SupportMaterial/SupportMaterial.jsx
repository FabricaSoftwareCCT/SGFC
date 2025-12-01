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

export const SupportMaterial = () => {
	const { curso } = useParams()

	const navigate = useNavigate();
	
	const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
	const [editingMaterial, setEditingMaterial] = useState(false)
	const [subiendoArchivo, setSubiendoArchivo] = useState(false);
	const [showMaterialCreation, setShowMaterialCreation] = useState(false);
	const [tipoUsuario, setTipoUsuario] = useState('');
	const [materialType, setMaterialType] = useState("PDF");
	const [material, setMaterial] = useState("");
	const [cursos, setCursos] = useState([]);
	const [archivos, setArchivos] = useState([]);
    const [uploadFile, setUploadFile] = useState()
    const [pendingFiles, setPendingFiles] = useState([]); // archivos seleccionados aún no enviados
    const [pendingLinks, setPendingLinks] = useState([]); // enlaces agregados aún no enviados
    const fileInputRef = useRef(null);



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
				confirmButtonText:"Entendido",
                confirmButtonColor:"#00843d",
                        theme: 'bulma',
        				customClass: {
    				actions: 'swal2-center-actions'
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
				confirmButtonColor:"#00843d",
                        theme: 'bulma',
        		customClass: {
    		actions: 'swal2-center-actions'
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
			text: "¿Quieres eliminar este archivo? Esta acción no se puede deshacer.",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Sí, eliminar',
			confirmButtonColor:"#006f33",
			cancelButtonText: 'Cancelar',
			cancelButtonColor:"#c63223",
			theme:"bulma",
			customClass:{
        actions: 'swal2-actions-centered'
			}
		}).then((result) => {
			if (result.isConfirmed) {
				eliminarMaterial(archivoId)
			}
		});
	}

	const truncarNombreArchivo = (nombre, maxLongitud = 15) => {
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

		return `${nombreParte.slice(0, maxLongitud)}... ${extension}`;
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
						confirmButtonColor:"#00843d",
						confirmButtonText:"Entendido",
                        theme: 'bulma',
        		customClass: {
    		actions: 'swal2-center-actions'
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
						confirmButtonText:"Entendido",
						confirmButtonColor:"#00843d",
                        theme: 'bulma',
        		customClass: {
    		actions: 'swal2-center-actions'
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
                    title: 'Éxito',
                    text: firstMsg,
				confirmButtonText:"Okay",
				confirmButtonColor:"#00843d",
                    theme: 'bulma',
        		customClass: {
    		actions: 'swal2-center-actions'
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
			confirmButtonText:"Entendido",
			confirmButtonColor:"#00843d",
                        theme: 'bulma',
        		customClass: {
    		actions: 'swal2-center-actions'
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
						confirmButtonText:"Entendido",
						confirmButtonColor:"#00843d",
                        theme: 'bulma',
        		customClass: {
    		actions: 'swal2-center-actions'
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
						title: 'Éxito',
						text: resp.data.message,
						confirmButtonText:"Entendido",
						confirmButtonColor:"#00843d",
                        theme: 'bulma',
        		customClass: {
    		actions: 'swal2-center-actions'
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
				confirmButtonText:"Entendido",
				confirmButtonColor:"#00843d",
                    theme: 'bulma',
        		customClass: {
    		actions: 'swal2-center-actions'
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
				title: 'Eliminado',
				text: resp.data.message,
				confirmButtonText:"Entendido",
				confirmButtonColor:"#00843d",
                        theme: 'bulma',
        		customClass: {
    		actions: 'swal2-center-actions'
        }
			});
		} catch (error) {
			console.log(error)
			Swal.fire({
				icon: 'error',
				title: 'Error',
				text: 'Ocurrió un error al eliminar el material de apoyo',
				confirmButtonText:"Entendido",
				confirmButtonColor:"#00843d",
                    theme: 'bulma',
        		customClass: {
    		actions: 'swal2-center-actions'
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
		void Swal.fire({
			...swalConfig,
			icon: 'info',
			title: 'Sin permisos',
			text: 'Solo el instructor asignado o un administrador/gestor puede modificar el material de este curso.',
		});
	};

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

			void fetchAssignments();
		} else {
			setAssignedCourseIds(new Set());
		}
	}, [isInstructor, userId]);

	return (
        <>
            <Header />
            <Main className="support-main">
                <div className="support-container">
                    <div className='support-content'>
                        <div className='support-cursos'>
                            <h2>Selecciona un Curso</h2>
                            <div className='support-cursos-grid'>
                                {cursos.map(curso => (
                                    <div 
                                        key={curso.ID} 
                                        className={`support-curso-card ${cursoSeleccionado?.ID === curso.ID ? 'selected' : ''}`}
                                        onClick={() => handleSeleccionarCurso(curso)}
                                    >
                                        <h3>
                                            {curso.nombre_curso}<br />
                                            Ficha: {curso.ficha}<br />
                                            Estado: {curso.estado}
                                        </h3>
                                    </div>     
                                ))}
                            </div>
                        </div>
                        
                        {cursoSeleccionado && (
                            <div className='support-archivos'>
                                <div className='support-archivos-header'>
                                    <h2>Material de Apoyo - {cursoSeleccionado.nombre_curso}</h2>
                                    {puedeSubirArchivos && (
                                        <button
                                            className='support-upload-btn'
                                            onClick={() => setShowMaterialCreation(true)}
                                        >
                                            Crear material
                                        </button>
                                    )}  
                                </div>
                                
                                <div className='support-archivos-list'>
                                    {archivos.length === 0 ? (
                                        <p className='support-no-archivos'>No hay archivos subidos a este curso</p>
                                    ) : (
                                        archivos.map(archivo => (
                                            <div key={archivo.id} className='support-archivo-item'>
                                                <div className='support-archivo-info'>
                                                    {archivo.tipo_contenido != "link" ? (
                                                        <>
                                                            <span className='support-archivo-nombre'>
                                                                {truncarNombreArchivo(archivo.nombre_original, 12)}
                                                            </span>
                                                            <span className='support-archivo-detalles'>
                                                                {(archivo.tamanio / 1024 / 1024).toFixed(2)}MB - Subido el {new Date(archivo.fecha_subida).toLocaleDateString("es-CO")}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        editingMaterial && archivo.ID == editingMaterial.ID ?
                                                            <input
                                                                className='support-material-input'
                                                                type='text'
                                                                value={editingMaterial.contenido}
                                                                onChange={(e) => {
                                                                    setEditingMaterial({
                                                                        ...editingMaterial,
                                                                        contenido: e.target.value
                                                                    })
                                                                }}
                                                            />
                                                        :
                                                            <a
                                                                className="support-material-link"
                                                                href={archivo.contenido}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                {archivo.contenido}
                                                            </a>
                                                    )}
                                                </div>
                                                
                                                <div className='support-archivo-actions'>  
                                                    {editingMaterial && archivo.ID == editingMaterial.ID ? (
                                                        <>
                                                            <button
                                                                className='support-btn support-btn-editar'
                                                                onClick={() => editarMaterial()}
                                                            >
                                                                Guardar
                                                            </button>
                                                            <button 
                                                                className='support-btn support-btn-eliminar' 
                                                                onClick={() => setEditingMaterial(null)}
                                                            >
                                                                Cancelar
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {(puedeEliminarArchivos && archivo.tipo_contenido === "link") && (
                                                                <button
                                                                    className='support-btn support-btn-editar'
                                                                    onClick={() => setEditingMaterial(archivo)}
                                                                >
                                                                    Editar
                                                                </button>
                                                            )}
                                                            
                                                            {archivo.tipo_contenido != "link" && (
                                                                <a 
                                                                    className='support-btn support-btn-descargar' 
                                                                    href={`http://localhost:3001${archivo.contenido}`} 
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    download
                                                                >
                                                                    Descargar
                                                                </a>
                                                            )}
                                                            
                                                            {puedeEliminarArchivos && (
                                                                <button 
                                                                    className='support-btn support-btn-eliminar' 
                                                                    onClick={() => handleEliminarArchivo(archivo.ID)}
                                                                >
                                                                    Eliminar
                                                                </button>
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
            <Footer/>
            
            {showMaterialCreation && (
                <div className="support-modal-overlay">
                    <div className="support-modal">
                        <div className="support-modal-header">
                            <h2 className="support-modal-title">Crear material de apoyo</h2>
                            <button 
                                className="support-close-btn"
                                onClick={() => setShowMaterialCreation(false)}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <span style={{ color: '#fff', display: 'block', marginBottom: '0.5rem' }}>
                                Tipo de material
                            </span>
                            <div className="support-type-buttons">
                                {["PDF", "Video", "Enlace"].map((t) => (
                                    <button
                                        key={t}
                                        className={`support-type-btn ${materialType == t ? 'selected' : ''}`}
                                        onClick={() => setMaterialType(t)}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <span style={{ color: '#fff', display: 'block', marginBottom: '0.5rem' }}>
                                Material
                            </span>
                            
                            {(materialType === "PDF" || materialType === "Video") && (
                                <>
                                    <label
                                        htmlFor='file-upload'
                                        className='support-upload-btn'
                                        style={{ display: 'inline-block', marginBottom: '1rem' }}
                                    >
                                        Subir archivo(s)
                                    </label>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        multiple
                                        onChange={handleFileUpload}
                                        disabled={subiendoArchivo}
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                    />
                                </>
                            )}
                            
                            {materialType === "Enlace" && (
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <input
                                        className="support-material-input"
                                        type="text"
                                        placeholder='Ponga aquí el enlace al material...'
                                        onChange={(e) => setMaterial(e.target.value)}
                                        value={material}
                                    />
                                    <button 
                                        type='button' 
                                        className='support-upload-btn' 
                                        style={{ flex: 'none' }}
                                        onClick={() => {
                                            if ((material || '').trim().length > 0) {
                                                setPendingLinks((prev)=> [...prev, material.trim()]);
                                                setMaterial('');
                                            }
                                        }}
                                    >
                                        Agregar
                                    </button>
                                </div>
                            )}
                            
                            {(materialType === "PDF" || materialType === "Video") && pendingFiles.length > 0 && (
                                <div>
                                    <span style={{ color: '#cfe9da', display: 'block', marginBottom: '0.5rem' }}>
                                        Archivos seleccionados ({pendingFiles.length}):
                                    </span>
                                    <ul className="support-pending-list">
                                        {pendingFiles.map((f, idx) => (
                                            <li key={`${idx}-${f.name}`} className="support-pending-item">
                                                <span className="support-pending-text">{f.name}</span>
                                                <button 
                                                    type='button' 
                                                    className='support-btn support-btn-eliminar'
                                                    onClick={() => setPendingFiles((prev)=> prev.filter((_,i)=> i!==idx))}
                                                >
                                                    X
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            
                            {materialType === "Enlace" && pendingLinks.length > 0 && (
                                <div>
                                    <span style={{ color: '#cfe9da', display: 'block', marginBottom: '0.5rem' }}>
                                        Enlaces agregados ({pendingLinks.length}):
                                    </span>
                                    <ul className="support-pending-list">
                                        {pendingLinks.map((l, idx) => (
                                            <li key={`${idx}-${l}`} className="support-pending-item">
                                                <input 
                                                    className='support-material-input' 
                                                    type='text' 
                                                    value={l} 
                                                    onChange={(e)=> {
                                                        const copy = [...pendingLinks];
                                                        copy[idx] = e.target.value;
                                                        setPendingLinks(copy);
                                                    }} 
                                                />
                                                <button 
                                                    type='button' 
                                                    className='support-btn support-btn-eliminar'
                                                    onClick={()=> setPendingLinks((prev)=> prev.filter((_,i)=> i!==idx))}
                                                >
                                                    X
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        
                        {puedeSubirArchivos && (
                            <button
                                className='support-upload-btn'
                                style={{ width: '100%' }}
                                disabled={subiendoArchivo}
                                onClick={() => crearMaterial()}
                            >
                                {subiendoArchivo ? 'Subiendo...' : 'Crear material'}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}