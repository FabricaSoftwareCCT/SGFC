import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../../config/axiosInstance';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Modal_General } from '../../../UI/Modal_General/Modal_General';
import { useNavigate } from 'react-router-dom';
import './AttendanceManagement.css';
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css';

export const AttendanceManagement = ({ open, onClose, courseId, selectedDate }) => {
    const navigate = useNavigate();
    const [participants, setParticipants] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [showOptions, setShowOptions] = useState(true);
    const [selectedOption, setSelectedOption] = useState(null);
    const [currentParticipantIndex, setCurrentParticipantIndex] = useState(0);
    const [tempAttendance, setTempAttendance] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('todos');
    const [attendanceFilter, setAttendanceFilter] = useState('todos');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedAttendance, setSelectedAttendance] = useState('');
    const [showApprenticeDetails, setShowApprenticeDetails] = useState(false);
    const [selectedApprentice, setSelectedApprentice] = useState(null);

    useEffect(() => {
        if (open) {
            setShowOptions(true);
            setSelectedOption(null);
            fetchParticipants();
        }
    }, [open, courseId]);

    useEffect(() => {
        if (selectedOption === 'view' || selectedOption === 'update') {
            fetchAttendanceRecords();
        }
    }, [selectedOption, selectedDate, selectedAttendance]);

    const fetchParticipants = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axiosInstance.get(`/api/courses/cursos/${courseId}/participants`);
            if (response.data.success) {
                setParticipants(response.data.participants);
            } else {
                setError('Error al cargar los participantes');
            }
        } catch (error) {
            console.error('Error al obtener participantes:', error);
            if (error.response?.status === 401) {
                localStorage.removeItem('userSession');
                sessionStorage.removeItem('userSession');
                navigate('/');
            } else if (error.response?.status === 403) {
                setError('No tienes permisos para acceder a esta función');
            } else {
                setError('Error al cargar los participantes');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendanceRecords = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/api/attendance/courses/${courseId}/get`, {
                params: {
                    limit: 100
                }
            });

            if (response.data.success) {
                const records = response.data.records || [];
                const recordsMap = new Map();
                records.forEach(record => {
                    if (record.aprendiz && record.aprendiz.ID) {
                        recordsMap.set(record.aprendiz.ID, {
                            ...record,
                            estado_asistencia: record.estado_asistencia || 'Pendiente'
                        });
                    }
                });

                const allRecords = participants.map(participant => {
                    const existingRecord = recordsMap.get(participant.aprendiz.ID);
                    if (existingRecord) {
                        return existingRecord;
                    }

                    return {
                        ID: null,
                        aprendiz: {
                            ID: participant.aprendiz.ID,
                            nombres: participant.aprendiz.nombres,
                            apellidos: participant.aprendiz.apellidos,
                            documento: participant.aprendiz.documento
                        },
                        estado_asistencia: 'Pendiente',
                        curso_ID: courseId
                    };
                });

                setAttendanceRecords(allRecords);
                setError(null);
            } else {
                setError(response.data.message || 'Error al cargar los registros de asistencia');
            }
            setLoading(false);
        } catch (error) {
            console.error('Error al obtener registros de asistencia:', error);
            setError(error.response?.data?.message || 'Error al cargar los registros de asistencia');
            setLoading(false);
        }
    };

    const handleAttendanceChange = async (participantId, status) => {
        try {
            const existingRecord = attendanceRecords.find(
                record => record?.aprendiz?.ID === participantId
            );

            if (existingRecord && existingRecord.ID) {
                await axiosInstance.put(`/api/attendance/courses/${courseId}/update`, {
                    attendanceId: existingRecord.ID,
                    status
                });
            } else {
                await axiosInstance.post(`/api/attendance/courses/${courseId}/register`, {
                    usuario_ID: participantId,
                    estado: status
                });
            }

            await fetchAttendanceRecords();
        } catch (error) {
            console.error('Error al actualizar asistencia:', error);
            setError('Error al actualizar la asistencia');
        }
    };

    const handleViewDetails = (record) => {
        setSelectedRecord(record);
        setShowDetails(true);
    };

    const handleCloseDetails = () => {
        setShowDetails(false);
        setSelectedRecord(null);
    };

    const handleOptionSelect = (option) => {
        setSelectedOption(option);
        setTimeout(() => {
            setShowOptions(false);
            setError(null);
        }, 300);
    };

    const handleBack = () => {
        setSelectedOption(null);
        setShowOptions(true);
        setError(null);
    };

    const handleAttendanceStatus = (participantId, status) => {
        setTempAttendance(prev => ({
            ...prev,
            [participantId]: status
        }));
    };

    const handleNextParticipant = () => {
        if (currentParticipantIndex < filteredParticipants.length - 1) {
            setCurrentParticipantIndex(prev => prev + 1);
        }
    };

    const handlePrevParticipant = () => {
        if (currentParticipantIndex > 0) {
            setCurrentParticipantIndex(prev => prev - 1);
        }
    };

    // FUNCIÓN SIMPLIFICADA: Igual que la de tu compañero
    const handleSaveAttendance = async () => {
        try {
            setLoading(true);
            setError(null);

            const formattedDate = format(parseISO(selectedDate), 'yyyy-MM-dd');

            console.log('Guardando asistencias para la fecha:', formattedDate);
            console.log('Asistencias temporales:', tempAttendance);

            const attendancePromises = Object.entries(tempAttendance).map(([participantId, status]) =>
                axiosInstance.post(`/api/attendance/courses/${courseId}/register`, {
                    usuario_ID: participantId,
                    estado: status,
                    fecha: formattedDate
                })
            );

            await Promise.all(attendancePromises);

            setTempAttendance({});
            setCurrentParticipantIndex(0);
            setSelectedOption(null);
            setShowOptions(true);

            await Swal.fire({
                icon: 'success',
                title: 'Asistencias registradas',
                text: 'Asistencias registradas exitosamente',
                confirmButtonColor:"#00843d",
                theme: 'bulma',
        customClass: {
            actions: 'swal2-center-actions',
            confirmButton: 'swal2-confirm-bulma'
        },
            });

        } catch (error) {
            console.error('Error al guardar asistencias:', error);
            setError('Error al guardar las asistencias');
                        await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al guardar las asistencias',
                confirmButtonText:"Okay",
                confirmButtonColor:"#00843d",
                        theme: 'bulma',
        customClass: {
          actions: 'swal2-center-actions'
        }
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredParticipants = participants.filter(participant => {
        const record = attendanceRecords.find(r => r?.aprendiz?.ID === participant.aprendiz?.ID);
        
        const searchTermLower = searchTerm.toLowerCase();
        const matchesSearch =
            (participant.aprendiz?.nombres && participant.aprendiz.nombres.toLowerCase().includes(searchTermLower)) ||
            (participant.aprendiz?.apellidos && participant.aprendiz.apellidos.toLowerCase().includes(searchTermLower)) ||
            (participant.aprendiz?.documento && participant.aprendiz.documento.toLowerCase().includes(searchTermLower));

        const matchesStatus = selectedStatus === '' || record?.aprendiz?.estado === selectedStatus;

        if (selectedAttendance === '') {
            return matchesSearch && matchesStatus;
        }

        const matchesAttendance = record?.estado_asistencia === selectedAttendance;
        
        return matchesSearch && matchesStatus && matchesAttendance;
    });

    useEffect(() => {
        setCurrentParticipantIndex(0);
    }, [searchTerm, selectedStatus, selectedAttendance]);

    const handleSeeApprentice = () => {
        const currentApprentice = filteredParticipants[currentParticipantIndex];
        if (!currentApprentice) {
            console.error('No hay aprendiz seleccionado');
            return;
        }

        const attendanceRecord = attendanceRecords.find(
            record => record?.aprendiz?.ID === currentApprentice?.aprendiz?.ID
        );

        setSelectedApprentice({
            ...currentApprentice,
            attendanceStatus: attendanceRecord?.estado_asistencia || 'Pendiente'
        });
        setShowApprenticeDetails(true);
        setSelectedOption(null);
    };

    const handleCloseApprenticeDetails = () => {
        setShowApprenticeDetails(false);
        setSelectedApprentice(null);
        setSelectedOption('update');
    };

    // FUNCIÓN SIMPLIFICADA: Igual que la de tu compañero
    const handleToggleAttendance = async () => {
        if (!selectedApprentice) return;

        const newStatus = selectedApprentice.attendanceStatus === 'Presente' ? 'Ausente' : 'Presente';
        
        try {
            const existingRecord = attendanceRecords.find(
                record => record?.aprendiz?.ID === selectedApprentice.aprendiz.ID
            );

            const formattedDate = format(parseISO(selectedDate), 'yyyy-MM-dd');

            if (existingRecord && existingRecord.ID) {
                await axiosInstance.put(`/api/attendance/courses/${courseId}/update`, {
                    attendanceId: existingRecord.ID,
                    status: newStatus
                });
            } else {
                await axiosInstance.post(`/api/attendance/courses/${courseId}/register`, {
                    usuario_ID: selectedApprentice.aprendiz.ID,
                    estado: newStatus,
                    fecha: formattedDate
                });
            }

            setSelectedApprentice(prev => ({
                ...prev,
                attendanceStatus: newStatus
            }));
            
            await fetchAttendanceRecords();

            await Swal.fire({
                icon: 'success',
                title: 'Asistencia actualizada',
                text: `Asistencia cambiada a ${newStatus}`,
                           confirmButtonText:"Okay",
                confirmButtonColor:"#00843d",
                        theme: 'bulma',
        customClass: {
          actions: 'swal2-center-actions'
        }
            });

        } catch (error) {
            console.error('Error al actualizar asistencia:', error);
            console.error('Detalles del error:', error.response?.data);
            
            const errorMessage = error.response?.data?.message || 'Error al actualizar la asistencia';
            setError(errorMessage);

                        await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al actualizar la asistencia',
                           confirmButtonText:"Okay",
                confirmButtonColor:"#00843d",
                        theme: 'bulma',
        customClass: {
          actions: 'swal2-center-actions'
        }
            });
        }
    };

    if (!open) return null;

    if (showOptions) {
        return (
            <div className="modal-overlay-attendance">
            <div className="modal-container-attendance">
                <div className="modal-header-attendance">
                    <div className="header-content-attendance">
                        <button className="back-btn-attendance" onClick={onClose}> {/* Cambiado de handleBack a onClose */}
                            ← Volver
                        </button>
                        <h2>
                            <span className="header-icon-attendance"></span>
                            Gestión de Asistencias
                        </h2>
                    </div>
                </div>

                <div className="modal-body-attendance">
                    <p className="instruction-text-attendance">
                        Por favor seleccione una de las siguientes opciones
                    </p>

                    <div className="options-grid-attendance">
                        <div 
                            className={`option-card-attendance ${selectedOption === 'add' ? 'selected' : ''}`}
                            onClick={() => handleOptionSelect('add')}
                        >
                            <div className="option-icon-container-attendance">
                                <img 
                                    src="/src/assets/Icons/agregar-archivo.png" 
                                    alt="Agregar Asistencia"
                                    className="option-icon-attendance"
                                />
                            </div>
                            <p className="option-text-attendance">Agregar Asistencia</p>
                        </div>

                        <div 
                            className={`option-card-attendance ${selectedOption === 'update' ? 'selected' : ''}`}
                            onClick={() => handleOptionSelect('update')}
                        >
                            <div className="option-icon-container-attendance">
                                <img 
                                    src="/src/assets/Icons/actualizar (1).png" 
                                    alt="Actualizar Asistencia"
                                    className="option-icon-attendance"
                                />
                            </div>
                            <p className="option-text-attendance">Actualizar Asistencia</p>
                        </div>

                        <div 
                            className={`option-card-attendance ${selectedOption === 'view' ? 'selected' : ''}`}
                            onClick={() => handleOptionSelect('view')}
                        >
                            <div className="option-icon-container-attendance">
                                <img 
                                    src="/src/assets/Icons/archivos.png" 
                                    alt="Consultar Asistencias"
                                    className="option-icon-attendance"
                                />
                            </div>
                            <p className="option-text-attendance">Consultar Asistencias</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        );
    }

    if (selectedOption === 'add') {
        const currentParticipant = participants[currentParticipantIndex];
        const participantStatus = tempAttendance[currentParticipant?.aprendiz?.ID] || 'Pendiente';

        return (
            <div className="modal-overlay-attendance">
                <div className="modal-container-register-attendance">
                    <div className="modal-header-attendance">
                        <div className="header-content-attendance">
                            <button className="back-btn-attendance" onClick={handleBack}>
                                ← Volver
                            </button>
                            <h2>
                                <span className="header-icon-attendance">➕</span>
                                Agregar <span className="complementary-text-attendance">Asistencia</span>
                            </h2>
                        </div>
                    </div>

                    <div className="modal-content-register-attendance">
                        <p className="section-subtitle-attendance">
                            En este listado puedes agregar las asistencias del día {format(parseISO(selectedDate), 'dd/MM/yyyy', { locale: es })}
                        </p>

                        {error && (
                            <div className="error-message-attendance">{error}</div>
                        )}

                        {participants.length === 0 ? (
                            <div className="no-data-attendance">
                                <p>No hay participantes inscritos en este curso</p>
                            </div>
                        ) : currentParticipant ? (
                            <div className="carousel-section-attendance">
                                <div className="carousel-container-attendance">
                                    <div className="carousel-wrapper-attendance">
                                        <button
                                            className="carousel-arrow-attendance"
                                            onClick={handlePrevParticipant}
                                            disabled={currentParticipantIndex === 0}
                                        >
                                            <img src="/src/assets/Icons/arrowLeft.png" alt="Flecha izquierda" />
                                        </button>

                                        <div className="carousel-track-attendance">
                                            {participants.map((participant, index) => {
                                                const isMain = index === currentParticipantIndex;
                                                const isVisible = Math.abs(index - currentParticipantIndex) <= 2;

                                                if (!isVisible) return null;

                                                const position = index - currentParticipantIndex;
                                                const scale = 1 - Math.abs(position) * 0.1;
                                                const opacity = 1 - Math.abs(position) * 0.2;

                                                return (
                                                    <div
                                                        key={participant.ID}
                                                        className={`carousel-card-attendance ${isMain ? 'main-card' : 'side-card'}`}
                                                        style={{
                                                            transform: `translateX(${position * 80}%) scale(${scale})`,
                                                            zIndex: 5 - Math.abs(position),
                                                            opacity: opacity
                                                        }}
                                                    >
                                                        <div className="participant-image-attendance">
                                                            <img
                                                                src={participant.aprendiz?.foto_perfil ?
                                                                    participant.aprendiz.foto_perfil.includes('googleusercontent.com') ?
                                                                        `${participant.aprendiz.foto_perfil}=s400-c-rw` :
                                                                        participant.aprendiz.foto_perfil
                                                                    : "/src/assets/Icons/usuario.png"}
                                                                alt={`Foto de ${participant.aprendiz?.nombres}`}
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = "/src/assets/Icons/usuario.png";
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <button
                                            className="carousel-arrow-attendance"
                                            onClick={handleNextParticipant}
                                            disabled={currentParticipantIndex === participants.length - 1}
                                        >
                                            <img src="/src/assets/Icons/arrowRight.png" alt="Flecha derecha" />
                                        </button>
                                    </div>
                                    
                                    <p className="participant-name-attendance">
                                        {currentParticipant?.aprendiz?.nombres} {currentParticipant?.aprendiz?.apellidos}
                                    </p>
                                </div>

                                <div className="attendance-buttons-attendance">
                                    <button
                                        className={`attendance-btn-attendance present ${participantStatus === 'Presente' ? 'active' : ''}`}
                                        onClick={() => handleAttendanceStatus(currentParticipant.aprendiz.ID, 'Presente')}
                                    >
                                        Asistencia
                                    </button>
                                    <button
                                        className={`attendance-btn-attendance absent ${participantStatus === 'Ausente' ? 'active' : ''}`}
                                        onClick={() => handleAttendanceStatus(currentParticipant.aprendiz.ID, 'Ausente')}
                                    >
                                        Inasistencia
                                    </button>
                                </div>

                                <div className="action-buttons-attendance">
                                    <button
                                        className="primary-btn-attendance"
                                        onClick={handleSaveAttendance}
                                    >
                                        <span>💾</span>
                                        Guardar Reporte
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="no-data-attendance">
                                <p>No hay participantes disponibles</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (selectedOption === 'update') {
        return (
            <div className="modal-overlay-attendance">
                <div className="modal-container-register-attendance">
                    <div className="modal-header-attendance">
                        <div className="header-content-attendance">
                            <button className="back-btn-attendance" onClick={handleBack}>
                                ← Volver
                            </button>
                            <h2>
                                <span className="header-icon-attendance"></span>
                                Actualizar <span className="complementary-text-attendance">Asistencia</span>
                            </h2>
                        </div>
                    </div>

                    <div className="modal-content-register-attendance">
                        <p className="section-subtitle-attendance">
                            En este listado puedes actualizar las asistencias del día {format(parseISO(selectedDate), 'dd/MM/yyyy', { locale: es })}
                        </p>

                        <div className="update-layout-attendance">
                            <div className="filters-section-attendance">
                                <h3 className="filters-header-attendance">🔍 Filtros</h3>
                                
                                <div className="filters-grid-attendance">
                                    <div className="filter-group-attendance">
                                        <label className="filter-label-attendance">Nombre o documento</label>
                                        <input
                                            className="search-input-attendance"
                                            type="text"
                                            placeholder="Buscar por nombre o documento..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>

                                    <div className="filter-group-attendance">
                                        <label className="filter-label-attendance">Estado del aprendiz</label>
                                        <div className="filter-buttons-attendance">
                                            <button 
                                                className={`filter-btn-attendance ${selectedStatus === 'activo' ? 'selected' : ''}`}
                                                onClick={() => setSelectedStatus(selectedStatus === 'activo' ? '' : 'activo')}
                                            >
                                                Activo
                                            </button>
                                            <button 
                                                className={`filter-btn-attendance ${selectedStatus === 'inactivo' ? 'selected' : ''}`}
                                                onClick={() => setSelectedStatus(selectedStatus === 'inactivo' ? '' : 'inactivo')}
                                            >
                                                Inactivo
                                            </button>
                                        </div>
                                    </div>

                                    <div className="filter-group-attendance">
                                        <label className="filter-label-attendance">Tipo de asistencia</label>
                                        <div className="filter-buttons-attendance">
                                            <button 
                                                className={`filter-btn-attendance ${selectedAttendance === 'Presente' ? 'selected' : ''}`}
                                                onClick={() => setSelectedAttendance(selectedAttendance === 'Presente' ? '' : 'Presente')}
                                            >
                                                Asistencia
                                            </button>
                                            <button 
                                                className={`filter-btn-attendance ${selectedAttendance === 'Ausente' ? 'selected' : ''}`}
                                                onClick={() => setSelectedAttendance(selectedAttendance === 'Ausente' ? '' : 'Ausente')}
                                            >
                                                Inasistencia
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="carousel-section-attendance">
                                {error && (
                                    <div className="error-message-attendance">{error}</div>
                                )}

                                {participants.length === 0 ? (
                                    <div className="no-data-attendance">
                                        <p>No hay participantes inscritos en este curso</p>
                                    </div>
                                ) : filteredParticipants.length === 0 ? (
                                    <div className="no-data-attendance">
                                        <p>No hay participantes que coincidan con los filtros</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="carousel-container-attendance">
                                            <div className="carousel-wrapper-attendance">
                                                <button
                                                    className="carousel-arrow-attendance"
                                                    onClick={handlePrevParticipant}
                                                    disabled={currentParticipantIndex === 0}
                                                >
                                                    <img src="/src/assets/Icons/arrowLeft.png" alt="Flecha izquierda" />
                                                </button>

                                                <div className="carousel-track-attendance">
                                                    {filteredParticipants.map((participant, index) => {
                                                        const isMain = index === currentParticipantIndex;
                                                        const isVisible = Math.abs(index - currentParticipantIndex) <= 1;

                                                        if (!isVisible) return null;

                                                        const position = index - currentParticipantIndex;
                                                        const scale = 1 - Math.abs(position) * 0.1;
                                                        const opacity = 1 - Math.abs(position) * 0.2;

                                                        return (
                                                            <div
                                                                key={participant.aprendiz.ID}
                                                                className={`carousel-card-attendance ${isMain ? 'main-card' : 'side-card'}`}
                                                                style={{
                                                                    transform: `translateX(${position * 80}%) scale(${scale})`,
                                                                    zIndex: 5 - Math.abs(position),
                                                                    opacity: opacity
                                                                }}
                                                            >
                                                                <div className="participant-image-attendance">
                                                                    <img
                                                                        src={participant.aprendiz?.foto_perfil ?
                                                                            participant.aprendiz.foto_perfil.includes('googleusercontent.com') ?
                                                                                `${participant.aprendiz.foto_perfil}=s400-c-rw` :
                                                                                participant.aprendiz.foto_perfil
                                                                            : "/src/assets/Icons/usuario.png"}
                                                                        alt={`Foto de ${participant.aprendiz?.nombres}`}
                                                                        onError={(e) => {
                                                                            e.target.onerror = null;
                                                                            e.target.src = "/src/assets/Icons/usuario.png";
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <button
                                                    className="carousel-arrow-attendance"
                                                    onClick={handleNextParticipant}
                                                    disabled={currentParticipantIndex === filteredParticipants.length - 1}
                                                >
                                                    <img src="/src/assets/Icons/arrowRight.png" alt="Flecha derecha" />
                                                </button>
                                            </div>
                                            
                                            <p className="participant-name-attendance">
                                                {filteredParticipants[currentParticipantIndex]?.aprendiz?.nombres} {filteredParticipants[currentParticipantIndex]?.aprendiz?.apellidos}
                                            </p>
                                        </div>

                                        <div className="action-buttons-attendance">
                                            <button
                                                className="primary-btn-attendance"
                                                onClick={handleSeeApprentice}
                                                disabled={!filteredParticipants[currentParticipantIndex]}
                                            >
                                                <span>👤</span>
                                                Ver Aprendiz
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (selectedOption === 'view') {
        const presentRecords = attendanceRecords.filter(record => record.estado_asistencia === 'Presente');
        const absentRecords = attendanceRecords.filter(record => record.estado_asistencia === 'Ausente');
        const totalRecords = attendanceRecords.length;
        const presentPercentage = totalRecords > 0 ? (presentRecords.length / totalRecords) * 100 : 0;
        const absentPercentage = totalRecords > 0 ? (absentRecords.length / totalRecords) * 100 : 0;

        return (
            <div className="modal-overlay-attendance">
                <div className="modal-container-register-attendance">
                    <div className="modal-header-attendance">
                        <div className="header-content-attendance">
                            <button className="back-btn-attendance" onClick={handleBack}>
                                ← Volver
                            </button>
                            <h2>
                                <span className="header-icon-attendance">📋</span>
                                Reporte de <span className="complementary-text-attendance">Asistencias</span>
                            </h2>
                        </div>
                    </div>

                    <div className="modal-content-register-attendance">
                        <p className="section-subtitle-attendance">
                            Listado general de asistencias del curso
                        </p>

                        <div className="attendance-report-attendance">
                            <div className="report-header-attendance">
                                <div className="report-item-attendance">
                                    <h3 className="report-title-attendance">Asistencias</h3>
                                    <div className="percentage-bar-container-attendance">
                                        <div 
                                            className="percentage-bar-attendance present" 
                                            style={{ width: `${presentPercentage}%` }}
                                        ></div>
                                        <span className="percentage-text-attendance">{presentPercentage.toFixed(1)}%</span>
                                    </div>
                                </div>
                                <div className="report-item-attendance">
                                    <h3 className="report-title-attendance">Inasistencias</h3>
                                    <div className="percentage-bar-container-attendance">
                                        <div 
                                            className="percentage-bar-attendance absent" 
                                            style={{ width: `${absentPercentage}%` }}
                                        ></div>
                                        <span className="percentage-text-attendance">{absentPercentage.toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="attendance-columns-attendance">
                                <div className="attendance-column-attendance">
                                    <h3 className="column-header-attendance">Asistencias ({presentRecords.length})</h3>
                                    <div className="attendance-list-attendance">
                                        {presentRecords.length === 0 ? (
                                            <p className="no-data-attendance">No hay asistencias registradas</p>
                                        ) : (
                                            presentRecords.map((record) => (
                                                <div key={record.ID} className="attendance-item-attendance">
                                                    <div className="attendance-info-attendance">
                                                        <p className="attendance-name-attendance">
                                                            {record.aprendiz?.nombres} {record.aprendiz?.apellidos}
                                                        </p>
                                                        <p className="attendance-document-attendance">
                                                            {record.aprendiz?.documento || 'Sin documento'}
                                                        </p>
                                                        <p className="attendance-status-attendance">
                                                            Estado: {record.aprendiz?.estado || 'Activo'}
                                                        </p>
                                                    </div>
                                                    <button 
                                                        className="attendance-action-attendance"
                                                        onClick={() => {
                                                            setSelectedApprentice({
                                                                ...record,
                                                                attendanceStatus: record.estado_asistencia || 'Pendiente'
                                                            });
                                                            setShowApprenticeDetails(true);
                                                            setSelectedOption(null);
                                                        }}
                                                    >
                                                        <img 
                                                            src="/src/assets/Icons/boton-editar-gris.png" 
                                                            alt="Actualizar" 
                                                        />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="attendance-column-attendance">
                                    <h3 className="column-header-attendance">Inasistencias ({absentRecords.length})</h3>
                                    <div className="attendance-list-attendance">
                                        {absentRecords.length === 0 ? (
                                            <p className="no-data-attendance">No hay inasistencias registradas</p>
                                        ) : (
                                            absentRecords.map((record) => (
                                                <div key={record.ID} className="attendance-item-attendance">
                                                    <div className="attendance-info-attendance">
                                                        <p className="attendance-name-attendance">
                                                            {record.aprendiz?.nombres} {record.aprendiz?.apellidos}
                                                        </p>
                                                        <p className="attendance-document-attendance">
                                                            {record.aprendiz?.documento || 'Sin documento'}
                                                        </p>
                                                        <p className="attendance-status-attendance">
                                                            Estado: {record.aprendiz?.estado || 'Activo'}
                                                        </p>
                                                    </div>
                                                    <button 
                                                        className="attendance-action-attendance"
                                                        onClick={() => {
                                                            setSelectedApprentice({
                                                                ...record,
                                                                attendanceStatus: record.estado_asistencia || 'Pendiente'
                                                            });
                                                            setShowApprenticeDetails(true);
                                                            setSelectedOption(null);
                                                        }}
                                                    >
                                                        <img 
                                                            src="/src/assets/Icons/boton-editar-gris.png" 
                                                            alt="Actualizar" 
                                                        />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (showApprenticeDetails && selectedApprentice) {
        return (
            <div className="modal-overlay-attendance">
                <div className="modal-container-attendance">
                    <div className="modal-header-attendance">
                        <div className="header-content-attendance">
                            <button className="back-btn-attendance" onClick={handleCloseApprenticeDetails}>
                                ← Volver
                            </button>
                            <h2>
                                <span className="header-icon-attendance">👤</span>
                                Actualizar Estado
                            </h2>
                        </div>
                    </div>

                    <div className="modal-body-attendance">
                        <div className="apprentice-details-attendance">
                            <div className="apprentice-image-attendance">
                                <img
                                    src={selectedApprentice.aprendiz?.foto_perfil ?
                                        selectedApprentice.aprendiz.foto_perfil.includes('googleusercontent.com') ?
                                            `${selectedApprentice.aprendiz.foto_perfil}=s400-c-rw` :
                                            selectedApprentice.aprendiz.foto_perfil
                                        : "/src/assets/Icons/usuario.png"}
                                    alt={`Foto de ${selectedApprentice.aprendiz?.nombres}`}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "/src/assets/Icons/usuario.png";
                                    }}
                                />
                            </div>
                            
                            <h3 className="apprentice-name-attendance">
                                {selectedApprentice.aprendiz?.nombres} {selectedApprentice.aprendiz?.apellidos}
                            </h3>

                            <div className="apprentice-status-attendance">
                                Estado actual: 
                                <span className={`status-badge-attendance ${selectedApprentice.attendanceStatus.toLowerCase()}`}>
                                    <span className="status-dot-attendance"></span>
                                    {selectedApprentice.attendanceStatus}
                                </span>
                            </div>

                            <div className="action-buttons-attendance">
                                <button
                                    className={`primary-btn-attendance ${selectedApprentice.attendanceStatus === 'Presente' ? 'absent' : 'present'}`}
                                    onClick={handleToggleAttendance}
                                >
                                    <span>{selectedApprentice.attendanceStatus === 'Presente' ? '❌' : '✅'}</span>
                                    {selectedApprentice.attendanceStatus === 'Presente' ? 'Quitar Asistencia' : 'Agregar Asistencia'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};