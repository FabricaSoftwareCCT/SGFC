const normalizeUserId = (user) => Number(user?.ID || user?.id || user?.usuario_ID);

const getAccountType = (user) =>
	(user?.accountType || user?.AccountType || user?.data?.accountType || "")
		.toString()
		.trim();

const isPrivilegedAccount = (accountType = "") => {
	const normalized = accountType.toLowerCase();
	return ["administrador", "gestor", "instructor"].includes(normalized);
};

const createHttpError = (status, message) => {
	const error = new Error(message);
	error.status = status;
	return error;
};

module.exports = {
	normalizeUserId,
	getAccountType,
	isPrivilegedAccount,
	createHttpError,
};

