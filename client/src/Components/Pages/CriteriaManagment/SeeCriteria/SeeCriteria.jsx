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

	const [curso, setCurso] = useState()
	const [aprentices, setAprentices] = useState([])
	const [showFilters, setShowFilters] = useState(false)
	const [aprenticeName, setAprenticeName] = useState("")
	const [aprenticeStatus, setAprenticeStatus] = useState(0)
	const [ficha, setFicha] = useState("")
	const [personId, setPersonId] = useState("")
	const [showingDownloadOptions, setShowingDownloadingOptions] = useState(false)
	const [reportType, setReportType] = useState("pdf")
	const [page, setPage] = useState(0)
	const [pages, setPages] = useState(1)

	async function fetchCourse () {
		try {
			const response = await axiosInstance.get(`api/courses/cursos/${id}`)
			setCurso(response.data)
		} catch (error) {
			console.error("Error al obtener el curso:", error)
		}
	}

	async function fetchAprentices () {
		setAprentices([
			{
				name: "Pol pot",
				personId: "1001001000",
				ficha: "2525069",
				state: "Pendiente",
				id: 420
			},
			{
				name: "Francisco Macías Nguema",
				personId: "1001001001",
				ficha: "2525069",
				state: "Pendiente",
				id: 421
			},
			{
				name: "Isaias Afwerki",
				personId: "1001001003",
				ficha: "2525069",
				state: "Pendiente",
				id: 423
			}
		])
	}

	function selectStatus (s) {
		if (aprenticeStatus == s) {
			setAprenticeStatus(0)
		} else {
			setAprenticeStatus(s)
		}
	}

	useEffect(() => {
		fetchCourse()
		fetchAprentices()
	}, [id])

	useEffect(() => {

	}, [aprenticeName, aprenticeStatus, personId, ficha])

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
							<label>Ficha:</label>
							<input
								type="text"
								className="search-input"
								placeholder="Nombre de la ficha..."
								value={aprenticeName}
								onChange={(e) => setFicha(e.target.value)}
							/>
							<label>Documento:</label>
							<input
								type="text"
								className="search-input"
								placeholder="N. del documento..."
								value={aprenticeName}
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
						</div>
					}
					<div className="aprentice-list-container">
						<div className="aprentice-list-header">
							<span>Aprendiz</span>
							<span>Documentos</span>
							<span>Fichas</span>
							<span>Estado de certificación</span>
							<span>Detalles</span>
						</div>
						{
							aprentices.length > 0 ?
								aprentices.map((a, i) => 
									<div 
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
											{a.ficha}
										</span>
										<span>
											{a.state}
										</span>
										<button
											onClick={() => navigate(`/Gestiones/Criterios/${id}/${a.id}`)}
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
							<h2 className="modal-title-edit-calendar">
								Tipo de reporte
							</h2>
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
			</Main>
		</>
	);
}