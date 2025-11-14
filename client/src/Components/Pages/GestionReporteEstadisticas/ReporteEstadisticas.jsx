import { useState, useMemo, useEffect, useRef } from 'react';
import './ReporteEstadisticas.css';
import ReporteEstudiantes from './ReporteEstudiantes';
import {getCursos} from '../../API/ApiRpeort';
import html2pdf from "html2pdf.js"
import { FormatCourse } from './FormatCourse/FormatCourse';
import axiosInstance from '../../../config/axiosInstance';
import * as xlsx from "xlsx"
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css'


export default function ReporteEstadisticas() {
	const [pantallaActual, setPantallaActual] = useState('cursos');
	const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
	const [mostrarFiltro, setMostrarFiltro] = useState(false);
	const [datosCurso, setdatosCurso] = useState([]);
	const [showDownloadOptions, setShowDownloadOptions] = useState(false)
	const [reportType, setReportType] = useState("pdf")
	const [generating, setGenerating] = useState(false)
	const [doneGenerating, setDoneGenerating] = useState(false)
	const [reportContent, setReportContent] = useState(false)
	const [reportFilename, setReportFilename] = useState("reporte_cursos.pdf")

	const pdfContent = useRef()

	// Helper para formatear errores con contexto detallado
	const formatDetailedError = (error) => {
		// Axios error con response
		const statusCode = error?.response?.status
		const statusText = error?.response?.statusText
		const responseData = error?.response?.data
		const requestUrl = error?.config?.url
		const method = error?.config?.method
		const baseMessage = error?.message || "Error desconocido"
		try {
			const responsePreview = typeof responseData === "string" ? responseData : JSON.stringify(responseData)
			return [
				`Mensaje: ${baseMessage}`,
				requestUrl ? `Endpoint: [${method?.toUpperCase()}] ${requestUrl}` : undefined,
				statusCode ? `HTTP: ${statusCode} ${statusText || ""}`.trim() : undefined,
				responseData ? `Respuesta: ${responsePreview}` : undefined,
			].filter(Boolean).join("\n")
		} catch (_) {
			return [
				`Mensaje: ${baseMessage}`,
				requestUrl ? `Endpoint: [${method?.toUpperCase()}] ${requestUrl}` : undefined,
				statusCode ? `HTTP: ${statusCode} ${statusText || ""}`.trim() : undefined,
				responseData ? `Respuesta: [no serializable]` : undefined,
			].filter(Boolean).join("\n")
		}
	}
	
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
					Swal.fire({
						icon: 'error',
						title: 'Error',
						text: 'Error al cargar datos',
						confirmButtonText: 'Aceptar',
						confirmButtonColor: '#d33',
						theme:"bulma",
							customClass: { confirmButton: 'centered-swal-button' }
					});
				}
				//Acutalizar estado
				setdatosCurso(data);
			}catch(err){
				console.log(err)
				Swal.fire({
					icon: 'error',
					title: 'Error del servidor',
					text: 'Error en servidor',
					confirmButtonText: 'Aceptar',
					confirmButtonColor: '#d33',
					theme:"bulma",
					customClass: { confirmButton: 'centered-swal-button' }
				});
			}
		}
		fetchData()
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
			if (filtros.estado.activo) estadosSeleccionados.push('activo', 'Activo');
			if (filtros.estado.inactivo) estadosSeleccionados.push('inactivo', 'Inactivo');
			
			if (estadosSeleccionados.length > 0) {
				const estadoCurso = curso.estado?.toLowerCase() || '';
				const coincideActivo = filtros.estado.activo && (estadoCurso === 'activo');
				const coincideInactivo = filtros.estado.inactivo && (estadoCurso === 'inactivo');
				
				if (!coincideActivo && !coincideInactivo) {
					return false;
				}
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
			if (filtros.instructor && curso.instructor) {
				const instructorLower = curso.instructor.toLowerCase();
				const filtroLower = filtros.instructor.toLowerCase();
				if (!instructorLower.includes(filtroLower)) {
					return false;
				}
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
		if (!curso.empleados || curso.empleados === 0) {
			alert('Este curso no tiene empleados registrados. No se puede generar un reporte.');
			return;
		}
		setCursoSeleccionado(curso);
		setPantallaActual('estudiantes');
	};

	// Función para volver a la pantalla de cursos
	const handleVolverACursos = () => {
		setPantallaActual('cursos');
		setCursoSeleccionado(null);
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

const generarExcelHistorial = async () => {
	try {
		const empleados = (await axiosInstance.get(`/api/users/admin/empleados?limit=99999`)).data.empleados
		let cursosIds = (cursosFiltrados.length > 0 ? cursosFiltrados : datosCurso).map((c) => c.id)
		let cursosData = []
		let empleadosData = []

		console.log("Consultando cursos...")
		for (let cursoId of cursosIds) {
			const curso = (await axiosInstance.get(`/api/courses/cursos/${cursoId}`)).data
			for (let empleado of empleados) {
				console.log(empleado.ID)
			}
			cursosData.push({
				"Curso": curso.nombre_curso,
				"Tipo": curso.tipo_oferta,
				"Estado": curso.estado,
				"Ficha": curso.ficha,
				"Inicio": new Date(curso.fecha_inicio).toLocaleDateString("es-CO"),
				"Fin": new Date(curso.fecha_fin).toLocaleDateString("es-CO"),
				"Duración en días": curso.duracion_dias ?? "Sin determinar",
				"Lugar de formación": curso.lugar_formacion ?? "Sin especificar",
				"Instructor": curso.Instructor ? `${curso.Instructor.nombres} ${curso.Instructor.apellidos}` : "Pendiente",
				"Cantidad de aprendices": curso.cupos_usados,
			})
		}

		console.log("Consultando empleados...")
		empleadosData = empleados.map((e) => ({
			"Nombre": `${e.nombres} ${e.apellidos}`,
			"Documento": e.documento,
			"Numero teléfonico": e.celular,
			"Email": e.email,
			"Estado": e.estado,
			"Cursos": Array.isArray(e.cursos) ? e.cursos.join("\n") : "",
			"Empresa": e?.Empresa?.nombre_empresa || "Sin empresa"
		}))

		const workBook = xlsx.utils.book_new()
		xlsx.utils.book_append_sheet(workBook, xlsx.utils.json_to_sheet(cursosData), "Cursos")
		xlsx.utils.book_append_sheet(workBook, xlsx.utils.json_to_sheet(empleadosData), "Empleados")
		xlsx.writeFile(workBook, "reporte.xlsx", { compression: true })
	} catch (error) {
		console.error("Error generando Excel:", error)
		alert(`Error al generar Excel\n\n${formatDetailedError(error)}`)
	} finally {
		setGenerating(false)
	}
}

const generarReporteDesdeElemento = async (targetElement) => {
	try {
		if (reportType === "pdf") {
			if (!targetElement) throw new Error("No hay contenido para generar el PDF")

			// Forzar reflow y pequeña espera para layout estable
			// eslint-disable-next-line no-unused-expressions
			targetElement.offsetHeight
			await new Promise(r => setTimeout(r, 150))

			const worker = html2pdf().set({
				margin: 10,
				filename: "reporte_cursos.pdf",
				html2canvas: {
					scale: 2,
					useCORS: true,
					allowTaint: true,
					backgroundColor: '#FFFFFF',
				},
				jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
				pagebreak: { mode: [ 'css', 'avoid-all', 'legacy' ] }
			}).from(targetElement)

			// Generar blob y descargar automáticamente
			const blob = await worker.output("blob")
			const blobUrl = URL.createObjectURL(blob)
			const filename = "reporte_cursos.pdf"
			setReportFilename(filename)
			setReportContent(blobUrl)
			// Auto-descarga
			const a = document.createElement('a')
			a.href = blobUrl
			a.download = filename
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			setDoneGenerating(true)
		}
	} catch (err) {
		console.error("Error generando PDF:", err)
		alert(`Error al generar PDF\n\n${formatDetailedError(err)}`)
		setDoneGenerating(false)
	} finally {
		setGenerating(false)
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
								Resultados: {cursosFiltrados?.length ?? 0} de {datosCurso?.length ?? 0} cursos
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
					currentPosts.map((curso) => {
						const tieneEmpleados = curso.empleados && curso.empleados > 0;
						return (
							<div 
								key={curso.id} 
								className={`tabla-fila-estadisticas ${!tieneEmpleados ? 'curso-sin-empleados' : ''}`}
								onClick={() => handleFilaClick(curso)}
								title={!tieneEmpleados ? 'Este curso no tiene empleados registrados' : ''}
							>
								<div className="columna-curso-estadisticas">{curso.curso}</div>
								<div className="columna-ficha-estadisticas">{curso.ficha}</div>
								<div className="columna-instructor-estadisticas">{curso.instructor}</div>
								<div className={curso.estado === "Activo" ? "estado-activo-estadisticas" : "estado-inactivo-estadisticas"}>
									{curso.estado}
								</div>
								<div className="columna-empleados-estadisticas">{curso.empleados}</div>
							</div>
						);
					})
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
								if (reportType === "excel")
									generarExcelHistorial()
							}}
							disabled={generating}
						>
							{generating ? "Generando..." : "Generar reporte"}
						</button>
						{(generating  && reportType === "pdf") && (
							<div style={{ position: "absolute", left: "-10000px", top: 0 }}>
								<FormatCourse
									contentKey={pdfContent}
									cursos={(cursosFiltrados.length > 0 ? cursosFiltrados : datosCurso).map((c) => c.id)}
									onReady={(el) => generarReporteDesdeElemento(el)}
								/>
							</div>
						)}
						{doneGenerating && reportContent && (
							<a
								className="button"
								href={reportContent}
								download={reportFilename}
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