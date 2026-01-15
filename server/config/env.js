/**
 * Configuracion centralizada de URLs del backend
 * Detecta automaticamente el ambiente (desarrollo/produccion)
 */

/**
 * Obtiene la URL del frontend segun el ambiente
 * - En desarrollo: usa localhost:5173
 * - En produccion: usa la variable FRONTEND_URL
 */
const getFrontendUrl = () => {
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    return 'http://localhost:5173';
  }
  return process.env.FRONTEND_URL || 'http://frontend:80';
};

/**
 * Obtiene la URL del backend segun el ambiente
 * - En desarrollo: usa localhost:3001
 * - En produccion: usa la variable BACKEND_URL
 */
const getBackendUrl = () => {
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001';
  }
  return process.env.BACKEND_URL || 'http://backend:5000';
};

/**
 * Obtiene los origenes permitidos para CORS
 * Incluye el frontend y origenes adicionales si es necesario
 */
const getAllowedOrigins = () => {
  const frontendUrl = getFrontendUrl();
  const origins = [frontendUrl];
  
  // En desarrollo, agregar localhost con diferentes puertos
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    origins.push('http://localhost:5173');
    origins.push('http://localhost:3000');
    origins.push('http://127.0.0.1:5173');
  }
  
  // Agregar origenes adicionales desde variable de entorno si existe
  if (process.env.ADDITIONAL_ORIGINS) {
    const additionalOrigins = process.env.ADDITIONAL_ORIGINS.split(',').map(origin => origin.trim());
    origins.push(...additionalOrigins);
  }
  
  // Eliminar duplicados
  return [...new Set(origins)];
};

/**
 * URL del frontend para links en emails y notificaciones
 */
const FRONTEND_URL = getFrontendUrl();

/**
 * URL del backend para links en emails y notificaciones
 */
const BACKEND_URL = getBackendUrl();

/**
 * Lista de origenes permitidos para CORS
 */
const ALLOWED_ORIGINS = getAllowedOrigins();

/**
 * Indica si estamos en ambiente de desarrollo
 */
const IS_DEVELOPMENT = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

/**
 * Indica si estamos en ambiente de produccion
 */
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

module.exports = {
  FRONTEND_URL,
  BACKEND_URL,
  ALLOWED_ORIGINS,
  IS_DEVELOPMENT,
  IS_PRODUCTION,
  getFrontendUrl,
  getBackendUrl,
  getAllowedOrigins,
};
