import { useState, useEffect } from "react";
import "./CreateEmpresa.css";

export const CreateEmpresa = ({ onClose, onCompanyCreated }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    nit: "",
    categoria: "",
  });

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Aquí iría tu llamada a la API
      console.log("Datos de la empresa:", formData);
      
      // Ejemplo de llamada API:
      // const response = await axiosInstance.post("/api/empresas", formData);
      
      // Notificar al componente padre si se proporciona callback
      if (onCompanyCreated) {
        onCompanyCreated(formData);
      }
      
      onClose(); // Cerrar el modal después de guardar
    } catch (error) {
      console.error("Error al crear empresa:", error);
      // Aquí podrías mostrar un mensaje de error al usuario
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
          <div className="form-group-company">
            <label htmlFor="nombre">Nombre de la Empresa *</label>
            <input 
              type="text" 
              id="nombre"
              name="nombre"
              placeholder="Ingrese el nombre" 
              value={formData.nombre}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group-company">
            <label htmlFor="nit">NIT *</label>
            <input 
              type="text" 
              id="nit"
              name="nit"
              placeholder="Ingrese el NIT" 
              value={formData.nit}
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
            </select>
          </div>

          <div className="modal-footer-company">
            <button 
              type="button"
              className="btn-cancel-company"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="btn-save-company"
            >
              Crear Empresa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};