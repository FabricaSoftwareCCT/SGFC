import "./Modal_SignIn.css";
import React, { useState } from "react";
import seePassword from "../../../assets/Icons/seePassword.png";
import hidePassword from "../../../assets/Icons/hidePassword.png";
import ilustration_03 from "../../../assets/Ilustrations/ilusatration_03.svg";
import companyGreen from "../../../assets/Icons/companyGreen.png";
import companyGrey from "../../../assets/Icons/companyGrey.png";
import userGreen from "../../../assets/Icons/userGreen.png";
import userGrey from "../../../assets/Icons/userGrey.png";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';
import { useModal } from "../../../Context/ModalContext";
import { ForgotPassword } from "../../Pages/ForgotPassword/ForgotPassword";
import { ResquestNewEmail } from "../../UI/RequestNewEmail/ResquestNewEmail";
import axiosInstance from "../../../config/axiosInstance";
import Loader from "../Loader/Loader";
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css'

export const Modal_SignIn = () => {
  const {
    showSignIn,
    setShowSignIn,
    setShowSignUp,
    setShowModalGeneral,
    setModalGeneralContent,
    setSelectedAccountType,
  } = useModal();

  const [showPassword, setShowPassword] = useState(false);
  const [loginnig, setLoginning] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberSession, setRememberSession] = useState(false);
  const [hoveredButton, setHoveredButton] = useState("");
  const navigate = useNavigate();


  const closeModalSignIn = () => setShowSignIn(false);

  const handleShowSignUp = (accountType) => {
    setSelectedAccountType(accountType);
    setShowSignUp(true);
    setShowModalGeneral(false);
    setShowSignIn(false);
    setHoveredButton("");
  };

  const showModalAccountType = () => {
    setShowSignIn(false);
    setShowModalGeneral(true);
    setModalGeneralContent(
      <>
        <p>Por favor seleccione el tipo de cuenta que desea crear</p>
        <div className="option_1Account">
          <p>Empresa</p>
          <button
            className={`container_AccountTypeEmpresa ${hoveredButton === "Empresa" ? "hovered" : ""}`}
            onClick={() => handleShowSignUp("Empresa")}
            onMouseEnter={() => setHoveredButton("Empresa")}
            onMouseLeave={() => setHoveredButton("")}
          >
            <img
              src={hoveredButton === "Empresa" ? companyGrey : companyGreen}
              alt="Empresa"
            />
          </button>
        </div>
        <div className="option_2Account">
          <p>Aprendiz</p>
          <button
            className={`container_AccountTypeAprendiz ${hoveredButton === "Aprendiz" ? "hovered" : ""}`}
            onClick={() => handleShowSignUp("Aprendiz")}
            onMouseEnter={() => setHoveredButton("Aprendiz")}
            onMouseLeave={() => setHoveredButton("")}
          >
            <img
              src={hoveredButton === "Aprendiz" ? userGrey : userGreen}
              alt="Aprendiz"
            />
          </button>
        </div>
      </>
    );
  };

  const showModalForgotPassword = () => {
    setShowSignIn(false);
    setShowModalGeneral(true);
    setModalGeneralContent(<ForgotPassword />);
  };

   const showModalRequestNewEmail = () => {
        setShowSignIn(false);
        setShowModalGeneral(true);
        setModalGeneralContent(<ResquestNewEmail />);
      };

  const login = (event) => {
    event.preventDefault();
    setLoginning(true);

    axiosInstance.post("api/users/login", { email, password, remember: rememberSession })
      .then(async (response) => {
        // Guardar sesión
        const sessionData = {
          accountType: response.data.accountType,
          email: email,
          id: response.data.id,
        };
        // Si es empresa, guarda también empresa_ID
        if (response.data.accountType === "Empresa" && response.data.empresa_ID) {
          sessionData.empresa_ID = response.data.empresa_ID;
        }
        sessionStorage.setItem("userSession", JSON.stringify(sessionData));

        // Esperar 1 segundo antes de verificar perfil
        setTimeout(async () => {
          try {
            // Verificar si el perfil está completo
            const profileCheck = await axiosInstance.get("/api/users/check-profile")
              .catch(error => {
                // Si hay error 404, el endpoint no existe - redirigir al home
                if (error.response?.status === 404) {
                  console.log("Endpoint check-profile no disponible, redirigiendo al home");
                  return { data: { isComplete: true } }; // Asumir perfil completo
                }
                throw error;
              });
            
            if (!profileCheck.data.isComplete) {
              // Perfil incompleto - redirigir a MiProfile
              closeModalSignIn();
              navigate("/MiProfile", { 
                state: { 
                  userId: response.data.id,
                  requiresCompletion: true,
                  missingFields: profileCheck.data.missingFields 
                }
              });
            } else {
              // Perfil completo - redirigir al home
              closeModalSignIn();
              navigate("/", {
                state: { accountType: response.data.accountType },
              });
            }
          } catch (error) {
            console.error("Error verificando perfil:", error);
            // En caso de error, redirigir al home por defecto
            closeModalSignIn();
            navigate("/", {
              state: { accountType: response.data.accountType },
            });
          } finally {
            setLoginning(false); // apagar loader al final
          }
        }, 1000);
      })
      .catch((error) => {
        if (error.response?.status === 400) {
 Swal.fire({
            icon: 'error',
            title: 'Error de autenticación',
            text: 'Usuario o contraseña incorrectos',
            confirmButtonText:"Aceptar",
            confirmButtonColor:"#00843d",
            theme:"bulma",
              customClass:{
						confirmButton: 'centered-swal-button'
					}
    });
        } else if (error.response?.status === 403) {
            Swal.fire({
              icon:"error",
              title:"Verificar cuenta",
              text:"Por favor verifica tu correo antes de iniciar sesión",
              confirmButtonText:"Okay",
              confirmButtonColor:"#d33",
              theme:"bulma",
              customClass: {
                actions: 'swal2-center-actions'
                }

            })
        } else {
            Swal.fire({
              icon:"error",
              title:"Error al iniciar sesión",
              text:"Ocurrió un error al iniciar sesión",
              confirmButtonText:"Okay",
              confirmButtonColor:"#d33",
              theme:"bulma",
                  customClass: {
                    actions: 'swal2-center-actions'
                }
            })
          }
        setLoginning(false); // en caso de error también apagar loader
      });
  };


  const handleGoogleResponse = async (response) => {
    const idToken = response.credential;
    setLoginning(true);

    try {
      const res = await fetch("http://localhost:3001/api/users/auth/googleSignIn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
        credentials: 'include' 
      });

      const data = await res.json();
      console.log(data)

      if (res.ok && data.success) {
        sessionStorage.setItem("userSession", JSON.stringify({
          googleId: data.user.googleId,
          accountType: data.user.accountType,
          email: data.user.email,
          empresa_ID: data.user.empresa_ID || null,
          id: data.user.ID,
        }));
        
        // Verificar perfil después de login con Google
        setTimeout(async () => {
          try {
            const profileCheck = await axiosInstance.get("/api/users/check-profile")
              .catch(error => {
                if (error.response?.status === 404) {
                  console.log("Endpoint check-profile no disponible, redirigiendo al home");
                  return { data: { isComplete: true } };
                }
                throw error;
              });
            
            if (!profileCheck.data.isComplete) {
              closeModalSignIn();
              navigate("/MiProfile", { 
                state: { 
                  userId: data.user.ID,
                  requiresCompletion: true,
                  missingFields: profileCheck.data.missingFields 
                }
              });
            } else {
              closeModalSignIn();
              navigate('/', { state: { accountType: data.user.accountType } });
            }
          } catch (error) {
            console.error("Error verificando perfil Google:", error);
            closeModalSignIn();
            navigate('/', { state: { accountType: data.user.accountType } });
          } finally {
            setLoginning(false);
          }
        }, 1000);
      } else {
        alert(data.message || 'Error en el inicio de sesión con Google');
        setLoginning(false);
      }
    } catch (error) {
  console.error("Error verificando perfil Google:", error);
  
  Swal.fire({
    icon: 'error',
    title: 'Error del sistema',
    text: 'Ocurrió un error al verificar el perfil de Google',
    confirmButtonText:"Okay",
    confirmButtonColor:"#d33",
    theme:"bulma",
      customClass: {
        actions: 'swal2-center-actions'
        }
  });
      setLoginning(false);
    }
  };

  if (!showSignIn) return null;
  if (loginnig) return <Loader />;

  return (
    <div id="container_signIn">
      <div className="modalSignIn">
        <div className="option_signUp">
          <div className="logo">SGFC</div>
          <h3>¿Aún no tienes cuenta?</h3>
          <p>Regístrate como Empresa o como Aprendiz y empieza a disfrutar de todos nuestros servicios.</p>
          <button className="goTo_register" onClick={showModalAccountType}>
            Registrarse
          </button>
          <img src={ilustration_03} alt="Ilustración" />
        </div>

        <div className="container_form_signIn">
          <div className="container_triangles_01_login">
            <div className="triangle_01"></div>
            <div className="triangle_02"></div>
            <div className="triangle_03"></div>
          </div>

          <div className="content_createAccount">
            <h2 className="title_signIn">
              Iniciar<span className="title2_signIn"> Sesión</span>
            </h2>
            <form className="form_register">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="Correo electrónico"
              />
              <div className="password-container">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                />
                <img
                  src={showPassword ? seePassword : hidePassword}
                  alt="Toggle Password"
                  className="password-icon"
                  onClick={() => setShowPassword(!showPassword)}
                />
              </div>

              <div className="remember-session">
                <input
                  type="checkbox"
                  id="rememberSession"
                  checked={rememberSession}
                  onChange={(e) => setRememberSession(e.target.checked)}
                />
                <label htmlFor="rememberSession">Recordar sesión</label>
              </div>

              <button className="button_register" onClick={login}>
                Iniciar sesión
              </button>
              <p className="otherOption">o</p>
              <div className="google-login-container">
                <GoogleLogin
                  onSuccess={handleGoogleResponse}
                  onError={() => alert('Error al iniciar sesión con Google')}
                  theme="filled_black"
                  size="large"
                  text="signin_with"
                  shape="rectangular"
                  width="270"
                  locale="es"
                />
              </div>
            </form>
            <button
              type="button"
              className="forgetPassword"
              onClick={showModalForgotPassword}
              style={{
                background: "none",
                border: "none",
                color: "#00843e",
                cursor: "pointer",
                padding: 0,
              }}
            >
              ¿Olvidó su contraseña?
            </button>
            <button
              type="button"
              className="forgetPassword"
              onClick={showModalRequestNewEmail}
              style={{
                background: "none",
                border: "none",
                color: "#00843e",
                cursor: "pointer",
                padding: 0,
              }}
            >
              ¿No llego su correo de verificación o expiro?
            </button>
          </div>

          <div className="container_triangles_02_login">
            <div className="triangle_01"></div>
            <div className="triangle_02"></div>
            <div className="triangle_03"></div>
          </div>
        </div>

        <div className="container_return_signIn">
          <h5 onClick={closeModalSignIn} style={{ cursor: "pointer" }}>
            Volver
          </h5>
          <button onClick={closeModalSignIn} className="closeModal"></button>
        </div>
      </div>
    </div>
  );
};