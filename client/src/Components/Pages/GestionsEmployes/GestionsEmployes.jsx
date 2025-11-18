"use client"
import { useNavigate } from "react-router-dom" // ✅ Agregar esta importación
import { useState, useEffect } from "react"
import "./GestionsEmployes.css"
import { Header } from "../../Layouts/Header/Header"
import { Footer } from "../../../Components/Layouts/Footer/Footer"
import { Main } from "../../../Components/Layouts/Main/Main"
import { UpdateEmploye } from "./UpdateEmploye/UpdateEmploye"
import axiosInstance from "../../../config/axiosInstance"
import { useModal } from "../../../Context/ModalContext"
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css'

export const GestionsEmployes = () => {
  const [employes, setEmployes] = useState([])
  const [filteredEmployes, setFilteredEmployes] = useState([])
  const [filter, setFilter] = useState("")
  const [current, setCurrent] = useState(0)
  const [selectedState, setSelectedState] = useState("todos")
  const [selectedEmploye, setSelectedEmploye] = useState(null)

  const [empresas, setEmpresas] = useState([])
  const [selectedEmpresa, setSelectedEmpresa] = useState("")
  const [selectedTipoDocumento, setSelectedTipoDocumento] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(false)

  const { setShowModalCreateEmployee } = useModal()
  const navigate = useNavigate()
  const userSession =
    JSON.parse(localStorage.getItem("userSession")) || JSON.parse(sessionStorage.getItem("userSession"))

  const accountType = userSession?.accountType || null
  const isAdmin = accountType === "Administrador" || accountType === "Gestor"

  const fetchEmployes = async (page = 1) => {
    setLoading(true)
    try {
      if (isAdmin) {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "10",
          search: filter,
          empresaId: selectedEmpresa,
          estado: selectedState === "todos" ? "" : selectedState,
          tipoDocumento: selectedTipoDocumento,
        })

        const response = await axiosInstance.get(`/api/users/admin/empleados?${params}`)
        const data = response.data || {}
        const empleados = data.empleados || []
        setEmployes(empleados)
        setFilteredEmployes(empleados)
        setCurrentPage(data.pagination?.currentPage || 1)
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalItems(data.pagination?.totalItems || 0)
      } else {
        const userSessionString = localStorage.getItem("userSession") || sessionStorage.getItem("userSession")
      if (!userSessionString) {
        Swal.fire({
          icon:"info",
          title:"Error en el sistema",
          text:"No se encontró la sesión de usuario.",
          confirmButtonText:"Okay",
                        theme:"bulma",
      customClass: { confirmButton: 'centered-swal-button' }
        })
          return
        }
        const userSession = JSON.parse(userSessionString)
        const empresaId = userSession.empresa_ID

        const response = await axiosInstance.get(`/api/users/empresa/${empresaId}/empleados`)
        const data = response.data || {}
        const empleados = data.empleados || []
        setEmployes(empleados)
        setFilteredEmployes(empleados)
      }
    } catch (error) {
      console.error("Error al obtener los empleados:", error)
      Swal.fire({
        icon:"error",
        title:"Error en el sistema",
        text:"Hubo un problema al cargar los empleados. Por favor, inténtalo más tarde.",
        confirmButtonText:"Okay",
                      theme:"bulma",
      customClass: { confirmButton: 'centered-swal-button' }
      })
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
    
    // Exponer función para refrescar desde otros componentes
    window.refreshEmployesList = () => {
      if (isAdmin) {
        fetchEmployes(currentPage)
      } else {
        fetchEmployes()
      }
    }
    
    // Exponer función para actualizar empleado específico
    window.updateSelectedEmploye = (updatedEmploye) => {
      setSelectedEmploye(updatedEmploye)
    }
    
    // Cleanup
    return () => {
      delete window.refreshEmployesList
      delete window.updateSelectedEmploye
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
        (employe.documento || "").toLowerCase().includes(filter.toLowerCase()) ||
        (employe.email || "").toLowerCase().includes(filter.toLowerCase()),
    )

    const filteredByState = filtered.filter((employe) => {
      const estado = (employe.estado || "").toLowerCase()
      if (selectedState === "todos") return true
      return estado === selectedState
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
    setTimeout(() => {
      const modalCreateEmploye = document.getElementById("modal-overlayCreateEmploye")
      if (modalCreateEmploye) {
        modalCreateEmploye.style.display = "flex"
      }
    }, 100)
  }

  const showModalSeeProfile = (employe) => {
    setSelectedEmploye(employe)
    setTimeout(() => {
      const modalSeeProfile = document.getElementById("modal-overlayUpdateEmploye")
    if (modalSeeProfile) {
        modalSeeProfile.style.display = "flex"
      }
    }, 100)
  }

  const handleInscribeEmployes = () => {
    navigate("/Empleados/InscribirEmpleados")
  }

  const getImageSrcFromBase64 = (imageData) => {
    
    // Si no hay datos de imagen, usar imagen por defecto
    if (!imageData) {
      return "/src/assets/Icons/userDefect.png"
    }
    
    // Si es base64
    if (typeof imageData === 'string') {
      // Verificar si ya es una URL de datos completa
      if (imageData.startsWith("data:")) {
        return imageData // Ya es una URL de datos
      }
      
      // Verificar si es PNG base64
      if (imageData.startsWith("iVBORw0KGgo") || imageData.startsWith("iVBOR")) {
        return `data:image/png;base64,${imageData}`
      }
      
      // Verificar si es JPEG base64
      if (imageData.startsWith("/9j/")) {
        return `data:image/jpeg;base64,${imageData}`
      }
      
      // Verificar si es una cadena muy larga (probablemente base64)
      if (imageData.length > 1000) {
        return `data:image/jpeg;base64,${imageData}`
      }
      
      // Verificar si contiene caracteres base64 válidos
      const base64Regex = /^[A-Za-z0-9+/=]+$/
      if (imageData.length > 50 && base64Regex.test(imageData)) {
        return `data:image/jpeg;base64,${imageData}`
      }
      
      // Si es una ruta de archivo (empieza con ../ o /) - solo después de verificar base64
      if (imageData.startsWith('../') || imageData.startsWith('/')) {
        // Convertir ruta relativa a ruta absoluta
        if (imageData.startsWith('../Img/')) {
          const newPath = imageData.replace('../Img/', '/src/assets/Icons/')
          return newPath
        }
        return imageData
      }
      
      return "/src/assets/Icons/userDefect.png"
    }
    
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
                <label htmlFor="inputNameCC">Nombre, Documento o Email</label>
                <div className="inputSearchContainer">
                  <input
                    type="text"
                    id="inputNameCC"
                    placeholder="Escriba nombre, documento o email"
                    value={filter}
                    onChange={handleFilterChange}
                  />
                </div>
                
                {isAdmin && (
                  <>
                    <label htmlFor="selectEmpresa">Empresa</label>
                    <input type="text" className="inputSearchContainer" value={selectedEmpresa} placeholder="Ingresar nombre empresa" onChange={handleEmpresaChange} />

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
                <section className="sectionStatusFilter">
                  {["Todos", "Activo", "Inactivo"].map((op) => (
                    <p
                      key={op}
                      className={`statusOption ${selectedState === op.toLowerCase() ? "selected" : ""}`}
                      onClick={() => setSelectedState(op.toLowerCase())}
                    >
                      {op}
                    </p>
                  ))}
                </section>
              </div>
              <button className="btn_createEmploye" onClick={showModalCreateEmploye}>
                Agregar Empleado
              </button>
              <button 
                  className="btn_inscribirEmpleados" 
                  onClick={handleInscribeEmployes}
                >
                  Inscribir empleados a cursos
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
                  </div>

                  {filteredEmployes.length === 0 ? (
                    <p className="no-results">No hay empleados que coincidan con los filtros</p>
                  ) : (
                    <>
                      <div className="employees-grid">
                        {filteredEmployes.map((employe) => {
                          return (
                            <div key={employe.ID} className="employee-card">
                              {/* Sección 1: Imagen */}
                              <div className="employee-image-section1">
                                <img
                                  src={getImageSrcFromBase64(employe?.foto_perfil)}
                                  alt={`${employe.nombres || 'Sin nombre'} ${employe.apellidos || 'Sin apellido'}`}
                                  className="employee-image"
                                  onError={(e) => {   
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
                        <div className="pagination-container">
                          <button 
                            className="btn-inline" 
                            disabled={currentPage === 1} 
                            onClick={() => handlePageChange(currentPage - 1)}
                          >
                            Anterior
                          </button>
                          <span className="pagination-info">{currentPage} / {totalPages}</span>
                          <button 
                            className="btn-inline" 
                            disabled={currentPage === totalPages} 
                            onClick={() => handlePageChange(currentPage + 1)}
                          >
                            Siguiente
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
                          {` (${filteredEmployes.length})`}
                    </h3>
                        {/*<p>{filteredEmployes[(current + 1) % filteredEmployes.length]?.titulo_profesional === null || filteredEmployes[(current + 1) % filteredEmployes.length]?.titulo_profesional === undefined || filteredEmployes[(current + 1) % filteredEmployes.length]?.titulo_profesional === "" ? "N/A" : filteredEmployes[(current + 1) % filteredEmployes.length]?.titulo_profesional}</p>*/} {/*Se quito el titulo profesional por ahora*/}
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