import React, { useState, useEffect } from "react";
import "./UpdateGestor.css";
import axiosInstance from "../../../../config/axiosInstance";
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css'

export const UpdateGestor = ({ gestor, onClose }) => {

  // Validación de sesión de usuario y rol de administrador
  const userSessionString = sessionStorage.getItem("userSession");
  const userSession = userSessionString ? JSON.parse(userSessionString) : null;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...gestor });

  // Actualizar formData cuando cambie el gestor seleccionado
  useEffect(() => {
    if (gestor) {
      setFormData({ ...gestor });
      setIsEditing(false); // Resetear modo edición al cambiar de gestor
    }
  }, [gestor]);

  const closeModalUpdateGestor = () => {
    if (onClose) {
      onClose();
    }
  };

  const getImageSrc = (data) => {
    if (!data) return null;

    if (data.startsWith('/9j/')) {
      return `data:image/jpeg;base64,${data}`; // jpg y jpeg
    } else if (data.startsWith('iVBORw0KGgo')) {
      return `data:image/png;base64,${data}`; // png
    } else {
      return `data:image/jpeg;base64,${data}`; // fallback
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

  const handleEstadoChange = (estado) => {
    setFormData((prev) => ({ ...prev, estado }));
  };

  const validateFields = () => {
    const errors = [];
    
    // Validar nombres
    if (!formData.nombres || formData.nombres.trim() === '') {
      errors.push('Los nombres son requeridos');
    } else if (formData.nombres.trim().length < 2) {
      errors.push('Los nombres deben tener al menos 2 caracteres');
    }
    
    // Validar apellidos
    if (!formData.apellidos || formData.apellidos.trim() === '') {
      errors.push('Los apellidos son requeridos');
    } else if (formData.apellidos.trim().length < 2) {
      errors.push('Los apellidos deben tener al menos 2 caracteres');
    }
    
    // Validar documento (solo números)
    if (!formData.documento || formData.documento.trim() === '') {
      errors.push('El número de documento es requerido');
    } else if (!/^\d+$/.test(formData.documento.trim())) {
      errors.push('El número de documento debe contener solo números');
    } else if (formData.documento.trim().length < 6) {
      errors.push('El número de documento debe tener al menos 6 dígitos');
    }
    
    // Validar celular (solo números)
    if (!formData.celular || formData.celular.trim() === '') {
      errors.push('El número de celular es requerido');
    } else if (!/^\d+$/.test(formData.celular.trim())) {
      errors.push('El número de celular debe contener solo números');
    } else if (formData.celular.trim().length < 10) {
      errors.push('El número de celular debe tener al menos 10 dígitos');
    }
    
    // Validar email
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
      // Activar edición
      setIsEditing(true);
      return;
    }

    // Validar todos los campos antes de enviar
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
        theme: "bulma", // Añadido tema Bulma
        customClass: {
          confirmButton: 'centered-swal-button'
        }
      });
          return;
        }

    // Guardar cambios
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
        theme: "bulma", // Añadido tema Bulma
        customClass: {
          confirmButton: 'centered-swal-button'
        }
      });
      setIsEditing(false);
      window.location.reload();
      closeModalUpdateGestor();
    } catch (error) {
      console.error("Error al actualizar el perfil:", error.response?.data || error.message);
      
      // Manejar errores específicos del backend
      if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.message;
        if (errorMsg === "El correo electrónico ya está registrado.") {
          await Swal.fire({
            icon: "error",
            title: "Error de correo",
            text: "El correo electrónico ya está registrado en el sistema. Por favor, use un correo diferente.",
            confirmButtonColor: "#d33",
            theme: "bulma", // Añadido tema Bulma
            customClass: {
              confirmButton: 'centered-swal-button'
            }
          });
        } else if (errorMsg === "El documento ya está registrado.") {
          await Swal.fire({
            icon: "error",
            title: "Error de documento",
            text: "El número de documento ya está registrado en el sistema. Por favor, verifique el documento.",
            confirmButtonColor: "#d33",
            theme: "bulma", // Añadido tema Bulma
            customClass: {
              confirmButton: 'centered-swal-button'
            }
          });
        } else if (errorMsg === "El número de celular ya está registrado.") {
          await Swal.fire({
            icon: "error",
            title: "Error de celular",
            text: "El número de celular ya está registrado en el sistema. Por favor, use un número diferente.",
            confirmButtonColor: "#d33",
            theme: "bulma", // Añadido tema Bulma
            customClass: {
              confirmButton: 'centered-swal-button'
            }
          });
        } else {
          await Swal.fire({
            icon: "error",
            title: "Error",
            text: errorMsg || "Ha ocurrido un error inesperado",
            confirmButtonColor: "#d33",
            theme: "bulma", // Añadido tema Bulma
            customClass: {
              confirmButton: 'centered-swal-button'
            }
          });
        }
      } else {
        await Swal.fire({
          icon: "error",
          title: "Error del sistema",
          text: "Hubo un error al actualizar el perfil. Por favor, inténtelo de nuevo.",
          confirmButtonColor: "#d33",
          theme: "bulma", // Añadido tema Bulma
          customClass: {
            confirmButton: 'centered-swal-button'
          }
        });
      }
    }
  };

  if (!gestor) return null;

  return (
    <div id="modal-overlayUpdateGestor" style={{ display: "flex" }}>
      <form className="modal-bodyUpdateInstructor" onSubmit={handleButtonClick}>
        <div className="modal-left-update">
          <p>
            <strong>Nombres:</strong>{" "}
            {isEditing ? (
              <input
                type="text"
                name="nombres"
                className="input_updateData"
                value={formData.nombres || ""}
                onChange={handleChange}
              />
            ) : (
              <span className="valor-campo">{formData.nombres || ""}</span>
            )}
          </p>
          <p>
            <strong>Apellidos:</strong>{" "}
            {isEditing ? (
              <input
                type="text"
                name="apellidos"
                className="input_updateData"
                value={formData.apellidos || ""}
                onChange={handleChange}
              />
            ) : (
              <span className="valor-campo">{formData.apellidos || ""}</span>
            )}
          </p>
          <p>
            <strong>Cédula:</strong>{" "}
            {isEditing ? (
              <input
                type="text"
                name="documento"
                className="input_updateData"
                value={formData.documento || ""}
                onChange={handleChange}
              />
            ) : (
              <span className="valor-campo">{formData.documento || ""}</span>
            )}
          </p>
          <p>
            <strong>Celular:</strong>{" "}
            {isEditing ? (
              <input
                type="text"
                name="celular"
                className="input_updateData"
                value={formData.celular || ""}
                onChange={handleChange}
              />
            ) : (
              <span className="valor-campo">{formData.celular || ""}</span>
            )}
          </p>
          <p>
            <strong>Email:</strong>{" "}
            {isEditing ? (
              <input
                type="email"
                name="email"
                className="input_updateData"
                value={formData.email || ""}
                onChange={handleChange}
              />
            ) : (
              <span className="valor-campo">{formData.email || ""}</span>
            )}
          </p>
          <p>
            <strong>Estado:</strong>{" "}
            {isEditing ? (
              <div className="status-buttons">
                {["Activo", "Inactivo"].map((estado) => (
                  <button
                    key={estado}
                    type="button"
                    className={`status ${formData.estado?.toLowerCase() === estado.toLowerCase() ? "active" : ""}`}
                    onClick={() => handleEstadoChange(estado)}
                  >
                    {estado}
                  </button>
                ))}
              </div>
            ) : (
              <span className="valor-campo">{formData.estado}</span>
            )}
          </p>
        </div>

        <div className="modal-right">
          <input
            type="file"
            accept="image/*"
            hidden={!isEditing}
            disabled={!isEditing}
            onChange={handleImageChange}
            id="imageUpload"
          />

          <label
            className={`upload-area-update ${!isEditing ? "read-only-border" : ""}`}
            htmlFor="imageUpload"
          >
            {formData.foto_perfil instanceof File ? (
              <img
                src={URL.createObjectURL(formData.foto_perfil)}
                alt="Vista previa"
                className="preview-image"
              />
            ) : formData.foto_perfil ? (
              <img
                src={getImageSrc(formData.foto_perfil)}
                alt="Foto de perfil"
                className="preview-image-update"
              />
            ) : (
              <div className="upload-placeholder">
                <p>Sin imagen disponible</p>
              </div>
            )}
          </label>

          <button type="submit" className="edit-button-updateInstructor">
            {isEditing ? "Guardar Cambios" : "Actualizar Perfil"}
          </button>
        </div>


        <div className="container_return_UpdateInstructor">
          <h5>Volver</h5>
          <button
            type="button"
            onClick={closeModalUpdateGestor}
            className="closeModal"
          ></button>
        </div>
      </form>
    </div>
  );

};

UpdateGestor.propTypes = {
  gestor: PropTypes.object,
  onClose: PropTypes.func
};
