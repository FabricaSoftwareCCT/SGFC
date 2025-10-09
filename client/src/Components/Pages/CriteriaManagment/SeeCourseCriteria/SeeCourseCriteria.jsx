import "./SeeCourseCriteria.css"

import { useNavigate, useParams } from "react-router-dom"
import { Header } from "../../../Layouts/Header/Header"
import { Main } from "../../../Layouts/Main/Main"
import { useEffect, useState } from "react"

export const SeeAllCourseCriteria = () => {
	const { id } = useParams()
	
	const navigate = useNavigate()

	const [editing, setEditing] = useState(false)
	const [loading, setLoading] = useState(true)
	const [criteria, setCriteria] = useState([])
	const [criteriaBackup, setCriteriaBackup] = useState([])

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
						<div className="editing-criteria-values">
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
					<span>{criteriaData.value}/{criteriaData.min}</span>
				</div>
				<p className="criteria-description">
					{criteriaData.description}
				</p>
			</div>
		)
	}

	async function saveChanges () {
		setCriteria(criteriaBackup)
		setEditing(false)
	}

	async function fetchCriteria () {
		// PLACEHOLDER BORRAR LUEGO
		let placeholderCriteria = [
			{
				"id": 1,
				"title": "Asistencias",
				"description": "Para garantizar el óptimo aprovechamiento académico y el cumplimiento de los objetivos del curso, es fundamental la asistencia regular y puntual de todos los aprendices. La asistencia mínima obligatoria para ser acreedor a la certificación es del 80%. Considerando la duración total del programa, esto se traduce en que el aprendiz no puede acumular más de 5 inasistencias a lo largo del curso. Superar este límite automáticamente dará lugar a la baja administrativa, sin derecho a la recuperación de contenidos o a la evaluación final.",
				"min": 20,
				"value": 15
			},
			{
				"id": 2,
				"title": "Actividades",
				"description": "La certificación final del curso está sujeta al cumplimiento integral de las actividades académicas asignadas. Es un requisito indispensable para certificarse que el aprendiz haya entregado la totalidad de las actividades, proyectos y evaluaciones establecidos en el plan de estudios. No estar al día con las entregas, es decir, tener actividades pendientes o sin enviar, imposibilita la certificación automáticamente, ya que demuestra un incompleto dominio de los objetivos de aprendizaje planteados para cada módulo.",
				"min": 5,
				"value": 5
			},
			{
				"id": 3,
				"title": "Evidencias",
				"description": "La certificación final del curso está sujeta al cumplimiento integral de las actividades académicas asignadas. Es un requisito indispensable para certificarse que el aprendiz haya entregado la totalidad de las actividades, proyectos y evaluaciones establecidos en el plan de estudios. No estar al día con las entregas, es decir, tener actividades pendientes o sin enviar, imposibilita la certificación automáticamente, ya que demuestra un incompleto dominio de los objetivos de aprendizaje planteados para cada módulo.",
				"min": 1,
				"value": 0
			},
			{
				"id": 4,
				"title": "Horas",
				"description": "La certificación final del curso está sujeta al cumplimiento integral de las actividades académicas asignadas. Es un requisito indispensable para certificarse que el aprendiz haya entregado la totalidad de las actividades, proyectos y evaluaciones establecidos en el plan de estudios. No estar al día con las entregas, es decir, tener actividades pendientes o sin enviar, imposibilita la certificación automáticamente, ya que demuestra un incompleto dominio de los objetivos de aprendizaje planteados para cada módulo.",
				"min": 8,
				"value": 2
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
				</div>
			</Main>
		</>
	)
}