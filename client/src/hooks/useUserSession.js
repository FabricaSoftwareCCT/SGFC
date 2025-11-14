import { useMemo } from "react";

export const PRIVILEGE_ROLES = ["administrador", "gestor", "instructor"];

const parseSession = () => {
	const rawSession =
		JSON.parse(localStorage.getItem("userSession")) ||
		JSON.parse(sessionStorage.getItem("userSession"));

	const accountType = (rawSession?.accountType || "").toLowerCase();
	const userId =
		rawSession?.id ??
		rawSession?.ID ??
		rawSession?.usuario_ID ??
		rawSession?.usuarioId ??
		null;

	return {
		session: rawSession,
		accountType,
		isPrivileged: PRIVILEGE_ROLES.includes(accountType),
		isApprentice: accountType === "aprendiz",
		userId,
	};
};

export const useUserSession = () => {
	return useMemo(() => parseSession(), []);
};

export const getUserSession = () => parseSession();


