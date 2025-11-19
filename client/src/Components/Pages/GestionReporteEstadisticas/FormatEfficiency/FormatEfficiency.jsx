import { useEffect } from "react"

export const FormatEfficiency = ({ contentKey, aprendices, done }) => {
	const tdStyle = {
		color: "#000",
		border: "1px solid",
		fontSize: "10px",
		padding: "5px"
	}

	useEffect(() => {
		setTimeout(() => done(), 100)
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
					color: "#000"
				}}
			>REPORTE DE EFICIENCIA</h1>
			<span
				style={{
					color: "#000",
					marginTop: "20px",
					display: "inline-block"
				}}
			><b style={{color: "#000"}}>Consultado el: </b> {new Date().toLocaleString("es-CO")}</span>
			<table style={{
				marginTop: "10px",
				borderCollapse: "collapse",
				border: "1px solid",
				padding: "0px",
				width: "100%",
				minWidth: "90%"
			}}>
				<thead>
					<tr>
						{["Nombres", "Apellidos", "Documentos", "Actividades Faltantes", "Actividades Realizadas", "Eficiencia"].map((h) => 
							<th
								style={{
									color: "#000",
									border: "1px solid",
									fontSize: "10px",
									backgroundColor: "#FFF"
								}}
							>{h}</th>
						)}
					</tr>
				</thead>
				<tbody>
					{aprendices.map((a) => 
						<tr>
							<td
								style={tdStyle}
							>{a.nombre}</td>
							<td
								style={tdStyle}
							>{a.apellido}</td>
							<td
								style={tdStyle}
							>{a.documento}</td>
							<td
								style={tdStyle}
							>{a.faltantes}</td>
							<td
								style={tdStyle}
							>{a.realizadas}</td>
							<td
								style={tdStyle}
							>{a.eficiencia}</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	)
}