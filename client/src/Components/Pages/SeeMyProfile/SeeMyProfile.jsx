import React, { useEffect, useState } from 'react';
import './SeeMyProfile.css';
import { useLocation } from 'react-router-dom';

import { Footer } from '../../../Components/Layouts/Footer/Footer';
import { Main } from '../../../Components/Layouts/Main/Main';
import axiosInstance from '../../../config/axiosInstance';
import { Header } from '../../Layouts/Header/Header';
import fotoPerfilDefect from "../../../assets/Icons/userDefect.png";
import {validateEmail, validateNumber, validateText, validateAddress, createMensajeError, validateNIT } from '../../../utils/Validators/formValidator';

export const SeeMyProfile = () => {
    const location = useLocation();
    const userId = location.state?.userId;
    const fotoPerfilInputRef = React.useRef(null);
    const logoEmpresaInputRef = React.useRef(null);
    const [perfil, setPerfil] = useState(null);
    const [perfilOriginal, setPerfilOriginal] = useState(null); // Guardar el perfil original
    const [tipoCuenta, setTipoCuenta] = useState('');
    const [editMode, setEditMode] = useState(false);

    const getImageSrcFromBase64 = (value) => {
        // Fallback inmediato si no hay valor
        if (!value) return fotoPerfilDefect;

        // Si ya viene como data URL o URL absoluta, úsala tal cual
        if (typeof value === 'string' && (value.startsWith('data:') || value.startsWith('http'))) {
            return value;
        }

        // Si en BD guardaron una ruta relativa (p.ej. ../Img/userDefect.png), usar por defecto
        if (typeof value === 'string' && /(\.png|\.jpg|\.jpeg|\.gif)$/i.test(value)) {
            return fotoPerfilDefect;
        }

        const base64 = value;
        // Detectar tipo MIME por encabezado base64
        if (typeof base64 === 'string' && base64.startsWith('iVBOR')) {
            return `data:image/png;base64,${base64}`;
        }
        if (typeof base64 === 'string' && base64.startsWith('/9j/')) {
            return `data:image/jpeg;base64,${base64}`;
        }

        // Si la cadena es muy corta, probablemente no es una imagen base64 válida
        if (typeof base64 === 'string' && base64.length < 100) {
            return fotoPerfilDefect;
        }

        // Último recurso: asumir jpeg
        return `data:image/jpeg;base64,${base64}`;
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axiosInstance.get(`/api/users/profile/${userId}`);
                setPerfil(response.data);
                setPerfilOriginal(response.data); // Guardar el perfil original
                setTipoCuenta(response.data.accountType);
            } catch (error) {
                console.error('Error al obtener el perfil:', error);
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
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result.split(",")[1];
            if (type === "foto_perfil") {
                setPerfil(prev => ({ ...prev, foto_perfil: base64 }));
            } else if (type === "img_empresa") {
                setPerfil(prev => ({
                    ...prev,
                    Empresa: { ...prev.Empresa, img_empresa: base64 }
                }));
            }
        };
        reader.readAsDataURL(file);
    };

    const handleModelCancel = (model) => {
        setEditMode(!model)
        setPerfil(perfilOriginal)
    };


    const handleSaveChanges = async () => {
        
        let erroresTipoCuenta = {};

        const ValidationGeneral = {
            nombre: validateText(perfil.nombres),
            apellidos: validateText(perfil.apellidos),
            email: validateEmail(perfil.email),
            Celular: validateNumber(perfil.celular) 
        }

        if (tipoCuenta === 'Empresa') {
            erroresTipoCuenta = {
                nombre_empresa: validateText(perfil.Empresa.nombre_empresa),
                direccion: validateAddress(perfil.Empresa.direccion),
                telefono: validateNumber(perfil.Empresa.telefono),
                email: validateEmail(perfil.Empresa.email_empresa),
                nit: validateNIT(perfil?.Empresa?.NIT ) 
            }
        }

        const error = {
            ...ValidationGeneral,
            ...erroresTipoCuenta
        }
        
        const hastErrors = await createMensajeError(error);
        if(hastErrors != null){
            alert(hastErrors)
            setPerfil(perfilOriginal); // Actualizar el perfil original con los datos
            return ;
        }

        try {
            // Clonamos el perfil
            const payload = { ...perfil };

            // Si es una empresa, serializamos el objeto Empresa
            if (tipoCuenta === 'Empresa' && perfil.Empresa) {
                payload.documento = perfil?.Empresa?.NIT;
                payload.empresa = JSON.stringify(perfil.Empresa);
            }

            await axiosInstance.put(`/api/users/perfil/actualizar/${userId}`, payload);
            alert('Perfil actualizado con éxito');
            setPerfilOriginal(perfil); // Actualizar el perfil original con los nuevos datos
            setEditMode(false);
        } catch (error) {
            console.error('Error al actualizar el perfil:', error);
            console.error('Error response:', error.response);
            console.error('Error response data:', error.response?.data);
            console.error('Error response status:', error.response?.status);
            
            // Mostrar el mensaje de error específico del backend
            let errorMessage = 'Hubo un error al actualizar el perfil';
            
            // Intentar extraer el mensaje del backend de diferentes maneras
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data && typeof error.response.data === 'string') {
                errorMessage = error.response.data;
            } else if (error.response?.data && typeof error.response.data === 'object') {
                // Intentar extraer el mensaje del objeto
                const data = error.response.data;
                if (data.message) {
                    errorMessage = data.message;
                } else {
                    errorMessage = JSON.stringify(data);
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            alert(errorMessage);
            
            // Restaurar el perfil original en caso de error
            if (perfilOriginal) {
                setPerfil(perfilOriginal);
            }
        }
    };

    return (
        <>
            <Header />
            <Main>
                <div className='container_mainSeeMyProfile'>

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
                        {/* Foto de perfil */}
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

                        {tipoCuenta !== 'Aprendiz' && (
                            <>
                                <button
                                    className={`updateProfile ${editMode ? 'cancel' : ''}`}
                                    onClick={() => handleModelCancel(editMode)}
                                >
                                    {editMode ? '' : ''}
                                </button>

                                {editMode && (
                                    <button className='updateProfile1' onClick={handleSaveChanges}>

                                    </button>
                                )}
                            </>
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
                                    />                                    <div>
                                        <h3>{perfil.Sena.nombre_sede || '-'}</h3>
                                        <p>
                                            NIT: {perfil.Sena.NIT || '-'}
                                        </p>
                                    </div>
                                </div>

                                {/* elemento gestion de estado */}
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
                                    <p>
                                        Dirección: <br />
                                        {perfil.Sena.direccion || '-'}
                                    </p>
                                    <p>
                                        Teléfono: <br />
                                        {perfil.Sena.telefono || '-'}
                                    </p>
                                    <p>
                                        Email: <br />
                                        {perfil.Sena.email_sena || '-'}
                                    </p>
                                    <p>
                                        Ciudad: <br />
                                        {perfil.Sena.Ciudad?.nombre || '-'}
                                    </p>
                                    <p>
                                        Departamento: <br />
                                        {perfil.Sena.Ciudad?.Departamento?.nombre || '-'}
                                    </p>
                                </div>
                                <div className='data_courses_instructor'>
                                    <div className='data_courses'>
                                        {/* Aquí puedes mostrar cursos si aplica */}
                                    </div>
                                    <div className='data_instructor'>
                                        {/* Aquí puedes mostrar datos adicionales si aplica */}
                                    </div>
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
                                                />
                                            ) : (
                                                perfil.Empresa.NIT || '-'
                                            )}
                                        </p>
                                    </div>
                                </div>
                                {/* elemento gestion de estado */}
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
                                            />
                                        ) : (
                                            perfil?.Empresa?.direccion || ''
                                        )}

                                    </p>
                                    <p>Teléfono: <br />
                                        {editMode ? (
                                            <input
                                                type="text"
                                                name="Empresa.telefono"
                                                className='input_updateData'
                                                value={perfil?.Empresa?.telefono || ''}
                                                onChange={handleInputChange}
                                            />
                                        ) : (
                                            perfil?.Empresa?.telefono || ''
                                        )}
                                    </p>
                                    <p>Email: <br />
                                        {editMode ? (
                                            <input
                                                type="text"
                                                name="Empresa.email_empresa"
                                                className='input_updateData'
                                                value={perfil?.Empresa?.email_empresa || ''}
                                                onChange={handleInputChange}
                                            />
                                        ) : (
                                            perfil?.Empresa?.email_empresa || ''
                                        )}
                                    </p>
                                    <p>Ciudad: <br />
                                        {perfil?.Empresa?.Ciudad?.nombre || '-'}

                                    </p>

                                    <p>Departamento <br />
                                        {perfil?.Empresa?.Ciudad?.Departamento?.nombre || '-'}

                                    </p>
                                </div>

                                <div className='data_courses_instructor'>
                                    <div className='data_courses'>
                                        {/* Aquí puedes colocar cursos si los tienes disponibles */}
                                    </div>
                                    <div className='data_instructor'>
                                        {/* Aquí puedes colocar datos adicionales del instructor si aplica */}
                                    </div>
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