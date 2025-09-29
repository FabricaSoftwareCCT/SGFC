import React, { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import cloudUpload from "../../../assets/Icons/cloud-upload.png";
import "./modalSignature.css";

export const ModalSignature = ({ children, closeModal, className, editar, nombreActa, tipoActa, onSignature, onUpload }) => {
    const sigCanvas = useRef();
    const [uploadedFileName, setUploadedFileName] = useState("");
    const [firmaDigital, setFirmaDigital] = useState("");
    const [firmaArchivo, setFirmaArchivo] = useState(null);
    console.log(tipoActa);

    const clearSignature = () => {
        sigCanvas.current.clear();
        setFirmaDigital("");
        if (onSignature) onSignature("");
    };

    const saveSignature = () => {
        if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
            const canvas = sigCanvas.current.getCanvas();
            const dataUrl = canvas.toDataURL("image/png");
            setFirmaDigital(dataUrl);
            if (onSignature) onSignature(dataUrl);
        }
    };

    const handleUpload = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setUploadedFileName(file.name);
            setFirmaArchivo(file);
            if (onUpload) onUpload(file);
        }
    };

    // ✅ Función simplificada - solo aplica la firma al documento
    const handleApplySignature = () => {
        // si no se está editada el acta cerrar modal
        if (!editar) {
            alert('Primero editar el documento, para luego aplicar la firma.');
            closeModal();
        } else if (firmaDigital || firmaArchivo) {
            alert('¡Firma aplicada correctamente al documento!');
            closeModal();
        } else {
            alert('Por favor, firme o suba una imagen de firma primero.');
        }
    };

    return (
        <div id="container_modalGeneral" style={{ display: 'flex' }}>
            <div className={`signature-modal ${className || ''}`}>
                <div className="signature-triangles-1">
                    <div className="signature-triangle-1"></div>
                    <div className="signature-triangle-2"></div>
                    <div className="signature-triangle-3"></div>
                </div>
                <div className="signature-triangles-2">
                    <div className="signature-triangle-1"></div>
                    <div className="signature-triangle-2"></div>
                    <div className="signature-triangle-3"></div>
                </div>
                <div className="signature-return">
                    <h5 onClick={closeModal} style={{ cursor: "pointer" }}>Volver</h5>
                    <button onClick={closeModal} className="signature-close"></button>
                </div>
                <div className="signature-info">
                    <h2 className="signature-title">Agregar firma</h2>
                    <h3 className="signature-title">{nombreActa}Acta#1</h3>
                    <h4 className="signature-type">{tipoActa}</h4>
                    <div className="signature-container">
                        <span className="signature-label">Firme aquí:</span>
                        <div className="signature-area">
                            <SignatureCanvas
                                ref={sigCanvas}
                                penColor="#000000ff"
                                canvasProps={{ width: 350, height: 120, className: 'sigCanvas' }}
                                onEnd={saveSignature}
                            />
                            <button onClick={clearSignature} className="signature-clear-btn"></button>
                        </div>
                    </div>
                    <div className="signature-upload-section">
                        <span className="signature-upload-text">o <br /> subir firma</span>
                        <label htmlFor="firma-upload" className="signature-upload-label">
                            <img src={cloudUpload} alt="Subir firma" className="signature-upload-icon" />
                            <input
                                id="firma-upload"
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleUpload}
                            />
                        </label>
                        {uploadedFileName && (
                            <span className="uploaded-file-name">{uploadedFileName}</span>
                        )}
                        <div className="container-button-firmar">
                            {/* ✅ Botón simplificado */}
                            <button className="submit-button-proceedings-firmar" onClick={handleApplySignature}>
                                Aplicar Firma
                            </button>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
};