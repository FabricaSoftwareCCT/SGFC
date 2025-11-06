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

	const [calendarData, setCalendarData] = useState({
		startDate: "",
		endDate: "",
		selectedSlots: [],
	});

	const [temario, setTemario] = useState([]);
	const [nuevaFecha, setNuevaFecha] = useState("");
	const [nuevoTema, setNuevoTema] = useState("");
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
		setCalendarData(data);
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

	const handleCreateCourse = async () => {
		if (!ficha || !nombreCurso || !descripcion || !selected || !selectedStatus) {
			alert("Por favor, completa todos los campos requeridos.");
			return;
		}

		if (isNaN(Number(ficha))) {
			alert("El campo ficha debe ser un número.");
			return;
		}

		if (descripcion.length < 100) {
			alert("La descripción debe tener mínimo 100 caracteres.");
			return;
		}

		if (!calendarData.startDate || !calendarData.endDate || calendarData.selectedSlots.length === 0) {
			alert("Por favor, selecciona las fechas y horarios del curso.");
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
			formData.append("temario", JSON.stringify(temario));

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

			alert("Curso creado con éxito");

			if (response.data.curso && response.data.curso.ID) {
				navigate('/Cursos/MisCursos');
			}

		} catch (error) {
			console.error("Error al crear el curso:", error);
			if (error.response?.data?.message) {
				alert(`Error: ${error.response.data.message}`);
			} else {
				alert("Ocurrió un error al crear el curso");
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