import React, { useRef, useState, useEffect } from "react";
import "./CreateGestor.css";
import addIMG from "../../../../assets/Icons/addImg.png";
import axiosInstance from "../../../../config/axiosInstance";
import { useNavigate } from "react-router-dom";
import fotoPerfilDefect from "../../../../assets/Icons/userDefect.png";
import { useModal } from "../../../../Context/ModalContext";
import { validateEmail, validateNumber, validateText } from "../../../../utils/Validators/formValidator";

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
      document.getElementById("modal-overlayCreateGestor").style.display = "none";
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
      alert(`Por favor corrija los siguientes errores:\n\n${errors.join('\n')}`);
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

      alert("Gestor creado con éxito");
      console.log(response.data);

      closeModalCreateGestor();
      window.location.reload();
    } catch (error) {
      console.error("Error al crear el gestor:", error);
      
      // Manejar errores específicos del backend
      if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.message;
        if (errorMsg === "El correo ya está registrado.") {
          alert("Error: El correo electrónico ya está registrado en el sistema. Por favor, use un correo diferente.");
        } else if (errorMsg === "El documento ya está registrado.") {
          alert("Error: El número de documento ya está registrado en el sistema. Por favor, verifique el documento.");
        } else {
          alert(`Error: ${errorMsg}`);
        }
      } else if (error.response?.status === 409) {
        const errorMsg = error.response?.data?.message;
        alert(`Error: ${errorMsg}`);
      } else {
        const errorMsg = error.response?.data?.message || "Hubo un problema al crear el gestor.";
        alert(`Error: ${errorMsg}`);
      }
    }
  };


  return (
    <div id="modal-overlayCreateGestor">
      <form className="modal-bodyCreateGestor" onSubmit={handleSubmit}>
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
            Documento
            <input
              type="text"
              name="documento"
              value={formData.documento}
              onChange={handleInputChange}
              required
            />
          </label>
          <label>
            Celular
            <input
              type="text"
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
                <p>Arrastra o sube la foto del gestor aquí.</p>
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
        <a onClick={() => closeModalCreateGestor(false)} className="text-return">Volver</a>
          <button
            type="button"
            onClick={closeModalCreateGestor}
            className="closeModal"
          ></button>
        </div>
      </form>
    </div>
  );
};
