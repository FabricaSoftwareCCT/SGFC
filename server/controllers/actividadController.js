const { ActividadService } = require("../services/ActividadService");

class ActividadController {
	static setDb(databaseInstance) {
		ActividadService.setDb(databaseInstance);
	}

	static #buildErrorResponse(res, error) {
		const status = error?.status || 500;
		const message = error?.message || "Ocurrió un error interno.";
		return res.status(status).json({ message });
	}

	static async crearActividad(req, res) {
		try {
			const { cursoId } = req.params;
			const payload = {
				titulo: req.body?.titulo,
				descripcion: req.body?.descripcion,
				fechaLimite: req.body?.fechaLimite,
				porcentajeAporte: req.body?.porcentajeAporte,
				materialIds: req.body?.materialIds,
			};
			const actividad = await ActividadService.createActividad(
				cursoId,
				payload,
				req.user
			);
			return res.status(201).json({ success: true, actividad });
		} catch (error) {
			return ActividadController.#buildErrorResponse(res, error);
		}
	}

	static async listarActividades(req, res) {
		try {
			const { cursoId } = req.params;
			const actividades = await ActividadService.listarActividadesDelCurso(
				cursoId,
				req.user
			);
			return res.status(200).json({ success: true, actividades });
		} catch (error) {
			return ActividadController.#buildErrorResponse(res, error);
		}
	}

	static async obtenerActividad(req, res) {
		try {
			const { actividadId } = req.params;
			const actividad = await ActividadService.obtenerActividad(
				actividadId,
				req.user
			);
			return res.status(200).json({ success: true, actividad });
		} catch (error) {
			return ActividadController.#buildErrorResponse(res, error);
		}
	}

	static async actualizarActividad(req, res) {
		try {
			const { actividadId } = req.params;
			const payload = {
				titulo: req.body?.titulo,
				descripcion: req.body?.descripcion,
				fechaLimite: req.body?.fechaLimite,
				porcentajeAporte: req.body?.porcentajeAporte,
				estado: req.body?.estado,
				materialIds: req.body?.materialIds,
			};
			const actividad = await ActividadService.actualizarActividad(
				actividadId,
				payload,
				req.user
			);
			return res.status(200).json({ success: true, actividad });
		} catch (error) {
			return ActividadController.#buildErrorResponse(res, error);
		}
	}

	static async asociarMaterial(req, res) {
		try {
			const { actividadId, materialId } = req.params;
			const actividad = await ActividadService.asociarMaterialAActividad(
				actividadId,
				materialId,
				req.user
			);
			return res.status(200).json({ success: true, actividad });
		} catch (error) {
			return ActividadController.#buildErrorResponse(res, error);
		}
	}

	static async desasociarMaterial(req, res) {
		try {
			const { actividadId, materialId } = req.params;
			const actividad = await ActividadService.desasociarMaterialDeActividad(
				actividadId,
				materialId,
				req.user
			);
			return res.status(200).json({ success: true, actividad });
		} catch (error) {
			return ActividadController.#buildErrorResponse(res, error);
		}
	}

	static async registrarEntrega(req, res) {
		try {
			if (req.fileValidationError) {
				return res
					.status(400)
					.json({ message: req.fileValidationError });
			}

			const { actividadId } = req.params;
			const entrega = await ActividadService.registrarEntrega(
				actividadId,
				req.body,
				req.file,
				req.user
			);
			return res.status(201).json({ success: true, entrega });
		} catch (error) {
			return ActividadController.#buildErrorResponse(res, error);
		}
	}

	static async revisarEntrega(req, res) {
		try {
			if (req.fileValidationError) {
				return res
					.status(400)
					.json({ message: req.fileValidationError });
			}

			const { entregaId } = req.params;
			const entrega = await ActividadService.revisarEntrega(
				entregaId,
				req.body,
				req.file,
				req.user
			);
			return res.status(200).json({ success: true, entrega });
		} catch (error) {
			return ActividadController.#buildErrorResponse(res, error);
		}
	}

	static async eliminarActividad(req, res) {
		try {
			const { actividadId } = req.params;
			await ActividadService.eliminarActividad(actividadId, req.user);
			return res.status(200).json({ success: true });
		} catch (error) {
			return ActividadController.#buildErrorResponse(res, error);
		}
	}
}

module.exports = { ActividadController };

