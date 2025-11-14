const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
      return config;
    },
    // Añade estas configuraciones dentro de e2e
    baseUrl: 'http://localhost:5173', // o la URL de tu aplicación
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
  },
  
  // Configuraciones globales
  viewportWidth: 1280,
  viewportHeight: 720,
  chromeWebSecurity: false,
  defaultCommandTimeout: 10000,
  pageLoadTimeout: 30000, // Aumenta timeout de carga de página
  requestTimeout: 10000,
  responseTimeout: 30000,
  
  // Para mejor debugging
  video: true,
  screenshotOnRunFailure: true,
  numTestsKeptInMemory: 10,
  
  // Ejecutar en modo headed por defecto para ver qué pasa
  headless: false
});