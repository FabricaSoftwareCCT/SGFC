import "./SeeCriteria.css"

import { Header } from "../../../Layouts/Header/Header";
import { Main } from "../../../Layouts/Main/Main";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../../config/axiosInstance";
import { PageMover } from "../../../UI/PageMover/PageMover";

export const SeeCourseCriteria = () => {
	const navigate = useNavigate()

	const { id } = useParams()

	const [showFilters, setShowFilters] = useState(false)
	const [showingDownloadOptions, setShowingDownloadingOptions] = useState(false)
	const [showAprenticeCriteria, setShowAprenticeCriteria] = useState(false)

	const [curso, setCurso] = useState()
	const [aprentices, setAprentices] = useState([])	
	const [aprenticeName, setAprenticeName] = useState("")
	const [aprenticeStatus, setAprenticeStatus] = useState(0)
	const [personId, setPersonId] = useState("")
	const [reportType, setReportType] = useState("pdf")
	const [page, setPage] = useState(0)
	const [pages, setPages] = useState(1)
	const [selectedAprentice, setSelectedAprentice] = useState()
	const [aprenticeCriteria, setAprenticeCriteria] = useState()
	const [certificationStatus, setCertificationStatus] = useState("Pendiente")
	const [certificationDenialReason, setCertificationDenialStatus] = useState("")

	async function fetchCourse () {
		try {
			const response = await axiosInstance.get(`api/courses/cursos/${id}`)
			setCurso(response.data)
		} catch (error) {
			console.error("Error al obtener el curso:", error)
		}
	}

	async function fetchAprentices () {
		try {
			const response = await axiosInstance.get(`/api/courses/cursos/${id}/participants?page=${page}${
				aprenticeName?.length > 0 ? `&name=${aprenticeName}` : ""
			}${
				personId?.length > 0 ? `&doc=${personId}` : ""
			}${
				aprenticeStatus != 0 ?
					aprenticeStatus == 1 ?
						`&state=activo`
					:
						`&state=inactivo`
				: ""
			}`)
			if (!response.data.success)
				throw response.data
			setAprentices(response.data.participants.map((aprentice) => {
				return {
					name: `${aprentice.aprendiz.nombres} ${aprentice.aprendiz.apellidos}`,
					personId: aprentice.aprendiz.documento,
					state: aprentice.aprendiz.estado,
					certState: aprentice.estado_certificacion,
					id: aprentice.aprendiz.ID
				}
			}))
			setPages(response.data.pages)
		} catch (error) {
			console.error(error)
			alert("Ocurrió un error al consultar los aprendices del curso.")
		}
	}

	function selectStatus (s) {
		if (aprenticeStatus == s)
			setAprenticeStatus(0)
		else
			setAprenticeStatus(s)
	}

	async function fetchAprenticeCriteria () {
		setAprenticeCriteria([
			{
				id: 1,
				title: "Asistencias",
				description: "Para garantizar el óptimo aprovechamiento académico y el cumplimiento de los objetivos del curso, es fundamental la asistencia regular y puntual de todos los aprendices. La asistencia mínima obligatoria para ser acreedor a la certificación es del 80%. Considerando la duración total del programa, esto se traduce en que el aprendiz no puede acumular más de 5 inasistencias a lo largo del curso. Superar este límite automáticamente dará lugar a la baja administrativa, sin derecho a la recuperación de contenidos o a la evaluación final.",
				has_value: true,
				min: 20,
				value: 15,
			},
			{
				id: 2,
				title: "Actividades",
				description: "La certificación final del curso está sujeta al cumplimiento integral de las actividades académicas asignadas. Es un requisito indispensable para certificarse que el aprendiz haya entregado la totalidad de las actividades, proyectos y evaluaciones establecidos en el plan de estudios. No estar al día con las entregas, es decir, tener actividades pendientes o sin enviar, imposibilita la certificación automáticamente, ya que demuestra un incompleto dominio de los objetivos de aprendizaje planteados para cada módulo.",
				has_value: true,
				min: 5,
				value: 5,
			},
			{
				id: 3,
				title: "Evidencias",
				description: "La certificación final del curso está sujeta al cumplimiento integral de las actividades académicas asignadas. Es un requisito indispensable para certificarse que el aprendiz haya entregado la totalidad de las actividades, proyectos y evaluaciones establecidos en el plan de estudios. No estar al día con las entregas, es decir, tener actividades pendientes o sin enviar, imposibilita la certificación automáticamente, ya que demuestra un incompleto dominio de los objetivos de aprendizaje planteados para cada módulo.",
				has_value: true,
				min: 1,
				value: 0,
			},
			{
				id: 4,
				title: "Horas",
				description: "La certificación final del curso está sujeta al cumplimiento integral de las actividades académicas asignadas. Es un requisito indispensable para certificarse que el aprendiz haya entregado la totalidad de las actividades, proyectos y evaluaciones establecidos en el plan de estudios. No estar al día con las entregas, es decir, tener actividades pendientes o sin enviar, imposibilita la certificación automáticamente, ya que demuestra un incompleto dominio de los objetivos de aprendizaje planteados para cada módulo.",
				has_value: true,
				min: 8,
				value: 2,
			},
			{
				id: 5,
				title: "Existir",
				description: "La certificación final del curso está sujeta al cumplimiento integral de las actividades académicas asignadas. Es un requisito indispensable para certificarse que el aprendiz haya entregado la totalidad de las actividades, proyectos y evaluaciones establecidos en el plan de estudios. No estar al día con las entregas, es decir, tener actividades pendientes o sin enviar, imposibilita la certificación automáticamente, ya que demuestra un incompleto dominio de los objetivos de aprendizaje planteados para cada módulo.",
				has_value: false,
			}
		])
	}

	function selectAprentice (aprenticeId) {
		setCertificationDenialStatus("")
		setSelectedAprentice(aprenticeId)
		setShowAprenticeCriteria(true)
		fetchAprenticeCriteria()
	}

	async function saveChanges () {
		if (certificationStatus == "Rechazado" && certificationDenialReason.length < 10) {
			alert("Se debe escribir el motivo por el cual no se aprovó la certificación")
		} else {
			setShowAprenticeCriteria(false)
		}
	}

	async function filter () {
		fetchAprentices()
		setShowFilters(false)
	}

	async function generateCert () {
		
	}

	const userSession = JSON.parse(localStorage.getItem("userSession")) || JSON.parse(sessionStorage.getItem("userSession"))
	const isLoggedIn = !!userSession
	const accountType = userSession?.accountType || null

	useEffect(() => {
		if (isLoggedIn && (accountType === "Instructor" || accountType == "Administrador" || accountType === "Gestor")) {
			fetchCourse()
			fetchAprentices()
		} else {
			navigate("/no-autorizado");
		}
	}, [id])

	useEffect(() => {
		if (isLoggedIn && (accountType === "Instructor" || accountType == "Administrador" || accountType === "Gestor")) {
			fetchCourse()
			fetchAprentices()
		} else {
			navigate("/no-autorizado");
		}
	}, [page])

	return (
		<>
			<Header/>
			<Main>
				<div class="container-see-criteria">
					<h2>Criterios de <span className="complementary">Certificación</span></h2>
					<div className="buttons">
						<button 
							className="button see-criteria-button"
							onClick={() => navigate("/Gestiones/Criterios/Curso/1")}
						>
							Ver criterios
						</button>
						<button 
							className="button criteria-aprentice-filter-dropdown"
							onClick={() => setShowFilters(!showFilters)}
						>
							Filtro {showFilters ? <>&#9662;</> : <>&#9652;</>}
						</button>
					</div>
					{showFilters &&
						<div className="options_Search search-aprentice">
							<label>Aprendiz:</label>
							<input
								type="text"
								className="search-input"
								placeholder="Nombre..."
								value={aprenticeName}
								onChange={(e) => setAprenticeName(e.target.value)}
							/>
							<label>Documento:</label>
							<input
								type="text"
								className="search-input"
								placeholder="N. del documento..."
								value={personId}
								onChange={(e) => setPersonId(e.target.value)}
							/>
							<label htmlFor="estado">Estado:</label>
							<div className="statusButtons">
								<button
									className={`status-btn ${aprenticeStatus == 1 ? 'selected' : ''}`}
									onClick={() => selectStatus(1)}
								>
									Activo
								</button>
								<button
									className={`status-btn ${aprenticeStatus == -1 ? 'selected' : ''}`}
									onClick={() => selectStatus(-1)}
								>
									Inactivo
								</button>
							</div>
							<button
								style={{
									alignSelf: "center",
									marginTop: "2%"
								}}
								onClick={() => filter()}
								className="button"
							>Filtrar</button>
						</div>
					}
					<div className="aprentice-list-container">
						<div className="aprentice-list-header">
							<span>Aprendiz</span>
							<span>Documentos</span>
							<span>Estado</span>
							<span>Estado de certificación</span>
							<span>Detalles</span>
						</div>
						{
							aprentices.length > 0 ?
								aprentices.map((a, i) => 
									<div 
										key={i}
										className="aprentice-list"
										style={{
											backgroundColor: i % 2 == 0 ? "#474747ff" : "#5b5b5bff"
										}}
									>
										<span>
											{a.name}
										</span>
										<span>
											{a.personId}
										</span>
										<span>
											{a.state}
										</span>
										<span>
											{a.certState}
										</span>
										<button
											onClick={() => selectAprentice(a)}
										>
											Ver criterios
										</button>
									</div>
								)
							:
								<div className="no-aprentices-list">El curso aún no tiene aprendices asignados</div>
						}
					</div>
					<PageMover
						value={page + 1}
						max={pages}
						next={() => {
							setPage(page + 1)
						}}
						prev={() => {
							setPage(page - 1)
						}}
					/>
					<button
						className="button end-button"
						onClick={() => setShowingDownloadingOptions(true)}
					>Generar reporte</button>
				</div>
				{showingDownloadOptions &&
					<div className="modal-overlay">
						<div 
							className="modal-background"
							style={{
								height: "fit-content",
								paddingBottom: "20px",
								width: "35%"
							}}
						>
							<div className="container_return_EditCalendar">
								<h5
									onClick={() => setShowingDownloadingOptions(false)}
									style={{ cursor: "pointer" }}
								>Volver</h5>
								<button
									onClick={() => setShowingDownloadingOptions(false)}
									className="closeModal">
								</button>
							</div>
							<h2 className="modal-title-edit-calendar">Tipo de reporte</h2>
							<div
								className="statusButtons"
								style={{
									width: "90%"
								}}
							>
								<button
									className={`status-btn ${reportType == "pdf" && 'selected'}`}
									onClick={() => setReportType("pdf")}
								>
									PDF
								</button>
								<button
									className={`status-btn ${reportType == "excel" && "selected"}`}
									onClick={() => setReportType("excel")}
								>
									Excel
								</button>
							</div>
							<button
								className="button"
								style={{
									marginTop: "20px"
								}}
								onClick={() => setShowingDownloadingOptions(false)}
							>Descargar reporte</button>
						</div>
					</div>
				}
				{showAprenticeCriteria &&
					<div className="modal-overlay">
						<div
							className="modal-background"
							style={{
								paddingBottom: "20px",
								width: "35%",
								minWidth: "450px"
							}}
						>
							<div className="container_return_EditCalendar">
								<h5
									onClick={() => setShowAprenticeCriteria(false)}
									style={{ cursor: "pointer" }}
								>Volver</h5>
								<button
									onClick={() => setShowAprenticeCriteria(false)}
									className="closeModal">
								</button>
							</div>
							<h2 className="modal-title-edit-calendar">Criterios</h2>
							<div className="person-criteria-container">
								<label>Nombre: </label>
								<span>{selectedAprentice.name}</span>
								<label>Documentos:</label>
								<span>{selectedAprentice.personId}</span>
								{aprenticeCriteria.map((criteria) => {
									//console.log(criteria)
									return <>
										<label>{criteria.title}</label>
										<div className="person-criteria-item">
											{criteria.has_value &&
												<div className="person-criteria-value">
													<span>{criteria.value}</span>
													<span>/</span>
													<span>{criteria.min}</span>
												</div>
											}
										</div>
									</>
								})}
								<div className="certification-status">
									<button
										className={`status-btn ${certificationStatus == "Aprovado" ? 'selected' : ''}`}
										onClick={() => setCertificationStatus("Aprovado")}
									>
										Aprovado
									</button>
									<button
										className={`status-btn ${certificationStatus == "Pendiente" ? 'selected' : ''}`}
										onClick={() => setCertificationStatus("Pendiente")}
									>
										Pendiente
									</button>
									<button
										className={`status-btn ${certificationStatus == "Rechazado" ? 'selected' : ''}`}
										onClick={() => setCertificationStatus("Rechazado")}
										style={certificationStatus == "Rechazado" ? {
											backgroundColor: "red"
										} : {}}
									>
										Rechazado
									</button>
								</div>
								{certificationStatus == "Rechazado" &&
									<textarea
										type="text"
										className="search-input reason-textarea"
										placeholder="Escriba la razón por la que se rechazó la certificación..."
										value={certificationDenialReason}
										onChange={(e) => setCertificationDenialStatus(e.target.value)}
									></textarea>
					 			}
								<button className="button"
									onClick={() => saveChanges()}
								>
									Certificar
								</button>
								{certificationStatus == "Aprovado" &&
									<button className="button"
										onClick={() => generateCert()}
									>
										Generar certificado
									</button>
								}
							</div>
						</div>
					</div>
				}
			</Main>
		</>
	);
}