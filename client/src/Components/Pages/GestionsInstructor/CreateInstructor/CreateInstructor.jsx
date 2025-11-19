import React, { useRef, useState } from "react";
import "./CreateInstructor.css";
import addIMG from "../../../../assets/Icons/addImg.png";
import axiosInstance from "../../../../config/axiosInstance";
import { Routes, Route, useNavigate } from "react-router-dom";
import fotoPerfilDefect from '../../../../assets/Icons/userDefect.png';
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faUser, faIdCard, faPhone, faEnvelope, faGraduationCap, faCamera } from '@fortawesome/free-solid-svg-icons';

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
    if (onClose) onClose();
    const overlay = document.getElementById("modal-overlayCreateInstructor");
    if (overlay) overlay.style.display = "none";
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
    <div id="modal-overlayCreateInstructor" className="modal-overlay-create">
      <div className="modal-container-create">
        <div className="modal-header-create">
          <div className="header-content-create">
            <h2>
              <FontAwesomeIcon icon={faUser} className="header-icon" />
              Crear Nuevo Instructor
            </h2>
            <button 
              type="button" 
              onClick={closeModalCreateInstructor}
              className="close-btn-create"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>Volver</span>
            </button>
          </div>
        </div>

        <form className="modal-body-create" onSubmit={handleSubmit}>
          <div className="modal-content-create">
            {/* Columna izquierda - Información */}
            <div className="info-column-create">
              <div className="form-section-create">
                <h3 className="section-title-create">Información Personal</h3>
                <div className="form-grid-create">
                  <div className="input-group-create">
                    <label className="input-label-create">
                      <FontAwesomeIcon icon={faUser} />
                      Nombres
                    </label>
                    <input
                      type="text"
                      name="nombres"
                      value={formData.nombres}
                      onChange={handleInputChange}
                      className="input-field-create"
                      placeholder="Ingrese los nombres"
                      required
                    />
                  </div>

                  <div className="input-group-create">
                    <label className="input-label-create">
                      <FontAwesomeIcon icon={faUser} />
                      Apellidos
                    </label>
                    <input
                      type="text"
                      name="apellidos"
                      value={formData.apellidos}
                      onChange={handleInputChange}
                      className="input-field-create"
                      placeholder="Ingrese los apellidos"
                      required
                    />
                  </div>

                  <div className="input-group-create">
                    <label className="input-label-create">
                      <FontAwesomeIcon icon={faIdCard} />
                      Cédula
                    </label>
                    <input
                      type="text"
                      name="documento"
                      value={formData.documento}
                      onChange={handleInputChange}
                      className="input-field-create"
                      placeholder="Ingrese la cédula"
                      required
                    />
                  </div>

                  <div className="input-group-create">
                    <label className="input-label-create">
                      <FontAwesomeIcon icon={faGraduationCap} />
                      Título Profesional
                    </label>
                    <input
                      type="text"
                      name="titulo_profesional"
                      value={formData.titulo_profesional}
                      onChange={handleInputChange}
                      className="input-field-create"
                      placeholder="Ingrese el título profesional"
                      required
                    />
                  </div>

                  <div className="input-group-create">
                    <label className="input-label-create">
                      <FontAwesomeIcon icon={faPhone} />
                      Celular
                    </label>
                    <input
                      type="text"
                      name="celular"
                      value={formData.celular}
                      onChange={handleInputChange}
                      className="input-field-create"
                      placeholder="Ingrese el celular"
                      required
                    />
                  </div>

                  <div className="input-group-create">
                    <label className="input-label-create">
                      <FontAwesomeIcon icon={faEnvelope} />
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="input-field-create"
                      placeholder="Ingrese el email"
                      required
                    />
                  </div>

                  <div className="input-group-create">
                    <label className="input-label-create">Estado</label>
                    <div className="status-buttons-create">
                      {["Activo", "Inactivo"].map((estado) => {
                        const isSelected = (formData.estado || "").toLowerCase() === estado.toLowerCase();
                        return (
                          <button
                            key={estado}
                            type="button"
                            className={`status-btn-create ${isSelected ? "active" : ""}`}
                            onClick={() => setFormData({ ...formData, estado })}
                          >
                            <span className="status-dot-create"></span>
                            {estado}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha - Imagen */}
            <div className="image-column-create">
              <div className="image-section-create">
                <div className="image-container-create">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    id="imageUploadCreate"
                    className="file-input-create"
                  />
                  <label
                    className="image-upload-create"
                    htmlFor="imageUploadCreate"
                  >
                    {preview ? (
                      <img
                        src={preview}
                        alt="Vista previa"
                        className="profile-image-create"
                      />
                    ) : (
                      <div className="image-placeholder-create">
                        <FontAwesomeIcon icon={faCamera} className="placeholder-icon-create" />
                        <span>Haz clic para subir imagen</span>
                      </div>
                    )}
                    <div className="upload-overlay-create">
                      <FontAwesomeIcon icon={faCamera} />
                      <span>Cambiar imagen</span>
                    </div>
                  </label>
                </div>
                
                <div className="image-info-create">
                  <p>Recomendado: Imagen cuadrada 500x500px</p>
                </div>
              </div>

              <button type="submit" className="submit-btn-create">
                <FontAwesomeIcon icon={faUser} />
                <span>Crear Instructor</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};