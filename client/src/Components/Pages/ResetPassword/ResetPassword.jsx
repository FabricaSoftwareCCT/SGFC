import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../../../config/axiosInstance";
import "./ResetPassword.css";
import seePassword from "../../../assets/Icons/seePassword.png";
import hidePassword from "../../../assets/Icons/hidePassword.png";
import axios from "axios";

export const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    number: false,
    specialChar: false,
  });
  const [showPassword, setShowPassword] = useState(false); // Estado para controlar la visibilidad de la nueva contraseña
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Estado para controlar la visibilidad de la confirmación de contraseña
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(null); // Estado para determinar si la operación fue exitosa

  // Actualiza los requisitos de la contraseña en tiempo real
  useEffect(() => {
    setPasswordRequirements({
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      number: /\d/.test(newPassword),
      specialChar: /[@$!%*?&]/.test(newPassword),
    });
  }, [newPassword]);

  const handleSubmit = (event) => {
    event.preventDefault();
  
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get("token");
  
    // Validar que las contraseñas coincidan
    if (newPassword !== confirmPassword) {
      setMessage("Las contraseñas no coinciden.");
      setIsSuccess(false);
      return;
    }
  
    axiosInstance.post(`/api/users/resetPassword?token=${token}`, {
      newPassword,
    })
      .then((response) => {
        setMessage(response.data.message);
        setIsSuccess(true);
        setTimeout(() => navigate("/"), 3000); // Redirigir al inicio después de 3 segundos
      })
      .catch((error) => {
        setMessage(
          error.response?.data?.message || "Error al restablecer la contraseña."
        );
        setIsSuccess(false);
      });
  };
  
  // Verificar si todos los requisitos de la contraseña están cumplidos
  const allRequirementsMet =
    passwordRequirements.length &&
    passwordRequirements.uppercase &&
    passwordRequirements.number &&
    passwordRequirements.specialChar;

  return (
    <div id="reset-password-container">
      <div className="container_form_forgotPassword">
        <div className="container_triangles_01">
          <div className="triangle_01"></div>
          <div className="triangle_02"></div>
          <div className="triangle_03"></div>
        </div>

        <div className="container_triangles_02_forgot">
          <div className="triangle_01"></div>
          <div className="triangle_02"></div>
          <div className="triangle_03"></div>
        </div>

        <div className="container_return2">
          <h5>Volver</h5>
          <button onClick={() => navigate("/")} className="closeModal"></button>
        </div>

        <div className="container_informationResetPassword">
          <h2 className="title_forgotPassword">
            Nueva<span className="title2_signIn"> Contraseña</span>
          </h2>
          <form onSubmit={handleSubmit}>
            <p>Por favor ingrese la nueva contraseña.</p>
            <div className="password-container">
              <input
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                type={showPassword ? "text" : "password"} // Alternar entre "text" y "password"
                placeholder="Nueva contraseña"
              />
              <img
                src={showPassword ? seePassword : hidePassword} // Cambia el icono
                alt="Toggle Password"
                className="password-icon"
                onClick={() => setShowPassword(!showPassword)} // Alterna la visibilidad
              />
            </div>
            {/* Mostrar los requisitos de la contraseña si no se cumplen todos */}
            {!allRequirementsMet && (
              <ul className="password-requirements_resetPassword ">
                <li
                  className={
                    passwordRequirements.length ? "valid" : "invalid"
                  }
                >
                  Al menos 8 caracteres
                </li>
                <li
                  className={
                    passwordRequirements.uppercase ? "valid" : "invalid"
                  }
                >
                  Al menos una letra mayúscula
                </li>
                <li
                  className={
                    passwordRequirements.number ? "valid" : "invalid"
                  }
                >
                  Al menos un número
                </li>
                <li
                  className={
                    passwordRequirements.specialChar ? "valid" : "invalid"
                  }
                >
                  Al menos un carácter especial (@$!%*?&)
                </li>
              </ul>
            )}

            {/* Mostrar el input de confirmar contraseña solo si se cumplen todos los requisitos */}
            {allRequirementsMet && (
              <>
                <div className="confirmPassword-container">
                  <input
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    type={showConfirmPassword ? "text" : "password"} // Alternar entre "text" y "password"
                    placeholder="Confirmar contraseña"
                  />
                  <img
                    src={showConfirmPassword ? seePassword : hidePassword} // Cambia el icono
                    alt="Toggle Password"
                    className="password-icon"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)} // Alterna la visibilidad
                  />
                </div>

                {/* Mostrar el botón solo si se cumplen todos los requisitos */}
                <button type="submit">Cambiar contraseña</button>
              </>
            )}
          </form>
          {message && (
            <p
              className="result_forgotPassword"
              style={{
                backgroundColor: isSuccess ? "#00843e7c" : "#e5383596",
                width: "60%",
                height: "auto",
                fontSize: "12px",
                position: "relative",
                bottom: "22rem",
                padding: "5px",
              }}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};