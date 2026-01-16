import React from "react";
import "./NoAutorizado.css";

export const NoAutorizado = () => {
  return (
    <div className="no-autorizado-container">
      <div className="no-autorizado-content">
        <div className="icon-container">
          <svg className="lock-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z" />
          </svg>
        </div>
        <h1 className="title">Acceso Denegado</h1>
        <p className="message">
          No tienes permisos para acceder a esta página.
        </p>
        <p className="subtitle">
          Si crees que esto es un error, contacta al administrador del sistema.
        </p>
        <button className="back-button" onClick={() => window.history.back()}>
          Volver Atrás
        </button>
      </div>
    </div>
  );
};
