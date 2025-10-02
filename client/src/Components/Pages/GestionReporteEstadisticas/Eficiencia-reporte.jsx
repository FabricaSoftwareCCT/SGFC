import React, { useState } from 'react';
import './Eficiencia-reporte.css';

export default function EficienciaReporte({ cursoSeleccionado, onVolver }) {
  const [mostrarFiltro, setMostrarFiltro] = useState(false);
  const [filtros, setFiltros] = useState({
    nombre: '',
    apellido: '',
    documento: '',
    estado: {
      activo: false,
      inactivo: false
    },
    faltantes: '',
    realizadas: ''
  });

  const datosEstudiantes = [
    { 
      nombre: "Juan Carlos", 
      apellido: "Pérez García", 
      documento: "12345678", 
      estado: "Activo", 
      faltantes: 3, 
      realizadas: 12,
      eficiencia: "85%"
    },
    { 
      nombre: "María Fernanda", 
      apellido: "López Martínez", 
      documento: "87654321", 
      estado: "Activo", 
      faltantes: 1, 
      realizadas: 14,
      eficiencia: "93%"
    },
    { 
      nombre: "Carlos Alberto", 
      apellido: "Rodríguez Silva", 
      documento: "11223344", 
      estado: "Inactivo", 
      faltantes: 8, 
      realizadas: 7,
      eficiencia: "47%"
    },
    { 
      nombre: "Ana María", 
      apellido: "González Pérez", 
      documento: "44332211", 
      estado: "Activo", 
      faltantes: 0, 
      realizadas: 15,
      eficiencia: "100%"
    }
  ];

  const toggleFiltro = () => {
    setMostrarFiltro(!mostrarFiltro);
  };

  // Función para navegar de vuelta a Actividades
  const handleActividadesClick = () => {
    console.log('Navegando a Actividades');
    // Esta función debería manejarse desde el componente padre
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
      nombre: '',
      apellido: '',
      documento: '',
      estado: {
        activo: false,
        inactivo: false
      },
      faltantes: '',
      realizadas: ''
    });
  };

  const generarReporte = () => {
    console.log('Generando reporte de eficiencia...');
    alert('Reporte de eficiencia generado exitosamente');
  };

  // Función para determinar la clase de eficiencia
  const getEficienciaClass = (eficiencia) => {
    const porcentaje = parseInt(eficiencia);
    if (porcentaje >= 80) return 'eficiencia-alta-eficiencia';
    if (porcentaje >= 60) return 'eficiencia-media-eficiencia';
    return 'eficiencia-baja-eficiencia';
  };

  return (
    <div className="reporte-container-eficiencia">
      {/* Contenedor para título y botones de volver */}
      <div className="titulo-container-eficiencia">
        <button 
          className="button-volver-eficiencia"
          onClick={onVolver}
        >
          Volver a Cursos
        </button>
        <h1 className="reporte-titulo-eficiencia">
          Eficiencia - {cursoSeleccionado?.curso || "Curso Seleccionado"}
        </h1>
      </div>
      
      <div className='container-tabla-eficiencia'>
        <button className="button-generar-reporte-eficiencia" onClick={generarReporte}>
          Generar reporte
        </button>
        
        <button 
          className="button-actividades-eficiencia"
          onClick={handleActividadesClick}
        >
          Actividades
        </button>
        
        <button 
          className='button-filtro-reporte-eficiencia' 
          onClick={toggleFiltro}
        >
          Filtro
        </button>
        
        {mostrarFiltro && (
          <div className="filtro-menu-eficiencia">
            {/* Filtro por Nombre */}
            <div className="filtro-grupo-eficiencia">
              <div className="filtro-titulo-eficiencia">Nombres</div>
              <input 
                type="text" 
                className="filtro-input-eficiencia"
                placeholder="Buscar por nombre..."
                value={filtros.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
              />
            </div>

            {/* Filtro por Apellido */}
            <div className="filtro-grupo-eficiencia">
              <div className="filtro-titulo-eficiencia">Apellidos</div>
              <input 
                type="text" 
                className="filtro-input-eficiencia"
                placeholder="Buscar por apellido..."
                value={filtros.apellido}
                onChange={(e) => handleInputChange('apellido', e.target.value)}
              />
            </div>

            {/* Filtro por Documento */}
            <div className="filtro-grupo-eficiencia">
              <div className="filtro-titulo-eficiencia">Documentos</div>
              <input 
                type="text" 
                className="filtro-input-eficiencia"
                placeholder="Buscar por documento..."
                value={filtros.documento}
                onChange={(e) => handleInputChange('documento', e.target.value)}
              />
            </div>

            {/* Filtro por Estado */}
            <div className="filtro-grupo-eficiencia">
              <div className="filtro-titulo-eficiencia">Estados</div>
              <div className="filtro-opciones-eficiencia">
                <div 
                  className="filtro-opcion-eficiencia"
                  onClick={() => handleCheckboxChange('estado', 'activo')}
                >
                  <div className={`filtro-checkbox-eficiencia ${filtros.estado.activo ? 'checked' : ''}`}></div>
                  <span>Activo</span>
                </div>
                <div 
                  className="filtro-opcion-eficiencia"
                  onClick={() => handleCheckboxChange('estado', 'inactivo')}
                >
                  <div className={`filtro-checkbox-eficiencia ${filtros.estado.inactivo ? 'checked' : ''}`}></div>
                  <span>Inactivo</span>
                </div>
              </div>
            </div>

            {/* Filtro por Actividades Faltantes */}
            <div className="filtro-grupo-eficiencia">
              <div className="filtro-titulo-eficiencia">Actividades Faltantes</div>
              <input 
                type="number" 
                className="filtro-input-eficiencia"
                placeholder="Filtrar por actividades faltantes..."
                value={filtros.faltantes}
                onChange={(e) => handleInputChange('faltantes', e.target.value)}
              />
            </div>

            {/* Filtro por Actividades Realizadas */}
            <div className="filtro-grupo-eficiencia">
              <div className="filtro-titulo-eficiencia">Actividades Realizadas</div>
              <input 
                type="number" 
                className="filtro-input-eficiencia"
                placeholder="Filtrar por actividades realizadas..."
                value={filtros.realizadas}
                onChange={(e) => handleInputChange('realizadas', e.target.value)}
              />
            </div>

            {/* Botones del filtro */}
            <div className="filtro-botones-eficiencia">
              <button className="filtro-boton-eficiencia filtro-limpiar-eficiencia" onClick={limpiarFiltros}>
                Limpiar
              </button>
              <button className="filtro-boton-eficiencia filtro-aplicar-eficiencia" onClick={aplicarFiltros}>
                Aplicar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="tabla-datos-eficiencia">
        {/* Cabecera de la tabla para Eficiencia */}
        <div className="tabla-cabecera-eficiencia">
          <div>Nombres</div>
          <div>Apellidos</div>
          <div>Documentos</div>
          <div>Actividades Faltantes</div>
          <div>Actividades Realizadas</div>
          <div>Eficiencia</div>
        </div>

        {/* Filas de datos */}
        {datosEstudiantes.map((estudiante, index) => (
          <div key={index} className="tabla-fila-eficiencia">
            <div className="columna-nombre-eficiencia">{estudiante.nombre}</div>
            <div className="columna-apellido-eficiencia">{estudiante.apellido}</div>
            <div className="columna-documento-eficiencia">{estudiante.documento}</div>
            <div className="columna-faltantes-eficiencia">{estudiante.faltantes}</div>
            <div className="columna-realizadas-eficiencia">{estudiante.realizadas}</div>
            <div className={getEficienciaClass(estudiante.eficiencia)}>
              {estudiante.eficiencia}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}