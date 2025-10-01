import React, { useState } from 'react';
import './ReporteEstadisticas.css';

export default function ReporteEstadisticas() {
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
    { curso: "Económia", ficha: "123425678", instructor: "Goku Son", estado: "Activo", empleados: 20 }
  ];

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

  const aplicarFiltros = () => {
    console.log('Filtros aplicados:', filtros);
    setMostrarFiltro(false);
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

  return (
    <div className="reporte-container">
      <h1 className="reporte-titulo">Reporte y Estadísticas</h1>
      <div className='Container-tabla'>
        <button 
          className={`button-Cursos ${botonActivo === 'cursos' ? 'active' : ''}`}
          onClick={() => handleBotonClick('cursos')}
        >
          Cursos
        </button>
        <button className="button-generar-reporte">Generar reporte</button>
        <button 
          className={`button-eficiencia ${botonActivo === 'eficiencia' ? 'active' : ''}`}
          onClick={() => handleBotonClick('eficiencia')}
        >
          Eficiencia
        </button>
        <button 
          className='button-filtro-reporte' 
          onClick={toggleFiltro}
        >
          Filtro
        </button>
        
        {mostrarFiltro && (
          <div className="filtro-menu">
            {/* Filtro por Estado */}
            <div className="filtro-grupo">
              <div className="filtro-titulo">Estado</div>
              <div className="filtro-opciones">
                <div 
                  className="filtro-opcion"
                  onClick={() => handleCheckboxChange('estado', 'activo')}
                >
                  <div className={`filtro-checkbox ${filtros.estado.activo ? 'checked' : ''}`}></div>
                  <span>Activo</span>
                </div>
                <div 
                  className="filtro-opcion"
                  onClick={() => handleCheckboxChange('estado', 'inactivo')}
                >
                  <div className={`filtro-checkbox ${filtros.estado.inactivo ? 'checked' : ''}`}></div>
                  <span>Inactivo</span>
                </div>
              </div>
            </div>

            {/* Filtro por Empleados */}
            <div className="filtro-grupo">
              <div className="filtro-titulo">Empleados</div>
              <div className="filtro-opciones">
                <div 
                  className="filtro-opcion"
                  onClick={() => handleCheckboxChange('empleados', '0-10')}
                >
                  <div className={`filtro-checkbox ${filtros.empleados['0-10'] ? 'checked' : ''}`}></div>
                  <span>0-10</span>
                </div>
                <div 
                  className="filtro-opcion"
                  onClick={() => handleCheckboxChange('empleados', '11-20')}
                >
                  <div className={`filtro-checkbox ${filtros.empleados['11-20'] ? 'checked' : ''}`}></div>
                  <span>11-20</span>
                </div>
                <div 
                  className="filtro-opcion"
                  onClick={() => handleCheckboxChange('empleados', '21-30')}
                >
                  <div className={`filtro-checkbox ${filtros.empleados['21-30'] ? 'checked' : ''}`}></div>
                  <span>21-30</span>
                </div>
                <div 
                  className="filtro-opcion"
                  onClick={() => handleCheckboxChange('empleados', '31-40+')}
                >
                  <div className={`filtro-checkbox ${filtros.empleados['31-40+'] ? 'checked' : ''}`}></div>
                  <span>31-40+</span>
                </div>
              </div>
            </div>

            {/* Filtro por Nombre del Curso */}
            <div className="filtro-grupo">
              <div className="filtro-titulo">Nombre del Curso</div>
              <input 
                type="text" 
                className="filtro-input"
                placeholder="Buscar por curso..."
                value={filtros.curso}
                onChange={(e) => handleInputChange('curso', e.target.value)}
              />
            </div>

            {/* Filtro por Nombre del Instructor */}
            <div className="filtro-grupo">
              <div className="filtro-titulo">Nombre del Instructor</div>
              <input 
                type="text" 
                className="filtro-input"
                placeholder="Buscar por instructor..."
                value={filtros.instructor}
                onChange={(e) => handleInputChange('instructor', e.target.value)}
              />
            </div>

            {/* Botones del filtro */}
            <div className="filtro-botones">
              <button className="filtro-boton filtro-limpiar" onClick={limpiarFiltros}>
                Limpiar
              </button>
              <button className="filtro-boton filtro-aplicar" onClick={aplicarFiltros}>
                Aplicar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="tabla-datos">
        {/* Cabecera de la tabla */}
        <div className="tabla-cabecera">
          <div>Cursos</div>
          <div>Fichas</div>
          <div>Instructores</div>
          <div>Estado</div>
          <div>Empleados registrados</div>
        </div>

        {/* Filas de datos */}
        {datosEmpleados.map((empleado, index) => (
          <div key={index} className="tabla-fila">
            <div className="columna-curso">{empleado.curso}</div>
            <div className="columna-ficha">{empleado.ficha}</div>
            <div className="columna-instructor">{empleado.instructor}</div>
            <div className={empleado.estado === "Activo" ? "estado-activo" : "estado-inactivo"}>
              {empleado.estado}
            </div>
            <div className="columna-empleados">{empleado.empleados}</div>
          </div>
        ))}
      </div>
    </div>
  );
}