import React, { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./RegistrationsGestor.css";
import { getAllInscripciones, updateBulkStatus } from '../../../API/ApiRpeort';
import { Header } from "../../../Layouts/Header/Header";
import { Main } from "../../../Layouts/Main/Main";
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css'

export const RegistrationsGestor = () => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [inscritos, setInscritos] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const itemsPerPage = 5;
  const { id } = useParams();

  const fetchData= async() =>{
    try {
      const data = await getAllInscripciones(id);
      if (!data) {
        Swal.fire({
          icon:"error",
          title:"Error al cargar los datos",
          text:"No se cargaron los datos en el sistema, intentelo otra vez",
          confirmButtonText:"Okay",
          theme:"bulma",
          customClass:{
        confirmButton: 'button is-primary',
        actions: 'swal2-actions-centered'
                }
        })
        return;
      }
      setInscritos(data);
    } catch (error) {
      console.log(error);
              Swal.fire({
          icon:"error",
          title:"Error en el servidor",
          text:"No respondió el servidor, intentelo más tarde",
          confirmButtonText:"Okay",
          theme:"bulma",
          customClass:{
        confirmButton: 'button is-primary',
        actions: 'swal2-actions-centered'
                }
        })
    }
  }
  useEffect(() => {
    fetchData();
  }, [id]);

  const filteredAndSortedData = useMemo(() => {
    let result = inscritos.filter(
      (item) =>
        item.nombres.toLowerCase().includes(search.toLowerCase()) ||
        item.empresa.toLowerCase().includes(search.toLowerCase()) ||
        item.email.toLowerCase().includes(search.toLowerCase())
    );

    switch(sortBy) {
      case "nombres":
        result.sort((a, b) => a.nombres.localeCompare(b.nombres));
        break;
      case "empresa":
        result.sort((a, b) => a.empresa.localeCompare(b.empresa));
        break;
      case "email":
      default:
        result.sort((a, b) => new Date(b.fecha_inscripcion) - new Date(a.fecha_inscripcion));
        break;
    }

    return result;
  }, [inscritos, search, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);

  const handleSelectItem = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      const currentPageIds = paginatedData.map(item => item.id);
      setSelectedItems(currentPageIds);
    }
    setSelectAll(!selectAll);
  };

  const handleBulkStatusChange  = async (newStatus) => {
  if (selectedItems.length === 0) {
                  Swal.fire({
          icon:"info",
          title:"Selecciona una inscripción",
          text:"Por favor selecciona al menos una inscripción",
          confirmButtonText:"Okay",
          theme:"bulma",
          customClass:{
        confirmButton: 'button is-primary',
        actions: 'swal2-actions-centered'
                }
          })
    return;
  }

  // Filtrar solo los items seleccionados que están pendientes
  const pendingSelectedData = inscritos.filter(item => 
    selectedItems.includes(item.id) && item.estado === "pendiente"
  );

  // Si no hay pendientes seleccionados, mostrar alerta
  if (pendingSelectedData.length === 0) {
                  Swal.fire({
          icon:"info",
          title:"No hay inscripciones pendientes seleccionadas",
          text:"Solo puedes cambiar el estado de inscripciones pendientes.",
          confirmButtonText:"Okay",
          theme:"bulma",
          customClass:{
        confirmButton: 'button is-primary',
        actions: 'swal2-actions-centered'
                }
                  })
    return;
  }

  // Si hay algunos no pendientes, informar al usuario
  const nonPendingCount = selectedItems.length - pendingSelectedData.length;
  if (nonPendingCount > 0) {
                  Swal.fire({
          icon:"error",
          title:"Inscripciones no procesables",
          text:(`${nonPendingCount} inscripción(es) no se pueden modificar porque ya no están pendientes. Solo se procesarán ${pendingSelectedData.length} inscripción(es) pendientes.`),
          confirmButtonText:"Aceptar",
          theme:"bulma",
          customClass:{
        confirmButton: 'button is-primary',
        actions: 'swal2-actions-centered'
                }
              })
  }

  // Crear el array para enviar al backend
  const estados = pendingSelectedData.map(item => ({
    id: item.id,
    estado: newStatus // "activo" o "rechazado"
  }));
  
  try {
    await updateBulkStatus(estados)
  } catch (err){
    Swal.fire({
          icon:"error",
          title:"Error al actualizar",
          text: err? err: "No se logro actualizar, por favor, intente nuevamente",
          confirmButtonText:"Aceptar",
          theme:"bulma",
          customClass:{
        confirmButton: 'button is-primary',
        actions: 'swal2-actions-centered'
                }
              })
  }
  
  fetchData(); 
  // Limpiar selección
  setSelectedItems([]);
  setSelectAll(false);
  
};

  const getSelectedData = () => {
    return inscritos.filter(item => selectedItems.includes(item.id));
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setSelectAll(false);
    }
  };

  return (
    <>
      <Header />
      <Main>
        <div className="registrations-container">
          <h1 className="main-title">Curso Power Point</h1>
          
          <div className="content-wrapper">
            <div className="registrations-card">
              {/* Header */}
              <div className="card-header">
                <div className="title-section">
                  <h2>All Customers</h2>
                  <p className="subtitle">
                    Active Members <span className="count-badge">{filteredAndSortedData.filter(item => item.estado === "activo").length}</span>
                  </p>
                </div>
                <div className="header-actions">

                  <div className="filters-row">
                    <input
                      type="text"
                      placeholder="Search..."
                      className="search-input-1"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                    <select 
                      className="sort-select" 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="newest">Más recientes</option>
                      <option value="nombres">Nombres</option>
                      <option value="empresa">Empresa</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="container-bulk-actions">
                  <div className="bulk-actions">
                    <button 
                      className="bulk-btn accept-btn"
                      onClick={() => handleBulkStatusChange("activo")}
                    >
                      Aceptar Seleccionados
                    </button>
                    <button 
                      className="bulk-btn reject-btn"
                      onClick={() => handleBulkStatusChange("rechazado")}
                    >
                      Rechazar Seleccionados
                    </button>
                    <span className="selected-count">
                      {selectedItems.length} seleccionados
                    </span>
                  </div>
              </div>      

              {/* Tabla */}
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th className="checkbox-column">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={handleSelectAll}
                          className="select-all-checkbox"
                        />
                      </th>
                      <th>NOMBRES</th>
                      <th>APELLIDOS</th>
                      <th>EMPRESA</th>
                      <th>EMAIL</th>
                      <th>CELULAR</th>
                      <th>FECHA INSCRIPCIÓN</th>
                      <th>ESTADO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length > 0 ? (
                      paginatedData.map((item) => (
                        <tr key={item.id}>
                          <td className="checkbox-column">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(item.id)}
                              onChange={() => handleSelectItem(item.id)}
                              className="item-checkbox"
                            />
                          </td>
                          <td>{item.nombres}</td>
                          <td>{item.apellidos}</td>
                          <td>{item.empresa}</td>
                          <td>{item.email}</td>
                          <td>{item.celular}</td>
                          <td>{new Date(item.fecha_inscripcion).toLocaleDateString()}</td>
                          <td>
                            <div className={`status-badge ${item.estado.toLowerCase()}`}>
                              {item.estado}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="no-results">
                          No se encontraron inscripciones
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="table-footer">
                <div className="results-info">
                  Showing data {filteredAndSortedData.length > 0 ? startIndex + 1 : 0} to{" "}
                  {Math.min(startIndex + itemsPerPage, filteredAndSortedData.length)} of{" "}
                  {filteredAndSortedData.length} entries
                </div>

                <div className="pagination">
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="pagination-btn"
                  >
                    &lt;
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`pagination-btn ${currentPage === page ? "active" : ""}`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="pagination-btn"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Main>
    </>
  );
};