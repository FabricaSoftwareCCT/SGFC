import { useEffect } from "react"

export const ReportCriteria = ({
	contentKey,
	curso,
	criterios,
	done
}) => {
	useEffect(() => {
		setTimeout(() => done(), 100)
	}, [])

	const colorBlack = {
		color: "#000"
	}

	const label = {
		color: "#000",
		marginTop: "10px",
		display: "inline-block"
	}

	const tdStyle = {
		color: "#000",
		border: "1px solid",
		fontSize: "10px",
		padding: "2.5px"
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
					color: "#000",
				}}
			>REPORTE DE CRITERIOS DE CERTIFICACIÓN</h1>
			<span
				style={label}
			><b style={colorBlack}>Consultado el: </b> {new Date().toLocaleString("es-CO")}</span>
			<br/>
			<span
				style={label}
			><b style={colorBlack}>Curso: </b> {curso.nombre_curso}</span>
			<br/>
			<span
				style={label}
			><b style={colorBlack}>Ficha: </b> {curso.ficha}</span>
			<table style={{
				marginTop: "10px",
				borderCollapse: "collapse",
				border: "1px solid",
				padding: "0px",
				width: "100%"
			}}>
				<thead>
					<tr>
						{["Criterio", "Descripción", "Mínimo", "Tipo", "Fecha de creación", "Creador"].map((h) => 
							<th
								style={{
									color: "#000",
									border: "1px solid",
									fontSize: "10px"
								}}
							>
								{h}
							</th>
						)}
					</tr>
				</thead>
				<tbody>
					{criterios.map((c) => {
						return (
							<tr>
								<td
									style={tdStyle}
								>{c.title}</td>
								<td
									style={tdStyle}
								>{c.description}</td>
								<td
									style={tdStyle}
								>{c.min}</td>
								<td
									style={tdStyle}
								>{c.type}</td>
								<td
									style={tdStyle}
								>{c.creation.date} {c.creation.hour}</td>
								<td
									style={tdStyle}
								>{c.author}</td>
							</tr>
						)
					})}
				</tbody>
			</table>
		</div>
	)
}