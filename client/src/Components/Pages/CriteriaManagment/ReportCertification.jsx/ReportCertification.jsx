export const ReportCertification = ({}) => {
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
        </div>
    )
}