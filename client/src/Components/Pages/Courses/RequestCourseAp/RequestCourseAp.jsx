import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./RequestCourseAp.css";
import IconDescarga from "../../../../assets/Icons/IconDescarga.png";
import { Header } from "../../../Layouts/Header/Header";
import { Footer } from "../../../Layouts/Footer/Footer";
import { Main } from "../../../Layouts/Main/Main";
import axiosInstance from "../../../../config/axiosInstance";
import html2pdf from "html2pdf.js";

export const RequestCourseAp = () => {
	const navigate = useNavigate()

	const [aprendiz, setAprendiz] = useState(null);

	// Nombre del curso desde la URL o vacío
	const [fechaInicio, setFechaInicio] = useState("");
	const [fechaFin, setFechaFin] = useState("");
	const [isEditing, setIsEditing] = useState(false);
	const [nombreCurso, setNombreCurso] = useState("");

	// Validación de fechas
	const [dateError, setDateError] = useState("");
	const [isExporting, setIsExporting] = useState(false);
	const [exportValues, setExportValues] = useState({
		nombreCurso: "",
		fechaInicio: "",
		fechaFin: "",
	});

	const pdfRef = useRef();

	const userSession =
		JSON.parse(localStorage.getItem("userSession")) ||
		JSON.parse(sessionStorage.getItem("userSession"));
	const isLoggedIn = !!userSession;
	const accountType = userSession?.accountType || null;

	useEffect(() => {
		if (!isLoggedIn || accountType !== "Aprendiz") {
			navigate("/no-autorizado");
		}
	}, []);

	const formatDate = (dateStr) => {
		if (!dateStr) return "";
		const date = new Date(dateStr);
		return date.toLocaleDateString("es-CO", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	// Validación de fechas
	const today = new Date().toISOString().split("T")[0];

	const handleFechaInicioChange = (e) => {
		const value = e.target.value;
		setFechaInicio(value);

		if (value < today) {
			setDateError("La fecha de inicio no puede ser anterior a hoy.");
		} else if (fechaFin && value > fechaFin) {
			setDateError(
				"La fecha de inicio no puede ser posterior a la fecha de fin."
			);
		} else {
			setDateError("");
		}
	};

	const handleFechaFinChange = (e) => {
		const value = e.target.value;
		setFechaFin(value);

		if (fechaInicio && value < fechaInicio) {
			setDateError(
				"La fecha de fin no puede ser anterior a la fecha de inicio."
			);
		} else {
			setDateError("");
		}
	};

	const handleDownloadPDF = () => {
		setExportValues({
			nombreCurso,
			fechaInicio,
			fechaFin,
		});
		setIsExporting(true);
		setTimeout(() => {
			if (pdfRef.current) {
				html2pdf()
					.set({
						margin: 10,
						filename: "solicitud_curso.pdf",
						html2canvas: { scale: 2 },
						jsPDF: {
							unit: "mm",
							format: "a4",
							orientation: "portrait",
						},
					})
					.from(pdfRef.current)
					.save()
					.then(() => setIsExporting(false));
			} else {
				setIsExporting(false);
			}
		}, 100);
	};

	const handleEdit = () => setIsEditing(true);
	const handleSave = () => setIsEditing(false);

	const handleSendRequest = async () => {
		try {
			if (!pdfRef.current) return;

			const opt = {
				margin: 10,
				filename: "solicitud_curso.pdf",
				html2canvas: { scale: 2 },
				jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
			};

			const worker = html2pdf().set(opt).from(pdfRef.current);
			const pdfBlob = (await worker.output)
				? await worker.output("blob")
				: await worker.outputPdf("blob");

			const formData = new FormData();
			formData.append("pdf", pdfBlob, "solicitud_curso.pdf");
			formData.append("nombreCurso", nombreCurso);
			formData.append("fechaInicio", fechaInicio);
			formData.append("fechaFin", fechaFin);
			formData.append("id", aprendiz?.id);
			formData.append("aprendiz", JSON.stringify(aprendiz));

			// 1. Enviar solicitud
			const response = await axiosInstance.post(
				"/api/actas/solicitud-cursoAp",
				formData,
				{
					headers: { "Content-Type": "multipart/form-data" },
				}
			);

			// 2. Crear notificación
			const archivoPDF = response.data?.pdf_acta || "solicitud_curso.pdf";

			await axiosInstance.post("/api/notifications/solicitud-curso", {
				asunto: "Nueva solicitud de curso",
				mensaje: `El aprendiz ${aprendiz?.nombres || ""} ${
					aprendiz?.apellidos || ""
				} ha solicitado un curso complementario.`,
				archivo: archivoPDF,
			});

			alert("¡Solicitud enviada y notificación creada correctamente!");
		} catch (error) {
			alert("Error al enviar la solicitud.");
			console.error(error);
		}
	};

	return (
		<>
			<Header />
			<Main>
				<div className="course-request-container">
					<h1>
						Solicitud de Curso{" "}
						<span className="highlight">Complementario</span>
					</h1>
					<p className="description">
						Este documento permite a un aprendiz formalizar la
						solicitud de un curso ante el SENA. <br />
						Escribe el nombre del curso y las fechas de inicio y fin
						del curso.
					</p>

					<div className="request-card">
						{!isEditing && (
							<img
								className="download-icon"
								src={IconDescarga}
								alt="Icono de descarga"
								style={{ cursor: "pointer" }}
								onClick={handleDownloadPDF}
							/>
						)}

						<div className="letter-content apa-style" ref={pdfRef}>
							<p>
								<b>
									{aprendiz?.nombres || "[Nombre aprendiz]"}{" "}
									{aprendiz?.apellidos || ""}
								</b>
								<br />
								Documento:{" "}
								{aprendiz?.documento || "[Documento]"} <br />
								Teléfono: {aprendiz?.celular ||
									"[Teléfono]"}{" "}
								<br />
								Email: {aprendiz?.email || "[Correo]"} <br />
								Fecha solicitud:{" "}
								{new Date().toLocaleDateString()}
								<br />
								<br />
								Señores
								<br />
								Coordinadores Académicos
								<br />
								SENA Centro Comercio y Turismo
								<br />
								SENA Regional Quindío
								<br />
								Armenia - Quindío
								<br />
								<br />
								Asunto: Solicitud de Curso de formación
								Complementaria
								<br />
								<br />
								Respetados señores:
								<br />
								<br />
								Yo,{" "}
								<b>
									{aprendiz?.nombres} {aprendiz?.apellidos}
								</b>
								, aprendiz interesado en continuar mi proceso de
								formación, me permito solicitar de manera formal
								la apertura del curso complementario en&nbsp;
								{isEditing ? (
									<input
										type="text"
										className="input-solicitud"
										value={nombreCurso}
										onChange={(e) =>
											setNombreCurso(e.target.value)
										}
										placeholder="Nombre del curso"
										style={{ width: 180 }}
										required
									/>
								) : isExporting ? (
									<b>
										{exportValues.nombreCurso ||
											"[Nombre del curso]"}
									</b>
								) : (
									<b>{nombreCurso || "[Nombre del curso]"}</b>
								)}
								, programado para las fechas:&nbsp;
								{isEditing ? (
									<>
										<input
											type="date"
											className="input-solicitud-date"
											value={fechaInicio}
											min={today}
											onChange={handleFechaInicioChange}
											required
										/>
										&nbsp;a&nbsp;
										<input
											type="date"
											className="input-solicitud-date"
											value={fechaFin}
											min={fechaInicio || today}
											onChange={handleFechaFinChange}
											required
										/>
										{dateError && (
											<div
												style={{
													color: "red",
													fontSize: "0.9em",
													marginTop: 4,
												}}
											>
												{dateError}
											</div>
										)}
									</>
								) : isExporting ? (
									<b>
										{`${
											formatDate(
												exportValues.fechaInicio
											) || "[Fecha inicio]"
										} a ${
											formatDate(exportValues.fechaFin) ||
											"[Fecha fin]"
										}`}
									</b>
								) : (
									<b>
										{`${
											formatDate(fechaInicio) ||
											"[Fecha inicio]"
										} a ${
											formatDate(fechaFin) ||
											"[Fecha fin]"
										}`}
									</b>
								)}
								.<br />
								<br />
								Agradezco su atención y la oportunidad de
								fortalecer mis competencias a través de este
								programa.
								<br />
								<br />
								Atentamente,
								<br />
								<br />
								{aprendiz?.nombres} {aprendiz?.apellidos}
								<br />
								Aprendiz
								<br />
								{aprendiz?.celular || "[Teléfono]"}
								<br />
								{aprendiz?.email || "[Correo]"}
							</p>
						</div>
					</div>
					<div className="botones-solicitud">
						{isEditing ? (
							<button
								className="submit-button"
								onClick={handleSave}
								disabled={!!dateError}
							>
								Guardar
							</button>
						) : (
							<button
								className="submit-button"
								onClick={handleEdit}
							>
								Editar
							</button>
						)}

						<button
							className="submit-button"
							onClick={handleSendRequest}
						>
							Enviar Solicitud
						</button>
					</div>
				</div>
			</Main>
			<Footer />
		</>
	);
};
