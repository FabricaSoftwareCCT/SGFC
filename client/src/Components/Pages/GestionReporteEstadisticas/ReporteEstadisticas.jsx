import React, { useState, useMemo, useEffect,useRef } from 'react';
import './ReporteEstadisticas.css';
import ReporteEstudiantes from './ReporteEstudiantes';
import {getCursos} from '../../API/ApiRpeort';
import html2pdf from "html2pdf.js"
import { FormatCourse } from './FormatCourse/FormatCourse';

export default function ReporteEstadisticas() {
	const [pantallaActual, setPantallaActual] = useState('cursos');
	const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
	const [botonActivo, setBotonActivo] = useState('cursos');
	const [mostrarFiltro, setMostrarFiltro] = useState(false);
	const [datosCurso, setdatosCurso] = useState([]);
	const [showDownloadOptions, setShowDownloadOptions] = useState(false)
	const [reportType, setReportType] = useState("pdf")
	const [generating, setGenerating] = useState(false)
	const [doneGenerating, setDoneGenerating] = useState(false)
	const [reportContent, setReportContent] = useState(false)

	const pdfContent = useRef()
	
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

	useEffect(() => {
		async function fetchData() {
			try {
				//Cargar datos
				const data = await getCursos(currentPage);

				if(!data){
					alert("Error al cargar datos")
				}
				//Acutalizar estado
				setdatosCurso(data);
			}catch(err){
				alert(" Error en servidor ")
			}
		}
		fetchData()
	}, []);

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

	// Función para aplicar todos los filtros - CORREGIDA
	const cursosFiltrados = useMemo(() => {
		return datosCurso?.filter(curso => {
			// Filtro por estado
			const estadosSeleccionados = [];
			if (filtros.estado.activo) estadosSeleccionados.push('activo');
			if (filtros.estado.inactivo) estadosSeleccionados.push('inactivo');
			
			if (estadosSeleccionados.length > 0 && !estadosSeleccionados.includes(curso.estado)) {
				return false;
			}

			// Filtro por rango de empleados
			const rangosSeleccionados = Object.keys(filtros.empleados).filter(rango => filtros.empleados[rango]);
			if (rangosSeleccionados.length > 0) {
				const rangoEmpleado = getRangoEmpleados(curso.empleados);
				if (!rangosSeleccionados.includes(rangoEmpleado)) {
					return false;
				}
			}

			// Filtro por nombre del curso
			if (filtros.curso && !curso.curso.toLowerCase().includes(filtros.curso.toLowerCase())) {
				return false;
			}

			// Filtro por nombre del instructor
			if (filtros.instructor && !curso.instructor.toLowerCase().includes(filtros.instructor.toLowerCase())) {
				return false;
			}

			// Si pasa todos los filtros, incluir el curso
			return true;
		});
	}, [filtros, datosCurso]);

	// Cálculo para paginación
	const indexOfLastPost = currentPage * postsPerPage;
	const indexOfFirstPost = indexOfLastPost - postsPerPage;
	const currentPosts = cursosFiltrados?.slice(indexOfFirstPost, indexOfLastPost);

	// Función para manejar el clic en una fila
	const handleFilaClick = (curso) => {
		setCursoSeleccionado(curso);
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

	const generarReporte = async () => {
		if (!pdfContent.current)
			return

		switch (reportType) {
			case "pdf": 
				const worker = html2pdf().set({
					margin: 10,
					filename: "reporte_cursos.pdf",
					html2canvas: { scale: 2 },
					jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
				}).from(pdfContent.current)
				setGenerating(false)
				setDoneGenerating(true)
				setReportContent(await worker.output("bloburl"))
				break
			case "excel":
				break
		}
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
				<button className="button-generar-reporte-estadisticas" onClick={() => setShowDownloadOptions(true)}>
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
								Resultados: {cursosFiltrados.length} de {datosCurso.length} cursos
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
				{currentPosts?.length > 0 ? (
					currentPosts.map((curso) => (
						<div 
							key={curso.id} 
							className="tabla-fila-estadisticas"
							onClick={() => handleFilaClick(curso)}
						>
							<div className="columna-curso-estadisticas">{curso.curso}</div>
							<div className="columna-ficha-estadisticas">{curso.ficha}</div>
							<div className="columna-instructor-estadisticas">{curso.instructor}</div>
							<div className={curso.estado === "Activo" ? "estado-activo-estadisticas" : "estado-inactivo-estadisticas"}>
								{curso.estado}
							</div>
							<div className="columna-empleados-estadisticas">{curso.empleados}</div>
						</div>
					))
				) : (
					<div className="no-resultados-estadisticas">
						No se encontraron cursos que coincidan con los filtros aplicados
					</div>
				)}
			</div>

			{/* PAGINACIÓN */}
			{cursosFiltrados?.length > postsPerPage && (
				<>
					<Pagination
						postsPerPage={postsPerPage}
						totalPosts={cursosFiltrados.length}
						currentPage={currentPage}
						setCurrentPage={setCurrentPage}
					/>
					<div className="info-paginacion">
						Mostrando {Math.min(indexOfFirstPost + 1, cursosFiltrados.length)}-
						{Math.min(indexOfLastPost, cursosFiltrados.length)} de {cursosFiltrados.length} cursos
					</div>
				</>
			)}
			{showDownloadOptions && (
				<div className="modal-overlay">
					<div
						className="modal-background"
						style={{
							height: "fit-content",
							paddingBottom: "20px",
							width: "35%",
							minHeight: "fit-content",
						}}
					>
						<div className="container_return_EditCalendar">
							<h5
								onClick={() =>
									setShowDownloadOptions(false)
								}
								style={{ cursor: "pointer" }}
							>
								Volver
							</h5>
							<button
								onClick={() =>
									setShowDownloadOptions(false)
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
						<button
							className="button"
							style={{
								marginTop: "20px",
							}}
							onClick={() => {
								setGenerating(true)
							}}
							disabled={generating}
						>
							{generating ? "Generando..." : "Generar reporte"}
						</button>
						{generating && (
							<FormatCourse
								contentKey={pdfContent}
								cursos={(cursosFiltrados.length > 0 ? cursosFiltrados : datosCurso).map((c) => c.id)}
								done={() => {
									generarReporte()
								}}
							/>
						)}
						{doneGenerating && (
							<a
								className="button"
								href={reportContent}
								target="_blank"
								rel="noopener noreferrer"
								style={{
									marginTop: "20px",
									textDecoration: "none"
								}}
							>
								Descargar
							</a>
						)}
					</div>
				</div>
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