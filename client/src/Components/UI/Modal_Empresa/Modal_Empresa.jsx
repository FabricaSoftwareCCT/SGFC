import { useState, useEffect } from "react";
import "./Modal_Empresa.css";
import axiosInstance from '../../../config/axiosInstance';

export const Modal_Empresa = ({ onClose, onEmpresaSeleccionada }) => {
  const [empresasDisponibles, setEmpresasDisponibles] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Cargar empresas disponibles
  useEffect(() => {
    const cargarEmpresasDisponibles = async () => {
      setLoading(true);
      try {
        const empresasRes = await axiosInstance.get('/api/users/admin/empresas');
        const empresasData = Array.isArray(empresasRes.data) ? empresasRes.data : empresasRes.data.empresas || [];
        console.log(empresasData) 
        setEmpresasDisponibles(empresasData);
      } catch (error) {
        console.error('Error al cargar empresas:', error);
        setEmpresasDisponibles([]);
      } finally {
        setLoading(false);
      }
    };
    cargarEmpresasDisponibles();
  }, []);

  // Filtrar empresas según término de búsqueda
  const empresasFiltradas = empresasDisponibles.filter(empresa =>
    empresa.nombre_empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    empresa.estado?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    empresa.NIT?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Manejar selección de empresa (solo una)
  const handleEmpresaChange = (empresaId) => {
    setEmpresaSeleccionada(empresaId === empresaSeleccionada ? null : empresaId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!empresaSeleccionada) {
      alert('Por favor selecciona una empresa');
      return;
    }

    try {
      const empresaCompleta = empresasDisponibles.find(empresa => 
        empresa.ID === empresaSeleccionada || empresa.id === empresaSeleccionada
      );

      if (onEmpresaSeleccionada) {
        onEmpresaSeleccionada(empresaCompleta);
      }
      onClose();
      
    } catch (error) {
      console.error("Error al procesar la empresa:", error);
      alert("Hubo un error al procesar la selección de la empresa");
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
    <div className="modal-empresa-overlay" onClick={handleOverlayClick}>
      <div className="modal-empresa-content">
        <div className="modal-empresa-header">
          <h2>Selección de Empresa</h2>
          <button 
            className="modal-empresa-close-button"
            onClick={onClose}
            type="button"
            aria-label="Cerrar modal"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-empresa-body">
          <div className="modal-empresa-form-group">
            <label>Buscar empresa</label>
            <input
              type="text"
              placeholder="Buscar por nombre, razón social o RUT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="modal-empresa-search-input"
            />
          </div>

          <div className="modal-empresa-form-group">
            <label>Selecciona una empresa *</label>
            
            {loading ? (
              <div className="modal-empresa-loading">Cargando empresas disponibles...</div>
            ) : empresasDisponibles.length === 0 ? (
              <div className="modal-empresa-empty">
                No hay empresas disponibles
              </div>
            ) : (
              <div className="modal-empresa-list">
                {empresasFiltradas.length === 0 ? (
                  <div className="modal-empresa-empty">
                    No se encontraron empresas que coincidan con "{searchTerm}"
                  </div>
                ) : (
                  empresasFiltradas.map((empresa) => (
                    <div 
                      key={empresa.ID || empresa.id} 
                      className={`modal-empresa-option ${empresaSeleccionada === (empresa.ID || empresa.id) ? 'modal-empresa-selected' : ''}`}
                      onClick={() => handleEmpresaChange(empresa.ID || empresa.id)}
                    >
                      <div className="modal-empresa-radio-container">
                        <input
                          type="radio"
                          name="empresaSeleccionada"
                          checked={empresaSeleccionada === (empresa.ID || empresa.id)}
                          onChange={() => handleEmpresaChange(empresa.ID || empresa.id)}
                          className="modal-empresa-radio-input"
                        />
                        <span className="modal-empresa-radio-checkmark"></span>
                      </div>
                      <div className="modal-empresa-details">
                        <div className="modal-empresa-title">
                          {empresa.nombre_empresa}
                        </div>
                        <div className="modal-empresa-info">
                          {empresa.NIT && (
                            <span className="modal-empresa-rut">RUT: {empresa.NIT}</span>
                          )}
                        </div>
                        {empresa.estado && (
                          <div className="modal-empresa-direccion">
                            {empresa.estado}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            
            {empresaSeleccionada && (
              <div className="modal-empresa-selected-info">
                <strong>Empresa seleccionada:</strong> {
                  empresasDisponibles.find(empresa => 
                    empresa.ID === empresaSeleccionada || empresa.id === empresaSeleccionada
                  )?.nombre_empresa || empresasDisponibles.find(empresa => 
                    empresa.ID === empresaSeleccionada || empresa.id === empresaSeleccionada
                  )?.estado
                }
              </div>
            )}
          </div>

          <div className="modal-empresa-footer">
            <button 
              type="button"
              className="modal-empresa-btn-cancel"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="modal-empresa-btn-confirm"
              disabled={!empresaSeleccionada}
            >
              Confirmar Selección
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};