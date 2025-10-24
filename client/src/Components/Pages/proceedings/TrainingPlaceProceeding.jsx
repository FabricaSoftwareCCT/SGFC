import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import './trainingPlaceProceeding.css';
import { Header } from "../../Layouts/Header/Header";
import { Footer } from '../../Layouts/Footer/Footer';
import { Main } from '../../Layouts/Main/Main';
import axiosInstance from '../../../config/axiosInstance';
import html2pdf from 'html2pdf.js';
import { ModalSignature } from '../../UI/Modal_Signature/ModalSignature';
import { EditableList } from '../../UI/EditableList/EditableList';
import { useNavigate } from 'react-router-dom';

export const TrainingPlaceProceeding = () => {
    const navigate = useNavigate();
    const { nombreCurso: nombreCursoParam } = useParams();

    const [empresa, setEmpresa] = useState(null);
    const [manager, setManager] = useState(null);
    const [usuarioLogueado, setUsuarioLogueado] = useState(null); // Para almacenar info completa del usuario

    // Inicializa el nombre del curso con el parámetro de la URL si existe
    const [nombreCurso, setNombreCurso] = useState(
        nombreCursoParam ? decodeURIComponent(nombreCursoParam) : ''
    );
    const [numEmpleados, setNumEmpleados] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // Validación de fechas
    const [dateError, setDateError] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [exportValues, setExportValues] = useState({
        nombreCurso: '',
        numEmpleados: '',
        fechaInicio: '',
        fechaFin: ''
    });

    const [observaciones, setObservaciones] = useState("");

    const pdfRef = useRef();

    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [firmaDigital, setFirmaDigital] = useState("");
    const [firmaArchivo, setFirmaArchivo] = useState(null);
    const [firmaArchivoUrl, setFirmaArchivoUrl] = useState(""); // Nuevo estado
    const [instructores, setInstructores] = useState([]);
    const [instructoresAsignados, setInstructoresAsignados] = useState([]);
    const [participantes, setParticipantes] = useState([]);
    const [generatedPdfName, setGeneratedPdfName] = useState('');

    //  Estados para manejo individual de firmas
    const [firmasParticipantes, setFirmasParticipantes] = useState({});
    const [participanteSeleccionado, setParticipanteSeleccionado] = useState(null);

    //  Funciones para manejo individual de firmas
    const handleAbrirModalFirma = (participanteId, participanteNombre) => {
        setParticipanteSeleccionado({ id: participanteId, nombre: participanteNombre });
        setShowSignatureModal(true);
    };

    const handleAplicarFirma = (firmaData) => {
        if (participanteSeleccionado) {
            setFirmasParticipantes(prev => ({
                ...prev,
                [participanteSeleccionado.id]: {
                    nombre: participanteSeleccionado.nombre,
                    firma: firmaData
                }
            }));
            setParticipanteSeleccionado(null);
            setShowSignatureModal(false);
        }
    };

    const handleLimpiarFirma = (participanteId) => {
        setFirmasParticipantes(prev => {
            const nuevasFirmas = { ...prev };
            delete nuevasFirmas[participanteId];
            return nuevasFirmas;
        });
    };

    // Función para manejar cuando se sube un archivo de firma
    const handleUploadSignature = (file) => {
        setFirmaArchivo(file);
        // Crear URL para mostrar la imagen subida
        const fileUrl = URL.createObjectURL(file);
        setFirmaArchivoUrl(fileUrl);
    };

    useEffect(() => {
        const session = localStorage.getItem("userSession") || sessionStorage.getItem("userSession");
        if (!session) return;

        const user = JSON.parse(session);
        setUsuarioLogueado(user); // Guardar info completa del usuario

        axiosInstance.get(`/api/users/profile/${user.id}`)
            .then(res => {
                setManager(res.data);
                setEmpresa(res.data.Empresa);

                // ✅ VERIFICAR TIPO DE CUENTA Y ASIGNAR CORRECTAMENTE
                if (user.accountType === 'Instructor') {
                    // Si es instructor, agregarlo a instructores asignados
                    setInstructoresAsignados([res.data.nombres || user.name || '']);
                    console.log('✅ Usuario instructor asignado:', res.data.nombres);
                } else if (user.accountType === 'Administrador' || user.accountType === 'Gestor') {
                    // Si es administrador o gestor, puede ser inspector
                    console.log('✅ Usuario como inspector:', res.data.nombres);
                }
            })
            .catch(err => {
                console.error("Error al obtener datos:", err);
            });
    }, []);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    // Validación de fechas
    const today = new Date().toISOString().split('T')[0];

    const handleFechaInicioChange = (e) => {
        const value = e.target.value;
        setFechaInicio(value);

        if (value < today) {
            setDateError('La fecha de inicio no puede ser anterior a hoy.');
        } else if (fechaFin && value > fechaFin) {
            setDateError('La fecha de inicio no puede ser posterior a la fecha de fin.');
        } else {
            setDateError('');
        }
    };

    const handleFechaFinChange = (e) => {
        const value = e.target.value;
        setFechaFin(value);

        if (fechaInicio && value < fechaInicio) {
            setDateError('La fecha de fin no puede ser anterior a la fecha de inicio.');
        } else {
            setDateError('');
        }
    };

    const handleDownloadPDF = () => {
        setExportValues({
            nombreCurso,
            numEmpleados,
            fechaInicio,
            fechaFin
        });
        setIsExporting(true);
        setTimeout(() => {
            if (pdfRef.current) {
                const pdfFileName = 'acta_lugar_formacion.pdf';
                html2pdf()
                    .set({
                        margin: 10,
                        filename: pdfFileName,
                        html2canvas: { scale: 2 },
                        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                    })
                    .from(pdfRef.current)
                    .save()
                    .then(() => {
                        setIsExporting(false);
                        setGeneratedPdfName(pdfFileName);
                    });
            } else {
                setIsExporting(false);
            }
        }, 100);
    };

    const handleEdit = () => setIsEditing(true);
    const handleSave = () => setIsEditing(false);

    // FUNCIÓN PARA VOLVER A LA PÁGINA ANTERIOR
    const handleGoBack = () => {
        navigate(-1); // Esto lleva al usuario a la página anterior en el historial
    };

    // Enviar el acta de lugar de formación al backend
    const handleSendProceeding = async () => {
        try {
            if (!pdfRef.current) return;

            const pdfFileName = 'acta_lugar_formacion.pdf';
            const opt = {
                margin: 10,
                filename: pdfFileName,
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            const worker = html2pdf().set(opt).from(pdfRef.current);
            const pdfBlob = await worker.output('blob');

            const formData = new FormData();
            formData.append('pdf', pdfBlob, pdfFileName);
            formData.append('empresa', JSON.stringify(empresa));
            formData.append('manager', JSON.stringify(manager));
            formData.append('fecha_acta', new Date().toISOString());

            // ✅ Enviar el ID del usuario logueado como instructor
            if (usuarioLogueado && usuarioLogueado.id) {
                formData.append('instructor_ID', usuarioLogueado.id);
                console.log('✅ Enviando instructor_ID:', usuarioLogueado.id);
            }

            if (empresa && empresa.ID) {
                formData.append('empresa_ID', empresa.ID);
            }

            const response = await axiosInstance.post('/api/actas/lugar-formacion-acta', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // ✅ Si la respuesta es exitosa, redirigir
            if (response.status === 200) {
                setGeneratedPdfName(pdfFileName);
                alert('¡Acta de lugar de formación enviada correctamente!');

                // ✅ REDIRECCIÓN AUTOMÁTICA
                navigate('/Gestiones/Actas');
            }

        } catch (error) {
            alert('Error al enviar el acta de lugar de formación.');
            console.error('❌ Error completo:', error);
        }
    };
    useEffect(() => {
        // Cleanup function para liberar memory de las URLs creadas
        return () => {
            if (firmaArchivoUrl) {
                URL.revokeObjectURL(firmaArchivoUrl);
            }
        };
    }, [firmaArchivoUrl]);
    return (
        <>
            <Header />
            <Main>
                <div className="training-place-proceeding-container">
                    <button 
                        className="button-volver" 
                        onClick={handleGoBack}
                        style={{ backgroundColor: '#00a144' }}
                    >
                        Volver Atrás
                    </button>
                    <h1>
                        Acta de <span className="highlight-proceedings">Lugar de Formación</span>
                    </h1>
                    <p className="description-proceedings">
                        Este documento permite a la empresa formalizar la solicitud de un curso ante el SENA. <br />
                        Escribe el nombre del curso, el número de empleados que lo tomarán y las fechas de inicio y fin del curso.
                    </p>

                    <div className="training-place-proceeding-card">
                        {!isEditing && (
                            <img
                                className="download-icon-proceedings"
                                src="/src/assets/Icons/IconDescarga.png"
                                alt="Icono de descarga"
                                style={{ cursor: "pointer" }}
                                onClick={handleDownloadPDF}
                            />
                        )}

                        <div className="training-place-proceeding-letter-content apa-style" ref={pdfRef}>
                            <div className='date-proceeding'>
                                <p>Fecha de creación:  {new Date().toLocaleDateString()}</p>
                            </div>
                            <h2 className='title-concertation'>ACTA DE LUGAR DE FORMACIÓN</h2>
                            <p>
                                <b>1. Información del Lugar</b><br />
                                Ubicación: {isEditing ? (
                                    <input
                                        type="text"
                                        className='training-place-proceeding-input'
                                        value={empresa?.direccion || ''}
                                        onChange={e => setEmpresa({ ...empresa, direccion: e.target.value })}
                                        placeholder="Dirección completa del lugar"
                                        style={{ width: 300 }}
                                    />
                                ) : (
                                    empresa?.direccion || '[Dirección completa del lugar]'
                                )}<br />
                                Capacidad: {isEditing ? (
                                    <input
                                        type="number"
                                        className='training-place-proceeding-input'
                                        value={empresa?.capacidad || ''}
                                        onChange={e => setEmpresa({ ...empresa, capacidad: e.target.value })}
                                        placeholder="Número de personas que puede albergar"
                                        style={{ width: 120 }}
                                    />
                                ) : (
                                    empresa?.capacidad || '[Número de personas que puede albergar]'
                                )}<br />
                                Infraestructura: {isEditing ? (
                                    <input
                                        type="text"
                                        className='training-place-proceeding-input'
                                        value={empresa?.infraestructura || ''}
                                        onChange={e => setEmpresa({ ...empresa, infraestructura: e.target.value })}
                                        placeholder="Descripción de las instalaciones disponibles"
                                        style={{ width: 300 }}
                                    />
                                ) : (
                                    empresa?.infraestructura || '[Descripción de las instalaciones disponibles]'
                                )}<br />
                                Recursos Disponibles: {isEditing ? (
                                    <EditableList
                                        items={empresa?.recursos || []}
                                        setItems={recursos => setEmpresa({ ...empresa, recursos })}
                                        placeholder="Recurso disponible (ej. equipos, mobiliario, conectividad, etc.)"
                                    />
                                ) : (
                                    empresa?.recursos && empresa.recursos.length > 0 ? empresa.recursos.map((r, idx) => <span key={idx}>{r}{idx < empresa.recursos.length - 1 ? ', ' : ''}</span>) : '[Lista de recursos como equipos, mobiliario, conectividad, etc.]'
                                )}
                                <br /><br />
                                <b>2. Observaciones de la Inspección</b><br />
                                {isEditing ? (
                                    <textarea
                                        className='training-place-proceeding-input'
                                        value={empresa?.observacionesInspeccion || ''}
                                        onChange={e => setEmpresa({ ...empresa, observacionesInspeccion: e.target.value })}
                                        placeholder="Descripción detallada de lo observado durante la inspección. Ej. estado del lugar, accesibilidad, condiciones de seguridad, etc."
                                        style={{ width: '100%', minHeight: 60 }}
                                    />
                                ) : (
                                    empresa?.observacionesInspeccion || '[Descripción detallada de lo observado durante la inspección. Ej. estado del lugar, accesibilidad, condiciones de seguridad, etc.]'
                                )}
                                <br /><br />
                                <b>3. Documentos/Imágenes de Respaldo</b><br />
                                {isEditing ? (
                                    <textarea
                                        className='training-place-proceeding-input'
                                        value={empresa?.documentosRespaldo || ''}
                                        onChange={e => setEmpresa({ ...empresa, documentosRespaldo: e.target.value })}
                                        placeholder="Adjuntar aquí los documentos o imágenes pertinentes o indicar que se encuentran anexos al acta."
                                        style={{ width: '100%', minHeight: 40 }}
                                    />
                                ) : (
                                    empresa?.documentosRespaldo || '[Adjuntar aquí los documentos o imágenes pertinentes o indicar que se encuentran anexos al acta.]'
                                )}
                                <br /><br />
                                <b>4. Firma de los Responsables</b><br />
                                <table className="table-acta">
                                    <thead>
                                        <tr>
                                            <th className="table-acta-th">Nombre Completo</th>
                                            <th className="table-acta-th">Cargo</th>
                                            <th className="table-acta-th">Firma</th>
                                            {isEditing && <th className="table-acta-th">Acciones</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            const participanteId = 'inspector-gestor';
                                            const firmaParticipante = firmasParticipantes[participanteId];
                                            return (
                                        <tr>
                                            <td>{isEditing ? (
                                                <input
                                                    type="text"
                                                    className='training-place-proceeding-input'
                                                    value={manager?.nombres || ''}
                                                    onChange={e => setManager({ ...manager, nombres: e.target.value })}
                                                    placeholder="Nombre del Inspector"
                                                    style={{ width: 200 }}
                                                />
                                            ) : (
                                                manager?.nombres || '[Nombre del Inspector]'
                                            )}</td>
                                            <td>Inspector o Gestor</td>
                                            <td style={{ padding: '10px' }}>
                                                        {firmaParticipante?.firma ? (
                                                    <img
                                                                src={firmaParticipante.firma}
                                                        alt="Firma digital"
                                                        style={{
                                                                    width: 'auto',
                                                                    maxWidth: '120px',
                                                                    height: '40px',
                                                                    display: 'block',                              
                                                                    objectFit: 'contain',
                                                                    border: 'none',
                                                                    background: 'transparent'
                                                        }}
                                                    />
                                                ) : (
                                                    <span style={{ display: 'inline-block', width: '120px', borderBottom: '1px solid #000' }}>
                                                        &nbsp;
                                                    </span>
                                                )}
                                            </td>
                                                    {isEditing && (
                                                        <td style={{ padding: '5px', textAlign: 'center' }}>
                                                            {!firmaParticipante?.firma ? (
                                                                <button
                                                                    onClick={() => handleAbrirModalFirma(participanteId, manager?.nombres || 'Inspector')}
                                                                    style={{
                                                                        backgroundColor: '#00843d',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        padding: '5px 10px',
                                                                        borderRadius: '3px',
                                                                        cursor: 'pointer',
                                                                        fontSize: '12px'
                                                                    }}
                                                                >
                                                                    Agregar firma
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleLimpiarFirma(participanteId)}
                                                                    style={{
                                                                        backgroundColor: '#dc3545',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        padding: '5px 10px',
                                                                        borderRadius: '3px',
                                                                        cursor: 'pointer',
                                                                        fontSize: '12px'
                                                                    }}
                                                                >
                                                                    Limpiar firma
                                                                </button>
                                                            )}
                                                        </td>
                                                    )}
                                        </tr>
                                            );
                                        })()}
                                    </tbody>
                                </table>
                                <br />
                                {dateError && <div style={{ color: 'red', marginBottom: '10px' }}>{dateError}</div>}
                            </p>
                        </div>

                    </div>

                    <div className="training-place-proceeding-botones-solicitud">
                        {isEditing ? (
                            <button className="training-place-proceeding-submit-button" onClick={handleSave} disabled={!!dateError}>Guardar</button>
                        ) : (
                            <button className="training-place-proceeding-submit-button" onClick={handleEdit}>Editar</button>
                        )}

                        <button className="training-place-proceeding-submit-button" onClick={handleSendProceeding}>Generar acta</button>
                        <button className="training-place-proceeding-submit-button-exportar" onClick={handleDownloadPDF}>Exportar</button>
                    </div>

                </div>
            </Main>
            <Footer />
            {showSignatureModal && (
                <ModalSignature
                    closeModal={() => {
                        setShowSignatureModal(false);
                        setParticipanteSeleccionado(null);
                    }}
                    nombreActa={nombreCurso}
                    tipoActa="Acta de Lugar de formación"
                    participanteSeleccionado={participanteSeleccionado}
                    editar={isEditing}
                    onSignature={handleAplicarFirma}
                    onUpload={handleAplicarFirma}
                >
                </ModalSignature>
            )}
        </>
    );
};