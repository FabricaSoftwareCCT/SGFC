import React, { useEffect, useRef, useState } from "react";
import "./UpdateCourse.css";
import { Header } from "../../../Layouts/Header/Header";
import { Footer } from "../../../Layouts/Footer/Footer";
import { Main } from "../../../Layouts/Main/Main";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../../../config/axiosInstance";
import addIMG from "../../../../assets/Icons/addImg.png";
import EditCalendar from "../../../UI/Modal_Calendar/EditCalendar/EditCalendar";
import calendar from '../../../../assets/Icons/calendar.png';
import debounce from "lodash.debounce";
import buttonEdit from '../../../../assets/Icons/buttonEdit.png';
import { useModal } from "../../../../Context/ModalContext";
import { AssignInstructorCourse } from "../AssignInstructorCourse/AssignInstructorCourse";

export const UpdateCourse = () => {
	const navigate = useNavigate();
	const { id } = useParams();
	const [curso, setCurso] = useState(null);
	const [preview, setPreview] = useState(null);
	const fileInputRef = useRef(null);
	const [isEditCalendarOpen, setIsEditCalendarOpen] = useState(false);
	const [calendarData, setCalendarData] = useState({
		startDate: "",
		endDate: "",
		selectedSlots: [],
	});

	const { showAssignModal, setShowAssignModal } = useModal();

	// Estado para búsqueda y selección de empresa
	const [empresaNIT, setEmpresaNIT] = useState("");
	const [resultadosEmpresa, setResultadosEmpresa] = useState([]);
	const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
	const [showResultados, setShowResultados] = useState(false);

	// Estado para la duración del curso
	const [duracionCurso, setDuracionCurso] = useState(0);

	// Estado para el lugar de formación
	const [lugarFormacion, setLugarFormacion] = useState("");

	// Estado para el temario
	const [temario, setTemario] = useState([]);
	const [nuevaFecha, setNuevaFecha] = useState("");
	const [nuevoTema, setNuevoTema] = useState("");

	useEffect(() => {
		const fetchCurso = async () => {
			try {
				const response = await axiosInstance.get(`/api/courses/cursos/${id}`);
				// Normaliza tipo_oferta
				const tipoOfertaNormalizado = response.data.tipo_oferta
					? response.data.tipo_oferta.charAt(0).toUpperCase() + response.data.tipo_oferta.slice(1).toLowerCase()
					: "";

				setCurso({
					...response.data,
					tipo_oferta: tipoOfertaNormalizado,
					empresa_ID: response.data.empresa_ID,
				});

				// Imagen base64:
				if (response.data.imagen) {
					setPreview(`data:image/png;base64,${response.data.imagen}`);
				}

				// Si el curso tiene duración guardada, cargarla
				if (response.data.duracion_dias) {
					setDuracionCurso(response.data.duracion_dias);
				}

				// Cargar lugar de formación
				setLugarFormacion(response.data.lugar_formacion || "");

				setCalendarData({
					startDate: response.data.fecha_inicio?.split("T")[0] || "",
					endDate: response.data.fecha_fin?.split("T")[0] || "",
					selectedSlots: response.data.slots_formacion
						? JSON.parse(response.data.slots_formacion)
						: [],
				});

				// Cargar temario existente
				if (response.data.temario) {
					try {
						const temarioParseado = JSON.parse(response.data.temario);
						setTemario(temarioParseado);
					} catch (error) {
						console.error("Error al parsear el temario:", error);
						setTemario([]);
					}
				}

				// Si el curso ya tiene empresa asignada y es cerrada, selecciona la empresa por ID
				if (tipoOfertaNormalizado === "Cerrada" && response.data.empresa_ID) {
					try {
						const empresaResp = await axiosInstance.get(`/api/users/empresa/id/${response.data.empresa_ID}`);
						setEmpresaSeleccionada(empresaResp.data);
						setEmpresaNIT('');
					} catch {
						setEmpresaSeleccionada(null);
					}
				}
			} catch (error) {
				console.error("Error al obtener el curso:", error);
			}
		};

		fetchCurso();
	}, [id]);

	const handleCalendarSave = (data) => {
		setCalendarData(data);
		setIsEditCalendarOpen(false);
	};

	// Funciones para el temario
	const agregarTema = () => {
		if (nuevaFecha && nuevoTema.trim()) {
			const nuevoTemaObj = {
				fecha: nuevaFecha,
				tema: nuevoTema.trim()
			};
			setTemario([...temario, nuevoTemaObj]);
			setNuevaFecha("");
			setNuevoTema("");
		}
	};

	const eliminarTema = (index) => {
		const nuevoTemario = [...temario];
		nuevoTemario.splice(index, 1);
		setTemario(nuevoTemario);
	};

	const handleKeyPress = (e) => {
		if (e.key === 'Enter') {
			agregarTema();
		}
	};

	const handleUpdateCourse = async () => {
		try {
			if (curso.tipo_oferta === "Cerrada" && !empresaSeleccionada) {
				alert("Por favor selecciona una empresa válida.");
				return;
			}

			if (!lugarFormacion.trim()) {
				alert("Por favor ingresa el lugar de formación del curso.");
				return;
			}

			const slotsByDay = {};
			calendarData.selectedSlots.forEach(slot => {
				const [dia, hora] = slot.split("-");
				if (!slotsByDay[dia]) slotsByDay[dia] = [];
				slotsByDay[dia].push(hora);
			});

			let horaInicio = "23:59";
			let horaFin = "00:00";
			Object.values(slotsByDay).flat().forEach(hora => {
				if (hora < horaInicio) horaInicio = hora;
				if (hora > horaFin) horaFin = hora;
			});

			const diasMapping = {
				Lun: "Lunes",
				Mar: "Martes",
				Mié: "Miércoles",
				Jue: "Jueves",
				Vie: "Viernes",
				Sáb: "Sábado",
			};
			const diasSemana = Object.keys(slotsByDay).map(dia => diasMapping[dia] || dia);

			const updatedCurso = {
				ficha: curso.ficha,
				nombre_curso: curso.nombre_curso,
				descripcion: curso.descripcion,
				tipo_oferta: curso.tipo_oferta,
				estado: curso.estado,
				fecha_inicio: calendarData.startDate,
				fecha_fin: calendarData.endDate,
				hora_inicio: horaInicio,
				hora_fin: horaFin,
				dias_formacion: JSON.stringify(diasSemana),
				lugar_formacion: lugarFormacion,
				slots_formacion: JSON.stringify(calendarData.selectedSlots),
				duracion_dias: duracionCurso,
				temario: JSON.stringify(temario),
				empresa_ID:
					curso.tipo_oferta === "Cerrada"
						? empresaSeleccionada?.ID || curso.empresa_ID
						: null,
			};

			const response = await axiosInstance.put(`/api/courses/cursos/${id}`, updatedCurso, {
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (response.status === 200) {
				alert("Curso actualizado con éxito");
				navigate(`/Cursos/${id}`);
			} else {
				alert("Ocurrió un error al actualizar el curso");
			}
		} catch (error) {
			console.error("Error al actualizar el curso:", error);
			alert("Ocurrió un error al actualizar el curso");
		}
	};

	// Buscar empresa por NIT
	const buscarEmpresaPorNIT = async (nit) => {
		if (!nit.trim()) {
			setResultadosEmpresa([]);
			return;
		}
		try {
			const response = await axiosInstance.get(`/api/users/empresa/${nit}`);
			setResultadosEmpresa([response.data]);
			setShowResultados(true);
		} catch {
			setResultadosEmpresa([]);
			setShowResultados(false);
		}
	};

	const debouncedBuscarEmpresa = useRef(debounce(buscarEmpresaPorNIT, 500)).current;

	useEffect(() => {
		debouncedBuscarEmpresa(empresaNIT);
		return () => debouncedBuscarEmpresa.cancel();
	}, [empresaNIT]);

	const handleSeleccionEmpresa = (empresa) => {
		setEmpresaSeleccionada(empresa);
		setEmpresaNIT(empresa.NIT);
		setShowResultados(false);
	};

	if (!curso) return <p>Cargando...</p>;

	return (
		<>
			<Header />
			<Main>
				<div className="create-course-container">
					{/* Header */}
					<div className="course-header">
						<div className="header-content">
							<h1>Actualizar <span>Curso</span></h1>
							<div className="ficha-container">
								<label>Ficha N°</label>
								<input
									type="text"
									placeholder="000000"
									value={curso.ficha || ""}
									onChange={(e) => setCurso({ ...curso, ficha: e.target.value })}
								/>
							</div>
						</div>
					</div>

					{/* Grid Principal */}
					<div className="course-grid">
						{/* Columna Izquierda - Imagen e Info */}
						<div className="side-panel">
							<div className="image-upload">
								<input
									type="file"
									accept="image/*"
									ref={fileInputRef}
									onChange={(e) => {
										const file = e.target.files[0];
										if (file) {
											const reader = new FileReader();
											reader.onload = () => setPreview(reader.result);
											reader.readAsDataURL(file);
										}
									}}
									hidden
								/>
								<label className="upload-box" onClick={() => fileInputRef.current.click()}>
									{preview ? (
										<img src={preview} alt="Vista previa" className="preview-image" />
									) : (
										<>
											<img src={addIMG} alt="Agregar imagen" className="upload-icon" />
											<span className="upload-text">Sube la foto del curso</span>
										</>
									)}
								</label>
							</div>

							<div className="quick-info">
								<div className="info-item">
									<label>Duración del Curso</label>
									<input
										type="number"
										placeholder="Número de días"
										min="1"
										value={duracionCurso}
										onChange={(e) => setDuracionCurso(e.target.value)}
									/>
								</div>
								<div className="info-item">
									<label>Lugar de Formación</label>
									<input
										type="text"
										placeholder="Sena Agropecuario"
										value={lugarFormacion}
										onChange={(e) => setLugarFormacion(e.target.value)}
									/>
								</div>
								<button className="schedule-btn" onClick={() => setIsEditCalendarOpen(true)}>
									<img src={calendar} alt="Calendario" />
									Seleccionar Horarios
								</button>
							</div>
						</div>

						{/* Columna Central - Formulario Principal */}
						<div className="main-form">
							<div className="form-group">
								<label>Nombre del Curso</label>
								<input
									className="form-input"
									type="text"
									placeholder="Ingresa el nombre del curso"
									value={curso.nombre_curso || ""}
									onChange={(e) => setCurso({ ...curso, nombre_curso: e.target.value })}
								/>
							</div>

							<section className='text-create'>
								<div className="form-group">
									<label>Descripción del Curso</label>
									<div className="textarea-container">
										<textarea
											className="form-textarea"
											placeholder="Describe el curso en detalle (mínimo 300 caracteres)"
											value={curso.descripcion || ""}
											onChange={(e) => setCurso({ ...curso, descripcion: e.target.value })}
											minLength={300}
											rows={5}
										/>
										<div className={`char-counter ${curso.descripcion.length < 300 ? 'min' : 'ok'}`}>
											{curso.descripcion.length} / 300 caracteres
										</div>
									</div>
								</div>

								<div className="form-group">
									<label>Configuración del Curso</label>
									<div className="offer-options-grid">
										<div>
											<label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.5rem', color: '#b0b0b0' }}>Estado del Curso</label>
											<div className="option-buttons">
												<button
													className={`option-btn ${curso.estado?.toLowerCase() === "activo" ? "active" : ""}`}
													onClick={(e) => {
														e.preventDefault();
														setCurso({ ...curso, estado: "Activo" });
													}}
													type="button"
												>
													Activo
												</button>
												<button
													className={`option-btn ${curso.estado?.toLowerCase() === "en oferta" ? "active" : ""}`}
													onClick={(e) => {
														e.preventDefault();
														setCurso({ ...curso, estado: "En oferta" });
													}}
													type="button"
												>
													En Oferta
												</button>
												<button 
													className={`option-btn-cancel ${curso.estado?.toLowerCase() === "cancelado" ? "active" : ""}`}
													onClick={(e) => {
														e.preventDefault();
														if (curso.estado?.toLowerCase() !== "cancelado") {
															const confirmar = window.confirm("¿Estás seguro de que deseas cancelar este curso? Esta acción no se puede deshacer.");
															if (confirmar) {
																setCurso({ ...curso, estado: "Cancelado" });
															}
														}
													}}
													type="button"
													disabled={curso.estado?.toLowerCase() === "cancelado"}
												>
													Cancelado
												</button>
												<button
													className={`option-btn-cancel ${curso.estado?.toLowerCase() === "finalizado" ? "active" : ""}`}
													onClick={(e) => {
														e.preventDefault();
														if (curso.estado?.toLowerCase() !== "finalizado") {
															const confirmar = window.confirm("¿Estás seguro de que deseas finalizar este curso? Esta acción no se puede deshacer.");
															if (confirmar) {
																setCurso({ ...curso, estado: "Finalizado" });
															}
														}
													}}
													type="button"
													disabled={curso.estado?.toLowerCase() === "finalizado"}
												>
													Finalizado
												</button>
											</div>
										</div>
										<div>
											<label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.5rem', color: '#b0b0b0' }}>Tipo de Oferta</label>
											<div className="option-buttons">
												<button
													className={`option-btn ${curso.tipo_oferta?.toLowerCase() === "cerrada" ? "active" : ""}`}
													onClick={(e) => {
														e.preventDefault();
														setCurso({ ...curso, tipo_oferta: "Cerrada" });
													}}
													type="button"
												>
													Cerrada
												</button>
												<button
													className={`option-btn ${curso.tipo_oferta?.toLowerCase() === "abierta" ? "active" : ""}`}
													onClick={(e) => {
														e.preventDefault();
														setCurso({ ...curso, tipo_oferta: "Abierta" });
													}}
													type="button"
												>
													Abierta
												</button>
											</div>
										</div>
									</div>
								</div>
							</section>
						</div>

						{/* Columna Derecha - Empresa, Instructor, Temario y Acciones */}
						<div className="side-actions">
							{curso.tipo_oferta === "Cerrada" && (
								<div className="company-section">
									<label>Empresa Asociada</label>
									{empresaSeleccionada ? (
										<div className="company-selected">
											<span className="company-name">{empresaSeleccionada.nombre_empresa}</span>
											<button
												className="edit-company"
												onClick={() => {
													setEmpresaSeleccionada(null);
													setEmpresaNIT('');
													setShowResultados(false);
												}}
											>
												<img src={buttonEdit} alt="Editar empresa" />
											</button>
										</div>
									) : (
										<div style={{ position: 'relative' }}>
											<input
												className="form-input"
												type="text"
												placeholder="Buscar por NIT de empresa"
												value={empresaNIT}
												onChange={(e) => {
													setEmpresaNIT(e.target.value);
													setShowResultados(true);
												}}
												autoComplete="off"
											/>
											{empresaNIT.trim() !== "" && showResultados && (
												<ul className="company-results">
													{resultadosEmpresa.length > 0 ? (
														resultadosEmpresa.map((empresa) => (
															<li
																key={empresa.ID}
																onClick={() => {
																	setEmpresaSeleccionada(empresa);
																	setEmpresaNIT("");
																	setShowResultados(false);
																}}
															>
																{empresa.nombre_empresa}
															</li>
														))
													) : (
														<li style={{ color: "#ff6b6b" }}>No se encontraron empresas</li>
													)}
												</ul>
											)}
										</div>
									)}
								</div>
							)}

							<div className="instructor-section">
								<label>Instructor Asignado</label>
								<div className="instructor-info">
									<span className="instructor-name">
										{curso?.Instructor ? `${curso.Instructor.nombres} ${curso.Instructor.apellidos}` : "Sin asignar"}
									</span>
									<button
										className="edit-instructor"
										onClick={() => setShowAssignModal(true)}
									>
										<img src={buttonEdit} alt="Editar instructor" />
									</button>
								</div>
							</div>

							{/* Sección del Temario */}
							<div className="syllabus-section">
								<label>Temario del Curso</label>

								<div className="syllabus-inputs">
									<input
										type="date"
										value={nuevaFecha}
										onChange={(e) => setNuevaFecha(e.target.value)}
									/>
									<textarea
										className='form-textarea-right'
										type="text"
										placeholder="Agregar nuevo tema"
										value={nuevoTema}
										onChange={(e) => setNuevoTema(e.target.value)}
										onKeyPress={handleKeyPress}
									/>
									<button
										className="add-topic-btn"
										onClick={agregarTema}
										disabled={!nuevaFecha || !nuevoTema.trim()}
									>
										+
									</button>
								</div>

								{temario.length > 0 ? (
									<div className="syllabus-list">
										<div className="syllabus-header">
											<span>FECHA</span>
											<span>CONTENIDO</span>
											<span></span>
										</div>
										{temario.map((item, index) => (
											<div key={index} className="syllabus-item">
												<span className="syllabus-date">{item.fecha}</span>
												<span className="syllabus-topic">{item.tema}</span>
												<button
													className="delete-topic"
													onClick={() => eliminarTema(index)}
												>
													×
												</button>
											</div>
										))}
									</div>
								) : (
									<div className="empty-syllabus">
										No hay temas agregados al temario aún.
									</div>
								)}
							</div>

							<div className="create-btn-container">
								<button className="create-btn" onClick={handleUpdateCourse}>
									Actualizar Curso
								</button>
							</div>
						</div>
					</div>
				</div>
			</Main>
			<Footer />

			{showAssignModal && (
				<AssignInstructorCourse
					curso_ID={curso?.ID || id}
					onClose={() => setShowAssignModal(false)}
				/>
			)}

			{isEditCalendarOpen && (
				<EditCalendar
					show={isEditCalendarOpen}
					closeModal={() => setIsEditCalendarOpen(false)}
					onSave={handleCalendarSave}
					initialData={calendarData}
				/>
			)}
		</>
	);
};