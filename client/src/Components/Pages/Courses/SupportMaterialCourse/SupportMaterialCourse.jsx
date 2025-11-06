import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../../../Layouts/Header/Header';
import { Main } from '../../../Layouts/Main/Main';
import './SupportMaterialCourse.css'
import axiosInstance from '../../../../config/axiosInstance';

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
    const userSession =
        JSON.parse(localStorage.getItem('userSession')) ||
        JSON.parse(sessionStorage.getItem('userSession'));

    const accountType = (userSession?.accountType || '').toLowerCase();
    const isLoggedIn = !!userSession?.accountType;
    const rolesPermitidos = ['administrador', 'instructor', 'gestor'];
    const hasPrivilegedRole = rolesPermitidos.includes(accountType);
    // Solo usuarios autenticados con rol privilegiado pueden crear/editar/eliminar
    const puedeSubirArchivos = isLoggedIn && hasPrivilegedRole;
    const puedeEliminarArchivos = isLoggedIn && hasPrivilegedRole;
    const puedeEditarMaterial = isLoggedIn && hasPrivilegedRole;

    const fetchCurso = async () => {
        try {
            const resp = await axiosInstance.get(`api/courses/cursos/${id}`);
            setCursoActual(resp.data);
        } catch (e) { console.error('Error al consultar curso', e); }
    };

    const fetchMaterial = async () => {
        try {
            const resp = await axiosInstance.get(`/api/material/${id}`);
            setArchivos(Array.isArray(resp.data.materiales) ? resp.data.materiales : []);
        } catch (e) {
            console.error('Error al consultar material', e);
            setArchivos([]);
        }
    };
    // co

    const onLocalFilePicked = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) setPendingFiles((prev)=> [...prev, ...files]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const crearMaterial = async () => {
        setSubiendoArchivo(true);
        try {
            let requests = [];
            if (materialType === 'PDF' || materialType === 'Video') {
                const fieldName = materialType === 'PDF' ? 'document_pdf' : 'video';
                const tipo = materialType.toLowerCase();
                if (pendingFiles.length === 0) { alert(`Selecciona uno o más archivos ${materialType}`); setSubiendoArchivo(false); return; }
                requests = pendingFiles.map((file) => {
                    const body = new FormData();
                    body.append(fieldName, file);
                    body.append('tipo', tipo);
                    return axiosInstance.post(`/api/material/create/${id}`, body, { headers: { 'Content-Type': 'multipart/form-data' } });
                });
            } else if (materialType === 'Enlace') {
                const linksToSend = pendingLinks.filter((l)=> (l||'').trim().length > 0);
                if (linksToSend.length === 0 && material.length > 0) linksToSend.push(material);
                if (linksToSend.length === 0) { alert('Agrega uno o más enlaces'); setSubiendoArchivo(false); return; }
                requests = linksToSend.map((link)=> axiosInstance.post(`/api/material/create/${id}`, { tipo: 'enlace', link }));
            }
            const responses = await Promise.all(requests);
            const firstMsg = responses[0]?.data?.message;
            if (firstMsg) alert(firstMsg);
            setShowMaterialCreation(false);
            setPendingFiles([]);
            setPendingLinks([]);
            setMaterial('');
            await fetchMaterial();
        } catch (e) {
            alert('Ocurrió un error al crear el material de apoyo');
        } finally {
            setSubiendoArchivo(false);
        }
    };

    const handleEliminarArchivo = async (archivoId) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este archivo?')) return;
        try {
            await axiosInstance.delete(`/api/material/delete/${archivoId}`);
            setArchivos((prev) => prev.filter((a) => a.ID !== archivoId));
        } catch (e) {
            alert('Error al eliminar el material');
        }
    };

    const editarMaterial = async () => {
        try {
            if (editingMaterial?.tipo_contenido === 'link') {
                if (!editingMaterial.contenido) { alert('Se debe proporcionar un enlace'); return; }
                const resp = await axiosInstance.put(`/api/material/update/${editingMaterial.ID}`, { link: editingMaterial.contenido });
                await fetchMaterial();
                if (resp?.data?.message) alert(resp.data.message);
            }
        } catch {
            alert('Ocurrió un error al actualizar el material de apoyo');
        } finally {
            setEditingMaterial(null);
        }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        fetchCurso();
        fetchMaterial();
    }, [id]);

    return (
        <>
            <Header />
            <Main className="material-main">
                <div className="material-container-c">
                    <div className="material-header">
                        <h1 className='title-material'>Material de Apoyo</h1>
                    </div>
                     <div>
                        <button className='btn-back-c' onClick={() => navigate(-1)}>Volver al Curso</button>
                        </div>
                    <div className='material-content-c'>
                        {/* Solo mostramos la sección de archivos */}
                        <div className='archivos-section-c'>
                            <div className='archivos-header-c'>
                                <h2>Material de Apoyo - {cursoActual?.nombre_curso || 'Curso'}</h2>

                                {puedeSubirArchivos &&(
                                    <div className='upload-section-c'>
                                    <button className='upload-btn-c' onClick={() => setShowMaterialCreation(true)} disabled={subiendoArchivo}>
                                        {subiendoArchivo ? 'Subiendo...' : 'Crear material'}
                                    </button>
                                </div>
                                )} 
                            </div>

                            <div className='archivos-list-c'>
                                {archivos.length === 0 ? (
                                    <p className='no-archivos'>No hay archivos subidos a este curso</p>
                                ) : (
                                    archivos.map((archivo) => (
                                        <div key={archivo.ID} className='archivo-item-c'>
                                            <div className='archivo-info-c'>
                                                {archivo.tipo_contenido !== 'link' ? (
                                                    <>
                                                        <span className='archivo-nombre-c'>{archivo.nombre_original}</span>
                                                        <span className='archivo-detalles-c'>
                                                            {(archivo.tamanio / 1024 / 1024).toFixed(2)}MB - Subido el {new Date(archivo.fecha_subida).toLocaleDateString('es-CO')}
                                                        </span>
                                                    </>
                                                ) : (
                                                    editingMaterial && editingMaterial.ID === archivo.ID ? (
                                                        <input
                                                            className='material-link'
                                                            type='text'
                                                            value={editingMaterial.contenido}
                                                            onChange={(e)=> setEditingMaterial({...editingMaterial, contenido: e.target.value})}
                                                        />
                                                    ) : (
                                                        <a
                                                            className='material-link'
                                                            href={archivo.contenido}
                                                            target='_blank'
                                                            rel='noopener noreferrer'
                                                        >
                                                            {archivo.contenido}
                                                        </a>
                                                    )
                                                )}
                                            </div>
                                            <div className='archivo-actions-c'>
                                                {archivo.tipo_contenido !== 'link' && (
                                                    <a
                                                        className='btn-descargar'
                                                        href={`http://localhost:3001${archivo.contenido}`}
                                                        target='_blank'
                                                        rel='noopener noreferrer'
                                                        download
                                                    >
                                                        Descargar
                                                    </a>
                                                )}
                                                {puedeEliminarArchivos && puedeEditarMaterial && (
                                                    editingMaterial && editingMaterial.ID === archivo.ID ? (
                                                        <>
                                                            <button className='btn-editar' onClick={editarMaterial}>Guardar</button>
                                                            <button className='btn-eliminar' onClick={()=> setEditingMaterial(null)}>Cancelar</button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {archivo.tipo_contenido === 'link' && (
                                                                <button className='btn-editar' onClick={()=> setEditingMaterial(archivo)}>Editar</button>
                                                            )}
                                                            <button className='btn-eliminar' onClick={() => handleEliminarArchivo(archivo.ID)}>Eliminar</button>
                                                        </>
                                                    )
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
            {showMaterialCreation && (
                <div id="modal-overlayUpdateInstructor" style={{ display: 'flex' }}>
                    <div className="modal-bodyUpdateInstructor" style={{ flexDirection: 'column' }}>
                        <div className="container_return_UpdateInstructor">
                            <h5>Volver</h5>
                            <button type="button" onClick={() => setShowMaterialCreation(false)} className="closeModal"></button>
                        </div>
                        <h2 className="modal-title-edit-calendar">Crear material de apoyo</h2>
                        <br/>
                        <span>Tipo de material</span>
                        <div className="statusButtons" style={{ width: '90%' }}>
                            {['PDF','Video','Enlace'].map((t)=> (
                                <button key={t} className={`status-btn ${materialType === t ? 'selected' : ''}`} onClick={()=> setMaterialType(t)}>{t}</button>
                            ))}
                        </div>
                        <br/>
                        <span>Material</span>
                        {(materialType === 'PDF' || materialType === 'Video') && (
                            <>
                <label htmlFor='file-upload' className='upload-btn' style={{ flex: 'none' }}>Subir archivo(s)</label>
                <input id='file-upload' ref={fileInputRef} type='file' multiple onChange={onLocalFilePicked} disabled={subiendoArchivo} style={{ display: 'none' }} />
                            </>
                        )}
                        {materialType === 'Enlace' && (
                            <div className='statusButtons' style={{ width: '90%', gap: 8, flexDirection: 'column' }}>
                                <div style={{ display: 'flex', gap: 8, minHeight: 44 }}>
                                    <input className='inputFilterOptionText' type='text' placeholder='Ponga aquí el enlace al material...' onChange={(e)=> setMaterial(e.target.value)} value={material} />
                                    <button type='button' className='upload-btn' style={{ flex: 'none', height: 44 }} onClick={(e)=> { e.preventDefault(); e.stopPropagation(); if ((material||'').trim().length>0) { setPendingLinks((prev)=>[...prev, material.trim()]); setMaterial(''); } }}>Agregar</button>
                                </div>
                                {pendingLinks.length > 0 && (
                                    <ul style={{
                                        listStyle: 'none',
                                        padding: 8,
                                        margin: 0,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 6,
                                        maxHeight: 84,
                                        overflowY: 'auto',
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        borderRadius: 8
                                    }}>
                                        {pendingLinks.map((l, idx)=> (
                                            <li key={`${idx}-${l}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <input className='inputFilterOptionText' type='text' value={l} onChange={(e)=> {
                                                    const copy = [...pendingLinks];
                                                    copy[idx] = e.target.value;
                                                    setPendingLinks(copy);
                                                }} />
                                            <button type='button' className='btn-eliminar' onClick={()=> setPendingLinks((prev)=> prev.filter((_,i)=> i!==idx))}>X</button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                        {(materialType === 'PDF' || materialType === 'Video') && pendingFiles.length > 0 && (
                            <div style={{ width: '90%', marginTop: 12, maxHeight: 20 }}>
                                <span style={{ color: '#cfe9da' }}>Archivos seleccionados ({pendingFiles.length}):</span>
                                <ul style={{
                                    listStyle: 'none',
                                    padding: 8,
                                    marginTop: 6,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 6,
                                    maxHeight: 84,
                                    overflowY: 'auto',
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    borderRadius: 8
                                }}>
                                    {pendingFiles.map((f, idx)=> (
                                        <li key={`${idx}-${f.name}`} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}>
                                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                                            <button type='button' className='btn-eliminar' onClick={(e)=> { e.preventDefault(); e.stopPropagation(); setPendingFiles((prev)=> prev.filter((_,i)=> i!==idx)); }}>X</button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <br/>
                        <button className='upload-btn' style={{ flex: 'none' }} disabled={subiendoArchivo} onClick={crearMaterial}>Crear material</button>
                    </div>
                </div>
            )}
        </>
    );
}