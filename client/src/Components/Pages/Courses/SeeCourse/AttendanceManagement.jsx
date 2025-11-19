import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../../config/axiosInstance';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
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

    const handleSaveAttendance = async () => {
        try {
            setLoading(true);
            setError(null);

            const formattedDate = format(parseISO(selectedDate), 'yyyy-MM-dd');

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
        // Buscar el registro de asistencia correspondiente
        const record = attendanceRecords.find(r => r?.aprendiz?.ID === participant.aprendiz?.ID);
        
        // Filtro por búsqueda
        const searchTermLower = searchTerm.toLowerCase();
        const matchesSearch =
            (participant.aprendiz?.nombres && participant.aprendiz.nombres.toLowerCase().includes(searchTermLower)) ||
            (participant.aprendiz?.apellidos && participant.aprendiz.apellidos.toLowerCase().includes(searchTermLower)) ||
            (participant.aprendiz?.documento && participant.aprendiz.documento.toLowerCase().includes(searchTermLower));

        // Filtro por estado del participante
        const matchesStatus = selectedStatus === '' || record?.aprendiz?.estado === selectedStatus;

        // Si no hay filtro de asistencia seleccionado, solo aplicar búsqueda y estado
        if (selectedAttendance === '') {
            return matchesSearch && matchesStatus;
        }

        // Verificar si el registro de asistencia coincide con el filtro seleccionado
        const matchesAttendance = record?.estado_asistencia === selectedAttendance;
        
        // Aplicar todos los filtros
        return matchesSearch && matchesStatus && matchesAttendance;
    });

    // Efecto para reiniciar el índice del carrusel cuando cambian los filtros
    useEffect(() => {
        setCurrentParticipantIndex(0);
    }, [searchTerm, selectedStatus, selectedAttendance]);

    const handleSeeApprentice = () => {
        console.log('handleSeeApprentice called');
        const currentApprentice = filteredParticipants[currentParticipantIndex];
        if (!currentApprentice) {
            console.error('No hay aprendiz seleccionado');
            return;
        }

        console.log('Aprendiz seleccionado:', currentApprentice);
        
        const attendanceRecord = attendanceRecords.find(
            record => record?.aprendiz?.ID === currentApprentice?.aprendiz?.ID
        );
        
        console.log('Registro de asistencia encontrado:', attendanceRecord);

        setSelectedApprentice({
            ...currentApprentice,
            attendanceStatus: attendanceRecord?.estado_asistencia || 'Pendiente'
        });
        console.log('Setting showApprenticeDetails to true');
        setShowApprenticeDetails(true);
        setSelectedOption(null);
    };

    const handleCloseApprenticeDetails = () => {
        setShowApprenticeDetails(false);
        setSelectedApprentice(null);
        setSelectedOption('update');
    };

    const handleToggleAttendance = async () => {
        if (!selectedApprentice) return;

        const newStatus = selectedApprentice.attendanceStatus === 'Presente' ? 'Ausente' : 'Presente';
        
        try {
            const existingRecord = attendanceRecords.find(
                record => record?.aprendiz?.ID === selectedApprentice.aprendiz.ID
            );

            if (existingRecord && existingRecord.ID) {
                await axiosInstance.put(`/api/attendance/courses/${courseId}/update`, {
                    attendanceId: existingRecord.ID,
                    status: newStatus
                });
            } else {
                await axiosInstance.post(`/api/attendance/courses/${courseId}/register`, {
                    usuario_ID: selectedApprentice.aprendiz.ID,
                    estado: newStatus,
                    fecha: format(parseISO(selectedDate), 'yyyy-MM-dd')
                });
            }

            // Actualizar el estado local
            setSelectedApprentice(prev => ({
                ...prev,
                attendanceStatus: newStatus
            }));
            
            // Actualizar los registros de asistencia
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
            setError('Error al actualizar la asistencia');

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
            <Modal_General className='modal-attendance' closeModal={onClose}>
                <p>Por favor seleccione una de las siguientes opciones</p>


                <div className='options1-add'>
                    <p>Agregar asistencia</p>
                    <button
                        className={`option-button-add ${selectedOption === 'add' ? 'selected' : ''}`}
                        onClick={() => handleOptionSelect('add')}
                    >
                        <img src="/src/assets/Icons/agregar-archivo.png" alt="Agregar Asistencia"></img>
                    </button>
                </div>
                <div className='options2-update'>
                    <p>Actualizar asistencia</p>
                    <button
                        className={`option-button-update ${selectedOption === 'update' ? 'selected' : ''}`}
                        onClick={() => handleOptionSelect('update')}
                    >
                        <img src="/src/assets/Icons/actualizar (1).png" alt="Actualizar Asistencia"></img>
                    </button>
                </div>
                <div className='options3-view'>
                    <p>Consultar asistencias</p>
                    <button
                        className={`option-button-view ${selectedOption === 'view' ? 'selected' : ''}`}
                        onClick={() => handleOptionSelect('view')}
                    >
                        <img src="/src/assets/Icons/archivos.png" alt="Consultar Asistencias"></img>
                    </button>
                </div>

            </Modal_General>
        );
    }

    if (selectedOption === 'add') {
        const currentParticipant = participants[currentParticipantIndex];
        const participantStatus = tempAttendance[currentParticipant?.aprendiz?.ID] || 'Pendiente';

        return (
            <Modal_General className='modal-attendance-register' closeModal={onClose}>




                <h2>Agregar <span className='complementary'>asistencia</span></h2>
                <p> en este listado puedes agregar las asistencias del dia  {format(parseISO(selectedDate), 'dd/MM/yyyy', { locale: es })}
                </p>


                {error && (
                    <p className="error-message">{error}</p>
                )}

                {participants.length === 0 ? (
                    <div className="no-participants">
                        <p>No hay participantes inscritos en este curso</p>
                    </div>
                ) : currentParticipant ? (
                    <div className="carousel-container-register">
                        <div className="carousel-wrapper-register">
                            <button
                                className="carousel-arrow-register left"
                                onClick={handlePrevParticipant}>
                                <img src="/src/assets/Icons/arrowLeft.png" alt="Flecha izquierda" />
                            </button>

                            <div className='carousel-track-register'>
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
                                            className={`carousel-card-register ${isMain ? 'main-card' : 'side-card'}`}
                                            style={{
                                                transform: `translateX(${position * 50}%) scale(${scale})`,
                                                zIndex: 5 - Math.abs(position),
                                                opacity: opacity
                                            }}
                                        >
                                            <div className="participant-image">
                                                <img
                                                    src={participant.aprendiz?.foto_perfil ?
                                                        participant.aprendiz.foto_perfil.includes('googleusercontent.com') ?
                                                            `${participant.aprendiz.foto_perfil}=s400-c-rw` :
                                                            participant.aprendiz.foto_perfil
                                                        : "/src/assets/Icons/usuario.png"}
                                                    alt={`Foto de ${participant.aprendiz?.nombres}`}
                                                    onError={(e) => {
                                                        console.log('Error cargando imagen:', e);
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
                                className="carousel-arrow-register right"
                                onClick={handleNextParticipant}
                            >
                                <img src="/src/assets/Icons/arrowRight.png" alt="Flecha derecha" />
                            </button>
                        </div>
                        <p className="participant-name">
                            {currentParticipant?.aprendiz?.nombres} {currentParticipant?.aprendiz?.apellidos}
                        </p>



                    </div>

                ) : null}

                <div className="attendance-buttons">
                    <button
                        className={`attendance-button-asist ${participantStatus === 'Presente' ? 'active' : ''}`}
                        onClick={() => handleAttendanceStatus(currentParticipant.aprendiz.ID, 'Presente')}
                    >
                        Asistencia
                    </button>
                    <button
                        className={`attendance-button-noAsist ${participantStatus === 'Ausente' ? 'active' : ''}`}
                        onClick={() => handleAttendanceStatus(currentParticipant.aprendiz.ID, 'Ausente')}
                    >
                        Inasistencia
                    </button>
                </div>

                <button
                    className="save-button-register"
                    onClick={handleSaveAttendance}
                >
                    Guardar reporte
                </button>
            </Modal_General>
        );
    }

    if (selectedOption === 'update') {
        return (
            <Modal_General className='modal-attendance-register' closeModal={onClose}>
                <h2>Actualizar <span className='complementary'>asistencia</span></h2>
                <p>en este listado puedes actualizar las asistencias del día {format(parseISO(selectedDate), 'dd/MM/yyyy', { locale: es })}</p>

                <div className="update-container">
                    <section className="sectionGestionsApprenticeBody">
                        <section className="filterGestionsApprentice">
                            <strong className="tituloFiltrarAprendiz">Filtrar por:</strong>

                            <article className="filterOptionsGestionsApprentice">
                                <div className="filterOptionNameApprentice">
                                    <label className="labelFilterOption1Apprentice">Nombre o documento de identidad</label>

                                    <div className="inputFilterOption1Apprentice">
                                        <input
                                            className="inputFilterOptionTextApprentice"
                                            type="text"
                                            placeholder="Escriba el nombre o documento"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        <div className='iconSearchFilterAttendance'>
                                            <img 
                                                src="/src/assets/Icons/lupa.png" 
                                                alt="Buscar" 
                                                className="searchIconAttendance"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="AttendanceStatusFilter">
                                    <label
                                        className="labelFilterOption1Attendance"
                                        style={{ padding: "0 0 .5rem 0" }}
                                    >
                                    Estado del aprendiz
                                    </label>

                                    <section className="sectionStatusFilterAttendance">
                                        <button 
                                            className={`statusOptionAttendance ${selectedStatus === 'inactivo' ? 'selected' : ''}`}
                                            onClick={() => setSelectedStatus(selectedStatus === 'inactivo' ? '' : 'inactivo')}
                                        >
                                            Inactivo
                                        </button>
                                        <button 
                                            className={`statusOptionAttendance ${selectedStatus === 'activo' ? 'selected' : ''}`}
                                            onClick={() => setSelectedStatus(selectedStatus === 'activo' ? '' : 'activo')}
                                        >
                                            Activo
                                        </button>
                                    </section>
                                </div>

                                <div className="AttendanceStatusFilter">
                                    <label
                                        className="labelFilterOption1Attendance"
                                        style={{ padding: "0 0 .5rem 0" }}
                                    >
                                    Tipo de asistencia
                                    </label>

                                    <section className="sectionStatusFilterAttendance">
                                        <button 
                                            className={`statusOptionAttendance ${selectedAttendance === 'Ausente' ? 'selected' : ''}`}
                                            onClick={() => setSelectedAttendance(selectedAttendance === 'Ausente' ? '' : 'Ausente')}
                                        >
                                            Inasistencia
                                        </button>
                                        <button 
                                            className={`statusOptionAttendance ${selectedAttendance === 'Presente' ? 'selected' : ''}`}
                                            onClick={() => setSelectedAttendance(selectedAttendance === 'Presente' ? '' : 'Presente')}
                                        >
                                            Asistencia
                                        </button>
                                    </section>
                                </div>
                            </article>
                        </section>
                    </section>

                    <div className="carousel-section">
                        {error && (
                            <p className="error-message">{error}</p>
                        )}

                        {participants.length === 0 ? (
                            <div className="no-participants">
                                <p>No hay participantes inscritos en este curso</p>
                            </div>
                        ) : filteredParticipants.length === 0 ? (
                            <div className="no-participants">
                                <p>No hay participantes que coincidan con los filtros</p>
                            </div>
                        ) : (
                            <div className="carousel-container-update">
                                <div className="carousel-wrapper-update">
                                    <button
                                        className="carousel-arrow-update left"
                                        onClick={handlePrevParticipant}
                                        disabled={currentParticipantIndex === 0}
                                    >
                                        <img src="/src/assets/Icons/arrowLeft.png" alt="Flecha izquierda" />
                                    </button>

                                    <div className='carousel-track-update'>
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
                                                    className={`carousel-card-update ${isMain ? 'main-card' : 'side-card'}`}
                                                    style={{
                                                        transform: `translateX(${position * 50}%) scale(${scale})`,
                                                        zIndex: 5 - Math.abs(position),
                                                        opacity: opacity
                                                    }}
                                                >
                                                    <div className="participant-image">
                                                        <img
                                                            src={participant.aprendiz?.foto_perfil ?
                                                                participant.aprendiz.foto_perfil.includes('googleusercontent.com') ?
                                                                    `${participant.aprendiz.foto_perfil}=s400-c-rw` :
                                                                    participant.aprendiz.foto_perfil
                                                                : "/src/assets/Icons/usuario.png"}
                                                            alt={`Foto de ${participant.aprendiz?.nombres}`}
                                                            onError={(e) => {
                                                                console.log('Error cargando imagen:', e);
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
                                        className="carousel-arrow-update right"
                                        onClick={handleNextParticipant}
                                        disabled={currentParticipantIndex === filteredParticipants.length - 1}
                                    >
                                        <img src="/src/assets/Icons/arrowRight.png" alt="Flecha derecha" />
                                    </button>
                                </div>
                                <p className="participant-name">
                                    {filteredParticipants[currentParticipantIndex]?.aprendiz?.nombres} {filteredParticipants[currentParticipantIndex]?.aprendiz?.apellidos}
                                </p>
                               
                            </div>
                        )}
                    </div>
                </div>

                <button
                    className="see-apprentice-button-update"
                    onClick={handleSeeApprentice}
                    disabled={!filteredParticipants[currentParticipantIndex]}
                >
                    Ver Aprendiz
                </button>
            </Modal_General>
        );
    }

    if (selectedOption === 'view') {
        const presentRecords = attendanceRecords.filter(record => record.estado_asistencia === 'Presente');
        const absentRecords = attendanceRecords.filter(record => record.estado_asistencia === 'Ausente');
        const totalRecords = attendanceRecords.length;
        const presentPercentage = totalRecords > 0 ? (presentRecords.length / totalRecords) * 100 : 0;
        const absentPercentage = totalRecords > 0 ? (absentRecords.length / totalRecords) * 100 : 0;

        return (
            <Modal_General className='modal-attendance-register' closeModal={onClose}>
                <h2>Reporte de <span className='complementary'>asistencias</span></h2>
                <p className='SubtitleViewAttendance'>Listado general de asistencias del curso</p>

                <div className="attendance-report-header">
                    <div className="attendance-header-item">
                        <h3>Asistencias</h3>
                        <div className="percentage-bar-container">
                            <div 
                                className="percentage-bar present" 
                                style={{ width: `${presentPercentage}%` }}
                            ></div>
                            <span className="percentage-text">{presentPercentage.toFixed(1)}%</span>
                        </div>
                    </div>
                    <div className="attendance-header-item">
                        <h3>Inasistencias</h3>
                        <div className="percentage-bar-container">
                            <div 
                                className="percentage-bar absent" 
                                style={{ width: `${absentPercentage}%` }}
                            ></div>
                            <span className="percentage-text">{absentPercentage.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>

                <div className="simple-attendance-container">
                    <div className="simple-attendance-column">
                       
                        <div className="simple-attendance-list">
                            {presentRecords.length === 0 ? (
                                <p className="no-records">No hay asistencias registradas</p>
                            ) : (
                                presentRecords.map((record) => (
                                    <div key={record.ID} className="simple-attendance-item">
                                       
                                        <div className="simple-attendance-info">
                                            <div className='container-document'>
                                            <p className="simple-attendance-name">{record.aprendiz?.nombres} {record.aprendiz?.apellidos}</p>
                                            <p className="simple-attendance-document">{record.aprendiz?.documento || 'Sin documento'}</p>
                                            </div>
                                            <p className="simple-attendance-status"> Estado: 
                                                {record.aprendiz?.estado || 'Activo'}
                                            </p>
                                        </div>
                                        <div className='iconFilterAttendance' onClick={() => {
                                            setSelectedApprentice({
                                                ...record,
                                                attendanceStatus: record.estado_asistencia || 'Pendiente'
                                            });
                                            setShowApprenticeDetails(true);
                                            setSelectedOption(null);
                                        }}>
                                            <img 
                                                src="/src/assets/Icons/boton-editar-gris.png" 
                                                alt="Actualizar" 
                                                className="IconAttendance"
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="simple-attendance-column">
                
                        <div className="simple-attendance-list">
                            {absentRecords.length === 0 ? (
                                <p className="no-records">No hay inasistencias registradas</p>
                            ) : (
                                absentRecords.map((record) => (
                                    <div key={record.ID} className="simple-attendance-item">
                                        <div className="simple-attendance-info">
                                            <div className='container-document-2'>
                                            <p className="simple-attendance-name-2">{record.aprendiz?.nombres} {record.aprendiz?.apellidos}</p>
                                            <p className="simple-attendance-document-2">{record.aprendiz?.documento || 'Sin documento'}</p>
                                            </div>
                                            <p className="simple-attendance-status-2"> Estado:
                                                {record.aprendiz?.estado || 'Activo'}
                                            </p>
                                        </div>
                                        <div className='iconFilterAttendance' onClick={() => {
                                            setSelectedApprentice({
                                                ...record,
                                                attendanceStatus: record.estado_asistencia || 'Pendiente'
                                            });
                                            setShowApprenticeDetails(true);
                                            setSelectedOption(null);
                                        }}>
                                            <img 
                                                src="/src/assets/Icons/boton-editar-gris.png" 
                                                alt="Actualizar" 
                                                className="IconAttendance"
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </Modal_General>
        );
    }

    if (showApprenticeDetails && selectedApprentice) {
        return (
            <Modal_General className="modal-apprentice-details" closeModal={handleCloseApprenticeDetails}>
                <div className="apprentice-details-container">
                            <h2>Actualizar estado</h2>
                    <div className='container-card-details'>
                            
                                <div className="participant-image-details">
                                    <img
                                        src={selectedApprentice.aprendiz?.foto_perfil ?
                                            selectedApprentice.aprendiz.foto_perfil.includes('googleusercontent.com') ?
                                                `${selectedApprentice.aprendiz.foto_perfil}=s400-c-rw` :
                                                selectedApprentice.aprendiz.foto_perfil
                                            : "/src/assets/Icons/usuario.png"}
                                        alt={`Foto de ${selectedApprentice.aprendiz?.nombres}`}
                                        onError={(e) => {
                                            console.log('Error cargando imagen:', e);
                                            e.target.onerror = null;
                                            e.target.src = "/src/assets/Icons/usuario.png";
                                        }}
                                    />
                                </div>
                           
                    </div>
                            <p className="participant-name-details">
                                {selectedApprentice.aprendiz?.nombres} {selectedApprentice.aprendiz?.apellidos}
                            </p>

                            <div className="attendance-status-details">
                                Estado: <span className={`status-details ${selectedApprentice.attendanceStatus.toLowerCase()}`}>
                                    {selectedApprentice.attendanceStatus}
                                </span>
                            </div>

                            <div className="attendance-actions">
                                <button
                                    className={`toggle-attendance-button ${selectedApprentice.attendanceStatus === 'Presente' ? 'present' : 'absent'}`}
                                    onClick={handleToggleAttendance}
                                >
                                    {selectedApprentice.attendanceStatus === 'Presente' ? 'Quitar asistencia' : 'Agregar asistencia'}
                                </button>
                            </div>
                </div>
            </Modal_General>
        );
    }

    return null;
}; 