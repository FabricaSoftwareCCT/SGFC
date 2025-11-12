const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    viewportWidth: 1800,
    viewportHeight: 1440,
    setupNodeEvents(on, config) {
      // implement node event listeners here
      return config;
    },
  },
  // Estas configuraciones sí afectan el comportamiento del navegador
  chromeWebSecurity: false,
  defaultCommandTimeout: 10000,
  video: true,
  screenshotOnRunFailure: true
});