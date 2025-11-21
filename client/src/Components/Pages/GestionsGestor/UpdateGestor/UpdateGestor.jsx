import React, { useState, useEffect } from "react";
import "./UpdateGestor.css";
import axiosInstance from "../../../../config/axiosInstance";
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faUser, faIdCard, faPhone, faEnvelope, faCamera } from '@fortawesome/free-solid-svg-icons';

export const UpdateGestor = ({ gestor, onClose }) => {
  const userSessionString = sessionStorage.getItem("userSession");
  const userSession = userSessionString ? JSON.parse(userSessionString) : null;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...gestor });

  useEffect(() => {
    if (gestor) {
      setFormData({ ...gestor });
      setIsEditing(false);
    }
  }, [gestor]);

  const closeModalUpdateGestor = () => {
    if (onClose) {
      onClose();
    }
  };

  const getImageSrc = (data) => {
    if (!data) return '/default-profile.png';
    if (data.startsWith('/9j/')) {
      return `data:image/jpeg;base64,${data}`;
    } else if (data.startsWith('iVBORw0KGgo')) {
      return `data:image/png;base64,${data}`;
    } else {
      return `data:image/jpeg;base64,${data}`;
    }
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


  const handleEstadoChange = (estado) => {
    setFormData((prev) => ({ ...prev, estado }));
  };

  const validateFields = () => {
    const errors = [];
    
    if (!formData.nombres || formData.nombres.trim() === '') {
      errors.push('Los nombres son requeridos');
    } else if (formData.nombres.trim().length < 2) {
      errors.push('Los nombres deben tener al menos 2 caracteres');
    }
    
    if (!formData.apellidos || formData.apellidos.trim() === '') {
      errors.push('Los apellidos son requeridos');
    } else if (formData.apellidos.trim().length < 2) {
      errors.push('Los apellidos deben tener al menos 2 caracteres');
    }
    
    if (!formData.documento || formData.documento.trim() === '') {
      errors.push('El número de documento es requerido');
    } else if (!/^\d+$/.test(formData.documento.trim())) {
      errors.push('El número de documento debe contener solo números');
    } else if (formData.documento.trim().length < 6) {
      errors.push('El número de documento debe tener al menos 6 dígitos');
    }
    
    if (!formData.celular || formData.celular.trim() === '') {
      errors.push('El número de celular es requerido');
    } else if (!/^\d+$/.test(formData.celular.trim())) {
      errors.push('El número de celular debe contener solo números');
    } else if (formData.celular.trim().length < 10) {
      errors.push('El número de celular debe tener al menos 10 dígitos');
    }
    
    if (!formData.email || formData.email.trim() === '') {
      errors.push('El email es requerido');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.push('Debe ingresar un email válido');
    }
    
    return errors;
  };

  const handleButtonClick = async (e) => {
    e.preventDefault();

    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    const errors = validateFields();
    if (errors.length > 0) {
      await Swal.fire({
        icon: "warning",
        title: "Campos requeridos",
        html: `
          <div style="text-align: left;">
            <p>Por favor corrija los siguientes errores:</p>
            <ul style="margin-top: 10px; padding-left: 20px;">
              ${errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
          </div>
        `,
        confirmButtonText: "Entendido",
        confirmButtonColor: "#3085d6",
        theme: "bulma",
        customClass: { confirmButton: 'centered-swal-button' }
      });
      return;
    }

    try {
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
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
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
      closeModalUpdateGestor();
    } catch (error) {
      console.error("Error al actualizar el perfil:", error.response?.data || error.message);
      
      if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.message;
        if (errorMsg === "El correo electrónico ya está registrado.") {
          await Swal.fire({
            icon: "error",
            title: "Error de correo",
            text: "El correo electrónico ya está registrado en el sistema. Por favor, use un correo diferente.",
            confirmButtonColor: "#d33",
            theme: "bulma",
            customClass: { confirmButton: 'centered-swal-button' }
          });
        } else if (errorMsg === "El documento ya está registrado.") {
          await Swal.fire({
            icon: "error",
            title: "Error de documento",
            text: "El número de documento ya está registrado en el sistema. Por favor, verifique el documento.",
            confirmButtonColor: "#d33",
            theme: "bulma",
            customClass: { confirmButton: 'centered-swal-button' }
          });
        } else if (errorMsg === "El número de celular ya está registrado.") {
          await Swal.fire({
            icon: "error",
            title: "Error de celular",
            text: "El número de celular ya está registrado en el sistema. Por favor, use un número diferente.",
            confirmButtonColor: "#d33",
            theme: "bulma",
            customClass: { confirmButton: 'centered-swal-button' }
          });
        } else {
          await Swal.fire({
            icon: "error",
            title: "Error",
            text: errorMsg || "Ha ocurrido un error inesperado",
            confirmButtonColor: "#d33",
            theme: "bulma",
            customClass: { confirmButton: 'centered-swal-button' }
          });
        }
      } else {
        await Swal.fire({
          icon: "error",
          title: "Error del sistema",
          text: "Hubo un error al actualizar el perfil. Por favor, inténtelo de nuevo.",
          confirmButtonColor: "#d33",
          theme: "bulma",
          customClass: { confirmButton: 'centered-swal-button' }
        });
      }
    }
  };

  if (!gestor) return null;

  return (
    <div id="modal-overlayUpdateGestor" className="modal-overlay-gestor">
      <div className="modal-container-gestor">
        <div className="modal-header-gestor">
          <div className="header-content-gestor">
            <h2>
              <FontAwesomeIcon icon={faUser} className="header-icon-gestor" />
              Perfil del Gestor
            </h2>
            <button 
              type="button" 
              onClick={closeModalUpdateGestor}
              className="close-btn-gestor"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>Volver</span>
            </button>
          </div>
        </div>

        <form className="modal-body-gestor" onSubmit={handleButtonClick}>
          <div className="modal-content-gestor">
            {/* Columna izquierda - Información */}
            <div className="info-column-gestor">
              <div className="form-section-gestor">
                <h3 className="section-title-gestor">Información Personal</h3>
                <div className="form-grid-gestor">
                  <div className="input-group-gestor">
                    <label className="input-label-gestor">
                      <FontAwesomeIcon icon={faUser} />
                      Nombres
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="nombres"
                        value={formData.nombres || ""}
                        onChange={handleChange}
                        className="input-field-gestor"
                        placeholder="Ingrese los nombres"
                      />
                    ) : (
                      <div className="display-field-gestor">
                        {formData.nombres || "No especificado"}
                      </div>
                    )}
                  </div>

                  <div className="input-group-gestor">
                    <label className="input-label-gestor">
                      <FontAwesomeIcon icon={faUser} />
                      Apellidos
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="apellidos"
                        value={formData.apellidos || ""}
                        onChange={handleChange}
                        className="input-field-gestor"
                        placeholder="Ingrese los apellidos"
                      />
                    ) : (
                      <div className="display-field-gestor">
                        {formData.apellidos || "No especificado"}
                      </div>
                    )}
                  </div>

                  <div className="input-group-gestor">
                    <label className="input-label-gestor">
                      <FontAwesomeIcon icon={faIdCard} />
                      Cédula
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="documento"
                        value={formData.documento || ""}
                        onChange={handleChange}
                        className="input-field-gestor"
                        placeholder="Ingrese la cédula"
                      />
                    ) : (
                      <div className="display-field-gestor">
                        {formData.documento || "No especificado"}
                      </div>
                    )}
                  </div>

                  <div className="input-group-gestor">
                    <label className="input-label-gestor">
                      <FontAwesomeIcon icon={faPhone} />
                      Celular
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="celular"
                        value={formData.celular || ""}
                        onChange={handleChange}
                        className="input-field-gestor"
                        placeholder="Ingrese el celular"
                      />
                    ) : (
                      <div className="display-field-gestor">
                        {formData.celular || "No especificado"}
                      </div>
                    )}
                  </div>

                  <div className="input-group-gestor">
                    <label className="input-label-gestor">
                      <FontAwesomeIcon icon={faEnvelope} />
                      Email
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email || ""}
                        onChange={handleChange}
                        className="input-field-gestor"
                        placeholder="Ingrese el email"
                      />
                    ) : (
                      <div className="display-field-gestor">
                        {formData.email || "No especificado"}
                      </div>
                    )}
                  </div>

                  <div className="input-group-gestor">
                    <label className="input-label-gestor">Estado</label>
                    {isEditing ? (
                      <div className="status-buttons-gestor">
                        {["Activo", "Inactivo"].map((estado) => {
                          const isSelected = (formData.estado || "").toLowerCase() === estado.toLowerCase();
                          return (
                            <button
                              key={estado}
                              type="button"
                              className={`status-btn-gestor ${isSelected ? "active" : ""}`}
                              onClick={() => handleEstadoChange(estado)}
                            >
                              <span className="status-dot-gestor"></span>
                              {estado}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className={`status-display-gestor ${formData.estado?.toLowerCase()}`}>
                        <span className="status-dot-gestor"></span>
                        {formData.estado || "No especificado"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha - Imagen */}
            <div className="image-column-gestor">
              <div className="image-section-gestor">
                <div className="image-container-gestor">
                  {isEditing ? (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        id="imageUploadGestor"
                        className="file-input-gestor"
                      />
                      <label
                        className="image-upload-gestor editable"
                        htmlFor="imageUploadGestor"
                      >
                        {formData.foto_perfil instanceof File ? (
                          <img
                            src={URL.createObjectURL(formData.foto_perfil)}
                            alt="Vista previa"
                            className="profile-image-gestor"
                            onError={(e) => {
                              e.target.src = '/default-profile.png';
                            }}
                          />
                        ) : formData.foto_perfil ? (
                          <img
                            src={getImageSrc(formData.foto_perfil)}
                            alt="Foto de perfil"
                            className="profile-image-gestor"
                            onError={(e) => {
                              e.target.src = '/default-profile.png';
                            }}
                          />
                        ) : (
                          <div className="image-placeholder-gestor">
                            <FontAwesomeIcon icon={faCamera} className="placeholder-icon-gestor" />
                            <span>Haz clic para subir imagen</span>
                          </div>
                        )}
                        <div className="upload-overlay-gestor">
                          <FontAwesomeIcon icon={faCamera} />
                          <span>Cambiar imagen</span>
                        </div>
                      </label>
                    </>
                  ) : (
                    <div className="image-display-gestor">
                      {formData.foto_perfil ? (
                        <img
                          src={getImageSrc(formData.foto_perfil)}
                          alt="Foto de perfil"
                          className="profile-image-gestor"
                          onError={(e) => {
                            e.target.src = '/default-profile.png';
                          }}
                        />
                      ) : (
                        <div className="image-placeholder-gestor">
                          <FontAwesomeIcon icon={faUser} className="placeholder-icon-gestor" />
                          <span>Sin imagen</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {!isEditing && (
                  <div className="image-info-gestor">
                    <p>Activa el modo edición para cambiar la imagen</p>
                  </div>
                )}
              </div>

              <button type="submit" className="submit-btn-gestor">
                {isEditing ? (
                  <>
                    <FontAwesomeIcon icon={faUser} />
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
    </div>
  );
};

UpdateGestor.propTypes = {
  gestor: PropTypes.object,
  onClose: PropTypes.func
};