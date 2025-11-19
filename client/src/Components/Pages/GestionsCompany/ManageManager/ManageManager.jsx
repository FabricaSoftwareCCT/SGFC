import "./ManageManager.css"
import "../ManageCompany/UpdateCompany.css"

import fotoPerfilDefect from "../../../../assets/Icons/userDefect.png";

import { useState } from "react"
import axiosInstance from "../../../../config/axiosInstance";
import Swal from 'sweetalert2'
import 'sweetalert2/themes/bulma.css'

export const ManageManager = ({ data, isAdmin, onClose, update }) => {
	const [manager, setManager] = useState(data)
	const [isEditing, setIsEditing] = useState(false)

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!isEditing) {
			setIsEditing(true);
			return;
		}

		if (manager == data)
			return
		
		try {
			const resp = await axiosInstance.put(`/api/users/perfil/actualizar/${manager.ID}`, {
				email: manager.email,
				nombres: manager.nombres,
				apellidos: manager.apellidos,
				celular: manager.celular,
				documento: manager.documento,
				estado: manager.estado
			})
			if (resp?.status >= 200 && resp?.status < 300) {
				Swal.fire({
					icon: 'success',
					title: 'Manager actualizado',
					text: resp?.data?.message || 'Se ha actualizado el manager',
					theme:"bulma",
					confirmButtonText: 'Aceptar',
					confirmButtonColor: '#00843d',
					customClass:{
						confirmButton: 'centered-swal-button'
					}
				});
			} else {
				Swal.fire({
				icon: 'error',
				title: 'Error',
				text: 'No se pudo actualizar el manager',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#d33',
				theme:"bulma",
     				customClass: { confirmButton: 'centered-swal-button' }
				});
				return;
			}

			if (data.foto_perfil != manager.foto_perfil) {
				const body = new FormData();
				body.append("foto_perfil", manager.foto_perfil);
				await axiosInstance.put(`/api/users/perfil/actualizar/${manager.ID}`, body, {
					headers: { "Content-Type": "multipart/form-data" },
				});
			}

			onClose()
			update()
		} catch (error) {
			console.log(error)
			Swal.fire({
				icon: 'error',
				title: 'Error',
				text: 'Ocurrió un error al actualizar el manager',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#d33',
				theme:"bulma",
      customClass: { confirmButton: 'centered-swal-button' }
			});
		}
	}

	const truncarNombreArchivo = (nombre, maxLongitud = 15) => {
		if (!nombre) return '';

		const ultimoPunto = nombre.lastIndexOf('.');
		if (ultimoPunto === -1) {
			return nombre.length > maxLongitud 
				? `${nombre.slice(0, maxLongitud)}...`
				: nombre;
		}

		const nombreParte = nombre.slice(0, ultimoPunto);
		const extension = nombre.slice(ultimoPunto);

		if (nombreParte.length <= maxLongitud) {
			return nombre;
		}

		return `${nombreParte.slice(0, maxLongitud)}... ${extension}`;
	};


	const getLogoSrc = (logo) => {
		if (!logo) return fotoPerfilDefect;
		if (logo instanceof File) return URL.createObjectURL(logo);
		if (typeof logo === "string") {
			if (logo.startsWith('data:') || logo.startsWith('http')) {return logo;}
			if (/(\.png|\.jpg|\.jpeg|\.gif)$/i.test(logo)) {return fotoPerfilDefect;}
	
			if (logo.startsWith('iVBOR')) {return `data:image/png;base64,${logo}`;}
			if (logo.startsWith('/9j/')) {return `data:image/jpeg;base64,${logo}`;}
	
			if (logo.length < 100) {return fotoPerfilDefect;}
	
			return `data:image/jpeg;base64,${logo}`;
		}
		return fotoPerfilDefect;
	};

	//console.log(manager)

	return (
		<div id="modal-overlayUpdateInstructor" style={{ display: "flex" }}>
			<form className="modal-bodyUpdateInstructor" onSubmit={handleSubmit}>
				<div className="modal-left-update">
					<p>
						<strong>Empresa:</strong>
						<span className="valor-campo">{manager.Empresa.nombre_empresa}</span>
					</p>
					<p>
						<strong>Nombres:</strong>
						{isEditing ?
							<input
								type="text"
								name="nombres_manager"
								value={manager.nombres}
								className="input_updateData"
								onChange={(e) => setManager({
									...manager,
									nombres: e.target.value
								})}
							/>
						:
							<span className="valor-campo">{manager.nombres}</span>
						}
					</p>
					<p>
						<strong>Apellidos:</strong>
						{isEditing ?
							<input
								type="text"
								name="apellidos_manager"
								value={manager.apellidos}
								className="input_updateData"
								onChange={(e) => setManager({
									...manager,
									apellidos: e.target.value
								})}
							/>
						:
							<span className="valor-campo">{manager.apellidos}</span>
						}
					</p>
					<p>
						<strong>Celular:</strong>
						{isEditing ?
							<input
								type="text"
								name="celular_manager"
								value={manager.celular}
								className="input_updateData"
								onChange={(e) => setManager({
									...manager,
									celular: e.target.value
								})}
							/>
						:
							<span className="valor-campo">{manager.celular}</span>
						}
					</p>
					<p>
						<strong>Documento:</strong>
						{isEditing ?
							<input
								type="text"
								name="documento_manager"
								value={manager.documento}
								className="input_updateData"
								onChange={(e) => setManager({
									...manager,
									documento: e.target.value
								})}
							/>
						:
							<span className="valor-campo">{manager.documento}</span>
						}
					</p>
					<p>
						<strong>Correo:</strong>
						{isEditing ?
							<input
								type="email"
								name="documento_manager"
								value={manager.email}
								className="input_updateData"
								onChange={(e) => setManager({
									...manager,
									email: e.target.value
								})}
							/>
						:
							<span className="valor-campo">{truncarNombreArchivo(manager.email,14)}</span>
						}
					</p>
					<p>
						<strong>Estado:</strong>
						{isEditing ?
							<div id="valor1" className="status-buttons">
								{["Activo", "Inactivo"].map((estado) => (
									<button
										id={estado}
										key={estado}
										type="button"
										className={`status ${manager.estado === estado.toLowerCase() ? "active" : ""}`}
										onClick={() => setManager({
											...manager,
											estado: estado.toLowerCase()
										})}
									>
										{estado}
									</button>
								))}
							</div>
						:
							<span className="valor-campo">{manager.estado}</span>
						}
					</p>
				</div>

				<div className="modal-right">
					{isAdmin && (
						<input
							type="file"
							accept="image/*"
							hidden={!isEditing}
							disabled={!isEditing}
							id="imageUpload"
							onChange={(e) => {
								setManager({
									...manager,
									foto_perfil: e.target.files[0]
								})
							}}
						/>
					)}
					<label
						className={`upload-area-update ${!isEditing ? "read-only-border" : ""}`}
						htmlFor="imageUpload"
					>
						{(() => {
							const src = getLogoSrc(manager.foto_perfil);
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
					{isAdmin && 
						(isEditing ?
							<button type="submit" className="edit-button-updateInstructor">
								Guardar Cambios
							</button>
						:
							<button
								onClick={() => setIsEditing(true)}
								type="button"
								className="edit-button-updateInstructor"
							>Editar Manager</button>
						)
					}
				</div>

				<div className="container_return_UpdateInstructor">
					<h5>Volver</h5>
					<button type="button" onClick={onClose} className="closeModal"></button>
				</div>
			</form>
		</div>
	)
}