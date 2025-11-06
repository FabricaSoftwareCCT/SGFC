import { useEffect, useMemo, useRef, useState } from 'react';
import './ReporteAsistenciaProgreso.css';
import { Main } from '../../Layouts/Main/Main';
import { Footer } from '../../Layouts/Footer/Footer';
import axiosInstance from '../../../config/axiosInstance';
import html2pdf from 'html2pdf.js';
import * as xlsx from 'xlsx';

export default function ReporteAsistenciaProgreso() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [previewData, setPreviewData] = useState([]);
  const [courses, setCourses] = useState([]);
  const [learners, setLearners] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [filters, setFilters] = useState({
    learnerId: '',
    courseId: '',
    dateFrom: '',
    dateTo: ''
  });

  const previewRef = useRef(null);

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        // Cargar cursos para el selector (usa endpoint existente de reportes con paginado 1 por defecto)
        const cursos = (await axiosInstance.get('/api/reports/ObtenerCursos/admin/1')).data?.curso?.cursos || [];
        setCourses(cursos.map(c => ({ id: c.id, name: c.nombre_curso })));
      } catch (err) {
        console.error('No se pudieron cargar cursos para filtros:', err);
      }
      try {
        // Intento: obtener aprendices si hay endpoint admin (no bloqueante)
        const resp = await axiosInstance.get('/api/users/admin/empleados?limit=9999');
        const empleados = resp?.data?.empleados || [];
        setLearners(empleados.map(e => ({ id: e.ID || e.id || e.documento, name: `${e.nombres} ${e.apellidos}`, documento: e.documento })));
      } catch (err) {
        console.error('No se pudieron cargar aprendices para filtros:', err);
      }
    };
    fetchInitial();
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Boolean(filters.learnerId || filters.courseId || (filters.dateFrom && filters.dateTo));
  }, [filters]);

  const handleChange = (field, value) => {
    setErrorMessage('');
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const validateFilters = () => {
    if (!filters.learnerId && !filters.courseId && !(filters.dateFrom && filters.dateTo)) {
      setErrorMessage('Debes seleccionar un aprendiz, un curso o un rango de fechas.');
      return false;
    }
    if ((filters.dateFrom && !filters.dateTo) || (!filters.dateFrom && filters.dateTo)) {
      setErrorMessage('Completa el rango de fechas (inicio y fin).');
      return false;
    }
    if (filters.dateFrom && filters.dateTo && new Date(filters.dateFrom) > new Date(filters.dateTo)) {
      setErrorMessage('La fecha de inicio no puede ser mayor a la fecha fin.');
      return false;
    }
    return true;
  };

  const generateReport = async () => {
    setErrorMessage('');
    if (!validateFilters()) return;
    setIsGenerating(true);
    try {
      // Construcción de payload compatible con rutas existentes
      const filtre = {};
      if (filters.courseId) filtre.nombre_curso = filters.courseId; // backend espera nombre_curso en algunos flujos
      if (filters.dateFrom) filtre.fecha_inicio = filters.dateFrom;
      if (filters.dateTo) filtre.fecha_fin = filters.dateTo;

      let data = [];

      // Preferir reporte general si hay criterios por curso/fechas
      if (Object.keys(filtre).length > 0) {
        const res = await axiosInstance.get('/api/reports/generarReporte', { data: { nombre_curso: filters.courseId, filtre } });
        data = Array.isArray(res.data) ? res.data : [];
      }

      // Si solo hay aprendiz, intentar asistencia/progreso por aprendiz vía attendance (fallback simple)
      if (data.length === 0 && filters.learnerId) {
        try {
          const attend = await axiosInstance.get(`/api/attendance/user/${filters.learnerId}`);
          data = Array.isArray(attend.data) ? attend.data : [];
        } catch (err) {
          console.error('Fallo consulta de asistencia por aprendiz:', err);
        }
      }

      if (!data || data.length === 0) {
        setPreviewData([]);
        setErrorMessage('No hay registros para los criterios seleccionados.');
        return;
      }

      setPreviewData(data);
    } catch (error) {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        setErrorMessage('No tienes permisos para generar este reporte.');
      } else if (error?.response?.status === 404) {
        setErrorMessage('No hay registros para los criterios seleccionados.');
      } else {
        setErrorMessage('Ocurrió un error al generar el reporte.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = async () => {
    if (!previewRef.current) return;
    const worker = html2pdf().set({
      margin: 10,
      filename: 'reporte_asistencia_progreso.pdf',
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#FFFFFF' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(previewRef.current);
    await worker.save();
  };

  const downloadXLSX = () => {
    const rows = Array.isArray(previewData) ? previewData : [];
    const sheet = xlsx.utils.json_to_sheet(rows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, sheet, 'Reporte');
    xlsx.writeFile(wb, 'reporte_asistencia_progreso.xlsx', { compression: true });
  };

  return (
    <>
    <Main>
    <div className="reporte-ap-container">
      <div className="reporte-ap_header">
        <h2 className="reporte-ap_title">Reporte de Asistencia y Progreso</h2>
        <div className="reporte-ap_actions">
          <button className="btn_toggle_filters" onClick={() => setShowFilters(v => !v)}>
            {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="reporte-ap_filters">
          <div className="filter_row">
            <div className="filter_field">
              <label>Aprendiz</label>
              <select value={filters.learnerId} onChange={e => handleChange('learnerId', e.target.value)}>
                <option value="">Todos</option>
                {learners.map(l => (
                  <option key={l.id} value={l.id}>{l.name} {l.documento ? `- ${l.documento}` : ''}</option>
                ))}
              </select>
            </div>
            <div className="filter_field">
              <label>Curso</label>
              <select value={filters.courseId} onChange={e => handleChange('courseId', e.target.value)}>
                <option value="">Todos</option>
                {courses.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="filter_field">
              <label>Desde</label>
              <input type="date" value={filters.dateFrom} onChange={e => handleChange('dateFrom', e.target.value)} />
            </div>
            <div className="filter_field">
              <label>Hasta</label>
              <input type="date" value={filters.dateTo} onChange={e => handleChange('dateTo', e.target.value)} />
            </div>
          </div>

          <div className="filter_actions">
            <button className="btn_generate" onClick={generateReport} disabled={isGenerating}>
              {!isGenerating && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 5v14l11-7-11-7z"/>
                </svg>
              )}
              {isGenerating ? 'Generando...' : 'Generar reporte'}
            </button>
            <div className="filters_hint">{hasActiveFilters ? 'Filtros activos' : 'Sin filtros aplicados'}</div>
          </div>

          {errorMessage && <div className="error_box">{errorMessage}</div>}
        </div>
      )}

      <div className="reporte-ap_preview_header">
        <h3>Vista previa</h3>
        <div className="preview_actions">
          <button className="btn_pdf" onClick={downloadPDF} disabled={!previewData.length}>Descargar PDF</button>
          <button className="btn_xlsx" onClick={downloadXLSX} disabled={!previewData.length}>Descargar XLSX</button>
          <button className="btn_print" onClick={() => window.print()} disabled={!previewData.length}>Imprimir</button>
        </div>
      </div>

      <div className="reporte-ap_preview" ref={previewRef}>
        {previewData.length === 0 ? (
          <div className="empty_state">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M3 4h18v14H3z" fill="none" stroke="#6B7280" strokeWidth="1.5"/>
              <path d="M3 9h18" stroke="#6B7280" strokeWidth="1.5"/>
              <circle cx="8" cy="13" r="1.5" fill="#6B7280"/>
              <circle cx="12" cy="13" r="1.5" fill="#6B7280"/>
              <circle cx="16" cy="13" r="1.5" fill="#6B7280"/>
            </svg>
            <div className="empty_title">No hay datos para mostrar</div>
            <div className="empty_help">Ajusta los filtros y vuelve a generar el reporte.</div>
          </div>
        ) : (
          <div className="preview_table">
            <div className="preview_table_head">
              <div>Aprendiz</div>
              <div>Documento</div>
              <div>Curso</div>
              <div>Estado</div>
              <div>Fecha</div>
              <div>Registrado por</div>
            </div>
            {previewData.map((row, idx) => (
              <div className="preview_table_row" key={idx}>
                <div>{row.nombreUser || row.nombres || '-'}</div>
                <div>{row.documentoUser || row.documento || '-'}</div>
                <div>{row.nombreCurso || row.Curso?.nombre_curso || '-'}</div>
                <div>{row.estadoAsistencia || row.estado || '-'}</div>
                <div>{row.fechaAsistencia || row.fecha || '-'}</div>
                <div>{row.registradoPor || '-'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </Main>
    <Footer />
    </>
  );
}


