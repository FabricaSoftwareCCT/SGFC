const path = require("path");
const fs = require("fs");

const uploadsRoot = path.join(__dirname, "..", "uploads");

const ensureDirectory = async (directory) => {
	await fs.promises.mkdir(directory, { recursive: true });
};

const sanitizeFileName = (fileName) => {
	if (!fileName) {
		return `archivo-${Date.now()}`;
	}
	return fileName
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-zA-Z0-9._-]/g, "_");
};

const saveBufferFile = async ({ buffer, subdirectories = [], fileName }) => {
	if (!buffer) {
		throw new Error("Buffer no proporcionado para guardar el archivo.");
	}

	const sanitizedFileName = sanitizeFileName(fileName);
	const absoluteDirectory = path.join(uploadsRoot, ...subdirectories);
	await ensureDirectory(absoluteDirectory);

	const absolutePath = path.join(absoluteDirectory, sanitizedFileName);
	await fs.promises.writeFile(absolutePath, buffer);

	const relativePath = `/uploads/${path
		.relative(path.join(__dirname, "..", "uploads"), absolutePath)
		.replace(/\\/g, "/")}`;

	return { absolutePath, relativePath, fileName: sanitizedFileName };
};

const deleteFileIfExists = async (relativePath) => {
	if (!relativePath) return;
	const cleanedPath = relativePath.replace(/^\/+/, "");
	const absolutePath = path.join(__dirname, "..", cleanedPath);

	try {
		await fs.promises.unlink(absolutePath);
	} catch (error) {
		if (error.code !== "ENOENT") {
			console.warn(`No se pudo eliminar el archivo ${absolutePath}:`, error.message);
		}
	}
};

module.exports = {
	saveBufferFile,
	deleteFileIfExists,
};

