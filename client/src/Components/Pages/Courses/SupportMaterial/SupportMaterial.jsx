import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../../Layouts/Header/Header';
import { Footer } from '../../../Layouts/Footer/Footer';
import { Main } from '../../../Layouts/Main/Main';
import './SupportMaterial.css';

export const SupportMaterial = () => {
    const navigate = useNavigate();
    const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
    const [subiendoArchivo, setSubiendoArchivo] = useState(false);

    const cursos = [
        {
            ID: 1,
            nombre_curso: "Curso de React Básico",
            ficha: "F2024001",
            estado: "Activo"
        },
        {
            ID: 2,
            nombre_curso: "Curso de JavaScript Avanzado",
            ficha: "F2024002",
            estado: "Activo"
        },
        {
            ID: 3,
            nombre_curso: "Curso de Node.js",
            ficha: "F2024003",
            estado: "En progreso"
        }
    ];
    
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

    const handleSeleccionarCurso = (curso) => {
        setCursoSeleccionado(curso);
    }

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file || !cursoSeleccionado) return;

        setSubiendoArchivo(true);
        // Simular subida de archivo
        setTimeout(() => {
            setSubiendoArchivo(false);
            alert(`Archivo "${file.name}" subido exitosamente`);
        }, 2000);
    }
        
    const handleDescargarArchivo = (archivo) => {
        alert(`Descargando: ${archivo.nombre_original}\n\nEl backend manejaría la descarga real.`);
    }
    
    const handleEliminarArchivo = (archivoId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este archivo?')) {
            alert(`Archivo ${archivoId} eliminado (simulación)`);
        }
    }

    return (
        <>
            <Header />
            <Main className="material-main">
                <div className="material-container">
                    <div className="material-header">
                        <h1>Material de Apoyo</h1>
                        <button className='btn-volver' onClick={() => navigate(-1)}>Volver al Curso</button>
                    </div>
                    <div className='material-content'>
                        <div className='cursos-section'>
                            <h2>Selecciona un Curso</h2>
                            <div className='cursos-grid'>
                                {cursos.map(curso => (
                                    <div 
                                        key={curso.ID} 
                                        className={`curso-card ${cursoSeleccionado?.ID === curso.ID ? 'selected' : ''}`}
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
                            <div className='archivos-section'>
                                <div className='archivos-header'>
                                    <h2>Material de Apoyo - {cursoSeleccionado.nombre_curso}</h2>
                                    <div className='upload-section'>
                                        <label htmlFor='file-upload' className='upload-btn'>
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
                                </div>

                                <div className='archivos-list'>
                                    {archivosEjemplo.length === 0 ? (
                                        <p className='no-archivos'>No hay archivos subidos a este curso</p>
                                    ) : (
                                        archivosEjemplo.map(archivo => (
                                            <div key={archivo.id} className='archivo-item'>
                                                <div className='archivo-info'>
                                                    <span className='archivo-nombre'>{archivo.nombre_original}</span>
                                                    <span className='archivo-detalles'>
                                                        {(archivo.tamanio / 1024 / 1024).toFixed(2)}MB - Subido el {archivo.fecha_subida}
                                                    </span>
                                                </div>   
                                                <div className='archivo-actions'>
                                                    <button 
                                                        className='btn-descargar' 
                                                        onClick={() => handleDescargarArchivo(archivo)}
                                                    >
                                                        Descargar
                                                    </button>
                                                    <button 
                                                        className='btn-eliminar' 
                                                        onClick={() => handleEliminarArchivo(archivo.id)}
                                                    >
                                                        Eliminar
                                                    </button>
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
        </>
    );
}