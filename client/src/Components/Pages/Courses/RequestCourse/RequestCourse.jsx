import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import './RequestCourse.css';
import IconDescarga from '../../../../assets/Icons/IconDescarga.png';
import { Header } from '../../../Layouts/Header/Header';
import { Footer } from '../../../Layouts/Footer/Footer';
import { Main } from '../../../Layouts/Main/Main';
import axiosInstance from '../../../../config/axiosInstance';
import html2pdf from 'html2pdf.js';

export const RequestCourse = () => {
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

  const pdfRef = useRef();

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
        html2pdf()
          .set({
            margin: 10,
            filename: 'solicitud_curso.pdf',
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
          })
          .from(pdfRef.current)
          .save()
          .then(() => setIsExporting(false));
      } else {
        setIsExporting(false);
      }
    }, 100);
  };

  const handleEdit = () => setIsEditing(true);
  const handleSave = () => setIsEditing(false);

const handleSendRequest = async () => {
  try {
    if (!pdfRef.current) return;

    // Opciones para html2pdf
    const opt = {
      margin: 10,
      filename: 'solicitud_curso.pdf',
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Genera el PDF y obtén el blob
    const worker = html2pdf().set(opt).from(pdfRef.current);
    const pdfBlob = await worker.outputPdf ? await worker.outputPdf('blob') : await worker.output('blob');

    // Prepara el FormData para la solicitud de curso
    const formData = new FormData();
    formData.append('pdf', pdfBlob, 'solicitud_curso.pdf');
    formData.append('nombreCurso', nombreCurso);
    formData.append('numEmpleados', numEmpleados);
    formData.append('fechaInicio', fechaInicio);
    formData.append('fechaFin', fechaFin);
    formData.append('empresa', JSON.stringify(empresa));
    formData.append('empresa_ID', empresa?.ID);
    formData.append('manager', JSON.stringify(manager));

    // 1. Enviar la solicitud de curso
    const response = await axiosInstance.post('/api/actas/solicitud-curso', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    // 2. Enviar la notificación al sistema
    // Puedes obtener el nombre del archivo PDF desde el backend en la respuesta, o usar el mismo nombre si lo generas igual
    const archivoPDF = response.data?.pdf_acta || 'solicitud_curso.pdf'; // Ajusta según tu backend

    await axiosInstance.post('/api/notifications/solicitud-curso', {
      asunto: 'Nueva solicitud de curso',
      mensaje: `Se ha recibido una nueva solicitud de curso de la empresa ${empresa?.nombre_empresa || ''}.`,
      archivo: archivoPDF
    });

    alert('¡Solicitud enviada y notificación creada correctamente!');
  } catch (error) {
    alert('Error al enviar la solicitud.');
    console.error(error);
  }
};

  return (
    <>
      <Header />
      <Main>
        <div className="course-request-container">
          <h1>
            Solicitud de Curso <span className="highlight">Complementario</span>
          </h1>
          <p className="description">
            Este documento permite a la empresa formalizar la solicitud de un curso ante el SENA. <br />
            Escribe el nombre del curso, el número de empleados que lo tomarán y las fechas de inicio y fin del curso.
          </p>

          <div className="request-card">
            {!isEditing && (
              <img
                className="download-icon"
                src={IconDescarga}
                alt="Icono de descarga"
                style={{ cursor: "pointer" }}
                onClick={handleDownloadPDF}
              />
            )}

            <div className="letter-content apa-style" ref={pdfRef}>
              <p>
                <b>
                  {(empresa?.nombre_empresa || '[Nombre de la empresa]').toUpperCase()}<br />
                </b>

                NIT: {empresa?.NIT || '[NIT de la empresa]'}<br />

                {empresa?.Ciudad?.nombre || '[Ciudad]'}, {empresa?.Ciudad?.Departamento?.nombre || '[Departamento]'}<br />
                {empresa?.direccion || '[Dirección]'}<br />
                <br />
                Telefono: {empresa?.telefono || '[Teléfono]'}<br />
                Email: {empresa?.email_empresa || '[Correo]'}<br />
                Fecha solicitud: {new Date().toLocaleDateString()}<br /><br />
                <br /><br />
                Señores<br />
                Coordinadores Académicos<br />
                SENA Centro Comercio y Turismo<br />
                SENA Regional Quindío<br />
                Armenia - Quindío<br /><br />

                Asunto: Solicitud de Curso de formación Complementaria<br /><br />

                Respetados señores:<br /><br />

                Por medio de la presente, y en calidad de representante legal de {empresa?.nombre_empresa || '[Nombre de la empresa]'}, me permito solicitar un curso de formación complementaria en&nbsp;
                {isEditing ? (
                  <input
                    type="text"
                    className='input-solicitud'
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
                )}
                &nbsp;para&nbsp;
                {isEditing ? (
                  <input
                    type="number"
                    className='input-solicitud'
                    min="1"
                    max="30"
                    value={numEmpleados}
                    onChange={e => {
                      const value = Number(e.target.value);
                      if (value <= 30) {
                        setNumEmpleados(value);
                      }
                    }}
                    placeholder="número"
                    style={{ width: 60 }}
                    required
                  />
                ) : isExporting ? (
                  <b>{exportValues.numEmpleados || '[Número]'}</b>
                ) : (
                  <b>{numEmpleados || '[Número]'}</b>
                )}
                &nbsp;empleados, programado para las fechas:&nbsp;
                {isEditing ? (
                  <>
                    <input
                      type="date"
                      className='input-solicitud-date'
                      value={fechaInicio}
                      min={today}
                      onChange={handleFechaInicioChange}
                      required
                    />
                    &nbsp;a&nbsp;
                    <input
                      type="date"
                      className='input-solicitud-date'
                      value={fechaFin}
                      min={fechaInicio || today}
                      onChange={handleFechaFinChange}
                      required
                    />
                    {dateError && (
                      <div style={{ color: 'red', fontSize: '0.9em', marginTop: 4 }}>
                        {dateError}
                      </div>
                    )}
                  </>
                ) : isExporting ? (
                  <b>
                    {`${formatDate(exportValues.fechaInicio) || '[Fecha inicio]'} a ${formatDate(exportValues.fechaFin) || '[Fecha fin]'}`}
                  </b>
                ) : (
                  <b>
                    {`${formatDate(fechaInicio) || '[Fecha inicio]'} a ${formatDate(fechaFin) || '[Fecha fin]'}`}
                  </b>
                )}
                .<br /><br />

                Agradezco su atención y quedo atento(a) a cualquier inquietud adicional.<br /><br />

                <br /><br /><br /><br /><br />
                {manager?.nombres} {manager?.apellidos}<br />
                Manager<br />
                {manager?.celular || '[Teléfono]'}<br />
                {manager?.email || '[Correo]'}
              </p>
            </div>
          </div>
          <div className="botones-solicitud">
            {isEditing ? (
              <button className="submit-button" onClick={handleSave} disabled={!!dateError}>Guardar</button>
            ) : (
              <button className="submit-button" onClick={handleEdit}>Editar</button>
            )}

            <button className="submit-button" onClick={handleSendRequest}>Enviar Solicitud</button>
          </div>

        </div>
      </Main>
      <Footer />
    </>
  );
};