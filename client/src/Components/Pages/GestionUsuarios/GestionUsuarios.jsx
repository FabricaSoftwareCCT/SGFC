import { useState } from "react"
import { Header } from "../../Layouts/Header/Header"
import { Main } from "../../Layouts/Main/Main"
import "./GestionUsuarios.css"
import { useNavigate } from "react-router-dom"
import axiosInstance from "../../../config/axiosInstance"
import { useEffect } from "react"
import { PageMover } from "../../UI/PageMover/PageMover"

import fotoPerfilDefect from "../../../assets/Icons/userDefect.png"
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css'

export const GestionUsuarios = () => {
	const navigate = useNavigate()

	const userSession = JSON.parse(localStorage.getItem("userSession")) || JSON.parse(sessionStorage.getItem("userSession"))

	const [users, setUsers] = useState([])
	const [total, setTotal] = useState(0)
	const [totalPages, setTotalPages] = useState(0)
	const [page, setPage] = useState(0)
	const [name, setName] = useState("")
	const [document, setDocument] = useState("")
	const [selectedUser, setSelectedUser] = useState(null)
	const [selectedUserBackup, setSelectedUserBackup] = useState(null)
	const [editing, setEditing] = useState(false)
	
	const isLoggedIn = !!userSession
	const accountType = userSession?.accountType || null

	const fetchUsuarios = async () => {
		try {
			const resp = await axiosInstance.get(`/api/users/users?name=${name}&doc=${document}`)
			setUsers(resp.data.usuarios)
			setTotal(parseInt(resp.data.total))
			setTotalPages(parseInt(resp.data.total / 10) + 1)
		} catch (error) {
			console.log(error)
			alert("Ocurrió un error al consultar los usuarios")
		}
	} 

	useEffect(() => {
		if (isLoggedIn && accountType == "Administrador") {
			fetchUsuarios()
		} else {
			navigate("/no-autorizado");
		}
	}, [page])

	const getLogoSrc = (logo) => {
		if (!logo) return fotoPerfilDefect;

		if (typeof logo === "string") {
			if (logo.startsWith('data:') || logo.startsWith('http')) {
				return logo;
			}

			if (/(\.png|\.jpg|\.jpeg|\.gif)$/i.test(logo)) {
				return fotoPerfilDefect;
			}

			if (logo.startsWith('iVBOR')) {
				return `data:image/png;base64,${logo}`;
			}
			if (logo.startsWith('/9j/')) {
				return `data:image/jpeg;base64,${logo}`;
			}

			if (logo.length < 100) {
				return fotoPerfilDefect;
			}

			return `data:image/jpeg;base64,${logo}`;
		}
		
		return fotoPerfilDefect;
	}

	const renderUser = (user) => {
		const nombre = user.nombres ? `${user.nombres} ${user.apellidos}` : "Sin definir"
		const documento = user.documento ?? "Sin definir"
		const rol = user.accountType
		const pfp = user.foto_perfil
		const pfpSrc = getLogoSrc(pfp)
		const estado = user.estado

		return (
			<tr key={user.ID} className="company-row">
				<td className="company-logo-cell">
					<img 
						className="company-logo" 
						src={pfpSrc} 
						alt="foto"
					/>
				</td>
				<td className="company-name-cell">
					{nombre}
				</td>
				<td className="company-nit-cell">
					{documento}
				</td>
				<td className="company-category-cell">
					{rol}
				</td>
				<td className="company-status-cell">
					<span className={`status-pill ${estado === 'activo' ? 'status-active' : estado === 'inactivo' ? 'status-inactive' : 'status-unknown'}`}>
						{estado === 'activo' ? 'Activo' : estado === 'inactivo' ? 'Inactivo' : 'Sin estado'}
					</span>
				</td>
				<td>
					<button
						className="manage-button"
						type="button"
						onClick={() => {
							//console.log(user)
							setSelectedUser(user)
							setSelectedUserBackup(user)
						}}
						data-adblock-bypass="true"
						aria-label="Ver manager"
					>Ver usuario</button>
				</td>
			</tr>
		)
	}

	const updateUser = async () => {
		if (!editing) {
			setEditing(true)
			return
		}

		if (selectedUser == selectedUserBackup)
			return

		try {
			const resp = await axiosInstance.put(`/api/users/perfil/actualizar/${selectedUser.ID}`, {
				email: selectedUser.email,
				nombres: selectedUser.nombres,
				apellidos: selectedUser.apellidos,
				celular: selectedUser.celular,
				documento: selectedUser.documento,
				estado: selectedUser.estado
			})
			if (resp?.status >= 200 && resp?.status < 300) {
				alert(resp?.data?.message || "Se ha actualizado el manager");
			} else {
				alert("No se pudo actualizar el manager.");
				return;
			}

			if (selectedUser.accountType != selectedUserBackup.accountType) {
				const resp2 = await axiosInstance.put(`/api/users/admin/changerole/${selectedUser.ID}`, {
					role: selectedUser.accountType
				})
			}

			setEditing(false)
			setSelectedUser(null)
			fetchUsuarios()
		} catch (error) {
			console.log(error)
			alert("Ocurrió un error al actualizar el usuario")
		}
	}

	return (
		<div className="pantallaGestionsCompany">
			<Header/>
			<Main>
				<section className="sectionPrincipalGestionsCompany">
					<section className="sectionGestionsCompanyHeader">
						<div className="header-title-container">
							<p className="tituloGestionsCompany">
								Usuarios <span className="tituloVerde">Registrados</span>
							</p>
						</div>
						<p className="paragraphGestionsCompany">
							Consulta y gestiona usuarios registrados en el sistema. 
						</p>
					</section>
					<section className="sectionGestionsCompanyBody">
						<section className="filterGestionsCompany">
							<strong className="tituloFiltrar">Filtrar</strong>
							<article className="filterOptionsGestionsCompany">
								<div className="filterOptionName">
									<label className="labelFilterOption1">Nombre</label>
									<div className="inputFilterOption1">
										<input
											className="inputFilterOptionText"
											type="text"
											placeholder="Escriba el nombre del usuario"
											value={name}
											onChange={(e) => setName(e.target.value)}
										/>
									</div>
								</div>
								<div className="filterOptionName">
									<label className="labelFilterOption1">Documento</label>
									<div className="inputFilterOption1">
										<input
											className="inputFilterOptionText"
											type="text"
											placeholder="Escriba el nombre del usuario"
											value={document}
											onChange={(e) => setDocument(e.target.value)}
										/>
									</div>
								</div>
								<button
									className="button"
									onClick={() => fetchUsuarios()}	
								>Filtrar</button>
							</article>
						</section>
						<section className="resultTableGestionsCompany">
							<div className="results-header">
								<label className="labelFilterOption12">
									{total} Resultados · Página {page + 1} de {totalPages}
								</label>
							</div>
							<div 
								className={`table-container`}
							>
								{users.length > 0 ?
									<table className="companies-table">
										<thead>
											<tr className="table-heade">
												<th className="header-logo">Foto</th>
												<th className="header-name">Nombre</th>
												<th className="header-nit">Documento</th>
												<th className="header-name">Rol</th>
												<th className="header-category">Estado</th>
												<th className="header-actions">Acciones</th>
											</tr>
										</thead>
										<tbody>
											{users.map(renderUser)}
										</tbody>
									</table>
								:
									<div className="no-results">No se encontraron usuarios.</div>
								}
							</div>
							<PageMover
								value={page + 1}
								max={totalPages}
								next={() => {
									setPage(page + 1)
								}}
								prev={() => {
									setPage(page - 1)
								}}
							/>
						</section>
						{selectedUser && (
							<div id="modal-overlayUpdateInstructor" style={{ display: "flex" }}>
								<div className="modal-bodyUpdateInstructor">
									<div className="modal-left-update">
										<p>
											<strong>Nombre:</strong>
											{editing ?
												<input
													type="text"
													name="nombres"
													value={selectedUser.nombres}
													className="input_updateData"
													onChange={(e) => setSelectedUser({
														...selectedUser,
														nombres: e.target.value
													})}
												/>
											:
												<span className="valor-campo">{selectedUser.nombres}</span>
											}
										</p>
										<p>
											<strong>Apellidos:</strong>
											{editing ?
												<input
													type="text"
													name="apellidos"
													value={selectedUser.apellidos}
													className="input_updateData"
													onChange={(e) => setSelectedUser({
														...selectedUser,
														apellidos: e.target.value
													})}
												/>
											:
												<span className="valor-campo">{selectedUser.apellidos}</span>
											}
										</p>
										<p>
											<strong>Celular:</strong>
											{editing ?
												<input
													type="text"
													name="celular_manager"
													value={selectedUser.celular}
													className="input_updateData"
													onChange={(e) => setSelectedUser({
														...selectedUser,
														celular: e.target.value
													})}
												/>
											:
												<span className="valor-campo">{selectedUser.celular}</span>
											}
										</p>
										<p>
											<strong>Documento:</strong>
											{editing ?
												<input
													type="text"
													name="documento_manager"
													value={selectedUser.documento}
													className="input_updateData"
													onChange={(e) => setSelectedUser({
														...selectedUser,
														documento: e.target.value
													})}
												/>
											:
												<span className="valor-campo">{selectedUser.documento}</span>
											}
										</p>
										<p>
											<strong>Correo:</strong>
											{editing ?
												<input
													type="email"
													name="documento_manager"
													value={selectedUser.email}
													className="input_updateData"
													onChange={(e) => setSelectedUser({
														...selectedUser,
														email: e.target.value
													})}
												/>
											:
												<span className="valor-campo">{selectedUser.email}</span>
											}
										</p>
										<p>
											<strong>Estado:</strong>
											{editing ?
												<div className="status-buttons">
													{["Activo", "Inactivo"].map((estado) => (
														<button
															key={estado}
															type="button"
															className={`status ${selectedUser.estado === estado.toLowerCase() ? "active" : ""}`}
															onClick={() => {
																setSelectedUser({
																	...selectedUser,
																	estado: estado.toLowerCase()
																})
															}}
														>
															{estado}
														</button>
													))}
												</div>
											:
												<span className="valor-campo">{selectedUser.estado}</span>
											}
										</p>
										<p>
											<strong>Rol:</strong>
											{editing ? 
												<div className="status-buttons">
													{['Aprendiz', 'Empresa', 'Instructor', 'Administrador', 'Gestor'].map((rol) => (
														<button
															key={rol}
															className={`status ${selectedUser.accountType === rol ? "active" : ""}`}
															onClick={() => setSelectedUser({
																...selectedUser,
																accountType: rol
															})}
														>
															{rol}
														</button>
													))}
												</div>
											:
												<span className="valor-campo">{selectedUser.accountType}</span>
											}
										</p>
									</div>

									<div className="modal-right">
										<label
											className={`upload-area-update ${!editing ? "read-only-border" : ""}`}
											htmlFor="imageUpload"
										>
											{(() => {
												const src = getLogoSrc(selectedUser.foto_perfil);
												return (
													<img 
														src={src} 
														alt="Logo" 
														className="preview-image-update"
														onError={(e) => {
															e.currentTarget.src = fotoPerfilDefect;
														}}
													/>
												);
											})()}
										</label>
										{editing ?
											<>
												<button
													className="edit-button-updateInstructor"
													onClick={() => {
														updateUser()
													}}
												>
													Guardar Cambios
												</button>
												<button
													className="edit-button-updateInstructor"
													onClick={() => setEditing(false)}
												>
													Cancelar
												</button>
											</>
										:
											<button
												onClick={() => setEditing(true)}
												type="button"
												className="edit-button-updateInstructor"
											>Editar usuario</button>
										}
									</div>

									<div className="container_return_UpdateInstructor">
										<h5>Volver</h5>
										<button type="button" onClick={()=> {
											setSelectedUser(null)
											setEditing(false)
										}} className="closeModal"></button>
									</div>
								</div>
							</div>
						)}
					</section>
				</section>
			</Main>
		</div>
	)
}