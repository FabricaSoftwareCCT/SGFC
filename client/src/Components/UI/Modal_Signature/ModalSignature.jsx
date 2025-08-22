import React, { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import cloudUpload from "../../../assets/Icons/cloud-upload.png";
import "./modalSignature.css";
import axiosInstance from '../../../config/axiosInstance';

export const ModalSignature = ({ children, closeModal, className, nombreActa, tipoActa, onSignature, onUpload }) => {
    const sigCanvas = useRef();
    const [uploadedFileName, setUploadedFileName] = useState("");

    const clearSignature = () => {
        sigCanvas.current.clear();
        if (onSignature) onSignature("");
    };

    const saveSignature = () => {
        if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
            const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");
            if (onSignature) onSignature(dataUrl);
        }
    };

    const handleUpload = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setUploadedFileName(file.name);
            if (onUpload) onUpload(file);
        }
    };

    // Enviar la firma al backend
    const handleSendSignature = async () => {
        try {
            const formData = new FormData();
            if (firmaArchivo) {
                formData.append('firma', firmaArchivo);
            } else if (firmaDigital) {
                // Si la firma es una imagen en base64, conviértela a blob
                const res = await fetch(firmaDigital);
                const blob = await res.blob();
                formData.append('firma', blob, 'firma.png');
            } else {
                alert('No hay firma para enviar.');
                return;
            }
            // Puedes agregar más datos si es necesario (por ejemplo, tipoActa, nombreCurso, etc.)
            // formData.append('tipoActa', tipoActa);
            // formData.append('nombreCurso', nombreCurso);

            await axiosInstance.post('/api/signature/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('¡Firma enviada correctamente!');
        } catch (error) {
            alert('Error al enviar la firma.');
            console.error(error);
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
                                penColor="#00843d"
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
                            <input id="firma-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
                        </label>
                        {uploadedFileName && (
                            <span className="uploaded-file-name">{uploadedFileName}</span>
                        )}
                        <div className="container-button-firmar">
                        <button className="submit-button-proceedings-firmar" onClick={handleSendSignature}>Firmar</button>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
};