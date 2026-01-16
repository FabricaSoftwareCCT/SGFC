import { createPortal } from "react-dom";
import "./Loader.css";

const Loader = () =>
  createPortal(
    <div className="loader-overlay">
      <div className="loader">
        <span className="loader-dot"></span>
        <span className="loader-dot"></span>
        <span className="loader-dot"></span>
      </div>
    </div>,
    document.body
  );

export default Loader;