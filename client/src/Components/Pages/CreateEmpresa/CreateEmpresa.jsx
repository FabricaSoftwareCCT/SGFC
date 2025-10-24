import { useState, useEffect } from "react";
import "./CreateEmpresa.css";
import axiosInstance from '../../../config/axiosInstance';
import { validateEmail, validateNumber, validateText, createMensajeError, validateNIT, validateAddress } from '../../../utils/Validators/formValidator';

export const CreateEmpresa = ({ onClose, onCompanyCreated }) => {
  const [formData, setFormData] = useState({
    nombre_empresa: "",
    NIT: "",
    categoria: "",
    direccion: "",
    telefono: "",
    email_empresa: "",
    departamento_ID: "",
    ciudad_ID: "",
    img_empresa: ""
  });

  const [departamentos, setDepartamentos] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [loading, setLoading] = useState(false);

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
      if (formData.departamento_ID) {
        try {
          const ciudadesRes = await axiosInstance.get(`/api/ubicaciones/departamentos/${formData.departamento_ID}/ciudades`);
          const ciudadesData = Array.isArray(ciudadesRes.data) ? ciudadesRes.data : ciudadesRes.data.data || [];
          setCiudades(ciudadesData);
        } catch (error) {
          console.error('Error al cargar ciudades:', error);
          setCiudades([]);
        }
      } else {
        setCiudades([]);
        setFormData(prev => ({ ...prev, ciudad_ID: "" }));
      }
    };
    cargarCiudades();
  }, [formData.departamento_ID]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(",")[1];
      setFormData(prev => ({
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
      // Validaciones
      const errores = {
        nombre_empresa: validateText(formData.nombre_empresa),
        direccion: validateAddress(formData.direccion),
        telefono: validateNumber(formData.telefono),
        email_empresa: validateEmail(formData.email_empresa),
        NIT: validateNIT(formData.NIT),
        categoria: formData.categoria ? "" : "La categoría es obligatoria",
        departamento_ID: formData.departamento_ID ? "" : "El departamento es obligatorio",
        ciudad_ID: formData.ciudad_ID ? "" : "La ciudad es obligatoria"
      };

      const hastErrors = await createMensajeError(errores);
      if (hastErrors != null) {
        alert(hastErrors);
        setLoading(false);
        return;
      }

      // Preparar datos para enviar
      const empresaData = {
        nombre_empresa: formData.nombre_empresa.trim(),
        NIT: formData.NIT,
        categoria: formData.categoria,
        direccion: formData.direccion.trim(),
        telefono: formData.telefono,
        email_empresa: formData.email_empresa,
        departamento_ID: formData.departamento_ID,
        ciudad_ID: formData.ciudad_ID,
        img_empresa: formData.img_empresa,
        estado: 'activo'
      };

      // Llamada a la API para crear empresa
      const response = await axiosInstance.post("/api/users/empresas", empresaData);
      
      console.log("Empresa creada:", response.data);
      
      // Notificar al componente padre
      if (onCompanyCreated) {
        onCompanyCreated(response.data.empresa);
      }
      
      alert('Empresa creada con éxito');
      onClose(); // Cerrar el modal después de guardar
      
    } catch (error) {
      console.error("Error al crear empresa:", error);
      
      let errorMessage = "Hubo un error al crear la empresa";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.join(', ');
      }
      
      alert(errorMessage);
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
    <div className="modal-overlay-company" onClick={handleOverlayClick}>
      <div className="modal-content-company">
        <div className="modal-header-company">
          <h2>Crear Nueva Empresa</h2>
          <button 
            className="close-button-company"
            onClick={onClose}
            type="button"
            aria-label="Cerrar modal"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body-company">
          {/* Logo de la empresa */}
          <div className="form-group-company">
            <label htmlFor="img_empresa">Logo de la Empresa</label>
            <div className="file-input-container">
              <input 
                type="file" 
                id="img_empresa"
                name="img_empresa"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input"
              />
              <label htmlFor="img_empresa" className="file-input-label">
                {formData.img_empresa ? "Imagen seleccionada" : "Seleccionar imagen"}
              </label>
            </div>
          </div>

          <div className="form-group-company">
            <label htmlFor="nombre_empresa">Nombre de la Empresa *</label>
            <input 
              type="text" 
              id="nombre_empresa"
              name="nombre_empresa"
              placeholder="Ingrese el nombre de la empresa" 
              value={formData.nombre_empresa}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group-company">
            <label htmlFor="NIT">NIT *</label>
            <input 
              type="text" 
              id="NIT"
              name="NIT"
              placeholder="Ingrese el NIT" 
              value={formData.NIT}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group-company">
            <label htmlFor="categoria">Categoría *</label>
            <select 
              id="categoria"
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione una categoría</option>
              <option value="tecnologia">Tecnología</option>
              <option value="servicios">Servicios</option>
              <option value="comercio">Comercio</option>
              <option value="industria">Industria</option>
              <option value="educacion">Educación</option>
              <option value="salud">Salud</option>
            </select>
          </div>

          <div className="form-group-company">
            <label htmlFor="direccion">Dirección *</label>
            <input 
              type="text" 
              id="direccion"
              name="direccion"
              placeholder="Ingrese la dirección completa" 
              value={formData.direccion}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group-company">
            <label htmlFor="telefono">Teléfono *</label>
            <input 
              type="tel" 
              id="telefono"
              name="telefono"
              placeholder="Ingrese el teléfono" 
              value={formData.telefono}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group-company">
            <label htmlFor="email_empresa">Email de la Empresa *</label>
            <input 
              type="email" 
              id="email_empresa"
              name="email_empresa"
              placeholder="Ingrese el email corporativo" 
              value={formData.email_empresa}
              onChange={handleChange}
              required
            />
          </div>

          {/* Departamento y Ciudad */}
          <div className="form-group-company">
            <label htmlFor="departamento_ID">Departamento *</label>
            <select 
              id="departamento_ID"
              name="departamento_ID"
              value={formData.departamento_ID}
              onChange={handleChange}
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

          <div className="form-group-company">
            <label htmlFor="ciudad_ID">Ciudad *</label>
            <select 
              id="ciudad_ID"
              name="ciudad_ID"
              value={formData.ciudad_ID}
              onChange={handleChange}
              disabled={!formData.departamento_ID}
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

          <div className="modal-footer-company">
            <button 
              type="button"
              className="btn-cancel-company"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="btn-save-company"
              disabled={loading}
            >
              {loading ? "Creando..." : "Crear Empresa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};