import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import './concertationProceeding.css';
import { Header } from "../../Layouts/Header/Header";
import { Footer } from '../../Layouts/Footer/Footer';
import { Main } from '../../Layouts/Main/Main';
import axiosInstance from '../../../config/axiosInstance';
import html2pdf from 'html2pdf.js';
import { ModalSignature } from '../../UI/Modal_Signature/ModalSignature';
import { EditableList } from '../../UI/EditableList/EditableList';

export const ConcertationProceeding = () => {
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
        console.log('Manager data after fetch:', res.data);
      })
      .catch(err => {
        console.error("Error al obtener datos:", err);
        console.log('Error fetching manager data:', err);
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
        const pdfFileName = 'acta_concertacion.pdf';
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


  // Enviar el acta de concertación al backend (simulación de endpoint lógico)
  const handleSendProceeding = async () => {
    try {
      if (!pdfRef.current) return;

      // Opciones para html2pdf
      const pdfFileName = 'acta_concertacion.pdf';
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
      formData.append('fecha_acta', new Date().toISOString());
      if (manager && manager.id) {
        console.log('Manager object:', manager);
        console.log('Manager accountType (before condition):', manager.accountType);
        if (manager.accountType === 'Instructor') {
          formData.append('instructor_ID', manager.id);
        }
      }
      // Puedes agregar más campos relevantes aquí según la estructura del acta

      // Enviar al endpoint lógico del backend
      const response = await axiosInstance.post('/api/actas/concertacion-acta', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setGeneratedPdfName(pdfFileName);
      alert('¡Acta de concertación enviada correctamente!');
    } catch (error) {
      alert('Error al enviar el acta de concertación.');
      console.error(error);
    }
  };


  return (
    <>
      <Header />
      <Main>
        <div className="course-request-container-proceedings">
          <h1>
            Acta de <span className="highlight-proceedings">Concertación</span>
          </h1>
          <p className="description-proceedings">
            Este documento permite a la empresa formalizar la solicitud de un curso ante el SENA. <br />
            Escribe el nombre del curso, el número de empleados que lo tomarán y las fechas de inicio y fin del curso.
          </p>
          
          <div className="request-card-proceedings">
            {!isEditing && (
              <img
                className="download-icon-proceedings"
                src="/src/assets/Icons/IconDescarga.png"
                alt="Icono de descarga"
                style={{ cursor: "pointer" }}
                onClick={handleDownloadPDF}
              />
            )}

            <div className="letter-content-proceedings apa-style" ref={pdfRef}>
              <div className='date-proceeding'>
                <p>Fecha de creación:  {new Date().toLocaleDateString()}</p>
              </div>
              <h2 className='title-concertation'>ACTA DE CONCERTACIÓN</h2>
              <p>
                <b>1. Información General</b><br />
                Nombre de la Institución: {(empresa?.nombre_empresa || '[Nombre de la entidad]')}<br />
                Lugar de Concertación: {empresa?.Ciudad?.nombre || '[Ciudad]'}, {empresa?.direccion || '[Sede, modalidad]'}<br />
                <br />
                <b>Responsables:</b><br />
                • Coordinador Académico: {isEditing ? (
                  <input
                    type="text"
                    className='input-solicitud-proceedings'
                    value={manager?.nombres || ''}
                    onChange={e => setManager({ ...manager, nombres: e.target.value })}
                    placeholder="Nombre del responsable"
                    style={{ width: 180 }}
                  />
                ) : (
                  manager?.nombres || '[Nombre del responsable]'
                )}<br />
                • Instructor(es) Participante(s): {isEditing ? (
                  <EditableList
                    items={instructores}
                    setItems={setInstructores}
                    placeholder="Nombre del instructor"
                  />
                ) : (
                  instructores.length > 0 ? instructores.map((i, idx) => <span key={idx}>{i}{idx < instructores.length - 1 ? ', ' : ''}</span>) : '[Nombre(s)]'
                )}<br />
                <br />
                <b>2. Detalle de Cursos Concertados</b><br />
                Curso: {isEditing ? (
                  <input
                    type="text"
                    className='input-solicitud-proceedings'
                    value={nombreCurso}
                    onChange={e => setNombreCurso(e.target.value)}
                    placeholder="Nombre del curso"
                    style={{ width: 180 }}
                    required
                  />
                ) : isExporting ? (
                  <b>{exportValues.nombreCurso || '[Nombre del curso]'}</b>
                ) : (
                  <b>{nombreCurso || '[Nombre del curso]'}</b>
                )}<br />
                Instructor Asignado: {isEditing ? (
                  <EditableList
                    items={instructoresAsignados}
                    setItems={setInstructoresAsignados}
                    placeholder="Nombre instructor asignado"
                  />
                ) : (
                  instructoresAsignados.length > 0 ? instructoresAsignados.map((i, idx) => <span key={idx}>{i}{idx < instructoresAsignados.length - 1 ? ', ' : ''}</span>) : '[Nombre instructor 1]'
                )}<br />
                Fecha de Inicio: {isEditing ? (
                  <input
                    type="date"
                    className='input-solicitud-date-proceedings'
                    value={fechaInicio}
                    min={today}
                    onChange={handleFechaInicioChange}
                    required
                  />
                ) : isExporting ? (
                  <b>{formatDate(exportValues.fechaInicio) || '[dd/mm/yyyy]'}</b>
                ) : (
                  <b>{formatDate(fechaInicio) || '[dd/mm/yyyy]'}</b>
                )}<br />
                Fecha de Fin: {isEditing ? (
                  <input
                    type="date"
                    className='input-solicitud-date-proceedings'
                    value={fechaFin}
                    min={fechaInicio || today}
                    onChange={handleFechaFinChange}
                    required
                  />
                ) : isExporting ? (
                  <b>{formatDate(exportValues.fechaFin) || '[dd/mm/yyyy]'}</b>
                ) : (
                  <b>{formatDate(fechaFin) || '[dd/mm/yyyy]'}</b>
                )}<br />
                Horario: [Hora inicio - fin]<br />
                Modalidad: [Presencial/Virtual]<br />
                <br />
                <b>3. Participantes</b><br />
                {isEditing ? (
                  <EditableList
                    items={participantes}
                    setItems={setParticipantes}
                    placeholder="Nombre participante"
                  />
                ) : (
                  participantes.length > 0 ? participantes.map((p, idx) => <span key={idx}>• {p}<br /></span>) : <span>• [Nombre participante 1]<br />• [Nombre participante 2]</span>
                )}
                <br />
                <b>4. Notas Relevantes</b><br />
                • [Ejemplo: Los cursos deben iniciar puntualmente según el horario establecido.]<br />
                • [Ejemplo: Se acordó que los cursos virtuales serán grabados y compartidos.]<br />
                • [Ejemplo: Las fechas propuestas están sujetas a confirmación por parte de los participantes.]<br />
                <br />
                <b>5. Condiciones Especiales</b><br />
                • [Condición 1: Se requiere disponibilidad de sala virtual con capacidad para 30 personas.]<br />
                • [Condición 2: Entrega de material didáctico antes de la primera sesión.]<br />
                <br />
                <b>6. Firma de los Participantes</b><br />
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
                      <td>{instructores.length > 0 ? instructores[0] : '[Nombre del Instructor]'}</td>
                      <td>Instructor</td>
                      <td>_______________</td>
                    </tr>
                    <tr>
                      <td>{manager?.nombres || '[Nombre del Coordinador]'}</td>
                      <td>Coordinador Académico</td>
                      <td>_______________</td>
                    </tr>
                    {participantes.length > 0 ? participantes.map((p, idx) => (
                      <tr key={idx}>
                        <td>{p}</td>
                        <td>Participante</td>
                        <td>_______________</td>
                      </tr>
                    )) : (
                      <tr>
                        <td>[Nombre Participante]</td>
                        <td>Participante</td>
                        <td>_______________</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </p>
            </div>

          </div>
          <div className='observaciones-container-proceedings'>
            <p>Observaciones: </p>
            <textarea
              className='input-solicitud-proceedings'
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
            />
          </div>
          <div className="botones-solicitud-proceedings">
            {isEditing ? (
              <button className="submit-button-proceedings" onClick={handleSave} disabled={!!dateError}>Guardar</button>
            ) : (
              <button className="submit-button-proceedings" onClick={handleEdit}>Editar</button>
            )}

            <button className="submit-button-proceedings" onClick={handleSendProceeding}>Generar acta</button>
            <button className="submit-button-proceedings" onClick={() => setShowSignatureModal(true)}>Agregar firma</button>
            <button className="submit-button-proceedings-exportar" onClick={handleDownloadPDF}>Exportar</button>
          </div>

        </div>
      </Main>
      <Footer />
      {showSignatureModal && (
        <ModalSignature
          closeModal={() => setShowSignatureModal(false)}
          nombreCurso={nombreCurso}
          tipoActa="Acta de Concertacion"
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