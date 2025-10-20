const express = require("express");
const router = express.Router();
const ubicacionesController = require("../controllers/ubicacionesController");

module.exports = (db) => {
  ubicacionesController.setDb(db);

  router.get("/departamentos", ubicacionesController.listDepartamentos);
  router.get("/departamentos/:id/ciudades", ubicacionesController.listCiudadesPorDepartamento);
  router.get("/ciudades/:id", ubicacionesController.getCiudadConDepartamento);

  return router;
};


