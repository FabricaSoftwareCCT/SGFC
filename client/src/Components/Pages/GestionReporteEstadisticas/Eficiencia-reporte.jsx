import React, { useState, useMemo, useEffect, useRef } from 'react'; // ← AGREGAR useRef y useEffect
import './Eficiencia-reporte.css';
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css'

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
		tipoFiltro: '', // 'faltantes' o 'realizadas'
		valor: ''
	});

	// AGREGAR LA REFERENCIA
	const filtroRef = useRef(null);

	// AGREGAR EL USEEFFECT PARA CERRAR AL HACER CLIC FUERA
	useEffect(() => {
		function handleClickOutside(event) {
			if (mostrarFiltro && filtroRef.current && !filtroRef.current.contains(event.target)) {
				const botonFiltro = document.querySelector('.button-filtro-reporte-eficiencia');
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
		},
		{ 
			nombre: "Pedro Antonio", 
			apellido: "Hernández Díaz", 
			documento: "55667788", 
			estado: "Inactivo", 
			faltantes: 5, 
			realizadas: 10,
			eficiencia: "67%"
		}
	];

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

			// Filtro por actividades (faltantes o realizadas)
			if (filtros.tipoFiltro && filtros.valor) {
				if (filtros.tipoFiltro === 'faltantes') {
					if (estudiante.faltantes !== parseInt(filtros.valor)) {
						return false;
					}
				} else if (filtros.tipoFiltro === 'realizadas') {
					if (estudiante.realizadas !== parseInt(filtros.valor)) {
						return false;
					}
				}
			}

			// Si pasa todos los filtros, incluir el estudiante
			return true;
		});
	}, [filtros]);

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

	const seleccionarTipoFiltro = (tipo) => {
		setFiltros(prev => ({
			...prev,
			tipoFiltro: prev.tipoFiltro === tipo ? '' : tipo, // Toggle: si ya está seleccionado, deseleccionar
			valor: '' // Limpiar el valor cuando se cambia el tipo
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
			tipoFiltro: '',
			valor: ''
		});
		console.log('Filtros limpiados');
	};

	const generarReporte = () => {
		console.log('Generando reporte de eficiencia...');
		const datosReporte = estudiantesFiltrados.length > 0 ? estudiantesFiltrados : datosEstudiantes;
		Swal.fire({
			icon: 'success',
			title: 'Reporte generado',
			html: `Reporte de eficiencia generado exitosamente<br><strong>Total de estudiantes: ${datosReporte.length}</strong>`,
			confirmButtonText: 'Aceptar',
			confirmButtonColor: '#049019',
			theme:"bulma",
			customClass: { confirmButton: 'centered-swal-button' }
		});
	};

	// Función para determinar la clase de eficiencia
	const getEficienciaClass = (eficiencia) => {
		const porcentaje = parseInt(eficiencia);
		if (porcentaje >= 80) return 'eficiencia-alta-eficiencia';
		if (porcentaje >= 60) return 'eficiencia-media-eficiencia';
		return 'eficiencia-baja-eficiencia';
	};

	// Contador de filtros activos
	const filtrosActivos = () => {
		let count = 0;
		if (filtros.nombre) count++;
		if (filtros.apellido) count++;
		if (filtros.documento) count++;
		if (filtros.estado.activo || filtros.estado.inactivo) count++;
		if (filtros.tipoFiltro && filtros.valor) count++;
		return count;
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
					className='button-filtro-reporte-eficiencia' 
					onClick={toggleFiltro}
				>
					Filtro {filtrosActivos() > 0 && `(${filtrosActivos()})`}
				</button>
				
				{mostrarFiltro && (
					// AGREGAR LA REFERENCIA AL MENÚ DE FILTRO
					<div className="filtro-menu-eficiencia" ref={filtroRef}>
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

						{/* Filtro por Actividades - Botones pequeños */}
						<div className="filtro-grupo-eficiencia">
							<div className="filtro-titulo-eficiencia">Filtrar por:</div>
							<div className="filtro-botones-pequenos-eficiencia">
								<button 
									className={`filtro-boton-pequeno-eficiencia ${filtros.tipoFiltro === 'faltantes' ? 'activo' : ''}`}
									onClick={() => seleccionarTipoFiltro('faltantes')}
								>
									Actividades Faltantes
								</button>
								<button 
									className={`filtro-boton-pequeno-eficiencia ${filtros.tipoFiltro === 'realizadas' ? 'activo' : ''}`}
									onClick={() => seleccionarTipoFiltro('realizadas')}
								>
									Actividades Realizadas
								</button>
							</div>
						</div>

						{/* Input para el valor del filtro seleccionado */}
						{filtros.tipoFiltro && (
							<div className="filtro-grupo-eficiencia">
								<div className="filtro-titulo-eficiencia">
									{filtros.tipoFiltro === 'faltantes' ? 'Actividades Faltantes' : 'Actividades Realizadas'}
								</div>
								<input 
									type="number" 
									className="filtro-input-eficiencia"
									placeholder={`Ingrese número de ${filtros.tipoFiltro === 'faltantes' ? 'actividades faltantes' : 'actividades realizadas'}`}
									value={filtros.valor}
									onChange={(e) => handleInputChange('valor', e.target.value)}
									min="0"
								/>
							</div>
						)}

						{/* Información de resultados */}
						<div className="filtro-info-eficiencia">
							<div className="filtro-resultados-eficiencia">
								Resultados: {estudiantesFiltrados.length} de {datosEstudiantes.length} estudiantes
							</div>
						</div>

						{/* Botones del filtro */}
						<div className="filtro-botones-eficiencia">
							<button className="filtro-boton-eficiencia filtro-limpiar-eficiencia" onClick={limpiarFiltros}>
								Limpiar
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

				{/* Filas de datos filtrados */}
				{estudiantesFiltrados.length > 0 ? (
					estudiantesFiltrados.map((estudiante, index) => (
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
					))
				) : (
					<div className="no-resultados-eficiencia">
						No se encontraron estudiantes que coincidan con los filtros aplicados
					</div>
				)}
			</div>
		</div>
	);
}