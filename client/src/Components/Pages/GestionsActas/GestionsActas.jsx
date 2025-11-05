import { useState, useEffect, act } from "react";
import { Header } from "../../Layouts/Header/Header";
import { Main } from "../../Layouts/Main/Main";
import "./GestionsActas.css";
import { Footer } from "../../Layouts/Footer/Footer";
import axiosInstance from "../../../config/axiosInstance";
import seePasswordIcon from "../../../assets/Icons/seePassword.png";
import { useModal } from "../../../Context/ModalContext";
import { NavLink, useNavigate } from "react-router-dom";
import { Modal_General } from '../../UI/Modal_General/Modal_General';
import agregarArchivo from '../../../assets/Icons/agregar-archivo.png';

const categoriasDisponibles = [
	'Solicitud', 'Concertacion', 'Lugar_formacion', 'Matricula'
];
const estadosDisponibles = ['pendiente', 'aprobada', 'rechazada'];

export const GestionsActas = () => {
	const [actas, setActas] = useState([]);
	const [actasOriginales, setActasOriginales] = useState([]); // Guardar todas las actas
	const [filtro, setFiltro] = useState("");
	const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([]);
	const [estadosSeleccionados, setEstadosSeleccionados] = useState([]);
	const [usuarioLogueado, setUsuarioLogueado] = useState(null);
	const { setShowModalGeneral, setModalGeneralContent } = useModal();
	const [showTipoActaModal, setShowTipoActaModal] = useState(false);
	const [tipoActaSeleccionada, setTipoActaSeleccionada] = useState(null);
	const [observation, setObservation] = useState()
	const [selectedActa, setSelectedActa] = useState()
	const [newState, setNewState] = useState("")
	const navigate = useNavigate();

	useEffect(() => {
		const fetchActas = async () => {
			try {
				const res = await axiosInstance.get("/api/actas/actas");
				setActasOriginales(res.data); // Guardar todas las actas

				// Obtener usuario logueado
				const userData = JSON.parse(sessionStorage.getItem('userSession') || '{}');

				// Filtrar según el tipo de usuario
				if (userData.accountType === 'Administrador' || userData.accountType === "Gestor") {
					// Administrador ve todas las actas
					setActas(res.data);
				} else if (userData.accountType === 'Instructor') {
					// Instructor solo ve sus propias actas
					const actasDelInstructor = res.data.filter(acta =>
						acta.instructor_ID === userData.id || acta.instructorId === userData.id
					);
					setActas(actasDelInstructor);
				} else {
					// Otros tipos de usuario no ven actas o ven según otras reglas
					setActas([]);
				}

			} catch (error) {
				setActas([]);
				setActasOriginales([]);
				console.error("Error al cargar actas:", error);
			}
		};

		// Obtener información del usuario logueado
		const obtenerUsuarioLogueado = () => {
			try {
				const userData = JSON.parse(sessionStorage.getItem('userSession') || '{}');
				setUsuarioLogueado(userData);
			} catch (error) {
				console.error('Error al obtener datos del usuario:', error);
				setUsuarioLogueado(null);
			}
		};

		obtenerUsuarioLogueado();
		fetchActas();
	}, []);

	// Verificar si el usuario es administrador
	const esAdministrador = () => {
		return usuarioLogueado && usuarioLogueado.accountType === 'Administrador';
	};

	const esGestor = () => {
		return usuarioLogueado && usuarioLogueado.accountType === 'Gestor';
	};

	// Verificar si el usuario es instructor
	const esInstructor = () => {
		return usuarioLogueado && usuarioLogueado.accountType === 'Instructor';
	};

	// Manejar selección de categorías (multi-selección)
	const handleCategoriaClick = (categoria) => {
		setCategoriasSeleccionadas((prev) =>
			prev.includes(categoria)
				? prev.filter((cat) => cat !== categoria)
				: [...prev, categoria]
		);
	};

	// Manejar selección de estado (único)
	const handleEstadoClick = (estado) => {
		setEstadosSeleccionados((prev) =>
			prev.includes(estado)
				? prev.filter((e) => e !== estado)
				: [...prev, estado]
		);
	};

	// Filtrado por ID, estado y categorías seleccionadas
	const actasFiltradas = actas.filter((acta) => {
		const idMatch = filtro === "" || String(acta.ID).includes(filtro);
		const estadoMatch = estadosSeleccionados.length === 0 || estadosSeleccionados.includes(acta.estado_acta);
		const categoriaMatch = categoriasSeleccionadas.length === 0 || categoriasSeleccionadas.includes(acta.tipo_acta);
		return idMatch && estadoMatch && categoriaMatch;
	});

	const handleVerOpcionesPDF = (acta) => {
		if (!newState)
			setNewState(acta.estado_acta)
		if (!observation && acta.observacion)
			setObservation(acta.observacion)

		setSelectedActa(acta)

		const handleChangeEstado = async () => {
			if (!esAdministrador()) {
				alert('Solo los administradores pueden cambiar el estado del acta');
				return;
			}

			try {
				const userData = JSON.parse(sessionStorage.getItem('userSession') || '{}');     
				const respo = await axiosInstance.put(`/api/actas/${acta.ID}/estado`, { estado_acta: newState, observacion: observation });
				const updatedEstado = respo.data.acta;
				setNewState()
				setObservation()
				try{
					console.log('datos acta', acta.ID, updatedEstado);
					const response = await axiosInstance.post('/api/notifications/solicitudNotificacion', {
						remitente_ID: userData.id,
						actaID : acta.ID,
						estado: updatedEstado, 
					})
					alert('Notificación de estado de solicitud de curso enviada correctamente');
				} catch (error) {
					console.error('Error al enviar notificación de estado de solicitud de curso:', error);
				}
				alert('Estado actualizado correctamente');
				setShowModalGeneral(false);
				window.location.reload();
			} catch (error) {
				alert('Error al actualizar el estado');
			}
		};

		setModalGeneralContent(
			<div style={{ textAlign: "center", width: "auto", height: "auto" }}>
				<h3 style={{ textAlign: "center", width: "auto", height: "auto", marginTop: "1rem" }}>¿Qué deseas ver?</h3>
				<div style={{
					display: "flex",
					flexDirection: "column",
					gap: "1rem",
					margin: "1rem 0",
					width: "auto",
					height: "auto"
				}}>
					<NavLink
						to="#"
						onClick={e => {
							e.preventDefault();
							const baseUrl = acta.tipo_acta === 'Solicitud'
								? 'http://localhost:3001/uploads/solicitudes'
								: 'http://localhost:3001/uploads/documentos';
							window.open(`${baseUrl}/${acta.pdf_acta}`, "_blank");
						}}
						className={"Acta-Boton"}
					>
						Acta
					</NavLink>
					<NavLink
						to="#"
						onClick={e => {
							e.preventDefault();
							if (acta.pdf_radicado) {
								const baseUrl = acta.tipo_acta === 'Solicitud'
									? 'http://localhost:3001/uploads/solicitudes'
									: 'http://localhost:3001/uploads/documentos';
								window.open(`${baseUrl}/${acta.pdf_radicado}`, "_blank");
							}
						}}
						className={"Acta-Boton"}
						style={{
							opacity: acta.pdf_radicado ? 1 : 0.5,
							pointerEvents: acta.pdf_radicado ? "auto" : "none",
						}}
					>
						Radicado
					</NavLink>
					{/*acta.tipo_acta == "Concertacion" && (
						<button
							className={"Acta-Boton"}
						>
							Editar acta
						</button>
					)*/}
					<label
						style={{
							background: "#007bff",
							color: "#fff",
							padding: "0.5rem 1rem",
							borderRadius: "5px",
							fontWeight: "bold",
							cursor: "pointer",
							width: "100%",
							height: "auto"
						}}
					>
						Subir PDF Radicado
						<input
							type="file"
							accept="application/pdf"
							style={{ display: "none" }}
							onChange={e => {
								const file = e.target.files[0];
								if (file) {
									handleUploadRadicado(acta.ID, file);
								}
							}}
						/>
					</label>

					{/* Sección de cambio de estado - SOLO para administradores */}
					{esAdministrador() && (
						<div style={{
							textAlign: "center",
							width: "auto",
							height: "auto",
							display: "flex",
							flexDirection: "column",
							alignItems: "center"
						}}>
							<label style={{
								fontWeight: "bold",
								width: "auto",
								height: "auto",
								marginTop: "1rem"
							}}>
								Cambiar estado del acta:
							</label>
							<select
								defaultValue={acta.estado_acta}
								value={newState}
								onChange={e => { setNewState(e.target.value) }}
								className="selectEstadoActa"
							>
								<option value="pendiente">Pendiente</option>
								<option value="aprobada">Aprobada</option>
								<option value="rechazada">Rechazada</option>
							</select>
							{newState !== "pendiente" &&
								<>
									<label
										style={{
											fontWeight: "bold",
											width: "auto",
											height: "auto",
										}}
									>
										Observación
									</label>
									<textarea
										type="text"
										className="search-input reason-textarea"
										placeholder="Escriba aquí una observación respecto al acta..."
										value={observation}
										onChange={(e) => {
											setObservation(e.target.value)
										}}
									/>
								</>
							}
							<button
								onClick={handleChangeEstado}
								style={{
									background: "#00843d",
									color: "#fff",
									padding: "0.5rem 1rem",
									borderRadius: "5px",
									fontWeight: "bold",
									width: "auto",
									height: "auto",
									borderStyle: "none",
									marginTop: "0.5rem"
								}}
							>
								Guardar Estado
							</button>
						</div>
					)}

					{/* Mensaje informativo para no administradores */}
					{!esAdministrador() && (
						<>
							<div style={{
								textAlign: "center",
								padding: "1rem",
								color: "#666",
								fontStyle: "italic",
								borderRadius: "5px",
								marginTop: "0.5rem"
							}}>
								Solo los administradores pueden cambiar el estado del acta
							</div>
							{acta.observacion && (
								<>
									<b>Observación</b>
									<p>{acta.observacion}</p>
								</>
							)}
						</>
					)}
				</div>
			</div>
		);
		setShowModalGeneral(true);
	};

	const handleUploadRadicado = async (actaId, file) => {
		const formData = new FormData();
		formData.append('pdf', file);

		try {
			await axiosInstance.post(`/api/actas/${actaId}/upload-radicado`, formData, {
				headers: { 'Content-Type': 'multipart/form-data' }
			});
			alert('PDF radicado subido correctamente');
			setShowModalGeneral(false);
			window.location.reload();
		} catch (error) {
			alert('Error al subir el PDF radicado');
		}
	};

	useEffect(() => {
		if (selectedActa)
			handleVerOpcionesPDF(selectedActa)
	}, [newState, selectedActa, observation])

	return (
		<div className="pantallaGestionsCompany">
			<Header />
			<Main>
				<section className="sectionPrincipalGestionsCompany">
					<section className="sectionGestionsCompanyHeader">
						<p className="tituloGestionsCompany">
							Gestión de <span className="tituloVerde">Actas</span>
						</p>
					</section>

					<section className="sectionGestionsCompanyBody">
						<section className="filterGestionsCompany">
							<strong className="tituloFiltrar">Filtrar por:</strong>
							<article className="filterOptionsGestionsCompany">
								<div className="filterOptionName">
									<label className="labelFilterOption1">ID</label>
									<div className="inputFilterOption1">
										<input
											className="inputFilterOptionText"
											type="text"
											placeholder="Escriba el ID del acta o solicitud"
											value={filtro}
											onChange={(e) => setFiltro(e.target.value)}
										/>
									</div>
								</div>
								<div className="courseStatusFilte">
									<label
										className="labelFilterOption1"
										style={{ padding: "0 0 .5rem 0" }}
									>
										Estado del Acta
									</label>
									<section className="sectionStatusFilter">
										{estadosDisponibles.map((estado) => (
											<p
												key={estado}
												className={`statusOptionActas ${estadosSeleccionados.includes(estado) ? "selected" : ""}`}
												onClick={() => handleEstadoClick(estado)}
											>
												{estado}
											</p>
										))}
									</section>
								</div>
								<div className="courseStatusFilte">
									<label
										className="labelFilterOption1"
										style={{ padding: "0 0 .5rem 0" }}
									>
										Tipo de Acta
									</label>
									<section className="sectionStatusFilter">
										{categoriasDisponibles.map((categoria) => (
											<p
												key={categoria}
												className={`statusOptionActas ${categoriasSeleccionadas.includes(categoria) ? "selected" : ""}`}
												onClick={() => handleCategoriaClick(categoria)}
											>
												{categoria.replaceAll("_", " ")}
											</p>
										))}
									</section>
								</div>
							</article>

							{/* Solo mostrar botón de generar acta a instructores y administradores */}
							{(esInstructor() || esAdministrador() || esGestor()) && (
								<div className="container-button-firmar">
									<button className="button-proceedings-generar" onClick={() => setShowTipoActaModal(true)}>
										Generar acta
									</button>
								</div>
							)}
						</section>

						<section className="resultTableGestionsCompany">
							<label className="labelFilterOption12">
								{actasFiltradas.length} Resultados
								{esInstructor() && <span style={{ fontSize: '12px', color: '#666' }}></span>}
							</label>
							<section className="scrollElement">
								{actas.length === 0 ? (
									<p className="no-results">
										{esInstructor()
											? "No has generado actas aún"
											: "No hay actas registradas"
										}
									</p>
								) : actasFiltradas.length === 0 ? (
									<p className="no-results">No hay actas que coincidan con los filtros</p>
								) : (
									actasFiltradas.map((acta, index) => (
										<div key={index} className="Acta-Contenedor">
											<section className="Contenedor-NombreEmpresa">
												<p className="NombreEmpresaTitulo">
													Acta #{acta.ID}
													<span className="NombreEmpresaSubtitulo">
														{acta.fecha_acta?.slice(0, 10)}
													</span>
												</p>
											</section>
											<section className="Contenedor-categoria">
												<span>
													Tipo: {acta.tipo_acta.replaceAll("_", " ")}
												</span>
											</section>
											<section className="Contenedor-emojis">
												<span style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "auto", height: "auto" }}>
													{acta.estado_acta}
												</span>
											</section>
											<img
												src={seePasswordIcon}
												alt="ver"
												style={{ width: 24, height: 24, cursor: "pointer", marginRight: "2rem" }}
												onClick={() => {
													setNewState()
													setObservation()
													handleVerOpcionesPDF(acta)
												}}
											/>
										</div>
									))
								)}
							</section>
						</section>
					</section>
				</section>
			</Main>
			<Footer />
			{showTipoActaModal && (
				<Modal_General closeModal={() => setShowTipoActaModal(false)}>
					<h3 className="title-modal-acta">Seleccione el tipo de acta</h3>
					<div className="container-modal-acta">
						<div className="option-1Acta" onClick={() => { setTipoActaSeleccionada('concertacion'); setShowTipoActaModal(false); navigate('/Actas/Concertacion'); }}>
							<p>Concertación</p>
							<div className="container-1Acta">
								<img src={agregarArchivo} alt="Concertación" />
							</div>
						</div>
						<div className="option-2Acta" onClick={() => { setTipoActaSeleccionada('lugar-formacion'); setShowTipoActaModal(false); navigate('/Actas/Lugar-formacion'); }}>
							<p>Lugar de formación</p>
							<div className="container-2Acta">
								<img src={agregarArchivo} alt="Validación del lugar" />
							</div>
						</div>
					</div>
				</Modal_General>
			)}
		</div>
	);
};