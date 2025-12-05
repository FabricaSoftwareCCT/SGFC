import "./CreateCriteria.css"
import { useNavigate, useParams } from "react-router-dom"
import { Header } from "../../../Layouts/Header/Header"
import { Main } from "../../../Layouts/Main/Main"
import { useEffect, useState } from "react"
import { GoBackArrow } from "../../../UI/GoBackArrow/GoBackArrow"
import axiosInstance from "../../../../config/axiosInstance"
import Swal from "sweetalert2";
import 'sweetalert2/themes/bulma.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faPlus,
    faSave,
    faTimes,
    faClipboardCheck,
    faCalendarCheck,
    faTasks,
    faWeightHanging,
    faArrowLeft,
    faPercent,
    faMinus,
    faPen,
	faCheck,
    faFileAlt
} from '@fortawesome/free-solid-svg-icons'

export const CreateCriteria = () => {
    const { id } = useParams()
    const navigate = useNavigate()

    const [title, setTitle] = useState("")
    const [value, setValue] = useState(0)
    const [min, setMin] = useState(0)
    const [description, setDescription] = useState("")
    const [showTypeModal, setShowTypeModal] = useState(false)
    const [criteriaType, setCriteriaType] = useState()
    const [bias, setBias] = useState()

    async function save() {
        try {
            if (!criteriaType) {
                await Swal.fire({
                    icon: 'warning',
                    title: 'Tipo de criterio requerido',
                    text: 'Se debe especificar el tipo de criterio',
                    confirmButtonColor: '#3085d6',
                    theme: "bulma",
                    customClass: {
                        confirmButton: 'centered-swal-button'
                    }
                });
                return
            }

            if (title.length < 1) {
                await Swal.fire({
                    icon: 'warning',
                    title: 'Nombre requerido',
                    text: 'Se debe darle nombre al criterio',
                    confirmButtonColor: '#3085d6',
                    theme: "bulma",
                    customClass: {
                        confirmButton: 'centered-swal-button'
                    }
                });
                return
            }
            if (description.length < 1) {
                await Swal.fire({
                    icon: 'warning',
                    title: 'Descripción requerida',
                    text: 'Se debe escribir la descripción del criterio',
                    confirmButtonColor: '#3085d6',
                    theme: "bulma",
                    customClass: {
                        confirmButton: 'centered-swal-button'
                    }
                });
                return
            }
            if (isNaN(min) && !!criteriaType) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Valor inválido',
                    text: 'El valor mínimo debe ser un número',
                    confirmButtonColor: '#d33',
                    theme: "bulma",
                    customClass: {
                        confirmButton: 'centered-swal-button'
                    }
                });
                return
            }

            let body = {}
            body.title = title
            if (!!criteriaType)
                body.min = min
            body.description = description
            body.type = criteriaType
            body.has_value = !!criteriaType
            body.course = id
            if (!!bias)
                body.bias = bias

            const response = await axiosInstance.post("/api/certification/create", body)

            if (response.data.criterio_ID != undefined) {
                navigate(`/Gestiones/Criterios/Curso/${id}`)
                await Swal.fire({
                    icon: 'success',
                    title: '¡Éxito!',
                    text: response.data.message || 'Criterio creado correctamente',
                    confirmButtonColor: '#3085d6',
                    timer: 3000,
                    timerProgressBar: true,
                    theme: "bulma",
                    customClass: {
                        confirmButton: 'centered-swal-button'
                    }
                });
            } else {
                if (response.data.message)
                    await Swal.fire({
                        icon: 'warning',
                        title: 'Advertencia',
                        text: response.data.message,
                        confirmButtonColor: '#3085d6',
                        theme: "bulma",
                        customClass: {
                            confirmButton: 'centered-swal-button'
                        }
                    });
            }
        } catch (error) {
            if (error.response?.data?.message)
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response.data.message,
                    confirmButtonColor: '#d33',
                    theme: "bulma",
                    customClass: {
                        confirmButton: 'centered-swal-button'
                    }
                });
            else
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Ocurrió un error al crear el criterio de certificación',
                    confirmButtonColor: '#d33',
                    theme: "bulma",
                    customClass: {
                        confirmButton: 'centered-swal-button'
                    }
                });
        }
    }

    const userSession = JSON.parse(localStorage.getItem("userSession")) || JSON.parse(sessionStorage.getItem("userSession"))
    const isLoggedIn = !!userSession
    const accountType = userSession?.accountType || null

    useEffect(() => {
        if (isLoggedIn && (accountType === "Instructor" || accountType == "Administrador" || accountType === "Gestor")) {

        } else {
            navigate("/no-autorizado");
        }
    }, [id])

    const getTypeIcon = (type) => {
        switch (type) {
            case "Asistencias": return faCalendarCheck;
            case "Calificacion": return faTasks;
            default: return faClipboardCheck;
        }
    }

    return (
        <>
            <Header />
            <Main>
                <div className="create-criteria-container">
                    <GoBackArrow />
                    <div className="criteria-header">
                        <h1>
                            <FontAwesomeIcon icon={faClipboardCheck} className="header-icon" />
                            Crear Criterio de <span className="highlight">Certificación</span>
                        </h1>
                        <p className="subtitle">Define los parámetros de evaluación para la certificación del curso</p>
                    </div>

                    <div className="criteria-creation-card">
                        <div className="card-header">
                            <div className="title-section">
                                <FontAwesomeIcon icon={faPen} className="title-icon" />
                                <input
                                    className="criteria-title-input"
                                    placeholder="Nombre del criterio..."
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>
                            <div className="type-section">
                                <button
                                    className="type-selector-btn"
                                    onClick={() => setShowTypeModal(true)}
                                >
                                    <FontAwesomeIcon icon={getTypeIcon(criteriaType) || faClipboardCheck} />
                                    <span>{criteriaType || "Seleccionar tipo"}</span>
                                </button>
                            </div>
                        </div>

                        <div className="card-body">
                            <div className="description-section">
                                <label className="section-label">
                                    <FontAwesomeIcon icon={faFileAlt} />
                                    Descripción del criterio:
                                </label>
                                <textarea
                                    className="criteria-description"
                                    placeholder="Describe el propósito y detalles de este criterio de evaluación..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows="4"
                                />
                            </div>

                            {criteriaType && (
                                <div className="metrics-section">
                                    <div className="metrics-grid">
                                        <div className="metric-item">
                                            <label className="metric-label">
                                                <FontAwesomeIcon icon={faMinus} />
                                                Valor mínimo requerido:
                                            </label>
                                            <div className="metric-input-group">
                                                <input
                                                    type="number"
                                                    className="metric-input"
                                                    placeholder="0"
                                                    value={min}
                                                    onChange={(e) => setMin(e.target.value)}
                                                    min="0"
                                                />
                                            </div>
                                        </div>
                                        <div className="metric-item">
                                            <label className="metric-label">
                                                <FontAwesomeIcon icon={faPercent} />
                                                Ponderación:
                                            </label>
                                            <div className="metric-input-group">
                                                <input
                                                    type="number"
                                                    className="metric-input"
                                                    placeholder="0"
                                                    value={bias}
                                                    onChange={(e) => setBias(e.target.value)}
                                                    min="0"
                                                    max="100"
                                                />
                                                <span className="percent-symbol">%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="preview-section">
                                <h4 className="preview-title">Vista previa:</h4>
                                <div className="preview-content">
                                    <div className="preview-item">
                                        <span className="preview-label">Título:</span>
                                        <span className="preview-value">{title || "Sin título"}</span>
                                    </div>
                                    <div className="preview-item">
                                        <span className="preview-label">Tipo:</span>
                                        <span className="preview-value">{criteriaType || "No seleccionado"}</span>
                                    </div>
                                    {criteriaType && (
                                        <div className="preview-item">
                                            <span className="preview-label">Mínimo requerido:</span>
                                            <span className="preview-value">{min || 0}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="card-footer">
                            <button
                                className="btn-secondary"
                                onClick={() => navigate(`/Gestiones/Criterios/Curso/${id}`)}
                            >
                                <FontAwesomeIcon icon={faTimes} />
                                <span>Cancelar</span>
                            </button>
                            <button
                                className="btn-primary"
                                onClick={save}
                            >
                                <FontAwesomeIcon icon={faSave} />
                                <span>Guardar Criterio</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Modal para seleccionar tipo de criterio */}
                {showTypeModal &&
                    <div className="modal-overlay-criteria">
                        <div className="modal-container-criteria">
                            <div className="modal-header-criteria">
                                <div className="header-content-criteria">
                                    <h2>
                                        <FontAwesomeIcon icon={faClipboardCheck} className="header-icon-criteria" />
                                        Tipo de Criterio
                                    </h2>
                                    <button
                                        type="button"
                                        onClick={() => setShowTypeModal(false)}
                                        className="close-btn-criteria"
                                    >
                                        <FontAwesomeIcon icon={faArrowLeft} />
                                        <span>Volver</span>
                                    </button>
                                </div>
                            </div>

                            <div className="modal-body-criteria">
                                <div className="modal-content-criteria">
                                    <div className="form-section-criteria">
                                        <h3 className="section-title-criteria">
                                            <FontAwesomeIcon icon={faClipboardCheck} />
                                            Selecciona el tipo de evaluación
                                        </h3>
                                        <p className="section-description">
                                            Elige cómo se evaluará este criterio en el proceso de certificación
                                        </p>

                                        <div className="type-options-grid">
                                            <button
                                                className={`type-option-criteria ${criteriaType === "Asistencias" ? 'selected' : ''}`}
                                                onClick={() => setCriteriaType("Asistencias")}
                                            >
                                                <div className="type-icon-criteria">
                                                    <FontAwesomeIcon icon={faCalendarCheck} />
                                                </div>
                                                <div className="type-info-criteria">
                                                    <h4 className="type-title">Asistencias</h4>
                                                    <p className="type-description">Evaluación basada en la asistencia a clases o actividades</p>
                                                </div>
                                            </button>

                                            <button
                                                className={`type-option-criteria ${criteriaType === "Calificacion" ? 'selected' : ''}`}
                                                onClick={() => setCriteriaType("Calificacion")}
                                            >
                                                <div className="type-icon-criteria">
                                                    <FontAwesomeIcon icon={faTasks} />
                                                </div>
                                                <div className="type-info-criteria">
                                                    <h4 className="type-title">Actividades</h4>
                                                    <p className="type-description">Evaluación basada en calificaciones de tareas o proyectos</p>
                                                </div>
                                            </button>
                                        </div>

                                        {criteriaType && (
                                            <div className="type-details-criteria">
                                                <h4 className="details-title">
                                                    <FontAwesomeIcon icon={getTypeIcon(criteriaType)} />
                                                    Configuración para: {criteriaType}
                                                </h4>
                                                <div className="details-grid">
                                                    <div className="detail-item-criteria">
                                                        <label className="detail-label">
                                                            Valor mínimo requerido:
                                                        </label>
                                                        <div className="detail-input-group">
                                                            <input
                                                                type="number"
                                                                className="detail-input"
                                                                placeholder="0"
                                                                value={min}
                                                                onChange={(e) => setMin(e.target.value)}
                                                                min="0"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="detail-item-criteria">
                                                        <label className="detail-label">
                                                            Ponderación (%):
                                                        </label>
                                                        <div className="detail-input-group">
                                                            <input
                                                                type="number"
                                                                className="detail-input"
                                                                placeholder="0"
                                                                value={bias}
                                                                onChange={(e) => setBias(e.target.value)}
                                                                min="0"
                                                                max="100"
                                                            />
                                                            <span className="percent-symbol">%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="modal-actions-criteria">
                                            <button
                                                className="btn-primary-criteria"
                                                onClick={() => setShowTypeModal(false)}
                                            >
                                                <FontAwesomeIcon icon={faCheck} />
                                                <span>Confirmar Selección</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                }
            </Main>
        </>
    )
}