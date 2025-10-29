import "./SeeCourseCriteria.css"

import { useNavigate, useParams } from "react-router-dom"
import { Header } from "../../../Layouts/Header/Header"
import { Main } from "../../../Layouts/Main/Main"
import { useEffect, useState } from "react"
import { GoBackArrow } from "../../../UI/GoBackArrow/GoBackArrow"
import { PageMover } from "../../../UI/PageMover/PageMover"
import axiosInstance from "../../../../config/axiosInstance"

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
	const [totalAmount, setTotalAmount] = useState(0)
	const [editedCriteria, setEditedCriteria] = useState([])
	
	const [page, setPage] = useState(0)
	const [pages, setPages] = useState(1)

	const CourseCriteria = (criteriaData) => {
		if (editing) {
			let myBC = [...criteria]
			let myself = myBC[myBC.findIndex((c) => c.id == criteriaData.id)]
			function markEdited () {
				if (!editedCriteria.includes(criteriaData.id)) {
					setEditedCriteria([
						...editedCriteria,
						criteriaData.id
					])
				}
			}
			return (
				<div key={criteriaData.id} className="criteria-item" id={criteriaData.id}>
					<div className="criteria-head">
						<input
							className="editing-criteria-title"
							value={criteriaData.title}
							onChange={(e) => {
								markEdited()
								myself.title = e.target.value
								setCriteria(myBC)
							}}
						/>
						{criteriaData.has_value && <div className="editing-criteria-values">
							<input 
								value={criteriaData.value} type="number"
								onChange={(e) => {
									markEdited()
									myself.value = e.target.value
									setCriteria(myBC)
								}}
								disabled
							/>
							<span>/</span>
							<input
								value={criteriaData.min} type="number"
								onChange={(e) => {
									markEdited()
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
									markEdited()
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
							markEdited()
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
					{criteriaData.has_value && <span>{criteriaData.value ?? 0}/{criteriaData.min}</span>}
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
		for (let criteriaID of editedCriteria) {
			try {
				let response = await axiosInstance.put(`/api/certification/update/${criteriaID}`, {
					...criteria.find((c) => c.id == criteriaID),
					course: id
				})
				if (response.status != 200 && response.status != 304) {
					throw response.data
				}
			} catch (error) {
				console.error(error)
				alert("Ocurrió un error al actualizar los criterios")
			}
		}
		setEditing(false)
		fetchCriteria()
	}

	async function filter () {
		try {
			let response = await axiosInstance.get(`/api/certification/course/${id}?page=${page}${
				searchName.length > 0 ? `&name=${searchName}` : ""
			}${
				searchDate ? `&date=${(new Date(searchDate)).getTime()}` : ""
			}${
				searchAuthor.length > 0 ? `&author=${searchAuthor}` : ""
			}`)
			if (response.status != 200 && response.status != 304) {
				throw response.data
			}
			setCriteria(response.data.criteria)
			setCriteriaBackup(response.data.criteria)
			setPages(response.data.max_pages)
			setTotalAmount(response.data.total)
		} catch (e) {
			console.log(e)
			alert("Ocurrió un error al buscar los criterios")
		}
	}

	async function fetchCriteria () {
		try {
			let response = await axiosInstance.get(`/api/certification/course/${id}?page=${page}`)
			if (response.status != 200 && response.status != 304) {
				throw response.data
			}
			setCriteria(response.data.criteria)
			setCriteriaBackup(response.data.criteria)
			setPages(response.data.max_pages)
			setTotalAmount(response.data.total)
			setLoading(false)
		} catch (e) {
			console.log(e)
			alert("Ocurrió un error al cargar los criterios")
		}
	}

	const userSession = JSON.parse(localStorage.getItem("userSession")) || JSON.parse(sessionStorage.getItem("userSession"))
	const isLoggedIn = !!userSession
	const accountType = userSession?.accountType || null

	useEffect(() => {
		if (isLoggedIn && (accountType === "Instructor" || accountType == "Administrador" || accountType === "Gestor")) {
			fetchCriteria()
		} else {
			navigate("/no-autorizado");
		}
	}, [id])

	useEffect(() => {
		setLoading(true)
		if (isLoggedIn && (accountType === "Instructor" || accountType == "Administrador" || accountType === "Gestor")) {
			fetchCriteria(page)
		} else {
			navigate("/no-autorizado");
		}
	}, [page])

	return (
		<>
			<Header/>
			<Main>
				<div className="container-see-criteria">
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
							id="filtrar-button"
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