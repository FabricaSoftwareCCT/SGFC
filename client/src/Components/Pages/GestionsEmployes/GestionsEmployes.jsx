import React, { useState, useEffect } from "react";
import "./GestionsEmployes.css";
import { Header } from "../../Layouts/Header/Header";
import { Footer } from "../../../Components/Layouts/Footer/Footer";
import { Main } from "../../../Components/Layouts/Main/Main";
import { UpdateEmploye } from "./UpdateEmploye/UpdateEmploye";
import axiosInstance from "../../../config/axiosInstance";
import { useModal } from "../../../Context/ModalContext";

export const GestionsEmployes = () => {
  const [employes, setEmployes] = useState([]); // Todos los empleados
  const [filteredEmployes, setFilteredEmployes] = useState([]); // Empleados filtrados
  const [filter, setFilter] = useState(""); // Filtro de búsqueda
  const [current, setCurrent] = useState(0); // Índice del carrusel
  const [selectedState, setSelectedState] = useState({
    activo: true,
    inactivo: true,
  });
  const [selectedEmploye, setSelectedEmploye] = useState(null); // Empleado seleccionado

  const { setShowModalCreateEmployee } = useModal();
  const userSession =
    JSON.parse(localStorage.getItem("userSession")) || JSON.parse(sessionStorage.getItem("userSession"))

  const isLoggedIn = !!userSession
  const accountType = userSession?.accountType || null


  // Obtener empleados de la empresa
  const fetchEmployes = async () => {
    try {
      let userSessionString = localStorage.getItem("userSession") || sessionStorage.getItem("userSession");
      if (!userSessionString) {
        alert("No se encontró la sesión de usuario.");
        return;
      }
      const userSession = JSON.parse(userSessionString);
      const empresaId = userSession.empresa_ID;
      /*if (!empresaId) {
        alert("No se encontró el ID de la empresa en la sesión.");
        return;
      }*/
      const response = await axiosInstance.get(`/api/users/empresa/${empresaId}/empleados`);
      setEmployes(response.data.empleados || []);
      setFilteredEmployes(response.data.empleados || []);
    } catch (error) {
      console.error("Error al obtener los empleados:", error);
      alert("Hubo un problema al cargar los empleados. Por favor, inténtalo más tarde.");
    }
  };

  useEffect(() => {
    fetchEmployes();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line
  }, [selectedState, filter, employes]);

  // Filtrar empleados por nombre, apellido, documento y estado
  const applyFilters = () => {
    const filtered = employes.filter((employe) =>
      (employe.nombres || "").toLowerCase().includes(filter.toLowerCase()) ||
      (employe.apellidos || "").toLowerCase().includes(filter.toLowerCase()) ||
      (employe.documento || "").toLowerCase().includes(filter.toLowerCase())
    );

    const filteredByState = filtered.filter((employe) => {
      const estado = (employe.estado || "").toLowerCase();
      if (selectedState.activo && estado === "activo") return true;
      if (selectedState.inactivo && estado === "inactivo") return true;
      return false;
    });

    setFilteredEmployes(filteredByState);
    setCurrent(0);
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const next = () => setCurrent((prev) => (prev + 1) % filteredEmployes.length);
  const prev = () => setCurrent((prev) => (prev - 1 + filteredEmployes.length) % filteredEmployes.length);

  const showModalCreateEmploye = () => {
    setShowModalCreateEmployee(true);
  };

  const showModalSeeProfile = (employe) => {
    setSelectedEmploye(employe);
    const modalSeeProfile = document.getElementById("modal-overlayUpdateEmploye");
    if (modalSeeProfile) {
      modalSeeProfile.style.display = "flex";
    }
  };

  const getImageSrcFromBase64 = (base64) => {
    if (!base64) return "default-profile.png";
    if (base64.startsWith("iVBOR")) return `data:image/png;base64,${base64}`;
    if (base64.startsWith("/9j/")) return `data:image/jpeg;base64,${base64}`;
    return `data:image/jpeg;base64,${base64}`;
  };

  return (
    <>
      <Header />
      <Main>
        <div className="container_GestionsEmploye">
          <h2>
            Mis <span className="complementary">Empleados</span>
          </h2>

          <div className="containerGestionsEmployeOptions">
            <div className="containerConsultEmploye">
              <p>Filtrar por:</p>
              <div className="containerFiltersEmploye">
                <label htmlFor="inputNameCC">Nombre o Cédula</label>
                <div className="inputSearchContainer">
                  <input
                    type="text"
                    id="inputNameCC"
                    placeholder="Escriba el nombre o la cédula"
                    value={filter}
                    onChange={handleFilterChange}
                  />
                </div>
                
                {isLoggedIn && accountType === 'Administrador' && (
                  <div>
                    <label htmlFor="inputEmpresa">Nombre Empresa o NIT</label>
                    <div className="inputSearchContainer">
                      <input
                        type="text"
                        id="inputEmpresa"
                        placeholder="Escriba el nombre o el NIT"
                        value={filter}
                        onChange={handleFilterChange}
                      />
                    </div>
                  </div>
                )}
          

                <label>Estado</label>
                <div className="statusButtons">
                  <button
                    className={`inactive ${selectedState.inactivo ? "selected" : ""}`}
                    onClick={() =>
                      setSelectedState((prev) => ({ ...prev, inactivo: !prev.inactivo }))
                    }
                  >
                    Inactivos
                  </button>
                  <button
                    className={`active ${selectedState.activo ? "selected" : ""}`}
                    onClick={() =>
                      setSelectedState((prev) => ({ ...prev, activo: !prev.activo }))
                    }
                  >
                    Activos
                  </button>
                </div>
              </div>
              <button className="btn_createEmploye" onClick={showModalCreateEmploye}>
                Agregar Empleado
              </button>
            </div>

            <div className="containerGestionsEmployeResults">
              {filteredEmployes.length > 1 && (
                <button className="arrow-results left" onClick={prev}>
                  ❮
                </button>
              )}

              <div className="carousel-container_2-results">
                <div className="carousel-track-results">
                  {filteredEmployes.length === 0 ? (
                    <p className="no-results">No hay resultados</p>
                  ) : filteredEmployes.length === 1 ? (
                    <div className="carousel-card-results card-center">
                      <img
                        src={getImageSrcFromBase64(filteredEmployes[0]?.foto_perfil)}
                        alt="Employe"
                        className="carousel-image-results"
                      />
                    </div>
                  ) : filteredEmployes.length === 2 ? (
                    [0].map((offset) => {
                      const index = (current + offset) % filteredEmployes.length;
                      const Employe = filteredEmployes[index];
                      return (
                        <div className="carousel-card-results card-center" key={index}>
                          <img
                            src={getImageSrcFromBase64(Employe?.foto_perfil)}
                            alt="Employe"
                            className="carousel-image-results"
                          />

                        </div>
                      );
                    })
                  ) : (
                    [0, 1, 2].map((offset) => {
                      const index = (current + offset) % filteredEmployes.length;
                      const Employe = filteredEmployes[index];
                      let positionClass = offset === 1 ? "card-center" : "card-side";
                      return (
                        <div className={`carousel-card-results ${positionClass}`} key={index}>
                          <img
                            src={getImageSrcFromBase64(Employe?.foto_perfil)}
                            alt="Employe"
                            className="carousel-image-results"
                          />

                        </div>
                      );
                    })
                  )}
                </div>

                {filteredEmployes.length > 0 && (
                  <div className="instructor-info">
                    <h3>
                      {filteredEmployes[(current + 1) % filteredEmployes.length]?.nombres}{" "}
                      {filteredEmployes[(current + 1) % filteredEmployes.length]?.apellidos}
                    </h3>
                    <p>
                      {filteredEmployes[(current + 1) % filteredEmployes.length]?.titulo_profesional}
                    </p>
                    <button
                      className="profile-btn"
                      onClick={() =>
                        showModalSeeProfile(
                          filteredEmployes[(current + 1) % filteredEmployes.length]
                        )
                      }
                    >
                      Ver perfil
                    </button>
                  </div>
                )}
              </div>

              {filteredEmployes.length > 1 && (
                <button className="arrow-results right" onClick={next}>
                  ❯
                </button>
              )}
            </div>
          </div>
        </div>
      </Main>
      {selectedEmploye && <UpdateEmploye empleado={selectedEmploye} />}
      <Footer />
    </>
  );
};