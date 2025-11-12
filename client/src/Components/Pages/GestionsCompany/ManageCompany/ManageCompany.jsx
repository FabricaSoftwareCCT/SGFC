import { useState, useEffect } from "react";
import "./UpdateCompany.css";
import axiosInstance from "../../../../config/axiosInstance";
import PropTypes from "prop-types";
import fotoPerfilDefect from "../../../../assets/Icons/userDefect.png";
import { validateEmail, validateNumber, validateText, validateAddress, validateNIT } from "../../../../utils/Validators/formValidator";
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css'

// Modal para gestionar datos de una Empresa
export const ManageCompany = ({ empresa, onClose }) => {
  const datosEmpresa = empresa?.Empresa || {};
  const userId = empresa?.ID; // ID de usuario requerido por el backend
  const [isEditing, setIsEditing] = useState(false);
  const [departamentos, setDepartamentos] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [formData, setFormData] = useState({
    userId: userId,
    nombre_empresa: datosEmpresa.nombre_empresa || "",
    NIT: datosEmpresa.NIT || "",
    categoria: datosEmpresa.categoria || "",
    estado: (datosEmpresa.estado || "").toLowerCase(),
    telefono: datosEmpresa.telefono || "",
    direccion: datosEmpresa.direccion || "",
    email_empresa: datosEmpresa.email_empresa || "",
    // Preselección de ciudad/departamento desde perfil si existen
    ciudad_ID: datosEmpresa?.Ciudad?.ID || datosEmpresa.ciudad_ID || null,
    departamento_ID: datosEmpresa?.Ciudad?.Departamento?.ID || null,
    logo: datosEmpresa.img_empresa || null, // img_empresa en backend
  });

  useEffect(() => {
    const fetchDepartamentos = async () => {
      try {
        const res = await axiosInstance.get("/api/ubicaciones/departamentos");
        const payload = Array.isArray(res.data)
          ? res.data
          : (res.data?.data || res.data?.departamentos || []);
        setDepartamentos(payload || []);
      } catch (_) { setDepartamentos([]); }
    };
    fetchDepartamentos();
  }, []);

  // Cargar departamento desde ciudad_ID si existe
  useEffect(() => {
    const fetchDepartamentoFromCiudad = async () => {
      if (formData.ciudad_ID && !formData.departamento_ID) {
        try {
          const res = await axiosInstance.get(`/api/ubicaciones/ciudades/${formData.ciudad_ID}`);
          if (res.data?.Departamento?.ID) {
            setFormData(prev => ({ ...prev, departamento_ID: res.data.Departamento.ID }));
          }
        } catch (_) {
          console.log("No se pudo obtener el departamento de la ciudad");
        }
      }
    };
    fetchDepartamentoFromCiudad();
  }, [formData.ciudad_ID]);

  useEffect(() => {
    const fetchCiudades = async () => {
      if (!formData.departamento_ID && !formData.ciudad_ID) return;
      try {
        const deptoId = formData.departamento_ID;
        if (deptoId) {
          const res = await axiosInstance.get(`/api/ubicaciones/departamentos/${deptoId}/ciudades`);
          const payload = Array.isArray(res.data)
            ? res.data
            : (res.data?.data || res.data?.ciudades || []);
          setCiudades(payload || []);
          // Si hay ciudad_ID previa, asegurar que siga seleccionada si existe en el payload
          if (formData.ciudad_ID && !payload.find(c => c.ID === formData.ciudad_ID)) {
            setFormData(prev => ({ ...prev, ciudad_ID: null }));
          }
        }
      } catch (_) { setCiudades([]); }
    };
    fetchCiudades();
  }, [formData.departamento_ID, formData.ciudad_ID]);

  const closeModal = () => {
    if (onClose) onClose();
    const overlay = document.getElementById("modal-overlayUpdateEmpresa");
    if (overlay) overlay.style.display = "none";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectDepartamento = (e) => {
    const value = e.target.value;
    const departamento_ID = value ? Number(value) : null;
    setFormData((prev) => ({ ...prev, departamento_ID, ciudad_ID: null }));
  };

  const handleSelectCiudad = (e) => {
    const value = e.target.value;
    const ciudad_ID = value ? Number(value) : null;
    setFormData((prev) => ({ ...prev, ciudad_ID }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) setFormData((p) => ({ ...p, logo: file }));
  };

  const handleEstadoChange = (estado) => {
    setFormData((prev) => ({ ...prev, estado: estado.toLowerCase() }));
  };

  const validateFields = () => {
    const errors = [];
    
    // Validar nombre de empresa
    if (formData.nombre_empresa.trim() === '') {
      errors.push('El nombre de la empresa es obligatorio');
    }
    
    // Validar NIT
    const nitError = validateNIT(formData.NIT);
    if (nitError) errors.push(nitError);
    
    // Validar categoría
    if (formData.categoria.trim() === '') {
      errors.push('La categoría es obligatoria');
    }
    
    // Validar teléfono
    const telefonoError = validateNumber(formData.telefono);
    if (telefonoError) errors.push(telefonoError);
    
    // Validar dirección
    const direccionError = validateAddress(formData.direccion);
    if (direccionError) errors.push(direccionError);
    
    // Validar email de empresa
    const emailError = validateEmail(formData.email_empresa);
    if (emailError) errors.push(emailError);
    
    return errors;
  };

  const getLogoSrc = (logo) => {
    // Fallback inmediato si no hay valor
    if (!logo) return fotoPerfilDefect;

    if (logo instanceof File) return URL.createObjectURL(logo);
    
    if (typeof logo === "string") {
      // Si ya viene como data URL o URL absoluta, úsala tal cual
      if (logo.startsWith('data:') || logo.startsWith('http')) {
        return logo;
      }

      // Si en BD guardaron una ruta relativa (p.ej. ../Img/userDefect.png), usar por defecto
      if (/(\.png|\.jpg|\.jpeg|\.gif)$/i.test(logo)) {
        return fotoPerfilDefect;
      }

      // Detectar tipo MIME por encabezado base64
      if (logo.startsWith('iVBOR')) {
        return `data:image/png;base64,${logo}`;
      }
      if (logo.startsWith('/9j/')) {
        return `data:image/jpeg;base64,${logo}`;
      }

      // Si la cadena es muy corta, probablemente no es una imagen base64 válida
      if (logo.length < 100) {
        return fotoPerfilDefect;
      }

      // Último recurso: asumir jpeg
      return `data:image/jpeg;base64,${logo}`;
    }
    
    return fotoPerfilDefect;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    if (!formData.userId) {
      await Swal.fire({
        icon: 'error',
        title: 'Error de identificación',
        text: 'No se pudo identificar el usuario de la empresa.',
        confirmButtonColor: '#d33',
              theme:"bulma",
      customClass: { confirmButton: 'centered-swal-button' }
      });
      return;
    }

    // Validar todos los campos antes de enviar
    const errors = validateFields();
    if (errors.length > 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Errores de validación',
        html: `
          <div style="text-align: left;">
            <p>Por favor corrija los siguientes errores:</p>
            <ul style="margin-top: 10px; padding-left: 20px;">
              ${errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
          </div>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3085d6',
              theme:"bulma",
      customClass: { confirmButton: 'centered-swal-button' }
      });
      return;
    }

    try {
      const body = new FormData();
      const empresaPayload = {
        NIT: formData.NIT,
        categoria: formData.categoria,
        direccion: formData.direccion,
        email_empresa: formData.email_empresa,
        estado: formData.estado,
        img_empresa: typeof formData.logo === "string" ? formData.logo : undefined,
        nombre_empresa: formData.nombre_empresa,
        telefono: formData.telefono,
        ciudad_ID: formData.ciudad_ID || null,
        departamento_ID: formData.departamento_ID || null,
      };
      // Debug client-side
      console.log("Actualizando empresa con payload:", empresaPayload);
      body.append("empresa", JSON.stringify(empresaPayload));
      if (formData.logo instanceof File) {
        body.append("img_empresa", formData.logo);
      }

      const response = await axiosInstance.put(`/api/users/perfil/actualizar/${formData.userId}`, body, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response?.status >= 200 && response?.status < 300) {
  await Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: response?.data?.message || "Empresa actualizada correctamente",
          confirmButtonColor: '#3085d6',
          timer: 3000,
          timerProgressBar: true,
              theme:"bulma",
      customClass: { confirmButton: 'centered-swal-button' }
        });
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar la empresa.',
          confirmButtonColor: '#d33',
                        theme:"bulma",
      customClass: { confirmButton: 'centered-swal-button' }
        });
        return;
      }
      setIsEditing(false);
      window.location.reload();
    } catch (error) {
      console.error(`Error al actualizar la empresa:`, error.response?.data || error.message);
      await Swal.fire({
        icon: 'error',
        title: 'Error al actualizar',
        text: 'Hubo un error al actualizar la empresa. Por favor, inténtelo de nuevo.',
        confirmButtonColor: '#d33',
                      theme:"bulma",
      customClass: { confirmButton: 'centered-swal-button' }
      });
    }
  };

  return (
		<div id="modal-overlayUpdateInstructor" style={{ display: "flex" }}>
      <form className="modal-bodyUpdateInstructor" onSubmit={handleSubmit}>
        <div className="modal-left-update">
          <p>
            <strong>Nombre:</strong>{" "}
            {isEditing ? (
              <input
                type="text"
                name="nombre_empresa"
                className="input_updateData"
                value={formData.nombre_empresa}
                onChange={handleChange}
              />
            ) : (
              <span className="valor-campo">{formData.nombre_empresa}</span>
            )}
          </p>
          <p>
            <strong>NIT:</strong>{" "}
            {isEditing ? (
              <input
                type="text"
                name="NIT"
                className="input_updateData"
                value={formData.NIT}
                onChange={handleChange}
              />
            ) : (
              <span className="valor-campo">{formData.NIT}</span>
            )}
          </p>
          <p>
            <strong>Categoría:</strong>{" "}
            {isEditing ? (
              <input
                type="text"
                name="categoria"
                className="input_updateData"
                value={formData.categoria}
                onChange={handleChange}
              />
            ) : (
              <span className="valor-campo">{formData.categoria}</span>
            )}
          </p>
          <p>
            <strong>Departamento:</strong>{" "}
            {isEditing ? (
              <select className="input_updateData" value={formData.departamento_ID || ""} onChange={handleSelectDepartamento}>
                <option value="">Seleccione...</option>
                {departamentos.map((d) => (
                  <option key={d.ID} value={d.ID}>{d.nombre}</option>
                ))}
              </select>
            ) : (
              <span className="valor-campo">{departamentos.find(d => d.ID === formData.departamento_ID)?.nombre || "-"}</span>
            )}
          </p>
          <p>
            <strong>Ciudad:</strong>{" "}
            {isEditing ? (
              <select className="input_updateData" value={formData.ciudad_ID || ""} onChange={handleSelectCiudad} disabled={!formData.departamento_ID}>
                <option value="">Seleccione...</option>
                {ciudades.map((c) => (
                  <option key={c.ID} value={c.ID}>{c.nombre}</option>
                ))}
              </select>
            ) : (
              <span className="valor-campo">{ciudades.find(c => c.ID === formData.ciudad_ID)?.nombre || "-"}</span>
            )}
          </p>
          <p>
            <strong>Teléfono:</strong>{" "}
            {isEditing ? (
              <input
                type="text"
                name="telefono"
                className="input_updateData"
                value={formData.telefono}
                onChange={handleChange}
              />
            ) : (
              <span className="valor-campo">{formData.telefono || "-"}</span>
            )}
          </p>
          <p>
            <strong>Dirección:</strong>{" "}
            {isEditing ? (
              <input
                type="text"
                name="direccion"
                className="input_updateData"
                value={formData.direccion}
                onChange={handleChange}
              />
            ) : (
              <span className="valor-campo">{formData.direccion || "-"}</span>
            )}
          </p>
          <p>
            <strong>Email:</strong>{" "}
            {isEditing ? (
              <input
                type="email"
                name="email_empresa"
                className="input_updateData"
                value={formData.email_empresa}
                onChange={handleChange}
              />
            ) : (
              <span className="valor-campo">{formData.email_empresa || "-"}</span>
            )}
          </p>
          <p>
            <strong>Estado:</strong>{" "}
            {isEditing ? (
              <div className="status-buttons">
                {["Activo", "Inactivo", "suspendido"].map((estado) => (
                  <button
                    key={estado}
                    type="button"
                    className={`status ${formData.estado === estado.toLowerCase() ? "active" : ""}`}
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
            onChange={handleLogoChange}
            id="imageUpload"
          />

          <label
            className={`upload-area-update ${!isEditing ? "read-only-border" : ""}`}
            htmlFor="imageUpload"
          >
            {(() => {
              const src = getLogoSrc(formData.logo);
              return (
                <img 
                  src={src} 
                  alt="Logo" 
                className="preview-image-update"
                  onError={(e) => {
                    e.currentTarget.src = fotoPerfilDefect;
                  }}
                />
              );
            })()}
          </label>

          <button type="submit" className="edit-button-updateEmpresa">
            {isEditing ? "Guardar Cambios" : "Editar Empresa"}
          </button>
        </div>

        <div className="container_return_UpdateEmpresa">
          <h5>Volver</h5>
          <button type="button" onClick={closeModal} className="closeModal"></button>
        </div>
      </form>
    </div>
  );
};

ManageCompany.propTypes = {
  empresa: PropTypes.shape({
    ID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    Empresa: PropTypes.shape({
      ID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      nombre_empresa: PropTypes.string,
      NIT: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      categoria: PropTypes.string,
      estado: PropTypes.string,
      telefono: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      direccion: PropTypes.string,
      email_empresa: PropTypes.string,
      img_empresa: PropTypes.any,
      ciudad_ID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
  }),
  onClose: PropTypes.func,
};