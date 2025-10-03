import React, { useState, useMemo, useEffect,useRef } from 'react';
import './ReporteEstadisticas.css';
import ReporteEstudiantes from './ReporteEstudiantes';

export default function ReporteEstadisticas() {
  const [pantallaActual, setPantallaActual] = useState('cursos');
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [botonActivo, setBotonActivo] = useState('cursos');
  const [mostrarFiltro, setMostrarFiltro] = useState(false);
  const [datosCurso, setdatosCurso] = useState([]);
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(10);

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

  const filtroRef = useRef(null);

 useEffect(() => {
  function handleClickOutside(event) {
    if (mostrarFiltro && filtroRef.current && !filtroRef.current.contains(event.target)) {
      const botonFiltro = document.querySelector('.button-filtro-reporte-estadisticas');
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
/*
  useEffect(() => {
    const cursos = async () => {
      try{
        const response = await fetch(`http://localhost:3001/api/reports/ObtenerCursos/admin/${currentPage}`, {
          method: "GET",
          credentials: "include"
        });
        const data = await response.json();

        const cursos = data?.curso?.cursos.map(curso => ({
          id: curso.id,
          curso: curso.nombre_curso,
          ficha: curso.ficha,
          estado: curso.estado,
          instructor: curso.nombre_instructor,
          empleados: 0
          })
        );

        setdatosCurso(cursos);
      } catch(err) {
        alert("Error al cargar datos");
      }
    };
    cursos();
  }, []);
  */

  const cursos = [
  { id: 1, curso: "Programación Web con React", ficha: "FW-001", instructor: "María González", estado: "Activo", empleados: 15 },
  { id: 2, curso: "Base de Datos Avanzadas", ficha: "DB-002", instructor: "Carlos Rodríguez", estado: "Activo", empleados: 8 },
  { id: 3, curso: "Machine Learning Fundamentals", ficha: "ML-003", instructor: "Ana Martínez", estado: "Inactivo", empleados: 25 },
  { id: 4, curso: "Desarrollo Mobile con Flutter", ficha: "MB-004", instructor: "Luis Sánchez", estado: "Activo", empleados: 12 },
  { id: 5, curso: "Ciberseguridad Básica", ficha: "CS-005", instructor: "Elena Ramírez", estado: "Activo", empleados: 32 },
  { id: 6, curso: "Cloud Computing con AWS", ficha: "CC-006", instructor: "Pedro López", estado: "Inactivo", empleados: 18 },
  { id: 7, curso: "JavaScript Avanzado", ficha: "JS-007", instructor: "Laura Díaz", estado: "Activo", empleados: 22 },
  { id: 8, curso: "Python para Ciencia de Datos", ficha: "PY-008", instructor: "Miguel Torres", estado: "Activo", empleados: 28 },
  { id: 9, curso: "Diseño UX/UI", ficha: "DX-009", instructor: "Sofía Castro", estado: "Inactivo", empleados: 7 },
  { id: 10, curso: "DevOps y CI/CD", ficha: "DV-010", instructor: "Javier Morales", estado: "Activo", empleados: 35 },
  { id: 11, curso: "Blockchain Development", ficha: "BC-011", instructor: "Carmen Reyes", estado: "Activo", empleados: 14 },
  { id: 12, curso: "Inteligencia Artificial", ficha: "IA-012", instructor: "Roberto Silva", estado: "Inactivo", empleados: 19 },
  { id: 13, curso: "Angular Framework", ficha: "AG-013", instructor: "Patricia Navarro", estado: "Activo", empleados: 11 },
  { id: 14, curso: "SQL y Optimización", ficha: "SQ-014", instructor: "Daniel Ortega", estado: "Activo", empleados: 26 },
  { id: 15, curso: "React Native", ficha: "RN-015", instructor: "Gabriela Mendoza", estado: "Inactivo", empleados: 9 },
  { id: 16, curso: "Testing Automatizado", ficha: "TA-016", instructor: "Fernando Rojas", estado: "Activo", empleados: 17 },
  { id: 17, curso: "Microservicios con Docker", ficha: "MS-017", instructor: "Isabel Vargas", estado: "Activo", empleados: 38 },
  { id: 18, curso: "Vue.js Fundamentals", ficha: "VJ-018", instructor: "Ricardo Peña", estado: "Inactivo", empleados: 6 },
  { id: 19, curso: "Big Data Analytics", ficha: "BD-019", instructor: "Adriana Cruz", estado: "Activo", empleados: 31 },
  { id: 20, curso: "TypeScript Profesional", ficha: "TS-020", instructor: "Oscar Herrera", estado: "Activo", empleados: 23 }
];

  // Resetear página cuando cambien filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filtros]);

  // Función para determinar el rango de empleados
  const getRangoEmpleados = (cantidad) => {
    if (cantidad <= 10) return '0-10';
    if (cantidad <= 20) return '11-20';
    if (cantidad <= 30) return '21-30';
    return '31-40+';
  };

  // Función para aplicar todos los filtros
  const empleadosFiltrados = useMemo(() => {
    return cursos.filter(Cursos => {
      // Filtro por estado
      const estadosSeleccionados = [];
      if (filtros.estado.activo) estadosSeleccionados.push('activo');
      if (filtros.estado.inactivo) estadosSeleccionados.push('inactivo');
      
      if (estadosSeleccionados.length > 0 && !estadosSeleccionados.includes(Cursos.estado)) {
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
  }, [filtros, datosCurso]);

  // Cálculo para paginación
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = empleadosFiltrados.slice(indexOfFirstPost, indexOfLastPost);

  // Función para manejar el clic en una fila
  const handleFilaClick = (Cursos) => {
    setCursoSeleccionado(Cursos);
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
  };

  const generarReporte = () => {
    console.log('Generando reporte de cursos...');
    const datosReporte = empleadosFiltrados.length > 0 ? empleadosFiltrados : datosCurso;
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
          <div className="filtro-menu-estadisticas" ref={filtroRef}>
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
                Resultados: {empleadosFiltrados.length} de {datosCurso.length} cursos
              </div>
            </div>

            {/* Botones del filtro */}
            <div className="filtro-botones-estadisticas">
              <button className="filtro-boton-estadisticas filtro-limpiar-estadisticas" onClick={limpiarFiltros}>
                Limpiar
              </button>
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

        {/* Filas de datos filtrados y paginados */}
        {currentPosts.length > 0 ? (
          currentPosts.map((Cursos) => (
            <div 
              key={Cursos.id} 
              className="tabla-fila-estadisticas"
              onClick={() => handleFilaClick(Cursos)}
            >
              <div className="columna-curso-estadisticas">{Cursos.curso}</div>
              <div className="columna-ficha-estadisticas">{Cursos.ficha}</div>
              <div className="columna-instructor-estadisticas">{Cursos.instructor}</div>
              <div className={Cursos.estado === "Activo" ? "estado-activo-estadisticas" : "estado-inactivo-estadisticas"}>
                {Cursos.estado}
              </div>
              <div className="columna-empleados-estadisticas">{Cursos.empleados}</div>
            </div>
          ))
        ) : (
          <div className="no-resultados-estadisticas">
            No se encontraron cursos que coincidan con los filtros aplicados
          </div>
        )}
      </div>

      {/* PAGINACIÓN */}
      {empleadosFiltrados.length > postsPerPage && (
        <>
          <Pagination
            postsPerPage={postsPerPage}
            totalPosts={empleadosFiltrados.length}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
          <div className="info-paginacion">
            Mostrando {Math.min(indexOfFirstPost + 1, empleadosFiltrados.length)}-
            {Math.min(indexOfLastPost, empleadosFiltrados.length)} de {empleadosFiltrados.length} cursos
          </div>
        </>
      )}
    </div>
  );
}

// Componente Pagination
const Pagination = ({
  postsPerPage,
  totalPosts,
  setCurrentPage,
  currentPage,
}) => {
  const pageNumbers = [];

  for (let i = 1; i <= Math.ceil(totalPosts / postsPerPage); i++) {
    pageNumbers.push(i);
  }

  const paginate = (pageNumber, e) => {
    e.preventDefault();
    setCurrentPage(pageNumber);
  };

  return (
    <nav>
      <ul className="pagination">
        {pageNumbers.map((number) => (
          <li
            key={number}
            className={`page-item ${currentPage === number ? "active" : ""}`}
          >
            <button
              onClick={(e) => paginate(number, e)}
              className="page-link"
            >
              {number}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};