import { useRef, useState, useEffect } from 'react';
import './CreateEmploye.css';
import axiosInstance from '../../../../config/axiosInstance';
import fotoPerfilDefect from '../../../../assets/Icons/userDefect.png';
import { useModal } from '../../../../Context/ModalContext';
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faUser, faIdCard, faPhone, faEnvelope, faBuilding, faCamera, faFilePdf } from '@fortawesome/free-solid-svg-icons';

export const CreateEmploye = ({ onClose }) => {
  const fileInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const { setShowModalCreateEmployee } = useModal();
  
  const [preview, setPreview] = useState(null);
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    tipoDocumento: '',
    cedula: '',
    celular: '',
    email: '',
    estado: 'Inactivo',
    empresaId: '',
  });
  
  const [file, setFile] = useState(null);
  const [documentoPDF, setDocumentoPDF] = useState(null);
  const [pdfFileName, setPdfFileName] = useState('');
  const [empresas, setEmpresas] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const userSession = JSON.parse(localStorage.getItem("userSession") || sessionStorage.getItem("userSession") || '{}');
    const accountType = userSession.accountType;
    const adminStatus = accountType === 'Administrador' || accountType === 'Gestor';
    setIsAdmin(adminStatus);
    // console.log(accountType)

    if (adminStatus) {
      fetchEmpresas();
    }
  }, []);

  const fetchEmpresas = async () => {
    // console.log("A")
    try {
      setLoadingEmpresas(true);
      const response = await axiosInstance.get('/api/users/admin/empresas');
      const empresasData = response.data.empresas//  || response.data.data || response.data || [];
      // console.log(response.data)
      setEmpresas(empresasData);
    } catch (error) {
      // console.error("Error al obtener las empresas:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las empresas',
        confirmButtonColor: '#3085d6',
        theme: "bulma",
        customClass: { confirmButton: 'centered-swal-button' }
      });
      setEmpresas([]);
    } finally {
      setLoadingEmpresas(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.nombres.trim()) {
      errors.nombres = "Los nombres son requeridos";
    } else if (formData.nombres.trim().length < 2) {
      errors.nombres = "Los nombres deben tener al menos 2 caracteres";
    }

    if (!formData.apellidos.trim()) {
      errors.apellidos = "Los apellidos son requeridos";
    } else if (formData.apellidos.trim().length < 2) {
      errors.apellidos = "Los apellidos deben tener al menos 2 caracteres";
    }

    if (!formData.tipoDocumento) {
      errors.tipoDocumento = "Debe seleccionar un tipo de documento";
    }

    if (!formData.cedula.trim()) {
      errors.cedula = "El número de documento es requerido";
    } else if (!/^\d+$/.test(formData.cedula.trim())) {
      errors.cedula = "El número de documento debe contener solo números";
    } else if (formData.cedula.trim().length < 6) {
      errors.cedula = "El número de documento debe tener al menos 6 dígitos";
    }

    if (!formData.celular.trim()) {
      errors.celular = "El número de celular es requerido";
    } else if (!/^\d+$/.test(formData.celular.trim())) {
      errors.celular = "El número de celular debe contener solo números";
    } else if (formData.celular.trim().length < 10) {
      errors.celular = "El número de celular debe tener al menos 10 dígitos";
    }

    if (!formData.email.trim()) {
      errors.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Debe ingresar un email válido";
    }

    if (isAdmin && !formData.empresaId) {
      errors.empresaId = "Debe seleccionar una empresa";
    }

    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
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

  const handlePDFChange = (e) => {
    const selectedPDF = e.target.files[0];
    if (!selectedPDF) return;

    setDocumentoPDF(selectedPDF);
    setPdfFileName(selectedPDF.name);
  };

  const handleEstadoChange = (estado) => {
    setFormData({ ...formData, estado });
  };

  const closeModalCreateEmploye = () => {
    if (onClose) {
      onClose();
    }
    setShowModalCreateEmployee(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setErrors({});

    const data = new FormData();
    if (file) {
      data.append('foto_perfil', file);
    } else {
      const response = await fetch(fotoPerfilDefect);
      const blob = await response.blob();
      data.append('foto_perfil', blob, "fotoPerfilDefect.png");
    }

    data.append('nombres', formData.nombres);
    data.append('apellidos', formData.apellidos);
    data.append('tipoDocumento', formData.tipoDocumento);
    data.append('documento', formData.cedula);
    data.append('celular', formData.celular);
    data.append('email', formData.email);
    data.append('estado', formData.estado);

    try {
      let userSessionString = localStorage.getItem("userSession") || sessionStorage.getItem("userSession");
      if (!userSessionString) {
        Swal.fire({
          icon: 'error',
          title: 'Error de sesión',
          text: 'No se encontró la sesión de usuario.',
          confirmButtonColor: '#3085d6',
          theme: "bulma",
          customClass: { confirmButton: 'centered-swal-button' }
        });
        return;
      }
      
      const userSession = JSON.parse(userSessionString);
      const accountType = userSession.accountType;
      let response;
      
      if (accountType === 'Administrador' || accountType === 'Gestor') {
        if (!formData.empresaId) {
          Swal.fire({
            icon: 'warning',
            title: 'Empresa requerida',
            text: 'Por favor selecciona una empresa.',
            confirmButtonColor: '#3085d6',
            theme: "bulma",
            customClass: { confirmButton: 'centered-swal-button' }
          });
          return;
        }
        data.append('empresaId', formData.empresaId);
        
        response = await axiosInstance.post('/api/users/admin/empleados', data, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        const empresaId = userSession.empresa_ID;
        if (!empresaId) {
          Swal.fire({
            icon: 'error',
            title: 'Error de empresa',
            text: 'No se encontró el ID de la empresa en la sesión.',
            confirmButtonColor: '#3085d6',
            theme: "bulma",
            customClass: { confirmButton: 'centered-swal-button' }
          });
          return;
        }

        response = await axiosInstance.post(`/api/users/empresa/${empresaId}/empleados`, data, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      const empleadoId = response.data.empleado?.ID || response.data.id;
      
      await Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Empleado creado con éxito',
        confirmButtonColor: '#3085d6',
        timer: 3000,
        timerProgressBar: true,
        theme: "bulma",
        customClass: { confirmButton: 'centered-swal-button' }
      });

      if (documentoPDF && empleadoId) {
        const pdfForm = new FormData();
        pdfForm.append("pdf", documentoPDF);

        try {
          const ocrResponse = await axiosInstance.post(`/api/users/${empleadoId}/documento`, pdfForm, {
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
            text: 'Empleado creado, pero hubo un problema al procesar el documento PDF.',
            confirmButtonColor: '#3085d6',
            theme: "bulma",
            customClass: { confirmButton: 'centered-swal-button' }
          });
        }
      }

      closeModalCreateEmploye();
      
      if (window.refreshEmployesList) {
        window.refreshEmployesList();
      }

    } catch (error) {
      // console.error('Error al crear el Empleado:', error);
      const errorMsg = error.response?.data?.message || 'Hubo un problema al crear el Empleado.';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMsg,
        confirmButtonColor: '#3085d6',
        theme: "bulma",
        customClass: { confirmButton: 'centered-swal-button' }
      });
    }
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
    if (nombreParte.length <= maxLongitud) return nombre;
    return `${nombreParte.slice(0, maxLongitud)}... ${extension}`;
  };

  return (
    <div className="modal-overlay-create-employe">
      <div className="modal-container-create-employe">
        <div className="modal-header-create-employe">
          <div className="header-content-create-employe">
            <h2>
              <FontAwesomeIcon icon={faUser} className="header-icon-create-employe" />
              Crear Nuevo Empleado
            </h2>
            <button 
              type="button" 
              onClick={closeModalCreateEmploye}
              className="close-btn-create-employe"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>Volver</span>
            </button>
          </div>
        </div>

        <form className="modal-body-create-employe" onSubmit={handleSubmit}>
          <div className="modal-content-create-employe">
            {/* Columna izquierda - Información */}
            <div className="info-column-create-employe">
              <div className="form-section-create-employe">
                <h3 className="section-title-create-employe">Información Personal</h3>
                <div className="form-grid-create-employe">
                  <div className="input-group-create-employe">
                    <label className="input-label-create-employe">
                      <FontAwesomeIcon icon={faUser} />
                      Nombres
                    </label>
                    <input
                      type="text"
                      name="nombres"
                      value={formData.nombres}
                      onChange={handleInputChange}
                      className={`input-field-create-employe ${errors.nombres ? 'error' : ''}`}
                      placeholder="Ingrese los nombres"
                      required
                    />
                    {errors.nombres && <span className="error-message">{errors.nombres}</span>}
                  </div>

                  <div className="input-group-create-employe">
                    <label className="input-label-create-employe">
                      <FontAwesomeIcon icon={faUser} />
                      Apellidos
                    </label>
                    <input
                      type="text"
                      name="apellidos"
                      value={formData.apellidos}
                      onChange={handleInputChange}
                      className={`input-field-create-employe ${errors.apellidos ? 'error' : ''}`}
                      placeholder="Ingrese los apellidos"
                      required
                    />
                    {errors.apellidos && <span className="error-message">{errors.apellidos}</span>}
                  </div>

                  <div className="input-group-create-employe">
                    <label className="input-label-create-employe">
                      <FontAwesomeIcon icon={faIdCard} />
                      Tipo Documento
                    </label>
                    <select
                      name="tipoDocumento"
                      value={formData.tipoDocumento}
                      onChange={handleInputChange}
                      className={`input-field-create-employe ${errors.tipoDocumento ? 'error' : ''}`}
                      required
                    >
                      <option value="">Selecciona un tipo</option>
                      <option value="CedulaCiudadania">Cédula de Ciudadanía</option>
                      <option value="TarjetaIdentidad">Tarjeta de Identidad</option>
                      <option value="PPT">Pasaporte</option>
                      <option value="CedulaExtranjeria">Cédula Extranjera</option>
                    </select>
                    {errors.tipoDocumento && <span className="error-message">{errors.tipoDocumento}</span>}
                  </div>

                  <div className="input-group-create-employe">
                    <label className="input-label-create-employe">
                      <FontAwesomeIcon icon={faIdCard} />
                      Documento
                    </label>
                    <input
                      type="text"
                      name="cedula"
                      value={formData.cedula}
                      onChange={handleInputChange}
                      className={`input-field-create-employe ${errors.cedula ? 'error' : ''}`}
                      placeholder="Ingrese el documento"
                      required
                    />
                    {errors.cedula && <span className="error-message">{errors.cedula}</span>}
                  </div>

                  <div className="input-group-create-employe">
                    <label className="input-label-create-employe">
                      <FontAwesomeIcon icon={faPhone} />
                      Celular
                    </label>
                    <input
                      type="text"
                      name="celular"
                      value={formData.celular}
                      onChange={handleInputChange}
                      className={`input-field-create-employe ${errors.celular ? 'error' : ''}`}
                      placeholder="Ingrese el celular"
                      required
                    />
                    {errors.celular && <span className="error-message">{errors.celular}</span>}
                  </div>

                  <div className="input-group-create-employe">
                    <label className="input-label-create-employe">
                      <FontAwesomeIcon icon={faEnvelope} />
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`input-field-create-employe ${errors.email ? 'error' : ''}`}
                      placeholder="Ingrese el email"
                      required
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>

                  {isAdmin && (
                    <div className="input-group-create-employe">
                      <label className="input-label-create-employe">
                        <FontAwesomeIcon icon={faBuilding} />
                        Empresa
                      </label>
                      {loadingEmpresas ? (
                        <div className="loading-empresas">Cargando empresas...</div>
                      ) : (
                        <select
                          name="empresaId"
                          value={formData.empresaId}
                          onChange={handleInputChange}
                          className={`input-field-create-employe ${errors.empresaId ? 'error' : ''}`}
                          required
                        >
                          <option value="">Selecciona una empresa</option>
                          {empresas.map((empresa) => (
                            <option key={empresa.ID || empresa.id} value={empresa.ID || empresa.id}>
                              {empresa.nombre_empresa || empresa.nombre || empresa.razon_social}
                            </option>
                          ))}
                        </select>
                      )}
                      {errors.empresaId && <span className="error-message">{errors.empresaId}</span>}
                    </div>
                  )}

                  <div className="input-group-create-employe">
                    <label className="input-label-create-employe">Documento PDF</label>
                    <div className="pdf-upload-section">
                      <input
                        type="file"
                        accept="application/pdf"
                        ref={pdfInputRef}
                        onChange={handlePDFChange}
                        className="file-input-create-employe"
                        id="pdfUploadEmploye"
                      />
                      <label
                        className="pdf-upload-label"
                        htmlFor="pdfUploadEmploye"
                      >
                        <FontAwesomeIcon icon={faFilePdf} />
                        {pdfFileName ? (
                          <span className="pdf-file-name">
                            {truncarNombreArchivo(pdfFileName)}
                          </span>
                        ) : (
                          <span>Subir documento PDF</span>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="input-group-create-employe">
                    <label className="input-label-create-employe">Estado</label>
                    <div className="status-buttons-create-employe">
                      {["Activo", "Inactivo"].map((estado) => {
                        const isSelected = (formData.estado || "").toLowerCase() === estado.toLowerCase();
                        return (
                          <button
                            key={estado}
                            type="button"
                            className={`status-btn-create-employe ${isSelected ? "active" : ""}`}
                            onClick={() => handleEstadoChange(estado)}
                          >
                            <span className="status-dot-create-employe"></span>
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
            <div className="image-column-create-employe">
              <div className="image-section-create-employe">
                <div className="image-container-create-employe">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    id="imageUploadCreateEmploye"
                    className="file-input-create-employe"
                  />
                  <label
                    className="image-upload-create-employe"
                    htmlFor="imageUploadCreateEmploye"
                  >
                    {preview ? (
                      <img
                        src={preview}
                        alt="Vista previa"
                        className="profile-image-create-employe"
                      />
                    ) : (
                      <div className="image-placeholder-create-employe">
                        <FontAwesomeIcon icon={faCamera} className="placeholder-icon-create-employe" />
                        <span>Haz clic para subir imagen</span>
                      </div>
                    )}
                    <div className="upload-overlay-create-employe">
                      <FontAwesomeIcon icon={faCamera} />
                      <span>Cambiar imagen</span>
                    </div>
                  </label>
                </div>
                
                <div className="image-info-create-employe">
                  <p>Recomendado: Imagen cuadrada 500x500px</p>
                </div>
              </div>

              <button type="submit" className="submit-btn-create-employe">
                <FontAwesomeIcon icon={faUser} />
                <span>Crear Empleado</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};