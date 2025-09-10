import React, { useEffect, useState } from 'react';
import './SeeMyProfile.css';
import { useLocation } from 'react-router-dom';

import { Footer } from '../../../Components/Layouts/Footer/Footer';
import { Main } from '../../../Components/Layouts/Main/Main';
import axiosInstance from '../../../config/axiosInstance';
import { Header } from '../../Layouts/Header/Header';
import fotoPerfilDefect from "../../../assets/Icons/userDefect.png";

export const SeeMyProfile = () => {
    const location = useLocation();
    const userId = location.state?.userId;
    const fotoPerfilInputRef = React.useRef(null);
    const logoEmpresaInputRef = React.useRef(null);
    const [perfil, setPerfil] = useState(null);
    const [tipoCuenta, setTipoCuenta] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    const getImageSrcFromBase64 = (base64) => {
    if (!base64) return fotoPerfilDefect;
    
    // Si es una ruta de archivo (no base64), devolver la imagen por defecto
    if (typeof base64 === 'string' && (base64.includes('../') || base64.includes('/') || base64.includes('./'))) {
        return fotoPerfilDefect;
    }
    
    try {
        // Detectar tipo MIME
        let mimeType = 'image/jpeg';
        
        if (base64.startsWith('iVBOR')) {
            mimeType = 'image/png';
        } else if (base64.startsWith('/9j/') || base64.startsWith('FFD8')) {
            mimeType = 'image/jpeg';
        } else if (base64.startsWith('R0lGOD')) {
            mimeType = 'image/gif';
        }
        
        return `data:${mimeType};base64,${base64}`;
    } catch (error) {
        console.error('Error procesando imagen:', error);
        return fotoPerfilDefect;
    }
};

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await axiosInstance.get(`/api/users/profile/${userId}`);
                setPerfil(response.data);
                setTipoCuenta(response.data.accountType);
            } catch (error) {
                console.error('Error al obtener el perfil:', error);
                setError('Error al cargar el perfil');
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchProfile();
        }
    }, [userId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name.startsWith("Empresa.")) {
            const key = name.split(".")[1];
            setPerfil((prevPerfil) => ({
                ...prevPerfil,
                Empresa: {
                    ...prevPerfil.Empresa,
                    [key]: value,
                },
            }));
        } else {
            setPerfil({ ...perfil, [name]: value });
        }
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            alert('Por favor selecciona una imagen válida');
            return;
        }
        
        // Validar tamaño (ej: máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('La imagen debe ser menor a 5MB');
            return;
        }
        
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result.split(",")[1];
            if (type === "foto_perfil") {
                setPerfil(prev => ({ ...prev, foto_perfil: base64 }));
            } else if (type === "img_empresa") {
                setPerfil(prev => ({
                    ...prev,
                    Empresa: { 
                        ...prev.Empresa, 
                        img_empresa: base64 
                    }
                }));
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSaveChanges = async () => {
        try {
            setSaving(true);
            setError(null);
            
            // Usar FormData para enviar archivos
            const formData = new FormData();
            
            // Agregar datos básicos del usuario
            formData.append('nombres', perfil?.nombres || '');
            formData.append('apellidos', perfil?.apellidos || '');
            formData.append('email', perfil?.email || '');
            formData.append('celular', perfil?.celular || '');
            formData.append('estado', perfil?.estado || '');
            
            // Si es empresa, agregar datos de la empresa
            if (tipoCuenta === 'Empresa' && perfil?.Empresa) {
                formData.append('empresa', JSON.stringify({
                    NIT: perfil.Empresa.NIT || '',
                    email_empresa: perfil.Empresa.email_empresa || '',
                    nombre_empresa: perfil.Empresa.nombre_empresa || '',
                    direccion: perfil.Empresa.direccion || '',
                    telefono: perfil.Empresa.telefono || '',
                    categoria: perfil.Empresa.categoria || '',
                    estado: perfil.Empresa.estado || 'inactivo'
                }));
            }
            
            // Agregar archivos si existen
            if (fotoPerfilInputRef.current?.files[0]) {
                formData.append('foto_perfil', fotoPerfilInputRef.current.files[0]);
            }
            
            if (logoEmpresaInputRef.current?.files[0]) {
                formData.append('img_empresa', logoEmpresaInputRef.current.files[0]);
            }
            
            await axiosInstance.put(
                `/api/users/perfil/actualizar/${userId}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            
            alert('Perfil actualizado con éxito');
            setEditMode(false);
            
            // Recargar los datos actualizados
            const response = await axiosInstance.get(`/api/users/profile/${userId}`);
            setPerfil(response.data);
            
        } catch (error) {
            console.error('Error al actualizar el perfil:', error);
            if (error.response?.status === 401) {
                setError('Sesión expirada. Por favor inicia sesión nuevamente.');
            } else {
                setError(error.response?.data?.message || 'Hubo un error al actualizar el perfil');
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <>
                <Header />
                <Main>
                    <div className="loading-container">Cargando perfil...</div>
                </Main>
                <Footer />
            </>
        );
    }

    if (!perfil) {
        return (
            <>
                <Header />
                <Main>
                    <div className="error-container">No se pudo cargar el perfil</div>
                </Main>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <Main>
                <div className='container_mainSeeMyProfile'>
                    {error && (
                        <div className="error-message" style={{
                            padding: '10px',
                            backgroundColor: '#ffebee',
                            color: '#c62828',
                            border: '1px solid #ef5350',
                            borderRadius: '4px',
                            marginBottom: '20px'
                        }}>
                            {error}
                        </div>
                    )}

                    {saving && (
                        <div className="loading-message" style={{
                            padding: '10px',
                            backgroundColor: '#e3f2fd',
                            color: '#1565c0',
                            border: '1px solid #2196f3',
                            borderRadius: '4px',
                            marginBottom: '20px'
                        }}>
                            Guardando cambios...
                        </div>
                    )}

                    <div className='container_profile'>
                        <h3>{tipoCuenta}</h3>
                        <img
                            src={getImageSrcFromBase64(perfil?.foto_perfil)}
                            alt="Foto de perfil"
                            className="profile-img"
                            style={{ cursor: editMode ? "pointer" : "default" }}
                            onClick={() => {
                                if (editMode && fotoPerfilInputRef.current) fotoPerfilInputRef.current.click();
                            }}
                        />
                        <input
                            type="file"
                            accept="image/*"
                            ref={fotoPerfilInputRef}
                            style={{ display: "none" }}
                            onChange={e => handleFileChange(e, "foto_perfil")}
                        />

                        <h4>
                            Datos{" "}
                            <span>
                                {tipoCuenta === "Empresa" ? "Manager" : tipoCuenta}
                            </span>
                        </h4>
                        
                        <p>
                            Nombres <br />
                            {editMode ? (
                                <input
                                    type="text"
                                    name="nombres"
                                    className='input_updateData'
                                    value={perfil?.nombres || ''}
                                    onChange={handleInputChange}
                                />
                            ) : (
                                perfil?.nombres || ''
                            )}
                        </p>

                        <p>
                            Apellidos <br />
                            {editMode ? (
                                <input
                                    type="text"
                                    name="apellidos"
                                    className='input_updateData'
                                    value={perfil?.apellidos || ''}
                                    onChange={handleInputChange}
                                />
                            ) : (
                                perfil?.apellidos || ''
                            )}
                        </p>

                        <p>
                            Email <br />
                            {editMode ? (
                                <input
                                    type="email"
                                    name="email"
                                    className='input_updateData'
                                    value={perfil?.email || ''}
                                    onChange={handleInputChange}
                                />
                            ) : (
                                perfil?.email || ''
                            )}
                        </p>

                        <p>
                            Celular <br />
                            {editMode ? (
                                <input
                                    type="text"
                                    name="celular"
                                    className='input_updateData'
                                    value={perfil?.celular || ''}
                                    onChange={handleInputChange}
                                />
                            ) : (
                                perfil?.celular || ''
                            )}
                        </p>

                        <button
                            className={`updateProfile ${editMode ? 'cancel' : ''}`}
                            onClick={() => setEditMode(!editMode)}
                            disabled={saving}
                        >
                            {editMode ? 'Cancelar' : 'Editar Perfil'}
                        </button>

                        {editMode && (
                            <button 
                                className='updateProfile1' 
                                onClick={handleSaveChanges}
                                disabled={saving}
                            >
                                {saving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        )}
                    </div>

                    {(tipoCuenta === 'Administrador' || tipoCuenta === 'Instructor' || tipoCuenta === 'Gestor') && perfil?.Sena && (
                        <div className='container_data_company'>
                            <div className='container_nameCompany-Status'>
                                <div className='name_company'>
                                    <img
                                        src={getImageSrcFromBase64(perfil?.Sena?.img_sena)}
                                        alt="Logo sede"
                                        className="profile-img"
                                    />
                                    <div>
                                        <h3>{perfil.Sena.nombre_sede || '-'}</h3>
                                        <p>NIT: {perfil.Sena.NIT || '-'}</p>
                                    </div>
                                </div>

                                <div className='status-company'>
                                    <div
                                        className={`color_status ${perfil?.estado === 'activo' ? 'status-green' : perfil?.estado === 'inactivo' ? 'status-red' : ''}`}
                                    ></div>
                                    <h3>Estado</h3>
                                    {editMode ? (
                                        <select
                                            name="estado"
                                            className="input_updateStatus"
                                            value={perfil?.estado || ''}
                                            onChange={handleInputChange}
                                            disabled={saving}
                                        >
                                            <option value="activo">Activo</option>
                                            <option value="inactivo">Inactivo</option>
                                        </select>
                                    ) : (
                                        <h4>{perfil?.estado === 'activo' ? 'Activo' : perfil?.estado === 'inactivo' ? 'Inactivo' : '-'}</h4>
                                    )}
                                </div>
                            </div>
                            
                            <div className='container_data'>
                                <div className='data_company'>
                                    <h4 id='titleDataSede'>Datos sede</h4>
                                    <p>Dirección: <br />{perfil.Sena.direccion || '-'}</p>
                                    <p>Teléfono: <br />{perfil.Sena.telefono || '-'}</p>
                                    <p>Email: <br />{perfil.Sena.email_sena || '-'}</p>
                                    <p>Ciudad: <br />{perfil.Sena.Ciudad?.nombre || '-'}</p>
                                    <p>Departamento: <br />{perfil.Sena.Ciudad?.Departamento?.nombre || '-'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {tipoCuenta === 'Empresa' && (
                        <div className='container_data_company'>
                            <div className='container_nameCompany-Status'>
                                <div className='name_company'>
                                    <img
                                        src={getImageSrcFromBase64(perfil?.Empresa?.img_empresa)}
                                        alt="Logo empresa"
                                        className="profile-img"
                                        style={{ cursor: editMode ? "pointer" : "default" }}
                                        onClick={() => {
                                            if (editMode && logoEmpresaInputRef.current) logoEmpresaInputRef.current.click();
                                        }}
                                    />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={logoEmpresaInputRef}
                                        style={{ display: "none" }}
                                        onChange={e => handleFileChange(e, "img_empresa")}
                                    />
                                    <div>
                                        <h3>
                                            {editMode ? (
                                                <input
                                                    type="text"
                                                    name="Empresa.nombre_empresa"
                                                    className='input_updateData'
                                                    value={perfil?.Empresa?.nombre_empresa || ''}
                                                    onChange={handleInputChange}
                                                    disabled={saving}
                                                />
                                            ) : (
                                                perfil.Empresa.nombre_empresa || '-'
                                            )}
                                        </h3>
                                        <p>
                                            NIT:{" "}
                                            {editMode ? (
                                                <input
                                                    type="text"
                                                    name="Empresa.NIT"
                                                    className='input_updateData'
                                                    value={perfil?.Empresa?.NIT || ''}
                                                    onChange={handleInputChange}
                                                    disabled={saving}
                                                />
                                            ) : (
                                                perfil.Empresa.NIT || '-'
                                            )}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className='status-company'>
                                    <div
                                        className={`color_status ${perfil?.estado === 'activo' ? 'status-green' : perfil?.estado === 'inactivo' ? 'status-red' : ''}`}
                                    ></div>
                                    <h3>Estado</h3>
                                    {editMode ? (
                                        <select
                                            name="estado"
                                            className="input_updateStatus"
                                            value={perfil?.estado || ''}
                                            onChange={handleInputChange}
                                            disabled={saving}
                                        >
                                            <option value="activo">Activo</option>
                                            <option value="inactivo">Inactivo</option>
                                        </select>
                                    ) : (
                                        <h4>{perfil?.estado === 'activo' ? 'Activo' : perfil?.estado === 'inactivo' ? 'Inactivo' : '-'}</h4>
                                    )}
                                </div>
                            </div>

                            <div className='container_data'>
                                <div className='data_company'>
                                    <h4 id='titleDataSede'>Datos Empresa</h4>

                                    <p>
                                        Dirección: <br />
                                        {editMode ? (
                                            <input
                                                type="text"
                                                name="Empresa.direccion"
                                                className='input_updateData'
                                                value={perfil?.Empresa?.direccion || ''}
                                                onChange={handleInputChange}
                                                disabled={saving}
                                            />
                                        ) : (
                                            perfil?.Empresa?.direccion || ''
                                        )}
                                    </p>
                                    
                                    <p>
                                        Teléfono: <br />
                                        {editMode ? (
                                            <input
                                                type="text"
                                                name="Empresa.telefono"
                                                className='input_updateData'
                                                value={perfil?.Empresa?.telefono || ''}
                                                onChange={handleInputChange}
                                                disabled={saving}
                                            />
                                        ) : (
                                            perfil?.Empresa?.telefono || ''
                                        )}
                                    </p>
                                    
                                    <p>
                                        Email: <br />
                                        {editMode ? (
                                            <input
                                                type="text"
                                                name="Empresa.email_empresa"
                                                className='input_updateData'
                                                value={perfil?.Empresa?.email_empresa || ''}
                                                onChange={handleInputChange}
                                                disabled={saving}
                                            />
                                        ) : (
                                            perfil?.Empresa?.email_empresa || ''
                                        )}
                                    </p>
                                    
                                    <p>
                                        Ciudad: <br />
                                        {perfil?.Empresa?.Ciudad?.nombre || '-'}
                                    </p>

                                    <p>
                                        Departamento: <br />
                                        {perfil?.Empresa?.Ciudad?.Departamento?.nombre || '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Main>
            <Footer />
        </>
    );
};