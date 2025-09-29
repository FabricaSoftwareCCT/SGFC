"use client"

import React, { useEffect, useState } from "react"
import "./SeeMyProfile.css"
import { useLocation, useNavigate } from "react-router-dom"

import { Footer } from '../../../Components/Layouts/Footer/Footer';
import { Main } from '../../../Components/Layouts/Main/Main';
import axiosInstance from '../../../config/axiosInstance';
import { Header } from '../../Layouts/Header/Header';
import fotoPerfilDefect from "../../../assets/Icons/userDefect.png";
import {validateEmail, validateNumber, validateText, validateAddress, createMensajeError, validateNIT } from '../../../utils/Validators/formValidator';

export const SeeMyProfile = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const userId = location.state?.userId
  const fotoPerfilInputRef = React.useRef(null)
  const logoEmpresaInputRef = React.useRef(null)
  const [perfil, setPerfil] = useState(null)
  const [perfilOriginal, setPerfilOriginal] = useState(null)
  const [tipoCuenta, setTipoCuenta] = useState("")
  const [editMode, setEditMode] = useState(false)
  const [perfilIncompleto, setPerfilIncompleto] = useState(false)

  const getImageSrcFromBase64 = (base64) => {
    // Si es null, undefined, vacío o una ruta, retorna imagen por defecto
    if (
      !base64 ||
      base64 === "" ||
      base64 === null ||
      base64.includes("../") ||
      base64.includes("/") ||
      base64 === "../Img/userDefect.png"
    ) {
      return fotoPerfilDefect
    }

    // Si ya es una URL data:image, retornala directamente
    if (base64.startsWith("data:image")) {
      return base64
    }

    // Si es base64 puro, formatea correctamente
    if (base64.startsWith("iVBOR")) {
      return `data:image/png;base64,${base64}`
    } else if (base64.startsWith("/9j/")) {
      return `data:image/jpeg;base64,${base64}`
    } else {
      return `data:image/jpeg;base64,${base64}`
    }
  }

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axiosInstance.get(`/api/users/profile/${userId}`)
        setPerfil(response.data)
        setPerfilOriginal(response.data)
        setTipoCuenta(response.data.accountType)
      } catch (error) {
        console.error("Error al obtener el perfil:", error)
      }
    }

    if (userId) {
      fetchProfile()
    }
  }, [userId])

  // EFFECT PARA VERIFICAR PERFIL INCOMPLETO - CORREGIDO
  useEffect(() => {
    if (tipoCuenta === "Aprendiz" && perfil) {
      // Verificar campos obligatorios para Aprendiz (incluyendo documento)
      const camposRequeridos = ["nombres", "apellidos", "email", "celular", "documento"]
      const incompleto = camposRequeridos.some((campo) => !perfil[campo] || perfil[campo].toString().trim() === "")

      setPerfilIncompleto(incompleto)

      if (incompleto && !localStorage.getItem("alertaPerfilMostrada")) {
        alert("⚠️ Por favor completa tu información de perfil para acceder a todas las funciones del sistema.")
        localStorage.setItem("alertaPerfilMostrada", "true")
      }
    }
  }, [tipoCuenta, perfil])

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

  // FUNCIÓN handleSaveChanges ACTUALIZADA CON VALIDACIÓN DE DOCUMENTO
  const handleSaveChanges = async () => {
    console.log("Perfil actual:", perfil)
    console.log("Tipo de cuenta:", tipoCuenta)

    let errores = {}

    // VALIDACIONES ESPECÍFICAS POR TIPO DE CUENTA
    if (tipoCuenta === "Aprendiz" || tipoCuenta === "Instructor" || tipoCuenta === "Gestor") {
      // Para Aprendiz, Instructor y Gestor: validar nombre, apellido, email, celular Y DOCUMENTO
      errores = {
        nombres: validateText(perfil?.nombres, "Nombres"),
        apellidos: validateText(perfil?.apellidos, "Apellidos"),
        email: validateEmail(perfil?.email),
        celular: validateNumber(perfil?.celular),
        documento: validateDocument(perfil?.documento),
      }
    } else if (tipoCuenta === "Empresa") {
      // Validaciones para Empresa (manager + datos empresa)
      errores = {
        nombres: validateText(perfil?.nombres, "Nombres"),
        apellidos: validateText(perfil?.apellidos, "Apellidos"),
        email: validateEmail(perfil?.email),
        celular: validateNumber(perfil?.celular),
        nombre_empresa: validateText(perfil?.Empresa?.nombre_empresa, "Nombre de empresa"),
        direccion: validateAddress(perfil?.Empresa?.direccion),
        telefono: validateNumber(perfil?.Empresa?.telefono),
        email_empresa: validateEmail(perfil?.Empresa?.email_empresa),
        nit: validateNIT(perfil?.Empresa?.NIT),
      }
    } else if (tipoCuenta === "Administrador") {
      // Para Administrador: solo validaciones básicas (sin documento obligatorio)
      errores = {
        nombres: validateText(perfil?.nombres, "Nombres"),
        apellidos: validateText(perfil?.apellidos, "Apellidos"),
        email: validateEmail(perfil?.email),
        celular: validateNumber(perfil?.celular),
      }
    }

    console.log("Errores de validación:", errores)

    const mensajeError = await createMensajeError(errores)
    if (mensajeError) {
      alert(mensajeError)
      return
    }

    try {
      // Preparar payload según tipo de cuenta
      const payload = {
        nombres: perfil.nombres,
        apellidos: perfil.apellidos,
        email: perfil.email,
        celular: perfil.celular,
        foto_perfil: perfil.foto_perfil,
      }

      // Incluir documento para los tipos de cuenta que lo requieren
      if (tipoCuenta === "Aprendiz" || tipoCuenta === "Instructor" || tipoCuenta === "Gestor") {
        payload.documento = perfil.documento
      }

      // Campos opcionales
      if (perfil.estado) payload.estado = perfil.estado
      if (perfil.titulo_profesional) payload.titulo_profesional = perfil.titulo_profesional
      if (perfil.tipoDocumento) payload.tipoDocumento = perfil.tipoDocumento

      // Datos específicos de empresa
      if (tipoCuenta === "Empresa" && perfil.Empresa) {
        payload.documento = perfil.Empresa.NIT
        payload.empresa = JSON.stringify({
          NIT: perfil.Empresa.NIT,
          nombre_empresa: perfil.Empresa.nombre_empresa,
          direccion: perfil.Empresa.direccion,
          telefono: perfil.Empresa.telefono,
          email_empresa: perfil.Empresa.email_empresa,
          categoria: perfil.Empresa.categoria,
          estado: perfil.Empresa.estado,
          img_empresa: perfil.Empresa.img_empresa,
        })
      }

      console.log("Payload a enviar:", payload)

      const response = await axiosInstance.put(`/api/users/perfil/actualizar/${userId}`, payload)

      console.log("Respuesta del servidor:", response.data)

      alert("Perfil actualizado con éxito")
      setPerfilOriginal(perfil)
      setEditMode(false)

      if (perfilIncompleto && tipoCuenta === "Aprendiz") {
        setPerfilIncompleto(false)
        localStorage.removeItem("alertaPerfilMostrada")
        navigate("/dashboard")
      }
    } catch (error) {
      console.error("Error al actualizar el perfil:", error)
      console.error("Error response data:", error.response?.data)

      let errorMessage = "Hubo un error al actualizar el perfil"
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }

      alert(errorMessage)
      if (perfilOriginal) {
        setPerfil(perfilOriginal)
      }
    }
  }

  return (
    <>
      <Header />
      <Main>
        {perfilIncompleto && (
          <div
            className="alert-perfil-incompleto"
            style={{
              background: "#fff3cd",
              border: "1px solid #ffeaa7",
              padding: "15px",
              margin: "0 20px 20px 20px",
              borderRadius: "5px",
              textAlign: "center",
              color: "#856404",
            }}
          >
            ⚠️ <strong>Perfil Incompleto:</strong> Por favor completa toda tu información para acceder a todas las
            funciones del sistema.
          </div>
        )}

        <div className="container_mainSeeMyProfile">
          <div className="container_profile">
            <h3>{tipoCuenta}</h3>
            <img
              src={getImageSrcFromBase64(perfil?.foto_perfil) || "/placeholder.svg"}
              alt="Foto de perfil"
              className="profile-img"
              style={{ cursor: editMode ? "pointer" : "default" }}
              onClick={() => {
                if (editMode && fotoPerfilInputRef.current) fotoPerfilInputRef.current.click()
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
              Datos <span>{tipoCuenta === "Empresa" ? "Manager" : tipoCuenta}</span>
            </h4>

            {/* NUEVO CAMPO DOCUMENTO PARA APRENDIZ, INSTRUCTOR Y GESTOR */}
            {(tipoCuenta === "Aprendiz" || tipoCuenta === "Instructor" || tipoCuenta === "Gestor") && (
              <p>
                Documento <br />
                {editMode ? (
                  <input
                    type="text"
                    name="documento"
                    className="input_updateData"
                    value={perfil?.documento || ""}
                    onChange={handleInputChange}
                  />
                ) : (
                  perfil?.documento || ""
                )}
              </p>
            )}

            <p>
              Nombres <br />
              {editMode ? (
                <input
                  type="text"
                  name="nombres"
                  className="input_updateData"
                  value={perfil?.nombres || ""}
                  onChange={handleInputChange}
                />
              ) : (
                perfil?.nombres || ""
              )}
            </p>

            <p>
              Apellidos <br />
              {editMode ? (
                <input
                  type="text"
                  name="apellidos"
                  className="input_updateData"
                  value={perfil?.apellidos || ""}
                  onChange={handleInputChange}
                />
              ) : (
                perfil?.apellidos || ""
              )}
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

            <button className={`updateProfile ${editMode ? "cancel" : ""}`} onClick={() => handleModelCancel(editMode)}>
              {editMode ? "Cancelar" : "Editar"}
            </button>

            {editMode && (
              <button className="updateProfile1" onClick={handleSaveChanges}>
                Guardar
              </button>
            )}
          </div>

          {/* SECCIÓN COMPLETA PARA ADMINISTRADOR, INSTRUCTOR Y GESTOR (recuperada del original) */}
          {(tipoCuenta === "Administrador" || tipoCuenta === "Instructor" || tipoCuenta === "Gestor") &&
            perfil?.Sena && (
              <div className="container_data_company">
                <div className="container_nameCompany-Status">
                  <div className="name_company">
                    <img
                      src={getImageSrcFromBase64(perfil?.Sena?.img_sena) || "/placeholder.svg"}
                      alt="Logo sede"
                      className="profile-img"
                    />{" "}
                    <div>
                      <h3>{perfil.Sena.nombre_sede || "-"}</h3>
                      <p>NIT: {perfil.Sena.NIT || "-"}</p>
                    </div>
                  </div>

                  {/* elemento gestión de estado */}
                  <div className="status-company">
                    <div
                      className={`color_status ${perfil?.estado === "activo" ? "status-green" : perfil?.estado === "inactivo" ? "status-red" : ""}`}
                    ></div>
                    <h3>Estado</h3>
                    {editMode ? (
                      <select
                        name="estado"
                        className="input_updateStatus"
                        value={perfil?.estado || ""}
                        onChange={handleInputChange}
                      >
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                      </select>
                    ) : (
                      <h4>
                        {perfil?.estado === "activo" ? "Activo" : perfil?.estado === "inactivo" ? "Inactivo" : "-"}
                      </h4>
                    )}
                  </div>
                </div>
                <div className="container_data">
                  <div className="data_company">
                    <h4 id="titleDataSede">Datos sede</h4>
                    <p>
                      Dirección: <br />
                      {perfil.Sena.direccion || "-"}
                    </p>
                    <p>
                      Teléfono: <br />
                      {perfil.Sena.telefono || "-"}
                    </p>
                    <p>
                      Email: <br />
                      {perfil.Sena.email_sena || "-"}
                    </p>
                    <p>
                      Ciudad: <br />
                      {perfil.Sena.Ciudad?.nombre || "-"}
                    </p>
                    <p>
                      Departamento: <br />
                      {perfil.Sena.Ciudad?.Departamento?.nombre || "-"}
                    </p>
                  </div>
                  <div className="data_courses_instructor">
                    <div className="data_courses">{/* Aquí puedes mostrar cursos si aplica */}</div>
                    <div className="data_instructor">{/* Aquí puedes mostrar datos adicionales si aplica */}</div>
                  </div>
                </div>
              </div>
            )}

          {/* SECCIÓN COMPLETA PARA EMPRESA (recuperada del original) */}
          {tipoCuenta === "Empresa" && (
            <div className="container_data_company">
              <div className="container_nameCompany-Status">
                <div className="name_company">
                  <img
                    src={getImageSrcFromBase64(perfil?.Empresa?.img_empresa) || "/placeholder.svg"}
                    alt="Logo empresa"
                    className="profile-img"
                    style={{ cursor: editMode ? "pointer" : "default" }}
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
                  <div>
                    <h3>
                      {editMode ? (
                        <input
                          type="text"
                          name="Empresa.nombre_empresa"
                          className="input_updateData"
                          value={perfil?.Empresa?.nombre_empresa || ""}
                          onChange={handleInputChange}
                        />
                      ) : (
                        perfil.Empresa.nombre_empresa || "-"
                      )}
                    </h3>
                    <p>
                      NIT:{" "}
                      {editMode ? (
                        <input
                          type="text"
                          name="Empresa.NIT"
                          className="input_updateData"
                          value={perfil?.Empresa?.NIT || ""}
                          onChange={handleInputChange}
                        />
                      ) : (
                        perfil.Empresa.NIT || "-"
                      )}
                    </p>
                  </div>
                </div>
                {/* elemento gestión de estado */}
                <div className="status-company">
                  <div
                    className={`color_status ${perfil?.estado === "activo" ? "status-green" : perfil?.estado === "inactivo" ? "status-red" : ""}`}
                  ></div>
                  <h3>Estado</h3>
                  {editMode ? (
                    <select
                      name="estado"
                      className="input_updateStatus"
                      value={perfil?.estado || ""}
                      onChange={handleInputChange}
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                  ) : (
                    <h4>{perfil?.estado === "activo" ? "Activo" : perfil?.estado === "inactivo" ? "Inactivo" : "-"}</h4>
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
                        value={perfil?.Empresa?.direccion || ""}
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
                        value={perfil?.Empresa?.telefono || ""}
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
                        value={perfil?.Empresa?.email_empresa || ""}
                        onChange={handleInputChange}
                      />
                    ) : (
                      perfil?.Empresa?.email_empresa || ""
                    )}
                  </p>
                  <p>
                    Ciudad: <br />
                    {perfil?.Empresa?.Ciudad?.nombre || "-"}
                  </p>

                  <p>
                    Departamento <br />
                    {perfil?.Empresa?.Ciudad?.Departamento?.nombre || "-"}
                  </p>
                </div>

                <div className="data_courses_instructor">
                  <div className="data_courses">{/* Aquí puedes colocar cursos si los tienes disponibles */}</div>
                  <div className="data_instructor">
                    {/* Aquí puedes colocar datos adicionales del instructor si aplica */}
                  </div>
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
                    className={`color_status ${perfil?.estado === "activo" ? "status-green" : perfil?.estado === "inactivo" ? "status-red" : ""}`}
                  ></div>
                  <h3>Estado</h3>
                  {editMode ? (
                    <select
                      name="estado"
                      className="input_updateStatus"
                      value={perfil?.estado || ""}
                      onChange={handleInputChange}
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                  ) : (
                    <h4>{perfil?.estado === "activo" ? "Activo" : perfil?.estado === "inactivo" ? "Inactivo" : "-"}</h4>
                  )}
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
