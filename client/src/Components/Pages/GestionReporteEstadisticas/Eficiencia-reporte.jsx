import React, { useState, useMemo, useEffect, useRef } from 'react'; // ← AGREGAR useRef y useEffect
import './Eficiencia-reporte.css';
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css'
import axiosInstance from '../../../config/axiosInstance';
import { generarExcelEficiencia } from '../../../utils/Reports/Eficiencia';
import { FormatEfficiency } from './FormatEfficiency/FormatEfficiency';
import html2pdf from "html2pdf.js";

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
	const [datosEstudiantes, setDatosEstudiantes] = useState([])
	const [estudiantesFiltrados, setEstudiantesFiltrados] = useState([])
	const [showReportOptions, setShowReportOptions] = useState(false)
	const [reportType, setReportType] = useState("pdf");
	const [generating, setGenerating] = useState(false);
	const [doneGenerating, setDoneGenerating] = useState(false);
	const [reportContent, setReportContent] = useState(false);

	// AGREGAR LA REFERENCIA
	const filtroRef = useRef(null);
	const pdfContent = useRef();

	const fetchEstudiantes = async () => {
		try {
			const aprendices = (await axiosInstance.get(`/api/courses/cursos/${cursoSeleccionado.id}/participants`))?.data.participants.map((a) => a.aprendiz)
			let aprendicesData = []
			for (let a of aprendices) {
				const estadoCurso = (await axiosInstance.get(`/api/certification/course/${cursoSeleccionado.id}/aprendiz/${a.ID}`))?.data
				aprendicesData.push(
					{
						nombre: a.nombres, 
						apellido: a.apellidos, 
						documento: a.documento, 
						estado: a.estado, 
						faltantes: estadoCurso.total_activities - estadoCurso.submitted_activities,
						realizadas: estadoCurso.submitted_activities,
						eficiencia: `${parseInt((estadoCurso.submitted_activities * 100) / estadoCurso.total_activities)}%`
					}
				)
			}
			setDatosEstudiantes(aprendicesData)
		} catch (error) {
			console.log(error)
			await Swal.fire({
				icon: 'error',
				title: 'Error en el sistema',
				text: 'Ocurrió un error al consultar los aprendices del curso',
				confirmButtonText: 'Aceptar',
				theme: 'bulma',
				customClass: {
					actions: 'swal2-center-actions'
				}
			})
		}
	}

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

		fetchEstudiantes()

		document.addEventListener('mousedown', handleClickOutside);

		// Limpiar event listener cuando el componente se desmonta
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [mostrarFiltro]);

	useEffect(() => {
		fetchEstudiantes()
	}, [])

	useEffect(() => {
		setEstudiantesFiltrados(
			datosEstudiantes.filter(estudiante => {
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
				if (filtros.estado.activo) estadosSeleccionados.push('activo');
				if (filtros.estado.inactivo) estadosSeleccionados.push('inactivo');
				
				if (estadosSeleccionados.length > 0 && !estadosSeleccionados.includes(estudiante.estado.toLowerCase())) {
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
			})
		)
	}, [datosEstudiantes, filtros])


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

	const generarReporte = async () => {
		console.log('Generando reporte de eficiencia...');
		try {
			if (reportType === "pdf") {
				if (!pdfContent.current)
					return
				const worker = html2pdf().set({
					margin: 10,
					filename: "Reporte de eficiencia.pdf",
					html2canvas: { scale: 2 },
					jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
				}).from(pdfContent.current)
				setGenerating(false)
				setDoneGenerating(true)
				setReportContent(await worker.output("bloburl"))
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
			}
		} catch (error) {
			console.log(error)
			Swal.fire({
				icon:"error",
				title:"Error al generar el reporte",
				text:"Ocurrió un error al generar el reporte, intentelo otra vez",
			})
			setDoneGenerating(false)
			setGenerating(false)
		}
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
				<button className="button-generar-reporte-eficiencia" onClick={() => setShowReportOptions(true)}>
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
			{showReportOptions && (
				<div className="modal-overlay">
					<div
						className="modal-background"
						style={{
							height: "fit-content",
							paddingBottom: "20px",
							width: "35%",
						}}
					>
						<div className="container_return_EditCalendar">
							<h5
								onClick={() =>
									setShowReportOptions(false)
								}
								style={{ cursor: "pointer" }}
							>
								Volver
							</h5>
							<button
								onClick={() =>
									setShowReportOptions(false)
								}
								className="closeModal"
							></button>
						</div>
						<h2 className="modal-title-edit-calendar">
							Tipo de reporte
						</h2>
						<div
							className="statusButtons"
							style={{
								width: "90%",
							}}
						>
							<button
								className={`status-btn ${
									reportType == "pdf" && "selected"
								}`}
								onClick={() => setReportType("pdf")}
							>
								PDF
							</button>
							<button
								className={`status-btn ${
									reportType == "excel" && "selected"
								}`}
								onClick={() => setReportType("excel")}
							>
								Excel
							</button>
						</div>
						{reportType === "excel" ?
							<button
								className="button"
								style={{
									marginTop: "20px",
								}}
								onClick={() => generarExcelEficiencia(estudiantesFiltrados, () => setShowReportOptions(false))}
							>Descargar reporte</button>
						:
							<>
								<button
									className="button"
									style={{
										marginTop: "20px",
									}}
									onClick={() => setGenerating(true)}
								>Generar reporte</button>
								{generating &&
									<FormatEfficiency
										contentKey={pdfContent}
										aprendices={estudiantesFiltrados}
										done={() => {
											generarReporte()
										}}
									/>
								}
							</>
						}
						{doneGenerating && reportType === "pdf" && (
							<a
								className="button"
								href={reportContent}
								target="_blank"
								rel="noopener noreferrer"
								style={{
									marginTop: "20px",
									textDecoration: "none"
								}}
							>Descargar</a>
						)}
					</div>
				</div>
			)}
		</div>
	);
}