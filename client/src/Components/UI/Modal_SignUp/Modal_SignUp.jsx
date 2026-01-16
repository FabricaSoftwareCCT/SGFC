import React, { useState, useEffect } from "react";
import "./Modal_SignUp.css";
import ilustration_02 from "../../../assets/Ilustrations/SignUp.svg";
import seePassword from "../../../assets/Icons/seePassword.png";
import hidePassword from "../../../assets/Icons/hidePassword.png";
import axiosInstance from "../../../config/axiosInstance";
import { ResquestNewEmail } from "../../UI/RequestNewEmail/ResquestNewEmail"
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from "react-router-dom";
import { useModal } from "../../../Context/ModalContext"; // 👈 importa el hook del contexto
import Swal from "sweetalert2";
import 'sweetalert2/themes/bulma.css'

export const Modal_SignUp = ({ accountType }) => {
  const {
    setShowSignUp,
    setShowSignIn,
    setShowModalSuccesfull,
    setModalSuccesfullContent,
    setShowModalGeneral,
    setModalGeneralContent
  } = useModal(); // 👈 usa el contexto

  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    number: false,
    specialChar: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const showModalRequestNewEmail = () => {
      setShowSignUp(false);
      setShowModalGeneral(true);
      setModalGeneralContent(<ResquestNewEmail />);
    };

  useEffect(() => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  }, [accountType]);

  useEffect(() => {
    setPasswordRequirements({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      specialChar: /[@$!%*?&]/.test(password)
    });
  }, [password]);


  const registerUser = async (event) => {
    event.preventDefault();

    if (
      !passwordRequirements.length ||
      !passwordRequirements.uppercase ||
      !passwordRequirements.number ||
      !passwordRequirements.specialChar
    ) {
        Swal.fire({
        icon:"error",
        title:"Contraseña inválida",
        text:"La contraseña debe cumplir con todos los requisitos.",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#d33",
        theme:"bulma",
        customClass: {
    actions: 'swal2-center-actions'
  }
      })
      return;
    }

    if (password !== confirmPassword) {
            Swal.fire({
        icon: "error",
        title:"Contraseñas no coinciden",
        text:"Las contraseñas no coinciden",
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#d33",
                      theme:"bulma",
      customClass: { confirmButton: 'centered-swal-button' }
      })
      setPassword("");
      setConfirmPassword("");
      return;
    }

    try {
      const { API_URL } = await import('../../../config/env');
      const response = await fetch(`${API_URL}/api/users/createUser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          accountType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al registrar el usuario");
      }

      setShowSignUp(false);
      setShowModalGeneral(false);
      setShowModalSuccesfull(true);
      setModalSuccesfullContent(
        <>
          <h2>Registro exitoso</h2>
          <p>Hemos enviado un enlace de verificación a tu correo. Haz click en él para activar tu cuenta.</p>
        </>
      );
      setTimeout(() => {
        setShowModalSuccesfull(false);
        navigate('/', { state: { accountType } });
      }, 5000);

    } catch (error) {
      // console.error("Error en el registro:", error);
      Swal.fire({
        icon: "error",
        title: "Error en el registro",
        text: error.message || "Ocurrió un error al registrar el usuario",
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#d33",
                      theme:"bulma",
      customClass: { confirmButton: 'centered-swal-button' }
      });
    }
  };


  const closeModalSignUp = () => {
    setShowSignUp(false);
    setShowModalGeneral(true);
  };

  const showModalSignIn = () => {
    setShowSignUp(false);
    setShowModalGeneral(false);
    setShowSignIn(true);
  };

const handleGoogleResponse = async (response) => {
    const idToken = response.credential;

    try {
      const { API_URL: apiUrl } = await import('../../../config/env');
      const res = await fetch(`${apiUrl}/api/users/auth/googleSignUp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, accountType }), 
      });

      const data = await res.json();

      if (res.ok && data.success) {
        sessionStorage.setItem("userSession", JSON.stringify({
          googleId: data.user.googleId,
          accountType: data.user.accountType,
          email: data.user.email,
        }));

        setShowSignUp(false);
        setShowModalSuccesfull(true);
        setModalSuccesfullContent(
          <>
            <h2>Registro exitoso</h2>
            <p>Hemos enviado un enlace de verificación a tu correo. Haz click en él para activar tu cuenta.</p>
          </>
        );
        setTimeout(() => {
          setShowModalSuccesfull(false);
          navigate('/', { state: { accountType: data.user.accountType } });
        }, 5000);

      } else {
      Swal.fire({
          icon: "error",
          title: "Error en el registro",
          text: data.message || 'Error en el registro con Google',
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#d33",
                        theme:"bulma",
      customClass: { confirmButton: 'centered-swal-button' }
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: 'Error al conectar con el servidor',
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#d33",
                      theme:"bulma",
      customClass: { confirmButton: 'centered-swal-button' }
      });
    }
  };

  return (
    <>
      <div id="container_signUp" style={{ display: 'flex' }}>
        <div className="modalSignUp">
          <div className="container_form_register">
            <div className="container_triangles_01_register">
              <div className="triangle_01"></div>
              <div className="triangle_02"></div>
              <div className="triangle_03"></div>
            </div>

            <div className="content_createAccount">
              <h2>
                Crear<span className="title2_register"> Cuenta</span>
              </h2>
              <p className="accountType">{accountType}</p>{" "}
              {/* Muestra el tipo de cuenta */}
              <form className="form_register">
                <input
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  type="email"
                  placeholder="Correo electrónico"
                />
                <div className="password-container">
                  <input
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    type={showPassword ? "text" : "password"} // Alternar entre "text" y "password"                  placeholder="Contraseña"
                    placeholder="Contraseña"
                    onFocus={() => setIsPasswordFocused(true)} // Activa el estado al enfocar
                    onBlur={() => setIsPasswordFocused(false)} // Desactiva el estado al desenfocar
                  />
                  <img
                    src={showPassword ? seePassword : hidePassword} // Cambia el icono
                    alt="Toggle Password"
                    className="password-icon"
                    onClick={() => setShowPassword(!showPassword)} // Alterna la visibilidad
                  />
                </div>
                <div className="confirmPassword-container">
                  <input
                    value={confirmPassword}
                    onChange={event => setConfirmPassword(event.target.value)}
                    type={showConfirmPassword ? "text" : "password"} // Alternar entre "text" y "password"                  placeholder="Contraseña"
                    placeholder="Confirmar Contraseña"
                  />
                  <img
                    src={showConfirmPassword ? seePassword : hidePassword} // Cambia el icono
                    alt="Toggle Password"
                    className="password-icon"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)} // Alterna la visibilidad
                  />
                </div>
                {/* Muestra los requisitos solo si el input está activo */}
                {isPasswordFocused && (
                  <ul className="password-requirements">
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

                <button className="button_register" onClick={registerUser}>
                  Registrarse
                </button>
                <p className="otherOption">o</p>
                <div className="google-login-container">
                  <GoogleLogin
                    onSuccess={handleGoogleResponse}
                    onError={() => {
                      Swal.fire({
                        icon: "error",
                        title: "Error de registro",
                        text: "Error al registrarse con Google",
                        confirmButtonText: "Aceptar",
                        confirmButtonColor: "#d33",
                                      theme:"bulma",
      customClass: { confirmButton: 'centered-swal-button' }
                      });
                    }}
                    theme="filled_black"
                    size="large"
                    text="signup_with"
                    shape="rectangular"
                    width="270"
                    locale="es"
                  />
                </div>
            <button
              type="button"
              className="forgetPassword"
              onClick={showModalRequestNewEmail}
              style={{
                background: "none",
                border: "none",
                color: "#00843e",
                cursor: "pointer",
                padding: 5,
              }}
            >
              ¿No llego su correo de verificación o ya expiro?
            </button>
              </form>
            </div>

            <div className="container_triangles_02_register">
              <div className="triangle_01"></div>
              <div className="triangle_02"></div>
              <div className="triangle_03"></div>
            </div>
          </div>

          <div className="option_signIn">
            <div className="logo">SGFC</div>
            <h3>¿Ya tienes una cuenta?</h3>
            <p>Ingresa con tus credenciales para continuar.</p>
            <button className="goTo_SignIn" onClick={showModalSignIn}>
              Iniciar sesión
            </button>
            <img src={ilustration_02} alt="" />
          </div>

          <div className="container_return_signUp">
            <h5 onClick={closeModalSignUp} style={{ cursor: "pointer" }}>Volver</h5>
            <button onClick={closeModalSignUp} className="closeModal"></button>
          </div>
        </div>
      </div>
    </>
  );
};