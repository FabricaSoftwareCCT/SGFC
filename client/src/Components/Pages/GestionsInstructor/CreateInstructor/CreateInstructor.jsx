import React, { useRef, useState } from "react";
import "./CreateInstructor.css";
import addIMG from "../../../../assets/Icons/addImg.png";
import axiosInstance from "../../../../config/axiosInstance";
import { Routes, Route, useNavigate } from "react-router-dom";
import fotoPerfilDefect from '../../../../assets/Icons/userDefect.png';
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css'

export const CreateInstructor = ({ onClose }) => {

  // Validación de sesión de usuario y rol de administrador
  const userSessionString = sessionStorage.getItem("userSession");
  const userSession = userSessionString ? JSON.parse(userSessionString) : null;

  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    documento: "",
    titulo_profesional: "",
    celular: "",
    email: "",
    estado: "Inactivo", // Valor predeterminado
  });
  const [file, setFile] = useState(null);

  // Manejar cambios en los campos del formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Manejar la selección de archivo
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const closeModalCreateInstructor = () => {
    document.getElementById("modal-overlayCreateInstructor").style.display =
      "none";
  };

  // Enviar datos al backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    if (file) {
      data.append("foto_perfil", file);
    } else {
      // Si no hay archivo, usa la imagen por defecto
      const response = await fetch(fotoPerfilDefect);
      const blob = await response.blob();
      data.append("foto_perfil", blob, "fotoPerfilDefect.png");
    }
    data.append("nombres", formData.nombres);
    data.append("apellidos", formData.apellidos);
    data.append("documento", formData.documento);
    data.append("titulo_profesional", formData.titulo_profesional);
    data.append("celular", formData.celular);
    data.append("email", formData.email);
    data.append("estado", formData.estado);

    try {
      const response = await axiosInstance.post("/api/users/crearInstructor", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Instructor creado con éxito',
        confirmButtonColor: '#3085d6',
        timer: 3000,
        timerProgressBar: true,
        theme: "bulma",
        customClass: {
          confirmButton: 'centered-swal-button'
        }
      });
      console.log(response.data);

      document.getElementById("modal-overlayCreateInstructor").style.display = "none";
      window.location.reload();
    } catch (error) {
      console.error("Error al crear el instructor:", error);
      const errorMsg =
        error.response?.data?.message ||
        "Hubo un problema al crear el instructor.";
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMsg,
        confirmButtonColor: '#3085d6',
        theme: "bulma",
        customClass: {
          confirmButton: 'centered-swal-button'
        }
      });
    }
  };

  return (
    <div id="modal-overlayCreateInstructor">
      <form className="modal-bodyCreateInstructor" onSubmit={handleSubmit}>
        <div className="modal-left">
          <label>
            Nombres
            <input
              type="text"
              name="nombres"
              value={formData.nombres}
              onChange={handleInputChange}
              required
            />
          </label>
          <label>
            Apellidos
            <input
              type="text"
              name="apellidos"
              value={formData.apellidos}
              onChange={handleInputChange}
              required
            />
          </label>
          <label>
            Cédula
            <input
              type="number"
              name="documento"
              value={formData.documento}
              onChange={handleInputChange}
              required
            />
          </label>
          <label>
            Título
            <input
              type="text"
              name="titulo_profesional"
              value={formData.titulo_profesional}
              onChange={handleInputChange}
              required
            />
          </label>
          <label>
            Celular
            <input
              type="number"
              name="celular"
              value={formData.celular}
              onChange={handleInputChange}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </label>
        </div>

        <div className="modal-right">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            hidden
          />

          <label
            className="upload-area"
            onClick={() => fileInputRef.current.click()}
          >
            {preview ? (
              <img
                src={preview}
                alt="Vista previa"
                className="preview-image"
              />
            ) : (
              <div className="upload-placeholder">
                <img
                  src={addIMG}
                  alt="icono agregar imagen"
                  className="icon"
                />
                <p>Arrastra o sube la foto del curso aquí.</p>
              </div>
            )}
          </label>

          <div className="status-container">
            <span>Estado:</span>
            <div className="status-buttons">
              <button
                type="button"
                className={`status ${formData.estado === "Activo" ? "active" : ""
                  }`}
                onClick={() => setFormData({ ...formData, estado: "Activo" })}
              >
                Activo
              </button>
              <button
                type="button"
                className={`status ${formData.estado === "Inactivo" ? "active" : ""
                  }`}
                onClick={() =>
                  setFormData({ ...formData, estado: "Inactivo" })
                }
              >
                Inactivo
              </button>
            </div>
          </div>

          <button type="submit" className="save-button">
            Guardar
          </button>
        </div>

        <div className="container_return_AssignInstructor">
          <h5>Volver</h5>
          <button
            type="button"
            onClick={closeModalCreateInstructor}
            className="closeModal"
          ></button>
        </div>
      </form>
    </div>
  );

};