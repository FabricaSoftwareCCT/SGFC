import React, { useRef, useState, useEffect } from "react";
import "./CreateGestor.css";
import addIMG from "../../../../assets/Icons/addImg.png";
import axiosInstance from "../../../../config/axiosInstance";
import { useNavigate } from "react-router-dom";
import fotoPerfilDefect from "../../../../assets/Icons/userDefect.png";
import { useModal } from "../../../../Context/ModalContext";
import { validateEmail, validateNumber, validateText } from "../../../../utils/Validators/formValidator";
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faUser, faIdCard, faPhone, faEnvelope, faCamera } from '@fortawesome/free-solid-svg-icons';

export const CreateGestor = ({ onClose }) => {
  // 1. Todos los Hooks al inicio del componente
  const { setShowModalGeneral } = useModal();
  const navigate = useNavigate();
  const mounted = useRef(false);
  const fileInputRef = useRef(null);

  const [preview, setPreview] = useState(null);
  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    documento: "",
    celular: "",
    email: "",
    estado: "Inactivo",
  });
  const [file, setFile] = useState(null);

  // 2. Efectos después de los estados
  useEffect(() => {
    const userSessionString = sessionStorage.getItem("userSession");
    const userSession = userSessionString ? JSON.parse(userSessionString) : null;
    const hasAccess = userSessionString && userSession?.accountType === "Administrador";

  }, [navigate]);

  // 3. Handlers y funciones después de los efectos
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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

  const closeModalCreateGestor = () => {
    if (onClose) {
      onClose();
    } else {
      const overlay = document.getElementById("modal-overlayCreateGestor");
      if (overlay) overlay.style.display = "none";
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();

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

    const data = new FormData();
    // Si no se subió archivo, usa la imagen por defecto
    if (file) {
      data.append("foto_perfil", file);
    } else {
      // Convierte la imagen importada a blob para enviarla como archivo
      const response = await fetch(fotoPerfilDefect);
      const blob = await response.blob();
      data.append("foto_perfil", blob, "fotoPerfilDefect.png");
    }
    data.append("nombres", formData.nombres);
    data.append("apellidos", formData.apellidos);
    data.append("documento", formData.documento);
    data.append("celular", formData.celular);
    data.append("email", formData.email);
    data.append("estado", formData.estado);

    try {
      const response = await axiosInstance.post("/api/users/crearGestor", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text: "Gestor creado con éxito",
        confirmButtonColor: "#3085d6",
        timer: 3000,
        timerProgressBar: true,
        theme: "bulma", // Añadido tema Bulma
        customClass: {
          confirmButton: 'centered-swal-button'
        }
      });
      console.log(response.data);

      closeModalCreateGestor();
      window.location.reload();
    } catch (error) {
      console.error("Error al crear el gestor:", error);
      
      // Manejar errores específicos del backend
      if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.message;
        if (errorMsg === "El correo ya está registrado.") {
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
      } else if (error.response?.status === 409) {
        const errorMsg = error.response?.data?.message;
        await Swal.fire({
          icon: "error",
          title: "Conflicto",
          text: errorMsg || "Ya existe un gestor con estos datos",
          confirmButtonColor: "#d33",
          theme: "bulma", // Añadido tema Bulma
          customClass: {
            confirmButton: 'centered-swal-button'
          }
        });
      } else {
        const errorMsg = error.response?.data?.message || "Hubo un problema al crear el gestor.";
        await Swal.fire({
          icon: "error",
          title: "Error del sistema",
          text: errorMsg,
          confirmButtonColor: "#d33",
          theme: "bulma", // Añadido tema Bulma
          customClass: {
            confirmButton: 'centered-swal-button'
          }
        });
      }
    }
  };

  return (
    <div id="modal-overlayCreateGestor" className="modal-overlay-create-gestor">
      <div className="modal-container-create-gestor">
        <div className="modal-header-create-gestor">
          <div className="header-content-create-gestor">
            <h2>
              <FontAwesomeIcon icon={faUser} className="header-icon" />
              Crear Nuevo Gestor
            </h2>
            <button 
              type="button" 
              onClick={closeModalCreateGestor}
              className="close-btn-create-gestor"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>Volver</span>
            </button>
          </div>
        </div>

        <form className="modal-body-create-gestor" onSubmit={handleSubmit}>
          <div className="modal-content-create-gestor">
            {/* Columna izquierda - Información */}
            <div className="info-column-create-gestor">
              <div className="form-section-create-gestor">
                <h3 className="section-title-create-gestor">Información Personal</h3>
                <div className="form-grid-create-gestor">
                  <div className="input-group-create-gestor">
                    <label className="input-label-create-gestor">
                      <FontAwesomeIcon icon={faUser} />
                      Nombres
                    </label>
                    <input
                      type="text"
                      name="nombres"
                      value={formData.nombres}
                      onChange={handleInputChange}
                      className="input-field-create-gestor"
                      placeholder="Ingrese los nombres"
                      required
                    />
                  </div>

                  <div className="input-group-create-gestor">
                    <label className="input-label-create-gestor">
                      <FontAwesomeIcon icon={faUser} />
                      Apellidos
                    </label>
                    <input
                      type="text"
                      name="apellidos"
                      value={formData.apellidos}
                      onChange={handleInputChange}
                      className="input-field-create-gestor"
                      placeholder="Ingrese los apellidos"
                      required
                    />
                  </div>

                  <div className="input-group-create-gestor">
                    <label className="input-label-create-gestor">
                      <FontAwesomeIcon icon={faIdCard} />
                      Documento
                    </label>
                    <input
                      type="text"
                      name="documento"
                      value={formData.documento}
                      onChange={handleInputChange}
                      className="input-field-create-gestor"
                      placeholder="Ingrese el documento"
                      required
                    />
                  </div>

                  <div className="input-group-create-gestor">
                    <label className="input-label-create-gestor">
                      <FontAwesomeIcon icon={faPhone} />
                      Celular
                    </label>
                    <input
                      type="text"
                      name="celular"
                      value={formData.celular}
                      onChange={handleInputChange}
                      className="input-field-create-gestor"
                      placeholder="Ingrese el celular"
                      required
                    />
                  </div>

                  <div className="input-group-create-gestor">
                    <label className="input-label-create-gestor">
                      <FontAwesomeIcon icon={faEnvelope} />
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="input-field-create-gestor"
                      placeholder="Ingrese el email"
                      required
                    />
                  </div>

                  <div className="input-group-create-gestor">
                    <label className="input-label-create-gestor">Estado</label>
                    <div className="status-buttons-create-gestor">
                      {["Activo", "Inactivo"].map((estado) => {
                        const isSelected = (formData.estado || "").toLowerCase() === estado.toLowerCase();
                        return (
                          <button
                            key={estado}
                            type="button"
                            className={`status-btn-create-gestor ${isSelected ? "active" : ""}`}
                            onClick={() => setFormData({ ...formData, estado })}
                          >
                            <span className="status-dot-create-gestor"></span>
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
            <div className="image-column-create-gestor">
              <div className="image-section-create-gestor">
                <div className="image-container-create-gestor">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    id="imageUploadCreateGestor"
                    className="file-input-create-gestor"
                  />
                  <label
                    className="image-upload-create-gestor"
                    htmlFor="imageUploadCreateGestor"
                  >
                    {preview ? (
                      <img
                        src={preview}
                        alt="Vista previa"
                        className="profile-image-create-gestor"
                      />
                    ) : (
                      <div className="image-placeholder-create-gestor">
                        <FontAwesomeIcon icon={faCamera} className="placeholder-icon-create-gestor" />
                        <span>Haz clic para subir imagen</span>
                      </div>
                    )}
                    <div className="upload-overlay-create-gestor">
                      <FontAwesomeIcon icon={faCamera} />
                      <span>Cambiar imagen</span>
                    </div>
                  </label>
                </div>
                
                <div className="image-info-create-gestor">
                  <p>Recomendado: Imagen cuadrada 500x500px</p>
                </div>
              </div>

              <button type="submit" className="submit-btn-create-gestor">
                <FontAwesomeIcon icon={faUser} />
                <span>Crear Gestor</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};