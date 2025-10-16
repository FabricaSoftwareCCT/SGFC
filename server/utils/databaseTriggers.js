async function createTriggers (sequelize) {
	// Se borran los triggers en caso de que ya existan
	await sequelize.query("DROP TRIGGER IF EXISTS addCriteria;")
	await sequelize.query("DROP TRIGGER IF EXISTS addNewCriteria;")

	// Se crean los triggers
	await sequelize.query(`
		CREATE TRIGGER addCriteria AFTER INSERT ON inscripcion_curso FOR EACH ROW
		BEGIN
			INSERT INTO usuario_tiene_criterios (usuario_ID, criterio_ID, curso_ID) SELECT NEW.aprendiz_ID, criterio_ID, NEW.curso_ID FROM curso_tiene_criterio WHERE curso_ID=NEW.curso_ID;
		END ;
	`)
	await sequelize.query(`
		CREATE TRIGGER addNewCriteria AFTER INSERT ON curso_tiene_criterio FOR EACH ROW
		BEGIN
			INSERT INTO usuario_tiene_criterios (usuario_ID, criterio_ID, curso_ID) SELECT aprendiz_ID, NEW.criterio_ID, NEW.curso_ID FROM inscripcion_curso WHERE curso_ID = NEW.curso_ID;
		END ;
	`)
}

module.exports = createTriggers