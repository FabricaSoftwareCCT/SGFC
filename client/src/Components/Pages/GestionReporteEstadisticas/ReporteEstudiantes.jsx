import { useState, useMemo, useEffect, useRef } from 'react';
import EficienciaReporte from './Eficiencia-reporte';
import './ReporteEstudiantes.css';
import axiosInstance from '../../../config/axiosInstance';
import { generarPDFEstudiantes, generarExcelEstudiantes } from '../../../utils/Reports/Estudiantes';
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFileExport,
    faTimesCircle,
    faFilePdf,
    faFileExcel,
    faArrowLeft,
    faDownload,
    faSpinner
} from '@fortawesome/free-solid-svg-icons';

export default function ReporteEstudiantes({ cursoSeleccionado, onVolver }) {
  const [mostrarFiltro, setMostrarFiltro] = useState(false);
  const [mostrarEficiencia, setMostrarEficiencia] = useState(false);
  const [datosEstudiantes, setDatosEstudiantes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [reportType, setReportType] = useState("pdf");
  const [generating, setGenerating] = useState(false);

  const filtroRef = useRef(null);

  const [filtros, setFiltros] = useState({
    nombre: '',
    apellido: '',
    documento: '',
    estado: {
      activo: false,
      inactivo: false
    },
    faltas: '',
    asistencias: ''
  });

  const cursoId = useMemo(()=>{
    return (
      cursoSeleccionado?.id ??
      cursoSeleccionado?.ID ??
      cursoSeleccionado?.curso_ID ??
      cursoSeleccionado?.cursoId ??
      null
    )
  }, [cursoSeleccionado])

  // Cargar empleados del curso con estadísticas de asistencias
  useEffect(() => {
    const cargarDatosEstudiantes = async () => {
        if (!cursoId) {
          setIsLoading(false)
          return
        }

      setIsLoading(true);
      try {
        // Obtener participantes del curso
        const participantsResponse = await axiosInstance.get(
          `/api/courses/cursos/${cursoId}/participants`,
          { params: { limit: 9999 } }
        );

        if (!participantsResponse.data || !participantsResponse.data.success) {
          console.error('Error: La respuesta no tiene success o no existe', participantsResponse.data);
          setDatosEstudiantes([]);
          setIsLoading(false);
          return;
        }

        let participantes = participantsResponse.data.participants || [];

        // Si participantes es un objeto con propiedades, puede que sea un solo participante o estructura diferente
        if (!Array.isArray(participantes)) {
          if (participantes && typeof participantes === 'object') {
            // Intentar convertir a array
            participantes = [participantes];
          } else {
            setDatosEstudiantes([]);
            setIsLoading(false);
            return;
          }
        }

        if (participantes.length === 0) {
          setDatosEstudiantes([]);
          setIsLoading(false);
          return;
        }

        // Obtener registros de asistencia del curso
        let registrosAsistencia = [];
        try {
          const attendanceResponse = await axiosInstance.get(
            `/api/attendance/courses/${cursoId}/get`,
            { params: { limit: 9999 } }
          );

          registrosAsistencia = attendanceResponse.data?.success
            ? (attendanceResponse.data.records || [])
            : [];
        } catch (attendanceError) {
          registrosAsistencia = [];
        }

        // Calcular estadísticas por participante
        const estudiantesConEstadisticas = participantes
          .map((participante, index) => {
            try {
              // Los objetos Sequelize ya están serializados como JSON cuando llegan aquí
              // Acceder directamente a las propiedades
              const participanteData = participante;

              // Acceder al aprendiz - puede estar en diferentes ubicaciones
              let aprendizData = null;
              let aprendizId = null;

              // Intentar múltiples formas de acceder al aprendiz
              if (participanteData.aprendiz) {
                aprendizData = participanteData.aprendiz;
              } else if (participanteData.Aprendiz) {
                aprendizData = participanteData.Aprendiz;
              } else if (participanteData.dataValues?.aprendiz) {
                aprendizData = participanteData.dataValues.aprendiz;
              }

              // Si no encontramos el aprendiz, intentar acceder de forma más directa
              if (!aprendizData) {
                // Último intento: buscar cualquier propiedad que contenga datos de usuario
                const allKeys = Object.keys(participanteData || {});
                for (const key of allKeys) {
                  const value = participanteData[key];
                  if (value && typeof value === 'object' && (value.nombres || value.apellidos || value.documento)) {
                    aprendizData = value;
                    break;
                  }
                }

                if (!aprendizData) {
                  return null;
                }
              }

              // Extraer ID del aprendiz
              aprendizId = aprendizData.ID ||
                aprendizData.id ||
                participanteData.aprendiz_ID ||
                participanteData.aprendizId ||
                null;

              // Si todavía no hay ID, intentar del participante directamente
              if (!aprendizId) {
                aprendizId = participanteData.aprendiz_ID ||
                  participanteData.aprendizId ||
                  null;
              }

              if (!aprendizId) {
                // Si no hay ID pero hay datos del aprendiz, usar el ID del participante como fallback
                if (aprendizData && (aprendizData.nombres || aprendizData.apellidos || aprendizData.documento)) {
                  // Intentar obtener el ID del campo aprendiz_ID del participante
                  aprendizId = participanteData.aprendiz_ID || participanteData.aprendizId || null;
                }

                if (!aprendizId) {
                  return null;
                }
              }

              // Filtrar registros de este aprendiz
              const registrosAprendiz = registrosAsistencia.filter(registro => {
                let registroData = registro;
                if (typeof registro.toJSON === 'function') {
                  registroData = registro.toJSON();
                }

                const registroAprendizId = registroData.aprendiz?.ID ||
                  registroData.aprendiz?.id ||
                  registroData.usuarios_ID ||
                  registroData.usuariosId ||
                  registroData.usuario_ID ||
                  registroData.usuarioId ||
                  registroData.dataValues?.usuarios_ID;

                return registroAprendizId && String(registroAprendizId) === String(aprendizId);
              });

              // Calcular totales
              const asistencias = registrosAprendiz.filter(r => {
                let rData = r;
                if (typeof r.toJSON === 'function') {
                  rData = r.toJSON();
                }
                return (rData.estado_asistencia || '').toLowerCase() === 'presente';
              }).length;

              const faltas = registrosAprendiz.filter(r => {
                let rData = r;
                if (typeof r.toJSON === 'function') {
                  rData = r.toJSON();
                }
                return (rData.estado_asistencia || '').toLowerCase() === 'ausente';
              }).length;

              const estudiante = {
                id: aprendizId,
                nombre: (aprendizData.nombres || '').trim(),
                apellido: (aprendizData.apellidos || '').trim(),
                documento: aprendizData.documento || '',
                estado: (aprendizData.estado || '').toLowerCase() === 'activo' ? 'Activo' : 'Inactivo',
                faltas: faltas,
                asistencias: asistencias
              };

              // Validar que al menos tenga datos básicos
              if (!estudiante.nombre && !estudiante.apellido && !estudiante.documento) {
                return null;
              }

              return estudiante;
            } catch (error) {
              console.error(`Error procesando participante ${index}:`, error);
              return null;
            }
          })
          .filter(estudiante => estudiante !== null && estudiante.id && (estudiante.nombre || estudiante.apellido || estudiante.documento)); // Filtrar nulos y vacíos

        setDatosEstudiantes(estudiantesConEstadisticas);
      } catch (error) {
        console.error('Error al cargar datos de estudiantes:', error);
        console.error('Detalles del error:', error.response?.data || error.message);
        setDatosEstudiantes([]);
      } finally {
        setIsLoading(false);
      }
    };

    cargarDatosEstudiantes();
  }, [cursoId]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (mostrarFiltro && filtroRef.current && !filtroRef.current.contains(event.target)) {
        const botonFiltro = document.querySelector('.button-filtro-reporte-estudiantes');
        if (botonFiltro && !botonFiltro.contains(event.target)) {
          setMostrarFiltro(false);
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mostrarFiltro]);

  // Función para aplicar todos los filtros
  const estudiantesFiltrados = useMemo(() => {
    return datosEstudiantes.filter(estudiante => {
      // Filtro por nombre
      if (filtros.nombre && !estudiante.nombre.toLowerCase().includes(filtros.nombre.toLowerCase())) {
        return false;
      }

      // Filtro por apellido
      if (filtros.apellido && !estudiante.apellido.toLowerCase().includes(filtros.apellido.toLowerCase())) {
        return false;
      }

      // Filtro por documento
      if (filtros.documento && !estudiante.documento.includes(filtros.documento)) {
        return false;
      }

      // Filtro por estado
      const estadosSeleccionados = [];
      if (filtros.estado.activo) estadosSeleccionados.push('Activo');
      if (filtros.estado.inactivo) estadosSeleccionados.push('Inactivo');

      if (estadosSeleccionados.length > 0 && !estadosSeleccionados.includes(estudiante.estado)) {
        return false;
      }

      // Filtro por faltas
      if (filtros.faltas && estudiante.faltas !== parseInt(filtros.faltas)) {
        return false;
      }

      // Filtro por asistencias
      if (filtros.asistencias && estudiante.asistencias !== parseInt(filtros.asistencias)) {
        return false;
      }

      return true;
    });
  }, [filtros, datosEstudiantes]);

  const toggleFiltro = () => {
    setMostrarFiltro(!mostrarFiltro);
  };

  const handleEficienciaClick = () => {
    setMostrarEficiencia(true);
  };

  const handleVolverDesdeEficiencia = () => {
    setMostrarEficiencia(false);
  };

  const handleCheckboxChange = (categoria, opcion) => {
    setFiltros(prev => ({
      ...prev,
      [categoria]: {
        ...prev[categoria],
        [opcion]: !prev[categoria][opcion]
      }
    }));
  };

  const handleInputChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      nombre: '',
      apellido: '',
      documento: '',
      estado: {
        activo: false,
        inactivo: false
      },
      faltas: '',
      asistencias: ''
    });
  };

  const formatDetailedError = (error) => {
    const statusCode = error?.response?.status;
    const statusText = error?.response?.statusText;
    const responseData = error?.response?.data;
    const requestUrl = error?.config?.url;
    const method = error?.config?.method;
    const baseMessage = error?.message || "Error desconocido";
    try {
      const responsePreview = typeof responseData === "string" ? responseData : JSON.stringify(responseData);
      return [
        `Mensaje: ${baseMessage}`,
        requestUrl ? `Endpoint: [${method?.toUpperCase()}] ${requestUrl}` : undefined,
        statusCode ? `HTTP: ${statusCode} ${statusText || ""}`.trim() : undefined,
        responseData ? `Respuesta: ${responsePreview}` : undefined,
      ].filter(Boolean).join("\n");
    } catch (_) {
      return [
        `Mensaje: ${baseMessage}`,
        requestUrl ? `Endpoint: [${method?.toUpperCase()}] ${requestUrl}` : undefined,
        statusCode ? `HTTP: ${statusCode} ${statusText || ""}`.trim() : undefined,
        responseData ? `Respuesta: [no serializable]` : undefined,
      ].filter(Boolean).join("\n");
    }
  };



  // Contador de filtros activos
  const filtrosActivos = () => {
    let count = 0;
    if (filtros.nombre) count++;
    if (filtros.apellido) count++;
    if (filtros.documento) count++;
    if (filtros.estado.activo || filtros.estado.inactivo) count++;
    if (filtros.faltas) count++;
    if (filtros.asistencias) count++;
    return count;
  };

  // Si estamos mostrando el reporte de eficiencia, renderizar ese componente
  if (mostrarEficiencia) {
    return (
      <EficienciaReporte
        cursoSeleccionado={cursoSeleccionado}
        onVolver={handleVolverDesdeEficiencia}
        datosEstudiantes={datosEstudiantes}
      />
    );
  }

  return (
    <div className="reporte-container-estudiantes">
      <div className="titulo-container-estudiantes">
        <button
          className="button-volver-estudiantes"
          onClick={onVolver}
        >
          Volver a Cursos
        </button>
        <h1 className="reporte-titulo-estudiantes">
          Estudiantes - {cursoSeleccionado?.curso || "Curso Seleccionado"}
        </h1>
      </div>

      <div className='container-tabla-estudiantes'>
        <button
          className="button-generar-reporte-estudiantes"
          onClick={() => setShowDownloadOptions(true)}
        >
          Generar reporte
        </button>

        <button
          className="button-eficiencia-estudiantes"
          onClick={handleEficienciaClick}
        >
          Eficiencia
        </button>

        <button
          className='button-filtro-reporte-estudiantes'
          onClick={toggleFiltro}
        >
          Filtro {filtrosActivos() > 0 && `(${filtrosActivos()})`}
        </button>

        {mostrarFiltro && (
          <div className="filtro-menu-estudiantes" ref={filtroRef}>
            <div className="filtro-grupo-estudiantes">
              <div className="filtro-titulo-estudiantes">Nombre</div>
              <input
                type="text"
                className="filtro-input-estudiantes"
                placeholder="Buscar por nombre..."
                value={filtros.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
              />
            </div>

            <div className="filtro-grupo-estudiantes">
              <div className="filtro-titulo-estudiantes">Apellido</div>
              <input
                type="text"
                className="filtro-input-estudiantes"
                placeholder="Buscar por apellido..."
                value={filtros.apellido}
                onChange={(e) => handleInputChange('apellido', e.target.value)}
              />
            </div>

            <div className="filtro-grupo-estudiantes">
              <div className="filtro-titulo-estudiantes">Documento</div>
              <input
                type="text"
                className="filtro-input-estudiantes"
                placeholder="Buscar por documento..."
                value={filtros.documento}
                onChange={(e) => handleInputChange('documento', e.target.value)}
              />
            </div>

            <div className="filtro-grupo-estudiantes">
              <div className="filtro-titulo-estudiantes">Estado</div>
              <div className="filtro-opciones-estudiantes">
                <div
                  className="filtro-opcion-estudiantes"
                  onClick={() => handleCheckboxChange('estado', 'activo')}
                >
                  <div className={`filtro-checkbox-estudiantes ${filtros.estado.activo ? 'checked' : ''}`}></div>
                  <span>Activo</span>
                </div>
                <div
                  className="filtro-opcion-estudiantes"
                  onClick={() => handleCheckboxChange('estado', 'inactivo')}
                >
                  <div className={`filtro-checkbox-estudiantes ${filtros.estado.inactivo ? 'checked' : ''}`}></div>
                  <span>Inactivo</span>
                </div>
              </div>
            </div>

            <div className="filtro-grupo-estudiantes">
              <div className="filtro-titulo-estudiantes">Faltas</div>
              <input
                type="number"
                className="filtro-input-estudiantes"
                placeholder="Filtrar por faltas..."
                value={filtros.faltas}
                onChange={(e) => handleInputChange('faltas', e.target.value)}
                min="0"
              />
            </div>

            <div className="filtro-grupo-estudiantes">
              <div className="filtro-titulo-estudiantes">N° Asistencias</div>
              <input
                type="number"
                className="filtro-input-estudiantes"
                placeholder="Filtrar por asistencias..."
                value={filtros.asistencias}
                onChange={(e) => handleInputChange('asistencias', e.target.value)}
                min="0"
              />
            </div>

            <div className="filtro-info-estudiantes">
              <div className="filtro-resultados-estudiantes">
                Resultados: {estudiantesFiltrados.length} de {datosEstudiantes.length} estudiantes
              </div>
            </div>

            <div className="filtro-botones-estudiantes">
              <button className="filtro-boton-estudiantes filtro-limpiar-estudiantes" onClick={limpiarFiltros}>
                Limpiar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="tabla-datos-estudiantes">
        <div className="tabla-cabecera-estudiantes">
          <div>Nombres</div>
          <div>Apellidos</div>
          <div>Documentos</div>
          <div>Estado</div>
          <div>Faltas</div>
          <div>N° Asistencias</div>
        </div>

        {isLoading ? (
          <div className="no-resultados-estudiantes">
            Cargando datos...
          </div>
        ) : datosEstudiantes.length === 0 ? (
          <div className="no-resultados-estudiantes">
            No hay estudiantes registrados en este curso
          </div>
        ) : estudiantesFiltrados.length > 0 ? (
          estudiantesFiltrados.map((estudiante, index) => (
            <div key={estudiante.id || index} className="tabla-fila-estudiantes">
              <div className="columna-nombre-estudiantes">{estudiante.nombre || '-'}</div>
              <div className="columna-apellido-estudiantes">{estudiante.apellido || '-'}</div>
              <div className="columna-documento-estudiantes">{estudiante.documento || '-'}</div>
              <div className={estudiante.estado === "Activo" ? "estado-activo-estudiantes" : "estado-inactivo-estudiantes"}>
                {estudiante.estado || '-'}
              </div>
              <div className="columna-faltas-estudiantes">{estudiante.faltas || 0}</div>
              <div className="columna-asistencias-estudiantes">{estudiante.asistencias || 0}</div>
            </div>
          ))
        ) : (
          <div className="no-resultados-estudiantes">
            No se encontraron estudiantes que coincidan con los filtros aplicados
          </div>
        )}
      </div>

      {showDownloadOptions && (
        <div className="modal-overlay">
          <div className="modal-background-a">
            <div className="modal-header-container">
              <div className="modal-header-content">
                <FontAwesomeIcon icon={faFileExport} className="modal-header-icon" />
                <div>
                  <h2 className="modal-title">Generar Reporte</h2>
                  <p className="modal-subtitle">Selecciona el formato del reporte</p>
                </div>
              </div>
              <button
                onClick={() => setShowDownloadOptions(false)}
                className="modal-close-btn"
                aria-label="Cerrar modal"
                disabled={generating}
              >
                <FontAwesomeIcon icon={faTimesCircle} />
              </button>
            </div>

            <div className="modal-body">
              <div className="report-type-selector">
                <button
                  className={`report-type-btn ${reportType === "pdf" ? "selected" : ""}`}
                  onClick={() => setReportType("pdf")}
                  disabled={generating}
                >
                  <div className="report-type-icon-wrapper">
                    <FontAwesomeIcon icon={faFilePdf} className="report-type-icon" />
                  </div>
                  <div className="report-type-info">
                    <h4 className="report-type-title">PDF</h4>
                    <p className="report-type-desc">Formato óptimo para impresión</p>
                  </div>
                </button>

                <button
                  className={`report-type-btn ${reportType === "excel" ? "selected" : ""}`}
                  onClick={() => setReportType("excel")}
                  disabled={generating}
                >
                  <div className="report-type-icon-wrapper">
                    <FontAwesomeIcon icon={faFileExcel} className="report-type-icon" />
                  </div>
                  <div className="report-type-info">
                    <h4 className="report-type-title">Excel</h4>
                    <p className="report-type-desc">Formato para análisis de datos</p>
                  </div>
                </button>
              </div>

              <div className="modal-actions">
                <button
                  className="modal-btn modal-btn-secondary"
                  onClick={() => setShowDownloadOptions(false)}
                  disabled={generating}
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                  <span>Cancelar</span>
                </button>

                <button
                  className="modal-btn modal-btn-primary"
                  onClick={async () => {
                    setGenerating(true);
                    const datosReporte = estudiantesFiltrados.length > 0 ? estudiantesFiltrados : datosEstudiantes;

                    if (datosReporte.length === 0) {
                      Swal.fire({
                        icon: "info",
                        title: "Sin datos",
                        text: 'No hay datos para generar el reporte',
                        confirmButtonText: "Okay",
                        theme: "bulma",
                        customClass: {
                          confirmButton: 'button is-primary',
                          actions: 'swal2-actions-centered'
                        }
                      });
                      setGenerating(false);
                      return;
                    }

                    try {
                      if (reportType === "excel") {
                        generarExcelEstudiantes(datosReporte, cursoSeleccionado?.curso || 'Curso');
                      } else {
                        await generarPDFEstudiantes(datosReporte, cursoSeleccionado?.curso || 'Curso');
                      }
                    } catch (err) {
                      console.error(`Error generando ${reportType.toUpperCase()}:`, err);
                      Swal.fire({
                        icon: "error",
                        title: "Error del sistema",
                        text: `Error al generar ${reportType.toUpperCase()}\n\n${formatDetailedError(err)}`,
                        confirmButtonText: "Okay",
                        theme: "bulma",
                        customClass: {
                          confirmButton: 'button is-primary',
                          actions: 'swal2-actions-centered'
                        }
                      });
                    } finally {
                      setGenerating(false);
                    }
                  }}
                  disabled={generating || datosEstudiantes.length === 0}
                >
                  {generating ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="spinner" />
                      <span>Generando...</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faDownload} />
                      <span>Generar Reporte</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
