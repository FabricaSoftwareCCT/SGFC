import html2pdf from 'html2pdf.js';
import * as xlsx from 'xlsx';

export const generarExcelAsistenciaProgreso = (previewData) => {
  try {
    const rows = Array.isArray(previewData) ? previewData : [];
    
    const filteredRows = rows.map(row => ({
      nombreUser: row.nombreUser,
      apellidoUser: row.apellidoUser,
      documentoUser: row.documentoUser,
      emailUser: row.emailUser,
      nombreCurso: row.nombreCurso,
      fichaCurso: row.fichaCurso,
      estadoAsistencia: row.estadoAsistencia,
      fechaAsistencia: row.fechaAsistencia,
      registradoPor: row.registradoPor
    }));
    
    const sheet = xlsx.utils.json_to_sheet(filteredRows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, sheet, 'Reporte');
    xlsx.writeFile(wb, 'reporte_asistencia_progreso.xlsx', { compression: true });
  } catch (error) {
    console.error('Error al generar Excel:', error);
    throw new Error('Ocurrió un error al generar el archivo Excel');
  }
};

export const createPDFContainerAsistenciaProgreso = (previewData, filters, courses, learners) => {
  const pdfContainer = document.createElement('div');
  pdfContainer.id = 'pdf-container-temp';
  pdfContainer.style.position = 'fixed';
  pdfContainer.style.top = '0';
  pdfContainer.style.left = '-10000px';
  pdfContainer.style.width = '794px';
  pdfContainer.style.padding = '40px';
  pdfContainer.style.backgroundColor = '#FFFFFF';
  pdfContainer.style.fontFamily = 'Arial, Helvetica, sans-serif';
  pdfContainer.style.fontSize = '10pt';
  pdfContainer.style.color = '#000000';
  pdfContainer.style.boxSizing = 'border-box';
  pdfContainer.style.visibility = 'visible';
  pdfContainer.style.opacity = '1';
  pdfContainer.style.display = 'block';
  pdfContainer.style.pointerEvents = 'none';
  
  const title = document.createElement('h1');
  title.textContent = 'Reporte de Asistencia y Progreso';
  title.style.margin = '0 0 15px 0';
  title.style.fontSize = '20pt';
  title.style.fontWeight = 'bold';
  title.style.color = '#000000';
  title.style.borderBottom = '3px solid #00843d';
  title.style.paddingBottom = '10px';
  pdfContainer.appendChild(title);
  
  const filterInfo = document.createElement('div');
  filterInfo.style.marginBottom = '20px';
  filterInfo.style.fontSize = '10pt';
  filterInfo.style.color = '#333333';
  const activeFilters = [];
  if (filters.courseId) {
    const course = courses.find(c => c.id === parseInt(filters.courseId));
    if (course) activeFilters.push(`Curso: ${course.name}`);
  }
  if (filters.learnerId) {
    const learner = learners.find(l => l.id === parseInt(filters.learnerId) || l.id === filters.learnerId);
    if (learner) activeFilters.push(`Aprendiz: ${learner.name}`);
  }
  if (filters.dateFrom && filters.dateTo) {
    const fechaInicio = new Date(filters.dateFrom).toLocaleDateString('es-CO');
    const fechaFin = new Date(filters.dateTo).toLocaleDateString('es-CO');
    activeFilters.push(`Rango: ${fechaInicio} - ${fechaFin}`);
  }
  filterInfo.innerHTML = `<strong>Filtros aplicados:</strong> ${activeFilters.length > 0 ? activeFilters.join(', ') : 'Ninguno'}`;
  pdfContainer.appendChild(filterInfo);
  
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.marginTop = '10px';
  table.style.fontSize = '9pt';
  table.style.tableLayout = 'auto';
  
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.style.backgroundColor = '#00843d';
  headerRow.style.color = '#FFFFFF';
  const headers = ['Aprendiz', 'Documento', 'Curso', 'Estado', 'Fecha', 'Registrado por'];
  headers.forEach(headerText => {
    const th = document.createElement('th');
    th.textContent = headerText;
    th.style.padding = '10px 8px';
    th.style.border = '1px solid #006633';
    th.style.textAlign = 'left';
    th.style.fontWeight = 'bold';
    th.style.fontSize = '10pt';
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  const tbody = document.createElement('tbody');
  
  if (previewData && previewData.length > 0) {
    previewData.forEach((row, idx) => {
      const tr = document.createElement('tr');
      tr.style.backgroundColor = idx % 2 === 0 ? '#FFFFFF' : '#F9F9F9';
      tr.style.borderBottom = '1px solid #E0E0E0';
      
      const nombreCompleto = `${row.nombreUser || ''} ${row.apellidoUser || ''}`.trim() || 'N/A';
      const documento = String(row.documentoUser || 'N/A');
      const curso = String(row.nombreCurso || 'N/A');
      const estado = String(row.estadoAsistencia || 'N/A');
      
      let fecha = 'N/A';
      if (row.fechaAsistencia) {
        try {
          const fechaObj = new Date(row.fechaAsistencia);
          if (!isNaN(fechaObj.getTime())) {
            fecha = fechaObj.toLocaleDateString('es-CO', { 
              year: 'numeric', 
              month: '2-digit', 
              day: '2-digit' 
            });
          }
        } catch (e) {
          console.error('Error al formatear fecha:', row.fechaAsistencia, e);
        }
      }
      
      const registrador = String(row.registradoPor || 'N/A');
      const cells = [nombreCompleto, documento, curso, estado, fecha, registrador];
      
      cells.forEach((cellText, cellIdx) => {
        const td = document.createElement('td');
        td.textContent = cellText;
        td.style.padding = '8px';
        td.style.border = '1px solid #CCCCCC';
        td.style.wordWrap = 'break-word';
        td.style.verticalAlign = 'top';
        td.style.fontSize = '9pt';
        td.style.color = '#000000';
        td.style.minWidth = '30mm';
        if (cellIdx === 0) td.style.maxWidth = '60mm';
        if (cellIdx === 2) td.style.maxWidth = '50mm';
        tr.appendChild(td);
      });
      
      tbody.appendChild(tr);
    });
  } else {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 6;
    td.textContent = 'No hay datos para mostrar';
    td.style.padding = '20px';
    td.style.textAlign = 'center';
    td.style.color = '#666666';
    td.style.fontSize = '10pt';
    tr.appendChild(td);
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  pdfContainer.appendChild(table);
  
  const totales = previewData.reduce((acc, row) => {
    const estado = (row.estadoAsistencia || '').toLowerCase();
    acc.total++;
    if (estado === 'presente') acc.presentes++;
    else if (estado === 'ausente') acc.ausentes++;
    else acc.otros++;
    return acc;
  }, { total: 0, presentes: 0, ausentes: 0, otros: 0 });
  
  const summary = document.createElement('div');
  summary.style.marginTop = '25px';
  summary.style.paddingTop = '20px';
  summary.style.borderTop = '3px solid #00843d';
  summary.style.fontSize = '10pt';
  summary.style.color = '#000000';
  summary.style.backgroundColor = '#f5f5f5';
  summary.style.padding = '15px 20px';
  summary.style.borderRadius = '5px';
  
  const summaryTitle = document.createElement('div');
  summaryTitle.style.fontSize = '12pt';
  summaryTitle.style.fontWeight = 'bold';
  summaryTitle.style.color = '#00843d';
  summaryTitle.style.marginBottom = '12px';
  summaryTitle.textContent = 'Resumen de Estadísticas';
  summary.appendChild(summaryTitle);
  
  const summaryContent = document.createElement('div');
  summaryContent.style.display = 'flex';
  summaryContent.style.flexWrap = 'wrap';
  summaryContent.style.gap = '20px';
  summaryContent.style.fontSize = '10pt';
  summaryContent.style.color = '#333333';
  
  const statItems = [
    { label: 'Total de registros', value: totales.total, color: '#333333' },
    { label: 'Presentes', value: totales.presentes, color: '#22c55e' },
    { label: 'Ausentes', value: totales.ausentes, color: '#ef4444' }
  ];
  
  if (totales.otros > 0) {
    statItems.push({ label: 'Otros', value: totales.otros, color: '#9ca3af' });
  }
  
  statItems.forEach((item) => {
    const statDiv = document.createElement('div');
    statDiv.style.display = 'flex';
    statDiv.style.flexDirection = 'column';
    statDiv.style.gap = '5px';
    statDiv.style.minWidth = '120px';
    
    const statLabel = document.createElement('div');
    statLabel.style.fontSize = '9pt';
    statLabel.style.color = '#666666';
    statLabel.textContent = item.label;
    statDiv.appendChild(statLabel);
    
    const statValue = document.createElement('div');
    statValue.style.fontSize = '14pt';
    statValue.style.fontWeight = 'bold';
    statValue.style.color = item.color;
    statValue.textContent = item.value;
    statDiv.appendChild(statValue);
    
    summaryContent.appendChild(statDiv);
  });
  
  summary.appendChild(summaryContent);
  
  if (totales.presentes + totales.ausentes > 0) {
    const porcentajeDiv = document.createElement('div');
    porcentajeDiv.style.marginTop = '15px';
    porcentajeDiv.style.paddingTop = '15px';
    porcentajeDiv.style.borderTop = '1px solid #cccccc';
    porcentajeDiv.style.fontSize = '10pt';
    
    const porcentajeAsistencia = ((totales.presentes / (totales.presentes + totales.ausentes)) * 100).toFixed(2);
    porcentajeDiv.innerHTML = `
      <strong style="color: #00843d;">Porcentaje de asistencia:</strong> 
      <span style="font-weight: bold; color: #22c55e; font-size: 11pt;">${porcentajeAsistencia}%</span>
    `;
    summary.appendChild(porcentajeDiv);
  }
  
  pdfContainer.appendChild(summary);
  
  return pdfContainer;
};

export const generarPDFAsistenciaProgreso = async (previewData, filters, courses, learners, action = 'save') => {
  if (!previewData || previewData.length === 0) {
    throw new Error('No hay datos para generar el PDF. Por favor, genera un reporte primero.');
  }
  
  const pdfContainer = createPDFContainerAsistenciaProgreso(previewData, filters, courses, learners);
  document.body.appendChild(pdfContainer);
  
  void pdfContainer.offsetHeight;
  void pdfContainer.offsetWidth;
  void pdfContainer.scrollHeight;
  
  await new Promise(resolve => requestAnimationFrame(resolve));
  await new Promise(resolve => requestAnimationFrame(resolve));
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const rowCount = pdfContainer.querySelectorAll('tbody tr').length;
  
  if (rowCount === 0 || (rowCount === 1 && pdfContainer.textContent.includes('No hay datos'))) {
    document.body.removeChild(pdfContainer);
    throw new Error('No hay datos para generar el PDF. Asegúrate de generar un reporte primero.');
  }
  
  try {
    const originalLeft = pdfContainer.style.left;
    pdfContainer.style.left = '0';
    pdfContainer.style.top = '0';
    pdfContainer.style.zIndex = '99999';
    
    await new Promise(resolve => requestAnimationFrame(resolve));
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const containerWidth = pdfContainer.offsetWidth || 794;
    const containerHeight = pdfContainer.scrollHeight || pdfContainer.offsetHeight;
    
    const opt = {
      margin: [15, 15, 15, 15],
      filename: `reporte_asistencia_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#FFFFFF',
        logging: false,
        letterRendering: true,
        width: containerWidth,
        height: containerHeight,
        windowWidth: containerWidth,
        windowHeight: containerHeight,
        allowTaint: false,
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true
      },
      pagebreak: { 
        mode: ['avoid-all', 'css'],
        avoid: ['tr']
      }
    };
    
    if (action === 'print') {
      const worker = html2pdf()
        .set(opt)
        .from(pdfContainer);
      
      const pdfBlob = await new Promise((resolve, reject) => {
        worker.toPdf().get('pdf').then((pdf) => {
          try {
            const arrayBuffer = pdf.output('arraybuffer');
            const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
            resolve(blob);
          } catch (error) {
            reject(error);
          }
        }).catch(reject);
      });
      
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl, '_blank');
      
      if (printWindow) {
        const triggerPrint = () => {
          setTimeout(() => {
            try {
              printWindow.focus();
              printWindow.print();
            } catch (e) {
              console.error('Error al imprimir:', e);
            }
          }, 1000);
        };
        
        printWindow.onload = triggerPrint;
        
        const checkInterval = setInterval(() => {
          try {
            if (printWindow.closed) {
              clearInterval(checkInterval);
              URL.revokeObjectURL(pdfUrl);
              return;
            }
            
            if (printWindow.document && printWindow.document.readyState === 'complete') {
              clearInterval(checkInterval);
              triggerPrint();
            }
          } catch (e) {
            clearInterval(checkInterval);
            triggerPrint();
          }
        }, 200);
        
        setTimeout(() => {
          clearInterval(checkInterval);
          triggerPrint();
        }, 3000);
      } else {
        URL.revokeObjectURL(pdfUrl);
        throw new Error('No se pudo abrir la ventana de impresión. Verifica que los pop-ups no estén bloqueados.');
      }
    } else {
      await html2pdf()
        .set(opt)
        .from(pdfContainer)
        .save();
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    pdfContainer.style.left = originalLeft;
    pdfContainer.style.top = '0';
    pdfContainer.style.zIndex = '-1';
    
  } catch (error) {
    console.error('Error al generar PDF:', error);
    throw error;
  } finally {
    pdfContainer.style.left = '-10000px';
    pdfContainer.style.zIndex = '-1';
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setTimeout(() => {
      try {
        const container = document.getElementById('pdf-container-temp');
        if (container && container.parentNode) {
          document.body.removeChild(container);
        }
      } catch (e) {
        console.error('No se pudo eliminar el contenedor PDF:', e);
      }
    }, 2000);
  }
};

