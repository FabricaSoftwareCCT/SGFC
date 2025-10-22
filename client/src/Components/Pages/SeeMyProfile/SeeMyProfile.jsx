"use client";

import React, { useEffect, useState } from "react";
import "./SeeMyProfile.css";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Footer } from "../../../Components/Layouts/Footer/Footer";
import { Main } from "../../../Components/Layouts/Main/Main";
import axiosInstance from "../../../config/axiosInstance";
import { Header } from "../../Layouts/Header/Header";
import fotoPerfilDefect from "../../../assets/Icons/userDefect.png";
import {
	validateEmail,
	validateNumber,
	validateText,
	createMensajeError,
	validateNIT,
	validateAddress,
} from "../../../utils/Validators/formValidator";
import { useModal } from "../../../Context/ModalContext";

export const SeeMyProfile = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const userId = location.state?.userId;
	const requiresCompletion = location.state?.requiresCompletion; // ← NUEVO
	const fotoPerfilInputRef = React.useRef(null);
	const logoEmpresaInputRef = React.useRef(null);
	const [perfil, setPerfil] = useState(null);
	const [perfilOriginal, setPerfilOriginal] = useState(null); // Guardar el perfil original
	const [tipoCuenta, setTipoCuenta] = useState("");
	const [editMode, setEditMode] = useState(false);
	const [departamentos, setDepartamentos] = useState([]);
	const [ciudades, setCiudades] = useState([]);
	const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState("");
	const [ciudadSeleccionada, setCiudadSeleccionada] = useState("");
	const [cursos, setCursos] = useState([]);
	const [instructores, setInstructores] = useState([]);
	const { setShowModalGeneral, setModalGeneralContent } = useModal()

	const getImageSrcFromBase64 = (value) => {
		// Fallback inmediato si no hay valor
		if (!value) return fotoPerfilDefect;

		// Si ya viene como data URL o URL absoluta, úsala tal cual
		if (
			typeof value === "string" &&
			(value.startsWith("data:") || value.startsWith("http"))
		) {
			return value;
		}

		// Si en BD guardaron una ruta relativa (p.ej. ../Img/userDefect.png), usar por defecto
		if (
			typeof value === "string" &&
			/(\.png|\.jpg|\.jpeg|\.gif)$/i.test(value)
		) {
			return fotoPerfilDefect;
		}

		const base64 = value;
		// Detectar tipo MIME por encabezado base64
		if (typeof base64 === "string" && base64.startsWith("iVBOR")) {
			return `data:image/png;base64,${base64}`;
		}
		if (typeof base64 === "string" && base64.startsWith("/9j/")) {
			return `data:image/jpeg;base64,${base64}`;
		}

		// Si la cadena es muy corta, probablemente no es una imagen base64 válida
		if (typeof base64 === "string" && base64.length < 100) {
			return fotoPerfilDefect;
		}

		// Último recurso: asumir jpeg
		return `data:image/jpeg;base64,${base64}`;
	};

	useEffect(() => {
		// Si viene por redirección de perfil incompleto, activar modo edición automáticamente
		if (requiresCompletion) {
			setEditMode(true);
			alert(
				"⚠️ Por favor completa tu perfil para continuar usando la aplicación"
			);
		}

		const fetchProfile = async () => {
			try {
				const response = await axiosInstance.get(
					`/api/users/profile/${userId}`
				);
				setPerfil(response.data);
				setPerfilOriginal(response.data); // Guardar el perfil original
				setTipoCuenta(response.data.accountType);

				// Si es empresa, cargar ubicaciones y establecer valores por defecto
				if (
					response.data.accountType === "Empresa" &&
					response.data.Empresa
				) {
					await cargarUbicaciones(response.data.Empresa);
					await fetchCursos()
				}
			} catch (error) {
				console.error("Error al obtener el perfil:", error);
			}
		};

		if (userId) {
			fetchProfile();
		}
	}, [userId, requiresCompletion]);

	const fetchCursos = async () => {
		const response = await axiosInstance.get(
			`/api/users/profile/${userId}`
		);
		try {
			const cursos = await axiosInstance.get(`/api/courses/empresa/${response.data.Empresa.ID}`)
			if (!cursos.data.success)
				throw "No se pudo realizar"
			setCursos(cursos.data.cursos)
			setInstructores(cursos.data.cursos.map((c) => {
				console.log(c)
				return {
					ID: c.Instructor.ID,
					nombre_instructor: `${c.Instructor.nombres} ${c.Instructor.apellidos}`,
					nombre_curso: c.nombre_curso,
					id_curso: c.ID,
					numero: c.Instructor.celular,
					email: c.Instructor.email
				}
			}))
		} catch (error) {
			alert("Ocurrió un error al consultar los cursos")
			console.log(error)
		}
	}

	const cargarUbicaciones = async (empresaData) => {
		try {
			// Cargar departamentos
			const departamentosRes = await axiosInstance.get(
				"/api/ubicaciones/departamentos"
			);
			const departamentosData = Array.isArray(departamentosRes.data)
				? departamentosRes.data
				: departamentosRes.data.data || [];
			setDepartamentos(departamentosData);

			// Si hay ciudad_ID, cargar ciudades del departamento correspondiente
			if (empresaData.ciudad_ID) {
				// Primero obtener la ciudad para saber su departamento
				const ciudadRes = await axiosInstance.get(
					`/api/ubicaciones/ciudades/${empresaData.ciudad_ID}`
				);
				const ciudadData = ciudadRes.data;

				if (ciudadData.departamento_ID) {
					setDepartamentoSeleccionado(ciudadData.departamento_ID);
					setCiudadSeleccionada(empresaData.ciudad_ID);

					// Cargar ciudades del departamento
					const ciudadesRes = await axiosInstance.get(
						`/api/ubicaciones/departamentos/${ciudadData.departamento_ID}/ciudades`
					);
					const ciudadesData = Array.isArray(ciudadesRes.data)
						? ciudadesRes.data
						: ciudadesRes.data.data || [];
					setCiudades(ciudadesData);
				}
			} else {
				// Si no hay ciudad_ID, limpiar los selects
				setDepartamentoSeleccionado("");
				setCiudadSeleccionada("");
				setCiudades([]);
			}
		} catch (error) {
			console.error("Error al cargar ubicaciones:", error);
		}
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;

		if (name.startsWith("Empresa.")) {
			const key = name.split(".")[1];
			setPerfil((prevPerfil) => ({
				...prevPerfil,
				Empresa: {
					...prevPerfil.Empresa,
					[key]: value,
				},
			}));
		} else {
			setPerfil({ ...perfil, [name]: value });
		}
	};

	const handleDepartamentoChange = async (e) => {
		const departamentoId = e.target.value;
		setDepartamentoSeleccionado(departamentoId);
		setCiudadSeleccionada("");

		// Actualizar el perfil con el nuevo departamento
		setPerfil((prev) => ({
			...prev,
			Empresa: {
				...prev.Empresa,
				departamento_ID: departamentoId,
				ciudad_ID: null,
			},
		}));

		if (departamentoId) {
			try {
				const ciudadesRes = await axiosInstance.get(
					`/api/ubicaciones/departamentos/${departamentoId}/ciudades`
				);
				const ciudadesData = Array.isArray(ciudadesRes.data)
					? ciudadesRes.data
					: ciudadesRes.data.data || [];
				setCiudades(ciudadesData);
			} catch (error) {
				console.error("Error al cargar ciudades:", error);
				setCiudades([]);
			}
		} else {
			setCiudades([]);
		}
	};

	const handleCiudadChange = (e) => {
		const ciudadId = e.target.value;
		setCiudadSeleccionada(ciudadId);

		// Actualizar el perfil con la nueva ciudad
		setPerfil((prev) => ({
			...prev,
			Empresa: {
				...prev.Empresa,
				ciudad_ID: ciudadId,
			},
		}));
	};

	const handleFileChange = (e, type) => {
		const file = e.target.files[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onloadend = () => {
			const base64 = reader.result.split(",")[1];
			if (type === "foto_perfil") {
				setPerfil((prev) => ({ ...prev, foto_perfil: base64 }));
			} else if (type === "img_empresa") {
				setPerfil((prev) => ({
					...prev,
					Empresa: { ...prev.Empresa, img_empresa: base64 },
				}));
			}
		};
		reader.readAsDataURL(file);
	};

	const handleModelCancel = (model) => {
		setEditMode(!model);
		setPerfil(perfilOriginal);
	};

	const handleSaveChanges = async () => {
		// Mezclar datos originales y actuales para evitar null/undefined
		const empresaBase = perfilOriginal?.Empresa || {};
		const empresaActual = perfil?.Empresa || {};
		const empresaSnapshot = {
			...empresaBase,
			...empresaActual,
			// Ubicación prioriza lo seleccionado en UI
			departamento_ID: departamentoSeleccionado
				? parseInt(departamentoSeleccionado)
				: empresaActual.departamento_ID ??
				  empresaBase.departamento_ID ??
				  null,
			ciudad_ID: ciudadSeleccionada
				? parseInt(ciudadSeleccionada)
				: empresaActual.ciudad_ID ?? empresaBase.ciudad_ID ?? null,
		};

		let erroresTipoCuenta = {};

		const ValidationGeneral = {
			nombre: validateText(perfil?.nombres || ""),
			apellidos: validateText(perfil?.apellidos || ""),
			email: validateEmail(perfil?.email || ""),
			Celular: validateNumber(perfil?.celular || ""),
		};

		if (tipoCuenta === "Empresa") {
			// Validación directa sin variables intermedias
			erroresTipoCuenta = {
				nombre_empresa:
					empresaSnapshot.nombre_empresa &&
					empresaSnapshot.nombre_empresa.trim().length > 0
						? ""
						: "El nombre de la empresa es obligatorio",
				direccion:
					empresaSnapshot.direccion &&
					empresaSnapshot.direccion.trim().length > 0
						? ""
						: "La dirección es obligatoria",
				telefono: validateNumber(empresaSnapshot.telefono || ""),
				email: validateEmail(empresaSnapshot.email_empresa || ""),
				nit: validateNIT(empresaSnapshot?.NIT || ""),
			};
		}

		const error = {
			...ValidationGeneral,
			...erroresTipoCuenta,
		};

		const hastErrors = await createMensajeError(error);
		if (hastErrors != null) {
			alert(hastErrors);
			setPerfil(perfilOriginal); // Revertir cambios locales
			return;
		}

		try {
			// Construir payload seguro
			const payload = { ...perfil };

			if (tipoCuenta === "Empresa" && perfil.Empresa) {
				const empresaPayload = {
					...perfil.Empresa,
					nombre_empresa: (
						perfil.Empresa.nombre_empresa || ""
					).trim(),
					direccion: (perfil.Empresa.direccion || "").trim(),
				};

				payload.documento = empresaPayload.NIT;
				payload.empresa = JSON.stringify(empresaPayload);
			}

			await axiosInstance.put(
				`/api/users/perfil/actualizar/${userId}`,
				payload
			);
			alert("Perfil actualizado con éxito");

			// Recargar perfil desde backend
			const response = await axiosInstance.get(
				`/api/users/profile/${userId}`
			);
			setPerfil(response.data);
			setPerfilOriginal(response.data);

			setEditMode(false);

			// Si venía de redirección por perfil incompleto, redirigir al home
			if (requiresCompletion) {
				navigate("/");
			}
		} catch (error) {
			console.error("Error al actualizar el perfil:", error);
			console.error("Error response:", error.response);

			let errorMessage = "Hubo un error al actualizar el perfil";
			if (error.response?.data?.message) {
				errorMessage = error.response.data.message;
			} else if (typeof error.response?.data === "string") {
				errorMessage = error.response.data;
			} else if (typeof error.response?.data === "object") {
				errorMessage = error.response.data.message
					? error.response.data.message
					: JSON.stringify(error.response.data);
			} else if (error.message) {
				errorMessage = error.message;
			}
			alert(errorMessage);

			if (perfilOriginal) {
				setPerfil(perfilOriginal);
			}
		}
	};

	// Indicador simple de perfil incompleto (datos básicos)
	const perfilIncompleto = !perfil || !perfil.nombres || !perfil.apellidos || !perfil.email;

	return (
		<>
			<Header />
			<Main>
				<div className="container_mainSeeMyProfile">
					<div className="container_profile">
						<h3>{tipoCuenta}</h3>
						<img
							src={
								getImageSrcFromBase64(perfil?.foto_perfil) ||
								"/placeholder.svg"
							}
							alt="Foto de perfil"
							className="profile-img"
							style={{ cursor: editMode ? "pointer" : "default" }}
							onClick={() => {
								if (editMode && fotoPerfilInputRef.current)
									fotoPerfilInputRef.current.click();
							}}
						/>
						{/* Foto de perfil */}
						<input
							type="file"
							accept="image/*"
							ref={fotoPerfilInputRef}
							style={{ display: "none" }}
							onChange={(e) => handleFileChange(e, "foto_perfil")}
						/>

						<h4>
							Datos{" "}
							<span>
								{tipoCuenta === "Empresa"
									? "Manager"
									: tipoCuenta}
							</span>
						</h4>

						<p>
							Nombres <br />
							<input
								type="text"
								name="nombres"
								className="input_updateData"
								value={perfil?.nombres || ""}
								onChange={handleInputChange}
								disabled={!editMode}
							/>
						</p>

						<p>
							Apellidos <br />
							<input
								type="text"
								name="apellidos"
								className="input_updateData"
								value={perfil?.apellidos || ""}
								onChange={handleInputChange}
								disabled={!editMode}
							/>
						</p>

						<p>
							Email <br />
							{editMode ? (
								<input
									type="email"
									name="email"
									className="input_updateData"
									value={perfil?.email || ""}
									onChange={handleInputChange}
								/>
							) : (
								perfil?.email || ""
							)}
						</p>

						<p>
							Celular <br />
							{editMode ? (
								<input
									type="text"
									name="celular"
									className="input_updateData"
									value={perfil?.celular || ""}
									onChange={handleInputChange}
								/>
							) : (
								perfil?.celular || ""
							)}
						</p>

						{tipoCuenta === "Aprendiz" ||
							(tipoCuenta === "Empresa" && (
								<>
									<button
										className={`updateProfile ${
											editMode ? "cancel" : ""
										}`}
										onClick={() =>
											handleModelCancel(editMode)
										}
									>
										{editMode ? "" : ""}
									</button>

									{editMode && (
										<button
											className="updateProfile1"
											onClick={handleSaveChanges}
										></button>
									)}
								</>
							))}
					</div>

					{/* ADMINISTRADOR, INSTRUCTOR, GESTOR */}
					{(tipoCuenta === "Administrador" ||
						tipoCuenta === "Instructor" ||
						tipoCuenta === "Gestor") &&
						perfil?.Sena && (
							<div className="container_data_company">
								<div className="container_nameCompany-Status">
									<div className="name_company">
										<img
											src={getImageSrcFromBase64(
												perfil?.Sena?.img_sena
											)}
											alt="Logo sede"
											className="profile-img"
										/>
										<div>
											<h3>
												{perfil.Sena.nombre_sede || "-"}
											</h3>
											<p>NIT: {perfil.Sena.NIT || "-"}</p>
										</div>
									</div>

									{/* Estado */}
									<div className="status-company">
										<div
											className={`color_status ${
												perfil?.estado === "activo"
													? "status-green"
													: perfil?.estado ===
													  "inactivo"
													? "status-red"
													: ""
											}`}
										></div>
										<h3>Estado</h3>
										{editMode ? (
											<select
												name="estado"
												className="input_updateStatus"
												value={perfil?.estado || ""}
												onChange={handleInputChange}
											>
												<option value="activo">
													Activo
												</option>
												<option value="inactivo">
													Inactivo
												</option>
											</select>
										) : (
											<h4>
												{perfil?.estado === "activo"
													? "Activo"
													: perfil?.estado ===
													  "inactivo"
													? "Inactivo"
													: "-"}
											</h4>
										)}
									</div>
								</div>

								<div className="container_data">
									<div className="data_company">
										<h4 id="titleDataSede">Datos sede</h4>
										<p>
											Dirección: <br />{" "}
											{perfil.Sena.direccion || "-"}
										</p>
										<p>
											Teléfono: <br />{" "}
											{perfil.Sena.telefono || "-"}
										</p>
										<p>
											Email: <br />{" "}
											{perfil.Sena.email_sena || "-"}
										</p>
										<p>
											Ciudad: <br />{" "}
											{perfil.Sena.Ciudad?.nombre || "-"}
										</p>
										<p>
											Departamento: <br />{" "}
											{perfil.Sena.Ciudad?.Departamento
												?.nombre || "-"}
										</p>
									</div>
								</div>
							</div>
						)}

					{/* EMPRESA */}
					{tipoCuenta === "Empresa" && (
						<div className="container_data_company">
							<div className="container_nameCompany-Status">
								<div className="name_company">
									<img
										src={getImageSrcFromBase64(
											perfil?.Empresa?.img_empresa
										)}
										alt="Logo empresa"
										className="profile-img"
										style={{
											cursor: editMode
												? "pointer"
												: "default",
										}}
										onClick={() => {
											if (
												editMode &&
												logoEmpresaInputRef.current
											)
												logoEmpresaInputRef.current.click();
										}}
									/>
									<input
										type="file"
										accept="image/*"
										ref={logoEmpresaInputRef}
										style={{ display: "none" }}
										onChange={(e) =>
											handleFileChange(e, "img_empresa")
										}
									/>
									<div>
										<h3>
											<input
												type="text"
												name="Empresa.nombre_empresa"
												className="input_updateData"
												value={
													perfil?.Empresa
														?.nombre_empresa || ""
												}
												onChange={handleInputChange}
												disabled={!editMode}
											/>
										</h3>
										<p>
											NIT:{" "}
											<input
												type="text"
												name="Empresa.NIT"
												className="input_updateData"
												value={
													perfil?.Empresa?.NIT || ""
												}
												onChange={handleInputChange}
												disabled={!editMode}
											/>
										</p>
									</div>
								</div>

								{/* Estado */}
								<div className="status-company">
									<div
										className={`color_status ${
											perfil?.estado === "activo"
												? "status-green"
												: perfil?.estado === "inactivo"
												? "status-red"
												: ""
										}`}
									></div>
									<h3>Estado</h3>
									{editMode ? (
										<select
											name="estado"
											className="input_updateStatus"
											value={perfil?.estado || ""}
											onChange={handleInputChange}
										>
											<option value="activo">
												Activo
											</option>
											<option value="inactivo">
												Inactivo
											</option>
										</select>
									) : (
										<h4>
											{perfil?.estado === "activo"
												? "Activo"
												: perfil?.estado === "inactivo"
												? "Inactivo"
												: "-"}
										</h4>
									)}
								</div>
							</div>

							<div className="container_data">
								<div className="data_company">
									<h4 id="titleDataSede">Datos Empresa</h4>

									<p>
										Dirección: <br />
										{editMode ? (
											<input
												type="text"
												name="Empresa.direccion"
												className="input_updateData"
												value={
													perfil?.Empresa
														?.direccion || ""
												}
												onChange={handleInputChange}
											/>
										) : (
											perfil?.Empresa?.direccion || ""
										)}
									</p>
									<p>
										Teléfono: <br />
										{editMode ? (
											<input
												type="text"
												name="Empresa.telefono"
												className="input_updateData"
												value={
													perfil?.Empresa?.telefono ||
													""
												}
												onChange={handleInputChange}
											/>
										) : (
											perfil?.Empresa?.telefono || ""
										)}
									</p>
									<p>
										Email: <br />
										{editMode ? (
											<input
												type="text"
												name="Empresa.email_empresa"
												className="input_updateData"
												value={
													perfil?.Empresa
														?.email_empresa || ""
												}
												onChange={handleInputChange}
											/>
										) : (
											perfil?.Empresa?.email_empresa || ""
										)}
									</p>
									<p>
										Categoría: <br />
										{editMode ? (
											<input
												type="text"
												name="Empresa.categoria"
												className="input_updateData"
												value={
													perfil?.Empresa
														?.categoria || ""
												}
												onChange={handleInputChange}
											/>
										) : (
											perfil?.Empresa?.categoria || ""
										)}
									</p>
									<p>
										Departamento: <br />
										{editMode ? (
											<select
												name="departamento"
												className="input_updateData"
												value={departamentoSeleccionado}
												onChange={
													handleDepartamentoChange
												}
											>
												<option value="">
													Seleccionar departamento
												</option>
												{departamentos.map((dep) => (
													<option
														key={dep.ID}
														value={dep.ID}
													>
														{dep.nombre}
													</option>
												))}
											</select>
										) : (
											perfil?.Empresa?.Ciudad
												?.Departamento?.nombre || "-"
										)}
									</p>

									<p>
										Ciudad: <br />
										{editMode ? (
											<select
												name="ciudad"
												className="input_updateData"
												value={ciudadSeleccionada}
												onChange={handleCiudadChange}
												disabled={
													!departamentoSeleccionado
												}
											>
												<option value="">
													Seleccionar ciudad
												</option>
												{ciudades.map((ciudad) => (
													<option
														key={ciudad.ID}
														value={ciudad.ID}
													>
														{ciudad.nombre}
													</option>
												))}
											</select>
										) : (
											perfil?.Empresa?.Ciudad?.nombre ||
											"-"
										)}
									</p>
								</div>

								{/* TODO */}
								<div className="data_courses_instructor">
									<div className="data_courses">
										{cursos.length > 0 ?
											<>
												<b>CURSOS</b>
												{...cursos.map((c) => {
													return <div className='data_course_item'>
														<span>{c.nombre_curso} (ficha {c.ficha})</span>
														<button
															className="button"
															onClick={() => {
																navigate(`/Cursos/${c.ID}`)
															}}
														>Ver curso</button>
													</div>
												})}
											</>
										:
											<b
												style={{
													margin: "auto"
												}}
											>Aún no se han creado cursos complementarios...</b>
										}
									</div>
									{instructores.length > 0 && (
										<div className="data_instructor">
											<b>INSTRUCTORES</b>
											{...instructores.map((i) => {
												return <div className="data_course_item">
													<span>{i.nombre_instructor} ({i.nombre_curso})</span>
													<button
														className="button"
														onClick={() => {
															setShowModalGeneral(true)
															setModalGeneralContent(
																<>
																	<b>Número de telefono</b>
																	<span>{i.numero}</span>
																	<b>Email</b>
																	<span>{i.email}</span>
																</>
															)
														}}
													>Ver contacto</button>
												</div>
											})}
										</div>
									)}
								</div>
							</div>
						</div>
					)}

					{/* SECCIÓN PARA APRENDIZ (si necesitas agregar algo específico) */}
					{tipoCuenta === "Aprendiz" && perfil?.empresa_ID && (
						<div className="container_data_company">
							<div className="container_nameCompany-Status">
								<div className="name_company">
									<div>
										<h3>Empresa Asignada</h3>
										<p>ID: {perfil.empresa_ID || "-"}</p>
									</div>
								</div>
								<div className="status-company">
									<div
										className={`color_status ${
											perfil?.estado === "activo"
												? "status-green"
												: perfil?.estado === "inactivo"
												? "status-red"
												: ""
										}`}
									></div>
									<h3>Estado</h3>
									{editMode ? (
										<select
											name="estado"
											className="input_updateStatus"
											value={perfil?.estado || ""}
											onChange={handleInputChange}
										>
											<option value="activo">
												Activo
											</option>
											<option value="inactivo">
												Inactivo
											</option>
										</select>
									) : (
										<h4>
											{perfil?.estado === "activo"
												? "Activo"
												: perfil?.estado === "inactivo"
												? "Inactivo"
												: "-"}
										</h4>
									)}
								</div>
							</div>
						</div>
					)}
				</div>
			</Main>
			<Footer />
		</>
	);
};
