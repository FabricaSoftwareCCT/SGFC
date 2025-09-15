export const validateEmail = (email) => {
    // Validar que email no esté vacío
    if (!email) return "El email no puede estar vacío";

    // Expresión para validar que el formato de email esté correcto
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidFormat = emailRegex.test(email);

    if (!isValidFormat) return "El formato del email es incorrecto";

    return "";
}

export const validatePhoneNumber = (phoneNumber) => {
    // Validar que el número de teléfono no esté vacío
    if (!phoneNumber) return "El número de teléfono no puede estar vacío";

    // Expresión para validar que el formato sea válido
    const phoneRegex = /^\+?[0-9]{7,15}$/; 
    const isValidFormat = phoneRegex.test(phoneNumber);

    if (!isValidFormat) return "El formato del número de teléfono es incorrecto";

    return "";
}

export const validateText = (text) => {
    // Validar que el campo no esté vacío
    if (!text) return `no puede estar vacío`;

    const regex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
    const isValidFormat = regex.test(text);

    if (!isValidFormat) return `contiene caracteres inválidos`;

    return "";
}

export const validateAddress = (address) => {
    // Validar que la dirección no esté vacía
    if (!address) return "La dirección no puede estar vacía";

    const addressRegex = /^[a-zA-ZÀ-ÿ0-9\s,.\-#]+$/;
    const isValidFormat = addressRegex.test(address);

    if (!isValidFormat) return "La dirección contiene caracteres inválidos";

    return "";
}


export const createMensajeError =  async (erros) => {
    const mensaje = Object.entries(erros)
    .filter(([_, value]) => value !== "")
    .map(([key, value]) => `El campo ${key} ${value}`)
    .join("\n");

    if (mensaje === "") return null;
    
    return `No se pudo guardar el perfil.\nLos siguientes campos son obligatorios y no pueden estar vacíos: \n${mensaje}. \nIntente nuevamente.`;
    };
