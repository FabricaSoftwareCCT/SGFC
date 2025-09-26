import React, { useState, useEffect } from "react";
import "./UpdateInstructor.css";
import axiosInstance from "../../../../config/axiosInstance"; // Asegúrate de ajustar esta ruta según la estructura de tu proyecto
import { createMensajeError, validateNumber, validateText, validateEmail } from "../../../../utils/Validators/formValidator";

export const UpdateInstructor = ({ instructor, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...instructor });
  const [cantidadCursos, setCantidadCursos] = useState(0);

  useEffect(() => {
    const obtenerCursosAsignados = async () => {
      try {

        //Obtener cursos asginados al instructor seleccionado
        const response = await axiosInstance.get(
          `/api/courses/cursos-asignados/${instructor.ID}`
        );
        if (Array.isArray(response.data)) {
          setCantidadCursos(response.data.length);
        } else {
          setCantidadCursos(0);
        }
      } catch (error) {
        console.error("Error al obtener los cursos asignados:", error);
        setCantidadCursos(0);
      }
    };

    if (instructor.ID) {
      obtenerCursosAsignados();
    }
  }, [instructor]);

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
      // Activar edición
      setIsEditing(true);
      return;
    }

    // Guardar cambios
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
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert(response.data.message || "Perfil actualizado");
      setIsEditing(false);

      //Recargar la página para reflejar cambios
      window.location.reload();
      //Ocultar el modal
      document.getElementById("modal-overlayUpdateInstructor").style.display =
        "none";
    } catch (error) {
      console.error(
        "Error al actualizar el perfil:",
        error.response.data || error.message
      );
      alert("Hubo un error al actualizar el perfil.");
    }
  };

  return (
    <div id="modal-overlayUpdateInstructor" style={{ display: "flex" }}>
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
            <strong>Título Profesional:</strong>{" "}
            {isEditing ? (
              <input
                type="text"
                name="titulo_profesional"
                className="input_updateData"
                value={formData.titulo_profesional || ""}
                onChange={handleChange}
              />
            ) : (
              <span className="valor-campo">{formData.titulo_profesional || ""}</span>
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

          <p className="cursosAsignados">
            <strong>Cursos Asignados:</strong> {cantidadCursos}
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
                src={`data:image/jpeg;base64,${formData.foto_perfil}`}
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
            onClick={closeModalUpdateInstructor}
            className="closeModal"
          ></button>
        </div>
      </form>
    </div>
  );
};
