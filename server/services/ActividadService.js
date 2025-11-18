const path = require("path");
const {
	ActividadRepository,
	setDb: setActividadRepositoryDb,
} = require("../Repository/ActividadRepository");
const { saveBufferFile, deleteFileIfExists } = require("../utils/fileStorage");
const {
	normalizeUserId,
	getAccountType,
	isPrivilegedAccount,
	createHttpError,
} = require("../utils/actividadUtils");
const {
	notifyActivityEvent,
	notifyActivitySubmission,
	notifyActivityReview,
} = require("../services/notificationService");

let initialized = false;

function ensureInitialized() {
	if (!initialized) {
		throw new Error("Base de datos no inicializada en ActividadService");
	}
}

async function resolveInstructorCourseOwnership(cursoData, instructorId) {
	if (!cursoData || !cursoData.ID || instructorId == null) {
		return {
			hasAcceptedAssignment: false,
			ownsByCursoRecord: false,
		};
	}

	const normalizedInstructorId = Number(instructorId);
	if (!Number.isInteger(normalizedInstructorId)) {
		return {
			hasAcceptedAssignment: false,
			ownsByCursoRecord: false,
		};
	}

	const latestAssignment =
		await ActividadRepository.findLatestInstructorAssignment(
			cursoData.ID,
			normalizedInstructorId
		);

	const assignmentEstado = latestAssignment?.estado
		? String(latestAssignment.estado).toLowerCase()
		: null;

	return {
		hasAcceptedAssignment: assignmentEstado === "aceptada",
		ownsByCursoRecord:
			Number(cursoData.instructor_ID) === normalizedInstructorId,
	};
}

async function ensureCursoAccesible({
	cursoInput,
	user,
	requireInstructorOwnership = true,
}) {
	ensureInitialized();

	const accountTypeRaw = getAccountType(user);
	const normalizedType = accountTypeRaw.toLowerCase();
			const userId = normalizeUserId(user);

	let curso = cursoInput;
	if (!curso || !curso.ID) {
		curso = await ActividadRepository.findCursoById(cursoInput);
	}

	if (!curso) {
		throw createHttpError(404, "Curso no encontrado.");
	}

	const cursoData = curso.get ? curso.get({ plain: true }) : curso;

	if (isPrivilegedAccount(accountTypeRaw)) {
		if (normalizedType === "instructor") {
			if (!userId) {
				throw createHttpError(401, "Usuario no autenticado.");
			}

			const { hasAcceptedAssignment, ownsByCursoRecord } =
				await resolveInstructorCourseOwnership(cursoData, userId);

			if (requireInstructorOwnership && !hasAcceptedAssignment && !ownsByCursoRecord) {
				throw createHttpError(
					403,
					"No eres el instructor asignado a este curso."
				);
			}
		}
		return cursoData;
	}

	if (!userId) {
		throw createHttpError(401, "Usuario no autenticado.");
	}

	if (normalizedType === "aprendiz" || !normalizedType) {
		const inscripcion = await ActividadRepository.findInscripcionActiva(
			cursoData.ID,
			userId
		);

		if (!inscripcion) {
			throw createHttpError(403, "No estás inscrito en este curso.");
		}
		return cursoData;
	}

	throw createHttpError(403, "No tienes permisos para acceder a este curso.");
}

async function ensureActividadEstadoActual(actividadInput) {
	ensureInitialized();

	if (!actividadInput) {
		return null;
	}

	const entity =
		actividadInput.get && typeof actividadInput.get === "function"
			? actividadInput
			: await ActividadRepository.findActividadById(
					actividadInput?.ID || actividadInput?.Id
			  );

	if (!entity) {
		return null;
	}

	const fechaLimite =
		entity.fecha_limite && new Date(entity.fecha_limite).getTime();
	const shouldClose =
		entity.estado === "activa" &&
		fechaLimite &&
		!Number.isNaN(fechaLimite) &&
		fechaLimite <= Date.now();

	if (shouldClose) {
		await ActividadRepository.updateActividad(entity.ID, {
			estado: "cerrada",
			fecha_cierre: entity.fecha_cierre || new Date(),
		});
		const refreshed = await ActividadRepository.findActividadById(entity.ID);
		const refreshedPlain =
			refreshed?.get && typeof refreshed.get === "function"
				? refreshed.get({ plain: true })
				: refreshed;

		try {
			await notifyParticipantsAboutActivity({
				remitenteId: Number(refreshedPlain?.curso?.instructor_ID) || 1,
				curso: refreshedPlain?.curso,
				activity: refreshedPlain,
				heading: "Actividad cerrada",
				intro: `La actividad "${refreshedPlain?.titulo}" se cerró automáticamente porque la fecha límite finalizó.`,
				extraRows: [{ label: "Motivo", value: "Fecha límite vencida" }],
			});
		} catch (notificationError) {
			console.error(
				"Error al notificar el cierre automático de la actividad:",
				notificationError
			);
		}

		return refreshedPlain;
	}

	return entity.get ? entity.get({ plain: true }) : entity;
}

const toPlain = (entity) =>
	entity?.get && typeof entity.get === "function"
		? entity.get({ plain: true })
		: entity;

const formatDateTimeSummary = (value) => {
	if (!value) {
		return "Sin definir";
	}
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return "Sin definir";
	}
	return date.toLocaleString("es-CO", {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

async function getActiveParticipantIds(cursoId) {
	if (!cursoId) {
		return [];
	}
	const records = await ActividadRepository.findActiveParticipantsByCurso(cursoId);
	return records
		.map((record) => Number(record?.aprendiz_ID))
		.filter((id) => Number.isInteger(id));
}

async function getCourseAudienceIds(curso) {
	const coursePlain = toPlain(curso);
	if (!coursePlain?.ID) {
		return [];
	}
	const participantIds = await getActiveParticipantIds(coursePlain.ID);
	const instructorId = Number(coursePlain.instructor_ID);
	if (Number.isInteger(instructorId)) {
		participantIds.push(instructorId);
	}
	return [...new Set(participantIds)];
}

async function notifyParticipantsAboutActivity({
	remitenteId,
	curso,
	activity,
	heading,
	intro,
	extraRows = [],
}) {
	try {
		const coursePlain = toPlain(curso);
		if (!coursePlain) {
			return;
		}
		const recipientIds = await getCourseAudienceIds(coursePlain);
		if (recipientIds.length === 0) {
			return;
		}

		await notifyActivityEvent({
			remitenteId: remitenteId || Number(coursePlain.instructor_ID) || 1,
			destinatarioIds: recipientIds,
			courseId: coursePlain.ID,
			courseName: coursePlain.nombre_curso,
			activity,
			heading,
			intro,
			extraRows,
		});
	} catch (error) {
		console.error("Error al enviar notificación de actividad:", error);
	}
}

const buildApprenticeName = (aprendiz, fallbackId) => {
	if (aprendiz?.nombres || aprendiz?.apellidos) {
		const fullName = `${aprendiz.nombres || ""} ${aprendiz.apellidos || ""}`.trim();
		if (fullName.length > 0) {
			return fullName;
		}
	}
	if (fallbackId) {
		return `Aprendiz #${fallbackId}`;
	}
	return "Aprendiz";
};

class ActividadService {
	static setDb(dbInstance) {
		setActividadRepositoryDb(dbInstance);
		initialized = true;
	}

	static async createActividad(cursoId, payload, user) {
		try {
			ensureInitialized();

	const userId = normalizeUserId(user);
	if (!userId) {
		throw createHttpError(401, "Usuario no autenticado.");
	}

			const accountType = getAccountType(user);
	if (!isPrivilegedAccount(accountType)) {
				throw createHttpError(
					403,
					"No tienes permisos para crear actividades en este curso."
				);
	}

			const curso = await ActividadRepository.findCursoById(cursoId);
	if (!curso) {
		throw createHttpError(404, "Curso no encontrado.");
	}

			const cursoData = curso.get ? curso.get({ plain: true }) : curso;
			const normalizedAccountType = accountType.toLowerCase();
			if (normalizedAccountType === "instructor") {
				const { hasAcceptedAssignment, ownsByCursoRecord } =
					await resolveInstructorCourseOwnership(cursoData, userId);
				if (!hasAcceptedAssignment && !ownsByCursoRecord) {
					throw createHttpError(
						403,
						"Solo el instructor asignado puede crear actividades para este curso."
					);
				}
	}

			const {
				titulo,
				descripcion,
				fechaLimite,
				porcentajeAporte,
				materialIds = [],
			} = payload || {};

	if (!titulo || typeof titulo !== "string" || titulo.trim().length === 0) {
				throw createHttpError(
					400,
					"El título de la actividad es obligatorio."
				);
	}

	let fechaLimiteDate = null;
	if (fechaLimite) {
		const parsed = new Date(fechaLimite);
		if (Number.isNaN(parsed.getTime())) {
			throw createHttpError(400, "La fecha límite no es válida.");
		}
		fechaLimiteDate = parsed;
	}

			let aporteNormalizado = null;
			if (porcentajeAporte !== undefined && porcentajeAporte !== null && porcentajeAporte !== "") {
				const aporteNumber = Number(porcentajeAporte);
				if (Number.isNaN(aporteNumber) || aporteNumber < 0) {
					throw createHttpError(400, "El porcentaje de aporte no es válido.");
				}
				if (aporteNumber > 0) {
					aporteNormalizado = aporteNumber;
				}
			}

			const actividad = await ActividadRepository.createActividad({
				curso_ID: cursoId,
				titulo: titulo.trim(),
				descripcion: (descripcion || "").trim(),
				fecha_limite: fechaLimiteDate,
				porcentaje_aporte: aporteNormalizado,
				estado: "activa",
				fecha_publicacion: new Date(),
				creado_por: userId,
			});

	if (Array.isArray(materialIds) && materialIds.length > 0) {
				const materialesActivos =
					await ActividadRepository.findActiveMaterialsByIds(materialIds);

		await Promise.all(
			materialesActivos.map((material) =>
				ActividadRepository.attachMaterial(actividad.ID, material.ID)
			)
		);
	}

			const actividadCompleta = await ActividadRepository.findActividadById(
				actividad.ID
			);
			const actividadNormalizada = await ensureActividadEstadoActual(
				actividadCompleta
			);

			await notifyParticipantsAboutActivity({
				remitenteId: userId,
				curso: cursoData,
				activity: actividadNormalizada,
				heading: "Nueva actividad publicada",
				intro: `Se creó la actividad "${actividadNormalizada?.titulo}" en el curso ${cursoData?.nombre_curso}.`,
			});

			return actividadNormalizada;
		} catch (error) {
			if (error?.status) {
				throw error;
			}
			throw createHttpError(500, "Error al crear la actividad.");
		}
	}

	static async listarActividadesDelCurso(cursoId, user) {
		try {
			ensureInitialized();

			await ensureCursoAccesible({
				cursoInput: cursoId,
				user,
				requireInstructorOwnership: false,
			});
			const actividades =
				await ActividadRepository.findActividadesByCurso(cursoId);
			const accountType = getAccountType(user).toLowerCase();
	const userId = normalizeUserId(user);

			const normalized = await Promise.all(
				actividades.map((actividad) => ensureActividadEstadoActual(actividad))
			);

			return normalized
				.filter(Boolean)
				.map((actividadPlain) => {
					const plain = { ...actividadPlain };

		if (!isPrivilegedAccount(accountType)) {
			plain.entregas = (plain.entregas || []).filter(
				(entrega) => Number(entrega.aprendiz_ID) === userId
			);
		}

		return plain;
	});
		} catch (error) {
			if (error?.status) {
				throw error;
			}
			throw createHttpError(
				500,
				"Error al listar las actividades del curso."
			);
		}
	}

	static async obtenerActividad(actividadId, user) {
		try {
			ensureInitialized();
	const actividad = await ActividadRepository.findActividadById(actividadId);
	if (!actividad) {
		throw createHttpError(404, "Actividad no encontrada.");
	}

			await ensureCursoAccesible({
				cursoInput: actividad.curso,
				user,
				requireInstructorOwnership: false,
			});

			const normalizedActividad = await ensureActividadEstadoActual(actividad);
			if (!normalizedActividad) {
				throw createHttpError(404, "Actividad no encontrada.");
			}

			const accountType = getAccountType(user).toLowerCase();
	const userId = normalizeUserId(user);

			const plain = { ...normalizedActividad };

	if (!isPrivilegedAccount(accountType)) {
		plain.entregas = (plain.entregas || []).filter(
			(entrega) => Number(entrega.aprendiz_ID) === userId
		);
	}

	return plain;
		} catch (error) {
			if (error?.status) {
				throw error;
			}
			throw createHttpError(500, "Error al obtener la actividad.");
		}
	}

	static async actualizarActividad(actividadId, payload, user) {
		try {
			ensureInitialized();
	const actividad = await ActividadRepository.findActividadById(actividadId);
	if (!actividad) {
		throw createHttpError(404, "Actividad no encontrada.");
	}

			await ensureCursoAccesible({ cursoInput: actividad.curso, user });

			const actividadPlain = toPlain(actividad);
			const updates = {};
			const changeSummary = [];
			const currentEstado = (actividadPlain.estado || "").toLowerCase();

			if (payload?.titulo !== undefined) {
				if (!payload.titulo || typeof payload.titulo !== "string") {
					throw createHttpError(400, "El título no es válido.");
				}
				const nextTitle = payload.titulo.trim();
				if (!nextTitle) {
					throw createHttpError(400, "El título no puede estar vacío.");
				}
				if (nextTitle !== (actividadPlain.titulo || "")) {
					changeSummary.push({ label: "Título", value: nextTitle });
				}
				updates.titulo = nextTitle;
			}

			if (payload?.descripcion !== undefined) {
				const nextDescription = (payload.descripcion || "").trim();
				if (nextDescription !== (actividadPlain.descripcion || "")) {
					changeSummary.push({
						label: "Descripción",
						value: nextDescription || "Sin descripción",
					});
				}
				updates.descripcion = nextDescription;
			}

			let nextDeadline = actividadPlain.fecha_limite
				? new Date(actividadPlain.fecha_limite)
				: null;
			const previousDeadlineTime = nextDeadline ? nextDeadline.getTime() : null;

			if (payload?.fechaLimite !== undefined) {
				if (!payload.fechaLimite) {
					updates.fecha_limite = null;
					nextDeadline = null;
				} else {
					const parsed = new Date(payload.fechaLimite);
					if (Number.isNaN(parsed.getTime())) {
						throw createHttpError(400, "La fecha límite no es válida.");
					}
					updates.fecha_limite = parsed;
					nextDeadline = parsed;
				}

				const newDeadlineTime = nextDeadline ? nextDeadline.getTime() : null;
				if (previousDeadlineTime !== newDeadlineTime) {
					changeSummary.push({
						label: "Nueva fecha límite",
						value: formatDateTimeSummary(nextDeadline),
					});
				}
			}

			if (payload?.porcentajeAporte !== undefined) {
				const aporteRaw = payload.porcentajeAporte;
				if (aporteRaw === null || aporteRaw === "") {
					if (actividadPlain.porcentaje_aporte !== null) {
						changeSummary.push({
							label: "Porcentaje de aporte",
							value: "Sin aporte",
						});
					}
					updates.porcentaje_aporte = null;
				} else {
					const aporte = Number(aporteRaw);
					if (Number.isNaN(aporte) || aporte < 0) {
						throw createHttpError(400, "El porcentaje de aporte no es válido.");
					}
					if (aporte === 0) {
						if (actividadPlain.porcentaje_aporte !== null) {
							changeSummary.push({
								label: "Porcentaje de aporte",
								value: "Sin aporte",
							});
						}
						updates.porcentaje_aporte = null;
					} else {
						if ((actividadPlain.porcentaje_aporte ?? null) !== aporte) {
							changeSummary.push({
								label: "Porcentaje de aporte",
								value: `${aporte}%`,
							});
						}
						updates.porcentaje_aporte = aporte;
					}
				}
			}

			const materialIdsInput = payload?.materialIds;
			let sanitizedMaterialIds = null;
			if (Array.isArray(materialIdsInput)) {
				sanitizedMaterialIds = [
					...new Set(
						materialIdsInput
							.map((materialId) => Number(materialId))
							.filter(
								(materialId) => Number.isInteger(materialId) && materialId > 0
							)
					),
				];
			}

			let estadoLower = currentEstado;
			if (payload?.estado !== undefined) {
				const incomingEstado = String(payload.estado).toLowerCase();
				if (!["activa", "cerrada"].includes(incomingEstado)) {
					throw createHttpError(400, "El estado proporcionado no es válido.");
				}
				updates.estado = incomingEstado;
				estadoLower = incomingEstado;
				if (incomingEstado !== currentEstado) {
					changeSummary.push({
						label: "Estado",
						value: incomingEstado === "activa" ? "Activa" : "Cerrada",
					});
				}
				if (incomingEstado === "cerrada") {
					updates.fecha_cierre = new Date();
				}
				if (incomingEstado === "activa") {
					if (!nextDeadline) {
						throw createHttpError(
							400,
							"No puedes reabrir la actividad porque la fecha límite está vacía. Actualiza la fecha límite primero."
						);
					}
					if (nextDeadline.getTime() <= Date.now()) {
						throw createHttpError(
							400,
							"No puedes reabrir la actividad porque la fecha límite ya venció. Actualiza la fecha límite antes de reabrir."
						);
					}
			updates.fecha_cierre = null;
		}
	}

			const userId = normalizeUserId(user);
			if (!userId) {
				throw createHttpError(401, "Usuario no autenticado.");
			}
	updates.actualizado_por = userId;

	await ActividadRepository.updateActividad(actividadId, updates);

			let materialesActualizados = false;
			if (sanitizedMaterialIds !== null) {
				const currentMaterialIds = Array.isArray(actividad.materiales)
					? actividad.materiales.map((material) => Number(material.ID))
					: [];

				const idsToDetach = currentMaterialIds.filter(
					(materialId) => !sanitizedMaterialIds.includes(materialId)
				);

				const idsToAttach = sanitizedMaterialIds.filter(
					(materialId) => !currentMaterialIds.includes(materialId)
				);

				if (idsToAttach.length > 0) {
					materialesActualizados = true;
					const materialesActivos =
						await ActividadRepository.findActiveMaterialsByIds(idsToAttach);
					if (materialesActivos.length !== idsToAttach.length) {
						throw createHttpError(
							400,
							"Algunos materiales seleccionados no existen o no están activos."
						);
					}

					await Promise.all(
						materialesActivos.map((material) =>
							ActividadRepository.attachMaterial(actividadId, material.ID)
						)
					);
				}

				if (idsToDetach.length > 0) {
					materialesActualizados = true;
					await Promise.all(
						idsToDetach.map((materialId) =>
							ActividadRepository.detachMaterial(actividadId, materialId)
						)
					);
				}
			}

			if (materialesActualizados) {
				changeSummary.push({
					label: "Materiales",
					value: "Se actualizó la lista de materiales asociados.",
				});
			}

	const updated = await ActividadRepository.findActividadById(actividadId);
			const normalizedActividad = await ensureActividadEstadoActual(updated);

			const filteredSummary = changeSummary.filter(
				(change) => change.label !== "Estado"
			);

			if (filteredSummary.length > 0) {
				await notifyParticipantsAboutActivity({
					remitenteId: userId,
					curso: normalizedActividad.curso,
					activity: normalizedActividad,
					heading: "Actividad actualizada",
					intro: `La actividad "${normalizedActividad?.titulo}" tiene cambios recientes.`,
					extraRows: filteredSummary,
				});
			}

			if (payload?.estado !== undefined) {
				if (estadoLower === "cerrada") {
					await notifyParticipantsAboutActivity({
						remitenteId: userId,
						curso: normalizedActividad.curso,
						activity: normalizedActividad,
						heading: "Actividad cerrada",
						intro: `La actividad "${normalizedActividad?.titulo}" se cerró manualmente.`,
						extraRows: [{ label: "Motivo", value: "Cierre manual" }],
					});
				} else if (estadoLower === "activa" && currentEstado === "cerrada") {
					await notifyParticipantsAboutActivity({
						remitenteId: userId,
						curso: normalizedActividad.curso,
						activity: normalizedActividad,
						heading: "Actividad reabierta",
						intro: `La actividad "${normalizedActividad?.titulo}" volvió a estar activa.`,
					});
				}
			}

			return normalizedActividad;
		} catch (error) {
			if (error?.status) {
				throw error;
			}
			throw createHttpError(500, "Error al actualizar la actividad.");
		}
	}

	static async asociarMaterialAActividad(actividadId, materialId, user) {
		try {
			ensureInitialized();

	const actividad = await ActividadRepository.findActividadById(actividadId);
	if (!actividad) {
		throw createHttpError(404, "Actividad no encontrada.");
	}

			await ensureCursoAccesible({ cursoInput: actividad.curso, user });

			const material = await ActividadRepository.findMaterialById(materialId);
	if (!material || material.estado !== "activo") {
				throw createHttpError(
					404,
					"Material de apoyo no encontrado o inactivo."
				);
	}

	await ActividadRepository.attachMaterial(actividadId, materialId);
			return ActividadService.obtenerActividad(actividadId, user);
		} catch (error) {
			if (error?.status) {
				throw error;
			}
			throw createHttpError(500, "Error al asociar el material a la actividad.");
		}
	}

	static async desasociarMaterialDeActividad(actividadId, materialId, user) {
		try {
			ensureInitialized();

	const actividad = await ActividadRepository.findActividadById(actividadId);
	if (!actividad) {
		throw createHttpError(404, "Actividad no encontrada.");
	}

			await ensureCursoAccesible({ cursoInput: actividad.curso, user });
	await ActividadRepository.detachMaterial(actividadId, materialId);
			return ActividadService.obtenerActividad(actividadId, user);
		} catch (error) {
			if (error?.status) {
				throw error;
			}
			throw createHttpError(
				500,
				"Error al desasociar el material de la actividad."
			);
		}
	}

	static async registrarEntrega(actividadId, { comentario }, file, user) {
		try {
			ensureInitialized();

	const actividad = await ActividadRepository.findActividadById(actividadId);
	if (!actividad) {
		throw createHttpError(404, "Actividad no encontrada.");
	}

			await ensureCursoAccesible({ cursoInput: actividad.curso, user });
			const actividadPlain = toPlain(actividad);
			const cursoInfo = actividadPlain.curso || actividad.curso || {};
			const actividadData = await ensureActividadEstadoActual(actividad);
			if (!actividadData) {
				throw createHttpError(404, "Actividad no encontrada.");
			}

			if (actividadData.estado === "cerrada") {
				throw createHttpError(
					409,
					"La actividad está cerrada. No se pueden registrar entregas."
				);
	}

	if (!file) {
				throw createHttpError(
					400,
					"Debes adjuntar un archivo para la entrega."
				);
	}

			const userId = normalizeUserId(user);
			if (!userId) {
				throw createHttpError(401, "Usuario no autenticado.");
			}
			const existingEntrega =
				await ActividadRepository.findEntregaByActividadYAaprendiz(
		actividadId,
		userId
	);

			if (
				existingEntrega &&
				existingEntrega.estado_revision &&
				existingEntrega.estado_revision.toLowerCase() === "aprobada"
			) {
				throw createHttpError(
					409,
					"La entrega ya fue aprobada y no puede ser modificada."
				);
			}

			const instructorId = Number(cursoInfo?.instructor_ID);
			const courseId = cursoInfo?.ID ?? actividadData.curso_ID ?? null;
			const courseName = cursoInfo?.nombre_curso;
			const wasRejected =
				existingEntrega &&
				existingEntrega.estado_revision &&
				existingEntrega.estado_revision.toLowerCase() === "rechazada";

			const sanitizedName = path.parse(file.originalname || `entrega-${Date.now()}`).base;
			const storedFile = await saveBufferFile({
				buffer: file.buffer,
				fileName: sanitizedName,
				subdirectories: [
					"actividades",
					`curso-${actividadData.curso_ID}`,
					`actividad-${actividadData.ID}`,
					"submissions",
					`aprendiz-${userId}`,
				],
			});
			const relativePath = storedFile.relativePath;

	if (existingEntrega) {
				if (
					existingEntrega.archivo_ruta &&
					existingEntrega.archivo_ruta !== relativePath
				) {
			await deleteFileIfExists(existingEntrega.archivo_ruta);
		}

		await ActividadRepository.updateEntrega(existingEntrega.ID, {
			comentario: comentario ?? existingEntrega.comentario,
			nombre_archivo: sanitizedName,
			archivo_ruta: relativePath,
			peso_archivo: file.size,
			fecha_envio: new Date(),
			estado_revision: "pendiente",
			retroalimentacion: null,
			retro_archivo_ruta: null,
			retro_fecha: null,
			retro_by: null,
		});

				const updatedEntrega = await ActividadRepository.findEntregaById(
					existingEntrega.ID
				);
				const updatedPlain = toPlain(updatedEntrega);

				await notifyActivitySubmission({
					remitenteId: userId,
					instructorId,
					courseId,
					courseName,
					activity: actividadData,
					apprenticeName: buildApprenticeName(
						updatedPlain.aprendiz,
						updatedPlain.aprendiz_ID
					),
					comment: updatedPlain.comentario,
					fileName: updatedPlain.nombre_archivo,
					isResubmission: wasRejected,
				});

				return updatedPlain;
	}

	const entrega = await ActividadRepository.createEntrega({
		actividad_ID: actividadId,
		aprendiz_ID: userId,
		comentario: comentario ?? null,
		nombre_archivo: sanitizedName,
		archivo_ruta: relativePath,
		peso_archivo: file.size,
	});

			const entregaCompleta = await ActividadRepository.findEntregaById(entrega.ID);
			const entregaPlain = toPlain(entregaCompleta);

			await notifyActivitySubmission({
				remitenteId: userId,
				instructorId,
				courseId,
				courseName,
				activity: actividadData,
				apprenticeName: buildApprenticeName(
					entregaPlain.aprendiz,
					entregaPlain.aprendiz_ID
				),
				comment: entregaPlain.comentario,
				fileName: entregaPlain.nombre_archivo,
			});

			return entregaPlain;
		} catch (error) {
			if (error?.status) {
				throw error;
			}
			throw createHttpError(500, "Error al registrar la entrega.");
		}
	}

	static async revisarEntrega(entregaId, payload, file, user) {
		try {
			ensureInitialized();

	const entrega = await ActividadRepository.findEntregaById(entregaId);
	if (!entrega) {
		throw createHttpError(404, "Entrega no encontrada.");
	}

			await ensureCursoAccesible({ cursoInput: entrega.actividad.curso, user });

			const accountType = getAccountType(user).toLowerCase();
	if (!isPrivilegedAccount(accountType)) {
				throw createHttpError(
					403,
					"No tienes permisos para revisar entregas."
				);
	}

	const updates = {};
	const estado = payload?.estado_revision || payload?.estado;
	if (estado) {
		const estadoLower = estado.toLowerCase();
		if (!["pendiente", "aprobada", "rechazada"].includes(estadoLower)) {
			throw createHttpError(400, "Estado de revisión inválido.");
		}
		updates.estado_revision = estadoLower;
	}

	if (payload?.retroalimentacion !== undefined) {
		updates.retroalimentacion = payload.retroalimentacion?.trim() || null;
	}

	if (file) {
		if (entrega.retro_archivo_ruta) {
			await deleteFileIfExists(entrega.retro_archivo_ruta);
		}

		const storedFile = await saveBufferFile({
			buffer: file.buffer,
			fileName: path.parse(file.originalname || `retroalimentacion-${Date.now()}`).base,
			subdirectories: [
				"actividades",
				`curso-${entrega.actividad.curso.ID}`,
				`actividad-${entrega.actividad.ID}`,
				"feedback",
				`entrega-${entrega.ID}`,
			],
		});

		updates.retro_archivo_ruta = storedFile.relativePath;
	}

	const reviewerId = normalizeUserId(user);
	if (!reviewerId) {
		throw createHttpError(401, "Usuario no autenticado.");
	}
	updates.retro_fecha = new Date();
	updates.retro_by = reviewerId;

	await ActividadRepository.updateEntrega(entregaId, updates);

	const entregaActualizada = await ActividadRepository.findEntregaById(entregaId);
			const entregaActualizadaPlain = toPlain(entregaActualizada);

			await notifyActivityReview({
				remitenteId: reviewerId,
				apprenticeId: entregaActualizadaPlain.aprendiz_ID,
				courseId: entregaActualizadaPlain.actividad?.curso?.ID,
				courseName: entregaActualizadaPlain.actividad?.curso?.nombre_curso,
				activity: entregaActualizadaPlain.actividad,
				reviewStatus: entregaActualizadaPlain.estado_revision,
				feedback: entregaActualizadaPlain.retroalimentacion,
			});

			return entregaActualizadaPlain;
		} catch (error) {
			if (error?.status) {
				throw error;
			}
			throw createHttpError(500, "Error al revisar la entrega.");
		}
	}

	static async eliminarActividad(actividadId, user) {
		try {
			ensureInitialized();

			const actividad = await ActividadRepository.findActividadById(actividadId);
			if (!actividad) {
				throw createHttpError(404, "Actividad no encontrada.");
			}

			const curso = await ensureCursoAccesible({ cursoInput: actividad.curso, user });
			const accountType = getAccountType(user).toLowerCase();
			const userId = normalizeUserId(user);

			if (!isPrivilegedAccount(accountType)) {
				throw createHttpError(403, "No tienes permisos para eliminar actividades.");
			}

			if (accountType === "instructor") {
				const { hasAcceptedAssignment, ownsByCursoRecord } =
					await resolveInstructorCourseOwnership(curso, userId);
				if (!hasAcceptedAssignment && !ownsByCursoRecord) {
					throw createHttpError(
						403,
						"Solo el instructor asignado puede eliminar actividades de este curso."
					);
				}
			}

			await ActividadRepository.deleteActividadById(actividadId);
			return true;
		} catch (error) {
			if (error?.status) {
				throw error;
			}
			throw createHttpError(500, "Error al eliminar la actividad.");
		}
	}
}

module.exports = { ActividadService };

