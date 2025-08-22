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

export const TrainingPlaceProceeding = () => {
    const { nombreCurso: nombreCursoParam } = useParams();

    const [empresa, setEmpresa] = useState(null);
    const [manager, setManager] = useState(null);

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

    const [instructores, setInstructores] = useState([]);
    const [instructoresAsignados, setInstructoresAsignados] = useState([]);
    const [participantes, setParticipantes] = useState([]);

    const [generatedPdfName, setGeneratedPdfName] = useState('');

    useEffect(() => {
        const session = localStorage.getItem("userSession") || sessionStorage.getItem("userSession");
        if (!session) return;
        const user = JSON.parse(session);
        axiosInstance.get(`/api/users/profile/${user.id}`)
            .then(res => {
                setManager(res.data);
                setEmpresa(res.data.Empresa);
            })
            .catch(err => console.error("Error al obtener datos:", err));
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


    // Enviar el acta de lugar de formación al backend (simulación de endpoint lógico)
    const handleSendProceeding = async () => {
        try {
            if (!pdfRef.current) return;

            // Opciones para html2pdf
            const pdfFileName = 'acta_lugar_formacion.pdf';
            const opt = {
                margin: 10,
                filename: pdfFileName,
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            // Genera el PDF y obtén el blob
            const worker = html2pdf().set(opt).from(pdfRef.current);
            const pdfBlob = await worker.outputPdf ? await worker.outputPdf('blob') : await worker.output('blob');

            // Prepara el FormData para el acta
            const formData = new FormData();
            formData.append('pdf', pdfBlob, pdfFileName);
            formData.append('empresa', JSON.stringify(empresa));
            formData.append('manager', JSON.stringify(manager));
            formData.append('fecha', new Date().toISOString());
            // Puedes agregar más campos relevantes aquí según la estructura del acta

            // Enviar al endpoint lógico del backend
            const response = await axiosInstance.post('/api/proceedings/lugar-formacion', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setGeneratedPdfName(pdfFileName);
            alert('¡Acta enviada correctamente!');
        } catch (error) {
            alert('Error al enviar el acta.');
            console.error(error);
        }
    };

    // Aprobar el acta de lugar de formación
    const handleApproveProceeding = async () => {
        try {
            const id = empresa?.ID || 'demo-id';
            await axiosInstance.patch(`/api/proceedings/lugar-formacion/${id}`, { estado: 'aprobado' });
            alert('Acta aprobada correctamente.');
        } catch (error) {
            alert('Error al aprobar el acta.');
            console.error(error);
        }
    };

    // Rechazar el acta de lugar de formación
    const handleRejectProceeding = async () => {
        try {
            const id = empresa?.ID || 'demo-id';
            await axiosInstance.patch(`/api/proceedings/lugar-formacion/${id}`, { estado: 'rechazado' });
            alert('Acta rechazada correctamente.');
        } catch (error) {
            alert('Error al rechazar el acta.');
            console.error(error);
        }
    };

    return (
        <>
            <Header />
            <Main>
                <div className="training-place-proceeding-container">
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
                                        </tr>
                                    </thead>
                                    <tbody>
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
                                            <td>_______________</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </p>
                        </div>

                    </div>
                    <div className='training-place-proceeding-observaciones-container'>
                        <p>Observaciones: </p>
                        <textarea
                            className='training-place-proceeding-input'
                            value={observaciones}
                            onChange={e => setObservaciones(e.target.value)}
                        />
                    </div>
                    <div className="training-place-proceeding-botones-solicitud">
                        {isEditing ? (
                            <button className="training-place-proceeding-submit-button" onClick={handleSave} disabled={!!dateError}>Guardar</button>
                        ) : (
                            <button className="training-place-proceeding-submit-button" onClick={handleEdit}>Editar</button>
                        )}

                        <button className="training-place-proceeding-submit-button" onClick={handleSendProceeding}>Generar acta</button>
                        <button className="training-place-proceeding-submit-button" onClick={() => setShowSignatureModal(true)}>Agregar firma</button>
                        <button className="training-place-proceeding-submit-button-exportar" onClick={handleDownloadPDF}>Exportar</button>
                    </div>

                </div>
            </Main>
            <Footer />
            {showSignatureModal && (
                <ModalSignature
                    closeModal={() => setShowSignatureModal(false)}
                    nombreCurso={nombreCurso}
                    tipoActa="Acta de Lugar de formación"
                    onSignature={setFirmaDigital}
                    onUpload={setFirmaArchivo}
                >
                    {/* Aquí puedes mostrar una previsualización de la firma si lo deseas */}
                    {firmaDigital && (
                        <div style={{ textAlign: 'center', marginTop: 10 }}>
                            <span style={{ fontSize: 13, color: '#00843d' }}>Previsualización de firma digital:</span>
                            <img src={firmaDigital} alt="Firma digital" style={{ display: 'block', margin: '8px auto', maxWidth: 200, border: '1px solid #ccc', borderRadius: 6 }} />
                        </div>
                    )}

                </ModalSignature>
            )}
        </>
    );
};