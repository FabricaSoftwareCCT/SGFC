import React, { useState, useMemo } from 'react';
import './ReporteEstadisticas.css';
import ReporteEstudiantes from './ReporteEstudiantes';

export default function ReporteEstadisticas() {
  const [pantallaActual, setPantallaActual] = useState('cursos'); // 'cursos' o 'estudiantes'
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [botonActivo, setBotonActivo] = useState('cursos');
  const [mostrarFiltro, setMostrarFiltro] = useState(false);
  const [filtros, setFiltros] = useState({
    estado: {
      activo: false,
      inactivo: false
    },
    empleados: {
      '0-10': false,
      '11-20': false,
      '21-30': false,
      '31-40+': false
    },
    curso: '',
    instructor: ''
  });

  const datosEmpleados = [
    { curso: "Backend", ficha: "12345678", instructor: "Cristian Hernao", estado: "Activo", empleados: 30 },
    { curso: "Frontend", ficha: "123456784", instructor: "Pedro Hector", estado: "Activo", empleados: 25 },
    { curso: "Diseño 1", ficha: "123456738", instructor: "Maria Vilmon", estado: "Activo", empleados: 27 },
    { curso: "Java", ficha: "1234562178", instructor: "Kevin Mazo", estado: "Activo", empleados: 23 },
    { curso: "Pintura 2", ficha: "1234568978", instructor: "Carlos River", estado: "Activo", empleados: 21 },
    { curso: "Sepillo 2", ficha: "123452678", instructor: "Xionará Leona", estado: "Inactivo", empleados: 31 },
    { curso: "Gráfica 3", ficha: "123452678", instructor: "Zulimy Montera", estado: "Activo", empleados: 24 },
    { curso: "Económia", ficha: "123425678", instructor: "Goku Son", estado: "Activo", empleados: 20 },
    { curso: "Matemáticas", ficha: "12349876", instructor: "Ana García", estado: "Inactivo", empleados: 8 },
    { curso: "Física", ficha: "12348765", instructor: "Luis Martínez", estado: "Activo", empleados: 15 }
  ];

  // Función para determinar el rango de empleados
  const getRangoEmpleados = (cantidad) => {
    if (cantidad <= 10) return '0-10';
    if (cantidad <= 20) return '11-20';
    if (cantidad <= 30) return '21-30';
    return '31-40+';
  };

  // Función para aplicar todos los filtros
  const empleadosFiltrados = useMemo(() => {
    return datosEmpleados.filter(empleado => {
      // Filtro por estado
      const estadosSeleccionados = [];
      if (filtros.estado.activo) estadosSeleccionados.push('Activo');
      if (filtros.estado.inactivo) estadosSeleccionados.push('Inactivo');
      
      if (estadosSeleccionados.length > 0 && !estadosSeleccionados.includes(empleado.estado)) {
        return false;
      }

      // Filtro por rango de empleados
      const rangosSeleccionados = Object.keys(filtros.empleados).filter(rango => filtros.empleados[rango]);
      if (rangosSeleccionados.length > 0) {
        const rangoEmpleado = getRangoEmpleados(empleado.empleados);
        if (!rangosSeleccionados.includes(rangoEmpleado)) {
          return false;
        }
      }

      // Filtro por nombre del curso
      if (filtros.curso && !empleado.curso.toLowerCase().includes(filtros.curso.toLowerCase())) {
        return false;
      }

      // Filtro por nombre del instructor
      if (filtros.instructor && !empleado.instructor.toLowerCase().includes(filtros.instructor.toLowerCase())) {
        return false;
      }

      // Si pasa todos los filtros, incluir el empleado
      return true;
    });
  }, [filtros]);

  // Función para manejar el clic en una fila
  const handleFilaClick = (empleado) => {
    setCursoSeleccionado(empleado);
    setPantallaActual('estudiantes');
  };

  // Función para volver a la pantalla de cursos
  const handleVolverACursos = () => {
    setPantallaActual('cursos');
    setCursoSeleccionado(null);
  };

  const handleBotonClick = (boton) => {
    setBotonActivo(boton);
  };

  const toggleFiltro = () => {
    setMostrarFiltro(!mostrarFiltro);
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
/*
  const aplicarFiltros = () => {
    console.log('Filtros aplicados:', filtros);
    console.log('Cursos filtrados:', empleadosFiltrados.length);
    setMostrarFiltro(false);
  };
*/
  const limpiarFiltros = () => {
    setFiltros({
      estado: {
        activo: false,
        inactivo: false
      },
      empleados: {
        '0-10': false,
        '11-20': false,
        '21-30': false,
        '31-40+': false
      },
      curso: '',
      instructor: ''
    });
    console.log('Filtros limpiados');
  };

  const generarReporte = () => {
    console.log('Generando reporte de cursos...');
    const datosReporte = empleadosFiltrados.length > 0 ? empleadosFiltrados : datosEmpleados;
    alert(`Reporte generado exitosamente\nTotal de cursos: ${datosReporte.length}`);
  };

  // Contador de filtros activos
  const filtrosActivos = () => {
    let count = 0;
    if (filtros.estado.activo || filtros.estado.inactivo) count++;
    if (filtros.empleados['0-10'] || filtros.empleados['11-20'] || filtros.empleados['21-30'] || filtros.empleados['31-40+']) count++;
    if (filtros.curso) count++;
    if (filtros.instructor) count++;
    return count;
  };

  // Si estamos en la pantalla de estudiantes, mostrar ese componente
  if (pantallaActual === 'estudiantes') {
    return (
      <ReporteEstudiantes 
        cursoSeleccionado={cursoSeleccionado}
        onVolver={handleVolverACursos}
      />
    );
  }

  // Pantalla de cursos
  return (
    <div className="reporte-container-estadisticas">
      <h1 className="reporte-titulo-estadisticas">Reporte y Estadísticas</h1>
      <div className='container-tabla-estadisticas'>
        <button className="button-generar-reporte-estadisticas" onClick={generarReporte}>
          Generar reporte
        </button>
        <button 
          className='button-filtro-reporte-estadisticas' 
          onClick={toggleFiltro}
        >
          Filtro {filtrosActivos() > 0 && `(${filtrosActivos()})`}
        </button>
        
        {mostrarFiltro && (
          <div className="filtro-menu-estadisticas">
            {/* Filtro por Estado */}
            <div className="filtro-grupo-estadisticas">
              <div className="filtro-titulo-estadisticas">Estado</div>
              <div className="filtro-opciones-estadisticas">
                <div 
                  className="filtro-opcion-estadisticas"
                  onClick={() => handleCheckboxChange('estado', 'activo')}
                >
                  <div className={`filtro-checkbox-estadisticas ${filtros.estado.activo ? 'checked' : ''}`}></div>
                  <span>Activo</span>
                </div>
                <div 
                  className="filtro-opcion-estadisticas"
                  onClick={() => handleCheckboxChange('estado', 'inactivo')}
                >
                  <div className={`filtro-checkbox-estadisticas ${filtros.estado.inactivo ? 'checked' : ''}`}></div>
                  <span>Inactivo</span>
                </div>
              </div>
            </div>

            {/* Filtro por Empleados */}
            <div className="filtro-grupo-estadisticas">
              <div className="filtro-titulo-estadisticas">Empleados</div>
              <div className="filtro-opciones-estadisticas">
                <div 
                  className="filtro-opcion-estadisticas"
                  onClick={() => handleCheckboxChange('empleados', '0-10')}
                >
                  <div className={`filtro-checkbox-estadisticas ${filtros.empleados['0-10'] ? 'checked' : ''}`}></div>
                  <span>0-10</span>
                </div>
                <div 
                  className="filtro-opcion-estadisticas"
                  onClick={() => handleCheckboxChange('empleados', '11-20')}
                >
                  <div className={`filtro-checkbox-estadisticas ${filtros.empleados['11-20'] ? 'checked' : ''}`}></div>
                  <span>11-20</span>
                </div>
                <div 
                  className="filtro-opcion-estadisticas"
                  onClick={() => handleCheckboxChange('empleados', '21-30')}
                >
                  <div className={`filtro-checkbox-estadisticas ${filtros.empleados['21-30'] ? 'checked' : ''}`}></div>
                  <span>21-30</span>
                </div>
                <div 
                  className="filtro-opcion-estadisticas"
                  onClick={() => handleCheckboxChange('empleados', '31-40+')}
                >
                  <div className={`filtro-checkbox-estadisticas ${filtros.empleados['31-40+'] ? 'checked' : ''}`}></div>
                  <span>31-40+</span>
                </div>
              </div>
            </div>

            {/* Filtro por Nombre del Curso */}
            <div className="filtro-grupo-estadisticas">
              <div className="filtro-titulo-estadisticas">Nombre del Curso</div>
              <input 
                type="text" 
                className="filtro-input-estadisticas"
                placeholder="Buscar por curso..."
                value={filtros.curso}
                onChange={(e) => handleInputChange('curso', e.target.value)}
              />
            </div>

            {/* Filtro por Nombre del Instructor */}
            <div className="filtro-grupo-estadisticas">
              <div className="filtro-titulo-estadisticas">Nombre del Instructor</div>
              <input 
                type="text" 
                className="filtro-input-estadisticas"
                placeholder="Buscar por instructor..."
                value={filtros.instructor}
                onChange={(e) => handleInputChange('instructor', e.target.value)}
              />
            </div>

            {/* Información de resultados */}
            <div className="filtro-info-estadisticas">
              <div className="filtro-resultados-estadisticas">
                Resultados: {empleadosFiltrados.length} de {datosEmpleados.length} cursos
              </div>
            </div>

            {/* Botones del filtro */}
            <div className="filtro-botones-estadisticas">
              <button className="filtro-boton-estadisticas filtro-limpiar-estadisticas" onClick={limpiarFiltros}>
                Limpiar
              </button>
              {/*<button className="filtro-boton-estadisticas filtro-aplicar-estadisticas" onClick={aplicarFiltros}>
                Aplicar
              </button>*/}
            </div>
          </div>
        )}
      </div>

      <div className="tabla-datos-estadisticas">
        {/* Cabecera de la tabla */}
        <div className="tabla-cabecera-estadisticas">
          <div>Cursos</div>
          <div>Fichas</div>
          <div>Instructores</div>
          <div>Estado</div>
          <div>Empleados registrados</div>
        </div>

        {/* Filas de datos filtrados */}
        {empleadosFiltrados.length > 0 ? (
          empleadosFiltrados.map((empleado, index) => (
            <div 
              key={index} 
              className="tabla-fila-estadisticas"
              onClick={() => handleFilaClick(empleado)}
            >
              <div className="columna-curso-estadisticas">{empleado.curso}</div>
              <div className="columna-ficha-estadisticas">{empleado.ficha}</div>
              <div className="columna-instructor-estadisticas">{empleado.instructor}</div>
              <div className={empleado.estado === "Activo" ? "estado-activo-estadisticas" : "estado-inactivo-estadisticas"}>
                {empleado.estado}
              </div>
              <div className="columna-empleados-estadisticas">{empleado.empleados}</div>
            </div>
          ))
        ) : (
          <div className="no-resultados-estadisticas">
            No se encontraron cursos que coincidan con los filtros aplicados
          </div>
        )}
      </div>
    </div>
  );
}