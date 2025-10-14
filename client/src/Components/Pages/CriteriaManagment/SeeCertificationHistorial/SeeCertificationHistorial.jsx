import "../SeeCriteria/SeeCriteria.css"
import "./SeeCertificationHistorial.css"

import { Header } from "../../../Layouts/Header/Header"
import { Main } from "../../../Layouts/Main/Main"
import { GoBackArrow } from "../../../UI/GoBackArrow/GoBackArrow"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { PageMover } from "../../../UI/PageMover/PageMover"

export const SeeCertificationHistorial = () => {
	const navigate = useNavigate()

	const [showFilters, setShowFilters] = useState(false)
	const [filterName, setFilterName] = useState("")
	const [filterDate, setFilterDate] = useState()
	const [filterId, setFilterId] = useState("")

	
	const [showingDownloadOptions, setShowingDownloadingOptions] = useState(false)
	const [aprentices, setAprentices] = useState([])
	const [reportType, setReportType] = useState("pdf")
	const [page, setPage] = useState(0)
	const [pages, setPages] = useState(1)

	const userSession = JSON.parse(localStorage.getItem("userSession")) || JSON.parse(sessionStorage.getItem("userSession"))
	const isLoggedIn = !!userSession
	const accountType = userSession?.accountType || null

	async function fetchAprentices () {
		setAprentices([
			{
				name: "Pol pot",
				personId: "1001001000",
				ficha: "2525069",
				state: "Activo",
				certState: "Pendiente",
				id: 420
			},
			{
				name: "Francisco Macías Nguema",
				personId: "1001001001",
				ficha: "2525069",
				state: "Activo",
				certState: "Pendiente",
				id: 421
			},
			{
				name: "Isaias Afwerki",
				personId: "1001001003",
				ficha: "2525069",
				state: "Activo",
				certState: "Pendiente",
				id: 423
			}
		])
	}

	async function filter () {
		
	}

	useEffect(() => {
		if (isLoggedIn && (accountType === "Instructor" || accountType == "Administrador" || accountType === "Gestor")) {
			fetchAprentices()
		} else {
			navigate("/no-autorizado");
		}
	}, [])

	return <>
		<Header/>
		<GoBackArrow/>
		<Main>
			<div class="container-see-criteria">
				<h2>Historial de <span className="complementary">certificación</span></h2>
				<div 
					className="buttons"
					style={{
						flexDirection: "row-reverse"
					}}
				>
					<button 
						className="button criteria-aprentice-filter-dropdown"
						onClick={() => setShowFilters(!showFilters)}
					>
						Filtro {showFilters ? <>&#9662;</> : <>&#9652;</>}
					</button>
				</div>
				<div className="aprentice-list-container">
					<div className="aprentice-list-header aprentice-cert-list-header">
						<span>Aprendiz</span>
						<span>Documentos</span>
						<span>Estado de certificación</span>
						<span>Detalles</span>
					</div>
					{
						aprentices.length > 0 ?
						aprentices.map((a, i) => 
							<div 
								className="aprentice-cert-list"
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
						<div className="no-aprentices-list">Aún no hay aprendices certificados</div>
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
			{showFilters &&
				<div className="options_Search search-aprentice">
					<label>Aprendiz:</label>
					<input
						type="text"
						className="search-input"
						placeholder="Nombre..."
						value={filterName}
						onChange={(e) => setFilterName(e.target.value)}
					/>
					<label>Documento:</label>
					<input
						type="text"
						className="search-input"
						placeholder="N. del documento..."
						value={filterId}
						onChange={(e) => setFilterId(e.target.value)}
					/>
					<label>Fecha:</label>
					<input
						type="date"
						className="search-input"
						value={filterDate}
						onChange={(e) => setFilterDate(e.target.value)}
					/>
					<button
						style={{
							alignSelf: "center",
							marginTop: "2%"
						}}
						className="button"
						onClick={() => filter()}
					>Filtrar</button>
				</div>
			}
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
		</Main>
	</>
}