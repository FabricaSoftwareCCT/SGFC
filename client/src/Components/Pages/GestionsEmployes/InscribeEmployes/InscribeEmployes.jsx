import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./InscribeEmployes.css"
import { Header } from "../../../../Components/Layouts/Header/Header"
import { Footer } from "../../../../Components/Layouts/Footer/Footer"
import { Main } from "../../../../Components/Layouts/Main/Main"
import { Modal_Inscripcion } from "../../../UI/Modal_Inscripcion/Modal_Inscripcion"


export const InscribeEmployes = () => {
  const [selectedEmployees, setSelectedEmployees] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [employeesPerPage] = useState(5) 
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate()
  
  // Datos de ejemplo 
  const [employes] = useState([
    {
      ID: 1,
      nombres: "Juan",
      apellidos: "Pérez",
      documento: "12345678",
      email: "juan@empresa.com",
      estado: "activo",
      Empresa: { nombre_empresa: "Empresa A" },
      foto_perfil: null
    },
    {
      ID: 2,
      nombres: "María",
      apellidos: "González",
      documento: "87654321",
      email: "maria@empresa.com",
      estado: "activo",
      Empresa: { nombre_empresa: "Empresa A" },
      foto_perfil: null
    },
    {
      ID: 3,
      nombres: "Carlos",
      apellidos: "López",
      documento: "11223344",
      email: "carlos@empresa.com",
      estado: "inactivo",
      Empresa: { nombre_empresa: "Empresa B" },
      foto_perfil: null
    },
    {
      ID: 4,
      nombres: "Ana",
      apellidos: "Martínez",
      documento: "55667788",
      email: "ana@empresa.com",
      estado: "activo",
      Empresa: { nombre_empresa: "Empresa A" },
      foto_perfil: null
    },
    {
      ID: 5,
      nombres: "Pedro",
      apellidos: "Rodríguez",
      documento: "99887766",
      email: "pedro@empresa.com",
      estado: "activo",
      Empresa: { nombre_empresa: "Empresa C" },
      foto_perfil: null
    },
    {
      ID: 6,
      nombres: "Laura",
      apellidos: "García",
      documento: "33445566",
      email: "laura@empresa.com",
      estado: "inactivo",
      Empresa: { nombre_empresa: "Empresa B" },
      foto_perfil: null
    },
    {
      ID: 7,
      nombres: "Diego",
      apellidos: "Hernández",
      documento: "77889900",
      email: "diego@empresa.com",
      estado: "activo",
      Empresa: { nombre_empresa: "Empresa A" },
      foto_perfil: null
    }
  ])

  const handleContinue = () => {
		setShowCreateModal(true);
	};
  const handleCloseModal = () => {
		setShowCreateModal(false);
	};

  // Calcular empleados para la página actual
  const indexOfLastEmployee = currentPage * employeesPerPage
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage
  const currentEmployees = employes.slice(indexOfFirstEmployee, indexOfLastEmployee)
  const totalPages = Math.ceil(employes.length / employeesPerPage)

  // Función para cambiar de página
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  // Función para ir a la página siguiente
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Función para ir a la página anterior
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  // Función para manejar la selección/deselección de empleados
  const handleEmployeeSelection = (employeeId) => {
    setSelectedEmployees(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId)
      } else {
        return [...prev, employeeId]
      }
    })
  }

  const handleSelectAllCurrentPage = () => {
    const currentPageEmployeeIds = currentEmployees.map(emp => emp.ID)
    const allCurrentSelected = currentPageEmployeeIds.every(id => 
      selectedEmployees.includes(id)
    )

    if (allCurrentSelected) {
      setSelectedEmployees(prev => 
        prev.filter(id => !currentPageEmployeeIds.includes(id))
      )
    } else {
      setSelectedEmployees(prev => {
        const newSelection = [...prev]
        currentPageEmployeeIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id)
          }
        })
        return newSelection
      })
    }
  }

  // Función para seleccionar/deseleccionar todos los empleados
  const handleSelectAll = () => {
    if (selectedEmployees.length === employes.length) {
      setSelectedEmployees([])
    } else {
      setSelectedEmployees(employes.map(emp => emp.ID))
    }
  }

  const getImageSrcFromBase64 = (imageData) => {
    if (!imageData) {
      return "/src/assets/Icons/userDefect.png"
    }
    return imageData
  }

  return (
    <>
      <Header />
      <Main>
        <div className="container_GestionsEmploye">
          <h2>
            Inscribir <span className="complementary">Empleados a Cursos</span>
          </h2>

          <div className="containerGestionsEmployeOptions">
            <div className="containerConsultEmploye">
              <p>Seleccione uno o varios empleados para inscribirlos en cursos:</p>
              
              {/* Botones para seleccionar/deseleccionar */}
              <div className="select-all-container">
                <button 
                  className="btn_selectAll"
                  onClick={handleSelectAll}
                >
                  {selectedEmployees.length === employes.length ? "Deseleccionar todos" : "Seleccionar todos"}
                </button>
                <button 
                  className="btn_selectCurrentPage"
                  onClick={handleSelectAllCurrentPage}
                >
                  {currentEmployees.every(emp => selectedEmployees.includes(emp.ID)) 
                    ? "Deseleccionar página" 
                    : "Seleccionar página"
                  }
                </button>
                <span className="selection-info">
                  {selectedEmployees.length} de {employes.length} empleados seleccionados
                </span>
              </div>
              <button 
                className="btn-continue"
                onClick={handleAddCompany}
              >
                Continuar
              </button>
              <button className="btn-continue"
                      onClick={handleContinue}
                      disabled={selectedEmployees.length === 0}>
                Continuar
              </button>   
            </div>
             
            <div className="containerGestionsEmployeResults">
              <div className="employees-list-container">
                <div className="employees-list-header">
                  <h3>Lista de Empleados</h3>
                  <span className="page-info">
                    Página {currentPage} de {totalPages} 
                    ({employes.length} empleados totales)
                  </span>
                </div>

                {employes.length === 0 ? (
                  <p className="no-results">No hay empleados registrados</p>
                ) : (
                  <>
                    <div className="employees-checkbox-list">
                      {currentEmployees.map((employe) => {
                        const isSelected = selectedEmployees.includes(employe.ID)
                        
                        return (
                          <div 
                            key={employe.ID} 
                            className={`employee-checkbox-item ${isSelected ? 'selected' : ''}`}
                          >
                            <div className="checkbox-container">
                              <input
                                type="checkbox"
                                id={`employee-${employe.ID}`}
                                checked={isSelected}
                                onChange={() => handleEmployeeSelection(employe.ID)}
                                className="employee-checkbox"
                              />
                              <label 
                                htmlFor={`employee-${employe.ID}`}
                                className="checkbox-label"
                              >
                                Seleccionar
                              </label>
                            </div>
                            
                            <div className="employee-info">
                              {/* Imagen del empleado */}
                              <div className="employee-image-section">
                                <img
                                  src={getImageSrcFromBase64(employe?.foto_perfil)}
                                  alt={`${employe.nombres || 'Sin nombre'} ${employe.apellidos || 'Sin apellido'}`}
                                  className="employee-image"
                                  onError={(e) => {   
                                    e.target.src = "/src/assets/Icons/userDefect.png";
                                  }}
                                />
                              </div>
                              
                              {/* Información del empleado */}
                              <div className="employee-details">
                                <div className="employee-primary-info">
                                  <h4>
                                    {employe.nombres || "Sin nombre"} {employe.apellidos || "Sin apellido"}
                                  </h4>
                                  <p>
                                    <strong>Documento:</strong> {employe.documento || "N/A"}
                                  </p>
                                  <p>
                                    <strong>Email:</strong> {employe.email || "N/A"}
                                  </p>
                                </div>
                                
                                <div className="employee-secondary-info">
                                  <p>
                                    <strong>Empresa:</strong> {employe.Empresa?.nombre_empresa || "Sin empresa"}
                                  </p>
                                  <div className="estado-wrapper">
                                    <strong>Estado:</strong>
                                    <span className={`status-badge ${employe.estado || "inactivo"}`}>
                                      {employe.estado || "Inactivo"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Paginación */}
                    {totalPages > 1 && (
                      <div className="pagination-container">
                        <button 
                          className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                          onClick={prevPage}
                          disabled={currentPage === 1}
                        >
                          Anterior
                        </button>
                        
                        <div className="pagination-numbers">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                              key={page}
                              className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </button>
                          ))}
                        </div>
                        
                        <button 
                          className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                          onClick={nextPage}
                          disabled={currentPage === totalPages}
                        >
                          Siguiente
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Main>
      <Footer />
      {showCreateModal && (
              <CreateEmpresa onClose={handleCloseModal} onCompanyCreated={() => {
                fetchEmpresas()
              }} />
            )}
    </>

  )
}