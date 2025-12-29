import "./SeeCourseCriteria.css";
import { Header } from "../../../Layouts/Header/Header";
import { Main } from "../../../Layouts/Main/Main";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../../config/axiosInstance";
import { PageMover } from "../../../UI/PageMover/PageMover";
import { generarExcelHistorial } from "../../../../utils/Reports/Criterios";
import { ReportCertification } from "../ReportCertification.jsx/ReportCertification";
import { useRef } from "react";
import html2pdf from "html2pdf.js";
import Swal from "sweetalert2";
import 'sweetalert2/themes/bulma.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faFilter,
	faTimes,
	faArrowLeft,
	faDownload,
	faFilePdf,
	faFileExcel,
	faUserGraduate,
	faIdCard,
	faClipboardCheck,
	faChartLine,
	faCheckCircle,
	faClock,
	faTimesCircle,
	faSpinner,
	faUser,
	faFileAlt
} from '@fortawesome/free-solid-svg-icons';

export const SeeCourseCriteria = () => {
	const navigate = useNavigate();
	const { id } = useParams();

	const [showFilters, setShowFilters] = useState(false);
	const [showingDownloadOptions, setShowingDownloadingOptions] = useState(false);
	const [showAprenticeCriteria, setShowAprenticeCriteria] = useState(false);
	const [doneGenerating, setDoneGenerating] = useState(false);
	const [generating, setGenerating] = useState(false);
	const [reportContent, setReportContent] = useState(false);

	const [curso, setCurso] = useState();
	const [aprentices, setAprentices] = useState([]);
	const [aprenticeName, setAprenticeName] = useState("");
	const [aprenticeStatus, setAprenticeStatus] = useState(0);
	const [personId, setPersonId] = useState("");
	const [reportType, setReportType] = useState("pdf");
	const [page, setPage] = useState(0);
	const [pages, setPages] = useState(1);
	const [selectedAprentice, setSelectedAprentice] = useState();
	const [aprenticeCriteria, setAprenticeCriteria] = useState([]);
	const [certificationStatus, setCertificationStatus] = useState("pendiente");
	const [certificationDenialReason, setCertificationDenialStatus] = useState("");
	const [loading, setLoading] = useState(false);

	const pdfContent = useRef();

	async function fetchCourse() {
		try {
			const response = await axiosInstance.get(`api/courses/cursos/${id}`);
			setCurso(response.data);
		} catch (error) {
			console.error("Error al obtener el curso:", error);
		}
	}

	async function fetchAprentices() {
		try {
			setLoading(true);
			const response = await axiosInstance.get(
				`/api/courses/cursos/${id}/participants?page=${page}${aprenticeName?.length > 0 ? `&name=${aprenticeName}` : ""
				}${personId?.length > 0 ? `&doc=${personId}` : ""}${aprenticeStatus != 0
					? aprenticeStatus == 1
						? `&state=activo`
						: `&state=inactivo`
					: ""
				}`
			);
			if (!response.data.success) throw response.data;

			const participants = response.data.participants.map((aprentice) => {
				return {
					name: `${aprentice.aprendiz.nombres} ${aprentice.aprendiz.apellidos}`,
					personId: aprentice.aprendiz.documento,
					state: aprentice.aprendiz.estado,
					certState: aprentice.estado_certificacion,
					id: aprentice.aprendiz.ID,
				};
			});

			setAprentices(participants);
			setPages(response.data.pages);
		} catch (error) {
			console.error(error);
			Swal.fire({
				icon: "error",
				title: "Error al consultar",
				text: "Ocurrió un error al consultar los aprendices del curso.",
				confirmButtonText: "Okay",
				theme: "bulma",
				customClass: {
					confirmButton: 'centered-swal-button'
				}
			});
		} finally {
			setLoading(false);
		}
	}

	function selectStatus(s) {
		if (aprenticeStatus == s) setAprenticeStatus(0);
		else setAprenticeStatus(s);
	}

	async function fetchAprenticeCriteria(user) {
		try {
			const resp = await axiosInstance.get(
				`/api/certification/course/${id}/aprendiz/${user.id}`
			);
			setAprenticeCriteria(resp.data.criteria);
			setCertificationStatus(resp.data.certification_status);
			setCertificationDenialStatus(resp.data.denial_justification);
		} catch (error) {
			console.error(error);
			Swal.fire({
				icon: "error",
				title: "Error al consultar",
				text: "Ocurrió un error al consultar los resultados de los criterios",
				confirmButtonText: "Okay",
				theme: "bulma",
				customClass: {
					confirmButton: 'centered-swal-button'
				}
			});
			setShowAprenticeCriteria(false);
		}
	}

	function selectAprentice(aprenticeId) {
		setCertificationDenialStatus("");
		setSelectedAprentice(aprenticeId);
		setShowAprenticeCriteria(true);
		fetchAprenticeCriteria(aprenticeId);
	}

	async function saveChanges() {
		if (certificationStatus == "rechazado" && certificationDenialReason.length < 10) {
			Swal.fire({
				icon: "info",
				title: "Escriba motivo de rechazo",
				text: "Se debe escribir el motivo por el cual no se aprobó la certificación (mínimo 10 caracteres)",
				confirmButtonText: "Okay",
				theme: "bulma",
				customClass: {
					confirmButton: 'centered-swal-button'
				}
			});
			return;
		}

		try {
			const resp = await axiosInstance.put(
				`/api/certification/course/${id}/update/${selectedAprentice.id}`,
				{
					state: certificationStatus,
					justification: certificationDenialReason,
				}
			);

			Swal.fire({
				icon: "success",
				title: "¡Éxito!",
				text: "Se ha actualizado el estado de la certificación del aprendiz",
				confirmButtonColor: "rgba(5, 172, 28, 1)",
				timer: 3000,
				timerProgressBar: true,
				theme: "bulma",
				customClass: {
					confirmButton: 'centered-swal-button'
				}
			});

			// Actualizar la lista de aprendices
			fetchAprentices();
			setShowAprenticeCriteria(false);
		} catch (error) {
			console.error(error);
			Swal.fire({
				icon: "error",
				title: "Error al actualizar",
				text: "Ocurrió un error al actualizar el estado de la certificación",
				confirmButtonText: "Okay",
				theme: "bulma",
				customClass: {
					confirmButton: 'centered-swal-button'
				}
			});
		}
	}

	async function filter() {
		await fetchAprentices();
		setShowFilters(false);
	}

	async function generateCert() {
		Swal.fire({
			icon: "info",
			title: "Sin implementar",
			text: "Aún no implementado",
			theme: "bulma",
			customClass: {
				confirmButton: 'centered-swal-button'
			}
		});
	}

	const userSession =
		JSON.parse(localStorage.getItem("userSession")) ||
		JSON.parse(sessionStorage.getItem("userSession"));
	const isLoggedIn = !!userSession;
	const accountType = userSession?.accountType || null;

	useEffect(() => {
		if (isLoggedIn && (accountType === "Instructor" || accountType == "Administrador" || accountType === "Gestor")) {
			fetchCourse();
			fetchAprentices();
		} else {
			navigate("/no-autorizado");
		}
	}, [id]);

	useEffect(() => {
		if (isLoggedIn && (accountType === "Instructor" || accountType == "Administrador" || accountType === "Gestor")) {
			fetchAprentices();
		}
	}, [page]);

	const generarPdf = async () => {
		setGenerating(true);
	};

	const generarReporte = async () => {
		try {
			if (reportType === "pdf") {
				if (!pdfContent.current) return;

				const worker = html2pdf().set({
					margin: 10,
					filename: "reporte_certificaciones.pdf",
					html2canvas: { scale: 2 },
					jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
				}).from(pdfContent.current);

				const blob = await worker.output("blob");
				const blobUrl = URL.createObjectURL(blob);

				setGenerating(false);
				setDoneGenerating(true);
				setReportContent(blobUrl);

				// Auto-descarga
				const a = document.createElement('a');
				a.href = blobUrl;
				a.download = "reporte_certificaciones.pdf";
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);

				Swal.fire({
					icon: "success",
					title: "¡Reporte generado!",
					text: "El reporte se ha descargado exitosamente",
					confirmButtonText: "Excelente",
					theme: "bulma"
				});

				setShowingDownloadingOptions(false);
			}
		} catch (error) {
			console.log(error);
			Swal.fire({
				icon: "error",
				title: "Error al generar el reporte",
				text: "Ocurrió un error al generar el reporte, inténtelo otra vez",
				theme: "bulma"
			});
			setDoneGenerating(false);
			setGenerating(false);
		}
	};

	const clearFilters = () => {
		setAprenticeName("");
		setPersonId("");
		setAprenticeStatus(0);
	};

	const getStatusClass = (status) => {
		return status.toLowerCase();
	};

	const getCertIcon = (certState) => {
		switch (certState?.toLowerCase()) {
			case 'aprovado': return <FontAwesomeIcon icon={faCheckCircle} className="approved-icon" />;
			case 'pendiente': return <FontAwesomeIcon icon={faClock} className="pending-icon" />;
			case 'rechazado': return <FontAwesomeIcon icon={faTimesCircle} className="rejected-icon" />;
			default: return null;
		}
	};

	return (
		<>
			<Header />
			<Main>
				<div className="container-see-criteria">
					<h2>
						Criterios de{" "}
						<span className="complementary">Certificación</span>
					</h2>

					<div className="buttons-container">
						<button
							className="button see-criteria-button"
							onClick={() => navigate(`/Gestiones/Criterios/Curso/${id}`)}
						>
							<FontAwesomeIcon icon={faClipboardCheck} />
							<span>Ver criterios del curso</span>
						</button>
						<button
							className="button criteria-aprentice-filter-dropdown"
							onClick={() => setShowFilters(!showFilters)}
						>
							<FontAwesomeIcon icon={faFilter} />
							<span>Filtro {showFilters ? "▲" : "▼"}</span>
						</button>
					</div>

					{showFilters && (
						<div className="options_Search search-aprentice">
							<div className="filter-group">
								<label>
									<FontAwesomeIcon icon={faUserGraduate} />
									<span>Aprendiz:</span>
								</label>
								<input
									type="text"
									className="search-input"
									placeholder="Nombre del aprendiz..."
									value={aprenticeName}
									onChange={(e) => setAprenticeName(e.target.value)}
								/>
							</div>

							<div className="filter-group">
								<label>
									<FontAwesomeIcon icon={faIdCard} />
									<span>Documento:</span>
								</label>
								<input
									type="text"
									className="search-input"
									placeholder="Número de documento..."
									value={personId}
									onChange={(e) => setPersonId(e.target.value)}
								/>
							</div>

							<div className="filter-group">
								<label>
									<FontAwesomeIcon icon={faChartLine} />
									<span>Estado:</span>
								</label>
								<div className="statusButtons">
									<button
										className={`status-btn ${aprenticeStatus == 1 ? "selected" : ""}`}
										onClick={() => selectStatus(1)}
									>
										Activo
									</button>
									<button
										className={`status-btn ${aprenticeStatus == -1 ? "selected" : ""}`}
										onClick={() => selectStatus(-1)}
									>
										Inactivo
									</button>
								</div>
							</div>

							<div className="filter-group">
								<button
									className="button"
									onClick={filter}
									disabled={loading}
								>
									{loading ? (
										<>
											<FontAwesomeIcon icon={faSpinner} className="spinner" />
											<span>Filtrando...</span>
										</>
									) : (
										<>
											<FontAwesomeIcon icon={faFilter} />
											<span>Aplicar filtros</span>
										</>
									)}
								</button>
							</div>
						</div>
					)}

					<div className="aprentice-list-container">
						<div className="aprentice-list-header">
							<span>Aprendiz</span>
							<span>Documento</span>
							<span>Estado</span>
							<span>Certificación</span>
							<span>Acciones</span>
						</div>

						{aprentices.length > 0 ? (
							aprentices.map((a, i) => (
								<div
									key={i}
									className="aprentice-list"
								>
									<span data-label="Aprendiz">
										<FontAwesomeIcon icon={faUserGraduate} />
										{a.name}
									</span>
									<span data-label="Documento">{a.personId}</span>
									<span data-label="Estado" className={`status-${getStatusClass(a.state)}`}>
										{a.state}
									</span>
									<span data-label="Certificación" className={`cert-${getStatusClass(a.certState)}`}>
										{getCertIcon(a.certState)}
										{a.certState}
									</span>
									<button onClick={() => selectAprentice(a)}>
										<FontAwesomeIcon icon={faClipboardCheck} />
										<span>Ver Estado de Certificación</span>
									</button>
								</div>
							))
						) : (
							<div className="no-aprentices-list">
								{loading ? (
									<>
										<FontAwesomeIcon icon={faSpinner} className="spinner" />
										<span>Cargando aprendices...</span>
									</>
								) : (
									"El curso aún no tiene aprendices asignados"
								)}
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
						className="button end-button"
						onClick={() => setShowingDownloadingOptions(true)}
						disabled={aprentices.length === 0}
					>
						<FontAwesomeIcon icon={faDownload} />
						<span>Generar reporte</span>
					</button>
				</div>

				{/* Modal de selección de reporte - Estilo igual al ejemplo */}
				{showingDownloadOptions && (
					<div className="modal-overlay-reports">
						<div className="modal-container-reports">
							<div className="modal-header-reports">
								<div className="header-content-reports">
									<h2>
										<FontAwesomeIcon icon={faFileAlt} className="header-icon-reports" />
										Tipo de Reporte
									</h2>
									<button 
										type="button" 
										onClick={() => setShowingDownloadingOptions(false)}
										className="close-btn-reports"
									>
										<FontAwesomeIcon icon={faArrowLeft} />
										<span>Volver</span>
									</button>
								</div>
							</div>

							<div className="modal-body-reports">
								<div className="modal-content-reports">
									<div className="form-section-reports">
										<div className="report-type-selector">
											<div className="status-buttons-reports">
												<button
													className={`status-btn-reports ${reportType === "pdf" ? "active" : ""}`}
													onClick={() => setReportType("pdf")}
												>
													<FontAwesomeIcon icon={faFilePdf} />
													<span>PDF</span>
												</button>
												<button
													className={`status-btn-reports ${reportType === "excel" ? "active" : ""}`}
													onClick={() => setReportType("excel")}
												>
													<FontAwesomeIcon icon={faFileExcel} />
													<span>Excel</span>
												</button>
											</div>

											<div className="report-actions">
												{reportType === "excel" ? (
													<button
														type="button"
														className="submit-btn-reports"
														onClick={() => generarExcelHistorial(aprentices, curso, id, () => setShowingDownloadingOptions(false))}
													>
														<FontAwesomeIcon icon={faDownload} />
														<span>Descargar Reporte Excel</span>
													</button>
												) : (
													<>
														<button
															type="button"
															className="submit-btn-reports"
															onClick={generarPdf}
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
																className="submit-btn-reports secondary"
																href={reportContent}
																target="_blank"
																rel="noopener noreferrer"
																download="reporte_certificaciones.pdf"
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

				{/* Modal de criterios del aprendiz - CORREGIDO CON 2 COLUMNAS */}
				{showAprenticeCriteria && selectedAprentice && (
					<div className="modal-overlay-criteria">
						<div className="modal-container-criteria">
							<div className="modal-header-criteria">
								<div className="header-content-criteria">
									<h2>
										<FontAwesomeIcon icon={faClipboardCheck} className="header-icon-criteria" />
										Estado de Certificación del Aprendiz 
									</h2>
									<button 
										type="button" 
										onClick={() => setShowAprenticeCriteria(false)}
										className="close-btn-criteria"
									>
										<FontAwesomeIcon icon={faArrowLeft} />
										<span>Volver</span>
									</button>
								</div>
							</div>

							<form className="modal-body-criteria" onSubmit={(e) => { e.preventDefault(); saveChanges(); }}>
								<div className="see-modal-content-criteria">
									{/* Columna izquierda - Información del aprendiz y criterios */}
									<div className="learner-info-column">
										<div className="learner-info-section">
											<h3 className="section-title-criteria">
												<FontAwesomeIcon icon={faUserGraduate} />
												Información del Aprendiz
											</h3>
											<div className="form-grid-criteria">
												<div className="input-group-criteria">
													<label className="input-label-criteria">
														<FontAwesomeIcon icon={faUser} />
														Nombre Completo
													</label>
													<div className="display-field-criteria">
														{selectedAprentice.name}
													</div>
												</div>

												<div className="input-group-criteria">
													<label className="input-label-criteria">
														<FontAwesomeIcon icon={faIdCard} />
														Documento
													</label>
													<div className="display-field-criteria">
														{selectedAprentice.personId}
													</div>
												</div>
											</div>
										</div>

										<div className="learner-info-section">
											<h3 className="section-title-criteria">
												<FontAwesomeIcon icon={faClipboardCheck} />
												Criterios de Evaluación
											</h3>
											<div className="criteria-list">
												{aprenticeCriteria.map((criteria, index) => (
													<div key={index} className="criteria-item-criteria">
														<div className="criteria-info">
															<span className="criteria-title">{criteria.title}</span>
															{criteria.has_value && (
																<div className="criteria-value-criteria">
																	<span className="current-value">{criteria.value || 0}</span>
																	<span className="separator">/</span>
																	<span className="required-value">{criteria.min}</span>
																</div>
															)}
														</div>
														{!criteria.has_value && (
															<div className="criteria-status">
																<span className={`status-indicator ${criteria.approved ? 'approved' : 'pending'}`}>
																	{criteria.approved ? '✓ Cumple' : '✗ No cumple'}
																</span>
															</div>
														)}
													</div>
												))}
											</div>
										</div>
									</div>

									{/* Columna derecha - Estado de certificación */}
									<div className="certification-column">
										<div className="certification-section">
											<h3 className="section-title-criteria">
												<FontAwesomeIcon icon={faCheckCircle} />
												Estado de Certificación
											</h3>
											
											<div className="certification-status-criteria">
												<div className="status-buttons-criteria">
													{["aprobado", "pendiente", "rechazado"].map((estado) => {
														const isSelected = certificationStatus?.toLowerCase() === estado.toLowerCase();
														const icon = estado === "aprobado" ? faCheckCircle : 
															estado === "pendiente" ? faClock : 
															faTimesCircle;
														return (
															<button
																key={estado}
																type="button"
																className={`status-btn-criteria ${isSelected ? "active" : ""} ${estado}`}
																onClick={() => setCertificationStatus(estado)}
															>
																<FontAwesomeIcon icon={icon} />
																<span className="status-text">
																	{estado.charAt(0).toUpperCase() + estado.slice(1)}
																</span>
															</button>
														);
													})}
												</div>
											</div>

											{certificationStatus === "rechazado" && (
												<div className="rejection-reason-criteria">
													<label className="input-label-criteria">
														Motivo del Rechazo:
													</label>
													<textarea
														className="reason-textarea-criteria"
														placeholder="Escriba la razón por la que se rechazó la certificación (mínimo 10 caracteres)..."
														value={certificationDenialReason}
														onChange={(e) => setCertificationDenialStatus(e.target.value)}
														rows="4"
													/>
												</div>
											)}

											<div className="action-buttons-criteria">
												<button type="submit" className="submit-btn-criteria primary">
													<FontAwesomeIcon icon={faCheckCircle} />
													<span>
														{certificationStatus === "aprovado"
															? "Certificar Aprendiz"
															: "Guardar Cambios"}
													</span>
												</button>

												{certificationStatus === "aprovado" && (
													<button
														type="button"
														className="submit-btn-criteria secondary"
														onClick={generateCert}
													>
														<FontAwesomeIcon icon={faDownload} />
														<span>Generar Certificado</span>
													</button>
												)}
											</div>
										</div>
									</div>
								</div>
							</form>
						</div>
					</div>
				)}
			</Main>
		</>
	);
};