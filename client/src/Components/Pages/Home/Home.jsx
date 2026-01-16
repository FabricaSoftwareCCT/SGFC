import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // Importar useNavigate para redirigir
import "./Home.css";
import { Modal_SignUp } from "../../UI/Modal_SignUp/Modal_SignUp";
import { Main } from "../../Layouts/Main/Main";
import { Footer } from "../../Layouts/Footer/Footer";

export const Home = ({ handleShowSignUp }) => {
  const location = useLocation();
  const navigate = useNavigate(); // Hook para redirigir al usuario
  const accountType = location.state?.accountType || "Desconocido"; // Obtén el tipo de cuenta
  const accountTypeInstructor = "Instructor"; // Define el tipo de cuenta del instructor
  const [showSignUp, setShowSignUp] = useState(false);
  const [showAccountType, setShowAccountType] = useState(false);

  const handleLogout = () => {
    // Eliminar la información de la sesión del usuario
    localStorage.removeItem("userSession"); // Si usas localStorage
    sessionStorage.removeItem("userSession"); // Si usas sessionStorage

    // Recargar la página para reiniciar el estado
    window.location.reload();
  };

  const showModalSignUp = () => {
    setShowSignUp(true);
  };

  return (
    <>
      <Main>
        <div className="container_home">
          <h2>
            Bienvenido a tu cuenta de <span className="complementary">formación complementaria</span>
          </h2>
          <p>Tipo de cuenta: <strong>{accountType}</strong></p>
          
          <div className="home-buttons">
            <button className="close_session" onClick={handleLogout}>
              Cerrar sesión
            </button>
            
            {accountType === "Administrador" && (
              <button
                className="createInstructor"
                onClick={() => handleShowSignUp(accountTypeInstructor)}
              >
                Crear Instructor
              </button>
            )}
          </div>
        </div>
      </Main>
      <Footer />

      {showSignUp && (
        <Modal_SignUp 
          accountType={accountTypeInstructor}
          setShowSignUp={setShowSignUp}
          setShowAccountType={setShowAccountType}
          setShowSignIn={() => {}}
        />
      )}
    </>
  );
};