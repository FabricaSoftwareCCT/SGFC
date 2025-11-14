import { useEffect, useState } from "react"
import axiosInstance from "../../../../config/axiosInstance"

export const ReportEmployee = ({
	contentKey,
	empleado,
	done,
	filters
}) => {
	const [cursos, setCursos] = useState([])
	const [listaCriterios, setListaCriterios] = useState({})
	const [headers, setHeaders] = useState(["Curso", "Ficha", "Modalidad", "Dias de formación", "Estado", "Inicio", "Fin", "Progreso", "Certificación", "Entregas"])

	const fetchData = async () => {
		if (filters.presence) {
			setHeaders([
				...headers,
				"Asistencias", "Inasistencias",
			])
		}

		let cursoData = []
		let criteriosData = {}

		const cursosData = (await axiosInstance.get(`/api/users/aprendiz/${empleado.ID}/cursos`))?.data?.cursos

		for (let c of cursosData) {
			const asistencias = (await axiosInstance.get(`/api/attendance/courses/${c.ID}/get?limit=999999999`))?.data.records
			const estadoCurso = (await axiosInstance.get(`/api/certification/course/${c.ID}/aprendiz/${empleado.ID}`))?.data
			const criterios = estadoCurso.criteria

			criteriosData[c.nombre_curso] = criterios

			let totalMin = 0
			let totalValue = 0

			for (let criterio of criterios) {
				totalMin += criterio.min
				totalValue += criterio.value
			}

			cursoData.push({
				Curso: c.nombre_curso,
				Ficha: c.ficha,
				Modalidad: c.modalidad,
				diasFormacion: JSON.parse(c.slots_formacion).join(", "),
				Estado: c.estado,
				Inicio: (new Date(c.fecha_inicio)).toLocaleDateString("es-CO"),
				Fin: (new Date(c.fecha_fin)).toLocaleDateString("es-CO"),
				Asistencias: asistencias.filter((a) => a.aprendiz.ID == empleado.ID && a.estado_asistencia === "Presente").length,
				Inasistencias: asistencias.filter((a) => a.aprendiz.ID == empleado.ID && a.estado_asistencia === "Ausente").length,
				Progreso: `${parseInt((totalValue * 100) / totalMin)}%`,
				Certificacion: estadoCurso.certification_status.toUpperCase(),
				Observacion: estadoCurso.denial_justification,
				Entregas: `${estadoCurso.submitted_activities}/${estadoCurso.total_activities}`
			})
		}
		
		setCursos(cursoData)
		setListaCriterios(criteriosData)
		setTimeout(() => done(), 100)
	}

	const colorBlack = {
		color: "#000"
	}

	const label = {
		color: "#000",
		marginTop: "8px",
		display: "inline-block"
	}

	const tdStyle = {
		color: "#000",
		border: "1px solid",
		fontSize: "9px",
		padding: "2.5px"
	}

	const tableStyle = {
		marginTop: "10px",
		borderCollapse: "collapse",
		border: "1px solid",
		padding: "0px",
		width: "100%",
		minWidth: "90%"
	}

	useEffect(() => {
		fetchData()
	}, [])

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
					color: "#000",
				}}
			>REPORTE DEL EMPLEADO {empleado.nombres.toUpperCase()} {empleado.apellidos.toUpperCase()}</h1>
			<span
				style={label}
			><b style={colorBlack}>Consultado el: </b> {new Date().toLocaleString("es-CO")}</span>
			<br/>
			{filters.personalData && (
				<>
					<span
						style={label}
					><b style={colorBlack}>Nombre: </b> {empleado.nombres} {empleado.apellidos}</span>
					<br/>
					<span
						style={label}
					><b style={colorBlack}>Estado: </b> {empleado.estado}</span>
					<br/>
					<span
						style={label}
					><b style={colorBlack}>Correo: </b> {empleado.email}</span>
					<br/>
					<span
						style={label}
					><b style={colorBlack}>Documento: </b> {empleado.documento}</span>
					<br/>
					<span
						style={label}
					><b style={colorBlack}>Número Teléfonico: </b> {empleado.documento}</span>
					<br/>	
				</>
			)}
			<h3 style={label}>Cursos</h3>
			<table style={tableStyle}>
				<thead>
					<tr>
						{headers.map((h) => 
							<th
								key={h}
								style={{
									color: "#000",
									border: "1px solid",
									fontSize: "10px",
									backgroundColor: "#FFF",
									padding: "1px"
								}}
							>{h}</th>
						)}
					</tr>
				</thead>
				<tbody>
					{cursos.map((c) => 
						<tr>
							<td
								style={tdStyle}
							>{c.Curso}</td>
							<td
								style={tdStyle}
							>{c.Ficha}</td>
							<td
								style={tdStyle}
							>{c.Modalidad}</td>
							<td
								style={tdStyle}
							>{c.diasFormacion}</td>
							<td
								style={tdStyle}
							>{c.Estado}</td>
							<td
								style={tdStyle}
							>{c.Inicio}</td>
							<td
								style={tdStyle}
							>{c.Fin}</td>
							<td
								style={tdStyle}
							>{c.Progreso}</td>
							<td
								style={tdStyle}
							>{c.Certificacion}</td>
							<td
								style={tdStyle}
							>{c.Entregas}</td>
							{filters.presence && (
								<>
									<td
										style={tdStyle}
									>{c.Asistencias}</td>
									<td
										style={tdStyle}
									>{c.Inasistencias}</td>
								</>
							)}
						</tr>
					)}
				</tbody>
			</table>
			{filters.criteria && (
				Object.keys(listaCriterios).map((c) => 
					<>
						<h3 style={label}>Criterios del curso {c}</h3>
						<table style={{
							...tableStyle,
							width: "30%"	
						}}>
							<thead>
								<tr>
									{["Criterio", "Mínimo para certificarse", "Valor"].map((h) => 
										<th
											key={h}
											style={{
												color: "#000",
												border: "1px solid",
												fontSize: "10px",
												backgroundColor: "#FFF",
												padding: "1px"
											}}
										>{h}</th>
									)}
								</tr>
							</thead>
							<tbody>
								{listaCriterios[c].map((cr) => 
									<tr>
										<td
											style={tdStyle}
										>{cr.title}</td>
										<td
											style={tdStyle}
										>{cr.min}</td>
										<td
											style={tdStyle}
										>{cr.value}</td>
									</tr>
								)}
							</tbody>
						</table>
					</>
				)	
			)}
		</div>
	)
}