"use client"

import { useState, useEffect } from "react"
import "./GestionsEmployes.css"
import { Header } from "../../Layouts/Header/Header"
import { Footer } from "../../../Components/Layouts/Footer/Footer"
import { Main } from "../../../Components/Layouts/Main/Main"
import { UpdateEmploye } from "./UpdateEmploye/UpdateEmploye"
import axiosInstance from "../../../config/axiosInstance"
import { useModal } from "../../../Context/ModalContext"

export const GestionsEmployes = () => {
  const [employes, setEmployes] = useState([])
  const [filteredEmployes, setFilteredEmployes] = useState([])
  const [filter, setFilter] = useState("")
  const [current, setCurrent] = useState(0)
  const [selectedState, setSelectedState] = useState({
    activo: true,
    inactivo: true,
  })
  const [selectedEmploye, setSelectedEmploye] = useState(null)

  const [empresas, setEmpresas] = useState([])
  const [selectedEmpresa, setSelectedEmpresa] = useState("")
  const [selectedTipoDocumento, setSelectedTipoDocumento] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(false)

  const { setShowModalCreateEmployee } = useModal()
  const userSession =
    JSON.parse(localStorage.getItem("userSession")) || JSON.parse(sessionStorage.getItem("userSession"))

  const isLoggedIn = !!userSession
  const accountType = userSession?.accountType || null
  const isAdmin = accountType === "Administrador"

  const fetchEmployes = async (page = 1) => {
    setLoading(true)
    try {
      if (isAdmin) {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "10",
          search: filter,
          empresaId: selectedEmpresa,
          estado: selectedState.activo && selectedState.inactivo ? "" : selectedState.activo ? "activo" : "inactivo",
          tipoDocumento: selectedTipoDocumento,
        })

        const response = await axiosInstance.get(`/api/users/admin/empleados?${params}`)
        console.log("Respuesta del servidor (admin):", response.data); // Debug
        const data = response.data || {}
        const empleados = data.empleados || []
        console.log("Empleados procesados:", empleados); // Debug
        setEmployes(empleados)
        setFilteredEmployes(empleados)
        setCurrentPage(data.pagination?.currentPage || 1)
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalItems(data.pagination?.totalItems || 0)
      } else {
        const userSessionString = localStorage.getItem("userSession") || sessionStorage.getItem("userSession")
        if (!userSessionString) {
          alert("No se encontró la sesión de usuario.")
          return
        }
        const userSession = JSON.parse(userSessionString)
        const empresaId = userSession.empresa_ID

        const response = await axiosInstance.get(`/api/users/empresa/${empresaId}/empleados`)
        console.log("Respuesta del servidor (gestor):", response.data); // Debug
        const data = response.data || {}
        const empleados = data.empleados || []
        console.log("Empleados procesados:", empleados); // Debug
        setEmployes(empleados)
        setFilteredEmployes(empleados)
      }
    } catch (error) {
      console.error("Error al obtener los empleados:", error)
      alert("Hubo un problema al cargar los empleados. Por favor, inténtalo más tarde.")
    } finally {
      setLoading(false)
    }
  }

  const fetchEmpresas = async () => {
    if (!isAdmin) return

    try {
      const response = await axiosInstance.get("/api/users/admin/empresas")
      setEmpresas(response.data.empresas || [])
    } catch (error) {
      console.error("Error al obtener las empresas:", error)
    }
  }

  useEffect(() => {
    fetchEmployes()
    if (isAdmin) {
      fetchEmpresas()
    }
  }, [])

  useEffect(() => {
    if (isAdmin) {
      fetchEmployes(1)
    } else {
      applyFilters()
    }
  }, [selectedState, filter, selectedEmpresa, selectedTipoDocumento])

  useEffect(() => {
    if (isAdmin) {
      const timeoutId = setTimeout(() => {
        fetchEmployes(1)
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [filter])

  const applyFilters = () => {
    const filtered = employes.filter(
      (employe) =>
        (employe.nombres || "").toLowerCase().includes(filter.toLowerCase()) ||
        (employe.apellidos || "").toLowerCase().includes(filter.toLowerCase()) ||
        (employe.documento || "").toLowerCase().includes(filter.toLowerCase()),
    )

    const filteredByState = filtered.filter((employe) => {
      const estado = (employe.estado || "").toLowerCase()
      if (selectedState.activo && estado === "activo") return true
      if (selectedState.inactivo && estado === "inactivo") return true
      return false
    })

    setFilteredEmployes(filteredByState)
    setCurrent(0)
  }

  const handleFilterChange = (e) => {
    setFilter(e.target.value)
  }

  const handleEmpresaChange = (e) => {
    setSelectedEmpresa(e.target.value)
  }

  const handleTipoDocumentoChange = (e) => {
    setSelectedTipoDocumento(e.target.value)
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchEmployes(newPage)
    }
  }

  const next = () => {
    if (isAdmin) {
      handlePageChange(currentPage + 1)
    } else {
      setCurrent((prev) => (prev + 1) % filteredEmployes.length)
    }
  }

  const prev = () => {
    if (isAdmin) {
      handlePageChange(currentPage - 1)
    } else {
      setCurrent((prev) => (prev - 1 + filteredEmployes.length) % filteredEmployes.length)
    }
  }

  const showModalCreateEmploye = () => {
    setShowModalCreateEmployee(true)
  }

  const showModalSeeProfile = (employe) => {
    console.log("Seleccionando empleado:", employe)
    setSelectedEmploye(employe)
    setTimeout(() => {
      const modalSeeProfile = document.getElementById("modal-overlayUpdateEmploye")
      if (modalSeeProfile) {
        modalSeeProfile.style.display = "flex"
      }
    }, 100)
  }

  const getImageSrcFromBase64 = (imageData) => {
    console.log("Procesando imagen:", imageData); // Debug
    
    // Si no hay datos de imagen, usar imagen por defecto
    if (!imageData) {
      console.log("No hay datos de imagen, usando placeholder");
      return "/src/assets/Icons/userDefect.png"
    }
    
    // Si es una ruta de archivo (empieza con ../ o /)
    if (typeof imageData === 'string' && (imageData.startsWith('../') || imageData.startsWith('/'))) {
      console.log("Es una ruta de archivo:", imageData);
      // Convertir ruta relativa a ruta absoluta
      if (imageData.startsWith('../Img/')) {
        const newPath = imageData.replace('../Img/', '/src/assets/Icons/')
        console.log("Ruta convertida:", newPath);
        return newPath
      }
      return imageData
    }
    
    // Si es base64
    if (typeof imageData === 'string') {
      if (imageData.startsWith("iVBOR")) {
        console.log("Es PNG base64");
        return `data:image/png;base64,${imageData}`
      }
      if (imageData.startsWith("/9j/")) {
        console.log("Es JPEG base64");
        return `data:image/jpeg;base64,${imageData}`
      }
      if (imageData.startsWith("data:")) {
        console.log("Ya es una URL de datos");
        return imageData // Ya es una URL de datos
      }
      console.log("Asumiendo JPEG base64");
      return `data:image/jpeg;base64,${imageData}`
    }
    
    console.log("Fallback a imagen por defecto");
    return "/src/assets/Icons/userDefect.png"
  }

  return (
    <>
      <Header />
      <Main>
        <div className="container_GestionsEmploye">
          <h2>
            {isAdmin ? "Gestión de " : "Mis "}
            <span className="complementary">Empleados</span>
          </h2>

          <div className="containerGestionsEmployeOptions">
            <div className="containerConsultEmploye">
              <p>Filtrar por:</p>
              <div className="containerFiltersEmploye">
                <label htmlFor="inputNameCC">Nombre, Cédula o Email</label>
                <div className="inputSearchContainer">
                  <input
                    type="text"
                    id="inputNameCC"
                    placeholder="Escriba el nombre,cédula o email"
                    value={filter}
                    onChange={handleFilterChange}
                  />
                </div>

                {isAdmin && (
                  <>
                    <label htmlFor="selectEmpresa">Empresa</label>
                    <select
                      id="selectEmpresa"
                      value={selectedEmpresa}
                      onChange={handleEmpresaChange}
                      className="filter-select"
                    >
                      <option value="">Todas las empresas</option>
                      {empresas.map((empresa) => (
                        <option key={empresa.ID} value={empresa.ID}>
                          {empresa.nombre_empresa} - {empresa.NIT}
                        </option>
                      ))}
                    </select>

                    <label htmlFor="selectTipoDocumento">Tipo de Documento</label>
                    <select
                      id="selectTipoDocumento"
                      value={selectedTipoDocumento}
                      onChange={handleTipoDocumentoChange}
                      className="filter-select"
                    >
                      <option value="">Todos los tipos</option>
                      <option value="CedulaCiudadania">Cédula de Ciudadanía</option>
                      <option value="TarjetaIdentidad">Tarjeta de Identidad</option>
                      <option value="PPT">Pasaporte</option>
                      <option value="CedulaExtranjeria">Cédula de Extranjería</option>
                    </select>
                  </>
                )}

                <label>Estado</label>
                <div className="statusButtons">
                  <button
                    className={`inactive ${selectedState.inactivo ? "selected" : ""}`}
                    onClick={() => setSelectedState((prev) => ({ ...prev, inactivo: !prev.inactivo }))}
                  >
                    Inactivos
                  </button>
                  <button
                    className={`active ${selectedState.activo ? "selected" : ""}`}
                    onClick={() => setSelectedState((prev) => ({ ...prev, activo: !prev.activo }))}
                  >
                    Activos
                  </button>
                </div>
              </div>
              <button className="btn_createEmploye" onClick={showModalCreateEmploye}>
                Agregar Empleado
              </button>
            </div>

            <div className="containerGestionsEmployeResults">
              {loading ? (
                <div className="loading-container">
                  <p>Cargando empleados...</p>
                </div>
              ) : isAdmin ? (
                <div className="admin-employees-table">
                  <div className="table-header">
                    <h3>Empleados ({totalItems})</h3>
                    <div className="pagination-info">
                      Página {currentPage} de {totalPages}
                    </div>
                  </div>

                  {filteredEmployes.length === 0 ? (
                    <p className="no-results">No hay empleados que coincidan con los filtros</p>
                  ) : (
                    <>
                      <div className="employees-grid">
                        {filteredEmployes.map((employe) => {
                          console.log("Renderizando empleado:", employe); // Debug
                          return (
                            <div key={employe.ID} className="employee-card">
                              {/* Sección 1: Imagen */}
                              <div className="employee-image-section">
                                <img
                                  src={getImageSrcFromBase64(employe?.foto_perfil)}
                                  alt={`${employe.nombres || 'Sin nombre'} ${employe.apellidos || 'Sin apellido'}`}
                                  className="employee-image"
                                  onError={(e) => {
                                    console.log("Error cargando imagen:", employe?.foto_perfil);
                                    e.target.src = "/src/assets/Icons/userDefect.png";
                                  }}
                                />
                              </div>
                              
                              {/* Sección 2: Datos principales */}
                              <div className="employee-primary-info">
                                <h4>
                                  {employe.nombres || "Sin nombre"} {employe.apellidos || "Sin apellido"}
                                </h4>
                                <p>
                                  <strong>Documento:</strong> {employe.documento || "N/A"}
                                </p>
                              </div>
                              
                              {/* Sección 3: Datos secundarios */}
                              <div className="employee-secondary-info">
                                <p>
                                  <strong>Email:</strong> {employe.email || "N/A"}
                                </p>
                                <p>
                                  <strong>Empresa:</strong> {employe.Empresa?.nombre_empresa || "Sin empresa"}
                                </p>
                              </div>
                              
                              {/* Sección 4: Estado y botón */}
                              <div className="employee-status-section">
                                <div className="estado-wrapper">
                                  <strong>Estado:</strong>
                                  <span className={`status-badge ${employe.estado || "inactivo"}`}>
                                    {employe.estado || "Inactivo"}
                                  </span>
                                </div>
                                <button 
                                  className="profile-btn" 
                                  onClick={() => showModalSeeProfile(employe)}
                                >
                                  Ver / Editar
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {totalPages > 1 && (
                        <div className="pagination-controls">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="pagination-btn"
                          >
                            ❮ Anterior
                          </button>

                          <div className="pagination-numbers">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              const pageNum = Math.max(1, currentPage - 2) + i
                              if (pageNum > totalPages) return null

                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => handlePageChange(pageNum)}
                                  className={`pagination-number ${pageNum === currentPage ? "active" : ""}`}
                                >
                                  {pageNum}
                                </button>
                              )
                            })}
                          </div>

                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="pagination-btn"
                          >
                            Siguiente ❯
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <>
                  {filteredEmployes.length > 1 && (
                    <button className="arrow-results left" onClick={prev}>
                      ❮
                    </button>
                  )}

                  <div className="carousel-container_2-results">
                    <div className="carousel-track-results">
                      {filteredEmployes.length === 0 ? (
                        <p className="no-results">No hay resultados</p>
                      ) : filteredEmployes.length === 1 ? (
                        <div className="carousel-card-results card-center">
                          <img
                            src={getImageSrcFromBase64(filteredEmployes[0]?.foto_perfil)}
                            alt="Employe"
                            className="carousel-image-results"
                            onError={(e) => (e.target.src = "/src/assets/Icons/userDefect.png")}
                          />
                        </div>
                      ) : filteredEmployes.length === 2 ? (
                        [0].map((offset) => {
                          const index = (current + offset) % filteredEmployes.length
                          const employe = filteredEmployes[index]
                          return (
                            <div className="carousel-card-results card-center" key={index}>
                              <img
                                src={getImageSrcFromBase64(employe?.foto_perfil)}
                                alt="Employe"
                                className="carousel-image-results"
                                onError={(e) => (e.target.src = "/src/assets/Icons/userDefect.png")}
                              />
                            </div>
                          )
                        })
                      ) : (
                        [0, 1, 2].map((offset) => {
                          const index = (current + offset) % filteredEmployes.length
                          const employe = filteredEmployes[index]
                          const positionClass = offset === 1 ? "card-center" : "card-side"
                          return (
                            <div className={`carousel-card-results ${positionClass}`} key={index}>
                              <img
                                src={getImageSrcFromBase64(employe?.foto_perfil)}
                                alt="Employe"
                                className="carousel-image-results"
                                onError={(e) => (e.target.src = "/src/assets/Icons/userDefect.png")}
                              />
                            </div>
                          )
                        })
                      )}
                    </div>

                    {filteredEmployes.length > 0 && (
                      <div className="instructor-info">
                        <h3>
                          {filteredEmployes[(current + 1) % filteredEmployes.length]?.nombres}{" "}
                          {filteredEmployes[(current + 1) % filteredEmployes.length]?.apellidos}
                        </h3>
                        <p>{filteredEmployes[(current + 1) % filteredEmployes.length]?.titulo_profesional || "N/A"}</p>
                        <button
                          className="profile-btn"
                          onClick={() =>
                            showModalSeeProfile(filteredEmployes[(current + 1) % filteredEmployes.length])
                          }
                        >
                          Ver perfil
                        </button>
                      </div>
                    )}
                  </div>

                  {filteredEmployes.length > 1 && (
                    <button className="arrow-results right" onClick={next}>
                      ❯
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </Main>
      {selectedEmploye && <UpdateEmploye key={selectedEmploye.ID} empleado={selectedEmploye} />}
      <Footer />
    </>
  )
}