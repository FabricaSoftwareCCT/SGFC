import React, { useState, useMemo } from "react";
import "./RegistrationsGestor.css";
import { Header } from "../../../Layouts/Header/Header";
import { Main } from "../../../Layouts/Main/Main";

export const RegistrationsGestor = () => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Datos de ejemplo
  const data = [
    { 
      id: 1, 
      name: "Jane Cooper", 
      company: "Microsoft", 
      phone: "(225) 555-0118", 
      email: "jane@microsoft.com", 
      country: "United States", 
      status: "Active" 
    },
    { 
      id: 2, 
      name: "Floyd Miles", 
      company: "Yahoo", 
      phone: "(205) 555-0100", 
      email: "floyd@yahoo.com", 
      country: "Kiribati", 
      status: "Inactive" 
    },
    { 
      id: 3, 
      name: "Ronald Richards", 
      company: "Adobe", 
      phone: "(302) 555-0107", 
      email: "ronald@adobe.com", 
      country: "Israel", 
      status: "Inactive" 
    },
    { 
      id: 4, 
      name: "Marvin McKinney", 
      company: "Tesla", 
      phone: "(252) 555-0126", 
      email: "marvin@tesla.com", 
      country: "Iran", 
      status: "Active" 
    },
    { 
      id: 5, 
      name: "Jerome Bell", 
      company: "Google", 
      phone: "(629) 555-0129", 
      email: "jerome@google.com", 
      country: "Réunion", 
      status: "Active" 
    },
    { 
      id: 6, 
      name: "Kathryn Murphy", 
      company: "Microsoft", 
      phone: "(406) 555-0120", 
      email: "kathryn@microsoft.com", 
      country: "Curaçao", 
      status: "Active" 
    },
  ];

  // Filtrar y ordenar datos
  const filteredAndSortedData = useMemo(() => {
    let result = data.filter(
      (item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.company.toLowerCase().includes(search.toLowerCase()) ||
        item.email.toLowerCase().includes(search.toLowerCase())
    );

    // Ordenar
    switch(sortBy) {
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "oldest":
        result.sort((a, b) => a.id - b.id);
        break;
      case "newest":
      default:
        result.sort((a, b) => b.id - a.id);
        break;
    }

    return result;
  }, [search, sortBy]);

  // Calcular paginación
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);

  // Manejar cambio de página
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Manejar cambio de estado
  const handleStatusChange = (id, currentStatus) => {
    console.log(`Cambiando estado del usuario ${id} de ${currentStatus} a ${currentStatus === "Active" ? "Inactive" : "Active"}`);
    // Aquí va tu llamada al backend
  };

  return (
    <>
      <Header />
      <Main>
        <div className="registrations-container">
          {/* Título H1 Centrado */}
          <h1 className="main-title">Curso Power Point</h1>
          
          <div className="content-wrapper">
            <div className="registrations-card">
              {/* Header con título y filtros */}
              <div className="card-header">
                <div className="title-section">
                  <h2>All Customers</h2>
                  <p className="subtitle">
                    Active Members <span className="count-badge">{filteredAndSortedData.filter(item => item.status === "Active").length}</span>
                  </p>
                </div>

                {/* Filtros en fila */}
                <div className="filters-row">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="search-input"
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
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="name">Name</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tabla */}
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Company</th>
                    <th>Phone Number</th>
                    <th>Email</th>
                    <th>Country</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length > 0 ? (
                    paginatedData.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.company}</td>
                        <td>{item.phone}</td>
                        <td>{item.email}</td>
                        <td>{item.country}</td>
                        <td>
                          <button 
                            className={`status-btn ${item.status.toLowerCase()}`}
                            onClick={() => handleStatusChange(item.id, item.status)}
                          >
                            {item.status}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-results">
                        No customers found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer con paginación */}
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
      </Main>
    </>
  );
};