import "./SeeCourseCriteria.css"

import { useNavigate, useParams } from "react-router-dom"
import { Header } from "../../../Layouts/Header/Header"
import { Main } from "../../../Layouts/Main/Main"
import { useEffect, useState } from "react"
import { GoBackArrow } from "../../../UI/GoBackArrow/GoBackArrow"
import { PageMover } from "../../../UI/PageMover/PageMover"

export const SeeAllCourseCriteria = () => {
	const { id } = useParams()
	
	const navigate = useNavigate()

	const [editing, setEditing] = useState(false)
	const [loading, setLoading] = useState(true)
	const [criteria, setCriteria] = useState([])
	const [criteriaBackup, setCriteriaBackup] = useState([])

	const [filtering, setFiltering] = useState(false)
	const [searchName, setSearchName] = useState("")
	const [searchDate, setSearchDate] = useState()
	const [searchAuthor, setSearchAuthor] = useState("")
	
	const [page, setPage] = useState(0)
	const [pages, setPages] = useState(1)

	const CourseCriteria = (criteriaData) => {
		if (editing) {
			let myBC = [...criteria]
			let myself = myBC[myBC.findIndex((c) => c.id == criteriaData.id)]
			return (
				<div className="criteria-item" id={criteriaData.id}>
					<div className="criteria-head">
						<input
							className="editing-criteria-title"
							value={criteriaData.title}
							onChange={(e) => {
								myself.title = e.target.value
								setCriteria(myBC)
							}}
						/>
						{criteriaData.has_value && <div className="editing-criteria-values">
							<input 
								value={criteriaData.value} type="number"
								onChange={(e) => {
									myself.value = e.target.value
									setCriteria(myBC)
								}}
							/>
							<span>/</span>
							<input
								value={criteriaData.min} type="number"
								onChange={(e) => {
									myself.min = e.target.value
									setCriteria(myBC)
								}}
							/>
						</div>}
						<div className="bias-input">
							<span>Ponderación</span>
							<input
								type="number"
								value={criteriaData.weight}
								onChange={(e) => {
									myself.weight = e.target.value
									setCriteria(myBC)
								}}
							/>%
						</div>
					</div>
					<textarea
						defaultValue={criteriaData.description}
						className="description-edition criteria-description"
						onChange={(e) => {
							myself.description = e.target.value
							setCriteria(myBC)
						}}
					/>
				</div>
			)
		}
		return (
			<div className="criteria-item" id={criteriaData.id}>
				<div className="criteria-head">
					<span>{criteriaData.title}</span>
					{criteriaData.has_value && <span>{criteriaData.value}/{criteriaData.min}</span>}
				</div>
				<div className="criteria-data">
					<p className="criteria-description">
						{criteriaData.description}
					</p>
					<span className="criteria-date">Creado el {criteriaData.creation.date} a las {criteriaData.creation.hour} por {criteriaData.author} {criteriaData.last_edit != undefined && <><br/>editador por ultima vez el {criteriaData.last_edit.date} a las {criteriaData.last_edit.hour} por {criteriaData.last_edit.author}</>}</span>
				</div>
			</div>
		)
	}

	async function saveChanges () {
		setCriteria(criteriaBackup)
		setEditing(false)
	}

	async function filter () {
		setCriteria(criteriaBackup.filter(
			(c) => {
				let valid = true
				if (searchName.length > 0) {
					valid = valid && c.title.includes(searchName)
				}
				if (searchDate != null) {
					let a = new Date(searchDate)
					a.setDate(a.getDate() + 1)
					valid = valid && c.creation.date == a.toLocaleDateString("es-CO")
				}
				if (searchAuthor.length > 0) {
					valid = valid && c.author.includes(searchAuthor)
				}
				return valid;
			}
		))
	}

	async function fetchCriteria () {
		// PLACEHOLDER BORRAR LUEGO
		let placeholderCriteria = [
			{
				id: 1,
				title: "Asistencias",
				description: "Para garantizar el óptimo aprovechamiento académico y el cumplimiento de los objetivos del curso, es fundamental la asistencia regular y puntual de todos los aprendices. La asistencia mínima obligatoria para ser acreedor a la certificación es del 80%. Considerando la duración total del programa, esto se traduce en que el aprendiz no puede acumular más de 5 inasistencias a lo largo del curso. Superar este límite automáticamente dará lugar a la baja administrativa, sin derecho a la recuperación de contenidos o a la evaluación final.",
				has_value: true,
				min: 20,
				value: 15,
				creation: {
					date: "10/10/2025",
					hour: "8:40"
				},
				author: "Administrador",
				weight: 10
			},
			{
				id: 2,
				title: "Actividades",
				description: "La certificación final del curso está sujeta al cumplimiento integral de las actividades académicas asignadas. Es un requisito indispensable para certificarse que el aprendiz haya entregado la totalidad de las actividades, proyectos y evaluaciones establecidos en el plan de estudios. No estar al día con las entregas, es decir, tener actividades pendientes o sin enviar, imposibilita la certificación automáticamente, ya que demuestra un incompleto dominio de los objetivos de aprendizaje planteados para cada módulo.",
				has_value: true,
				min: 5,
				value: 5,
				creation: {
					date: "10/10/2025",
					hour: "8:40"
				},
				last_edit: {
					date: "10/10/2025",
					hour: "8:45",
					author: "Administrador"
				},
				author: "Administrador",
				weight: 10
			},
			{
				id: 3,
				title: "Evidencias",
				description: "La certificación final del curso está sujeta al cumplimiento integral de las actividades académicas asignadas. Es un requisito indispensable para certificarse que el aprendiz haya entregado la totalidad de las actividades, proyectos y evaluaciones establecidos en el plan de estudios. No estar al día con las entregas, es decir, tener actividades pendientes o sin enviar, imposibilita la certificación automáticamente, ya que demuestra un incompleto dominio de los objetivos de aprendizaje planteados para cada módulo.",
				has_value: true,
				min: 1,
				value: 0,
				creation: {
					date: "10/10/2025",
					hour: "8:40"
				},
				author: "Administrador",
				weight: 20
			},
			{
				id: 4,
				title: "Horas",
				description: "La certificación final del curso está sujeta al cumplimiento integral de las actividades académicas asignadas. Es un requisito indispensable para certificarse que el aprendiz haya entregado la totalidad de las actividades, proyectos y evaluaciones establecidos en el plan de estudios. No estar al día con las entregas, es decir, tener actividades pendientes o sin enviar, imposibilita la certificación automáticamente, ya que demuestra un incompleto dominio de los objetivos de aprendizaje planteados para cada módulo.",
				has_value: true,
				min: 8,
				value: 2,
				creation: {
					date: "10/10/2025",
					hour: "8:40"
				},
				author: "Administrador",
				weight: 60
			},
			{
				id: 5,
				title: "Existir",
				description: "La certificación final del curso está sujeta al cumplimiento integral de las actividades académicas asignadas. Es un requisito indispensable para certificarse que el aprendiz haya entregado la totalidad de las actividades, proyectos y evaluaciones establecidos en el plan de estudios. No estar al día con las entregas, es decir, tener actividades pendientes o sin enviar, imposibilita la certificación automáticamente, ya que demuestra un incompleto dominio de los objetivos de aprendizaje planteados para cada módulo.",
				has_value: false,
				creation: {
					date: "10/10/2025",
					hour: "8:40"
				},
				author: "Administrador",
				weight: 60
			}
		]
		setCriteria(placeholderCriteria)
		setCriteriaBackup(placeholderCriteria)
		setLoading(false)
	}

	useEffect(() => {
		fetchCriteria()
	}, [])

	return (
		<>
			<Header/>
			<Main>
				<div class="container-see-criteria">
					<GoBackArrow/>
					<h2>Criterios de <span className="complementary">Certificación</span></h2>
					<div className="buttons-right">
						{
							editing ?
								<>
									<button
										className="button button-red"
										onClick={() => {
											setEditing(false)
											setCriteria(criteriaBackup)
										}}
									>
										Cancelar
									</button>
									<button
										className="button"
										onClick={() => saveChanges()}
									>
										Guardar
									</button>
								</>
							:
								<>
									<button
										className="button"
										onClick={() => {
											navigate(`/Gestiones/Criterios/Crear/${id}`)
										}}
									>
										+
									</button>
									<button
										className="button"
										onClick={() => setEditing(true)}
									>
										Editar
									</button>
								</>
						}
						<button
							className="button"
							onClick={() => setFiltering(!filtering)}
						>
							Filtrar {filtering ? <>&#9662;</> : <>&#9652;</>}
						</button>
					</div>
					<div className="criteriaBox">
						{loading ? 
							"Cargando..."
						:
							criteria.length > 0 ? 
								criteria.map((c) => CourseCriteria(c))
							:
								"No hay criterios por el momento."
						}
					</div>
					<PageMover
						value={page + 1}
						max={pages}
						next={() => {
							setPage(page + 1)
						}}
						prev={() => {
							setPage(page - 1)
						}}
					/>
					<button className="button end-button">Descargar</button>
				</div>
				{filtering &&
					<div
						className="options_Search search-aprentice"
						style={{
							right: "5%"
						}}
					>
						<label>Nombre del criterio:</label>
						<input
							type="text"
							className="search-input"
							placeholder="Nombre..."
							value={searchName}
							onChange={(e) => setSearchName(e.target.value)}
						/>
						<label>Fecha de registro:</label>
						<input
							type="date"
							className="search-input"
							value={searchDate}
							onChange={(e) => setSearchDate(e.target.value)}
						/>
						<label>Autor:</label>
						<input
							type="text"
							className="search-input"
							placeholder="..."
							value={searchAuthor}
							onChange={(e) => setSearchAuthor(e.target.value)}
						/>
						<button
							className="button"
							style={{
								alignSelf: "center",
								marginTop: "2%"
							}}
							onClick={() => filter()}
						>
							Filtrar
						</button>
					</div>
				}
			</Main>
		</>
	)
}