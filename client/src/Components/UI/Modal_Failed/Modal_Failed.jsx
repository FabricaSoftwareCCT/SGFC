import React from "react";
import "./Modal_Failed.css";
import failed from "../../../assets/Ilustrations/Failed.svg";
import puzzle_red from "../../../assets/Ilustrations/Puzzle_red.svg";

export const Modal_Failed = ({ children }) => {
  return (
    <div id="container_modalFailed">
      <div className="modalFailed">
        <div className="container_triangles_01_failed">
          <div className="triangle_01"></div>
          <div className="triangle_02"></div>
          <div className="triangle_03"></div>
        </div>

        <div className="container_triangles_02_failed">
          <div className="triangle_01"></div>
          <div className="triangle_02"></div>
          <div className="triangle_03"></div>
        </div>

        <img className="background_failed" src={failed} alt="" />
        
        <img className="puzzle_red" src={puzzle_red} alt="" />
        <h2>¡Oh, no!</h2>
        <div className="container_informationGeneral_failed">
         {children}
        </div>
      </div>
    </div>
  );
};