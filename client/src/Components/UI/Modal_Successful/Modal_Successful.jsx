import React from "react";
import "./Modal_Successful.css";
import sucessfull from "../../../assets/Ilustrations/Sucessfull.svg";
import puzzle_green from "../../../assets/Ilustrations/Puzzle_green.svg";

export const Modal_Successful = ({ children }) => {
  return (
    <div id="container_modalSucessfull">
      <div className="modalSuccefull">
        <div className="container_triangles_01_sucessfull">
          <div className="triangle_01"></div>
          <div className="triangle_02"></div>
          <div className="triangle_03"></div>
        </div>

        <div className="container_triangles_02_sucessfull">
          <div className="triangle_01"></div>
          <div className="triangle_02"></div>
          <div className="triangle_03"></div>
        </div>

        <img className="background_sucessfull" src={sucessfull} alt="" />
        
        <img className="puzzle_green" src={puzzle_green} alt="" />
        <h2>¡Woo, Hoo!</h2>

        <div className="container_informationGeneral_sucessfull">
         {children}
        </div>
      </div>
    </div>
  );
};