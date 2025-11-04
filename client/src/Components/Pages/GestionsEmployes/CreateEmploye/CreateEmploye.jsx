import { useRef, useState, useEffect } from 'react';
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
    tipoDocumento: '',
    cedula: '',
    celular: '',
    email: '',
    estado: 'Inactivo', // Valor predeterminado
    empresaId: '', // Para administradores
  });
  const [file, setFile] = useState(null);
  const pdfInputRef = useRef(null);
  const [documentoPDF, setDocumentoPDF] = useState(null);
  const [pdfFileName, setPdfFileName] = useState('');
  const [empresas, setEmpresas] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [errors, setErrors] = useState({});



  // Obtener información del usuario y empresas
  useEffect(() => {
  const userSession = JSON.parse(localStorage.getItem("userSession") || sessionStorage.getItem("userSession") || '{}');
  const accountType = userSession.accountType;
  const adminStatus = accountType === 'Administrador' || accountType === 'Gestor';
  setIsAdmin(adminStatus);

  if (adminStatus) {
    fetchEmpresas();
  }
}, []);

const [loadingEmpresas, setLoadingEmpresas] = useState(false);

const fetchEmpresas = async () => {
  try {
    setLoadingEmpresas(true);
    const response = await axiosInstance.get('/api/users/admin/empresas');
    console.log('Respuesta de empresas:', response.data);
    
    const empresasData = response.data.empresas || response.data.data || response.data || [];
    setEmpresas(Array.isArray(empresasData) ? empresasData : []);
  } catch (error) {
    console.error("Error al obtener las empresas:", error);
    setEmpresas([]);
  } finally {
    setLoadingEmpresas(false);
  }
};

  // Validaciones
  const validateForm = () => {
    const errors = {};

    // Validar nombres
    if (!formData.nombres.trim()) {
      errors.nombres = "Los nombres son requeridos";
    } else if (formData.nombres.trim().length < 2) {
      errors.nombres = "Los nombres deben tener al menos 2 caracteres";
    }

    // Validar apellidos
    if (!formData.apellidos.trim()) {
      errors.apellidos = "Los apellidos son requeridos";
    } else if (formData.apellidos.trim().length < 2) {
      errors.apellidos = "Los apellidos deben tener al menos 2 caracteres";
    }

    // Validar tipo de documento
    if (!formData.tipoDocumento) {
      errors.tipoDocumento = "Debe seleccionar un tipo de documento";
    }

    // Validar cédula (solo números)
    if (!formData.cedula.trim()) {
      errors.cedula = "El número de documento es requerido";
    } else if (!/^\d+$/.test(formData.cedula.trim())) {
      errors.cedula = "El número de documento debe contener solo números";
    } else if (formData.cedula.trim().length < 6) {
      errors.cedula = "El número de documento debe tener al menos 6 dígitos";
    }

    // Validar celular (solo números)
    if (!formData.celular.trim()) {
      errors.celular = "El número de celular es requerido";
    } else if (!/^\d+$/.test(formData.celular.trim())) {
      errors.celular = "El número de celular debe contener solo números";
    } else if (formData.celular.trim().length < 10) {
      errors.celular = "El número de celular debe tener al menos 10 dígitos";
    }

    // Validar email
    if (!formData.email.trim()) {
      errors.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Debe ingresar un email válido";
    }

    // Validar empresa (solo para administradores)
    if (isAdmin && !formData.empresaId) {
      errors.empresaId = "Debe seleccionar una empresa";
    }

    return errors;
  };

  // Manejar cambios en los campos del formulario
  // Manejar cambios en los campos del formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Campo cambiado: ${name} = ${value}`); // ← Para debug
    setFormData({ ...formData, [name]: value });
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
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
    
    // Validar formulario
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Limpiar errores si la validación es exitosa
    setErrors({});

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
    data.append('tipoDocumento', formData.tipoDocumento);
    data.append('documento', formData.cedula);
    data.append('celular', formData.celular);
    data.append('email', formData.email);
    data.append('estado', formData.estado);

    try {
      // Obtener información de la sesión
      let userSessionString = localStorage.getItem("userSession") || sessionStorage.getItem("userSession");
      if (!userSessionString) {
        alert("No se encontró la sesión de usuario.");
        return;
      }
      const userSession = JSON.parse(userSessionString);
      const accountType = userSession.accountType;
      
      let response;
      
      if (accountType === 'Administrador' || accountType === 'Gestor') {
        // Para administradores: usar la nueva ruta con empresa seleccionada
        if (!formData.empresaId) {
          alert("Por favor selecciona una empresa.");
          return;
        }
        data.append('empresaId', formData.empresaId);
        
        response = await axiosInstance.post('/api/users/admin/empleados', data, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Para gestores: usar la ruta original
      const empresaId = userSession.empresa_ID;
      if (!empresaId) {
        alert("No se encontró el ID de la empresa en la sesión.");
        return;
      }

        response = await axiosInstance.post(`/api/users/empresa/${empresaId}/empleados`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      }

      const empleadoId = response.data.empleado?.ID || response.data.id;
      alert('Empleado creado con éxito ');

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
              minLength="2"
              className={errors.nombres ? 'error' : ''}
            />
            {errors.nombres && <span className="error-message">{errors.nombres}</span>}
          </label>
          <label>
            Apellidos
            <input
              type="text"
              name="apellidos"
              value={formData.apellidos}
              onChange={handleInputChange}
              required
              minLength="2"
              className={errors.apellidos ? 'error' : ''}
            />
            {errors.apellidos && <span className="error-message">{errors.apellidos}</span>}
          </label>
         <label>
            Tipo de Documento
            <select 
              className={`TipoDocumento ${errors.tipoDocumento ? 'error' : ''}`}
                name="tipoDocumento"
                value={formData.tipoDocumento}
                onChange={handleInputChange}
                required
              >
              <option className="option" value=""> Selecciona un tipo </option>
              <option className="option" value="CedulaCiudadania">Cédula de Ciudadanía</option>
              <option className="option" value="TarjetaIdentidad">Tarjeta de Identidad</option>
              <option className="option" value="PPT">Pasaporte</option>
              <option className="option" value="CedulaExtranjeria">Cédula Extranjera</option>
            </select>
            {errors.tipoDocumento && <span className="error-message">{errors.tipoDocumento}</span>}
          </label>
          <label>
            Cédula
            <input
              type="text"
              name="cedula"
              value={formData.cedula}
              onChange={handleInputChange}
              required
              pattern="[0-9]+"
              minLength="6"
              className={errors.cedula ? 'error' : ''}
            />
            {errors.cedula && <span className="error-message">{errors.cedula}</span>}
          </label>
          <label>
            Celular
            <input
              type="text"
              name="celular"
              value={formData.celular}
              onChange={handleInputChange}
              required
              pattern="[0-9]+"
              minLength="10"
              className={errors.celular ? 'error' : ''}
            />
            {errors.celular && <span className="error-message">{errors.celular}</span>}
          </label>
          <label>
            Email
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </label>
          
          {isAdmin && (
  <label>
    Empresa
    {loadingEmpresas ? (
      <select disabled>
        <option>Cargando empresas...</option>
      </select>
    ) : (
      <select
        name="empresaId"
        value={formData.empresaId}
        onChange={handleInputChange}
        required
        className={`empresa-select ${errors.empresaId ? 'error' : ''}`}
      >
        <option value="">Selecciona una empresa</option>
        {empresas.map((empresa) => (
          <option key={empresa.ID || empresa.id} value={empresa.ID || empresa.id}>
            {empresa.nombre_empresa || empresa.nombre || empresa.razon_social} - {empresa.NIT || empresa.nit}
          </option>
        ))}
      </select>
    )}
    {errors.empresaId && <span className="error-message">{errors.empresaId}</span>}
    
    {/* Debug info */}
    <small style={{color: '#666', fontSize: '12px', display: 'block', marginTop: '5px'}}>
      {empresas.length} empresas cargadas | Seleccionada: {formData.empresaId || 'Ninguna'}
    </small>
  </label>
)}
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
          <button
            type="button"
            onClick={() => setShowModalCreateEmployee(false)}
            className="closeModal"
          ></button>
        </div>
      </form>
    </div>
  )
}
