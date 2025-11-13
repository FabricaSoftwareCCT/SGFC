import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./UpdateInstructor.css";
import axiosInstance from "../../../../config/axiosInstance";
import { createMensajeError, validateNumber, validateText, validateEmail } from "../../../../utils/Validators/formValidator";
import { ModalManageCourses } from "../../../UI/Modal_ManageCourses/ModalManageCourses";
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faList, faArrowLeft, faEye, faUser, faIdCard, faPhone, faEnvelope, faGraduationCap, faCamera } from '@fortawesome/free-solid-svg-icons';

export const UpdateInstructor = ({ instructor, onClose }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...instructor });
  const [cantidadCursos, setCantidadCursos] = useState(0);
  const [cursosAsignados, setCursosAsignados] = useState([]);
  const [showManageCourses, setShowManageCourses] = useState(false);

  useEffect(() => {
    setCantidadCursos(0);
    setCursosAsignados([]);
    setFormData({ ...instructor });
    setIsEditing(false);
  }, [instructor?.ID]);

  useEffect(() => {
    const obtenerCursosAsignados = async () => {
      if (!instructor?.ID) return;

      try {
        const response = await axiosInstance.get(
          `/api/courses/cursos-asignados/${instructor.ID}`
        );
        if (Array.isArray(response.data)) {
          setCantidadCursos(response.data.length);
          setCursosAsignados(response.data);
        } else {
          setCantidadCursos(0);
          setCursosAsignados([]);
        }
      } catch (error) {
        setCantidadCursos(0);
        setCursosAsignados([]);
      }
    };

    obtenerCursosAsignados();
  }, [instructor?.ID]);

  const refetchCursosAsignados = async () => {
    if (!instructor?.ID) return;
    try {
      const response = await axiosInstance.get(`/api/courses/cursos-asignados/${instructor.ID}`);
      if (Array.isArray(response.data)) {
        setCantidadCursos(response.data.length);
        setCursosAsignados(response.data);
      }
    } catch {}
  };

  const closeModalUpdateInstructor = () => {
    if (onClose) onClose();
    const overlay = document.getElementById("modal-overlayUpdateInstructor");
    if (overlay) overlay.style.display = "none";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        foto_perfil: file,
      }));
    }
  };

  const handleEstadoChange = (estado) => {
    setFormData((prev) => ({ ...prev, estado }));
  };

  const handleButtonClick = async (e) => {
    e.preventDefault();

    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    try {
      const validationGeneral = {
        nombres: validateText(formData.nombres),
        apellidos: validateText(formData.apellidos),
        documento: validateNumber(formData.documento),
        titulo_profesional: validateText(formData.titulo_profesional),
        celular: validateNumber(formData.celular),
        email: validateEmail(formData.email)
      }

      const errores = await createMensajeError(validationGeneral);
      if(errores !== null){
        await Swal.fire({
          icon: "warning",
          title: "Errores de validación",
          html: `
            <div style="text-align: left;">
              <p>Por favor corrija los siguientes errores:</p>
              <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-top: 10px;">
                ${errores.split('\n').map(error => `<div style="margin-bottom: 5px;">• ${error}</div>`).join('')}
              </div>
            </div>
          `,
          confirmButtonText: "Entendido",
          confirmButtonColor: "#3085d6",
          theme: "bulma",
          customClass: { confirmButton: 'centered-swal-button' }
        });
        return;
      }

      const formDataToSend = new FormData();
      for (const key in formData) {
        if (formData.hasOwnProperty(key)) {
          if (key === "foto_perfil") {
            if (formData[key] instanceof File) {
              formDataToSend.append(key, formData[key]);
            }
          } else {
            formDataToSend.append(key, formData[key]);
          }
        }
      }

      const response = await axiosInstance.put(
        `/api/users/perfil/actualizar/${formData.ID}`,
        formDataToSend,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      await Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text: response.data.message || "Perfil actualizado correctamente",
        confirmButtonColor: "#3085d6",
        timer: 3000,
        timerProgressBar: true,
        theme: "bulma",
        customClass: { confirmButton: 'centered-swal-button' }
      });
      setIsEditing(false);
      window.location.reload();
      document.getElementById("modal-overlayUpdateInstructor").style.display = "none";
    } catch (error) {
      console.error("Error al actualizar el perfil:", error.response?.data || error.message);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Hubo un error al actualizar el perfil. Por favor, inténtelo de nuevo.",
        confirmButtonColor: "#d33",
        theme: "bulma",
        customClass: { confirmButton: 'centered-swal-button' }
      });
    }
  };

  const getImageSrc = (data) => {
    if (!data) return '/default-profile.png';
    if (data.startsWith('iVBOR')) {
      return `data:image/png;base64,${data}`;
    } else if (data.startsWith('/9j/')) {
      return `data:image/jpeg;base64,${data}`;
    } else {
      return `data:image/jpeg;base64,${data}`;
    }
  };

  return (
    <div id="modal-overlayUpdateInstructor" className="modal-overlay-update">
      <div className="modal-container-update">
        <div className="modal-header-update">
          <div className="header-content-update">
            <h2>
              <FontAwesomeIcon icon={faUser} className="header-icon" />
              Perfil del Instructor
            </h2>
            <button 
              type="button" 
              onClick={closeModalUpdateInstructor}
              className="close-btn-update"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>Volver</span>
            </button>
          </div>
        </div>

        <form className="modal-body-update" onSubmit={handleButtonClick}>
          <div className="modal-content-update">
            {/* Columna izquierda - Información */}
            <div className="info-column-update">
              <div className="form-section-update">
                <h3 className="section-title-update">Información Personal</h3>
                <div className="form-grid-update">
                  <div className="input-group-update">
                    <label className="input-label-update">
                      <FontAwesomeIcon icon={faUser} />
                      Nombres
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="nombres"
                        value={formData.nombres || ""}
                        onChange={handleChange}
                        className="input-field-update"
                        placeholder="Ingrese los nombres"
                      />
                    ) : (
                      <div className="display-field-update">
                        {formData.nombres || "No especificado"}
                      </div>
                    )}
                  </div>

                  <div className="input-group-update">
                    <label className="input-label-update">
                      <FontAwesomeIcon icon={faUser} />
                      Apellidos
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="apellidos"
                        value={formData.apellidos || ""}
                        onChange={handleChange}
                        className="input-field-update"
                        placeholder="Ingrese los apellidos"
                      />
                    ) : (
                      <div className="display-field-update">
                        {formData.apellidos || "No especificado"}
                      </div>
                    )}
                  </div>

                  <div className="input-group-update">
                    <label className="input-label-update">
                      <FontAwesomeIcon icon={faIdCard} />
                      Cédula
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="documento"
                        value={formData.documento || ""}
                        onChange={handleChange}
                        className="input-field-update"
                        placeholder="Ingrese la cédula"
                      />
                    ) : (
                      <div className="display-field-update">
                        {formData.documento || "No especificado"}
                      </div>
                    )}
                  </div>

                  <div className="input-group-update">
                    <label className="input-label-update">
                      <FontAwesomeIcon icon={faGraduationCap} />
                      Título Profesional
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="titulo_profesional"
                        value={formData.titulo_profesional || ""}
                        onChange={handleChange}
                        className="input-field-update"
                        placeholder="Ingrese el título profesional"
                      />
                    ) : (
                      <div className="display-field-update">
                        {formData.titulo_profesional || "No especificado"}
                      </div>
                    )}
                  </div>

                  <div className="input-group-update">
                    <label className="input-label-update">
                      <FontAwesomeIcon icon={faPhone} />
                      Celular
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="celular"
                        value={formData.celular || ""}
                        onChange={handleChange}
                        className="input-field-update"
                        placeholder="Ingrese el celular"
                      />
                    ) : (
                      <div className="display-field-update">
                        {formData.celular || "No especificado"}
                      </div>
                    )}
                  </div>

                  <div className="input-group-update">
                    <label className="input-label-update">
                      <FontAwesomeIcon icon={faEnvelope} />
                      Email
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email || ""}
                        onChange={handleChange}
                        className="input-field-update"
                        placeholder="Ingrese el email"
                      />
                    ) : (
                      <div className="display-field-update">
                        {formData.email || "No especificado"}
                      </div>
                    )}
                  </div>

                  <div className="input-group-update">
                    <label className="input-label-update">Estado</label>
                    {isEditing ? (
                      <div className="status-buttons-update">
                        {["Activo", "Inactivo"].map((estado) => {
                          const isSelected = (formData.estado || "").toLowerCase() === estado.toLowerCase();
                          return (
                            <button
                              key={estado}
                              type="button"
                              className={`status-btn-update ${isSelected ? "active" : ""}`}
                              onClick={() => handleEstadoChange(estado)}
                            >
                              <span className="status-dot"></span>
                              {estado}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className={`status-display-update ${formData.estado?.toLowerCase()}`}>
                        <span className="status-dot"></span>
                        {formData.estado || "No especificado"}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sección de Cursos */}
              <div className="courses-section-update">
                <div className="courses-header-update">
                  <div className="courses-title-update">
                    <FontAwesomeIcon icon={faBook} />
                    <h3>Cursos Asignados</h3>
                  </div>
                  <div className="courses-count-update">
                    {cantidadCursos} curso{cantidadCursos !== 1 ? 's' : ''}
                  </div>
                </div>

                {cursosAsignados && cursosAsignados.length > 0 ? (
                  <div className="courses-list-update">
                    {cursosAsignados.map((curso, index) => {
                      const courseName = (curso && curso.Curso && curso.Curso.nombre_curso)
                        || curso.nombre_curso
                        || `Curso ${curso.curso_ID || curso.ID || ''}`;
                      const courseId = (curso && curso.Curso && curso.Curso.ID)
                        || curso.curso_ID
                        || curso.ID;
                      return (
                        <div key={`${courseId}-${courseName}`} className="course-item-update">
                          <div className="course-info-update">
                            <span className="course-name-update" title={courseName}>
                              {courseName}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="course-view-btn-update"
                            onClick={() => navigate(`/Cursos/${courseId}`)}
                            title="Ver detalles del curso"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="no-courses-update">
                    <FontAwesomeIcon icon={faBook} className="no-courses-icon" />
                    <p>No hay cursos asignados</p>
                  </div>
                )}

                <div className="courses-actions-update">
                  <button
                    type="button"
                    className="manage-courses-btn-update"
                    onClick={() => setShowManageCourses(true)}
                  >
                    <FontAwesomeIcon icon={faList} />
                    <span>Gestionar Cursos</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Columna derecha - Imagen CORREGIDA */}
            <div className="image-column-update">
              <div className="image-section-update">
                <div className="image-container-update">
                  {isEditing ? (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        id="imageUploadUpdate"
                        className="file-input-update"
                      />
                      <label
                        className="image-upload-update editable"
                        htmlFor="imageUploadUpdate"
                      >
                        {formData.foto_perfil instanceof File ? (
                          <img
                            src={URL.createObjectURL(formData.foto_perfil)}
                            alt="Vista previa"
                            className="profile-image-update"
                            onError={(e) => {
                              e.target.src = '/default-profile.png';
                            }}
                          />
                        ) : formData.foto_perfil ? (
                          <img
                            src={getImageSrc(formData.foto_perfil)}
                            alt="Foto de perfil"
                            className="profile-image-update"
                            onError={(e) => {
                              e.target.src = '/default-profile.png';
                            }}
                          />
                        ) : (
                          <div className="image-placeholder-update">
                            <FontAwesomeIcon icon={faCamera} className="placeholder-icon" />
                            <span>Haz clic para subir imagen</span>
                          </div>
                        )}
                        <div className="upload-overlay-update">
                          <FontAwesomeIcon icon={faCamera} />
                          <span>Cambiar imagen</span>
                        </div>
                      </label>
                    </>
                  ) : (
                    <div className="image-display-update">
                      {formData.foto_perfil ? (
                        <img
                          src={getImageSrc(formData.foto_perfil)}
                          alt="Foto de perfil"
                          className="profile-image-update"
                          onError={(e) => {
                            e.target.src = '/default-profile.png';
                          }}
                        />
                      ) : (
                        <div className="image-placeholder-update">
                          <FontAwesomeIcon icon={faUser} className="placeholder-icon" />
                          <span>Sin imagen</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {!isEditing && (
                  <div className="image-info-update">
                    <p>Activa el modo edición para cambiar la imagen</p>
                  </div>
                )}
              </div>

              <button type="submit" className="submit-btn-update">
                {isEditing ? (
                  <>
                    <FontAwesomeIcon icon={faGraduationCap} />
                    <span>Guardar Cambios</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faUser} />
                    <span>Editar Perfil</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {showManageCourses && (
        <ModalManageCourses
          instructorId={instructor?.ID}
          instructorEstado={formData?.estado}
          cursosAsignadosIniciales={cursosAsignados}
          onClose={() => setShowManageCourses(false)}
          onChanged={({ removedId } = {}) => {
            if (removedId != null) {
              setCursosAsignados(prev => prev.filter(c => Number(c.Curso?.ID ?? c.curso_ID ?? c.ID) !== Number(removedId)));
              setCantidadCursos(prev => Math.max(0, prev - 1));
            }
            refetchCursosAsignados();
          }}
        />
      )}
    </div>
  );
};