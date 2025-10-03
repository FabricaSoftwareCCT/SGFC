import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../../Layouts/Header/Header';
import { Footer } from '../../../Layouts/Footer/Footer';
import { Main } from '../../../Layouts/Main/Main';
import './SupportMaterialCourse.css'

export const SupportMaterialCourse = () => {
    const navigate = useNavigate();
    const [subiendoArchivo, setSubiendoArchivo] = useState(false);
    const [tipoUsuario, setTipoUsuario] = useState('')

    
    const cursoActual = {
        ID: 1, 
        nombre_curso: "Curso Actual", 
        ficha: "F2024001",
        estado: "Activo"
    };
    
    const archivosEjemplo = [
        {
            id: 1,
            nombre_original: "Guía de React.pdf",
            tamanio: 2500000,
            fecha_subida: "2024-01-15"
        },
        {
            id: 2,
            nombre_original: "Ejercicios prácticos.docx",
            tamanio: 1500000,
            fecha_subida: "2024-01-16"
        }
    ];

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setSubiendoArchivo(true);
        setTimeout(() => {
            setSubiendoArchivo(false);
            alert(`Archivo "${file.name}" subido exitosamente`);
        }, 2000);
    }
        
    const handleDescargarArchivo = (archivo) => {
        alert(`Descargando: ${archivo.nombre_original}`);
    }
    
    const handleEliminarArchivo = (archivoId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este archivo?')) {
            alert(`Archivo ${archivoId} eliminado (simulación)`);
        }
    }

    const esAprendiz =tipoUsuario === 'Aprendiz';
    const puedeSubirArchivos = !esAprendiz;
    const puedeEliminarArchivos = !esAprendiz;

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
                                <h2>Material de Apoyo - {cursoActual.nombre_curso}</h2>

                                {puedeSubirArchivos &&(
                                    <div className='upload-section-c'>
                                    <label htmlFor='file-upload' className='upload-btn-c'>
                                        {subiendoArchivo ? 'Subiendo...' : 'Subir Archivo'}
                                    </label>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        onChange={handleFileUpload}
                                        disabled={subiendoArchivo}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                                )} 
                            </div>

                            <div className='archivos-list-c'>
                                {archivosEjemplo.length === 0 ? (
                                    <p className='no-archivos'>No hay archivos subidos a este curso</p>
                                ) : (
                                    archivosEjemplo.map(archivo => (
                                        <div key={archivo.id} className='archivo-item-c'>
                                            <div className='archivo-info-c'>
                                                <span className='archivo-nombre-c'>{archivo.nombre_original}</span>
                                                <span className='archivo-detalles-c'>
                                                    {(archivo.tamanio / 1024 / 1024).toFixed(2)}MB - Subido el {archivo.fecha_subida}
                                                </span>
                                            </div>   
                                            <div className='archivo-actions-c'>
                                                <button 
                                                    className='btn-descargar' 
                                                    onClick={() => handleDescargarArchivo(archivo)}
                                                >
                                                    Descargar
                                                </button>

                                                {puedeEliminarArchivos && (
                                                    <button 
                                                    className='btn-eliminar' 
                                                    onClick={() => handleEliminarArchivo(archivo.id)}
                                                >
                                                    Eliminar
                                                </button>
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
        </>
    );
}