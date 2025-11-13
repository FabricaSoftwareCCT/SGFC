import html2pdf from 'html2pdf.js';
import * as xlsx from 'xlsx';

export const createPDFContainerEstudiantes = (datosReporte, cursoNombre) => {
  const pdfContainer = document.createElement('div');
  pdfContainer.id = 'pdf-container-estudiantes-temp';
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
  
  // Título
  const title = document.createElement('h1');
  title.textContent = `Reporte de Estudiantes - ${cursoNombre || 'Curso'}`;
  title.style.margin = '0 0 20px 0';
  title.style.fontSize = '20pt';
  title.style.fontWeight = 'bold';
  title.style.color = '#000000';
  title.style.borderBottom = '3px solid #00843d';
  title.style.paddingBottom = '10px';
  pdfContainer.appendChild(title);
  
  // Información del reporte
  const infoContainer = document.createElement('div');
  infoContainer.style.marginBottom = '25px';
  infoContainer.style.padding = '20px';
  infoContainer.style.backgroundColor = '#f8f9fa';
  infoContainer.style.border = '2px solid #00843d';
  infoContainer.style.borderRadius = '8px';
  infoContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
  
  // Fecha de consulta
  const fechaInfo = document.createElement('div');
  fechaInfo.style.marginBottom = '12px';
  fechaInfo.style.fontSize = '11pt';
  fechaInfo.style.color = '#333333';
  fechaInfo.style.fontWeight = 'normal';
  fechaInfo.style.display = 'flex';
  fechaInfo.style.alignItems = 'center';
  fechaInfo.style.gap = '8px';
  
  const fechaLabel = document.createElement('span');
  fechaLabel.textContent = 'Fecha de consulta:';
  fechaLabel.style.color = '#00843d';
  fechaLabel.style.fontWeight = 'bold';
  fechaLabel.style.fontSize = '11pt';
  
  const fechaValor = document.createElement('span');
  const fecha = new Date();
  const fechaFormateada = fecha.toLocaleDateString('es-CO', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  });
  const horaFormateada = fecha.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  fechaValor.textContent = `${fechaFormateada} a las ${horaFormateada}`;
  fechaValor.style.color = '#000000';
  fechaValor.style.fontSize = '11pt';
  
  fechaInfo.appendChild(fechaLabel);
  fechaInfo.appendChild(fechaValor);
  infoContainer.appendChild(fechaInfo);
  
  // Total de estudiantes
  const totalInfo = document.createElement('div');
  totalInfo.style.display = 'flex';
  totalInfo.style.alignItems = 'center';
  totalInfo.style.gap = '12px';
  totalInfo.style.paddingTop = '8px';
  totalInfo.style.borderTop = '1px solid #dddddd';
  
  const totalLabel = document.createElement('span');
  totalLabel.textContent = 'Total de estudiantes:';
  totalLabel.style.color = '#00843d';
  totalLabel.style.fontWeight = 'bold';
  totalLabel.style.fontSize = '12pt';
  
  const totalValor = document.createElement('span');
  totalValor.textContent = datosReporte.length.toString();
  totalValor.style.fontSize = '18pt';
  totalValor.style.fontWeight = 'bold';
  totalValor.style.color = '#00843d';
  totalValor.style.backgroundColor = '#e8f5e9';
  totalValor.style.padding = '6px 14px';
  totalValor.style.borderRadius = '6px';
  totalValor.style.border = '2px solid #00843d';
  totalValor.style.minWidth = '50px';
  totalValor.style.textAlign = 'center';
  
  totalInfo.appendChild(totalLabel);
  totalInfo.appendChild(totalValor);
  infoContainer.appendChild(totalInfo);
  
  pdfContainer.appendChild(infoContainer);
  
  // Tabla
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.marginTop = '10px';
  table.style.fontSize = '9pt';
  table.style.tableLayout = 'auto';
  
  // Header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.style.backgroundColor = '#00843d';
  headerRow.style.color = '#FFFFFF';
  
  const headers = ['Nombres', 'Apellidos', 'Documento', 'Estado', 'Faltas', 'Asistencias'];
  headers.forEach(headerText => {
    const th = document.createElement('th');
    th.textContent = headerText;
    th.style.padding = '10px 8px';
    th.style.border = '1px solid #006633';
    th.style.textAlign = headerText === 'Faltas' || headerText === 'Asistencias' || headerText === 'Estado' ? 'center' : 'left';
    th.style.fontWeight = 'bold';
    th.style.fontSize = '10pt';
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Body
  const tbody = document.createElement('tbody');
  datosReporte.forEach((estudiante) => {
    const row = document.createElement('tr');
    
    // Convertir valores a string explícitamente
    const nombre = String(estudiante.nombre || estudiante.Nombre || '-').trim();
    const apellido = String(estudiante.apellido || estudiante.Apellido || '-').trim();
    const documento = String(estudiante.documento || estudiante.Documento || '-').trim();
    const estado = String(estudiante.estado || estudiante.Estado || '-').trim();
    const faltas = String(estudiante.faltas !== undefined ? estudiante.faltas : estudiante.Faltas !== undefined ? estudiante.Faltas : 0);
    const asistencias = String(estudiante.asistencias !== undefined ? estudiante.asistencias : estudiante.Asistencias !== undefined ? estudiante.Asistencias : 0);
    
    const cells = [nombre, apellido, documento, estado, faltas, asistencias];
    
    cells.forEach((cellValue, index) => {
      const td = document.createElement('td');
      td.textContent = String(cellValue);
      td.style.padding = '8px';
      td.style.border = '1px solid #cccccc';
      td.style.color = '#000000';
      td.style.backgroundColor = '#FFFFFF';
      td.style.textAlign = index >= 3 ? 'center' : 'left';
      td.style.fontSize = '9pt';
      td.style.fontFamily = 'Arial, Helvetica, sans-serif';
      row.appendChild(td);
    });
    
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  pdfContainer.appendChild(table);
  
  return pdfContainer;
};

export const generarPDFEstudiantes = async (datosReporte, cursoNombre) => {
  if (!datosReporte || datosReporte.length === 0) {
    throw new Error('No hay datos para generar el PDF');
  }

  const pdfContainer = createPDFContainerEstudiantes(datosReporte, cursoNombre);
  document.body.appendChild(pdfContainer);
  
  // Forzar renderizado
  void pdfContainer.offsetHeight;
  void pdfContainer.offsetWidth;
  void pdfContainer.scrollHeight;
  
  await new Promise(resolve => requestAnimationFrame(resolve));
  await new Promise(resolve => requestAnimationFrame(resolve));
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Verificar que hay datos en la tabla
  const rowCount = pdfContainer.querySelectorAll('tbody tr').length;
  if (rowCount === 0) {
    document.body.removeChild(pdfContainer);
    throw new Error('No hay datos para generar el PDF');
  }
  
  // Mover al viewport
  const originalLeft = pdfContainer.style.left;
  pdfContainer.style.left = '0';
  pdfContainer.style.top = '0';
  pdfContainer.style.zIndex = '99999';
  
  await new Promise(resolve => requestAnimationFrame(resolve));
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const containerWidth = pdfContainer.offsetWidth || 794;
  const containerHeight = pdfContainer.scrollHeight || pdfContainer.offsetHeight;
  
  // Asegurar que todos los estilos están aplicados
  const allCells = pdfContainer.querySelectorAll('td, th');
  allCells.forEach(cell => {
    if (!cell.style.color || cell.style.color === 'rgba(0, 0, 0, 0)' || cell.style.color === 'transparent') {
      cell.style.color = '#000000';
    }
    cell.style.webkitPrintColorAdjust = 'exact';
    cell.style.printColorAdjust = 'exact';
  });
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const opt = {
    margin: [15, 15, 15, 15],
    filename: `reporte_estudiantes_${cursoNombre || 'curso'}.pdf`,
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
      scrollY: 0,
      onclone: (clonedDoc) => {
        // Asegurar que el clon también tenga los colores correctos
        const clonedCells = clonedDoc.querySelectorAll('td, th');
        clonedCells.forEach(cell => {
          if (cell.tagName === 'TD') {
            cell.style.color = '#000000';
            cell.style.backgroundColor = '#FFFFFF';
          }
        });
      }
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
  
  await html2pdf().set(opt).from(pdfContainer).save();
  
  await new Promise(resolve => setTimeout(resolve, 500));
  pdfContainer.style.left = originalLeft;
  pdfContainer.style.zIndex = '-1';
  
  // Limpiar después de un tiempo
  setTimeout(() => {
    try {
      const container = document.getElementById('pdf-container-estudiantes-temp');
      if (container && container.parentNode) {
        document.body.removeChild(container);
      }
    } catch (e) {
      // Ignorar errores de limpieza
    }
  }, 2000);
};

export const generarExcelEstudiantes = (datosReporte, cursoNombre) => {
  try {
    if (!datosReporte || datosReporte.length === 0) {
      throw new Error('No hay datos para generar el Excel');
    }

    const estudiantesData = datosReporte.map(e => ({
      "Nombre": e.nombre || e.Nombre || '-',
      "Apellido": e.apellido || e.Apellido || '-',
      "Documento": e.documento || e.Documento || '-',
      "Estado": e.estado || e.Estado || '-',
      "Faltas": e.faltas !== undefined ? e.faltas : e.Faltas !== undefined ? e.Faltas : 0,
      "Asistencias": e.asistencias !== undefined ? e.asistencias : e.Asistencias !== undefined ? e.Asistencias : 0
    }));

    const workBook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workBook, xlsx.utils.json_to_sheet(estudiantesData), "Estudiantes");
    xlsx.writeFile(workBook, `reporte_estudiantes_${cursoNombre || 'curso'}.xlsx`, { compression: true });
  } catch (error) {
    console.error('Error al generar Excel:', error);
    throw new Error('Ocurrió un error al generar el archivo Excel');
  }
};

