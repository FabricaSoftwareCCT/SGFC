export const validateEmail = (email) => {
    // Validar que email no esté vacío
    if (!email) return "El email no puede estar vacío";

    // Expresión para validar que el formato de email esté correcto
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidFormat = emailRegex.test(email);

    if (!isValidFormat) return "El formato del email es incorrecto";

    return "";
}

export const validarFecha = (fecha) => {
    console.log(fecha);
    if(!fecha) return "No se ingrsaron la fechas"

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

export function validateNIT(nit) {
  if (!nit) return "El NIT es requerido";

  const regex = /^\d{8,10}$/; 
  if (!regex.test(nit)) {
    return "El NIT debe tener entre 8 y 10 dígitos numéricos";
  }

  return ""; 
}


export const createMensajeError =  async (erros) => {
    const mensaje = Object.entries(erros)
    .filter(([_, value]) => value !== "")
    .map(([key, value]) => `El campo ${key} ${value}`)
    .join("\n");

    if (mensaje === "") return null;
    
    return `No se logro guardar.\nLos siguientes campos son obligatorios y no pueden estar vacíos: \n${mensaje}. \nIntente nuevamente.`;
    };

    
