import { useEffect, useRef, useState } from "react";
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
import Swal from "sweetalert2";
import 'sweetalert2/themes/bulma.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faXmark } from '@fortawesome/free-solid-svg-icons'

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
	const [indiceTemaEnEdicion, setIndiceTemaEnEdicion] = useState(null);
	const [temaEnEdicion, setTemaEnEdicion] = useState({ fecha: "", tema: "" });
	const [showTemaModal, setShowTemaModal] = useState(false);
	const [temaSeleccionado, setTemaSeleccionado] = useState({ fecha: "", tema: "" });

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
				Swal.fire({
					icon: 'error',
					title: 'Error',
					text: 'Error al cargar los datos del curso',
					confirmButtonText: 'Entendido',
					theme: "bulma",
					customClass: {
						confirmButton: 'button is-primary',
						actions: 'swal2-actions-centered',
						popup: 'swal2-popup-centered'
					},
					buttonsStyling: false
				});
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

	const verTemaCompleto = (tema) => {
		setTemaSeleccionado(tema);
		setShowTemaModal(true);
	};

	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('es-ES', {
			day: '2-digit',
			month: 'short'
		});
	};

	const handleUpdateCourse = async () => {
		try {
			if (curso.tipo_oferta === "Cerrada" && !empresaSeleccionada) {
				await Swal.fire({
					icon: 'warning',
					title: 'Empresa requerida',
					text: 'Por favor selecciona una empresa válida.',
					confirmButtonText: 'Entendido',
					theme: "bulma",
					customClass: {
						confirmButton:'custom-green-btn',
						actions: 'swal2-actions-centered',
						popup: 'swal2-popup-centered'
					},
					buttonsStyling: false
				});
				return;
			}

			if (!lugarFormacion.trim()) {
				await Swal.fire({
					icon: 'warning',
					title: 'Lugar de formación requerido',
					text: 'Por favor ingresa el lugar de formación del curso.',
					confirmButtonText: 'Entendido',
					theme: "bulma",
					customClass: {
						confirmButton: 'button is-primary',
						actions: 'swal2-actions-centered',
						popup: 'swal2-popup-centered'
					},
					buttonsStyling: false
				});
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

			// Crear FormData para incluir la imagen
			const formData = new FormData();
			formData.append("ficha", curso.ficha);
			formData.append("nombre_curso", curso.nombre_curso);
			formData.append("descripcion", curso.descripcion);
			formData.append("tipo_oferta", curso.tipo_oferta);
			formData.append("estado", curso.estado);
			formData.append("fecha_inicio", calendarData.startDate);
			formData.append("fecha_fin", calendarData.endDate);
			formData.append("hora_inicio", horaInicio);
			formData.append("hora_fin", horaFin);
			formData.append("dias_formacion", JSON.stringify(diasSemana));
			formData.append("lugar_formacion", lugarFormacion);
			formData.append("slots_formacion", JSON.stringify(calendarData.selectedSlots));
			formData.append("duracion_dias", duracionCurso);
			formData.append("temario", JSON.stringify(temario.map(({fecha, tema}) => ({fecha, tema}))));
			formData.append("modalidad", curso.modalidad);
			
			if (curso.tipo_oferta === "Cerrada") {
				formData.append("empresa_ID", empresaSeleccionada?.ID || curso.empresa_ID || "");
			}

			// Agregar la imagen si se seleccionó una nueva
			const fileInput = fileInputRef.current;
			if (fileInput && fileInput.files && fileInput.files.length > 0) {
				const selectedFile = fileInput.files[0];
				if (selectedFile instanceof File) {
					formData.append("imagen", selectedFile);
					console.log("Imagen agregada al FormData:", selectedFile.name, selectedFile.size);
				}
			} else {
				console.log("No se seleccionó nueva imagen, se mantendrá la existente");
			}

			const response = await axiosInstance.put(`/api/courses/cursos/${id}`, formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			if (response.status === 200) {
				await Swal.fire({
					icon: 'success',
					title: '¡Éxito!',
					text: 'Curso actualizado con éxito',
					confirmButtonText: 'Entendido',
					theme: "bulma",
					customClass: {
						confirmButton: 'button is-primary',
						actions: 'swal2-actions-centered',
						popup: 'swal2-popup-centered'
					},
					buttonsStyling: false
				});
				navigate(`/Cursos/${id}`);
			} else {
				await Swal.fire({
					icon: 'error',
					title: 'Error',
					text: 'Ocurrió un error al actualizar el curso',
					confirmButtonText: 'Entendido',
					theme: "bulma",
					customClass: {
						confirmButton: 'button is-primary',
						actions: 'swal2-actions-centered',
						popup: 'swal2-popup-centered'
					},
					buttonsStyling: false
				});
			}
		} catch (error) {
			console.error("Error al actualizar el curso:", error);
			await Swal.fire({
				icon: 'error',
				title: 'Error',
				text: 'Ocurrió un error al actualizar el curso',
				confirmButtonText: 'Entendido',
				theme: "bulma",
				customClass: {
					confirmButton: 'button is-primary',
					actions: 'swal2-actions-centered',
					popup: 'swal2-popup-centered'
				},
				buttonsStyling: false
			});
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
	}, [empresaNIT, debouncedBuscarEmpresa]);

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
													onClick={ (e) => {
														e.preventDefault();
														setCurso({ ...curso, estado: "En oferta" });
													}}
													type="button"
												>
													En Oferta
												</button>
												<button 
													className={`option-btn-cancel ${curso.estado?.toLowerCase() === "cancelado" ? "active" : ""}`}
													onClick={ async (e) => {
														e.preventDefault();
														if (curso.estado?.toLowerCase() !== "cancelado") {
															const result = await Swal.fire({
																icon: "warning",
																title: "Cancelar curso",
																text: "¿Estás seguro de que deseas cancelar este curso? Esta acción no se puede deshacer.",
																showCancelButton: true,
																confirmButtonText: 'Sí, cancelar',
																cancelButtonText: 'No, mantener',
																theme: "bulma",
																customClass: {
																	confirmButton: 'button is-danger custom-confirm-btn',
																	cancelButton: 'button is-light custom-cancel-btn',
																	actions: 'swal2-actions-centered custom-actions'
																},
																buttonsStyling: false
															});
															if (result.isConfirmed) {
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
													onClick={async (e) => {
														e.preventDefault();
														if (curso.estado?.toLowerCase() !== "finalizado") {
															const result = await Swal.fire({
																icon: "warning",
																title: "Finalizar curso",
																text: "¿Estás seguro de que deseas finalizar este curso? Esta acción no se puede deshacer.",
																showCancelButton: true,
																confirmButtonText: 'Sí, finalizar',
																cancelButtonText: 'No, mantener',
																theme: "bulma",
																customClass: {
																	confirmButton: 'button is-danger custom-confirm-btn',
																	cancelButton: 'button is-light custom-cancel-btn',
																	actions: 'swal2-actions-centered custom-actions'
																},
																buttonsStyling: false
															});
															if (result.isConfirmed) {
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

							{/* Sección del Temario - CORREGIDA */}
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
															<p className="truncated-text">{item.tema}</p>
														</div>
														<div className="card-footer">
															<span className="topic-number">Tema {index + 1}</span>
															{item.tema.length > 100 && (
																<button 
																	className="view-full-btn"
																	onClick={() => verTemaCompleto(item)}
																	title="Ver tema completo"
																>
																	<FontAwesomeIcon icon={faEye} />
																</button>
															)}
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
								<button className="create-btn" onClick={handleUpdateCourse}>
									Actualizar Curso
								</button>
							</div>
						</div>
					</div>
				</div>
			</Main>
			<Footer />

			{/* Modal para ver tema completo */}
			{showTemaModal && (
				<div className="tema-modal-overlay">
					<div className="tema-modal">
						<div className="tema-modal-header">
							<h3>Tema Completo</h3>
							<button 
								className="close-modal-btn"
								onClick={() => setShowTemaModal(false)}
							>
								<FontAwesomeIcon icon={faXmark} />
							</button>
						</div>
						<div className="tema-modal-content">
							<div className="tema-info">
								<div className="tema-fecha">
									<strong>Fecha:</strong> {temaSeleccionado.fecha}
								</div>
								<div className="tema-contenido">
									<strong>Contenido:</strong>
									<div className="tema-texto">
										{temaSeleccionado.tema}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

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