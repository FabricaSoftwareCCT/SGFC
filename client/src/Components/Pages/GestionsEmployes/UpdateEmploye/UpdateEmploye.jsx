import { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import "./UpdateEmploye.css";
import axiosInstance from "../../../../config/axiosInstance";
import { useModal } from "../../../../Context/ModalContext";
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faUser, faIdCard, faPhone, faEnvelope, faCamera, faBook } from '@fortawesome/free-solid-svg-icons';

export const UpdateEmploye = ({ empleado, onClose, isOpen = true }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...empleado });
  const pdfInputRef = useRef(null);
  const [documentoPDF, setDocumentoPDF] = useState(null);
  const [pdfFileName, setPdfFileName] = useState('');

  const { showDropdown, setShowDropdown } = useModal();

  // Actualizar formData cuando cambie el empleado
  useEffect(() => {
    if (empleado) {
      setFormData({ ...empleado });
      setIsEditing(false);
      setDocumentoPDF(null);
      setPdfFileName('');
    }
  }, [empleado]);

  const documentoLabels = {
    CedulaCiudadania: "Cédula de ciudadanía",
    CedulaExtranjeria: "Cédula de extranjería",
    TarjetaIdentidad: "Tarjeta de identidad",
    PPT: "Permiso por permanencia temporal",
    pendiente: "Pendiente",
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

  const handlePDFChange = (e) => {
    const selectedPDF = e.target.files[0];
    if (!selectedPDF) return;

    setDocumentoPDF(selectedPDF);
    setPdfFileName(selectedPDF.name);
  };

  const closeModalUpdateEmploye = () => {
    // Resetear todos los estados
    setShowDropdown(false);
    setIsEditing(false);
    setDocumentoPDF(null);
    setPdfFileName('');
    
    // Llamar al callback onClose
    if (onClose && typeof onClose === 'function') {
      onClose();
    }
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

  const validateFields = () => {
    const errors = [];
    
    if (!formData.nombres || formData.nombres.trim() === '') {
      errors.push('Los nombres son requeridos');
    } else if (formData.nombres.trim().length < 2) {
      errors.push('Los nombres deben tener al menos 2 caracteres');
    }
    
    if (!formData.apellidos || formData.apellidos.trim() === '') {
      errors.push('Los apellidos son requeridos');
    } else if (formData.apellidos.trim().length < 2) {
      errors.push('Los apellidos deben tener al menos 2 caracteres');
    }
    
    if (!formData.documento || formData.documento.trim() === '') {
      errors.push('El número de documento es requerido');
    } else if (!/^\d+$/.test(formData.documento.trim())) {
      errors.push('El número de documento debe contener solo números');
    } else if (formData.documento.trim().length < 6) {
      errors.push('El número de documento debe tener al menos 6 dígitos');
    }
    
    if (!formData.celular || formData.celular.trim() === '') {
      errors.push('El número de celular es requerido');
    } else if (!/^\d+$/.test(formData.celular.trim())) {
      errors.push('El número de celular debe contener solo números');
    } else if (formData.celular.trim().length < 10) {
      errors.push('El número de celular debe tener al menos 10 dígitos');
    }
    
    if (!formData.email || formData.email.trim() === '') {
      errors.push('El email es requerido');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.push('Debe ingresar un email válido');
    }
    
    return errors;
  };

  const navigate = useNavigate();

  const handleCourse = () => {
    // console.log('ID del empleado:', formData.ID);
    // console.log('Navegando a mis cursos...');
    
    closeModalUpdateEmploye();
    navigate('/Cursos/MisCursos', { 
      state: { 
        empleadoId: formData.ID,
        empleadoNombre: formData.nombres 
      } 
    });
  }

  const handleButtonClick = async (e) => {
    e.preventDefault();

    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    const errors = validateFields();
    if (errors.length > 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        html: `
          <div style="text-align: left;">
            <p>Por favor corrija los siguientes errores:</p>
            <ul style="margin-top: 10px; padding-left: 20px;">
              ${errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
          </div>
        `,
        confirmButtonColor: '#3085d6',
        theme: "bulma",
        customClass: { confirmButton: 'centered-swal-button' }
      });
      return;
    }

    try {
      const formDataToSend = new FormData();
      
      const campos = [
        'nombres', 'apellidos', 'tipoDocumento', 'documento', 
        'celular', 'email', 'estado', 'ID'
      ];
      
      campos.forEach(campo => {
        if (formData[campo] !== undefined && formData[campo] !== null) {
          formDataToSend.append(campo, formData[campo]);
        }
      });

      if (formData.foto_perfil instanceof File) {
        formDataToSend.append('foto_perfil', formData.foto_perfil);
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

      if (documentoPDF) {
        const pdfData = new FormData();
        pdfData.append("pdf", documentoPDF);

        try {
          const ocrResponse = await axiosInstance.post(`/api/users/${formData.ID}/documento`, pdfData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          await Swal.fire({
            icon: 'info',
            title: 'Documento procesado',
            html: `
              <p><strong>Tipo de documento:</strong> ${ocrResponse.data.tipoDetectado}</p>
              <p><strong>Número:</strong> ${ocrResponse.data.documento}</p>
            `,
            confirmButtonColor: '#3085d6',
            theme: "bulma",
            customClass: { confirmButton: 'centered-swal-button' }
          });
        } catch (ocrError) {
          // console.error("Error al procesar documento:", ocrError);
          await Swal.fire({
            icon: 'warning',
            title: 'Procesamiento de documento',
            text: 'Empleado actualizado, pero hubo un problema al procesar el documento PDF.',
            confirmButtonColor: '#3085d6',
            theme: "bulma",
            customClass: { confirmButton: 'centered-swal-button' }
          });
        }
      }

      await Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: updateResponse.data.message || "Perfil actualizado correctamente",
        confirmButtonColor: '#3085d6',
        timer: 3000,
        timerProgressBar: true,
        theme: "bulma",
        customClass: { confirmButton: 'centered-swal-button' }
      });
      setIsEditing(false);
      
      if (updateResponse.data.empleado) {
        setFormData({ ...updateResponse.data.empleado });
        if (window.updateSelectedEmploye) {
          window.updateSelectedEmploye(updateResponse.data.empleado);
        }
      }
      
      if (window.refreshEmployesList) {
        window.refreshEmployesList();
      }
      
      closeModalUpdateEmploye();

    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: "Hubo un error al actualizar el perfil. " + (error.response?.data?.message || error.message),
        confirmButtonColor: '#3085d6',
        theme: "bulma",
        customClass: { confirmButton: 'centered-swal-button' }
      });
    }
  };

  const getImageSrc = (data) => {
    if (!data) return '/default-profile.png';
    if (data.startsWith('/9j/')) {
      return `data:image/jpeg;base64,${data}`;
    } else if (data.startsWith('iVBORw0KGgo')) {
      return `data:image/png;base64,${data}`;
    } else {
      return `data:image/jpeg;base64,${data}`;
    }
  };

  if (!empleado || !isOpen) return null;

  return (
    <div id="modal-overlayUpdateEmploye" className="modal-overlay-employe">
      <div className="modal-container-employe">
        <div className="modal-header-employe">
          <div className="header-content-employe">
            <h2>
              <FontAwesomeIcon icon={faUser} className="header-icon-employe" />
              Perfil del Empleado
            </h2>
            <button 
              type="button" 
              onClick={closeModalUpdateEmploye}
              className="close-btn-employe"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>Volver</span>
            </button>
          </div>
        </div>

        <form className="modal-body-employe" onSubmit={handleButtonClick}>
          <div className="modal-content-employe">
            {/* Columna izquierda - Información */}
            <div className="info-column-employe">
              <div className="form-section-employe">
                <h3 className="section-title-employe">Información Personal</h3>
                <div className="form-grid-employe">
                  <div className="input-group-employe">
                    <label className="input-label-employe">
                      <FontAwesomeIcon icon={faUser} />
                      Nombres
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="nombres"
                        value={formData.nombres || ""}
                        onChange={handleChange}
                        className="input-field-employe"
                        placeholder="Ingrese los nombres"
                      />
                    ) : (
                      <div className="display-field-employe">
                        {formData.nombres || "No especificado"}
                      </div>
                    )}
                  </div>

                  <div className="input-group-employe">
                    <label className="input-label-employe">
                      <FontAwesomeIcon icon={faUser} />
                      Apellidos
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="apellidos"
                        value={formData.apellidos || ""}
                        onChange={handleChange}
                        className="input-field-employe"
                        placeholder="Ingrese los apellidos"
                      />
                    ) : (
                      <div className="display-field-employe">
                        {formData.apellidos || "No especificado"}
                      </div>
                    )}
                  </div>

                  <div className="input-group-employe">
                    <label className="input-label-employe">
                      <FontAwesomeIcon icon={faIdCard} />
                      Tipo Documento
                    </label>
                    {isEditing ? (
                      <div className="custom-dropdown-employe">
                        <div
                          className="selected-option-employe"
                          onClick={() => setShowDropdown(!showDropdown)}
                        >
                          {documentoLabels[formData.tipoDocumento] || "Seleccionar tipo"}
                        </div>
                        {showDropdown && (
                          <ul className="dropdown-options-employe">
                            {Object.entries(documentoLabels).map(([value, label]) => (
                              <li
                                key={value}
                                className={`dropdown-option-employe ${formData.tipoDocumento === value ? "selected" : ""}`}
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
                      <div className="display-field-employe">
                        {documentoLabels[formData.tipoDocumento] || "No especificado"}
                      </div>
                    )}
                  </div>

                  <div className="input-group-employe">
                    <label className="input-label-employe">
                      <FontAwesomeIcon icon={faIdCard} />
                      Documento
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="documento"
                        value={formData.documento || ""}
                        onChange={handleChange}
                        className="input-field-employe"
                        placeholder="Ingrese el documento"
                      />
                    ) : (
                      <div className="display-field-employe">
                        {formData.documento || "No especificado"}
                      </div>
                    )}
                  </div>

                  <div className="input-group-employe">
                    <label className="input-label-employe">
                      <FontAwesomeIcon icon={faPhone} />
                      Celular
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="celular"
                        value={formData.celular || ""}
                        onChange={handleChange}
                        className="input-field-employe"
                        placeholder="Ingrese el celular"
                      />
                    ) : (
                      <div className="display-field-employe">
                        {formData.celular || "No especificado"}
                      </div>
                    )}
                  </div>

                  <div className="input-group-employe">
                    <label className="input-label-employe">
                      <FontAwesomeIcon icon={faEnvelope} />
                      Email
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email || ""}
                        onChange={handleChange}
                        className="input-field-employe"
                        placeholder="Ingrese el email"
                      />
                    ) : (
                      <div className="display-field-employe">
                        {formData.email || "No especificado"}
                      </div>
                    )}
                  </div>

                  <div className="input-group-employe">
                    <label className="input-label-employe">Documento PDF</label>
                    {isEditing ? (
                      <div className="pdf-upload-section-employe">
                        <input
                          type="file"
                          accept="application/pdf"
                          ref={pdfInputRef}
                          onChange={handlePDFChange}
                          className="file-input-employe"
                          id="pdfUploadEmploye"
                        />
                        <label
                          className="pdf-upload-label-employe"
                          htmlFor="pdfUploadEmploye"
                        >
                          {pdfFileName ? (
                            <span className="pdf-file-name-employe">
                              {truncarNombreArchivo(pdfFileName)}
                            </span>
                          ) : (
                            <span className="pdf-placeholder-employe">
                              Subir documento PDF
                            </span>
                          )}
                        </label>
                      </div>
                    ) : (
                      <div className="display-field-employe">
                        {formData.pdf_documento || "No hay documento subido"}
                      </div>
                    )}
                  </div>

                  <div className="input-group-employe">
                    <label className="input-label-employe">Estado</label>
                    {isEditing ? (
                      <div className="status-buttons-employe">
                        {["Activo", "Inactivo"].map((estado) => {
                          const isSelected = (formData.estado || "").toLowerCase() === estado.toLowerCase();
                          return (
                            <button
                              key={estado}
                              type="button"
                              className={`status-btn-employe ${isSelected ? "active" : ""}`}
                              onClick={() => handleEstadoChange(estado)}
                            >
                              <span className="status-dot-employe"></span>
                              {estado}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className={`status-display-employe ${formData.estado?.toLowerCase()}`}>
                        <span className="status-dot-employe"></span>
                        {formData.estado || "No especificado"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha - Imagen y botones */}
            <div className="image-column-employe">
              <div className="image-section-employe">
                <div className="image-container-employe">
                  {isEditing ? (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        id="imageUploadEmploye"
                        className="file-input-employe"
                      />
                      <label
                        className="image-upload-employe editable"
                        htmlFor="imageUploadEmploye"
                      >
                        {formData.foto_perfil instanceof File ? (
                          <img
                            src={URL.createObjectURL(formData.foto_perfil)}
                            alt="Vista previa"
                            className="profile-image-employe"
                            onError={(e) => {
                              e.target.src = '/default-profile.png';
                            }}
                          />
                        ) : formData.foto_perfil ? (
                          <img
                            src={getImageSrc(formData.foto_perfil)}
                            alt="Foto de perfil"
                            className="profile-image-employe"
                            onError={(e) => {
                              e.target.src = '/default-profile.png';
                            }}
                          />
                        ) : (
                          <div className="image-placeholder-employe">
                            <FontAwesomeIcon icon={faCamera} className="placeholder-icon-employe" />
                            <span>Haz clic para subir imagen</span>
                          </div>
                        )}
                        <div className="upload-overlay-employe">
                          <FontAwesomeIcon icon={faCamera} />
                          <span>Cambiar imagen</span>
                        </div>
                      </label>
                    </>
                  ) : (
                    <div className="image-display-employe">
                      {formData.foto_perfil ? (
                        <img
                          src={getImageSrc(formData.foto_perfil)}
                          alt="Foto de perfil"
                          className="profile-image-employe"
                          onError={(e) => {
                            e.target.src = '/default-profile.png';
                          }}
                        />
                      ) : (
                        <div className="image-placeholder-employe">
                          <FontAwesomeIcon icon={faUser} className="placeholder-icon-employe" />
                          <span>Sin imagen</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {!isEditing && (
                  <div className="image-info-employe">
                    <p>Activa el modo edición para cambiar la imagen</p>
                  </div>
                )}
              </div>

              <div className="buttons-section-employe">
                <button type="submit" className="submit-btn-employe">
                  {isEditing ? (
                    <>
                      <FontAwesomeIcon icon={faUser} />
                      <span>Guardar Cambios</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faUser} />
                      <span>Editar Perfil</span>
                    </>
                  )}
                </button>

                <button 
                  type="button" 
                  className="course-btn-employe"
                  onClick={handleCourse}
                >
                  <FontAwesomeIcon icon={faBook} />
                  <span>Ver Cursos</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

UpdateEmploye.propTypes = {
  empleado: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired, // ✅ Ahora es requerido
  isOpen: PropTypes.bool
};