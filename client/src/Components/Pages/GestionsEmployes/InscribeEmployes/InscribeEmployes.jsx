import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "./InscribeEmployes.css"
import { Header } from "../../../../Components/Layouts/Header/Header"
import { Footer } from "../../../../Components/Layouts/Footer/Footer"
import { Main } from "../../../../Components/Layouts/Main/Main"
import { Modal_Inscripcion } from "../../../UI/Modal_Inscripcion/Modal_Inscripcion"
import axiosInstance from "../../../../config/axiosInstance"
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css'

export const InscribeEmployes = () => {
  const [selectedEmployees, setSelectedEmployees] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [employeesPerPage] = useState(5) 
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const navigate = useNavigate()
  const userSessionString = localStorage.getItem("userSession") || sessionStorage.getItem("userSession")
  
  const [employes, setEmployes] = useState([])

  const handleContinue = () => {
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
  };

  const handleCursosSeleccionados = (cursos) => {
    if (cursos && cursos.length > 0) {
      const curso = cursos[0];
      setSelectedCourse(curso);
      
      handleInscripcion(curso);
    }
  };

  // Función para manejar la inscripción al backend
  const handleInscripcion = async (curso) => {
    if (!curso || selectedEmployees.length === 0) {
      Swal.fire({
        icon:"info",
        title:"Debe seleccionar algo",
        text:"No hay curso seleccionado o empleados seleccionados",
        confirmButtonText:"Aceptar",
        theme:"bulma",
					confirmButtonColor: '#00843d',
					customClass:{
						confirmButton: 'centered-swal-button',
            actions: 'swal2-actions-centered'
					}

      })
      return;
    }

    try {
      const curso_ID = curso.ID || curso.id;

      const empleados = selectedEmployees.map(id => ({
        ID: id
      }));

      const response = await axiosInstance.post("/api/courses/inscripcionEmpleados", {
        empleados,
        curso_ID
      });

      // Verificar si hay empleados que no se pudieron inscribir
      if (response.data.noInscritos && response.data.noInscritos.length > 0) {
        const hayConflictos = response.data.noInscritos.some(emp => emp.verificar === true);
        
        if (hayConflictos) {
          // Mostrar mensaje específico para los empleados con conflictos
          const empleadosConConflictos = response.data.noInscritos
            .filter(emp => emp.verificar === true)
            .map(emp => `${emp.nombre || ''} ${emp.apellidos || ''}`.trim())
            .filter(nombre => nombre !== '');

          if (empleadosConConflictos.length > 0) {
            const mensaje = `Se inscribieron los empleados, sin embargo los siguientes empleados tienen cursos con los mismos horarios de formación y no se pudieron inscribir:\n\n${empleadosConConflictos.join('\n')}`;
            Swal.fire({
              icon:"info",
              title:"Confictos de horario",
              text: mensaje,
              confirmButtonText:"Aceptar",
              theme:"bulma",
              confirmButtonColor: '#00843d',
					customClass:{
						confirmButton: 'centered-swal-button',
            actions: 'swal2-actions-centered'
					}

            })
          } else {
            Swal.fire({
              icon:"info",
              title:"Confictos de horario",
              text:"Se inscribieron algunos empleados, pero hubo conflictos de horario con algunos empleados.",
              confirmButtonText:"Aceptar",
              theme:"bulma",
              confirmButtonColor: '#00843d',
					customClass:{
						confirmButton: 'centered-swal-button',
            actions: 'swal2-actions-centered'
					}
            })
          }
        } else {
          // Inscripción exitosa sin conflictos
              await Swal.fire({
                icon: 'success',
                title: 'Inscripción exitosa',
                text: `✅ Se inscribió correctamente a ${selectedEmployees.length} empleados en el curso "${curso.nombre_curso}"`,
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#006f33',
                theme: "bulma",
                customClass: {
                  actions: 'swal2-actions-centered',
                  popup: 'swal2-popup-centered'
                }
              });
            }
            } else {
              // Todos los empleados se inscribieron correctamente
              await Swal.fire({
                icon: 'success',
                title: 'Inscripción exitosa',
                text: `✅ Se inscribió correctamente a ${selectedEmployees.length} empleados en el curso "${curso.nombre_curso}"`,
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#006f33',
                theme: "bulma",
                customClass: {
                  actions: 'swal2-actions-centered',
                  popup: 'swal2-popup-centered'
                }
              });
      }

      // Limpiar selecciones después de la inscripción
      setSelectedEmployees([]);
      setSelectedCourse(null);

    } catch (error) {
      console.error("Error al realizar la inscripción:", error);
      
      let errorMessage = "Hubo un error al realizar la inscripción";
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      alert(errorMessage);
    }
  };

  const fetchEmpleados = async () => {
    try {
      const userSession = JSON.parse(userSessionString)
      const empresaId = userSession.empresa_ID
      
      const response = await axiosInstance.get(`/api/users/empresa/${empresaId}/empleados`)
      const data = response.data || {}
      const empleados = data.empleados || []
      setEmployes(empleados)
    } catch (error) {
      console.error(error)
      Swal.fire({
        icon:"error",
        title:"Error al cargar empleados",
        text:"No se logró cargar la lista de empleados del sistema",
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#006f33',
            theme: "bulma",
            customClass: {
                  actions: 'swal2-actions-centered',
                  popup: 'swal2-popup-centered'
                }
      })
    }
  }

  useEffect(() => {
    fetchEmpleados()
  }, [])

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

          {/* Mostrar información del curso seleccionado */}
          {selectedCourse && (
            <div className="selected-course-info">
              <h3>Curso seleccionado: {selectedCourse.nombre_curso}</h3>
              {selectedCourse.cupos_disponibles && (
                <p>Cupos disponibles: {selectedCourse.cupos_disponibles}</p>
              )}
            </div>
          )}

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
                onClick={handleContinue}
                disabled={selectedEmployees.length === 0}
              >
                {selectedCourse ? "Cambiar Curso" : "Seleccionar Curso"}
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
        <Modal_Inscripcion 
          onClose={handleCloseModal} 
          onCursosSeleccionados={handleCursosSeleccionados}
        />
      )}
    </>
  )
}