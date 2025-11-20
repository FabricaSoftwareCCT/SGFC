import "./Criteria.css"
import { useNavigate } from "react-router-dom";
import { Header } from "../../Layouts/Header/Header";
import { useEffect, useState } from "react";
import { Main } from "../../Layouts/Main/Main";
import axiosInstance from "../../../config/axiosInstance";
import { CourseList } from "../../UI/CourseList/CourseList";
import Swal from "sweetalert2";
import 'sweetalert2/themes/bulma.css'

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
		let courses = []
		try {
			switch (accountType) {
				case "Administrador":
					response = await axiosInstance.get("/api/courses/cursos")
					courses = response.data
					break
				case "Instructor":
					const instructorId = userSession.ID || userSession.id;
					response = await axiosInstance.get(`/api/courses/cursos-asignados/${instructorId}`)
					courses = response.data.map((curso) => ({
						...curso.Curso
					}))
					break
				case "Gestor":
					response = await axiosInstance.get("/api/courses/cursos")
					courses = response.data
					break
			}
			if (response.status != 200 && response.status != 304) {
				throw response.data
			}
			const todosLosCursos = courses.map(curso => ({
				...curso,
				ID: curso.ID || curso.id,
			}));
			setCursos(todosLosCursos)
			setLoading(false)
		} catch (e) {
			console.log(e)
			await Swal.fire({
				icon: 'error',
				title: 'Error',
				text: 'Ocurrió un error al cargar los cursos',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#d33',
				theme: "bulma", // Añadido tema Bulma
				customClass: {
					confirmButton: 'centered-swal-button'
				}
			});
		}
	}

	function getCurso () {
        const index = (current + cursos.length) % cursos.length;
        return cursos[index];
    };

	function seeCourseCriteria () {
		const curso = getCurso()
		navigate(`/Gestiones/Criterios/Ver/${curso?.ID}`)
	}

	function seeCourseCriteriaHistorial () {
		navigate(`/Gestiones/Criterios/Historial/${getCurso()?.ID}`)
	}

	useEffect(() => {
		if (isLoggedIn && (accountType === "Instructor" || accountType == "Administrador" || accountType === "Gestor")) {
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