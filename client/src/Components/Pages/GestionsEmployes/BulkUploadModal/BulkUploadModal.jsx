import React, { useState, useRef, useEffect } from 'react';
import './BulkUploadModal.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTimes,
    faFileExcel,
    faDownload,
    faUpload,
    faCheckCircle,
    faExclamationTriangle,
    faSpinner,
    faArrowLeft,
    faArrowRight,
    faEye,
    faEdit,
    faTrashAlt,
    faFileArrowDown,
    faFileLines,
    faFileCircleCheck,
    faUsers,
    faCloudArrowUp,
    faCircleCheck,
    faCircleXmark,
    faEnvelope
} from '@fortawesome/free-solid-svg-icons';
import * as XLSX from 'xlsx';
import axiosInstance from '../../../../config/axiosInstance';
import Swal from 'sweetalert2';

export const BulkUploadModal = ({ isOpen, onClose, empresaId }) => {
    const [step, setStep] = useState(1); // 1: Instrucciones, 2: Subir, 3: Vista previa, 4: Resultados
    const [file, setFile] = useState(null);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState(null);
    const [errors, setErrors] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);
    const [successCount, setSuccessCount] = useState(0);
    const [errorCount, setErrorCount] = useState(0);
    const [columnErrors, setColumnErrors] = useState([]);

    // Resetear estado cuando se cierra el modal
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setStep(1);
                setFile(null);
                setData([]);
                setLoading(false);
                setUploading(false);
                setResults(null);
                setErrors([]);
                setUploadProgress(0);
                setSuccessCount(0);
                setErrorCount(0);
                setColumnErrors([]);
            }, 300);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Función para descargar plantilla
    const downloadTemplate = () => {
        const templateData = [
            {
                nombres: "Juan",
                apellidos: "Pérez",
                email: "juan.perez@ejemplo.com",
                documento: "123456789",
                celular: "3001234567"
            },
            {
                nombres: "María",
                apellidos: "González",
                email: "maria.gonzalez@ejemplo.com",
                documento: "987654321",
                celular: "3107654321"
            },
            {
                nombres: "Carlos",
                apellidos: "Rodríguez",
                email: "carlos.rodriguez@ejemplo.com",
                documento: "456789123",
                celular: "3204567890"
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Aprendices");
        XLSX.writeFile(workbook, "plantilla_aprendices.xlsx");
    };

    // Función para manejar la selección de archivo
    const handleFileSelect = (event) => {
        const selectedFile = event.target.files[0];
        if (!selectedFile) return;

        // Validar tipo de archivo
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'application/excel',
            'application/x-excel',
            'application/x-msexcel'
        ];

        const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
        const isValidExtension = ['xlsx', 'xls'].includes(fileExtension);

        if (!validTypes.includes(selectedFile.type) && !isValidExtension) {
            Swal.fire({
                icon: 'error',
                title: 'Formato inválido',
                text: 'Por favor, sube un archivo Excel (.xlsx o .xls)',
                confirmButtonColor: '#3085d6',
            });
            return;
        }

        // Validar tamaño del archivo (máximo 10MB)
        if (selectedFile.size > 10 * 1024 * 1024) {
            Swal.fire({
                icon: 'error',
                title: 'Archivo muy grande',
                text: 'El tamaño máximo permitido es 10MB',
                confirmButtonColor: '#3085d6',
            });
            return;
        }

        setFile(selectedFile);
        readExcelFile(selectedFile);
    };

    // Función para arrastrar y soltar
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('drag-over');
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const droppedFile = files[0];
            const validTypes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel',
                'application/excel',
                'application/x-excel',
                'application/x-msexcel'
            ];
            const fileExtension = droppedFile.name.split('.').pop().toLowerCase();

            if (validTypes.includes(droppedFile.type) || ['xlsx', 'xls'].includes(fileExtension)) {
                // Validar tamaño
                if (droppedFile.size > 10 * 1024 * 1024) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Archivo muy grande',
                        text: 'El tamaño máximo permitido es 10MB',
                        confirmButtonColor: '#3085d6',
                    });
                    return;
                }
                setFile(droppedFile);
                readExcelFile(droppedFile);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Formato inválido',
                    text: 'Por favor, sube un archivo Excel (.xlsx o .xls)',
                    confirmButtonColor: '#3085d6',
                });
            }
        }
    };

    // Función para leer el archivo Excel
    const readExcelFile = (file) => {
        setLoading(true);
        setErrors([]);
        setColumnErrors([]);

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Verificar que tenga hojas
                if (workbook.SheetNames.length === 0) {
                    throw new Error('El archivo no contiene hojas');
                }

                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Convertir a JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    header: 1,
                    raw: false,
                    defval: ''
                });

                // Filtrar filas vacías y convertir a objetos
                const headers = jsonData[0];
                const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== ''));

                const processedData = rows.map(row => {
                    const obj = {};
                    headers.forEach((header, index) => {
                        if (header) {
                            // Normalizar nombre de columna (minúsculas, sin espacios)
                            const normalizedHeader = header.toString().toLowerCase().trim();
                            obj[normalizedHeader] = row[index] || '';
                        }
                    });
                    return obj;
                });

                // Validar datos
                validateData(processedData);

            } catch (error) {
                // console.error('Error al leer el archivo:', error);
                setErrors([{
                    message: 'Error al leer el archivo. Verifica que sea un Excel válido y que tenga datos en la primera hoja.',
                    type: 'file'
                }]);
                setStep(4);
            } finally {
                setLoading(false);
            }
        };

        reader.onerror = () => {
            setLoading(false);
            setErrors([{
                message: 'Error al leer el archivo. Verifica que el archivo no esté dañado.',
                type: 'file'
            }]);
            setStep(4);
        };

        reader.readAsArrayBuffer(file);
    };

    // Función para validar datos
    const validateData = (jsonData) => {
        const newErrors = [];
        const newColumnErrors = [];
        const requiredColumns = ["nombres", "apellidos", "email", "documento", "celular"];

        if (!jsonData || jsonData.length === 0) {
            newErrors.push({
                message: 'El archivo está vacío o no contiene datos válidos.',
                type: 'empty'
            });
            setErrors(newErrors);
            setStep(4);
            return;
        }

        // Validar que no exceda 1000 registros
        if (jsonData.length > 1000) {
            newErrors.push({
                message: 'El archivo contiene más de 1000 registros. El máximo permitido es 1000.',
                type: 'max_records'
            });
        }

        // Validar columnas exactas
        const fileColumns = Object.keys(jsonData[0] || {});
        const missingColumns = requiredColumns.filter(col => !fileColumns.includes(col));

        if (missingColumns.length > 0) {
            newColumnErrors.push({
                message: `Faltan columnas requeridas: ${missingColumns.join(', ')}. Descarga la plantilla para ver el formato correcto.`,
                type: 'missing_columns',
                columns: missingColumns
            });
        }

        // Validar columnas adicionales no permitidas
        const extraColumns = fileColumns.filter(col => !requiredColumns.includes(col));
        if (extraColumns.length > 0) {
            newColumnErrors.push({
                message: `Columnas no permitidas detectadas: ${extraColumns.join(', ')}. Solo se permiten las siguientes columnas: ${requiredColumns.join(', ')}.`,
                type: 'extra_columns',
                columns: extraColumns
            });
        }

        // Validar filas individuales
        const rowErrors = [];
        const validRows = [];
        const emailSet = new Set(); // Para verificar duplicados en el archivo

        jsonData.forEach((row, index) => {
            const rowNumber = index + 2; // +2 porque Excel empieza en 1 y la fila 1 es encabezado
            let rowHasErrors = false;

            // Validar campos requeridos
            requiredColumns.forEach(col => {
                if (!row[col] || String(row[col]).trim() === '') {
                    rowErrors.push({
                        message: `Fila ${rowNumber}: La columna "${col}" está vacía`,
                        row: rowNumber,
                        column: col,
                        type: 'empty_field'
                    });
                    rowHasErrors = true;
                }
            });

            // Validar email
            if (row.email) {
                const emailStr = String(row.email).trim().toLowerCase();

                // Validar formato
                if (!isValidEmail(emailStr)) {
                    rowErrors.push({
                        message: `Fila ${rowNumber}: Email "${emailStr}" no es válido`,
                        row: rowNumber,
                        column: 'email',
                        type: 'invalid_email'
                    });
                    rowHasErrors = true;
                }

                // Validar duplicados en el mismo archivo
                if (emailSet.has(emailStr)) {
                    rowErrors.push({
                        message: `Fila ${rowNumber}: Email "${emailStr}" está duplicado en el archivo`,
                        row: rowNumber,
                        column: 'email',
                        type: 'duplicate_email_file'
                    });
                    rowHasErrors = true;
                } else {
                    emailSet.add(emailStr);
                }
            }

            // Validar documento (solo números)
            if (row.documento) {
                const docStr = String(row.documento).trim();
                if (!/^\d+$/.test(docStr)) {
                    rowErrors.push({
                        message: `Fila ${rowNumber}: Documento "${docStr}" debe contener solo números`,
                        row: rowNumber,
                        column: 'documento',
                        type: 'invalid_document'
                    });
                    rowHasErrors = true;
                }
            }

            // Validar celular (solo números)
            if (row.celular) {
                const celStr = String(row.celular).trim();
                if (!/^\d+$/.test(celStr)) {
                    rowErrors.push({
                        message: `Fila ${rowNumber}: Celular "${celStr}" debe contener solo números`,
                        row: rowNumber,
                        column: 'celular',
                        type: 'invalid_phone'
                    });
                    rowHasErrors = true;
                }
            }

            if (!rowHasErrors) {
                // Limpiar datos antes de agregar a validRows
                const cleanedRow = {
                    nombres: row.nombres ? String(row.nombres).trim() : '',
                    apellidos: row.apellidos ? String(row.apellidos).trim() : '',
                    email: row.email ? String(row.email).trim().toLowerCase() : '',
                    documento: row.documento ? String(row.documento).trim() : '',
                    celular: row.celular ? String(row.celular).trim() : ''
                };
                validRows.push(cleanedRow);
            }
        });

        // Combinar errores
        const allErrors = [...newErrors, ...newColumnErrors, ...rowErrors];

        if (allErrors.length === 0 && validRows.length > 0) {
            setData(validRows);
            setStep(3); // Ir a vista previa
        } else {
            setColumnErrors(newColumnErrors);
            setErrors(allErrors);
            setData(validRows); // Guardar filas válidas por si acaso
            setStep(4); // Ir a resultados de error
        }
    };

    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Función para subir al backend
    // Función para subir al backend - VERSIÓN CORREGIDA
    const handleUpload = async () => {
        if (!file || data.length === 0) return;

        setUploading(true);
        setUploadProgress(10);

        try {
            // Crear FormData con el nombre correcto del campo
            const formData = new FormData();
            formData.append('archivo_xlsx', file); // ¡IMPORTANTE! Nombre correcto

            // URL correcta basada en tu ruta del backend
            const response = await axiosInstance.post(
                `/api/users/createMasiveUsers/${empresaId}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setUploadProgress(percentCompleted);
                    }
                }
            );

            setUploadProgress(100);

            // Procesar respuesta exitosa
            if (response.status === 200) {
                const resultData = response.data;

                // Mostrar SweetAlert de éxito
                Swal.fire({
                    icon: 'success',
                    title: '¡Carga exitosa!',
                    html: `
        <div style="text-align: left;">
            <p><strong>${data.length} aprendices creados exitosamente</strong></p>
            <p>${resultData.menssage || 'Los emails de verificación han sido enviados a los aprendices.'}</p>
            <hr>
            <p><small>Los aprendices recibirán un email con sus credenciales de acceso.</small></p>
        </div>
    `,
                    confirmButtonColor: '#28a004ff',
                    confirmButtonText: 'Aceptar',
                    // AÑADE ESTAS PROPIEDADES:
                    customClass: {
                        container: 'swal2-container-custom',
                        popup: 'swal2-popup-custom'
                    },
                    backdrop: 'rgba(0, 0, 0, 0.8)', // Fondo más oscuro
                    allowOutsideClick: false, // No cerrar haciendo clic fuera
                    allowEscapeKey: false, // No cerrar con ESC
                    willOpen: () => {
                        // Asegurar que esté encima de todos los elementos
                        const swalContainer = document.querySelector('.swal2-container');
                        if (swalContainer) {
                            swalContainer.style.zIndex = '99999';
                        }
                    }
                });

                setResults({
                    success: true,
                    message: `${data.length} aprendices creados exitosamente`,
                    details: resultData.menssage || 'Los emails de verificación han sido enviados a los aprendices.',
                    data: resultData
                });
                setSuccessCount(data.length);
                setErrorCount(0);

                // Refrescar lista de empleados si existe la función
                if (typeof window.refreshEmployesList === 'function') {
                    window.refreshEmployesList();
                }

            } else {
                throw new Error('Respuesta inesperada del servidor');
            }

        } catch (error) {
            // console.error('Error al subir:', error);
            // console.error('URL intentada:', error.config?.url);
            // console.error('Respuesta del servidor:', error.response?.data);

            // Procesar errores específicos del backend
            const backendError = error.response?.data;
            let errorMessage = 'Error al subir el archivo';
            let detailedErrors = [];
            let swalTitle = 'Error';
            let swalIcon = 'error';

            if (error.response) {
                switch (error.response.status) {
                    case 400:
                        errorMessage = backendError?.message || 'Error de validación en el archivo';
                        swalTitle = 'Error de validación';

                        // Procesar diferentes tipos de errores 400
                        if (backendError?.message?.includes('Faltan columnas')) {
                            detailedErrors.push({
                                message: backendError.message,
                                type: 'missing_columns'
                            });
                        } else if (backendError?.ejemplo) {
                            detailedErrors = backendError.ejemplo.map((err, idx) => ({
                                message: `Fila con datos incompletos: ${JSON.stringify(err)}`,
                                type: 'incomplete_data',
                                row: idx + 1
                            }));
                        } else if (backendError?.message?.includes('El archivo esta vacio')) {
                            detailedErrors.push({
                                message: 'El archivo está vacío o no contiene datos válidos',
                                type: 'empty_file'
                            });
                        }
                        break;

                    case 404:
                        errorMessage = 'Endpoint no encontrado. Verifica la configuración del servidor.';
                        swalTitle = 'Ruta no encontrada';
                        break;

                    case 409:
                        errorMessage = backendError?.message || 'Usuarios duplicados encontrados';
                        swalTitle = 'Usuarios duplicados';
                        swalIcon = 'warning';

                        if (backendError?.repetidos) {
                            detailedErrors = backendError.repetidos.map(email => ({
                                message: `Email ya existe en el sistema: ${email}`,
                                type: 'duplicate_email_db',
                                email: email
                            }));
                        }
                        break;

                    case 500:
                        errorMessage = 'Error interno del servidor. Por favor, inténtalo de nuevo más tarde.';
                        swalTitle = 'Error del servidor';
                        break;

                    default:
                        errorMessage = backendError?.message || 'Error desconocido';
                        break;
                }
            }

            // Mostrar SweetAlert de error
            Swal.fire({
                icon: swalIcon,
                title: swalTitle,
                html: `
        <div style="text-align: left;">
            <p>${errorMessage}</p>
            ${detailedErrors.length > 0 ? `
                <hr>
                <p><strong>Errores detallados:</strong></p>
                <ul style="max-height: 150px; overflow-y: auto;">
                    ${detailedErrors.slice(0, 3).map(err => `<li>${err.message}</li>`).join('')}
                </ul>
                ${detailedErrors.length > 3 ? `<p>... y ${detailedErrors.length - 3} error(es) más</p>` : ''}
            ` : ''}
            ${error.response?.status === 404 ? `
                <hr>
                <p><strong>Detalles técnicos:</strong></p>
                <p>Ruta: ${error.config?.url}</p>
                <p>Método: ${error.config?.method}</p>
            ` : ''}
        </div>
    `,
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'Entendido',
                // ¡AGREGA ESTAS PROPIEDADES AQUÍ TAMBIÉN!
                customClass: {
                    container: 'swal2-container-custom',
                    popup: 'swal2-popup-custom'
                },
                backdrop: 'rgba(0, 0, 0, 0.8)',
                allowOutsideClick: false,
                allowEscapeKey: false,
                willOpen: () => {
                    const swalContainer = document.querySelector('.swal2-container');
                    if (swalContainer) {
                        swalContainer.style.zIndex = '99999';
                    }
                    const modalOverlay = document.querySelector('.modal-overlay-bulk');
                    if (modalOverlay) {
                        modalOverlay.style.filter = 'brightness(0.6)';
                    }
                },
                willClose: () => {
                    const modalOverlay = document.querySelector('.modal-overlay-bulk');
                    if (modalOverlay) {
                        modalOverlay.style.filter = 'brightness(1)';
                    }
                }
            });

            setResults({
                success: false,
                message: errorMessage,
                details: error.response?.data?.details || 'Verifica que los datos en el archivo sean correctos.',
                errors: detailedErrors
            });

            setSuccessCount(0);
            setErrorCount(detailedErrors.length || 1);

        } finally {
            setUploading(false);
            setStep(4);
            setTimeout(() => setUploadProgress(0), 1000);
        }
    };

    // Función para reiniciar el proceso
    const resetProcess = () => {
        setStep(2);
        setFile(null);
        setData([]);
        setResults(null);
        setErrors([]);
        setColumnErrors([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Función para formatear el tamaño del archivo
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div id="modal-overlayBulkUpload" className="modal-overlay-bulk">
            <div className="modal-container-bulk">
                <div className="modal-header-bulk">
                    <div className="header-content-bulk">
                        <h2>
                            <FontAwesomeIcon icon={faFileExcel} className="header-icon-bulk" />
                            Carga Masiva de Aprendices
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="close-btn-bulk"
                            disabled={uploading}
                        >
                            <FontAwesomeIcon icon={faArrowLeft} />
                            <span>Volver</span>
                        </button>
                    </div>

                    {/* Indicador de pasos */}
                    <div className="steps-indicator-bulk">
                        {[1, 2, 3, 4].map((stepNum) => (
                            <div
                                key={stepNum}
                                className={`step-dot-bulk ${step === stepNum ? 'active' : step > stepNum ? 'completed' : ''}`}
                            >
                                <div className="step-number-bulk">{stepNum}</div>
                                <div className="step-label-bulk">
                                    {stepNum === 1 && 'Instrucciones'}
                                    {stepNum === 2 && 'Subir Archivo'}
                                    {stepNum === 3 && 'Vista Previa'}
                                    {stepNum === 4 && 'Resultados'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="modal-body-bulk">
                    {/* Paso 1: Instrucciones */}
                    {step === 1 && (
                        <div className="step-container-bulk step-instructions-bulk">
                            <div className="instructions-header-bulk">
                                <div className="instructions-icon-bulk">
                                    <FontAwesomeIcon icon={faFileLines} />
                                </div>
                                <h3>Instrucciones para Carga Masiva</h3>
                                <p className="instructions-subtitle-bulk">
                                    Sigue estos pasos para cargar múltiples aprendices desde un archivo Excel
                                </p>
                            </div>

                            <div className="instructions-grid-bulk">
                                <div className="instruction-card-bulk">
                                    <div className="instruction-number-bulk">1</div>
                                    <div className="instruction-content-bulk">
                                        <h4>
                                            <FontAwesomeIcon icon={faDownload} />
                                            Descarga la Plantilla
                                        </h4>
                                        <p>Usa nuestro formato Excel predefinido para asegurar que los datos tengan la estructura correcta.</p>
                                        <button
                                            className="download-template-btn-bulk"
                                            onClick={downloadTemplate}
                                        >
                                            <FontAwesomeIcon icon={faFileArrowDown} />
                                            Descargar Plantilla Excel
                                        </button>
                                    </div>
                                </div>

                                <div className="instruction-card-bulk">
                                    <div className="instruction-number-bulk">2</div>
                                    <div className="instruction-content-bulk">
                                        <h4>
                                            <FontAwesomeIcon icon={faEdit} />
                                            Completa los Datos
                                        </h4>
                                        <p>Llena todas las columnas requeridas con la información de los aprendices:</p>
                                        <ul className="requirements-list-bulk">
                                            <li>
                                                <FontAwesomeIcon icon={faCircleCheck} className="requirement-icon" />
                                                <strong>nombres:</strong> Nombres completos del aprendiz (exacto)
                                            </li>
                                            <li>
                                                <FontAwesomeIcon icon={faCircleCheck} className="requirement-icon" />
                                                <strong>apellidos:</strong> Apellidos completos (exacto)
                                            </li>
                                            <li>
                                                <FontAwesomeIcon icon={faCircleCheck} className="requirement-icon" />
                                                <strong>email:</strong> Correo electrónico válido y único (exacto)
                                            </li>
                                            <li>
                                                <FontAwesomeIcon icon={faCircleCheck} className="requirement-icon" />
                                                <strong>documento:</strong> Número de documento (solo números, exacto)
                                            </li>
                                            <li>
                                                <FontAwesomeIcon icon={faCircleCheck} className="requirement-icon" />
                                                <strong>celular:</strong> Número de contacto (solo números, exacto)
                                            </li>
                                        </ul>
                                        <p className="instruction-note-bulk">
                                            <FontAwesomeIcon icon={faExclamationTriangle} />
                                            <strong>Importante:</strong> Los nombres de las columnas deben ser EXACTAMENTE como se muestran (minúsculas, sin espacios).
                                        </p>
                                    </div>
                                </div>

                                <div className="instruction-card-bulk">
                                    <div className="instruction-number-bulk">3</div>
                                    <div className="instruction-content-bulk">
                                        <h4>
                                            <FontAwesomeIcon icon={faCloudArrowUp} />
                                            Sube el Archivo
                                        </h4>
                                        <p>Selecciona tu archivo Excel completado para validar y procesar los datos automáticamente.</p>
                                        <div className="file-requirements-bulk">
                                            <div className="requirement-item-bulk">
                                                <FontAwesomeIcon icon={faCheckCircle} className="valid-icon" />
                                                <span>Formatos aceptados: .xlsx, .xls</span>
                                            </div>
                                            <div className="requirement-item-bulk">
                                                <FontAwesomeIcon icon={faCheckCircle} className="valid-icon" />
                                                <span>Máximo 1000 registros por archivo</span>
                                            </div>
                                            <div className="requirement-item-bulk">
                                                <FontAwesomeIcon icon={faCheckCircle} className="valid-icon" />
                                                <span>Tamaño máximo: 10MB</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="step-actions-bulk">
                                <button
                                    className="btn-secondary-bulk"
                                    onClick={onClose}
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                    Cancelar
                                </button>
                                <button
                                    className="btn-primary-bulk"
                                    onClick={() => setStep(2)}
                                >
                                    Comenzar Carga
                                    <FontAwesomeIcon icon={faArrowRight} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Paso 2: Subir archivo */}
                    {step === 2 && (
                        <div className="step-container-bulk step-upload-bulk">
                            <div className="upload-header-bulk">
                                <h3>
                                    <FontAwesomeIcon icon={faUpload} />
                                    Subir Archivo Excel
                                </h3>
                                <p className="upload-subtitle-bulk">
                                    Arrastra y suelta tu archivo o haz clic para seleccionarlo
                                </p>
                            </div>

                            <div
                                className="upload-zone-bulk"
                                onClick={() => !loading && fileInputRef.current?.click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                style={{ opacity: loading ? 0.6 : 1 }}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                    style={{ display: 'none' }}
                                />

                                {loading ? (
                                    <div className="upload-loading-bulk">
                                        <div className="loading-spinner-bulk">
                                            <FontAwesomeIcon icon={faSpinner} spin />
                                        </div>
                                        <p className="loading-text-bulk">Validando archivo...</p>
                                        <p className="loading-subtext-bulk">Por favor, espera un momento</p>
                                    </div>
                                ) : file ? (
                                    <div className="file-selected-bulk">
                                        <div className="file-icon-container-bulk">
                                            <FontAwesomeIcon icon={faFileExcel} className="file-icon-bulk" />
                                            <div className="file-status-bulk success">
                                                <FontAwesomeIcon icon={faCheckCircle} />
                                            </div>
                                        </div>
                                        <div className="file-info-bulk">
                                            <h4 className="file-name-bulk">{file.name}</h4>
                                            <div className="file-details-bulk">
                                                <span className="file-size-bulk">{formatFileSize(file.size)}</span>
                                                <span className="file-type-bulk">Excel</span>
                                            </div>
                                            <p className="file-ready-bulk">Archivo listo para validación</p>
                                        </div>
                                        <button
                                            className="change-file-btn-bulk"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFile(null);
                                                if (fileInputRef.current) {
                                                    fileInputRef.current.value = '';
                                                }
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faTrashAlt} />
                                            Cambiar
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="upload-icon-container-bulk">
                                            <FontAwesomeIcon icon={faCloudArrowUp} className="upload-icon-bulk" />
                                        </div>
                                        <h4 className="upload-title-bulk">Arrastra tu archivo Excel aquí</h4>
                                        <p className="upload-text-bulk">o haz clic para seleccionar</p>
                                        <div className="upload-requirements-bulk">
                                            <p className="file-types-bulk">
                                                <FontAwesomeIcon icon={faFileExcel} />
                                                Formatos aceptados: .xlsx, .xls
                                            </p>
                                            <p className="file-max-bulk">
                                                <FontAwesomeIcon icon={faExclamationTriangle} />
                                                Máximo 10MB
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {file && !loading && (
                                <div className="upload-preview-bulk">
                                    <div className="preview-header-bulk">
                                        <FontAwesomeIcon icon={faEye} />
                                        <h4>Vista Previa Disponible</h4>
                                    </div>
                                    <p className="preview-text-bulk">
                                        Tu archivo ha sido cargado correctamente. Haz clic en "Continuar" para ver los datos y validarlos.
                                    </p>
                                </div>
                            )}

                            <div className="step-actions-bulk">
                                <button
                                    className="btn-secondary-bulk"
                                    onClick={() => setStep(1)}
                                >
                                    <FontAwesomeIcon icon={faArrowLeft} />
                                    Atrás
                                </button>
                                <button
                                    className="btn-secondary-bulk"
                                    onClick={downloadTemplate}
                                    disabled={loading}
                                >
                                    <FontAwesomeIcon icon={faDownload} />
                                    Descargar Plantilla
                                </button>
                                <button
                                    className="btn-primary-bulk"
                                    onClick={() => {
                                        if (file) {
                                            setStep(3);
                                        } else {
                                            fileInputRef.current?.click();
                                        }
                                    }}
                                    disabled={loading}
                                >
                                    {file ? (
                                        <>
                                            <FontAwesomeIcon icon={faArrowRight} />
                                            Continuar
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faUpload} />
                                            Seleccionar Archivo
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Paso 3: Vista previa */}
                    {step === 3 && data.length > 0 && (
                        <div className="step-container-bulk step-preview-bulk">
                            <div className="preview-header-section-bulk">
                                <h3>
                                    <FontAwesomeIcon icon={faFileCircleCheck} />
                                    Vista Previa de Datos
                                </h3>
                                <div className="preview-stats-bulk">
                                    <div className="stat-card-bulk">
                                        <div className="stat-icon-bulk total">
                                            <FontAwesomeIcon icon={faUsers} />
                                        </div>
                                        <div className="stat-content-bulk">
                                            <span className="stat-value-bulk">{data.length}</span>
                                            <span className="stat-label-bulk">Total Aprendices</span>
                                        </div>
                                    </div>
                                    <div className="stat-card-bulk">
                                        <div className="stat-icon-bulk valid">
                                            <FontAwesomeIcon icon={faCheckCircle} />
                                        </div>
                                        <div className="stat-content-bulk">
                                            <span className="stat-value-bulk">{data.length}</span>
                                            <span className="stat-label-bulk">Registros Válidos</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="preview-subtitle-bulk">
                                    Revisa los datos antes de crear los aprendices. Cada aprendiz recibirá un email con sus credenciales.
                                </p>
                            </div>

                            <div className="preview-table-container-bulk">
                                <div className="table-header-bulk">
                                    <div className="table-title-bulk">
                                        <FontAwesomeIcon icon={faFileLines} />
                                        <span>Datos a Importar</span>
                                    </div>
                                    <div className="table-actions-bulk">
                                        <button className="table-action-btn-bulk" onClick={resetProcess}>
                                            <FontAwesomeIcon icon={faTrashAlt} />
                                            Cambiar Archivo
                                        </button>
                                    </div>
                                </div>

                                <div className="table-scroll-container-bulk">
                                    <table className="preview-table-bulk">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Nombres</th>
                                                <th>Apellidos</th>
                                                <th>Email</th>
                                                <th>Documento</th>
                                                <th>Celular</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.slice(0, 5).map((row, index) => (
                                                <tr key={index} className={index % 2 === 0 ? 'even' : 'odd'}>
                                                    <td className="row-number-bulk">{index + 1}</td>
                                                    <td className="cell-nombres-bulk">{row.nombres}</td>
                                                    <td className="cell-apellidos-bulk">{row.apellidos}</td>
                                                    <td className="cell-email-bulk">{row.email}</td>
                                                    <td className="cell-documento-bulk">{row.documento}</td>
                                                    <td className="cell-celular-bulk">{row.celular}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {data.length > 5 && (
                                    <div className="table-footer-bulk">
                                        <div className="more-records-bulk">
                                            <FontAwesomeIcon icon={faUsers} />
                                            <span>... y {data.length - 5} registros más</span>
                                        </div>
                                        <div className="records-summary-bulk">
                                            Mostrando 5 de {data.length} registros
                                        </div>
                                    </div>
                                )}
                            </div>

                            {uploading && (
                                <div className="upload-progress-bulk">
                                    <div className="progress-header-bulk">
                                        <FontAwesomeIcon icon={faSpinner} spin />
                                        <span>Procesando archivo...</span>
                                    </div>
                                    <div className="progress-bar-bulk">
                                        <div
                                            className="progress-fill-bulk"
                                            style={{ width: `${uploadProgress}%` }}
                                        ></div>
                                    </div>
                                    <div className="progress-text-bulk">
                                        <span>{uploadProgress}% completado</span>
                                        <span>Creando {data.length} aprendices...</span>
                                    </div>
                                </div>
                            )}

                            <div className="step-actions-bulk">
                                <button
                                    className="btn-secondary-bulk"
                                    onClick={() => setStep(2)}
                                    disabled={uploading}
                                >
                                    <FontAwesomeIcon icon={faArrowLeft} />
                                    Atrás
                                </button>
                                <button
                                    className="btn-primary-bulk"
                                    onClick={handleUpload}
                                    disabled={uploading || data.length === 0}
                                >
                                    {uploading ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} spin />
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faCloudArrowUp} />
                                            Crear {data.length} Aprendices
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Paso 4: Resultados */}
                    {step === 4 && (
                        <div className="step-container-bulk step-results-bulk">
                            {results ? (
                                // Resultados del backend
                                <div className={`results-card-bulk ${results.success ? 'success' : 'error'}`}>
                                    <div className="results-header-bulk">
                                        <div className="results-icon-bulk">
                                            <FontAwesomeIcon icon={results.success ? faCheckCircle : faExclamationTriangle} />
                                        </div>
                                        <h3>{results.success ? '¡Carga Exitosa!' : 'Error en la Carga'}</h3>
                                    </div>

                                    <div className="results-content-bulk">
                                        <p className="results-message-bulk">{results.message}</p>

                                        {results.success ? (
                                            <div className="success-details-bulk">
                                                <div className="success-stats-bulk">
                                                    <div className="success-stat-bulk">
                                                        <div className="stat-icon-container-bulk">
                                                            <FontAwesomeIcon icon={faUsers} />
                                                        </div>
                                                        <div className="stat-content-container-bulk">
                                                            <span className="stat-value-bulk">{successCount}</span>
                                                            <span className="stat-label-bulk">Aprendices Creados</span>
                                                        </div>
                                                    </div>
                                                    <div className="success-stat-bulk">
                                                        <div className="stat-icon-container-bulk">
                                                            <FontAwesomeIcon icon={faEnvelope} />
                                                        </div>
                                                        <div className="stat-content-container-bulk">
                                                            <span className="stat-value-bulk">{successCount}</span>
                                                            <span className="stat-label-bulk">Emails Enviados</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="success-info-bulk">
                                                    <FontAwesomeIcon icon={faCircleCheck} />
                                                    <p>{results.details}</p>
                                                </div>

                                                <div className="next-steps-bulk">
                                                    <h4>Próximos pasos:</h4>
                                                    <ul>
                                                        <li>Los aprendices recibirán un email con sus credenciales de acceso</li>
                                                        <li>Puedes asignar cursos a los nuevos aprendices desde la sección de cursos</li>
                                                        <li>Verifica que los aprendices hayan activado sus cuentas</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="error-details-bulk">
                                                {results.details && (
                                                    <p className="error-details-text-bulk">{results.details}</p>
                                                )}

                                                {results.errors && results.errors.length > 0 && (
                                                    <div className="errors-list-bulk">
                                                        <h4>Errores encontrados:</h4>
                                                        <div className="errors-scroll-bulk">
                                                            {results.errors.slice(0, 5).map((error, index) => (
                                                                <div key={index} className="error-item-bulk">
                                                                    <FontAwesomeIcon icon={faCircleXmark} />
                                                                    <span>{error.message}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {results.errors.length > 5 && (
                                                            <p className="errors-more-bulk">
                                                                ... y {results.errors.length - 5} error(es) más
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="error-actions-bulk">
                                                    <h4>¿Qué puedes hacer?</h4>
                                                    <ul>
                                                        <li>Descarga la plantilla y corrige los errores</li>
                                                        <li>Verifica que los emails no estén duplicados</li>
                                                        <li>Asegúrate de que todos los campos requeridos estén completos</li>
                                                        <li>Intenta con un archivo nuevo</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="results-actions-bulk">
                                        {results.success ? (
                                            <button
                                                className="btn-primary-bulk"
                                                onClick={onClose}
                                            >
                                                <FontAwesomeIcon icon={faCheckCircle} />
                                                Completar
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    className="btn-secondary-bulk"
                                                    onClick={resetProcess}
                                                >
                                                    <FontAwesomeIcon icon={faArrowLeft} />
                                                    Intentar de Nuevo
                                                </button>
                                                <button
                                                    className="btn-secondary-bulk"
                                                    onClick={downloadTemplate}
                                                >
                                                    <FontAwesomeIcon icon={faDownload} />
                                                    Descargar Plantilla
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ) : errors.length > 0 ? (
                                // Errores de validación
                                <div className="results-card-bulk error">
                                    <div className="results-header-bulk">
                                        <div className="results-icon-bulk">
                                            <FontAwesomeIcon icon={faExclamationTriangle} />
                                        </div>
                                        <h3>Errores de Validación</h3>
                                    </div>

                                    <div className="results-content-bulk">
                                        <p className="results-message-bulk">
                                            Se encontraron {errors.length} error(es) en el archivo:
                                        </p>

                                        {columnErrors.length > 0 && (
                                            <div className="column-errors-bulk">
                                                <h4>Errores de columnas:</h4>
                                                <div className="errors-scroll-bulk">
                                                    {columnErrors.map((error, index) => (
                                                        <div key={index} className="error-item-bulk column-error">
                                                            <FontAwesomeIcon icon={faCircleXmark} />
                                                            <span>{error.message}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="errors-summary-bulk">
                                            <div className="summary-stats-bulk">
                                                <div className="summary-stat-bulk">
                                                    <span className="stat-value-bulk error">{errors.length}</span>
                                                    <span className="stat-label-bulk">Errores Totales</span>
                                                </div>
                                                <div className="summary-stat-bulk">
                                                    <span className="stat-value-bulk">{data.length}</span>
                                                    <span className="stat-label-bulk">Registros Válidos</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="errors-list-bulk">
                                            <h4>Detalle de errores:</h4>
                                            <div className="errors-scroll-bulk">
                                                {errors.filter(e => !columnErrors.includes(e)).slice(0, 5).map((error, index) => (
                                                    <div key={index} className="error-item-bulk">
                                                        <FontAwesomeIcon icon={faCircleXmark} />
                                                        <span>{error.message}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            {errors.length > 5 && (
                                                <p className="errors-more-bulk">
                                                    ... y {errors.length - 5} error(es) más
                                                </p>
                                            )}
                                        </div>

                                        <div className="error-suggestions-bulk">
                                            <h4>Recomendaciones:</h4>
                                            <ul>
                                                <li>Descarga la plantilla para ver el formato correcto</li>
                                                <li>Completa todas las columnas requeridas</li>
                                                <li>Verifica que los emails sean válidos y únicos</li>
                                                <li>Asegúrate de que documento y celular contengan solo números</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="results-actions-bulk">
                                        <button
                                            className="btn-secondary-bulk"
                                            onClick={resetProcess}
                                        >
                                            <FontAwesomeIcon icon={faArrowLeft} />
                                            Corregir Archivo
                                        </button>
                                        <button
                                            className="btn-secondary-bulk"
                                            onClick={downloadTemplate}
                                        >
                                            <FontAwesomeIcon icon={faDownload} />
                                            Descargar Plantilla
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};