async function createTriggers(sequelize) {
	// Se borran los triggers en caso de que ya existan
	await sequelize.query("DROP TRIGGER IF EXISTS addCriteria;");
	await sequelize.query("DROP TRIGGER IF EXISTS addNewCriteria;");
	await sequelize.query("DROP TRIGGER IF EXISTS afterAssistance;");

	// Se crean los triggers
	await sequelize.query(`
		CREATE TRIGGER addCriteria AFTER INSERT ON inscripcion_curso FOR EACH ROW
		BEGIN
			INSERT INTO usuario_tiene_criterios (usuario_ID, criterio_ID, curso_ID) SELECT NEW.aprendiz_ID, criterio_ID, NEW.curso_ID FROM curso_tiene_criterio WHERE curso_ID=NEW.curso_ID;
		END ;
	`);
	await sequelize.query(`
		CREATE TRIGGER addNewCriteria AFTER INSERT ON curso_tiene_criterio FOR EACH ROW
		BEGIN
			INSERT INTO usuario_tiene_criterios (usuario_ID, criterio_ID, curso_ID) SELECT aprendiz_ID, NEW.criterio_ID, NEW.curso_ID FROM inscripcion_curso WHERE curso_ID = NEW.curso_ID;
		END ;
	`);
	await sequelize.query(`
		CREATE TRIGGER afterAssistance AFTER INSERT ON asistencias FOR EACH ROW
		BEGIN
			IF ((SELECT COUNT(c.ID) FROM usuario_tiene_criterios utc JOIN curso_tiene_criterio ctc ON ctc.criterio_ID=utc.criterio_ID JOIN criterio c ON ctc.criterio_ID=c.ID WHERE utc.usuario_ID=NEW.aprendiz_ID AND ctc.curso_ID=NEW.curso_ID AND c.type = "Asistencias") > 0 AND NEW.estado_asistencia="Presente") THEN
				SET @current_value = (SELECT utc.value FROM usuario_tiene_criterios utc JOIN curso_tiene_criterio ctc ON ctc.criterio_ID=utc.criterio_ID JOIN criterio c ON ctc.criterio_ID=c.ID WHERE utc.usuario_ID=NEW.aprendiz_ID AND ctc.curso_ID=NEW.curso_ID AND c.type = "Asistencias");
				UPDATE 
					usuario_tiene_criterios 
				SET 
					value=@current_value+1
				WHERE
					usuario_ID=NEW.aprendiz_ID AND
					curso_ID=NEW.curso_ID AND
					(criterio_ID IN (select ID from criterio WHERE type="Asistencias"));
			END IF;
		END ;
	`);
}

module.exports = createTriggers;
