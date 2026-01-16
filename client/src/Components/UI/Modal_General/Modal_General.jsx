import React from "react";
import "./Modal_General.css";

export const Modal_General = ({ children, closeModal, className }) => {


  return (
    <div id="container_modalGeneral" style={{ display: 'flex' }}>
      <div className={`modalGeneral ${className || ''}`}>
        <div className="container_triangles_01">
          <div className="triangle_01"></div>
          <div className="triangle_02"></div>
          <div className="triangle_03"></div>
        </div>

        <div className="container_triangles_02">
          <div className="triangle_01"></div>
          <div className="triangle_02"></div>
          <div className="triangle_03"></div>
        </div>

        <div className="container_return_general">
          <h5 onClick={closeModal} style={{ cursor: "pointer" }}>Volver</h5>
          <button onClick={closeModal} className="closeModal"></button>
        </div>

        <div className="container_informationGeneral">
          {children}
        </div>
      </div>
    </div>
  );
};