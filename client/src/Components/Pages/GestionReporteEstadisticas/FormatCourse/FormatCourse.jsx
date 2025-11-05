import { useEffect, useState } from "react"
import axiosInstance from "../../../../config/axiosInstance"

export const FormatCourse = ({ contentKey, cursos, done }) => {
	const [cursosData, setCursosData] = useState([])
	const [employeeData, setEmployeeData] = useState([])

	const loadData = async () => {
		let cursosList = []
		for (let c of cursos) {
			let resp = await axiosInstance.get(`/api/courses/cursos/${c}`)
			cursosList.push(resp.data)
		}
		setCursosData(cursosList)
		const eResp = await axiosInstance.get(`/api/users/admin/empleados?limit=99999`)
		setEmployeeData(eResp.data.empleados)
		setTimeout(() => done(), 100)
	}

	useEffect(() => {
		loadData()
	}, [])

	const tdStyle = {
		color: "#000",
		border: "1px solid",
		fontSize: "10px",
		padding: "5px"
	}

	return (
		<div
			className="letter-content apa-style" 
			ref={contentKey}
			style={{
				backgroundColor: "#FFF",
				margin: "10px",
				color: "#000"
			}}
		>
			<h1
				style={{	
					display: "flex",
					justifyContent: "center",
					color: "#000"
				}}
			>REPORTE DE CURSOS Y EMPLEADOS</h1>
			<span
				style={{
					color: "#000",
					marginTop: "20px",
					display: "inline-block"
				}}
			><b style={{color: "#000"}}>Consultado el: </b> {new Date().toLocaleString("es-CO")}</span>
			<h3 style={{
				color: "#000",
				marginTop: "10px"
			}}>Cursos</h3>
			<table style={{
				marginTop: "10px",
				borderCollapse: "collapse",
				border: "1px solid",
				padding: "0px",
				width: "100%"
			}}>
				<thead>
					<tr>
						{["Curso", "Tipo", "Estado", "Ficha", "Inicio", "Fin", "Duración (días)", "Lugar", "Instructor", "Cant. Aprendices"].map((h) => 
							<th
								style={{
									color: "#000",
									border: "1px solid",
									fontSize: "10px"
								}}
							>{h}</th>
						)}
					</tr>
				</thead>
				<tbody>
					{cursosData.map((c) => {
						return (
							<tr>
								<td
									style={tdStyle}
								>{c.nombre_curso}</td>
								<td
									style={tdStyle}
								>{c.tipo_oferta}</td>
								<td
									style={tdStyle}
								>{c.estado}</td>
								<td
									style={tdStyle}
								>{c.ficha}</td>
								<td
									style={tdStyle}
								>{new Date(c.fecha_inicio).toLocaleDateString("es-CO")}</td>
								<td
									style={tdStyle}
								>{new Date(c.fecha_fin).toLocaleDateString("es-CO")}</td>
								<td
									style={tdStyle}
								>{c.duracion_dias ?? "Sin determinar"}</td>
								<td
									style={tdStyle}
								>{c.lugar_formacion ?? "Sin especificar"}</td>
								<td
									style={tdStyle}
								>{c.Instructor ? `${c.Instructor.nombres} ${c.Instructor.apellidos}` : "Pendiente"}</td>
								<td
									style={tdStyle}
								>{c.cupos_usados}</td>
							</tr>
						)
					})}
				</tbody>
			</table>
			<h3 style={{
				marginTop: "10px",
				color: "#000"
			}}>Empleados</h3>
			<table style={{
				marginTop: "10px",
				borderCollapse: "collapse",
				border: "1px solid",
				padding: "0px",
				width: "100%"
			}}>
				<thead>
					<tr>
						{["Nombre", "Documento", "Numero", "Email", "Estado", "Cursos", "Empresa"].map((h) => {
							return (<th
								style={{
									color: "#000",
									border: "1px solid",
									fontSize: "10px"
								}}
							>{h}</th>)
						})}
					</tr>
				</thead>
				<tbody>
					{employeeData.map((e) => {
						return (
							<tr>
								<td
									style={tdStyle}
								>{e.nombres} {e.apellidos}</td>
								<td
									style={tdStyle}
								>{e.documento}</td>
								<td
									style={tdStyle}
								>{e.celular}</td>
								<td
									style={tdStyle}
								>{e.email}</td>
								<td
									style={tdStyle}
								>{e.estado}</td>
								<td
									style={tdStyle}
								>{e.cursos.map((c) => 
									<>
										<span 
											style={{
												color: "#000"
											}}
										>{c}</span>
										<br/>
									</>
								)}</td>
								<td
									style={tdStyle}
								>{e.Empresa.nombre_empresa}</td>
							</tr>
						)
					})}
				</tbody>
			</table>
		</div>
	)
}