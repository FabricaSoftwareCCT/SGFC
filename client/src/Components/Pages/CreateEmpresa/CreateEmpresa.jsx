import { useState, useEffect } from "react";
import "./CreateEmpresa.css";
import axiosInstance from '../../../config/axiosInstance';
import { 
  validateEmail, 
  validateNumber, 
  validateText, 
  createMensajeError, 
  validateNIT, 
  validateAddress 
} from '../../../utils/Validators/formValidator';
import Swal from "sweetalert2";
import 'sweetalert2/themes/bulma.css'

export const CreateEmpresa = ({ onClose, onCompanyCreated }) => {
  // Estado para datos del Manager (izquierda)
  const [managerData, setManagerData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });

  // Estado para datos de la Empresa (derecha)
  const [empresaData, setEmpresaData] = useState({
    nombre_empresa: "",
    NIT: "",
    categoria: "",
    direccion: "",
    telefono: "",
    descripcion: "",
    email_empresa: "",
    departamento_ID: "",
    ciudad_ID: "",
    img_empresa: "",
    estado: true,
    sitio_web: {
      facebook: "",
      instagram: "",
      linkedin: "",
      twitter: "",
      web: ""
    }
  });

  const [departamentos, setDepartamentos] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    number: false,
    specialChar: false
  });

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Cargar departamentos al iniciar
  useEffect(() => {
    const cargarDepartamentos = async () => {
      try {
        const departamentosRes = await axiosInstance.get('/api/ubicaciones/departamentos');
        const departamentosData = Array.isArray(departamentosRes.data) ? departamentosRes.data : departamentosRes.data.data || [];
        setDepartamentos(departamentosData);
      } catch (error) {
        console.error('Error al cargar departamentos:', error);
      }
    };
    cargarDepartamentos();
  }, []);

  // Cargar ciudades cuando se selecciona un departamento
  useEffect(() => {
    const cargarCiudades = async () => {
      if (empresaData.departamento_ID) {
        try {
          const ciudadesRes = await axiosInstance.get(`/api/ubicaciones/departamentos/${empresaData.departamento_ID}/ciudades`);
          const ciudadesData = Array.isArray(ciudadesRes.data) ? ciudadesRes.data : ciudadesRes.data.data || [];
          setCiudades(ciudadesData);
        } catch (error) {
          console.error('Error al cargar ciudades:', error);
          setCiudades([]);
        }
      } else {
        setCiudades([]);
        setEmpresaData(prev => ({ ...prev, ciudad_ID: "" }));
      }
    };
    cargarCiudades();
  }, [empresaData.departamento_ID]);

  // Validar requisitos de contraseña
  useEffect(() => {
    setPasswordRequirements({
      length: managerData.password.length >= 8,
      uppercase: /[A-Z]/.test(managerData.password),
      number: /\d/.test(managerData.password),
      specialChar: /[@$!%*?&]/.test(managerData.password)
    });
  }, [managerData.password]);

  // Handlers para Manager
  const handleManagerChange = (e) => {
    const { name, value } = e.target;
    setManagerData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handlers para Empresa - Campos principales
  const handleEmpresaChange = (e) => {
    const { name, value } = e.target;
    setEmpresaData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler para campos del sitio web
  const handleSitioWebChange = (platform, value) => {
    setEmpresaData(prev => ({
      ...prev,
      sitio_web: {
        ...prev.sitio_web,
        [platform]: value
      }
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(",")[1];
      setEmpresaData(prev => ({
        ...prev,
        img_empresa: base64
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validaciones del Manager
      const managerErrors = {
        email: validateEmail(managerData.email),
        password: !managerData.password ? "La contraseña es obligatoria" : "",
        confirmPassword: managerData.password !== managerData.confirmPassword ? "Las contraseñas no coinciden" : ""
      };

      // Validar requisitos de contraseña
      if (
        !passwordRequirements.length ||
        !passwordRequirements.uppercase ||
        !passwordRequirements.number ||
        !passwordRequirements.specialChar
      ) {
        alert("La contraseña debe cumplir con todos los requisitos.");
        setLoading(false);
        return;
      }

      // Validaciones de la Empresa
      const empresaErrors = {
        nombre_empresa: validateText(empresaData.nombre_empresa),
        direccion: validateAddress(empresaData.direccion),
        telefono: validateNumber(empresaData.telefono),
        email_empresa: validateEmail(empresaData.email_empresa),
        NIT: validateNIT(empresaData.NIT),
        categoria: empresaData.categoria ? "" : "La categoría es obligatoria",
        departamento_ID: empresaData.departamento_ID ? "" : "El departamento es obligatorio",
        ciudad_ID: empresaData.ciudad_ID ? "" : "La ciudad es obligatoria",
        descripcion: empresaData.descripcion ? "" : "La descripción es obligatoria"
      };

      // Combinar errores
      const allErrors = { ...managerErrors, ...empresaErrors };
      const hastErrors = await createMensajeError(allErrors);
      
      if (hastErrors != null) {
        await Swal.fire({
          icon: 'error',
          title: 'Error de validación',
          html: hastErrors,
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#d33',
          theme: "bulma", // Añadido tema Bulma
          customClass: {
            confirmButton: 'centered-swal-button'
          }
        });
        setLoading(false);
        return;
      }

      const userResponse = await fetch("http://localhost:3001/api/users/createUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: managerData.email,
          password: managerData.password,
          accountType: "Empresa"
        }),
      });

      const userData = await userResponse.json();
      console.log(userData);

      if (!userResponse.ok) {
        throw new Error(userData.message || "Error al crear el usuario Manager");
      }

      // PASO 2: Crear la empresa con todos los datos
      const empresaPayload = {
        nombre_empresa: empresaData.nombre_empresa.trim(),
        NIT: empresaData.NIT,
        categoria: empresaData.categoria,
        direccion: empresaData.direccion.trim(),
        telefono: empresaData.telefono,
        descripcion: empresaData.descripcion.trim(),
        email_empresa: empresaData.email_empresa,
        departamento_ID: empresaData.departamento_ID,
        ciudad_ID: empresaData.ciudad_ID,
        img_empresa: empresaData.img_empresa,
        estado: true,
        sitio_web: {
          ...empresaData.sitio_web
        }
      };

      // Limpiar sitios web vacíos
      Object.keys(empresaPayload.sitio_web).forEach(key => {
        if (!empresaPayload.sitio_web[key]) {
          delete empresaPayload.sitio_web[key];
        }
      });

      const encodeEmail = encodeURIComponent(managerData.email)

      const empresaResponse = await axiosInstance.post(`/api/users/empresas/${encodeEmail}`, empresaPayload);
      
      
      // Notificar al componente padre
      if (onCompanyCreated) {
        onCompanyCreated(empresaResponse.data.empresa);
      }
      
            await Swal.fire({
        icon: 'success',
        title: 'Empresa creada',
        text: 'Empresa creada con éxito. El Manager recibirá un email de verificación.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#00843d',
        theme: "bulma", // Añadido tema Bulma
        customClass: {
          confirmButton: 'centered-swal-button'
        }
      });

      onClose(); // Cerrar el modal después de guardar
      
    } catch (error) {
      console.error("Error al crear empresa y manager:", error);
      
      let errorMessage = "Hubo un error al crear la empresa";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.join(', ');
      }
      
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#d33',
        theme: "bulma", // Añadido tema Bulma
        customClass: {
          confirmButton: 'centered-swal-button'
        }
      });

    } finally {
      setLoading(false);
    }
  };

  // Cerrar modal al hacer clic fuera
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Cerrar modal con tecla ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="modal-overlay-dual" onClick={handleOverlayClick}>
      <div className="modal-content-dual">
        <div className="modal-header-dual">
          <h2>Crear Nueva Empresa con Manager</h2>
          <button 
            className="close-button-dual"
            onClick={onClose}
            type="button"
            aria-label="Cerrar modal"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="dual-form-container">
          {/* Sección Izquierda - Datos Manager */}
          <div className="form-section manager-section">
            <div className="form-grid">
              <div className="form-group-dual">
                <label htmlFor="email">Email del Manager *</label>
                <input 
                  type="email" 
                  id="email"
                  name="email"
                  placeholder="ejemplo@empresa.com" 
                  value={managerData.email}
                  onChange={handleManagerChange}
                  required
                />
              </div>

              <div className="form-group-dual">
                <label htmlFor="password">Contraseña *</label>
                <div className="password-container-dual">
                  <input 
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    placeholder="Ingrese la contraseña" 
                    value={managerData.password}
                    onChange={handleManagerChange}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    required
                  />
                  <span 
                    className="password-icon-dual"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </span>
                </div>
              </div>

              <div className="form-group-dual">
                <label htmlFor="confirmPassword">Confirmar Contraseña *</label>
                <div className="password-container-dual">
                  <input 
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Confirme la contraseña" 
                    value={managerData.confirmPassword}
                    onChange={handleManagerChange}
                    required
                  />
                  <span 
                    className="password-icon-dual"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </span>
                </div>
              </div>

              {/* Requisitos de contraseña */}
              {isPasswordFocused && (
                <div className="password-requirements-dual">
                  <h4>La contraseña debe contener:</h4>
                  <ul>
                    <li className={passwordRequirements.length ? "valid" : "invalid"}>
                      Al menos 8 caracteres
                    </li>
                    <li className={passwordRequirements.uppercase ? "valid" : "invalid"}>
                      Al menos una letra mayúscula
                    </li>
                    <li className={passwordRequirements.number ? "valid" : "invalid"}>
                      Al menos un número
                    </li>
                    <li className={passwordRequirements.specialChar ? "valid" : "invalid"}>
                      Al menos un carácter especial (@$!%*?&)
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Sección Derecha - Datos Empresa */}
          <div className="form-section empresa-section">
            <div className="form-grid">
              {/* Información Básica */}
              <div className="form-row form-row-2">
                <div className="form-group-dual">
                  <label htmlFor="nombre_empresa">Nombre de la Empresa *</label>
                  <input 
                    type="text" 
                    id="nombre_empresa"
                    name="nombre_empresa"
                    placeholder="Nombre comercial" 
                    value={empresaData.nombre_empresa}
                    onChange={handleEmpresaChange}
                    required
                  />
                </div>
                
                <div className="form-group-dual">
                  <label htmlFor="NIT">NIT *</label>
                  <input 
                    type="text" 
                    id="NIT"
                    name="NIT"
                    placeholder="Número de NIT" 
                    value={empresaData.NIT}
                    onChange={handleEmpresaChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row form-row-2">
                <div className="form-group-dual">
                  <label htmlFor="categoria">Categoría *</label>
                  <select 
                    id="categoria"
                    name="categoria"
                    value={empresaData.categoria}
                    onChange={handleEmpresaChange}
                    required
                  >
                    <option value="">Seleccione una categoría</option>
                    <option value="tecnologia">Tecnología</option>
                    <option value="servicios">Servicios</option>
                    <option value="comercio">Comercio</option>
                    <option value="industria">Industria</option>
                    <option value="educacion">Educación</option>
                    <option value="salud">Salud</option>
                    <option value="construccion">Construcción</option>
                    <option value="alimentos">Alimentos</option>
                    <option value="textil">Textil</option>
                  </select>
                </div>

                <div className="form-group-dual">
                  <label htmlFor="telefono">Teléfono *</label>
                  <input 
                    type="tel" 
                    id="telefono"
                    name="telefono"
                    placeholder="Número de contacto" 
                    value={empresaData.telefono}
                    onChange={handleEmpresaChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group-dual">
                <label htmlFor="email_empresa">Email Corporativo *</label>
                <input 
                  type="email" 
                  id="email_empresa"
                  name="email_empresa"
                  placeholder="correo@empresa.com" 
                  value={empresaData.email_empresa}
                  onChange={handleEmpresaChange}
                  required
                />
              </div>

              <div className="form-group-dual">
                <label htmlFor="direccion">Dirección *</label>
                <input 
                  type="text" 
                  id="direccion"
                  name="direccion"
                  placeholder="Dirección completa" 
                  value={empresaData.direccion}
                  onChange={handleEmpresaChange}
                  required
                />
              </div>

              {/* Ubicación */}
              <div className="form-row form-row-2">
                <div className="form-group-dual">
                  <label htmlFor="departamento_ID">Departamento *</label>
                  <select 
                    id="departamento_ID"
                    name="departamento_ID"
                    value={empresaData.departamento_ID}
                    onChange={handleEmpresaChange}
                    required
                  >
                    <option value="">Seleccione un departamento</option>
                    {departamentos.map((departamento) => (
                      <option key={departamento.ID} value={departamento.ID}>
                        {departamento.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group-dual">
                  <label htmlFor="ciudad_ID">Ciudad *</label>
                  <select 
                    id="ciudad_ID"
                    name="ciudad_ID"
                    value={empresaData.ciudad_ID}
                    onChange={handleEmpresaChange}
                    disabled={!empresaData.departamento_ID}
                    required
                  >
                    <option value="">Seleccione una ciudad</option>
                    {ciudades.map((ciudad) => (
                      <option key={ciudad.ID} value={ciudad.ID}>
                        {ciudad.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Logo y Descripción */}
              <div className="form-group-dual">
                <label htmlFor="img_empresa">Logo de la Empresa</label>
                <div className="file-input-container-dual">
                  <input 
                    type="file" 
                    id="img_empresa"
                    name="img_empresa"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="file-input-dual"
                  />
                  <label 
                    htmlFor="img_empresa" 
                    className={`file-input-label-dual ${empresaData.img_empresa ? 'has-file' : ''}`}
                  >
                    {empresaData.img_empresa ? "✅ Logo seleccionado" : "📁 Seleccionar logo"}
                  </label>
                </div>
              </div>

              <div className="form-group-dual">
                <label htmlFor="descripcion">Descripción de la Empresa *</label>
                <textarea 
                  id="descripcion"
                  name="descripcion"
                  placeholder="Describa los servicios, misión, visión y valores de la empresa..."
                  value={empresaData.descripcion}
                  onChange={handleEmpresaChange}
                  rows="4"
                  required
                />
              </div>

              <div className="social-links-section">
  <div className="social-links-title">
    Enlaces de Redes Sociales (Opcionales)
  </div>
  
  <div className="social-links-grid">
    <div className="social-link-item">
      <div className="social-link-label">
        <span className="social-link-icon">🌐</span>
        Sitio Web
      </div>
      <input 
        type="url"
        className="social-link-input"
        placeholder="https://empresa.com"
        value={empresaData.sitio_web.web}
        onChange={(e) => handleSitioWebChange('web', e.target.value)}
      />
    </div>

    <div className="social-link-item">
      <div className="social-link-label">
        <span className="social-link-icon">📘</span>
        Facebook
      </div>
      <input 
        type="url"
        className="social-link-input"
        placeholder="https://facebook.com/empresa"
        value={empresaData.sitio_web.facebook}
        onChange={(e) => handleSitioWebChange('facebook', e.target.value)}
      />
    </div>

    <div className="social-link-item">
      <div className="social-link-label">
        <span className="social-link-icon">📷</span>
        Instagram
      </div>
      <input 
        type="url"
        className="social-link-input"
        placeholder="https://instagram.com/empresa"
        value={empresaData.sitio_web.instagram}
        onChange={(e) => handleSitioWebChange('instagram', e.target.value)}
      />
    </div>

    <div className="social-link-item">
      <div className="social-link-label">
        <span className="social-link-icon">💼</span>
        LinkedIn
      </div>
      <input 
        type="url"
        className="social-link-input"
        placeholder="https://linkedin.com/company/empresa"
        value={empresaData.sitio_web.linkedin}
        onChange={(e) => handleSitioWebChange('linkedin', e.target.value)}
      />
    </div>

    <div className="social-link-item">
      <div className="social-link-label">
        <span className="social-link-icon">🐦</span>
        Twitter
      </div>
      <input 
        type="url"
        className="social-link-input"
        placeholder="https://twitter.com/empresa"
        value={empresaData.sitio_web.twitter}
        onChange={(e) => handleSitioWebChange('twitter', e.target.value)}
      />
    </div>
  </div>
</div>
            </div>
          </div>
        </form>

        <div className="modal-footer-dual">
          <div className="footer-info">
            * Campos obligatorios. El Manager recibirá un email de verificación.
          </div>
          <div className="footer-actions">
            <button 
              type="button"
              className="btn-cancel-dual"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="btn-save-dual"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "⏳ Creando..." : "🚀 Crear Empresa y Manager"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};