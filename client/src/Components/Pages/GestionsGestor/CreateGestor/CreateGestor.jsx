import React, { useRef, useState, useEffect } from "react";
import "./CreateGestor.css";
import addIMG from "../../../../assets/Icons/addImg.png";
import axiosInstance from "../../../../config/axiosInstance";
import { useNavigate } from "react-router-dom";
import fotoPerfilDefect from "../../../../assets/Icons/userDefect.png";
import { useModal } from "../../../../Context/ModalContext"

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

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      const errorMsg = error.response?.data?.message || "Hubo un problema al crear el gestor.";
      alert(`Error: ${errorMsg}`);
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
