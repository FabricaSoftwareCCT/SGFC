import { useNavigate } from "react-router-dom"
import { Header } from "../../Layouts/Header/Header"
import { Main } from "../../Layouts/Main/Main"
import "./Historial.css"
import { useEffect, useState } from "react"
import axiosInstance from "../../../config/axiosInstance"
import { PageMover } from "../../UI/PageMover/PageMover"
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css'


export const Historial = () => {
	const navigate = useNavigate()

	const userSession = JSON.parse(localStorage.getItem("userSession")) || JSON.parse(sessionStorage.getItem("userSession"))
	const isLoggedIn = !!userSession
	const accountType = userSession?.accountType || null

	const [page, setPage] = useState(0)
	const [total, setTotal] = useState(0)
	const [totalPages, setTotalPages] = useState(0)
	const [historial, setHistorial] = useState([])

	const fetchHistorial = async () => {
		try {
			const resp = await axiosInstance.get(`/api/historial/admin?page=${page}`)
			setTotal(resp.data.total)
			setHistorial(resp.data.historial)
			setTotalPages(parseInt(resp.data.total / 10))
		} catch (error) {
			console.log(error)

			Swal.fire({
          icon:"error",
          title:"Error al  consultar historial",
          text:"Ocurrió un error al consultar el historial",
          confirmButtonText:"Okay",
          theme:"bulma",
          customClass:{
        confirmButton: 'button is-primary',
        actions: 'swal2-actions-centered'
                }
              })
		}
	}

	useEffect(() => {
		if (isLoggedIn && accountType == "Administrador") {
			fetchHistorial()
		} else {
			navigate("/no-autorizado");
		}
	}, [])

	const renderHistorial = (hist) => {
		console.log(hist)
		return (
			<tr key={hist.ID}>
				<td className="company-nit-cell">
					{new Date(hist.fecha).toLocaleString("es-CO")}
				</td>
				<td className="company-nit-cell">
					{hist.descripcion}
				</td>
			</tr>
		)
	}

	return (
		<div className="pantallaGestionsCompany">
			<Header/>
			<Main>
				<section className="sectionPrincipalGestionsCompany">
					<section className="sectionGestionsCompanyHeader">
						<div className="header-title-container">
							<p className="tituloGestionsCompany">
								Historial de <span className="tituloVerde">Cambios</span>
							</p>
						</div>
						<p className="paragraphGestionsCompany">
							Consulta el historico de cambios realizados en el sistema
						</p>
					</section>
					<section className="historialContainer">
						<section className="resultTableGestionsCompany">
							<div className="results-header">
								<label className="labelFilterOption12">
									{total} Resultados · Página {page + 1} de {totalPages + 1}
								</label>
							</div>
							<div 
								className={`table-container`}
							>
								{historial.length > 0 ?
									<table className="companies-table">
										<thead>
											<tr className="table-heade">
												<th className="header-logo">Fecha</th>
												<th className="header-name">Cambio</th>
											</tr>
										</thead>
										<tbody>
											{historial.map(renderHistorial)}
										</tbody>
									</table>
								:
									<div className="no-results">...</div>
								}
							</div>
							<PageMover
								value={page + 1}
								max={totalPages + 1}
								next={() => {
									setPage(page + 1)
								}}
								prev={() => {
									setPage(page - 1)
								}}
							/>
						</section>
					</section>
				</section>
			</Main>
		</div>
	)
}