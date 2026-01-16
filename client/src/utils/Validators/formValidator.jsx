export const validateEmail = (email) => {
    if (!email) return "El email no puede estar vacío";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidFormat = emailRegex.test(email);

    if (!isValidFormat) return "El formato del email es incorrecto";

    return "";
}

export const validarFecha = (fecha) => {
    // console.log(fecha);
    if (!fecha) return "Debes ingresar la fecha.";

    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(fecha)) {
        return ` no tiene el formato correcto (dd/mm/yyyy)`;
    }

    const [anio, mes, dia] = fecha.split("-").map(Number);
    const newfecha = new Date(anio, mes - 1, dia);

    if (!newfecha || newfecha.getFullYear() !== anio ||newfecha.getMonth() !== mes - 1 || newfecha.getDate() !== dia) {
        return `${fecha} no es una fecha válida`;
    }

    return "";
};

export const validateNumber = (phoneNumber) => {
    // Validar que el número de teléfono no esté vacío
    if (!phoneNumber) return "El campo no puede estar vacío";

    // Expresión para validar que el formato sea válido
    const phoneRegex = /^\+?[0-9]{7,15}$/; 
    const isValidFormat = phoneRegex.test(phoneNumber);

    if (!isValidFormat) return "El formato del número es incorrecto";

    return "";
}

export const validateText = (text, fieldName = "Este campo") => {
    /*if (!text) return `${fieldName} no puede estar vacío`;
    const regex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
    if (!regex.test(text)) return `${fieldName} contiene caracteres inválidos`;
    return "";*/ // Siempre retornar string vacío en éxito
    return "";
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
    const mensajesUnicos = [
        ...new Set(
            Object.entries(errores)
                .map(([, value]) => (value || "").trim())
                .filter((value) => value.length > 0)
        ),
    ];

    if (mensajesUnicos.length === 0) {
        return null;
    }

    const cuerpo = mensajesUnicos.map((mensaje) => `- ${mensaje}`).join("\n");

    return `No se logró guardar.\nCorrige los siguientes campos obligatorios:\n${cuerpo}\nIntenta nuevamente.`;
};

    
