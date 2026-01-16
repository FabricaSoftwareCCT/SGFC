/**
 * Configuracion centralizada de URLs del frontend
 * Detecta automaticamente el ambiente (desarrollo/produccion)
 */

/**
 * Obtiene la URL del backend segun el ambiente
 * - En desarrollo (npm run dev): usa localhost:3001
 * - En produccion (npm run build): usa la variable VITE_API_URL
 */
const getApiUrl = () => {
  if (import.meta.env.DEV) {
    return 'http://localhost:3001';
  }
  return import.meta.env.VITE_API_URL || 'http://backend:5000';
};

/**
 * Obtiene la URL del frontend segun el ambiente
 * - En desarrollo: usa localhost:5173
 * - En produccion: usa el origen actual del navegador
 */
const getFrontendUrl = () => {
  if (import.meta.env.DEV) {
    return 'http://localhost:5173';
  }
  return window.location.origin;
};

/**
 * URL base del backend para llamadas API
 */
export const API_URL = getApiUrl();

/**
 * URL del frontend para links internos
 */
export const FRONTEND_URL = getFrontendUrl();

/**
 * Indica si estamos en ambiente de desarrollo
 */
export const IS_DEVELOPMENT = import.meta.env.DEV;

/**
 * Indica si estamos en ambiente de produccion
 */
export const IS_PRODUCTION = import.meta.env.PROD;
