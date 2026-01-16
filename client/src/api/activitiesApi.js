import axiosInstance from "../config/axiosInstance";

const extractPayload = (response, key) => {
	const data = response?.data ?? {};
	if (data.success === false) {
		throw new Error(data.message || "La solicitud no pudo completarse.");
	}
	return key ? data[key] : data;
};

export const getActivities = async (cursoId) => {
	const response = await axiosInstance.get(`/api/activities/cursos/${cursoId}`);
	return extractPayload(response, "actividades") || [];
};

export const getActivity = async (actividadId) => {
	const response = await axiosInstance.get(`/api/activities/${actividadId}`);
	return extractPayload(response, "actividad");
};

export const createActivity = async (cursoId, payload) => {
	const response = await axiosInstance.post(
		`/api/activities/cursos/${cursoId}`,
		payload
	);
	return extractPayload(response, "actividad");
};

export const updateActivity = async (actividadId, payload) => {
	const response = await axiosInstance.put(
		`/api/activities/${actividadId}`,
		payload
	);
	return extractPayload(response, "actividad");
};

export const deleteActivity = async (actividadId) => {
	const response = await axiosInstance.delete(`/api/activities/${actividadId}`);
	return extractPayload(response);
};

export const attachMaterialToActivity = async (actividadId, materialId) => {
	const response = await axiosInstance.post(
		`/api/activities/${actividadId}/material/${materialId}`
	);
	return extractPayload(response, "actividad");
};

export const detachMaterialFromActivity = async (actividadId, materialId) => {
	const response = await axiosInstance.delete(
		`/api/activities/${actividadId}/material/${materialId}`
	);
	return extractPayload(response, "actividad");
};

export const registerDelivery = async (actividadId, formData) => {
	const response = await axiosInstance.post(
		`/api/activities/${actividadId}/entregas`,
		formData,
		{
			headers: { "Content-Type": "multipart/form-data" },
		}
	);
	return extractPayload(response, "entrega");
};

export const reviewDelivery = async (entregaId, formData) => {
	const response = await axiosInstance.patch(
		`/api/activities/entregas/${entregaId}/revision`,
		formData,
		{
			headers: { "Content-Type": "multipart/form-data" },
		}
	);
	return extractPayload(response, "entrega");
};

export const getCourseMaterials = async (cursoId) => {
	const response = await axiosInstance.get(`/api/material/${cursoId}`);
	const data = response?.data ?? {};
	if (data.success === false) {
		throw new Error(data.message || "No se obtuvo el material del curso.");
	}
	return Array.isArray(data.materiales) ? data.materiales : [];
};

export const getCourseParticipants = async (
	cursoId,
	{ page = 0, limit = 10 } = {}
) => {
	const response = await axiosInstance.get(
		`/api/courses/cursos/${cursoId}/participants`,
		{
			params: { page, limit },
		}
	);

	const data = response?.data ?? {};

	if (data.success === false) {
		throw new Error(
			data.message || "No se pudo obtener los participantes del curso."
		);
	}

	const participants = Array.isArray(data.participants)
		? data.participants
		: [];
	const total = typeof data.total === "number" ? data.total : participants.length;
	const resolvedPages =
		typeof data.pages === "number" && !Number.isNaN(data.pages)
			? data.pages
			: Math.max(1, Math.ceil(total / limit));

	return {
		participants,
		total,
		page: typeof data.page === "number" ? data.page : page,
		pages: resolvedPages,
	};
};


