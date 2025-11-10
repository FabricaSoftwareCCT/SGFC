import React, { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import cloudUpload from "../../../assets/Icons/cloud-upload.png";
import "./modalSignature.css";
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css'

export const ModalSignature = ({ children, closeModal, className, editar, nombreActa, tipoActa, participanteSeleccionado, onSignature, onUpload }) => {
    const sigCanvas = useRef();
    const [uploadedFileName, setUploadedFileName] = useState("");
    const [firmaDigital, setFirmaDigital] = useState("");
    const [firmaArchivo, setFirmaArchivo] = useState(null);
    console.log(tipoActa);

    const clearSignature = () => {
        sigCanvas.current.clear();
        setFirmaDigital("");
        setFirmaArchivo(null);
        setUploadedFileName("");
        // NO aplicar automáticamente - solo limpiar el canvas
    };

    const saveSignature = () => {
        if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
            const canvas = sigCanvas.current.getCanvas();
            const dataUrl = canvas.toDataURL("image/png");
            setFirmaDigital(dataUrl);
            // NO aplicar automáticamente - esperar hasta que presione "Aplicar firma"
        }
    };

    const handleUpload = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setUploadedFileName(file.name);
            setFirmaArchivo(file);
            // Convertir archivo a data URL para consistencia pero NO aplicar automáticamente
            const reader = new FileReader();
            reader.onload = (event) => {
                setFirmaDigital(event.target.result);
                // NO aplicar automáticamente - esperar hasta que presione "Aplicar firma"
            };
            reader.readAsDataURL(file);
        }
    };

    // ✅ Función simplificada - solo aplica la firma al documento cuando presiona el botón
    const handleApplySignature = () => {
        // si no se está editada el acta cerrar modal
       if (!editar) {
    Swal.fire({
        icon: 'warning',
        title: 'Acción requerida',
        text: 'Primero edite el documento, para luego aplicar la firma.',
        theme:"bulma",
        customClass: {
            popup: 'bulma-swal',
            confirmButton: 'button is-warning'
        },
        buttonsStyling: false,
        confirmButtonText: 'Entendido'
    }).then(() => {
        closeModal();
    });
} else if (firmaDigital) {
    // Aplicar la firma solo cuando presiona el botón
    if (onSignature) onSignature(firmaDigital);
    
    Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: '¡Firma aplicada correctamente al documento!',
        theme:"bulma",
        customClass: {
            popup: 'bulma-swal',
            confirmButton: 'button is-success'
        },
        buttonsStyling: false,
        confirmButtonText: 'Aceptar'
    }).then(() => {
        closeModal();
    });
} else {
    Swal.fire({
        icon: 'error',
        title: 'Firma requerida',
        text: 'Por favor, firme o suba una imagen de firma primero.',
        theme:"bulma",
        customClass: {
            popup: 'bulma-swal',
            confirmButton: 'button is-danger'
        },
        buttonsStyling: false,
        confirmButtonText: 'Entendido'
    });
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
                    {participanteSeleccionado && (
                        <div style={{ 
                            backgroundColor: '#f8f9fa', 
                            padding: '10px', 
                            borderRadius: '5px', 
                            marginBottom: '15px',
                            border: '1px solid #dee2e6',
                            color: '#333333'
                        }}>
                            <strong style={{ color: '#333333' }}>Participante:</strong> <span style={{ color: '#333333' }}>{participanteSeleccionado.nombre}</span>
                        </div>
                    )}
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