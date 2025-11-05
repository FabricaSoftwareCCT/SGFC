import React, { useState, useMemo, useEffect, useRef } from 'react'; // ← AGREGAR useRef y useEffect
import EficienciaReporte from './Eficiencia-reporte';
import './ReporteEstudiantes.css';
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css'

export default function ReporteEstudiantes({ cursoSeleccionado, onVolver }) {
  const [mostrarFiltro, setMostrarFiltro] = useState(false);
  const [mostrarEficiencia, setMostrarEficiencia] = useState(false);
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

  const datosEstudiantes = [
    { 
      nombre: "Juan Carlos", 
      apellido: "Pérez García", 
      documento: "12345678", 
      estado: "Activo", 
      faltas: 2, 
      asistencias: 28 
    },
    { 
      nombre: "María Fernanda", 
      apellido: "López Martínez", 
      documento: "87654321", 
      estado: "Activo", 
      faltas: 1, 
      asistencias: 29 
    },
    { 
      nombre: "Carlos Alberto", 
      apellido: "Rodríguez Silva", 
      documento: "11223344", 
      estado: "Inactivo", 
      faltas: 5, 
      asistencias: 15 
    },
    { 
      nombre: "Ana María", 
      apellido: "González Pérez", 
      documento: "44332211", 
      estado: "Activo", 
      faltas: 0, 
      asistencias: 30 
    },
    { 
      nombre: "Pedro Antonio", 
      apellido: "Hernández Díaz", 
      documento: "55667788", 
      estado: "Inactivo", 
      faltas: 3, 
      asistencias: 22 
    }
  ];

  // AGREGAR ESTA LÍNEA - usar filtroRef en lugar de filtrosRef
  const filtroRef = useRef(null);

  // DESCOMENTAR Y CORREGIR ESTE useEffect
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

    // Limpiar event listener cuando el componente se desmonta
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

      // Si pasa todos los filtros, incluir el estudiante
      return true;
    });
  }, [filtros]);

  const toggleFiltro = () => {
    setMostrarFiltro(!mostrarFiltro);
  };

  // Función para navegar a Eficiencia-Reporte
  const handleEficienciaClick = () => {
    setMostrarEficiencia(true);
  };

  // Función para volver desde EficienciaReporte
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

  const generarReporte = () => {
    console.log('Generando reporte de estudiantes...');
    const datosReporte = estudiantesFiltrados.length > 0 ? estudiantesFiltrados : datosEstudiantes;
    Swal.fire({
      icon: 'success',
      title: 'Reporte generado',
      html: `Reporte generado exitosamente<br><strong>Total de estudiantes: ${datosReporte.length}</strong>`,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#049019',
            theme:"bulma",
      customClass: { confirmButton: 'centered-swal-button' }
    });
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
      {/* Contenedor para título y botón de volver - TÍTULO CENTRADO, BOTÓN A LA IZQUIERDA */}
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
        <button className="button-generar-reporte-estudiantes" onClick={generarReporte}>
          Generar reporte
        </button>
        
        {/* BOTÓN DE EFICIENCIA AGREGADO AQUÍ */}
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
          // CORREGIR: usar filtroRef en lugar de filtrosRef
          <div className="filtro-menu-estudiantes" ref={filtroRef}>
            {/* Filtro por Nombre */}
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

            {/* Filtro por Apellido */}
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

            {/* Filtro por Documento */}
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

            {/* Filtro por Estado */}
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

            {/* Filtro por Faltas */}
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

            {/* Filtro por Asistencias */}
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

            {/* Información de resultados */}
            <div className="filtro-info-estudiantes">
              <div className="filtro-resultados-estudiantes">
                Resultados: {estudiantesFiltrados.length} de {datosEstudiantes.length} estudiantes
              </div>
            </div>

            {/* Botones del filtro */}
            <div className="filtro-botones-estudiantes">
              <button className="filtro-boton-estudiantes filtro-limpiar-estudiantes" onClick={limpiarFiltros}>
                Limpiar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="tabla-datos-estudiantes">
        {/* Cabecera de la tabla */}
        <div className="tabla-cabecera-estudiantes">
          <div>Nombres</div>
          <div>Apellidos</div>
          <div>Documentos</div>
          <div>Estado</div>
          <div>Faltas</div>
          <div>N° Asistencias</div>
        </div>

        {/* Filas de datos filtrados */}
        {estudiantesFiltrados.length > 0 ? (
          estudiantesFiltrados.map((estudiante, index) => (
            <div key={index} className="tabla-fila-estudiantes">
              <div className="columna-nombre-estudiantes">{estudiante.nombre}</div>
              <div className="columna-apellido-estudiantes">{estudiante.apellido}</div>
              <div className="columna-documento-estudiantes">{estudiante.documento}</div>
              <div className={estudiante.estado === "Activo" ? "estado-activo-estudiantes" : "estado-inactivo-estudiantes"}>
                {estudiante.estado}
              </div>
              <div className="columna-faltas-estudiantes">{estudiante.faltas}</div>
              <div className="columna-asistencias-estudiantes">{estudiante.asistencias}</div>
            </div>
          ))
        ) : (
          <div className="no-resultados-estudiantes">
            No se encontraron estudiantes que coincidan con los filtros aplicados
          </div>
        )}
      </div>
    </div>
  );
}