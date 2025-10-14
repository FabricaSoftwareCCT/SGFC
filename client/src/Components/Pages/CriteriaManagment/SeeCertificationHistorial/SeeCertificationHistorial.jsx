import "./SeeCertificationHistorial.css"

import { Header } from "../../../Layouts/Header/Header"
import { Main } from "../../../Layouts/Main/Main"
import { GoBackArrow } from "../../../UI/GoBackArrow/GoBackArrow"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"

export const SeeCertificationHistorial = () => {
	const navigate = useNavigate()

	const [showFilters, setShowFilters] = useState(false)
	const [filterName, setFilterName] = useState("")
	const [filterDate, setFilterDate] = useState()
	const [filterId, setFilterId] = useState("")

	const [aprentices, setAprentices] = useState([])

	const userSession = JSON.parse(localStorage.getItem("userSession")) || JSON.parse(sessionStorage.getItem("userSession"))
	const isLoggedIn = !!userSession
	const accountType = userSession?.accountType || null

	async function fetchAprentices () {

	}

	async function filter () {
		
	}

	useEffect(() => {
		if (isLoggedIn && (accountType === "Instructor" || accountType == "Administrador" || accountType === "Gestor")) {
			fetchAprentices()
		} else {
			navigate("/no-autorizado");
		}
	}, [])

	return <>
		<Header/>
		<GoBackArrow/>
		<Main>
			<div class="container-see-criteria">
				<h2>Historial de <span className="complementary">certificación</span></h2>
				<div 
					className="buttons"
					style={{
						flexDirection: "row-reverse"
					}}
				>
					<button 
						className="button criteria-aprentice-filter-dropdown"
						onClick={() => setShowFilters(!showFilters)}
					>
						Filtro {showFilters ? <>&#9662;</> : <>&#9652;</>}
					</button>
				</div>
			</div>
			{showFilters &&
				<div className="options_Search search-aprentice">
					<label>Aprendiz:</label>
					<input
						type="text"
						className="search-input"
						placeholder="Nombre..."
						value={filterName}
						onChange={(e) => setFilterName(e.target.value)}
					/>
					<label>Documento:</label>
					<input
						type="text"
						className="search-input"
						placeholder="N. del documento..."
						value={filterId}
						onChange={(e) => setFilterId(e.target.value)}
					/>
					<label>Fecha:</label>
					<input
						type="date"
						className="search-input"
						value={filterDate}
						onChange={(e) => setFilterDate(e.target.value)}
					/>
					<button
						style={{
							alignSelf: "center",
							marginTop: "2%"
						}}
						className="button"
						onClick={() => filter()}
					>Filtrar</button>
				</div>
			}
		</Main>
	</>
}