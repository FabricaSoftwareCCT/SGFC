import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../../Layouts/Header/Header';
import { Footer } from '../../../Layouts/Footer/Footer';
import { Main } from '../../../Layouts/Main/Main';
import './SupportMaterial.css';
import axiosInstance from '../../../../config/axiosInstance';
import { useEffect } from 'react';

export const SupportMaterial = () => {
	const navigate = useNavigate();
	const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
	const [editingMaterial, setEditingMaterial] = useState(false)
	const [subiendoArchivo, setSubiendoArchivo] = useState(false);
	const [showMaterialCreation, setShowMaterialCreation] = useState(false);
	const [tipoUsuario, setTipoUsuario] = useState('');
	const [materialType, setMaterialType] = useState("PDF");
	const [material, setMaterial] = useState("");
	const [cursos, setCursos] = useState([]);
	const [archivos, setArchivos] = useState([]);
	const [uploadFile, setUploadFile] = useState()

	const userSession = JSON.parse(localStorage.getItem('userSession')) || JSON.parse(sessionStorage.getItem('userSession'))
	const accountType = userSession?.accountType

	const fetchCursos = async () => {
		try {
			const resp = await axiosInstance.get("/api/courses/cursos")
			setCursos(resp.data)
		} catch (error) {
			console.log(error)
			alert("Ocurrió un error al consultar los cursos")
		}
	}

	const fetchMaterial = async (curso) => {
		try {
			const resp = await axiosInstance.get(`/api/material/${curso.ID}`)
			setArchivos(resp.data.materiales)
		} catch (error) {
			console.log(error)
			alert("Ocurrió un error al consultar el material de apoyo del curso")
		}
	}

	const handleSeleccionarCurso = (curso) => {
		setCursoSeleccionado(curso);
		fetchMaterial(curso)
	}

	const handleFileUpload = (event) => {
		const file = event.target.files[0];
		if (!file || !cursoSeleccionado) return;
		setUploadFile(file)
	}
	
	const handleEliminarArchivo = (archivoId) => {
		if (window.confirm('¿Estás seguro de que quieres eliminar este archivo?')) {
			eliminarMaterial(archivoId)
		}
	}

	const truncarNombreArchivo = (nombre, maxLongitud = 15) => {
		if (!nombre) return '';

		const ultimoPunto = nombre.lastIndexOf('.');
		if (ultimoPunto === -1) {
			return nombre.length > maxLongitud 
				? `${nombre.slice(0, maxLongitud)}...`
				: nombre;
		}

		const nombreParte = nombre.slice(0, ultimoPunto);
		const extension = nombre.slice(ultimoPunto);

		if (nombreParte.length <= maxLongitud) {
			return nombre;
		}

		return `${nombreParte.slice(0, maxLongitud)}... ${extension}`;
	};

	const crearMaterial = async () => {
		setSubiendoArchivo(true)
		try {
			const body = new FormData()
			let resp
			switch (materialType) {
				case "PDF":
					if (!uploadFile) {
						alert("Se debe proporcionar un archivo PDF")
						return
					}
					body.append("document_pdf", uploadFile)
					body.append("tipo", materialType.toLowerCase())
					resp = await axiosInstance.post(`/api/material/create/${cursoSeleccionado.ID}`, body, {
						headers: { "Content-Type": "multipart/form-data" },
					})
					setShowMaterialCreation(false)
					alert(resp.data.message)
					setUploadFile(null)
					fetchMaterial(cursoSeleccionado)
					break
				case "Video":
					if (!uploadFile) {
						alert("Se debe proporcionar un video MP4")
						return
					}
					body.append("video", uploadFile)
					body.append("tipo", materialType.toLowerCase())
					resp = await axiosInstance.post(`/api/material/create/${cursoSeleccionado.ID}`, body, {
						headers: { "Content-Type": "multipart/form-data" },
					})
					setShowMaterialCreation(false)
					alert(resp.data.message)
					setUploadFile(null)
					fetchMaterial(cursoSeleccionado)
					break
				case "Enlace":
					if (material.length < 1) {
						alert("Se debe proporcionar un enlace")
						return
					}
					resp = await axiosInstance.post(`/api/material/create/${cursoSeleccionado.ID}`, {
						tipo: materialType.toLowerCase(),
						link: material
					})
					fetchMaterial(cursoSeleccionado)
					setMaterial("")
					setShowMaterialCreation(false)
					alert(resp.data.message)
					break
			}
			setSubiendoArchivo(false)
			await axiosInstance.post("/api/notifications/materialApoyo", {
				curso_ID: cursoSeleccionado.ID
			})
		} catch (error) {
			console.log(error)
			alert("Ocurrió un error al crear el material de apoyo")
			setSubiendoArchivo(false)
		}
	}

	const editarMaterial = async () => {
		try {
			switch (editingMaterial.tipo_contenido) {
				case "pdf":
					break
				case "video":
					break
				case "link":
					if (editingMaterial.contenido.length < 1) {
						alert("Se debe proporcionar un enlace")
						return
					}
					const resp = await axiosInstance.put(`/api/material/update/${editingMaterial.ID}`, {
						link: editingMaterial.contenido
					})
					fetchMaterial(cursoSeleccionado)
					alert(resp.data.message)
					setEditingMaterial(null)
					break
			}
		} catch (error) {
			console.log(error)
			alert("Ocurrió un error al actualizar el material de apoyo")
			setEditingMaterial(null)
		}
	}

	const eliminarMaterial = async (id) => {
		try {
			const resp = await axiosInstance.delete(`/api/material/delete/${id}`)
			fetchMaterial(cursoSeleccionado)
			alert(resp.data.message)
		} catch (error) {
			console.log(error)
			alert("Ocurrió un error al eliminar el material de apoyo")
		}
	}

	const esAprendiz = accountType === 'Aprendiz';
	const puedeSubirArchivos = (accountType == "Administrador" || accountType == "Instructor") && (accountType == "Instructor" ? cursoSeleccionado.instructor_ID === userSession.id : true);
	const puedeEliminarArchivos = (accountType == "Administrador" || accountType == "Instructor");

	useEffect(() => {
		fetchCursos()
	}, [])

	return (
		<>
			<Header />
			<Main className="material-main">
				<div className="material-container">
					<div className='material-content'>
						<div className='cursos-section'>
							<h2>Selecciona un Curso</h2>
							<div className='cursos-grid'>
								{cursos.map(curso => (
									<div 
										key={curso.ID} 
										className={`curso-card ${cursoSeleccionado?.ID === curso.ID ? 'selected' : ''}`}
										onClick={() => handleSeleccionarCurso(curso)}
									>
										<h3>
											{curso.nombre_curso}<br />
											Ficha: {curso.ficha}<br />
											Estado: {curso.estado}
										</h3>
									</div>     
								))}
						</div>
					</div>
						{cursoSeleccionado && (
							<div className='archivos-section'>
								<div className='archivos-header'>
									<h2>Material de Apoyo - {cursoSeleccionado.nombre_curso}</h2>
									{puedeSubirArchivos && (
										<div className='upload-section'>
											<button
												className='upload-btn'
												onClick={() => setShowMaterialCreation(true)}
											>Crear material</button>
										</div>
									)}  
								</div>
									<div className='archivos-list'>
										{archivos.length === 0 ? (
											<p className='no-archivos'>No hay archivos subidos a este curso</p>
										) : (
											archivos.map(archivo => (
												<div key={archivo.id} className='archivo-item'>
													<div className='archivo-info'>
														{archivo.tipo_contenido != "link" ? (
															<>
																<span className='archivo-nombre'>{truncarNombreArchivo(archivo.nombre_original, 12)}</span>
																<span className='archivo-detalles'>
																	{(archivo.tamanio / 1024 / 1024).toFixed(2)}MB - Subido el {new Date(archivo.fecha_subida).toLocaleDateString("es-CO")}
																</span>
															</>
														) : (
															editingMaterial && archivo.ID == editingMaterial.ID ?
																<input
																	className='material-link'
																	type='text'
																	value={editingMaterial.contenido}
																	onChange={(e) => {
																		setEditingMaterial({
																			...editingMaterial,
																			contenido: e.target.value
																		})
																	}}
																/>
															:
																<a
																	className="material-link"
																	href={archivo.contenido}
																	target="_blank"
																	rel="noopener noreferrer"
																>{archivo.contenido}</a>
														)}
													</div>
													<div className='archivo-actions'>  
														{editingMaterial && archivo.ID == editingMaterial.ID ?
															<>
																<button
																	className='btn-editar'
																	onClick={() => editarMaterial()}
																>Guardar</button>
																<button 
																	className='btn-eliminar' 
																	onClick={() => setEditingMaterial(null)}
																>
																	Cancelar
																</button>
															</>
														:
															<>
																{(puedeEliminarArchivos && archivo.tipo_contenido === "link") && (
																	<button
																		className='btn-editar'
																		onClick={() => setEditingMaterial(archivo)}
																	>Editar</button>
																)}
																{archivo.tipo_contenido != "link" && (
																	<>
																		<a 
																			className='btn-descargar' 
																			href={`http://localhost:3001${archivo.contenido}`} 
																			target="_blank"
																			rel="noopener noreferrer"
																			download
																		>
																			Descargar
																		</a>
																	</>
																)}
																{puedeEliminarArchivos && (
																	<button 
																		className='btn-eliminar' 
																		onClick={() => handleEliminarArchivo(archivo.ID)}
																	>
																		Eliminar
																	</button>
																)}
															</>	
														}
													</div>
												</div>    
											))
										)}
								</div> 
							</div>           
						)}
					</div>
				</div>
			</Main>
			<Footer/>
			{showMaterialCreation && (
				<div id="modal-overlayUpdateInstructor" style={{ display: "flex" }}>
					<div 
						className="modal-bodyUpdateInstructor"
						style={{
							flexDirection: "column"
						}}
					>
						<div className="container_return_UpdateInstructor">
							<h5>Volver</h5>
							<button type="button" onClick={() => setShowMaterialCreation(false)} className="closeModal"></button>
						</div>
						<h2 className="modal-title-edit-calendar">
							Crear material de apoyo
						</h2>
						<br/>
						<span>Tipo de material</span>
						<div
							className="statusButtons"
							style={{
								width: "90%"
							}}
						>
							{["PDF", "Video", "Enlace"].map((t) => (
								<button
									className={`status-btn ${materialType == t ? 'selected' : ''}`}
									onClick={() => setMaterialType(t)}
								>{t}</button>
							))}
						</div>
						<br/>
						<span>Material</span>
						{(materialType === "PDF" || materialType === "Video") && (
							<>
								<label
									htmlFor='file-upload'
									className='upload-btn'
									style={{
										flex: "none"
									}}
								>
									Subir archivo
								</label>
								<input
									id="file-upload"
									type="file"
									onChange={handleFileUpload}
									disabled={subiendoArchivo}
									style={{ display: 'none' }}
								/>
							</>
						)}
						{materialType === "Enlace" && (
							<div
								className='statusButtons'
								style={{
									width: "90%"
								}}
							>
								<input
									className="inputFilterOptionText"
									type="text"
									placeholder='Ponga aquí el enlace al material...'
									onChange={(e) => setMaterial(e.target.value)}
									value={material}
								/>
							</div>
						)}
						<br/>
						{puedeSubirArchivos && (
							<button
								className='upload-btn'
								style={{
									flex: "none"
								}}
								disabled={subiendoArchivo}
								onClick={() => crearMaterial()}
							>Crear material</button>
						)}
					</div>
				</div>
			)}
		</>
	);
}