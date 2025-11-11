const normalizarTemario = (entradaTemario) => {
	if (entradaTemario === undefined || entradaTemario === null) {
		return JSON.stringify([]);
	}

	let temarioComoArray;

	if (Array.isArray(entradaTemario)) {
		temarioComoArray = entradaTemario;
	} else if (typeof entradaTemario === "string") {
		const temarioTexto = entradaTemario.trim();
		if (temarioTexto.length === 0) {
			return JSON.stringify([]);
		}

		try {
			const parsed = JSON.parse(temarioTexto);
			if (!Array.isArray(parsed)) {
				throw new Error("El temario debe ser un arreglo de temas.");
			}
			temarioComoArray = parsed;
		} catch (error) {
			throw new Error("El temario debe estar en formato JSON válido.");
		}
	} else {
		throw new Error("Formato de temario no soportado.");
	}

	const temarioNormalizado = temarioComoArray.map((item, index) => {
		if (!item || typeof item !== "object") {
			throw new Error(`El temario en la posición ${index} no es válido.`);
		}

		const fecha = typeof item.fecha === "string" ? item.fecha.trim() : "";
		const tema = typeof item.tema === "string" ? item.tema.trim() : "";

		if (!fecha || !tema) {
			throw new Error(`Cada entrada del temario debe incluir 'fecha' y 'tema' en la posición ${index}.`);
		}

		return { fecha, tema };
	});

	return JSON.stringify(temarioNormalizado);
};

module.exports = {
	normalizarTemario
};

