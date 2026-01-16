import { useEffect } from "react"
import { useState } from "react"
import axiosInstance from "../../../../config/axiosInstance"

export const ReportCertification = ({
	contentKey,
	curso,
	aprendices,
	done
}) => {
	const [aprendicesData, setAprendicesData] = useState([])
	const [criteria, setCriteria] = useState([])

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
		fontSize: "7px",
		padding: "2.5px"
	}

	const fetchData = async () => {
		let data = []
		let criteriaList = []
		for (let a of aprendices) {
			const aprenticeFullData = (await axiosInstance.get(`/api/users/profile/${a.id}`)).data
			const criteriaAprentice = (await axiosInstance.get(`/api/certification/course/${curso.ID}/aprendiz/${a.id}`)).data
			let ap = {
				Nombre: `${aprenticeFullData.nombres} ${aprenticeFullData.apellidos}`,
				Documento: aprenticeFullData.documento,
				Numero: aprenticeFullData.celular,
				Email: aprenticeFullData.email,
				Estado: aprenticeFullData.estado,
				Empresa: aprenticeFullData.Empresa.nombre_empresa,
				Certificación: criteriaAprentice.certification_status,
			}
			for (let c of criteriaAprentice.criteria) {
				criteriaList[c.title] = `${c.value} / ${c.min}`
			}
			data.push(ap)
		}
		setAprendicesData(data)
		setCriteria(criteriaList)
		setTimeout(() => done(), 100)
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
				width: "100%",
				minWidth: "90%"
			}}>
				<thead>
					<tr>
						{["Nombre", "Documento", "Numero", "Email", "Estado", "Empresa", "Estado certificación", ...Object.keys(criteria)].map((h) => 
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
					{aprendicesData.map((c) => {
						return (
							<tr>
								<td
									style={tdStyle}
								>{c.Nombre}</td>
								<td
									style={tdStyle}
								>{c.Documento}</td>
								<td
									style={tdStyle}
								>{c.Numero}</td>
								<td
									style={tdStyle}
								>{c.Email}</td>
								<td
									style={tdStyle}
								>{c.Email}</td>
								<td
									style={tdStyle}
								>{c.Estado}</td>
								<td
									style={tdStyle}
								>{c.Empresa}</td>
								{Object.values(criteria).map((c) => {
									return <td
										style={tdStyle}
									>{c}</td>
								})}
							</tr>
						)
					})}
				</tbody>
			</table>
		</div>
	)
}