export const validateEmail = (email) => {
    if (!email) return "El email no puede estar vacío";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "El formato del email es incorrecto";
    return ""; // Siempre retornar string vacío en éxito
}

export const validateNumber = (phoneNumber) => {
    if (!phoneNumber) return "El número de teléfono no puede estar vacío";
    const phoneRegex = /^\+?[0-9]{7,15}$/;
    if (!phoneRegex.test(phoneNumber)) return "El formato del número de teléfono es incorrecto";
    return ""; // Siempre retornar string vacío en éxito
}

export const validateText = (text, fieldName = "Este campo") => {
    if (!text) return `${fieldName} no puede estar vacío`;
    const regex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
    if (!regex.test(text)) return `${fieldName} contiene caracteres inválidos`;
    return ""; // Siempre retornar string vacío en éxito
}

export const validateAddress = (address) => {
    if (!address) return "La dirección no puede estar vacía";
    const addressRegex = /^[a-zA-ZÀ-ÿ0-9\s,.\-#]+$/;
    if (!addressRegex.test(address)) return "La dirección contiene caracteres inválidos";
    return ""; // Siempre retornar string vacío en éxito
}

export function validateNIT(nit) {
    if (!nit) return "El NIT es requerido";
    const regex = /^\d{8,10}$/;
    if (!regex.test(nit)) return "El NIT debe tener entre 8 y 10 dígitos numéricos";
    return ""; // Siempre retornar string vacío en éxito
}

export const createMensajeError = async (errores) => {
    const mensaje = Object.entries(errores)
        .filter(([_, value]) => value !== "") // Filtrar solo los que tienen error
        .map(([_, value]) => value) // Usar solo el valor del mensaje
        .join("\n");

    if (mensaje === "") return null;
    
    return `No se pudo guardar el perfil.\nErrores de validación:\n${mensaje}\nIntente nuevamente.`;
};
// En utils/Validators/formValidator.js - AÑADE ESTA FUNCIÓN
export const validateDocument = (documento) => {
    if (!documento) return "El documento no puede estar vacío";
    
    // Validar que solo contenga números y tenga entre 5 y 15 dígitos
    const docRegex = /^\d{5,15}$/;
    if (!docRegex.test(documento)) return "El documento debe contener solo números y tener entre 5 y 15 dígitos";
    
    return "";
};