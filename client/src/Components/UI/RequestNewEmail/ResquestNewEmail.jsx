import React, { useState, useEffect } from "react";
import Axios from "axios";
import "./ResquestNewEmail.css";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../config/axiosInstance";
import { useModal } from "../../../Context/ModalContext";

export const ResquestNewEmail = () => {
    const { setShowModalGeneral } = useModal();
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(null); // Estado para determinar si el mensaje es exitoso o no
    const navigate = useNavigate(); // Hook para redirigir al usuario

    const handleSubmit = (event) => {
        event.preventDefault();

        axiosInstance.post("/api/users/requestNewVerificationEmail", { email })
            .then((response) => {
                setMessage(response.data.message);
                setIsSuccess(true); // Indicar que el mensaje es exitoso
            })
            .catch((error) => {
                setMessage(
                    error.response?.data?.message || "Error al solicitar la recuperación de contraseña."
                );
                setIsSuccess(false); // Indicar que hubo un error
            });
    };

    // Redirigir al usuario después de 3 segundos si el mensaje fue exitoso
    useEffect(() => {
        if (isSuccess) {
            const timer = setTimeout(() => {
                navigate("/"); // Redirigir a la página de inicio
            }, 3000);

            return () => clearTimeout(timer); // Limpiar el temporizador si el componente se desmonta
        }
    }, [isSuccess, navigate]);

    return (
        <div id="forgot-password-container">
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

                <div className="container_return">
                    <a onClick={() => setShowModalGeneral(false)} className="text-return">Volver</a>
                    <button onClick={() => setShowModalGeneral(false)} className="closeModal"></button>               
                </div>

                <div className="container_informationForgotPassword">
                    <h2 className="title_forgotPassword">
                        Correo de<span className="title2_signIn"> Verificación</span>
                    </h2>
                    <form onSubmit={handleSubmit}>
                        <p>Por favor ingrese el correo electrónico con el que se registró.</p>
                        <input
                            type="email"
                            placeholder="Ingrese el correo electrónico"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <button type="submit">Enviar enlace de verificación</button>
                    </form>
                    {message && (
                        <p
                            className="result_forgotPassword"
                            style={{
                                backgroundColor: isSuccess ? "#00843e7c" : "#e5383596",
                                width: " 60%",
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