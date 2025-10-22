import { useState, useEffect } from "react";
import { Header } from "../../Layouts/Header/Header";
import { Main } from "../../Layouts/Main/Main";
import "./GestionsCompany.css";

import axiosInstance from "../../../config/axiosInstance";
import { Footer } from "../../Layouts/Footer/Footer";
import { ManageCompany } from "./ManageCompany/ManageCompany";
import { CreateEmpresa } from "../CreateEmpresa/CreateEmpresa";
import fotoPerfilDefect from "../../../assets/Icons/userDefect.png";

export const GestionsCompany = () => {
  const [empresas, setEmpresas] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false); // Estado para controlar el modal
  
  // Función corregida para el botón añadir empresa
  const handleAddCompany = () => {
    setShowCreateModal(true);
  };

  // Función para cerrar el modal
  const handleCloseModal = () => {
    setShowCreateModal(false);
  };

  const userSession = (() => {
    try {
      const raw = sessionStorage.getItem("userSession");
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  })();
  const isAdmin = userSession?.accountType === "Administrador";

  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        const res = await axiosInstance.get("/api/users/empresas");
        setEmpresas(res.data);
      } catch (error) {
        setEmpresas([]);
        console.error("Error al cargar empresas:", error);
      }
    };
    fetchEmpresas();
  }, []);

  // Filtrado por nombre/NIT y estado
  const empresasFiltradas = empresas.filter((empresa) => {
    const nombreONitMatch =
      (empresa.Empresa?.nombre_empresa || "")
        .toLowerCase()
        .includes(filtro.toLowerCase()) ||
      (empresa.Empresa?.NIT || "")
        .toLowerCase()
        .includes(filtro.toLowerCase());

    const estadoEmpresa = (empresa.Empresa?.estado || "").toLowerCase();
    const estadoMatch =
      estadoFiltro === "Todos" || estadoEmpresa === estadoFiltro.toLowerCase();

    return nombreONitMatch && estadoMatch;
  });

  const total = empresasFiltradas.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageClamped = Math.min(page, totalPages);
  const start = (pageClamped - 1) * pageSize;
  const currentItems = empresasFiltradas.slice(start, start + pageSize);

  const getLogoSrc = (logo) => {
    if (!logo) return fotoPerfilDefect;

    if (typeof logo === "string") {
      if (logo.startsWith('data:') || logo.startsWith('http')) {
        return logo;
      }

      if (/(\.png|\.jpg|\.jpeg|\.gif)$/i.test(logo)) {
        return fotoPerfilDefect;
      }

      if (logo.startsWith('iVBOR')) {
        return `data:image/png;base64,${logo}`;
      }
      if (logo.startsWith('/9j/')) {
        return `data:image/jpeg;base64,${logo}`;
      }

      if (logo.length < 100) {
        return fotoPerfilDefect;
      }

      return `data:image/jpeg;base64,${logo}`;
    }
    
    return fotoPerfilDefect;
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isAtBottomNow = scrollTop + clientHeight >= scrollHeight - 10;
    
    setIsScrolled(scrollTop > 0);
    setIsAtBottom(isAtBottomNow);
  };

  const renderCompanyRow = (empresa) => {
    const nombre = empresa.Empresa?.nombre_empresa || "Sin nombre";
    const nit = empresa.Empresa?.NIT || "-";
    const categoria = empresa.Empresa?.categoria || "Sin categoría";
    const estado = (empresa.Empresa?.estado || "").toLowerCase();
    const logo = empresa.Empresa?.img_empresa;
    const logoSrc = getLogoSrc(logo);
    
    return (
      <tr key={empresa.ID} className="company-row">
        <td className="company-logo-cell">
          <img 
            className="company-logo" 
            src={logoSrc} 
            alt="logo" 
            onError={(e) => {
              e.currentTarget.src = fotoPerfilDefect;
            }}
          />
        </td>
        <td className="company-name-cell">
          {nombre}
        </td>
        <td className="company-nit-cell">
          {nit}
        </td>
        <td className="company-category-cell">
          {categoria}
        </td>
        <td className="company-status-cell">
          <span className={`status-pill ${estado === 'activo' ? 'status-active' : estado === 'inactivo' ? 'status-inactive' : 'status-unknown'}`}>
            {estado === 'activo' ? 'Activo' : estado === 'inactivo' ? 'Inactivo' : 'Sin estado'}
          </span>
        </td>
        <td className="company-actions-cell">
          {isAdmin && (
            <button 
              className="manage-button" 
              type="button" 
              onClick={() => setSelectedEmpresa(empresa)}
              data-adblock-bypass="true"
              aria-label="Gestionar empresa"
            >
              Gestionar
            </button>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="pantallaGestionsCompany">
      <Header />
      <Main>
        <section className="sectionPrincipalGestionsCompany">
          <section className="sectionGestionsCompanyHeader">
            <div className="header-title-container">
              <p className="tituloGestionsCompany">
                Empresas <span className="tituloVerde">Registradas</span>
              </p>
              
              
            </div>

            <p className="paragraphGestionsCompany">
              Consulta y gestiona las empresas registradas en el sistema. Visualiza información clave como NIT, nombre, estado y datos de contacto. 
            </p>
          </section>

          <section className="sectionGestionsCompanyBody">
            {/* Filtros a la izquierda */}
            <section className="filterGestionsCompany">
              <strong className="tituloFiltrar">Filtrar</strong>

              <article className="filterOptionsGestionsCompany">
                <div className="filterOptionName">
                  <label className="labelFilterOption1">Nombre o NIT</label>
                  <div className="inputFilterOption1">
                    <input
                      className="inputFilterOptionText"
                      type="text"
                      placeholder="Escriba el nombre o NIT"
                      value={filtro}
                      onChange={(e) => setFiltro(e.target.value)}
                    />
                  </div>
                </div>

                <div className="courseStatusFilte">
                  <label className="labelFilterOption1" style={{ padding: "0 0 .5rem 0" }}>
                    Estado de la empresa
                  </label>
                  <section className="sectionStatusFilter">
                    {["Todos", "Activo", "Inactivo"].map((op) => (
                      <p
                        key={op}
                        className={`statusOption ${estadoFiltro === op ? "selected" : ""}`}
                        onClick={() => setEstadoFiltro(op)}
                      >
                        {op}
                      </p>
                    ))}
                  </section>
                </div>
              </article>
               {/* Botón Añadir Empresa - CORREGIDO: en el header */}
              <button 
                className="btn-add-company"
                onClick={handleAddCompany}
              >
                Añadir Empresa
              </button>
            </section>

            {/* Resultados a la derecha */}
            <section className="resultTableGestionsCompany">
              <div className="results-header">
                <label className="labelFilterOption12">
                  {total} Resultados · Página {pageClamped} de {totalPages}
                </label>
              </div>

              <div 
                className={`table-container ${isScrolled ? 'scrolled' : ''} ${isAtBottom ? 'at-bottom' : ''}`}
                onScroll={handleScroll}
              >
                {empresas.length === 0 ? (
                  <div className="no-results">No hay empresas registradas</div>
                ) : empresasFiltradas.length === 0 ? (
                  <div className="no-results">No hay empresas que coincidan con los filtros</div>
                ) : (
                  <table className="companies-table">
                    <thead>
                      <tr className="table-heade">
                        <th className="header-logo">Foto</th>
                        <th className="header-name">Nombre</th>
                        <th className="header-nit">NIT</th>
                        <th className="header-category">Categoría</th>
                        <th className="header-status">Estado</th>
                        <th className="header-actions">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map(renderCompanyRow)}
                    </tbody>
                  </table>
                )}
              </div>
              {totalPages > 1 && (
                <div className="pagination-container">
                  <button className="btn-inline" disabled={pageClamped === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Anterior</button>
                  <span className="pagination-info">{pageClamped} / {totalPages}</span>
                  <button className="btn-inline" disabled={pageClamped === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Siguiente</button>
                </div>
              )}
            </section>

            {selectedEmpresa && (
              <ManageCompany empresa={selectedEmpresa} onClose={() => setSelectedEmpresa(null)} />
            )}
           
          </section>
        </section>
      </Main>
      <Footer />

      {/* Modal CreateEmpresa - se muestra encima del contenido */}
      {showCreateModal && (
        <CreateEmpresa onClose={handleCloseModal} />
      )}
    </div>
  );
};