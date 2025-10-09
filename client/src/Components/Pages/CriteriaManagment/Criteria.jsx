import "./Criteria.css"
import { useNavigate } from "react-router-dom";
import { Header } from "../../Layouts/Header/Header";
import { useEffect, useState } from "react";
import { Main } from "../../Layouts/Main/Main";
import axiosInstance from "../../../config/axiosInstance";
import { CourseList } from "../../UI/CourseList/CourseList";

export const CriteriaManagement = () => {
	const navigate = useNavigate()

	const userSession = JSON.parse(localStorage.getItem("userSession")) || JSON.parse(sessionStorage.getItem("userSession"))

	const isLoggedIn = !!userSession
	const accountType = userSession?.accountType || null

	const [cursos, setCursos] = useState([])
	const [loading, setLoading] = useState(true)
	const [current, setCurrent] = useState(0)

	async function fetchCourses () {
		let response = null
		if (accountType === "Administrador") {
			response = await axiosInstance.get("/api/courses/cursos")
		} else if (accountType === "Instructor") {
			const instructorId = userSession.ID || userSession.id;
			response = await axiosInstance.get(`/api/courses/cursos-asignados/${instructorId}`);
		}
		const todosLosCursos = response.data.map(curso => ({
			...curso,
			ID: curso.ID || curso.id,
		}));
		setCursos(todosLosCursos)
		setLoading(false)
	}

	function getCurso () {
        const index = (current + cursos.length) % cursos.length;
        return cursos[index];
    };

	function seeCourseCriteria () {
		console.log(getCurso())
		navigate(`/Gestiones/Criterios/Ver/${getCurso().ID}`)
	}

	function seeCourseCriteriaHistorial () {

	}

	useEffect(() => {
		if (accountType === "Instructor" || accountType == "Administrador") {
			fetchCourses()
		} else {
			navigate("/no-autorizado");
		}
	}, [])

	return (
		<>
			<Header/>
			<Main>
				<div className="container_criteria">
					<h2>Criterios de <span className="complementary">Certificación</span></h2>
					<button 
						className="button history"
						onClick={() => seeCourseCriteriaHistorial()}
					>
						Historial de certificación
					</button>
					<div className="course-list-container">
						<CourseList cursos={cursos} loading={loading} onChange={(c) => setCurrent(c)}/>
					</div>
					<button 
						className="button see-criteria"
						onClick={() => seeCourseCriteria()}
					>
						Ver criterios
					</button>
				</div>
			</Main>
		</>
	);
}