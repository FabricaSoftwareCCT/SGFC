import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./UpdateInstructor.css";
import axiosInstance from "../../../../config/axiosInstance"; // Asegúrate de ajustar esta ruta según la estructura de tu proyecto
import { createMensajeError, validateNumber, validateText, validateEmail } from "../../../../utils/Validators/formValidator";
import { ModalManageCourses } from "../../../UI/Modal_ManageCourses/ModalManageCourses";
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css'

export const UpdateInstructor = ({ instructor, onClose }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...instructor });
  const [cantidadCursos, setCantidadCursos] = useState(0);
  const [cursosAsignados, setCursosAsignados] = useState([]);
  const [showManageCourses, setShowManageCourses] = useState(false);

  // Resetear datos cuando cambia el instructor
  useEffect(() => {
    setCantidadCursos(0);
    setCursosAsignados([]);
    setFormData({ ...instructor });
    setIsEditing(false);
  }, [instructor?.ID]);

  // Obtener cursos asignados cuando cambia el instructor
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
  }, [instructor?.ID]); // Dependencia optimizada: solo se ejecuta cuando cambia el ID

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
          theme: "bulma", // Añadido tema Bulma
          customClass: {
            confirmButton: 'centered-swal-button'
          }
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
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
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
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Hubo un error al actualizar el perfil. Por favor, inténtelo de nuevo.",
        confirmButtonColor: "#d33",
        theme: "bulma", // Añadido tema Bulma
        customClass: {
          confirmButton: 'centered-swal-button'
        }
      });
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
            <span className="valor-campo">{truncarNombreArchivo(formData.email,13 || "")}</span>
          )}
        </p>
        <p>
          <strong>Estado:</strong>{" "}
          {isEditing ? (
            <div className="status-buttons">
              {["Activo", "Inactivo"].map((estado) => {
                const isSelected = (formData.estado || "").toLowerCase() === estado.toLowerCase();
                return (
                  <button
                    key={estado}
                    type="button"
                    className={`status ${isSelected ? "active" : ""}`}
                    onClick={() => handleEstadoChange(estado)}
                  >
                    {estado}
                  </button>
                );
              })}
            </div>
          ) : (
            <span className="valor-campo">{formData.estado}</span>
          )}
        </p>

        <p className="cursosAsignados">
          <strong>Cursos Asignados:</strong> 
          <span className="valor-campo">{cantidadCursos}</span>
        </p>
        {cursosAsignados && cursosAsignados.length > 0 && (
          <ul className="lista-cursos-asignados">
            {cursosAsignados.map((curso) => {
              const courseName = (curso && curso.Curso && curso.Curso.nombre_curso)
                || curso.nombre_curso
                || `Curso ${curso.curso_ID || curso.ID || ''}`;
              const courseId = (curso && curso.Curso && curso.Curso.ID)
                || curso.curso_ID
                || curso.ID;
              return (
                <li key={`${courseId}-${courseName}`} className="curso-item">
                  <button
                    type="button"
                    className="curso-link"
                    title={courseName}
                    onClick={() => navigate(`/Cursos/${courseId}`)}
                  >
                    {courseName}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <div style={{ marginTop: "8px" }}>
          <button
            type="button"
            className="edit-button-updateInstructor"
            onClick={() => setShowManageCourses(true)}
          >
            Gestionar cursos asignados
          </button>
        </div>
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
              className="preview-image-update"
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

// Render del modal de gestión (fuera para mantener JSX claro)
export const UpdateInstructorWithManage = (props) => {
  return (
    <>
      <UpdateInstructor {...props} />
      {props.instructor && props.instructor.ID && (
        <></>
      )}
    </>
  );
};