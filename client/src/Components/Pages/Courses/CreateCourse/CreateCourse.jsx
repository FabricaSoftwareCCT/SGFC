import React, { useRef, useState, useEffect } from 'react';
import './CreateCourse.css';
import { Footer } from '../../../Layouts/Footer/Footer';
import { Main } from '../../../Layouts/Main/Main';
import { Modal_General } from '../../../UI/Modal_General/Modal_General';
import EditCalendar from '../../../UI/Modal_Calendar/EditCalendar/EditCalendar';
import addIMG from '../../../../assets/Icons/addImg.png';
import buttonEdit from '../../../../assets/Icons/buttonEdit.png';
import calendar from '../../../../assets/Icons/calendar.png';
import imgDefectCourse from '../../../../assets/Icons/picDefectCourse.png';
import axiosInstance from '../../../../config/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { AssignInstructorCourse } from '../AssignInstructorCourse/AssignInstructorCourse';
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css';

export const CreateCourse = () => {
	const navigate = useNavigate();
	const [preview, setPreview] = useState(null);
	const fileInputRef = useRef(null);
	const [selected, setSelected] = useState('Cerrada');
	const [selectedStatus, setSelectedStatus] = useState('En oferta');
	const [ficha, setFicha] = useState('');
	const [nombreCurso, setNombreCurso] = useState('');
	const [descripcion, setDescripcion] = useState('');
	const [instructor_ID, setInstructor_ID] = useState(null);
	const [showAssignModal, setShowAssignModal] = useState(false);
	const [empresaNIT, setEmpresaNIT] = useState('');
	const [resultadosEmpresa, setResultadosEmpresa] = useState([]);
	const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
	const [showResultados, setShowResultados] = useState(false);
	const [duracionCurso, setDuracionCurso] = useState(0);
	const [lugarFormacion, setLugarFormacion] = useState("");
	const [selectedModality, setSelectedModality] = useState("presencial")

	const [calendarData, setCalendarData] = useState({
		startDate: "",
		endDate: "",
		selectedSlots: [],
	});

	const [temario, setTemario] = useState([]);
	const [nuevaFecha, setNuevaFecha] = useState("");
	const [nuevoTema, setNuevoTema] = useState("");
	const [indiceTemaEnEdicion, setIndiceTemaEnEdicion] = useState(null);
	const [temaEnEdicion, setTemaEnEdicion] = useState({ fecha: "", tema: "" });
	const [isEditCalendarOpen, setIsEditCalendarOpen] = useState(false);

	const handleChange = (e) => {
		const file = e.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = () => {
			setPreview(reader.result);
		};
		reader.readAsDataURL(file);
	};

	const showModalGeneral = () => {
		setIsEditCalendarOpen(true);
	};

	const handleCalendarSave = (data) => {
		const calculateDuration = (startDate, endDate) => {
			if (!startDate || !endDate) return 0;
			const start = new Date(startDate);
			const end = new Date(endDate);
			const diffTime = Math.abs(end - start);
			return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
		};

		const duracionCalculada = calculateDuration(data.startDate, data.endDate);
		setCalendarData(data);
		setDuracionCurso(duracionCalculada);
		setIsEditCalendarOpen(false);
	};

	const handleAssignInstructor = (instructorId) => {
		setInstructor_ID(instructorId);
		setShowAssignModal(false);
	};

	const agregarTema = () => {
		if (nuevaFecha && nuevoTema.trim()) {
			const nuevoTemaObj = {
				fecha: nuevaFecha,
				tema: nuevoTema.trim(),
				id: Date.now() + Math.random()
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
		if (indiceTemaEnEdicion === index) {
			setIndiceTemaEnEdicion(null);
			setTemaEnEdicion({ fecha: "", tema: "" });
		}
	};

	const handleKeyPress = (e) => {
		if (e.key === 'Enter' && e.ctrlKey) {
			agregarTema();
		}
	};

	const iniciarEdicionTema = (indiceSeleccionado) => {
		const temaSeleccionado = temario[indiceSeleccionado];
		setIndiceTemaEnEdicion(indiceSeleccionado);
		setTemaEnEdicion({
			fecha: temaSeleccionado.fecha,
			tema: temaSeleccionado.tema
		});
	};

	const cancelarEdicionTema = () => {
		setIndiceTemaEnEdicion(null);
		setTemaEnEdicion({ fecha: "", tema: "" });
	};

	const actualizarTemaEnEdicion = (campo, valor) => {
		setTemaEnEdicion((temaActual) => ({
			...temaActual,
			[campo]: valor
		}));
	};

	const guardarEdicionTema = () => {
		if (indiceTemaEnEdicion === null) {
			return;
		}

		if (!temaEnEdicion.fecha || !temaEnEdicion.tema.trim()) {
			return;
		}

		const temarioActualizado = [...temario];
		temarioActualizado[indiceTemaEnEdicion] = {
			...temarioActualizado[indiceTemaEnEdicion],
			fecha: temaEnEdicion.fecha,
			tema: temaEnEdicion.tema.trim()
		};
		setTemario(temarioActualizado);
		cancelarEdicionTema();
	};

	const handleCreateCourse = async () => {
		if (!ficha || !nombreCurso || !descripcion || !selected || !selectedStatus) {
			Swal.fire({
				icon: 'warning',
				title: 'Campos incompletos',
				text: 'Por favor, completa todos los campos requeridos.',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#f39c12',
				theme: 'bulma',
				customClass: {
					actions: 'swal2-center-actions'
				}
			});
			return;
		}

		if (isNaN(Number(ficha))) {
			Swal.fire({
				icon: 'error',
				title: 'Ficha inválida',
				text: 'El campo ficha debe ser un número.',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#d33',
				theme: 'bulma',
				customClass: {
					actions: 'swal2-center-actions'
				}
			});
			return;
		}

		if (descripcion.length < 100) {
			Swal.fire({
				icon: 'warning',
				title: 'Descripción muy corta',
				text: 'La descripción debe tener mínimo 100 caracteres.',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#f39c12',
				theme: 'bulma',
				customClass: {
					actions: 'swal2-center-actions'
				}
			});
			return;
		}

		if (!calendarData.startDate || !calendarData.endDate || calendarData.selectedSlots.length === 0) {
			Swal.fire({
				icon: 'warning',
				title: 'Fechas y horarios requeridos',
				text: 'Por favor, selecciona las fechas y horarios del curso.',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#f39c12',
				theme: 'bulma',
				customClass: {
					actions: 'swal2-center-actions'
				}
			});
			return;
		}

		try {
			const formData = new FormData();

			if (empresaSeleccionada) {
				formData.append("empresa_ID", empresaSeleccionada.ID);
			}

			formData.append("ficha", ficha);
			formData.append("nombre_curso", nombreCurso.toUpperCase());
			formData.append("descripcion", descripcion);
			formData.append("tipo_oferta", selected);
			formData.append("estado", selectedStatus);
			formData.append("fecha_inicio", calendarData.startDate);
			formData.append("fecha_fin", calendarData.endDate);
			formData.append("temario", JSON.stringify(temario.map(({fecha, tema}) => ({fecha, tema}))));
			formData.append("modalidad", selectedModality);

			const slotsByDay = {};
			calendarData.selectedSlots.forEach(slot => {
				const [dia, hora] = slot.split('-');
				if (!slotsByDay[dia]) {
					slotsByDay[dia] = [];
				}
				slotsByDay[dia].push(hora);
			});

			let horaInicio = '23:59';
			let horaFin = '00:00';
			Object.values(slotsByDay).flat().forEach(hora => {
				if (hora < horaInicio) horaInicio = hora;
				if (hora > horaFin) horaFin = hora;
			});

			horaInicio = horaInicio.padStart(5, '0');
			horaFin = horaFin.padStart(5, '0');

			formData.append("hora_inicio", horaInicio);
			formData.append("hora_fin", horaFin);

			const diasMapping = {
				'Lun': 'Lunes',
				'Mar': 'Martes',
				'Mié': 'Miércoles',
				'Jue': 'Jueves',
				'Vie': 'Viernes',
				'Sáb': 'Sábado'
			};
			const diasSemana = Object.keys(slotsByDay).map(dia => diasMapping[dia] || dia);
			formData.append("dias_formacion", JSON.stringify(diasSemana));
			formData.append("slots_formacion", JSON.stringify(calendarData.selectedSlots));

			if (fileInputRef.current.files[0]) {
				formData.append("imagen", fileInputRef.current.files[0]);
			} else {
				const response = await fetch(imgDefectCourse);
				const blob = await response.blob();
				formData.append("imagen", blob, "imgDefectCourse.png");
			}

			if (instructor_ID) {
				formData.append("instructor_ID", instructor_ID);
			}

			if (lugarFormacion) {
				formData.append("lugar_formacion", lugarFormacion)
			}

			if (duracionCurso) {
				formData.append("duracion_dias", duracionCurso)
			}

			const response = await axiosInstance.post("/api/courses/cursos", formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			await Swal.fire({
				icon: 'success',
				title: '¡Curso creado!',
				text: 'Curso creado con éxito',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#28a745',
				timer: 3000,
				timerProgressBar: true,
				theme: 'bulma',
				customClass: {
					actions: 'swal2-center-actions'
				}
			});

			if (response.data.curso && response.data.curso.ID) {
				navigate('/Cursos/MisCursos');
			}

		} catch (error) {
			// console.error("Error al crear el curso:", error);
			if (error.response?.data?.message) {
				Swal.fire({
					icon: 'error',
					title: 'Error',
					text: `Error: ${error.response.data.message}`,
					confirmButtonText: 'Aceptar',
					confirmButtonColor: '#d33',
					theme: 'bulma',
					customClass: {
						actions: 'swal2-center-actions'
					}
				});
			} else {
				Swal.fire({
					icon: 'error',
					title: 'Error del sistema',
					text: 'Ocurrió un error al crear el curso',
					confirmButtonText: 'Aceptar',
					confirmButtonColor: '#d33',
					theme: 'bulma',
					customClass: {
						actions: 'swal2-center-actions'
					}
				});
			}
		}
	};

	const buscarEmpresaPorNIT = async (nit) => {
		if (!nit.trim()) {
			setResultadosEmpresa([]);
			return;
		}
		try {
			const response = await axiosInstance.get(`/api/users/empresa/${nit}`);
			setResultadosEmpresa([response.data]);
			setShowResultados(true);
		} catch (error) {
			setResultadosEmpresa([]);
			setShowResultados(false);
		}
	};

	useEffect(() => {
		buscarEmpresaPorNIT(empresaNIT);
	}, [empresaNIT]);

	// Función para formatear fecha
	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('es-ES', {
			weekday: 'short',
			day: '2-digit',
			month: 'short'
		});
	};

	return (
		<>
			<Main>
				<div className="create-course-container">
					{/* Header */}
					<div className="course-header">
						<div className="header-content">
							<h1>Crear <span>Curso</span></h1>
							<div className="ficha-container">
								<label>Ficha N°</label>
								<input
									type="number"
									placeholder="000000"
									value={ficha}
									onChange={(e) => setFicha(e.target.value)}
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
									onChange={handleChange}
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
									<label>Duración del Curso en Dias</label>
									<input
										type="number"
										placeholder="Número de días"
										min="1"
										value={duracionCurso}
										onChange={(e) => {
											if (!calendarData.startDate || !calendarData.endDate) {
												setDuracionCurso(e.target.value);
											}
										}}
										readOnly={!!calendarData.startDate && !!calendarData.endDate}
										className={calendarData.startDate && calendarData.endDate ? "readonly-input" : ""}
									/>
									{calendarData.startDate && calendarData.endDate && (
										<small style={{ fontSize: "0.75rem", color: "#666", marginTop: "4px", display: "block" }}>
											Duración calculada automáticamente desde las fechas seleccionadas
										</small>
									)}
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
								<button className="schedule-btn" onClick={showModalGeneral}>
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
									value={nombreCurso}
									onChange={(e) => setNombreCurso(e.target.value)}
								/>
							</div>
							<section className='text-create'>

								<div className="form-group">
									<label>Descripción del Curso</label>
									<div className="textarea-container">
										<textarea
											className="form-textarea"
											placeholder="Describe el curso en detalle (mínimo 100 caracteres)"
											value={descripcion}
											onChange={(e) => setDescripcion(e.target.value)}
											minLength={100}
											rows={5}
										/>
										<div className={`char-counter ${descripcion.length < 100 ? 'min' : 'ok'}`}>
											{descripcion.length} / 100 caracteres
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
													className={`option-btn ${selectedStatus === "Activo" ? "active" : ""}`}
													onClick={() => setSelectedStatus("Activo")}
												>
													Activo
												</button>
												<button
													className={`option-btn ${selectedStatus === "En oferta" ? "active" : ""}`}
													onClick={() => setSelectedStatus("En oferta")}
												>
													En Oferta
												</button>
											</div>
										</div>
										<div>
											<label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.5rem', color: '#b0b0b0' }}>Tipo de Oferta</label>
											<div className="option-buttons">
												<button
													className={`option-btn ${selected === "Cerrada" ? "active" : ""}`}
													onClick={() => setSelected("Cerrada")}
												>
													Cerrada
												</button>
												<button
													className={`option-btn ${selected === "Abierta" ? "active" : ""}`}
													onClick={() => setSelected("Abierta")}
												>
													Abierta
												</button>
											</div>
										</div>
									</div>
								</div>
							</section>

						</div>

						{/* Columna Derecha - Temario y Acciones */}
						<div className="side-actions">
							{selected === "Cerrada" && (
								<div className="company-section">
									<label>Empresa Asociada</label>
									{empresaSeleccionada ? (
										<div className="company-selected">
											<span className="company-name">{empresaSeleccionada.nombre_empresa}</span>
											<button
												className="edit-company"
												onClick={() => {
													setEmpresaSeleccionada(null)
													setEmpresaNIT("")
													setShowResultados(false)
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
													setEmpresaNIT(e.target.value)
													setShowResultados(true)
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
																	setEmpresaSeleccionada(empresa)
																	setEmpresaNIT("")
																	setShowResultados(false)
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

							<div className="syllabus-section">
								<div className="syllabus-header-container">
									<label>Temario del Curso</label>
									<div className="syllabus-stats">
										<span className="topic-count">{temario.length} Temas</span>
										{temario.length > 0 && (
											<button 
												className="clear-all-btn"
												onClick={() => {
													if(window.confirm('¿Estás seguro de eliminar todos los temas?')) {
														setTemario([]);
													}
												}}
											>
												Limpiar todo
											</button>
										)}
									</div>
								</div>

								<div className="syllabus-inputs">
									<div className="date-input-container">
										<input
											type="date"
											value={nuevaFecha}
											onChange={(e) => setNuevaFecha(e.target.value)}
											className="date-picker"
										/>
									</div>
									<div className="topic-input-container">
										<textarea
											className='form-textarea-right'
											type="text"
											placeholder="Escribe el contenido del tema..."
											value={nuevoTema}
											onChange={(e) => setNuevoTema(e.target.value)}
											onKeyDown={handleKeyPress}
											rows={3}
										/>
										<div className="topic-input-hint">
											<span>Presiona Ctrl + Enter para agregar</span>
										</div>
									</div>
									<button
										className="add-topic-btn"
										onClick={agregarTema}
										disabled={!nuevaFecha || !nuevoTema.trim()}
										title="Agregar tema"
									>
										<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
											<line x1="12" y1="5" x2="12" y2="19"></line>
											<line x1="5" y1="12" x2="19" y2="12"></line>
										</svg>
										Agregar
									</button>
								</div>

								{temario.length > 0 ? (
									<div className="syllabus-cards-container">
										<div className="syllabus-cards-grid">
											{temario.map((item, index) => {
												const temaEnEdicionActivo = indiceTemaEnEdicion === index;

												if (temaEnEdicionActivo) {
													return (
														<div key={item.id} className="syllabus-card editing">
															<div className="card-header">
																<input
																	type="date"
																	className="edit-date-input"
																	value={temaEnEdicion.fecha}
																	onChange={(e) => actualizarTemaEnEdicion("fecha", e.target.value)}
																/>
																<div className="card-actions">
																	<button
																		className="card-action-btn save-btn"
																		onClick={guardarEdicionTema}
																	>
																		Guardar
																	</button>
																	<button
																		className="card-action-btn cancel-btn"
																		onClick={cancelarEdicionTema}
																	>
																		Cancelar
																	</button>
																</div>
															</div>
															<textarea
																className="edit-content-input"
																value={temaEnEdicion.tema}
																onChange={(e) => actualizarTemaEnEdicion("tema", e.target.value)}
																placeholder="Contenido del tema"
																rows={4}
															/>
														</div>
													);
												}

												return (
													<div key={item.id} className="syllabus-card">
														<div className="card-header">
															<div className="card-date">
																<span className="date-day">{formatDate(item.fecha)}</span>
																<span className="date-full">{item.fecha}</span>
															</div>
															<div className="card-actions">
																<button
																	className="card-action-btn edit-btn"
																	onClick={() => iniciarEdicionTema(index)}
																	title="Editar tema"
																>
																	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
																		<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
																		<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
																	</svg>
																</button>
																<button
																	className="card-action-btn delete-btn"
																	onClick={() => eliminarTema(index)}
																	title="Eliminar tema"
																>
																	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
																		<path d="M3 6h18"></path>
																		<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
																		<path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
																	</svg>
																</button>
															</div>
														</div>
														<div className="card-content">
															<p>{item.tema}</p>
														</div>
														<div className="card-footer">
															<span className="topic-number">Tema {index + 1}</span>
														</div>
													</div>
												);
											})}
										</div>
									</div>
								) : (
									<div className="empty-syllabus">
										<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
											<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
											<polyline points="14 2 14 8 20 8"></polyline>
											<line x1="16" y1="13" x2="8" y2="13"></line>
											<line x1="16" y1="17" x2="8" y2="17"></line>
											<polyline points="10 9 9 9 8 9"></polyline>
										</svg>
										<p>No hay temas agregados al temario aún.</p>
										<p className="empty-hint">Agrega fechas y temas para comenzar</p>
									</div>
								)}
							</div>

							<div className="create-btn-container">
								<button className="create-btn" onClick={handleCreateCourse}>
									Crear Curso
								</button>
							</div>
						</div>
					</div>
				</div>
			</Main>
			<Footer />

			{showAssignModal && (
				<AssignInstructorCourse
					curso_ID={null}
					onClose={() => setShowAssignModal(false)}
					onAssign={handleAssignInstructor}
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