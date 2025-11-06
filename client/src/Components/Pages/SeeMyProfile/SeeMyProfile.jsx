"use client"

import React, { useEffect, useState } from "react"
import "./SeeMyProfile.css"
import { useLocation } from "react-router-dom"
import { useNavigate } from "react-router-dom"
import { Footer } from "../../../Components/Layouts/Footer/Footer"
import { Main } from "../../../Components/Layouts/Main/Main"
import axiosInstance from "../../../config/axiosInstance"
import { Header } from "../../Layouts/Header/Header"
import fotoPerfilDefect from "../../../assets/Icons/userDefect.png"
import {
  validateEmail,
  validateNumber,
  validateText,
  createMensajeError,
  validateNIT,
} from "../../../utils/Validators/formValidator"
import { useModal } from "../../../Context/ModalContext"
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css'

export const SeeMyProfile = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const userId = location.state?.userId
  const requiresCompletion = location.state?.requiresCompletion // ← NUEVO
  const fotoPerfilInputRef = React.useRef(null)
  const logoEmpresaInputRef = React.useRef(null)
  const [perfil, setPerfil] = useState(null)
  const [perfilOriginal, setPerfilOriginal] = useState(null) // Guardar el perfil original
  const [tipoCuenta, setTipoCuenta] = useState("")
  const [editMode, setEditMode] = useState(false)
  const [departamentos, setDepartamentos] = useState([])
  const [ciudades, setCiudades] = useState([])
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState("")
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState("")
  const [cursos, setCursos] = useState([])
  const [instructores, setInstructores] = useState([])
  const { setShowModalGeneral, setModalGeneralContent } = useModal()

  const getImageSrcFromBase64 = (value) => {
    // Fallback inmediato si no hay valor
    if (!value) return fotoPerfilDefect

    // Si ya viene como data URL o URL absoluta, úsala tal cual
    if (typeof value === "string" && (value.startsWith("data:") || value.startsWith("http"))) {
      return value
    }

    // Si en BD guardaron una ruta relativa (p.ej. ../Img/userDefect.png), usar por defecto
    if (typeof value === "string" && /(\.png|\.jpg|\.jpeg|\.gif)$/i.test(value)) {
      return fotoPerfilDefect
    }

    const base64 = value
    // Detectar tipo MIME por encabezado base64
    if (typeof base64 === "string" && base64.startsWith("iVBOR")) {
      return `data:image/png;base64,${base64}`
    }
    if (typeof base64 === "string" && base64.startsWith("/9j/")) {
      return `data:image/jpeg;base64,${base64}`
    }

    // Si la cadena es muy corta, probablemente no es una imagen base64 válida
    if (typeof base64 === "string" && base64.length < 100) {
      return fotoPerfilDefect
    }

    // Último recurso: asumir jpeg
    return `data:image/jpeg;base64,${base64}`
  }

  useEffect(() => {
    // Si viene por redirección de perfil incompleto, activar modo edición automáticamente
    if (requiresCompletion) {
      setEditMode(true)
			Swal.fire({
				icon:"info",
				title:"Completar datos de perfil",
				text:"Por favor completa tu perfil para continuar usando la aplicación",
				confirmButtonText:"Aceptar",
				theme:"bulma",
      customClass: { confirmButton: 'centered-swal-button' }
			})
    }

    const fetchProfile = async () => {
      try {
        const response = await axiosInstance.get(`/api/users/profile/${userId}`)
        setPerfil(response.data)
        setPerfilOriginal(response.data) // Guardar el perfil original
        setTipoCuenta(response.data.accountType)

        // Si es empresa, cargar ubicaciones y establecer valores por defecto
        if (response.data.accountType === "Empresa" && response.data.Empresa) {
          await cargarUbicaciones(response.data.Empresa)
          await fetchCursos()
        }

        if (response.data.accountType === "Instructor") {
          await fetchCursosInstructor()
        }
      } catch (error) {
        console.error("Error al obtener el perfil:", error)
        Swal.fire({
					icon:"error",
					title:"Error Perfil",
					text:"Ocurrio un error en el perfil",
					confirmButtonText:"Aceptar",
					confirmButtonColor:"#d33",
					theme:"bulma",
      customClass: { confirmButton: 'centered-swal-button' }
				})
      }
    }

    if (userId) {
      fetchProfile()
    }
  }, [userId, requiresCompletion])

  const fetchCursos = async () => {
    const response = await axiosInstance.get(`/api/users/profile/${userId}`)
    try {
      const cursos = await axiosInstance.get(`/api/courses/empresa/${response.data.Empresa.ID}`)
      if (!cursos.data.success) throw "No se pudo realizar"
      setCursos(cursos.data.cursos)
      setInstructores(
        cursos.data.cursos
          .filter((c) => c.Instructor)
          .map((c) => {
            return {
              ID: c.Instructor.ID,
              nombre_instructor: `${c.Instructor.nombres} ${c.Instructor.apellidos}`,
              nombre_curso: c.nombre_curso,
              id_curso: c.ID,
              numero: c.Instructor.celular,
              email: c.Instructor.email,
            }
          }),
      )
    } catch (error) {
			Swal.fire({
				icon:"error",
				title:"Error al consultar",
				text:"Ocurrió un error al consultar los cursos",
				confirmButtonText:"Okay",
				theme:"bulma",
      customClass: { confirmButton: 'centered-swal-button' }
			})
      console.log(error)
    }
  }

  const fetchCursosInstructor = async () => {
    try {
      const response = await axiosInstance.get(`/api/courses/cursos-asignados/${userId}`)
      console.log("Respuesta de cursos asignados:", response.data)
      
      if (response.data && Array.isArray(response.data)) {
        // Mapear las asignaciones para extraer los cursos
        const cursosAsignados = response.data
          .filter(asignacion => asignacion.Curso) // Filtrar solo asignaciones con curso
          .map(asignacion => asignacion.Curso) // Extraer el curso de cada asignación
        
        setCursos(cursosAsignados)
      } else {
        setCursos([])
      }
    } catch (error) {
      console.error("Error al consultar los cursos del instructor:", error)
      setCursos([])
    }
  }

  const cargarUbicaciones = async (empresaData) => {
  try {
    const departamentosRes = await axiosInstance.get("/api/ubicaciones/departamentos")
    const departamentosData = Array.isArray(departamentosRes.data)
      ? departamentosRes.data
      : departamentosRes.data.data || []
    setDepartamentos(departamentosData)

    if (empresaData.ciudad_ID) {
      const ciudadRes = await axiosInstance.get(`/api/ubicaciones/ciudades/${empresaData.ciudad_ID}`)
      const ciudadData = ciudadRes.data

      if (ciudadData.departamento_ID) {
        // Establecer como string para los selects
        setDepartamentoSeleccionado(ciudadData.departamento_ID.toString())
        setCiudadSeleccionada(empresaData.ciudad_ID.toString())

        // Cargar ciudades del departamento
        const ciudadesRes = await axiosInstance.get(
          `/api/ubicaciones/departamentos/${ciudadData.departamento_ID}/ciudades`,
        )
        const ciudadesData = Array.isArray(ciudadesRes.data) ? ciudadesRes.data : ciudadesRes.data.data || []
        setCiudades(ciudadesData)
      }
    }
  } catch (error) {
    console.error("Error al cargar ubicaciones:", error)
  }
}

  const handleInputChange = (e) => {
    const { name, value } = e.target

    if (name.startsWith("Empresa.")) {
      const key = name.split(".")[1]
      setPerfil((prevPerfil) => ({
        ...prevPerfil,
        Empresa: {
          ...prevPerfil.Empresa,
          [key]: value,
        },
      }))
    } else {
      setPerfil({ ...perfil, [name]: value })
    }
  }

  const handleDepartamentoChange = async (e) => {
  const departamentoId = e.target.value
  setDepartamentoSeleccionado(departamentoId)
  setCiudadSeleccionada("")

  // Actualizar el perfil inmediatamente
  setPerfil((prev) => ({
    ...prev,
    Empresa: {
      ...prev.Empresa,
      departamento_ID: departamentoId ? Number.parseInt(departamentoId) : null,
      ciudad_ID: null, // Resetear ciudad cuando cambia departamento
    },
  }))

  if (departamentoId) {
    try {
      const ciudadesRes = await axiosInstance.get(`/api/ubicaciones/departamentos/${departamentoId}/ciudades`)
      const ciudadesData = Array.isArray(ciudadesRes.data) ? ciudadesRes.data : ciudadesRes.data.data || []
      setCiudades(ciudadesData)
    } catch (error) {
      console.error("Error al cargar ciudades:", error)
      Swal.fire({
					icon:"error",
					title:"Error en el sistema",
					text:"No se pudieron cargar las ciudades",
					confirmButtonText:"Okay",
					theme:"bulma",
      customClass: { confirmButton: 'centered-swal-button' }
				})
      setCiudades([])
    }
  } else {
    setCiudades([])
  }
}

const handleCiudadChange = (e) => {
  const ciudadId = e.target.value
  setCiudadSeleccionada(ciudadId)

  // Actualizar el perfil inmediatamente
  setPerfil((prev) => ({
    ...prev,
    Empresa: {
      ...prev.Empresa,
      ciudad_ID: ciudadId ? Number.parseInt(ciudadId) : null,
    },
  }))
}

  const handleFileChange = (e, type) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result.split(",")[1]
      if (type === "foto_perfil") {
        setPerfil((prev) => ({ ...prev, foto_perfil: base64 }))
      } else if (type === "img_empresa") {
        setPerfil((prev) => ({
          ...prev,
          Empresa: { ...prev.Empresa, img_empresa: base64 },
        }))
      }
    }
    reader.readAsDataURL(file)
  }

  const handleModelCancel = (model) => {
    setEditMode(!model)
    setPerfil(perfilOriginal)
  }

  console.log("Estado actual del perfil:", {
  departamentoSeleccionado,
  ciudadSeleccionada,
  empresa: perfil?.Empresa
})

  const handleSaveChanges = async () => {
    // Mezclar datos originales y actuales para evitar null/undefined
    const empresaBase = perfilOriginal?.Empresa || {}
    const empresaActual = perfil?.Empresa || {}
    const empresaSnapshot = {
      ...empresaBase,
      ...empresaActual,
      // Ubicación prioriza lo seleccionado en UI
      departamento_ID: departamentoSeleccionado
        ? Number.parseInt(departamentoSeleccionado)
        : (empresaActual.departamento_ID ?? empresaBase.departamento_ID ?? null),
      ciudad_ID: ciudadSeleccionada
        ? Number.parseInt(ciudadSeleccionada)
        : (empresaActual.ciudad_ID ?? empresaBase.ciudad_ID ?? null),
    }

    let erroresTipoCuenta = {}

    const ValidationGeneral = {
      nombre: validateText(perfil?.nombres || ""),
      apellidos: validateText(perfil?.apellidos || ""),
      email: validateEmail(perfil?.email || ""),
      Celular: validateNumber(perfil?.celular || ""),
    }

    if (tipoCuenta === "Empresa") {
      // Validación directa sin variables intermedias
      erroresTipoCuenta = {
        nombre_empresa:
          empresaSnapshot.nombre_empresa && empresaSnapshot.nombre_empresa.trim().length > 0
            ? ""
            : "El nombre de la empresa es obligatorio",
        direccion:
          empresaSnapshot.direccion && empresaSnapshot.direccion.trim().length > 0 ? "" : "La dirección es obligatoria",
        telefono: validateNumber(empresaSnapshot.telefono || ""),
        email: validateEmail(empresaSnapshot.email_empresa || ""),
        nit: validateNIT(empresaSnapshot?.NIT || ""),
      }
    }

    const error = {
      ...ValidationGeneral,
      ...erroresTipoCuenta,
    }

    const hastErrors = await createMensajeError(error)
    if (hastErrors != null) {
			Swal.fire({
				icon: 'error',
				title: 'Error de validación',
				html: hastErrors,
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#d33',
				theme:"bulma",
      customClass: { confirmButton: 'centered-swal-button' }
			});
      setPerfil(perfilOriginal) // Revertir cambios locales
      return
    }

    try {
      // Construir payload seguro
      const payload = { ...perfil }

      if (tipoCuenta === "Empresa" && perfil.Empresa) {
        const empresaPayload = {
          ...perfil.Empresa,
          nombre_empresa: (perfil.Empresa.nombre_empresa || "").trim(),
          direccion: (perfil.Empresa.direccion || "").trim(),
        }

        payload.documento = empresaPayload.NIT
        payload.empresa = JSON.stringify(empresaPayload)
      }

      await axiosInstance.put(`/api/users/perfil/actualizar/${userId}`, payload)
			Swal.fire({
				icon: 'success',
				title: 'Perfil actualizado',
				text: 'Perfil actualizado con éxito',
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#049019',
				theme:"bulma",
      customClass: { confirmButton: 'centered-swal-button' }
			});

      // Recargar perfil desde backend
      const response = await axiosInstance.get(`/api/users/profile/${userId}`)
      setPerfil(response.data)
      setPerfilOriginal(response.data)

      setEditMode(false)

      // Si venía de redirección por perfil incompleto, redirigir al home
      if (requiresCompletion) {
        navigate("/")
      }
    } catch (error) {
      console.error("Error al actualizar el perfil:", error)
      console.error("Error response:", error.response)

      let errorMessage = "Hubo un error al actualizar el perfil"
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (typeof error.response?.data === "string") {
        errorMessage = error.response.data
      } else if (typeof error.response?.data === "object") {
        errorMessage = error.response.data.message ? error.response.data.message : JSON.stringify(error.response.data)
      } else if (error.message) {
        errorMessage = error.message
      }
			Swal.fire({
				icon: 'error',
				title: 'Error',
				text: errorMessage,
				confirmButtonText: 'Aceptar',
				confirmButtonColor: '#d33',
				theme:"bulma",
      customClass: { confirmButton: 'centered-swal-button' }
			});

      if (perfilOriginal) {
        setPerfil(perfilOriginal)
      }
    }
  }

  // Indicador simple de perfil incompleto (datos básicos)
  const perfilIncompleto = !perfil || !perfil.nombres || !perfil.apellidos || !perfil.email

  return (
    <>
      <Header />
      <Main>
        <div className="container_mainSeeMyProfile">
          <div className="container_profile">
            {/* Sección superior: foto y rol */}
            <div className="profile_header_section">
              <img
                src={getImageSrcFromBase64(perfil?.foto_perfil) || "/placeholder.svg"}
                alt="Foto de perfil"
                className="profile-img"
                style={{ cursor: editMode ? "pointer" : "default" }}
                onClick={() => {
                  if (editMode && fotoPerfilInputRef.current) fotoPerfilInputRef.current.click()
                }}
              />
              <input
                type="file"
                accept="image/*"
                ref={fotoPerfilInputRef}
                style={{ display: "none" }}
                onChange={(e) => handleFileChange(e, "foto_perfil")}
              />
              <h3 className="profile_role">{tipoCuenta}</h3>
              <p className="profile_email">{perfil?.email || ""}</p>
            </div>

            {/* Sección inferior: datos del usuario */}
            <div className="profile_data_section">
              <h4 className="profile_data_title">Datos {tipoCuenta === "Empresa" ? "Manager" : tipoCuenta}</h4>

              <div className="profile_field">
                <label>Nombre:</label>
                <input
                  type="text"
                  name="nombres"
                  className="input_updateData"
                  placeholder="Ingrese su nombre..."
                  value={perfil?.nombres || ""}
                  onChange={handleInputChange}
                  disabled={!editMode}
                />
              </div>

              <div className="profile_field">
                <label>Apellido:</label>
                <input
                  type="text"
                  name="apellidos"
                  className="input_updateData"
                  placeholder="Ingrese su apellido..."
                  value={perfil?.apellidos || ""}
                  onChange={handleInputChange}
                  disabled={!editMode}
                />
              </div>

              <div className="profile_field">
                <label>Email:</label>
                {editMode ? (
                  <input
                    type="email"
                    name="email"
                    className="input_updateData"
                    placeholder="Ingrese su email..."
                    value={perfil?.email || ""}
                    onChange={handleInputChange}
                  />
                ) : (
                  <span className="profile_value">{perfil?.email || ""}</span>
                )}
              </div>

              <div className="profile_field">
                <label>Celular:</label>
                {editMode ? (
                  <input
                    type="text"
                    name="celular"
                    className="input_updateData"
                    placeholder="Ingrese su celular..."
                    value={perfil?.celular || ""}
                    onChange={handleInputChange}
                  />
                ) : (
                  <span className="profile_value">{perfil?.celular || ""}</span>
                )}
              </div>
            </div>

            {(tipoCuenta === "Aprendiz" || tipoCuenta === "Empresa" || tipoCuenta === "Instructor") && (
              <>
                <button
                  className={`updateProfile ${editMode ? "cancel" : ""}`}
                  onClick={() => handleModelCancel(editMode)}
                >
                  {editMode ? "" : ""}
                </button>

                {editMode && <button className="updateProfile1" onClick={handleSaveChanges}></button>}
              </>
            )}
          </div>

          {(tipoCuenta === "Administrador" || tipoCuenta === "Instructor" || tipoCuenta === "Gestor") &&
            perfil?.Sena && (
              <div className="admin_profile_container">
                {/* Header con logo SENA y estado */}
                <div className="admin_header">
                  <div className="admin_header_left">
                    <img
                      src={getImageSrcFromBase64(perfil?.Sena?.img_sena) || "/placeholder.svg"}
                      alt="Logo sede"
                      className="sena_logo"
                    />
                    <div className="sena_info">
                      <h2 className="sena_nombre">
                        Centro de Comercio y <span className="text_turismo">Turismo</span>
                      </h2>
                      <p className="sena_nit">Nit: {perfil.Sena.NIT || "899.999.034-1"}</p>
                    </div>
                  </div>

                  <div className="admin_header_right">
                    <div className="admin_status_badge">
                      <div
                        className={`status_indicator ${
                          perfil?.estado === "activo" ? "status_active" : "status_inactive"
                        }`}
                      ></div>
                      <div className="status_text">
                        <span className="status_label">{perfil?.estado === "activo" ? "Activo" : "Inactivo"}</span>
                        <span className="status_role">{tipoCuenta}</span>
                      </div>
                    </div>

                    {editMode && (
                      <div className="admin_action_buttons">
                        <button className="btn_guardar" onClick={handleSaveChanges}>
                          Guardar
                        </button>
                        <button className="btn_cancelar" onClick={() => handleModelCancel(editMode)}>
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Datos Sede */}
                <div className="admin_datos_section">
                  <h3 className="section_title">Datos de Sede</h3>
                  <div className="admin_datos_grid">
                    <div className="admin_field">
                      <label>Teléfono:</label>
                      <span className="admin_value">{perfil.Sena.telefono || "-"}</span>
                    </div>

                    <div className="admin_field">
                      <label>Dirección:</label>
                      <span className="admin_value">{perfil.Sena.direccion || "-"}</span>
                    </div>

                    <div className="admin_field">
                      <label>Email:</label>
                      <span className="admin_value">{perfil.Sena.email_sena || "-"}</span>
                    </div>

                    <div className="admin_field">
                      <label>Departamento:</label>
                      <span className="admin_value">{perfil.Sena.Ciudad?.Departamento?.nombre || "-"}</span>
                    </div>

                    <div className="admin_field">
                      <label>Ciudad:</label>
                      <span className="admin_value">{perfil.Sena.Ciudad?.nombre || "-"}</span>
                    </div>
                  </div>
                </div>

                {tipoCuenta === "Instructor" && (
                <div className="admin_cursos_section">
                  <h3 className="section_title">Cursos Asignados</h3>
                  <div className="cursos_table">
                    {cursos.length > 0 ? (
                      <>
                        {cursos.map((c) => (
                          <div key={c.ID} className="curso_row">
                            <div className="curso_info">
                              <span className="curso_nombre">{c.nombre_curso}</span>
                              <span className="curso_descripcion">
                                {c.descripcion 
                                  ? (c.descripcion.length > 120 
                                      ? `${c.descripcion.substring(0, 120)}...` 
                                      : c.descripcion)
                                  : "Descripción no disponible"
                                }
                              </span>
                            </div>
                            <button
                              className="btn_ver_detalles"
                              onClick={() => {
                                navigate(`/Cursos/${c.ID}`)
                              }}
                            >
                              Ver detalles
                            </button>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="cursos_empty">
                        <p>Aún no tienes cursos asignados...</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              </div>
            )}

          {/* EMPRESA */}
{tipoCuenta === "Empresa" && (
  <div className="empresa_profile_container">
    {/* Header con info de empresa y estado */}
    <div className="empresa_header">
      <div className="empresa_header_left">
        <img
          src={getImageSrcFromBase64(perfil?.Empresa?.img_empresa) || "/placeholder.svg"}
          alt="Logo empresa"
          className="empresa_logo"
          style={{
            cursor: editMode ? "pointer" : "default",
          }}
          onClick={() => {
            if (editMode && logoEmpresaInputRef.current) logoEmpresaInputRef.current.click()
          }}
        />
        <input
          type="file"
          accept="image/*"
          ref={logoEmpresaInputRef}
          style={{ display: "none" }}
          onChange={(e) => handleFileChange(e, "img_empresa")}
        />
        <div className="empresa_info">
          <h2 className="empresa_nombre">
            {editMode ? (
              <input
                type="text"
                name="Empresa.nombre_empresa"
                className="empresa_input_nombre"
                value={perfil?.Empresa?.nombre_empresa || ""}
                onChange={handleInputChange}
              />
            ) : (
              perfil?.Empresa?.nombre_empresa || ""
            )}
          </h2>
          <p className="empresa_nit">
            Nit:{" "}
            {editMode ? (
              <input
                type="text"
                name="Empresa.NIT"
                className="empresa_input_nit"
                value={perfil?.Empresa?.NIT || ""}
                onChange={handleInputChange}
              />
            ) : (
              perfil?.Empresa?.NIT || ""
            )}
          </p>
        </div>
      </div>

      <div className="empresa_header_right">
        <div className="empresa_status_badge">
          <div
            className={`status_indicator ${
              perfil?.estado === "activo" ? "status_active" : "status_inactive"
            }`}
          ></div>
          <div className="status_text">
            <span className="status_label">{perfil?.estado === "activo" ? "Activo" : "Inactivo"}</span>
            <span className="status_role">Manager</span>
          </div>
        </div>

        {editMode && (
          <div className="empresa_action_buttons">
            <button className="btn_guardar" onClick={handleSaveChanges}>
              Guardar
            </button>
            <button className="btn_cancelar" onClick={() => handleModelCancel(editMode)}>
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>

    {/* Datos Empresa - ACTUALIZADO CON NUEVOS CAMPOS */}
    <div className="empresa_datos_section">
      <h3 className="section_title">Datos Empresa</h3>
      <div className="empresa_datos_grid">
        <div className="empresa_field">
          <label>Teléfono:</label>
          {editMode ? (
            <input
              type="text"
              name="Empresa.telefono"
              className="empresa_input"
              placeholder="Ingrese un teléfono..."
              value={perfil?.Empresa?.telefono || ""}
              onChange={handleInputChange}
            />
          ) : (
            <span className="empresa_value">{perfil?.Empresa?.telefono || "-"}</span>
          )}
        </div>

        <div className="empresa_field">
          <label>Dirección:</label>
          {editMode ? (
            <input
              type="text"
              name="Empresa.direccion"
              className="empresa_input"
              placeholder="Ingrese una dirección..."
              value={perfil?.Empresa?.direccion || ""}
              onChange={handleInputChange}
            />
          ) : (
            <span className="empresa_value">{perfil?.Empresa?.direccion || "-"}</span>
          )}
        </div>

        <div className="empresa_field">
          <label>Email Corporativo:</label>
          {editMode ? (
            <input
              type="text"
              name="Empresa.email_empresa"
              className="empresa_input"
              placeholder="Ingrese un email..."
              value={perfil?.Empresa?.email_empresa || ""}
              onChange={handleInputChange}
            />
          ) : (
            <span className="empresa_value">{perfil?.Empresa?.email_empresa || "-"}</span>
          )}
        </div>

        <div className="empresa_field">
          <label>Categoría:</label>
          {editMode ? (
            <select
              name="Empresa.categoria"
              className="empresa_input-s"
              value={perfil?.Empresa?.categoria || ""}
              onChange={handleInputChange}
            >
              <option value="">Seleccione una categoría...</option>
              <option value="tecnologia">Tecnología</option>
              <option value="servicios">Servicios</option>
              <option value="comercio">Comercio</option>
              <option value="industria">Industria</option>
              <option value="educacion">Educación</option>
              <option value="salud">Salud</option>
              <option value="construccion">Construcción</option>
              <option value="alimentos">Alimentos</option>
              <option value="textil">Textil</option>
            </select>
          ) : (
            <span className="empresa_value">
              {perfil?.Empresa?.categoria ? 
                perfil.Empresa.categoria.charAt(0).toUpperCase() + perfil.Empresa.categoria.slice(1) 
                : "-"
              }
            </span>
          )}
        </div>

        <div className="empresa_field">
          <label>Departamento:</label>
          {editMode ? (
            <select
              name="departamento"
              className="empresa_input-s"
              value={departamentoSeleccionado || ""}  
              onChange={handleDepartamentoChange}
            >
              <option value="">Seleccione un departamento...</option>
              {departamentos.map((dep) => (
                <option key={dep.ID} value={dep.ID.toString()}>
                  {dep.nombre}
                </option>
              ))}
            </select>
          ) : (
            <span className="empresa_value">{perfil?.Empresa?.Ciudad?.Departamento?.nombre || "-"}</span>
          )}
        </div>

        <div className="empresa_field">
          <label>Ciudad:</label>
          {editMode ? (
            <select
              name="ciudad"
              className={`empresa_input-s ${!departamentoSeleccionado ? 'select-disabled' : ''}`}
              value={ciudadSeleccionada || ""}
              onChange={handleCiudadChange}
            >
              <option value="">Seleccione una ciudad...</option>
              {ciudades.map((ciudad) => (
                <option key={ciudad.ID} value={ciudad.ID.toString()}>
                  {ciudad.nombre}
                </option>
              ))}
            </select>
          ) : (
            <span className="empresa_value">{perfil?.Empresa?.Ciudad?.nombre || "-"}</span>
          )}
        </div>
      </div>

      {/* NUEVO: Descripción de la Empresa */}
      <div className="empresa_field_full">
        <label>Descripción de la Empresa:</label>
        {editMode ? (
          <textarea
            name="Empresa.descripcion"
            className="empresa_textarea"
            placeholder="Describa los servicios, misión, visión y valores de la empresa..."
            value={perfil?.Empresa?.descripcion || ""}
            onChange={handleInputChange}
            rows="4"
          />
        ) : (
          <div className="empresa_descripcion">
            {perfil?.Empresa?.descripcion || "No hay descripción disponible"}
          </div>
        )}
      </div>

      {/* NUEVO: Enlaces de Redes Sociales */}
      {(perfil?.Empresa?.sitio_web && Object.keys(perfil.Empresa.sitio_web).some(key => perfil.Empresa.sitio_web[key])) || editMode ? (
        <div className="empresa_redes_sociales">
          <h4 className="redes_sociales_title">Enlaces de Contacto</h4>
          <div className="redes_sociales_grid">
            {/* Sitio Web */}
            <div className="red_social_item">
              <label>🌐 Sitio Web:</label>
              {editMode ? (
                <input
                  type="url"
                  name="Empresa.sitio_web.web"
                  className="empresa_input"
                  placeholder="https://www.empresa.com"
                  value={perfil?.Empresa?.sitio_web?.web || ""}
                  onChange={handleInputChange}
                />
              ) : (
                perfil?.Empresa?.sitio_web?.web ? (
                  <a href={perfil.Empresa.sitio_web.web} target="_blank" rel="noopener noreferrer" className="red_social_link">
                    {perfil.Empresa.sitio_web.web}
                  </a>
                ) : (
                  <span className="empresa_value">-</span>
                )
              )}
            </div>

            {/* Facebook */}
            <div className="red_social_item">
              <label>📘 Facebook:</label>
              {editMode ? (
                <input
                  type="url"
                  name="Empresa.sitio_web.facebook"
                  className="empresa_input"
                  placeholder="https://facebook.com/empresa"
                  value={perfil?.Empresa?.sitio_web?.facebook || ""}
                  onChange={handleInputChange}
                />
              ) : (
                perfil?.Empresa?.sitio_web?.facebook ? (
                  <a href={perfil.Empresa.sitio_web.facebook} target="_blank" rel="noopener noreferrer" className="red_social_link">
                    {perfil.Empresa.sitio_web.facebook}
                  </a>
                ) : (
                  <span className="empresa_value">-</span>
                )
              )}
            </div>

            {/* Instagram */}
            <div className="red_social_item">
              <label>📷 Instagram:</label>
              {editMode ? (
                <input
                  type="url"
                  name="Empresa.sitio_web.instagram"
                  className="empresa_input"
                  placeholder="https://instagram.com/empresa"
                  value={perfil?.Empresa?.sitio_web?.instagram || ""}
                  onChange={handleInputChange}
                />
              ) : (
                perfil?.Empresa?.sitio_web?.instagram ? (
                  <a href={perfil.Empresa.sitio_web.instagram} target="_blank" rel="noopener noreferrer" className="red_social_link">
                    {perfil.Empresa.sitio_web.instagram}
                  </a>
                ) : (
                  <span className="empresa_value">-</span>
                )
              )}
            </div>

            {/* LinkedIn */}
            <div className="red_social_item">
              <label>💼 LinkedIn:</label>
              {editMode ? (
                <input
                  type="url"
                  name="Empresa.sitio_web.linkedin"
                  className="empresa_input"
                  placeholder="https://linkedin.com/company/empresa"
                  value={perfil?.Empresa?.sitio_web?.linkedin || ""}
                  onChange={handleInputChange}
                />
              ) : (
                perfil?.Empresa?.sitio_web?.linkedin ? (
                  <a href={perfil.Empresa.sitio_web.linkedin} target="_blank" rel="noopener noreferrer" className="red_social_link">
                    {perfil.Empresa.sitio_web.linkedin}
                  </a>
                ) : (
                  <span className="empresa_value">-</span>
                )
              )}
            </div>

            {/* Twitter */}
            <div className="red_social_item">
              <label>🐦 Twitter:</label>
              {editMode ? (
                <input
                  type="url"
                  name="Empresa.sitio_web.twitter"
                  className="empresa_input"
                  placeholder="https://twitter.com/empresa"
                  value={perfil?.Empresa?.sitio_web?.twitter || ""}
                  onChange={handleInputChange}
                />
              ) : (
                perfil?.Empresa?.sitio_web?.twitter ? (
                  <a href={perfil.Empresa.sitio_web.twitter} target="_blank" rel="noopener noreferrer" className="red_social_link">
                    {perfil.Empresa.sitio_web.twitter}
                  </a>
                ) : (
                  <span className="empresa_value">-</span>
                )
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>

    {/* Cursos Complementarios */}
    <div className="empresa_cursos_section">
      <h3 className="section_title">Cursos Complementarios</h3>
      <div className="cursos_table">
        {cursos.length > 0 ? (
          <>
            {cursos.map((c) => (
              <div key={c.ID} className="curso_row">
                <div className="curso_info">
                  <span className="curso_nombre">{c.nombre_curso}</span>
                  <span className="curso_descripcion">
                    {c.descripcion || "Lorem Ipsum is simply dummy text of the printing and..."}
                  </span>
                </div>
                <button
                  className="btn_ver_detalles"
                  onClick={() => {
                    navigate(`/Cursos/${c.ID}`)
                  }}
                >
                  Ver detalles
                </button>
              </div>
            ))}
          </>
        ) : (
          <div className="cursos_empty">
            <p>Aún no se han creado cursos complementarios...</p>
          </div>
        )}
      </div>
    </div>

    {/* Instructores */}
    {instructores.length > 0 && (
      <div className="empresa_instructores_section">
        <h3 className="section_title">Instructores</h3>
        <div className="instructores_list">
          {instructores.map((i) => (
            <div key={i.ID} className="instructor_item">
              <span className="instructor_nombre">
                {i.nombre_instructor} ({i.nombre_curso})
              </span>
              <button
                className="btn_ver_contacto"
                onClick={() => {
                  setShowModalGeneral(true)
                  setModalGeneralContent(
                    <>
                      <b>Número de telefono</b>
                      <span>{i.numero}</span>
                      <b>Email</b>
                      <span>{i.email}</span>
                    </>,
                  )
                }}
              >
                Ver contacto
              </button>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
)}

          {tipoCuenta === "Aprendiz" && perfil?.empresa_ID && (
            <div className="aprendiz_profile_container">
              {/* Header simple */}
              <div className="aprendiz_header">
                <div className="aprendiz_header_left">
                  <div className="sena_info">
                    <h2 className="sena_nombre">
                      Centro de Comercio y <span className="text_turismo">Turismo</span>
                    </h2>
                    <p className="sena_nit">Nit: 899.999.034-1</p>
                  </div>
                </div>
              </div>

              {/* Datos Empleado */}
              <div className="aprendiz_datos_section">
                <h3 className="section_title">Datos Empleado</h3>
                <div className="aprendiz_empresa_info">
                  <p>
                    <strong>Nombre empresa:</strong> IBG
                  </p>
                  <p>
                    <strong>ID:</strong> {perfil.empresa_ID || "1"}
                  </p>
                </div>
                <div className="aprendiz_datos_grid">
                  <div className="aprendiz_field">
                    <label>Nombre:</label>
                    <input
                      type="text"
                      name="nombres"
                      className="aprendiz_input"
                      placeholder="Ingrese un nombre..."
                      value={perfil?.nombres || ""}
                      onChange={handleInputChange}
                      disabled={!editMode}
                    />
                  </div>

                  <div className="aprendiz_field">
                    <label>Apellido:</label>
                    <input
                      type="text"
                      name="apellidos"
                      className="aprendiz_input"
                      placeholder="Ingrese un apellido..."
                      value={perfil?.apellidos || ""}
                      onChange={handleInputChange}
                      disabled={!editMode}
                    />
                  </div>

                  <div className="aprendiz_field">
                    <label>Email:</label>
                    {editMode ? (
                      <input
                        type="email"
                        name="email"
                        className="aprendiz_input"
                        placeholder="Ingrese un email..."
                        value={perfil?.email || ""}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <span className="aprendiz_value">{perfil?.email || "-"}</span>
                    )}
                  </div>

                  <div className="aprendiz_field">
                    <label>Celular:</label>
                    {editMode ? (
                      <input
                        type="text"
                        name="celular"
                        className="aprendiz_input"
                        placeholder="Ingrese un celular..."
                        value={perfil?.celular || ""}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <span className="aprendiz_value">{perfil?.celular || "-"}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Main>
      <Footer />
    </>
  )
}