import React, { useState } from "react";
import "./UpdateGestor.css";
import axiosInstance from "../../../../config/axiosInstance";
import { validateEmail, validateNumber, validateText, createMensajeError } from "../../../../utils/Validators/formValidator";
import { Routes, Route, useNavigate } from "react-router-dom";

export const UpdateGestor = ({ gestor }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...gestor });

  const closeModalUpdateGestor = () => {
    document.getElementById("modal-overlayUpdateGestor").style.display = "none";
  };

  const getImageSrc = (data) => {
    if (!data) return null;
    if (data.startsWith('/9j/')) return `data:image/jpeg;base64,${data}`;
    if (data.startsWith('iVBORw0KGgo')) return `data:image/png;base64,${data}`;
    return `data:image/jpeg;base64,${data}`;
  };

  // Función de validación
  const validateField = (name, value) => {
    switch (name) {
      case "nombres":
        if (!value.trim()) return "Los nombres son obligatorios";
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) return "Solo se permiten letras y espacios en los nombres";
        break;
      case "apellidos":
        if (!value.trim()) return "Los apellidos son obligatorios";
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) return "Solo se permiten letras y espacios en los apellidos";
        break;
      case "documento":
        if (!value.trim()) return "La cédula es obligatoria";
        if (!/^\d+$/.test(value)) return "Solo se permiten números en la cédula";
        if (value.length < 6) return "La cédula debe tener al menos 6 dígitos";
        break;
      case "celular":
        if (!value.trim()) return "El celular es obligatorio";
        if (!/^\d+$/.test(value)) return "Solo se permiten números en el celular";
        if (value.length < 10) return "El celular debe tener al menos 10 dígitos";
        break;
      case "email":
        if (!value.trim()) return "El email es obligatorio";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Formato de email inválido";
        break;
      default:
        break;
    }
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert("Solo se permiten archivos de imagen");
        return;
      }
      
      // Validar tamaño de archivo (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert("La imagen no debe superar los 2MB");
        return;
      }
      
      setFormData((prev) => ({
        ...prev,
        foto_perfil: file,
      }));
    }
  };

  const handleEstadoChange = (estado) => {
    setFormData((prev) => ({ ...prev, estado }));
  };

  const validateForm = () => {
    const fieldsToValidate = ["nombres", "apellidos", "documento", "celular", "email"];
    
    for (const field of fieldsToValidate) {
      const error = validateField(field, formData[field] || "");
      if (error) {
        alert(error);
        return false;
      }
    }
    
    return true;
  };

  const handleButtonClick = async (e) => {
    e.preventDefault();

    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    // Validar antes de guardar
    if (!validateForm()) {
      return;
    }

    // Guardar cambios
    try {
      const validationGeneral = {
          nombres: validateText(formData.nombres),
          apellidos: validateText(formData.apellidos),
          Cédula: validateNumber(formData.documento),
          celular: validateNumber(formData.celular),
          email: validateEmail(formData.email)
      }

      console.log("FormData enviado: ", formData)
      console.log("datos validados: ", validationGeneral)
      
      const errores = await createMensajeError(validationGeneral);
        if(errores !== null){
          alert(errores);
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
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      alert(response.data.message || 'Perfil actualizado');
      setIsEditing(false);
      window.location.reload();
      document.getElementById("modal-overlayUpdateGestor").style.display = "none";
    } catch (error) {
      console.error("Error al actualizar el perfil:", error.response?.data || error.message);
      alert("Hubo un error al actualizar el perfil.");
    }
  };

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
                    className={`status ${formData.estado === estado ? "active" : ""}`}
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