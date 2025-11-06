import "../SeeCriteria/SeeCriteria.css";
import "./SeeCertificationHistorial.css";

import { Header } from "../../../Layouts/Header/Header";
import { Main } from "../../../Layouts/Main/Main";
import { GoBackArrow } from "../../../UI/GoBackArrow/GoBackArrow";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { PageMover } from "../../../UI/PageMover/PageMover";
import axiosInstance from "../../../../config/axiosInstance";
import { generarExcelHistorial } from "../../../../utils/Reports/Criterios";
import html2pdf from "html2pdf.js"
import { useRef } from "react";
import { ReportCertification } from "../ReportCertification.jsx/ReportCertification";
import Swal from "sweetalert2";
import 'sweetalert2/themes/bulma.css'

export const SeeCertificationHistorial = () => {
	const navigate = useNavigate();

	const { id } = useParams();

	const [showFilters, setShowFilters] = useState(false);
	const [filterName, setFilterName] = useState("");
	//const [filterDate, setFilterDate] = useState();
	const [filterId, setFilterId] = useState("");
	const [showingDownloadOptions, setShowingDownloadingOptions] = useState(false);
	const [curso, setCurso] = useState();
	const [aprentices, setAprentices] = useState([]);
	const [reportType, setReportType] = useState("pdf");
	const [page, setPage] = useState(0);
	const [pages, setPages] = useState(1);

	//const [selectedAprentice, setSelectedAprentice] = useState();
	const [showAprenticeCriteria, setShowAprenticeCriteria] = useState(false);
	const [certificationState, setCertificationState] = useState("");
	const [certificationDenial, setCertificationDenial] = useState("");
	const [doneGenerating, setDoneGenerating] = useState(false)
	const [generating, setGenerating] = useState(false)
	const [reportContent, setReportContent] = useState(false)

	const pdfContent = useRef()

	const userSession =
		JSON.parse(localStorage.getItem("userSession")) ||
		JSON.parse(sessionStorage.getItem("userSession"));
	const isLoggedIn = !!userSession;
	const accountType = userSession?.accountType || null;

	async function fetchAprenticeCriteria(user) {
		try {
			const resp = await axiosInstance.get(
				`/api/certification/course/${id}/aprendiz/${user.id}`
			);
			setCertificationState(resp.data.certification_status);
			setCertificationDenial(resp.data.denial_justification);
		} catch (error) {
			console.error(error);
			await Swal.fire({
				icon: 'error',
				title: 'Error',
				text: 'Ocurrió un error al consultar los resultados de los criterios',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#d33',
				theme: "bulma", // Añadido tema Bulma
				customClass: {
					confirmButton: 'centered-swal-button'
				}
			});
			setShowAprenticeCriteria(false);
		}
	}

	async function fetchAprentices() {
		try {
			const response = await axiosInstance.get(
				`/api/courses/cursos/${id}/participants?page=${page}${
					filterName?.length > 0 ? `&name=${filterName}` : ""
				}${filterId?.length > 0 ? `&doc=${filterId}` : ""}`
			);
			if (!response.data.success) throw response.data;
			setAprentices(
				response.data.participants.map((aprentice) => {
					return {
						name: `${aprentice.aprendiz.nombres} ${aprentice.aprendiz.apellidos}`,
						personId: aprentice.aprendiz.documento,
						state: aprentice.aprendiz.estado,
						certState: aprentice.estado_certificacion,
						id: aprentice.aprendiz.ID,
					};
				})
			);
			setPages(response.data.pages);
		} catch (error) {
			console.error(error);
			await Swal.fire({
				icon: 'error',
				title: 'Error',
				text: 'Ocurrió un error al consultar los aprendices del curso',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#d33',
				theme: "bulma", // Añadido tema Bulma
				customClass: {
					confirmButton: 'centered-swal-button'
				}
			});
		}
	}

	async function filter() {
		fetchAprentices();
		setShowFilters(false);
	}

	async function fetchCourse() {
		try {
			const response = await axiosInstance.get(
				`api/courses/cursos/${id}`
			);
			setCurso(response.data);
		} catch (error) {
			console.error("Error al obtener el curso:", error);
		}
	}

	useEffect(() => {
		if (
			isLoggedIn &&
			(accountType === "Instructor" ||
				accountType == "Administrador" ||
				accountType === "Gestor")
		) {
			fetchAprentices();
			fetchCourse()
		} else {
			navigate("/no-autorizado");
		}
	}, [id]);

	useEffect(() => {
		if (
			isLoggedIn &&
			(accountType === "Instructor" ||
				accountType == "Administrador" ||
				accountType === "Gestor")
		) {
			fetchAprentices();
		} else {
			navigate("/no-autorizado");
		}
	}, [page]);

	function selectAprentice(aprenticeId) {
		//setSelectedAprentice(aprenticeId);
		setShowAprenticeCriteria(true);
		fetchAprenticeCriteria(aprenticeId);
	}

	function showCert() {
		Swal.fire({
			icon: 'info',
			title: 'Funcionalidad en desarrollo',
			text: 'La visualización de certificados estará disponible próximamente',
			confirmButtonText: 'Aceptar',
			confirmButtonColor: '#3085d6',
			theme: "bulma", // Añadido tema Bulma
			customClass: {
				confirmButton: 'centered-swal-button'
			}
		});
	}

	const generarReporte = async () => {
		try {
			if (reportType === "pdf") {
				if (!pdfContent.current)
					return
				const worker = html2pdf().set({
					margin: 10,
					filename: "reporte_cursos.pdf",
					html2canvas: { scale: 2 },
					jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
				}).from(pdfContent.current)
				setGenerating(false)
				setDoneGenerating(true)
				setReportContent(await worker.output("bloburl"))
			}
		} catch (error) {
			console.log(error)
			alert("Ocurrió un error al generar el reporte")
			setDoneGenerating(false)
			setGenerating(false)
		}
	}

	return (
		<>
			<Header />
			<GoBackArrow />
			<Main>
				<div className="container-see-criteria">
					<h2>
						Historial de{" "}
						<span className="complementary">certificación</span>
					</h2>
					<div
						className="buttons"
						style={{
							flexDirection: "row-reverse",
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
						{aprentices.length > 0 ? (
							aprentices.map((a, i) => (
								<div
									key={i}
									className="aprentice-cert-list"
									style={{
										backgroundColor:
											i % 2 == 0
												? "#474747ff"
												: "#5b5b5bff",
									}}
								>
									<span>{a.name}</span>
									<span>{a.personId}</span>
									<span>{a.certState}</span>
									<button onClick={() => selectAprentice(a)}>
										Ver criterios
									</button>
								</div>
							))
						) : (
							<div className="no-aprentices-list">
								Aún no hay aprendices certificados
							</div>
						)}
					</div>
					<PageMover
						value={page + 1}
						max={pages}
						next={() => {
							setPage(page + 1);
						}}
						prev={() => {
							setPage(page - 1);
						}}
					/>
					<button
						className="button end-button"
						onClick={() => setShowingDownloadingOptions(true)}
					>
						Generar reporte
					</button>
				</div>
				{showFilters && (
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
						{/*<label>Fecha:</label>
						<input
							type="date"
							className="search-input"
							value={filterDate}
							onChange={(e) => setFilterDate(e.target.value)}
						/>*/}
						<button
							style={{
								alignSelf: "center",
								marginTop: "2%",
							}}
							className="button"
							onClick={() => filter()}
						>
							Filtrar
						</button>
					</div>
				)}
				{showingDownloadOptions && (
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
										setShowingDownloadingOptions(false)
									}
									style={{ cursor: "pointer" }}
								>
									Volver
								</h5>
								<button
									onClick={() =>
										setShowingDownloadingOptions(false)
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
									onClick={() => generarExcelHistorial(aprentices, curso, id, () => setShowingDownloadingOptions(false))}
								>
									Descargar reporte
								</button>	
							:
								<>
									<button
										className="button"
										style={{
											marginTop: "20px",
										}}
										onClick={() => setGenerating(true)}
										disabled={generating}
									>
										Generar reporte
									</button>
									{generating &&
										<ReportCertification
											contentKey={pdfContent}
											curso={curso}
											aprendices={aprentices}
											done={() => {
												generarReporte()
											}}
										/>
									}
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
								</>
							}
						</div>
					</div>
				)}
				{showAprenticeCriteria && (
					<div className="modal-overlay">
						<div
							className="modal-background"
							style={{
								paddingBottom: "20px",
								width: "35%",
								minWidth: "450px",
								maxHeight: "fit-content",
							}}
						>
							<div className="container_return_EditCalendar">
								<h5
									onClick={() =>
										setShowAprenticeCriteria(false)
									}
									style={{ cursor: "pointer" }}
								>
									Volver
								</h5>
								<button
									onClick={() =>
										setShowAprenticeCriteria(false)
									}
									className="closeModal"
								></button>
							</div>
							<h2 className="modal-title-edit-calendar">
								Certificación
							</h2>
							<div className="person-criteria-container">
								<label>Estado: </label>
								<span>{certificationState}</span>
								{certificationState == "aprovado" && (
									<button
										className="button"
										onClick={() => showCert()}
									>
										Ver certificado
									</button>
								)}
								{certificationState == "rechazado" && (
									<>
										<label>Motivo: </label>
										<span>{certificationDenial}</span>
									</>
								)}
							</div>
						</div>
					</div>
				)}
			</Main>
		</>
	);
};
