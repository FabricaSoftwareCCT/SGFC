import React, { createContext, useState, useContext } from 'react';

// Creación del contexto para manejar estados relacionados con modales
const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  // Estados para controlar la visibilidad de diferentes modales y datos relacionados
  const [showSignIn, setShowSignIn] = useState(false);          // Modal de inicio de sesión
  const [showSignUp, setShowSignUp] = useState(false);          // Modal de registro
  const [showModalGeneral, setShowModalGeneral] = useState(false);// Modal para seleccionar tipo de cuenta
  const [selectedAccountType, setSelectedAccountType] = useState(""); // Tipo de cuenta seleccionada
  const [showModalCreateEmployee, setShowModalCreateEmployee] = useState(false); // Modal para crear empleado
  const [showModalSuccesfull, setShowModalSuccesfull] = useState(false);
  const [modalSuccesfullContent, setModalSuccesfullContent] = useState(null);
  const [showModalFailed, setShowModalFailed] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [modalFailedContent, setModalFailedContent] = useState(null);
  const [modalGeneralContent, setModalGeneralContent] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const { setShowResetPassword} = useState(false);



  return (
    // Proveedor del contexto que expone los estados y funciones para manejarlos
    <ModalContext.Provider
      value={{
        showSignIn,
        setShowSignIn,
        showSignUp,
        setShowSignUp,
        showModalGeneral,
        setShowModalGeneral,
        selectedAccountType,
        setSelectedAccountType,
        showModalCreateEmployee,
        setShowModalCreateEmployee,
        showModalSuccesfull,
        setShowModalSuccesfull,
        modalSuccesfullContent,
        setModalSuccesfullContent,
        showModalFailed,
        setShowModalFailed,
        modalFailedContent,
        setModalFailedContent,
        modalGeneralContent, 
        setModalGeneralContent,
        showAssignModal,
        setShowAssignModal,
        showDropdown, 
        setShowDropdown
      }}
    >
      {children} {/* Renderiza los componentes hijos que consumen este contexto */}
    </ModalContext.Provider>
  );
};

// Hook personalizado para consumir fácilmente el contexto en cualquier componente
export const useModal = () => useContext(ModalContext);
