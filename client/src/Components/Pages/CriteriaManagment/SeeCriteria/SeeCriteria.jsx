import "./SeeCriteria.css"

import { Header } from "../../../Layouts/Header/Header";
import { Main } from "../../../Layouts/Main/Main";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../../config/axiosInstance";

export const SeeCourseCriteria = () => {
	const navigate = useNavigate()

	const { id } = useParams()

	const [curso, setCurso] = useState()
	const [aprentices, setAprentices] = useState([])
	const [showFilters, setShowFilters] = useState(false)
	const [aprenticeName, setAprenticeName] = useState("")
	const [aprenticeStatus, setAprenticeStatus] = useState(0)
	const [ficha, setFicha] = useState("")
	const [personId, setPersonId] = useState("")

	async function fetchCourse () {
		try {
			const response = await axiosInstance.get(`api/courses/cursos/${id}`);
			setCurso(response.data);
			console.log(response.data)
		} catch (error) {
			console.error("Error al obtener el curso:", error);
		}
	}

	function selectStatus (s) {
		if (aprenticeStatus == s) {
			setAprenticeStatus(0)
		} else {
			setAprenticeStatus(s)
		}
	}

	useEffect(() => {
		fetchCourse()
	}, [id])

	useEffect(() => {

	}, [aprenticeName, aprenticeStatus, personId, ficha])

	return (
		<>
			<Header/>
			<Main>
				<div class="container-see-criteria">
					<h2>Criterios de <span className="complementary">Certificación</span></h2>
					<div className="buttons">
						<button 
							className="button see-criteria-button"
							onClick={() => navigate("/Gestiones/Criterios/Curso/1")}
						>
							Ver criterios
						</button>
						<button 
							className="button criteria-aprentice-filter-dropdown"
							onClick={() => setShowFilters(!showFilters)}
						>
							Filtro {showFilters ? <>&#9662;</> : <>&#9652;</>}
						</button>
					</div>
					{showFilters &&
						<div className="options_Search search-aprentice">
							<label>Aprendiz:</label>
							<input
								type="text"
								className="search-input"
								placeholder="Nombre..."
								value={aprenticeName}
								onChange={(e) => setAprenticeName(e.target.value)}
							/>
							<label>Ficha:</label>
							<input
								type="text"
								className="search-input"
								placeholder="Nombre de la ficha..."
								value={aprenticeName}
								onChange={(e) => setFicha(e.target.value)}
							/>
							<label>Documento:</label>
							<input
								type="text"
								className="search-input"
								placeholder="N. del documento..."
								value={aprenticeName}
								onChange={(e) => setPersonId(e.target.value)}
							/>
							<label htmlFor="estado">Estado:</label>
							<div className="statusButtons">
								<button
									className={`status-btn ${aprenticeStatus == 1 ? 'selected' : ''}`}
									onClick={() => selectStatus(1)}
								>
									Activo
								</button>
								<button
									className={`status-btn ${aprenticeStatus == -1 ? 'selected' : ''}`}
									onClick={() => selectStatus(-1)}
								>
									Inactivo
								</button>
							</div>
						</div>
					}
					<div className="aprentice-list-container">
						<div className="aprentice-list-header">
							<span>Aprendiz</span>
							<span>Documentos</span>
							<span>Fichas</span>
							<span>Estado de certificación</span>
							<span>Detalles</span>
						</div>
						{
							aprentices.length > 0 ?
								<div/>
							:
								<div className="no-aprentices-list">El curso aún no tiene aprendices asignados</div>
						}
					</div>
					<button className="button end-button">Generar reporte</button>
				</div>
			</Main>
		</>
	);
}