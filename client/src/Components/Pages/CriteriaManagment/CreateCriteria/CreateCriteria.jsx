import "./CreateCriteria.css"

import { useNavigate, useParams } from "react-router-dom"
import { Header } from "../../../Layouts/Header/Header"
import { Main } from "../../../Layouts/Main/Main"
import { useEffect, useState } from "react"
import { GoBackArrow } from "../../../UI/GoBackArrow/GoBackArrow"
import axiosInstance from "../../../../config/axiosInstance"
import Swal from "sweetalert2";
import 'sweetalert2/themes/bulma.css'

export const CreateCriteria = () => {
	const { id } = useParams()

	const navigate = useNavigate()

	const [title, setTitle] = useState("")
	const [value, setValue] = useState(0)
	const [min, setMin] = useState(0)
	const [description, setDescription] = useState("")
	const [showTypeModal, setShowTypeModal] = useState(false)
	const [criteriaType, setCriteriaType] = useState()
	const [bias, setBias] = useState()

	async function save () {
		try {
			if (!criteriaType) {
				await Swal.fire({
					icon: 'warning',
					title: 'Tipo de criterio requerido',
					text: 'Se debe especificar el tipo de criterio',
					confirmButtonColor: '#3085d6',
					theme: "bulma", // Añadido tema Bulma
					customClass: {
						confirmButton: 'centered-swal-button'
					}
				});
				return
			}

			if (title.length < 1) {
				await Swal.fire({
					icon: 'warning',
					title: 'Nombre requerido',
					text: 'Se debe darle nombre al criterio',
					confirmButtonColor: '#3085d6',
					theme: "bulma", // Añadido tema Bulma
					customClass: {
						confirmButton: 'centered-swal-button'
					}
				});
				return
			}
			if (description.length < 1) {
				await Swal.fire({
					icon: 'warning',
					title: 'Descripción requerida',
					text: 'Se debe escribir la descripción del criterio',
					confirmButtonColor: '#3085d6',
					theme: "bulma", // Añadido tema Bulma
					customClass: {
						confirmButton: 'centered-swal-button'
					}
				});
				return
			}
			if (isNaN(min) && !!criteriaType) {
				await Swal.fire({
					icon: 'error',
					title: 'Valor inválido',
					text: 'El valor mínimo debe ser un número',
					confirmButtonColor: '#d33',
					theme: "bulma", // Añadido tema Bulma
					customClass: {
						confirmButton: 'centered-swal-button'
					}
				});
				return
			}
			
			let body = {}
			body.title = title
			if (!!criteriaType)
				body.min = min
			body.description = description
			body.type = criteriaType
			body.has_value = !!criteriaType
			body.course = id
			if (!!bias)
				body.bias = bias

			const response = await axiosInstance.post("/api/certification/create", body)

			if (response.data.criterio_ID != undefined) {
				navigate(`/Gestiones/Criterios/Curso/${id}`)
				await Swal.fire({
					icon: 'success',
					title: '¡Éxito!',
					text: response.data.message || 'Criterio creado correctamente',
					confirmButtonColor: '#3085d6',
					timer: 3000,
					timerProgressBar: true,
					theme: "bulma", // Añadido tema Bulma
					customClass: {
						confirmButton: 'centered-swal-button'
					}
				});
			} else {
				if (response.data.message)
					await Swal.fire({
						icon: 'warning',
						title: 'Advertencia',
						text: response.data.message,
						confirmButtonColor: '#3085d6',
						theme: "bulma", // Añadido tema Bulma
						customClass: {
							confirmButton: 'centered-swal-button'
						}
					});
			}
		} catch (error) {
			if (error.response?.data?.message)
				await Swal.fire({
					icon: 'error',
					title: 'Error',
					text: error.response.data.message,
					confirmButtonColor: '#d33',
					theme: "bulma", // Añadido tema Bulma
					customClass: {
						confirmButton: 'centered-swal-button'
					}
				});
			else 
				await Swal.fire({
					icon: 'error',
					title: 'Error',
					text: 'Ocurrió un error al crear el criterio de certificación',
					confirmButtonColor: '#d33',
					theme: "bulma", // Añadido tema Bulma
					customClass: {
						confirmButton: 'centered-swal-button'
					}
				});
		}
		//navigate(`/Gestiones/Criterios/Curso/${id}`)
	}

	const userSession = JSON.parse(localStorage.getItem("userSession")) || JSON.parse(sessionStorage.getItem("userSession"))
	const isLoggedIn = !!userSession
	const accountType = userSession?.accountType || null

	useEffect(() => {
		if (isLoggedIn && (accountType === "Instructor" || accountType == "Administrador" || accountType === "Gestor")) {

		} else {
			navigate("/no-autorizado");
		}
	}, [id])

	return(
		<>
			<Header/>
			<Main>
				<div className="container-see-criteria">
					<GoBackArrow/>
					<h2>Criterios de <span className="complementary">Certificación</span></h2>
					<div className="new-criteria-space">
						<div className="criteria-item">
							<div className="criteria-head">
								<input
									className="criteria-create-title"
									placeholder="Añadir un titulo"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
								/>
								{criteriaType != undefined && <span>{value}/{min}</span>}
								<button
									className="select-criteria-type"
									onClick={() => setShowTypeModal(true)}
								>{criteriaType ?? "Tipo de evaluación"}</button>
							</div>
							<div className="criteria-data">
								<textarea 
									className="description-creation criteria-description"
									placeholder="Añadir una descripción..."
									onChange={(e) => setDescription(e.target.value)}
								>
									{description}
								</textarea>
							</div>
						</div>
					</div>
					<div className="end-button">
						<button
							className="button button-red"
							onClick={() => {
								navigate(`/Gestiones/Criterios/Curso/${id}`)
							}}
						>Cancelar</button>
						<button 
							className="button"
							onClick={() => save()}
						>Guardar</button>
					</div>
				</div>
				{showTypeModal && 
				<div className="modal-overlay">
					<div 
						className="modal-background"
						style={{
							height: "fit-content",
							paddingBottom: "20px"
						}}
					>
						<div className="container_return_EditCalendar">
							<h5
								onClick={() => setShowTypeModal(false)}
								style={{ cursor: "pointer" }}
							>Volver</h5>
							<button
								onClick={() => setShowTypeModal(false)}
								className="closeModal">
							</button>
						</div>
						<h2 className="modal-title-edit-calendar">
							Seleccionar tipo de <span className="highlight">criterio</span>
						</h2>
						<div
							className="statusButtons"
							style={{
								width: "90%"
							}}
						>
							{/*<button
								className={`status-btn ${criteriaType == undefined || criteriaType.lenght < 1 ? 'selected' : ''}`}
								onClick={() => setCriteriaType()}
							>
								Ninguno
							</button>*/}
							<button
								className={`status-btn ${criteriaType == "Asistencias" ? 'selected' : ''}`}
								onClick={() => setCriteriaType("Asistencias")}
							>
								Asistencias
							</button>
							<button
								className={`status-btn ${criteriaType == "Calificacion" ? 'selected' : ''}`}
								onClick={() => setCriteriaType("Calificacion")}
							>
								Actividades
							</button>
							{/*<button
								className={`status-btn ${criteriaType == "Horas" ? 'selected' : ''}`}
								onClick={() => setCriteriaType("Horas")}
							>
								Horas
							</button>
							<button
								className={`status-btn ${criteriaType == "Documentos" ? 'selected' : ''}`}
								onClick={() => setCriteriaType("Documentos")}
							>
								Subida de documentos
							</button>*/}
						</div>
						{criteriaType != undefined &&
							<div
								className="create-criteria-field"
							>
								<label>Minimo:</label>
								<input
									type="number"
									className="search-input"
									placeholder="0"
									value={min}
									onChange={(e) => setMin(e.target.value)}
								/>
							</div>
						}
						<div
							className="create-criteria-field"
						>
							<label>Ponderación:</label>
							<input
								type="number"
								className="search-input"
								placeholder="0"
								value={bias}
								onChange={(e) => setBias(e.target.value)}
							/>%
						</div>
						<button
							className="button"
							style={{
								marginTop: "20px"
							}}
							onClick={() => setShowTypeModal(false)}
						>
							Guardar
						</button>
					</div>
				</div>}
			</Main>
		</>
	)
}