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
import 'sweetalert2/themes/bulma.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faFilter,
	faArrowLeft,
	faDownload,
	faFilePdf,
	faFileExcel,
	faUserGraduate,
	faIdCard,
	faClipboardCheck,
	faFileAlt,
	faCheckCircle,
	faClock,
	faTimesCircle,
	faSpinner,
	faEye
} from '@fortawesome/free-solid-svg-icons';

export const SeeCertificationHistorial = () => {
	const navigate = useNavigate();
	const { id } = useParams();

	const [showFilters, setShowFilters] = useState(false);
	const [filterName, setFilterName] = useState("");
	const [filterId, setFilterId] = useState("");
	const [showingDownloadOptions, setShowingDownloadingOptions] = useState(false);
	const [curso, setCurso] = useState();
	const [aprentices, setAprentices] = useState([]);
	const [reportType, setReportType] = useState("pdf");
	const [page, setPage] = useState(0);
	const [pages, setPages] = useState(1);
	const [showAprenticeCriteria, setShowAprenticeCriteria] = useState(false);
	const [certificationState, setCertificationState] = useState("");
	const [certificationDenial, setCertificationDenial] = useState("");
	const [doneGenerating, setDoneGenerating] = useState(false);
	const [generating, setGenerating] = useState(false);
	const [reportContent, setReportContent] = useState(false);
	const [selectedAprentice, setSelectedAprentice] = useState(null);

	const pdfContent = useRef();

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
				theme: "bulma",
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
				theme: "bulma",
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
			fetchCourse();
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

	function selectAprentice(aprentice) {
		setSelectedAprentice(aprentice);
		setShowAprenticeCriteria(true);
		fetchAprenticeCriteria(aprentice);
	}

	function showCert() {
		Swal.fire({
			icon: 'info',
			title: 'Funcionalidad en desarrollo',
			text: 'La visualización de certificados estará disponible próximamente',
			confirmButtonText: 'Aceptar',
			confirmButtonColor: '#3085d6',
			theme: "bulma",
			customClass: {
				confirmButton: 'centered-swal-button'
			}
		});
	}

	const generarReporte = async () => {
		try {
			if (reportType === "pdf") {
				if (!pdfContent.current) return;
				
				const worker = html2pdf().set({
					margin: 10,
					filename: "reporte_cursos.pdf",
					html2canvas: { scale: 2 },
					jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
				}).from(pdfContent.current);
				
				setGenerating(false);
				setDoneGenerating(true);
				setReportContent(await worker.output("bloburl"));
			}
		} catch (error) {
			console.log(error);
			Swal.fire({
				icon: "error",
				title: "Error en reporte",
				text: "Ocurrió un error al generar el reporte",
				theme: "bulma",
				customClass: {
					confirmButton: 'centered-swal-button'
				}
			});
			setDoneGenerating(false);
			setGenerating(false);
		}
	};

	const getCertIcon = (certState) => {
		switch (certState?.toLowerCase()) {
			case 'aprovado': return <FontAwesomeIcon icon={faCheckCircle} className="approved-icon" />;
			case 'pendiente': return <FontAwesomeIcon icon={faClock} className="pending-icon" />;
			case 'rechazado': return <FontAwesomeIcon icon={faTimesCircle} className="rejected-icon" />;
			default: return null;
		}
	};

	const getStatusClass = (status) => {
		return status.toLowerCase();
	};

	return (
		<>
			<Header />
			<GoBackArrow />
			<Main>
				<div className="container-certification-historial">
					<h2>
						Historial de{" "}
						<span className="complementary">Certificación</span>
					</h2>

					<div className="buttons-container-historial">
						<button
							className="button filter-button-historial"
							onClick={() => setShowFilters(!showFilters)}
						>
							<FontAwesomeIcon icon={faFilter} />
							<span>Filtro {showFilters ? "▲" : "▼"}</span>
						</button>
					</div>

					{showFilters && (
						<div className="options_Search search-historial">
							<div className="filter-group-historial">
								<label>
									<FontAwesomeIcon icon={faUserGraduate} />
									<span>Aprendiz:</span>
								</label>
								<input
									type="text"
									className="search-input"
									placeholder="Nombre del aprendiz..."
									value={filterName}
									onChange={(e) => setFilterName(e.target.value)}
								/>
							</div>

							<div className="filter-group-historial">
								<label>
									<FontAwesomeIcon icon={faIdCard} />
									<span>Documento:</span>
								</label>
								<input
									type="text"
									className="search-input"
									placeholder="Número de documento..."
									value={filterId}
									onChange={(e) => setFilterId(e.target.value)}
								/>
							</div>

							<div className="filter-group-historial">
								<button
									className="button"
									onClick={filter}
								>
									<FontAwesomeIcon icon={faFilter} />
									<span>Aplicar filtros</span>
								</button>
							</div>
						</div>
					)}

					<div className="historial-list-container">
						<div className="historial-list-header">
							<span>Aprendiz</span>
							<span>Documento</span>
							<span>Estado de Certificación</span>
							<span>Acciones</span>
						</div>

						{aprentices.length > 0 ? (
							aprentices.map((a, i) => (
								<div
									key={i}
									className="historial-list-item"
								>
									<span data-label="Aprendiz">
										<FontAwesomeIcon icon={faUserGraduate} />
										{a.name}
									</span>
									<span data-label="Documento">{a.personId}</span>
									<span 
										data-label="Certificación" 
										className={`cert-status-${getStatusClass(a.certState)}`}
									>
										{getCertIcon(a.certState)}
										{a.certState}
									</span>
									<button 
										className="view-criteria-btn"
										onClick={() => selectAprentice(a)}
									>
										<FontAwesomeIcon icon={faClipboardCheck} />
										<span>Ver Detalles</span>
									</button>
								</div>
							))
						) : (
							<div className="no-historial-list">
								<FontAwesomeIcon icon={faUserGraduate} />
								<span>Aún no hay aprendices certificados</span>
							</div>
						)}
					</div>

					{aprentices.length > 0 && (
						<PageMover
							value={page + 1}
							max={pages}
							next={() => setPage(page + 1)}
							prev={() => setPage(page - 1)}
						/>
					)}

					<button
						className="button generate-report-btn-historial"
						onClick={() => setShowingDownloadingOptions(true)}
						disabled={aprentices.length === 0}
					>
						<FontAwesomeIcon icon={faDownload} />
						<span>Generar Reporte</span>
					</button>
				</div>

				{/* Modal de selección de reporte */}
				{showingDownloadOptions && (
					<div className="modal-overlay-historial-reports">
						<div className="modal-container-historial-reports">
							<div className="modal-header-historial-reports">
								<div className="header-content-historial-reports">
									<h2>
										<FontAwesomeIcon icon={faFileAlt} className="header-icon-historial-reports" />
										Tipo de Reporte
									</h2>
									<button 
										type="button" 
										onClick={() => setShowingDownloadingOptions(false)}
										className="close-btn-historial-reports"
									>
										<FontAwesomeIcon icon={faArrowLeft} />
										<span>Volver</span>
									</button>
								</div>
							</div>

							<div className="modal-body-historial-reports">
								<div className="modal-content-historial-reports">
									<div className="form-section-historial-reports">
										<div className="report-type-selector-historial">
											<div className="status-buttons-historial-reports">
												<button
													className={`status-btn-historial-reports ${reportType === "pdf" ? "active" : ""}`}
													onClick={() => setReportType("pdf")}
												>
													<FontAwesomeIcon icon={faFilePdf} />
													<span>PDF</span>
												</button>
												<button
													className={`status-btn-historial-reports ${reportType === "excel" ? "active" : ""}`}
													onClick={() => setReportType("excel")}
												>
													<FontAwesomeIcon icon={faFileExcel} />
													<span>Excel</span>
												</button>
											</div>

											<div className="report-actions-historial">
												{reportType === "excel" ? (
													<button
														type="button"
														className="submit-btn-historial-reports"
														onClick={() => generarExcelHistorial(aprentices, curso, id, () => setShowingDownloadingOptions(false))}
													>
														<FontAwesomeIcon icon={faDownload} />
														<span>Descargar Reporte Excel</span>
													</button>
												) : (
													<>
														<button
															type="button"
															className="submit-btn-historial-reports"
															onClick={() => setGenerating(true)}
															disabled={generating}
														>
															{generating ? (
																<>
																	<FontAwesomeIcon icon={faSpinner} className="spinner" spin />
																	<span>Generando PDF...</span>
																</>
															) : (
																<>
																	<FontAwesomeIcon icon={faFilePdf} />
																	<span>Generar Reporte PDF</span>
																</>
															)}
														</button>

														{generating && (
															<ReportCertification
																contentKey={pdfContent}
																curso={curso}
																aprendices={aprentices}
																done={generarReporte}
															/>
														)}

														{doneGenerating && (
															<a
																className="submit-btn-historial-reports secondary"
																href={reportContent}
																target="_blank"
																rel="noopener noreferrer"
																download="historial_certificaciones.pdf"
															>
																<FontAwesomeIcon icon={faDownload} />
																<span>Descargar PDF Generado</span>
															</a>
														)}
													</>
												)}
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Modal de detalles de certificación */}
				{showAprenticeCriteria && selectedAprentice && (
					<div className="modal-overlay-historial-details">
						<div className="modal-container-historial-details">
							<div className="modal-header-historial-details">
								<div className="header-content-historial-details">
									<h2>
										<FontAwesomeIcon icon={faClipboardCheck} className="header-icon-historial-details" />
										Detalles de Certificación
									</h2>
									<button 
										type="button" 
										onClick={() => setShowAprenticeCriteria(false)}
										className="close-btn-historial-details"
									>
										<FontAwesomeIcon icon={faArrowLeft} />
										<span>Volver</span>
									</button>
								</div>
							</div>

							<div className="modal-body-historial-details">
								<div className="modal-content-historial-details">
									<div className="info-column-historial-details">
										<div className="form-section-historial-details">
											<h3 className="section-title-historial-details">
												<FontAwesomeIcon icon={faUserGraduate} />
												Información del Aprendiz
											</h3>
											<div className="form-grid-historial-details">
												<div className="input-group-historial-details">
													<label className="input-label-historial-details">
														<FontAwesomeIcon icon={faUserGraduate} />
														Nombre Completo
													</label>
													<div className="display-field-historial-details">
														{selectedAprentice.name}
													</div>
												</div>

												<div className="input-group-historial-details">
													<label className="input-label-historial-details">
														<FontAwesomeIcon icon={faIdCard} />
														Documento
													</label>
													<div className="display-field-historial-details">
														{selectedAprentice.personId}
													</div>
												</div>
											</div>
										</div>
									</div>

									<div className="action-column-historial-details">
										<div className="form-section-historial-details">
											<h3 className="section-title-historial-details">
												<FontAwesomeIcon icon={faCheckCircle} />
												Estado de Certificación
											</h3>
											
											<div className="certification-info-historial">
												<div className={`status-display-historial ${getStatusClass(certificationState)}`}>
													{getCertIcon(certificationState)}
													<span className="status-text-historial">
														{certificationState?.charAt(0).toUpperCase() + certificationState?.slice(1)}
													</span>
												</div>

												{certificationState === "aprovado" && (
													<button
														type="button"
														className="submit-btn-historial-details primary"
														onClick={showCert}
													>
														<FontAwesomeIcon icon={faEye} />
														<span>Ver Certificado</span>
													</button>
												)}

												{certificationState === "rechazado" && certificationDenial && (
													<div className="rejection-reason-historial">
														<label className="input-label-historial-details">
															Motivo del Rechazo:
														</label>
														<div className="denial-text-historial">
															{certificationDenial}
														</div>
													</div>
												)}
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</Main>
		</>
	);
};