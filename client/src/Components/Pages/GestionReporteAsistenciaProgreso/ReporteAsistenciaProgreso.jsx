import { useEffect, useMemo, useRef, useState } from 'react';
import './ReporteAsistenciaProgreso.css';
import { Main } from '../../Layouts/Main/Main';
import { Footer } from '../../Layouts/Footer/Footer';
import {
  getAllCursosForFilters,
  getAllLearnersForFilters,
  getCoursesByLearner,
  getLearnersByCourse,
  getAttendanceProgressReport
} from '../../API/ApiReporteAsistencia';
import {
  generarPDFAsistenciaProgreso,
  generarExcelAsistenciaProgreso
} from '../../../utils/Reports/AsistenciaProgreso';

export default function ReporteAsistenciaProgreso() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [previewData, setPreviewData] = useState([]);
  const [courses, setCourses] = useState([]);
  const [learners, setLearners] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [allLearners, setAllLearners] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [filterErrorMessage, setFilterErrorMessage] = useState({ learner: '', course: '' });
  const [filters, setFilters] = useState({
    learnerId: '',
    courseId: '',
    dateFrom: '',
    dateTo: ''
  });
  const [scrollShadows, setScrollShadows] = useState({ top: false, bottom: false });

  const previewRef = useRef(null);
  const tableBodyRef = useRef(null);
  const filterTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const cursosFormateados = await getAllCursosForFilters();
        setAllCourses(cursosFormateados);
        setCourses(cursosFormateados);
      } catch (err) {
        console.error('No se pudieron cargar cursos para filtros:', err);
      }
      try {
        const aprendicesFormateados = await getAllLearnersForFilters();
        setAllLearners(aprendicesFormateados);
        setLearners(aprendicesFormateados);
      } catch (err) {
        console.error('No se pudieron cargar aprendices para filtros:', err);
      }
    };
    fetchInitial();
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Boolean(filters.learnerId || filters.courseId || (filters.dateFrom && filters.dateTo));
  }, [filters]);

  useEffect(() => {
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }

    const loadFilters = async () => {
      setIsLoadingFilters(true);
      setFilterErrorMessage({ learner: '', course: '' });
      
      try {
        if (filters.learnerId && filters.learnerId !== '') {
          const response = await getCoursesByLearner(filters.learnerId);
          
          if (response.success && response.courses && response.courses.length > 0) {
            setCourses(response.courses);
            setFilterErrorMessage(prev => ({ ...prev, course: '' }));
            if (filters.courseId && !response.courses.find(c => {
              const courseIdNum = parseInt(filters.courseId);
              const cIdNum = parseInt(c.id);
              return cIdNum === courseIdNum || c.id === filters.courseId;
            })) {
              setFilters(prev => ({ ...prev, courseId: '' }));
            }
          } else {
            setCourses([]);
            setFilterErrorMessage(prev => ({ ...prev, course: 'Este aprendiz no está inscrito en ningún curso' }));
            setFilters(prev => ({ ...prev, courseId: '' }));
          }
        } else {
          setCourses(allCourses);
          setFilterErrorMessage(prev => ({ ...prev, course: '' }));
        }

        if (filters.courseId && filters.courseId !== '') {
          const response = await getLearnersByCourse(filters.courseId);
          
          if (response.success && response.learners && response.learners.length > 0) {
            setLearners(response.learners);
            setFilterErrorMessage(prev => ({ ...prev, learner: '' }));
            if (filters.learnerId && !response.learners.find(l => {
              const learnerIdNum = parseInt(filters.learnerId);
              const lIdNum = parseInt(l.id);
              return lIdNum === learnerIdNum || l.id === filters.learnerId;
            })) {
              setFilters(prev => ({ ...prev, learnerId: '' }));
            }
          } else {
            setLearners([]);
            setFilterErrorMessage(prev => ({ ...prev, learner: 'Este curso no tiene aprendices inscritos' }));
            setFilters(prev => ({ ...prev, learnerId: '' }));
          }
        } else {
          setLearners(allLearners);
          setFilterErrorMessage(prev => ({ ...prev, learner: '' }));
        }
      } catch (error) {
        console.error('Error al cargar filtros dinámicos:', error);
        if (filters.learnerId && filters.learnerId !== '') {
          setCourses(allCourses);
          setFilterErrorMessage(prev => ({ ...prev, course: 'Error al cargar cursos' }));
        }
        if (filters.courseId && filters.courseId !== '') {
          setLearners(allLearners);
          setFilterErrorMessage(prev => ({ ...prev, learner: 'Error al cargar aprendices' }));
        }
      } finally {
        setIsLoadingFilters(false);
      }
    };

    filterTimeoutRef.current = setTimeout(loadFilters, 300);

    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, [filters.learnerId, filters.courseId, allCourses, allLearners]);

  const handleChange = (field, value) => {
    setErrorMessage('');
    
    if (field === 'learnerId') {
      if (value === '') {
        setFilters(prev => ({ learnerId: '', courseId: '', dateFrom: prev.dateFrom, dateTo: prev.dateTo }));
      } else {
        setFilters(prev => ({ ...prev, learnerId: value, courseId: '' }));
      }
    } else if (field === 'courseId') {
      if (value === '') {
        setFilters(prev => ({ learnerId: '', courseId: '', dateFrom: prev.dateFrom, dateTo: prev.dateTo }));
      } else {
        setFilters(prev => ({ ...prev, courseId: value, learnerId: '' }));
      }
    } else {
      setFilters(prev => ({ ...prev, [field]: value }));
    }
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

  useEffect(() => {
    const tableBody = tableBodyRef.current;
    if (!tableBody) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = tableBody;
      setScrollShadows({
        top: scrollTop > 5,
        bottom: scrollTop < scrollHeight - clientHeight - 5
      });
    };

    tableBody.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      tableBody.removeEventListener('scroll', handleScroll);
    };
  }, [previewData]);

  const generateReport = async () => {
    setErrorMessage('');
    if (!validateFilters()) return;
    setIsGenerating(true);
    setIsLoading(true);
    try {
      const response = await getAttendanceProgressReport(filters);

      if (response.success && response.records && response.records.length > 0) {
        setPreviewData(response.records);
      } else {
        setPreviewData([]);
        setErrorMessage('No se encontraron registros para los criterios seleccionados.');
      }
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || 'Error al generar el reporte';
        
        if (status === 401) {
          setErrorMessage('No estás autenticado. Por favor, inicia sesión nuevamente.');
        } else if (status === 403) {
          setErrorMessage('No tienes permisos para generar este reporte.');
        } else if (status === 404) {
          setErrorMessage('No se encontraron registros para los criterios seleccionados.');
        } else if (status === 400) {
          setErrorMessage(message);
        } else {
          setErrorMessage('Error al generar el reporte. Por favor, intenta nuevamente.');
        }
      } else {
        setErrorMessage('Error de conexión. Por favor, verifica tu internet e intenta nuevamente.');
      }
      setPreviewData([]);
    } finally {
      setIsGenerating(false);
      setIsLoading(false);
    }
  };

  const SkeletonRow = () => (
    <div className="preview_table_row skeleton_row">
      <div className="preview_cell_text skeleton_cell"></div>
      <div className="preview_cell_number skeleton_cell"></div>
      <div className="preview_cell_text skeleton_cell"></div>
      <div className="preview_cell_center skeleton_cell skeleton_badge"></div>
      <div className="preview_cell_number skeleton_cell"></div>
      <div className="preview_cell_text skeleton_cell"></div>
    </div>
  );

  const downloadPDF = async () => {
    try {
      await generarPDFAsistenciaProgreso(previewData, filters, courses, learners, 'save');
    } catch (error) {
      alert(error.message || 'Error al generar el PDF');
    }
  };

  const printPDF = async () => {
    try {
      await generarPDFAsistenciaProgreso(previewData, filters, courses, learners, 'print');
    } catch (error) {
      alert(error.message || 'Error al imprimir el PDF');
    }
  };

  const downloadXLSX = () => {
    try {
      generarExcelAsistenciaProgreso(previewData);
    } catch (error) {
      alert(error.message || 'Ocurrió un error al generar el archivo Excel');
    }
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
              <label>
                Aprendiz 
                {isLoadingFilters && filters.courseId && (
                  <span className="filter_status_loading">(filtrando...)</span>
                )}
                {!isLoadingFilters && filterErrorMessage.learner && (
                  <span className="filter_status_error">{filterErrorMessage.learner}</span>
                )}
              </label>
              <select 
                value={filters.learnerId} 
                onChange={e => handleChange('learnerId', e.target.value)}
                disabled={isLoadingFilters && filters.courseId}
                className={filterErrorMessage.learner ? 'filter_select_error' : ''}
              >
                <option value="">Todos</option>
                {learners.map(l => (
                  <option key={l.id} value={l.id}>{l.name} {l.documento ? `- ${l.documento}` : ''}</option>
                ))}
              </select>
            </div>
            <div className="filter_field">
              <label>
                Curso 
                {isLoadingFilters && filters.learnerId && (
                  <span className="filter_status_loading">(filtrando...)</span>
                )}
                {!isLoadingFilters && filterErrorMessage.course && (
                  <span className="filter_status_error">{filterErrorMessage.course}</span>
                )}
              </label>
              <select 
                value={filters.courseId} 
                onChange={e => handleChange('courseId', e.target.value)}
                disabled={isLoadingFilters && filters.learnerId}
                className={filterErrorMessage.course ? 'filter_select_error' : ''}
              >
                <option value="">Todos</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
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
          <button className="btn_print" onClick={printPDF} disabled={!previewData.length}>Imprimir</button>
        </div>
      </div>

      <div className="reporte-ap_preview" ref={previewRef}>
        {!isLoading && previewData.length === 0 ? (
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
          <>
            <div className="preview_table_wrapper">
              <div className="preview_table">
                <div className="preview_table_head sticky_header">
                  <div className="preview_cell_text">Aprendiz</div>
                  <div className="preview_cell_number">Documento</div>
                  <div className="preview_cell_text">Curso</div>
                  <div className="preview_cell_center">Estado</div>
                  <div className="preview_cell_number">Fecha</div>
                  <div className="preview_cell_text">Registrado por</div>
                </div>
                <div 
                  className={`preview_table_body ${scrollShadows.top ? 'shadow-top' : ''} ${scrollShadows.bottom ? 'shadow-bottom' : ''}`}
                  ref={tableBodyRef}
                >
                  {isLoading ? (
                    <>
                      {[...Array(10)].map((_, idx) => (
                        <SkeletonRow key={`skeleton-${idx}`} />
                      ))}
                    </>
                  ) : (
                    previewData.map((row, idx) => {
                      const estadoAsistencia = row.estadoAsistencia || '';
                      const isPresente = estadoAsistencia.toLowerCase() === 'presente';
                      const isAusente = estadoAsistencia.toLowerCase() === 'ausente';
                      
                      return (
                        <div className="preview_table_row" key={idx}>
                          <div className="preview_cell_text">{`${row.nombreUser || ''} ${row.apellidoUser || ''}`.trim() || '-'}</div>
                          <div className="preview_cell_number">{row.documentoUser || '-'}</div>
                          <div className="preview_cell_text">{row.nombreCurso || '-'}</div>
                          <div className="preview_cell_center">
                            {isPresente && (
                              <span className="badge badge-presente">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                Presente
                              </span>
                            )}
                            {isAusente && (
                              <span className="badge badge-ausente">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                                Ausente
                              </span>
                            )}
                            {!isPresente && !isAusente && (
                              <span className="badge badge-pendiente">{estadoAsistencia || '-'}</span>
                            )}
                          </div>
                          <div className="preview_cell_number">{row.fechaAsistencia ? new Date(row.fechaAsistencia).toLocaleDateString('es-CO') : '-'}</div>
                          <div className="preview_cell_text">{row.registradoPor || '-'}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              {!isLoading && previewData.length > 0 && (
                <div className="preview_table_footer sticky_footer">
                  {(() => {
                    const totales = previewData.reduce((acc, row) => {
                      const estado = (row.estadoAsistencia || '').toLowerCase();
                      acc.total++;
                      if (estado === 'presente') acc.presentes++;
                      else if (estado === 'ausente') acc.ausentes++;
                      else acc.otros++;
                      return acc;
                    }, { total: 0, presentes: 0, ausentes: 0, otros: 0 });
                    
                    return (
                      <div className="footer_stats">
                        <span className="stat_item">
                          <strong>{totales.total}</strong> registro{totales.total !== 1 ? 's' : ''} total{totales.total !== 1 ? 'es' : ''}
                        </span>
                        <span className="stat_separator">•</span>
                        <span className="stat_item stat_presente">
                          <strong>{totales.presentes}</strong> Presente{totales.presentes !== 1 ? 's' : ''}
                        </span>
                        <span className="stat_separator">•</span>
                        <span className="stat_item stat_ausente">
                          <strong>{totales.ausentes}</strong> Ausente{totales.ausentes !== 1 ? 's' : ''}
                        </span>
                        {totales.otros > 0 && (
                          <>
                            <span className="stat_separator">•</span>
                            <span className="stat_item stat_otros">
                              <strong>{totales.otros}</strong> Otro{totales.otros !== 1 ? 's' : ''}
                            </span>
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
    </Main>
    <Footer />
    </>
  );
}


