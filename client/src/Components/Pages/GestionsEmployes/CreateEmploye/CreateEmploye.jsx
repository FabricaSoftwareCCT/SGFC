import React, { useRef, useState } from 'react';
import './CreateEmploye.css';
import addIMG from '../../../../assets/Icons/addImg.png';
import axiosInstance from '../../../../config/axiosInstance';
import fotoPerfilDefect from '../../../../assets/Icons/userDefect.png';
import { useModal } from '../../../../Context/ModalContext';
import buttonEdit from '../../../../assets/Icons/buttonEdit.png';


export const CreateEmploye = () => {
  const fileInputRef = useRef(null);
  const { setShowModalCreateEmployee } = useModal();
  const [preview, setPreview] = useState(null);
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    cedula: '',
    celular: '',
    email: '',
    estado: 'Inactivo', // Valor predeterminado
  });
  const [file, setFile] = useState(null);
  const pdfInputRef = useRef(null);
  const [documentoPDF, setDocumentoPDF] = useState(null);
  const [pdfFileName, setPdfFileName] = useState('');



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

  const handlePDFChange = (e) => {
    const selectedPDF = e.target.files[0];
    if (!selectedPDF) return;

    setDocumentoPDF(selectedPDF); // Ya lo estás usando para enviarlo
    setPdfFileName(selectedPDF.name); // Guardar nombre del archivo
  };

  // Enviar datos al backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    if (file) {
      data.append('foto_perfil', file);
    } else {
      // Si no hay archivo, usa la imagen por defecto
      const response = await fetch(fotoPerfilDefect);
      const blob = await response.blob();
      data.append('foto_perfil', blob, "fotoPerfilDefect.png");
    }
    data.append('nombres', formData.nombres);
    data.append('apellidos', formData.apellidos);
    data.append('documento', formData.cedula);
    data.append('celular', formData.celular);
    data.append('email', formData.email);
    data.append('estado', formData.estado);

    try {
      // Obtener empresa_ID de la sesión
      let userSessionString = localStorage.getItem("userSession") || sessionStorage.getItem("userSession");
      if (!userSessionString) {
        alert("No se encontró la sesión de usuario.");
        return;
      }
      const userSession = JSON.parse(userSessionString);
      const empresaId = userSession.empresa_ID;
      if (!empresaId) {
        alert("No se encontró el ID de la empresa en la sesión.");
        return;
      }

      // Crear el empleado
      const response = await axiosInstance.post(`/api/users/empresa/${empresaId}/empleados`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const empleadoId = response.data.empleado?.ID || response.data.id;
      alert('Empleado creado con éxito ' + empleadoId);

      // Si se subió un PDF, hacer OCR
      if (documentoPDF && empleadoId) {
        const pdfForm = new FormData();
        pdfForm.append("pdf", documentoPDF);

        try {
          const ocrResponse = await axiosInstance.post(`/api/users/${empleadoId}/documento`, pdfForm, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          console.log('OCR resultado:', ocrResponse.data);
          alert(`Tipo de documento: ${ocrResponse.data.tipoDetectado}\nNúmero: ${ocrResponse.data.documento}`);
        } catch (ocrError) {
          console.error("Error al procesar documento:", ocrError);
          alert("Empleado creado, pero hubo un problema al procesar el documento PDF.");
        }
      }

      // Cerrar modal y recargar
      document.getElementById("modal-overlayCreateEmploye").style.display = "none";
      window.location.reload();
    } catch (error) {
      console.error('Error al crear el Empleado:', error);
      const errorMsg = error.response?.data?.message || 'Hubo un problema al crear el Empleado.';
      alert(`Error: ${errorMsg}`);
    }
  };


  return (
    <div id="modal-overlayCreateEmploye">
      <form className="modal-bodyCreateEmploye" onSubmit={handleSubmit}>
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
              type="text"
              name="cedula"
              value={formData.cedula}
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
              <img src={preview} alt="Vista previa" className="preview-image" />
            ) : (
              <div className="upload-placeholder">
                <img src={addIMG} alt="icono agregar imagen" className="icon" />
                <p>Arrastra o sube la foto del empleado aquí.</p>
              </div>
            )}
          </label>

          <div className="status-container">
            <span>Estado:</span>
            <div className="status-buttons">
              <button
                type="button"
                className={`status ${formData.estado === 'Activo' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, estado: 'Activo' })}
              >
                Activo
              </button>
              <button
                type="button"
                className={`status ${formData.estado === 'Inactivo' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, estado: 'Inactivo' })}
              >
                Inactivo
              </button>
            </div>
          </div>

          <p id='p_addInstructor'>
            Documento de identidad:
            <button
              className='addInstructor'
              type="button"
              onClick={() => pdfInputRef.current.click()}
            >
              {/* Mostrar el nombre del archivo si hay uno cargado */}
              <img src={buttonEdit} alt="Subir documento" />
            </button>

            {/* Input oculto para subir PDF */}
            <input
              type="file"
              accept="application/pdf"
              ref={pdfInputRef}
              onChange={handlePDFChange}
              hidden
            />
          </p>
          {pdfFileName && <span className="pdf-file-name">{pdfFileName}</span>}

          <button type="submit" className="save-button">
            Guardar
          </button>
        </div>

        <div className="container_return_CreateEmploye">
          <h5>Volver</h5>
          <button type="button" onClick={() => setShowModalCreateEmployee(false)} className="closeModal"></button>
        </div>
      </form>
    </div>
  )
}
