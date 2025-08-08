import React, { useRef, useState } from 'react';
import "./UpdateEmploye.css";
import axiosInstance from "../../../../config/axiosInstance";
import { useModal } from "../../../../Context/ModalContext";
import buttonEdit from '../../../../assets/Icons/buttonEdit.png';

export const UpdateEmploye = ({ empleado }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...empleado });
  const pdfInputRef = useRef(null);
  const [documentoPDF, setDocumentoPDF] = useState(null);
  const [pdfFileName, setPdfFileName] = useState('');


  const { showDropdown, setShowDropdown } = useModal();

  const documentoLabels = {
    CedulaCiudadania: "Cédula de ciudadanía",
    CedulaExtranjeria: "Cédula de extranjería",
    TarjetaIdentidad: "Tarjeta de identidad",
    PPT: "Permiso por permanencia temporal",
    pendiente: "Pendiente",
  };

  const handlePDFChange = (e) => {
    const selectedPDF = e.target.files[0];
    if (!selectedPDF) return;

    setDocumentoPDF(selectedPDF); // Ya lo estás usando para enviarlo
    setPdfFileName(selectedPDF.name); // Guardar nombre del archivo
  };

  const closeModalUpdateEmploye = () => {
    document.getElementById("modal-overlayUpdateEmploye").style.display = "none";
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
      setIsEditing(true);
      return;
    }

    try {
      // Paso 1: Actualizar perfil (foto, datos)
      const formDataToSend = new FormData();
      for (const key in formData) {
        if (formData.hasOwnProperty(key)) {
          if (key === "foto_perfil" && formData[key] instanceof File) {
            formDataToSend.append(key, formData[key]);
          } else {
            formDataToSend.append(key, formData[key]);
          }
        }
      }

      const updateResponse = await axiosInstance.put(
        `/api/users/perfil/actualizar/${formData.ID}`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );

      // Paso 2: Validar documento si hay PDF
      if (documentoPDF) {
        const pdfData = new FormData();
        pdfData.append("pdf", documentoPDF);

        try {
          const ocrResponse = await axiosInstance.post(`/api/users/${formData.ID}/documento`, pdfData, {
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

      alert(updateResponse.data.message || "Perfil actualizado correctamente");
      setIsEditing(false);
      window.location.reload();
      document.getElementById("modal-overlayUpdateEmploye").style.display = "none";

    } catch (error) {
      console.error("Error al actualizar el perfil:", error.response?.data || error.message);
      alert("Hubo un error al actualizar el perfil.");
    }
  };


  const getImageSrc = (data) => {
    if (!data) return null;
    if (data.startsWith('/9j/')) {
      return `data:image/jpeg;base64,${data}`;
    } else if (data.startsWith('iVBORw0KGgo')) {
      return `data:image/png;base64,${data}`;
    } else {
      return `data:image/jpeg;base64,${data}`;
    }
  };

  return (
    <div id="modal-overlayUpdateEmploye" style={{ display: "flex" }}>
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

          <p id='p_addInstructor'>
            <strong style={{ fontSize: 16 }}>Documento de identidad:</strong>{" "}

            {isEditing ? (
              <>
                {pdfFileName && <span id="pdf-file-name">{pdfFileName}</span>}
                <button
                  className='addInstructor'
                  type="button"
                  onClick={() => pdfInputRef.current.click()}
                >
                  <img src={buttonEdit} alt="Subir documento" />
                </button>

                <input
                  type="file"
                  accept="application/pdf"
                  ref={pdfInputRef}
                  onChange={handlePDFChange}
                  hidden
                />
              </>
            ) : (
              <span className="valor-campo">{formData.pdf_documento || ""}</span>
            )}
          </p>


          <div className="campo-tipo-documento">
            <strong>Tipo documento:</strong>
            {isEditing ? (
              <div className="custom-dropdown">
                <div
                  className="selected-option"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  {documentoLabels[formData.tipoDocumento] || "Seleccionar tipo"}
                </div>
                {showDropdown && (
                  <ul className="dropdown-options">
                    {Object.entries(documentoLabels).map(([value, label]) => (
                      <li
                        key={value}
                        className={`dropdown-option ${formData.tipoDocumento === value ? "selected" : ""}`}
                        onClick={() => {
                          setFormData({ ...formData, tipoDocumento: value });
                          setShowDropdown(false);
                        }}
                      >
                        {label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <span className="valor-campo">
                {documentoLabels[formData.tipoDocumento] || "Sin especificar"}
              </span>
            )}
          </div>





          <p>
            <strong>Documento:</strong>{" "}
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
            id="imageUploadEmploye"
          />

          <label
            className={`upload-area-update ${!isEditing ? "read-only-border" : ""}`}
            htmlFor="imageUploadEmploye"
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
            onClick={closeModalUpdateEmploye}
            className="closeModal"
          ></button>
        </div>
      </form>
    </div>
  );
};