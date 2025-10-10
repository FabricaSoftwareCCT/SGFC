import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import './concertationProceeding.css';
import { Header } from "../../Layouts/Header/Header";
import { Footer } from '../../Layouts/Footer/Footer';
import { Main } from '../../Layouts/Main/Main';
import axiosInstance from '../../../config/axiosInstance';
import html2pdf from 'html2pdf.js';
import { ModalSignature } from '../../UI/Modal_Signature/ModalSignature';
import { useNavigate } from 'react-router-dom';
import { validateText, validateNumber, validarFecha, createMensajeError } from '../../../utils/Validators/formValidator';

export const ConcertationProceeding = () => {
  const navigate = useNavigate();
  const { nombreCurso: nombreCursoParam } = useParams();

  const [empresa, setEmpresa] = useState(null);
  const [manager, setManager] = useState(null);
  const [usuarioLogueado, setUsuarioLogueado] = useState(null);

  const [nombreCurso, setNombreCurso] = useState(
    nombreCursoParam ? decodeURIComponent(nombreCursoParam) : ''
  );
  const [numEmpleados, setNumEmpleados] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // NUEVOS ESTADOS PARA LOS CAMPOS FALTANTES
  const [horarioInicio, setHorarioInicio] = useState('');
  const [horarioFin, setHorarioFin] = useState('');
  const [modalidad, setModalidad] = useState('Presencial');
  const [notasRelevantes, setNotasRelevantes] = useState([]);
  const [condicionesEspeciales, setCondicionesEspeciales] = useState([]);

  const [dateError, setDateError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportValues, setExportValues] = useState({
    nombreCurso: '',
    numEmpleados: '',
    fechaInicio: '',
    fechaFin: ''
  });

  const pdfRef = useRef();

  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [firmaDigital, setFirmaDigital] = useState("");
  const [firmaArchivo, setFirmaArchivo] = useState(null);
  const [firmaArchivoUrl, setFirmaArchivoUrl] = useState("");

  const [instructores, setInstructores] = useState([]);
  const [instructoresAsignados, setInstructoresAsignados] = useState([]);
  const [participantes, setParticipantes] = useState([]);
  const [coordinadorAcademico, setCoordinadorAcademico] = useState('');

  const [generatedPdfName, setGeneratedPdfName] = useState('');

  const handleUploadSignature = (file) => {
    setFirmaArchivo(file);
    const fileUrl = URL.createObjectURL(file);
    setFirmaArchivoUrl(fileUrl);
  };

  useEffect(() => {
    const session = localStorage.getItem("userSession") || sessionStorage.getItem("userSession");
    if (!session) return;

    const user = JSON.parse(session);
    setUsuarioLogueado(user);

    axiosInstance.get(`/api/users/profile/${user.id}`)
      .then(res => {
        setManager(res.data);
        setEmpresa(res.data.Empresa);

        if (user.accountType === 'Instructor') {
          setInstructoresAsignados([res.data.nombres || user.name || '']);
          setCoordinadorAcademico('');
        } else if (user.accountType === 'Administrador' || user.accountType === 'Gestor') {
          setCoordinadorAcademico(res.data.nombres || user.name || '');
        }
      })
      .catch(err => {
        console.error("Error al obtener datos:", err);
      });
  }, []);

  const handleValidation = async () => {
    const validationGeneral = {
      nombreCurso: validateText(nombreCurso),
      CoordinadorAcademico: validateText(coordinadorAcademico),
      Instructores: validateText(instructores[0]),
      Instructor: validateText(instructoresAsignados[0]),
      fechaInicio: validarFecha(fechaInicio),
      fechaFin: validarFecha(fechaFin),
    }

    const errores = await createMensajeError(validationGeneral);
    if(errores !== null){
      console.log(errores);
      alert(errores);
      return true;
    }

    return false;
  }

  useEffect(() => {
    return () => {
      if (firmaArchivoUrl) {
        URL.revokeObjectURL(firmaArchivoUrl);
      }
    };
  }, [firmaArchivoUrl]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  };

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
    const flag = handleValidation();
    if(flag) return;
    
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
            margin: [15, 15, 20, 15],
            filename: pdfFileName,
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            // NUEVAS OPCIONES PARA CONTROL DE PÁGINAS
            pagebreak: { 
              mode: ['avoid-all', 'css', 'legacy'], // Evitar cortes
              before: '.page-break-before', // Clases para saltos
              after: '.page-break-after' 
            }
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

  // Funciones para manejar las nuevas listas
  const handleNotaChange = (index, value) => {
    const nuevasNotas = [...notasRelevantes];
    nuevasNotas[index] = value;
    setNotasRelevantes(nuevasNotas);
  };

  const handleCondicionChange = (index, value) => {
    const nuevasCondiciones = [...condicionesEspeciales];
    nuevasCondiciones[index] = value;
    setCondicionesEspeciales(nuevasCondiciones);
  };

  const addNota = () => {
    setNotasRelevantes([...notasRelevantes, '']);
  };

  const addCondicion = () => {
    setCondicionesEspeciales([...condicionesEspeciales, '']);
  };

  const removeNota = (index) => {
    setNotasRelevantes(notasRelevantes.filter((_, i) => i !== index));
  };

  const removeCondicion = (index) => {
    setCondicionesEspeciales(condicionesEspeciales.filter((_, i) => i !== index));
  };

  const handleSendProceeding = async () => {
    try {
      const flag = await handleValidation();
      if(flag) return;

      if (!pdfRef.current) return;

      const pdfFileName = 'acta_concertacion.pdf';
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

      if (usuarioLogueado && usuarioLogueado.id) {
        formData.append('instructor_ID', usuarioLogueado.id);
      }

      if (empresa && empresa.ID) {
        formData.append('empresa_ID', empresa.ID);
      }

      const response = await axiosInstance.post('/api/actas/concertacion-acta', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.status === 200) {
        setGeneratedPdfName(pdfFileName);
        alert('¡Acta de concertación enviada correctamente!');
        navigate('/Gestiones/Actas');
      }

    } catch (error) {
      alert('Error al enviar el acta de concertación.');
      console.error('❌ Error completo:', error);
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
            Complete todos los campos requeridos para generar el acta de concertación.
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
                <p>Fecha de creación: {new Date().toLocaleDateString()}</p>
              </div>
              <h2 className='title-concertation'>ACTA DE CONCERTACIÓN</h2>
              <p>
                <b className='punto_name'>1. Información General</b><br />
                
                {/* NUEVO: INPUTS PARA NOMBRE DE INSTITUCIÓN Y LUGAR DE CONCERTACIÓN */}
                Nombre de la Institución: {isEditing ? (
                  <input
                    type="text"
                    className='input-solicitud-proceedings'
                    value={empresa?.nombre_empresa || ''}
                    onChange={e => setEmpresa(prev => ({...prev, nombre_empresa: e.target.value}))}
                    placeholder="Nombre de la entidad"
                    style={{ width: '300px', marginLeft: '10px' }}
                  />
                ) : (
                  <b className='punto_name'>{(empresa?.nombre_empresa || '[Nombre de la entidad]')}</b>
                )}<br />
                
                Lugar de Concertación: {isEditing ? (
                  <>
                    <input
                      type="text"
                      className='input-solicitud-proceedings'
                      value={empresa?.Ciudad?.nombre || ''}
                      onChange={e => setEmpresa(prev => ({...prev, Ciudad: {...prev.Ciudad, nombre: e.target.value}}))}
                      placeholder="Ciudad"
                      style={{ width: '150px', marginLeft: '10px' }}
                    />
                    , 
                    <input
                      type="text"
                      className='input-solicitud-proceedings'
                      value={empresa?.direccion || ''}
                      onChange={e => setEmpresa(prev => ({...prev, direccion: e.target.value}))}
                      placeholder="Sede, modalidad"
                      style={{ width: '200px', marginLeft: '10px' }}
                    />
                  </>
                ) : (
                  <b className='punto_name'>{empresa?.Ciudad?.nombre || '[Ciudad]'}, {empresa?.direccion || '[Sede, modalidad]'}</b>
                )}<br />
                <br />
                
                <b>Responsables:</b><br />

                {/* COORDINADOR ACADÉMICO */}
                • Coordinador Académico: {isEditing ? (
                  <input
                    type="text"
                    className='input-solicitud-proceedings'
                    value={coordinadorAcademico}
                    onChange={e => setCoordinadorAcademico(e.target.value)}
                    placeholder="Nombre del coordinador académico"
                    style={{ width: '250px' }}
                  />
                ) : (
                  coordinadorAcademico || '[Nombre del coordinador académico]'
                )}<br />

                {/* INSTRUCTORES PARTICIPANTES - CORREGIDO */}
                • Instructor(es) Participante(s): {isEditing ? (
                  <div style={{ display: 'inline-block', marginLeft: '10px' }}>
                    {instructores.map((instructor, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                        <input
                          type="text"
                          value={instructor}
                          onChange={e => {
                            const newInstructores = [...instructores];
                            newInstructores[idx] = e.target.value;
                            setInstructores(newInstructores);
                          }}
                          placeholder="Nombre del instructor participante"
                          className="input-solicitud-proceedings"
                          style={{ width: '250px', marginRight: '5px' }}
                        />
                        <button 
                          type="button" 
                          onClick={() => setInstructores(instructores.filter((_, i) => i !== idx))}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: '#dc3545', 
                            cursor: 'pointer',
                            fontSize: '16px',
                            padding: '0 5px'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button 
                      type="button" 
                      onClick={() => setInstructores([...instructores, ''])}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#00843d', 
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        marginTop: '5px'
                      }}
                    >
                      + Agregar instructor
                    </button>
                  </div>
                ) : (
                  instructores.length > 0 ? instructores.map((i, idx) => <span key={idx}>{i}{idx < instructores.length - 1 ? ', ' : ''}</span>) : '[Nombre(s) de instructores participantes]'
                )}<br />
                <br />
                
                <b  className='punto_name'>2. Detalle de Cursos Concertados</b><br />
                Curso: {isEditing ? (
                  <input
                    type="text"
                    className='input-solicitud-proceedings'
                    value={nombreCurso}
                    onChange={e => setNombreCurso(e.target.value)}
                    placeholder="Nombre del curso"
                    style={{ width: '300px' }}
                    required
                  />
                ) : isExporting ? (
                  <b className='punto_name'>{exportValues.nombreCurso || '[Nombre del curso]'}</b>
                ) : (
                  <b className='punto_name'>{nombreCurso || '[Nombre del curso]'}</b>
                )}<br />

                {/* INSTRUCTOR ASIGNADO */}
                Instructor Asignado: {isEditing ? (
                  <input
                    type="text"
                    className='input-solicitud-proceedings'
                    value={instructoresAsignados[0] || ''}
                    onChange={e => setInstructoresAsignados([e.target.value])}
                    placeholder="Nombre instructor asignado"
                    style={{ width: '250px' }}
                    required
                  />
                ) : (
                  instructoresAsignados.length > 0 ?
                    instructoresAsignados.map((i, idx) => <span key={idx}>{i}{idx < instructoresAsignados.length - 1 ? ', ' : ''}</span>)
                    : '[Nombre instructor asignado]'
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
                
                {/* HORARIO - NUEVO CAMPO */}
                Horario: {isEditing ? (
                  <>
                    <input
                      type="time"
                      className='input-solicitud-time-proceedings'
                      value={horarioInicio}
                      onChange={e => setHorarioInicio(e.target.value)}
                      style={{ width: '120px', marginRight: '10px' }}
                    />
                    a
                    <input
                      type="time"
                      className='input-solicitud-time-proceedings'
                      value={horarioFin}
                      onChange={e => setHorarioFin(e.target.value)}
                      style={{ width: '120px', marginLeft: '10px' }}
                    />
                  </>
                ) : (
                  horarioInicio && horarioFin ? `${horarioInicio} - ${horarioFin}` : '[Hora inicio - fin]'
                )}<br />
                <br />
                {/* MODALIDAD - NUEVO CAMPO */}
                Modalidad: {isEditing ? (
                  <select
                    className='input-solicitud-select-proceedings'
                    value={modalidad}
                    onChange={e => setModalidad(e.target.value)}
                    style={{ width: '200px' }}
                  >
                    <option value="Presencial">Presencial</option>
                    <option value="Virtual">Virtual</option>
                    <option value="Híbrido">Híbrido</option>
                  </select>
                ) : (
                  modalidad || '[Presencial/Virtual]'
                )}<br />
                <br />
                
                {/* PARTICIPANTES - CORREGIDO */}
                <b  className='punto_name'>3. Participantes</b><br />
                {isEditing ? (
                  <div style={{ margin: '10px 0' }}>
                    {participantes.map((participante, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                        <span style={{ marginRight: '8px' }}>•</span>
                        <input
                          type="text"
                          value={participante}
                          onChange={e => {
                            const newParticipantes = [...participantes];
                            newParticipantes[idx] = e.target.value;
                            setParticipantes(newParticipantes);
                          }}
                          placeholder="Nombre participante"
                          className="input-solicitud-proceedings"
                          style={{ width: '250px', marginRight: '5px' }}
                        />
                        <button 
                          type="button" 
                          onClick={() => setParticipantes(participantes.filter((_, i) => i !== idx))}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: '#dc3545', 
                            cursor: 'pointer',
                            fontSize: '16px',
                            padding: '0 5px'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button 
                      type="button" 
                      onClick={() => setParticipantes([...participantes, ''])}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#00843d', 
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        marginLeft: '18px'
                      }}
                    >
                      + Agregar participante
                    </button>
                  </div>
                ) : (
                  participantes.length > 0 ? participantes.map((p, idx) => <span key={idx}>• {p}<br /></span>) : <span>• [Nombre participante 1]<br />• [Nombre participante 2]</span>
                )}
                <br />
                
                {/* 4. NOTAS RELEVANTES - CAMBIADO A TEXTAREA */}
                <b  className='punto_name page-break-before'>4. Notas Relevantes</b><br />
                {isEditing ? (
                  <textarea
                    className='textarea-proceedings'
                    value={notasRelevantes.join('\n')}
                    onChange={e => setNotasRelevantes(e.target.value.split('\n').filter(line => line.trim() !== ''))}
                    placeholder="• Los cursos deben iniciar puntualmente según el horario establecido.
                • Se acordó que los cursos virtuales serán grabados y compartidos.
                • Las fechas propuestas están sujetas a confirmación por parte de los participantes."
                    rows={5}
                    style={{ 
                      width: '100%', 
                      padding: '1rem', 
                      borderRadius: '5px', 
                      border: '1px solid #ccc',
                      fontSize: '1rem',
                      fontFamily: 'Arial, sans-serif',
                      lineHeight: '1.5',
                      marginTop: '0.5rem',
                      marginBottom: '1rem'
                    }}
                  />
                ) : (
                  <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                    {notasRelevantes.map((nota, index) => (
                      <div key={index} style={{ marginBottom: '0.5rem' }}>• {nota || '[Nota relevante]'}</div>
                    ))}
                  </div>
                )}
                <br />

                {/* 5. CONDICIONES ESPECIALES - CAMBIADO A TEXTAREA */}
                <b  className='punto_name'>5. Condiciones Especiales</b><br />
                {isEditing ? (
                  <textarea
                    className='textarea-proceedings'
                    value={condicionesEspeciales.join('\n')}
                    onChange={e => setCondicionesEspeciales(e.target.value.split('\n').filter(line => line.trim() !== ''))}
                    placeholder="• Se requiere disponibilidad de sala virtual con capacidad para 30 personas.
                • Entrega de material didáctico antes de la primera sesión.
                • Condiciones específicas de conectividad para modalidad virtual."
                    rows={5}
                    style={{ 
                      width: '100%', 
                      padding: '1rem', 
                      borderRadius: '5px', 
                      border: '1px solid #ccc',
                      fontSize: '1rem',
                      fontFamily: 'Arial, sans-serif',
                      lineHeight: '1.5',
                      marginTop: '0.5rem',
                      marginBottom: '1rem'
                    }}
                  />
                ) : (
                  <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                    {condicionesEspeciales.map((condicion, index) => (
                      <div key={index} style={{ marginBottom: '0.5rem' }}>• {condicion || '[Condición especial]'}</div>
                    ))}
                  </div>
                )}
                <br />
                
                <b  className='punto_name'>6. Firma de los Participantes</b><br />
                <table className="table-acta">
                  <thead>
                    <tr>
                      <th className="table-acta-th">Nombre Completo</th>
                      <th className="table-acta-th">Cargo</th>
                      <th className="table-acta-th">Firma</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instructoresAsignados.length > 0 && instructoresAsignados.map((instructor, idx) => (
                      <tr key={`instructor-${idx}`}>
                        <td>{instructor}</td>
                        <td>Instructor Asignado</td>
                        <td style={{ padding: '10px'}}>
                          {firmaDigital ? (
                            <img
                              src={firmaDigital}
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
                          ) : firmaArchivoUrl ? (
                            <img
                              src={firmaArchivoUrl}
                              alt="Firma subida"
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
                      </tr>
                    ))}

                    {coordinadorAcademico && (
                      <tr>
                        <td>{coordinadorAcademico}</td>
                        <td>Coordinador Académico</td>
                        <td>
                          <span style={{ display: 'inline-block', width: '120px', borderBottom: '1px solid #000' }}>
                            &nbsp;
                          </span>
                        </td>
                      </tr>
                    )}

                    {instructores.length > 0 && instructores.map((instructor, idx) => (
                      <tr key={`participante-${idx}`}>
                        <td>{instructor}</td>
                        <td>Instructor Participante</td>
                        <td>
                          <span style={{ display: 'inline-block', width: '120px', borderBottom: '1px solid #000' }}>
                            &nbsp;
                          </span>
                        </td>
                      </tr>
                    ))}

                    {participantes.length > 0 ? participantes.map((p, idx) => (
                      <tr key={`part-${idx}`}>
                        <td>{p}</td>
                        <td>Participante</td>
                        <td>
                          <span style={{ display: 'inline-block', width: '120px', borderBottom: '1px solid #000' }}>
                            &nbsp;
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td>[Nombre Participante]</td>
                        <td>Participante</td>
                        <td>
                          <span style={{ display: 'inline-block', width: '120px', borderBottom: '1px solid #000' }}>
                            &nbsp;
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <br />
                {dateError && <div style={{ color: 'red', marginBottom: '10px' }}>{dateError}</div>}
              </p>
            </div>
          </div>

          <div className="botones-solicitud-proceedings">
            {isEditing ? (
              <button className="submit-button-proceedings" onClick={handleSave} disabled={!!dateError}>
                Guardar
              </button>
            ) : (
              <button className="submit-button-proceedings" onClick={handleEdit}>
                Editar
              </button>
            )}

            <button className="submit-button-proceedings" onClick={handleSendProceeding}>
              Generar acta
            </button>

            {(firmaDigital || firmaArchivoUrl) && (
              <button
                className="submit-button-proceedings"
                onClick={() => {
                  setFirmaDigital("");
                  setFirmaArchivo(null);
                  setFirmaArchivoUrl("");
                }}
                style={{ backgroundColor: '#dc3545' }}
              >
                Limpiar firma
              </button>
            )}

            <button className="submit-button-proceedings" onClick={() => setShowSignatureModal(true)}>
              Agregar firma
            </button>
            <button className="submit-button-proceedings-exportar" onClick={handleDownloadPDF}>
              Exportar
            </button>
          </div>
        </div>
      </Main>
      <Footer />
      {showSignatureModal && (
        <ModalSignature
          closeModal={() => setShowSignatureModal(false)}
          nombreCurso={nombreCurso}
          editar={isEditing}
          tipoActa="Acta de Concertacion"
          onSignature={setFirmaDigital}
          onUpload={handleUploadSignature}
        />
      )}
    </>
  );
};