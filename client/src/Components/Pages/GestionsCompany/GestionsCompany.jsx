import { useState, useEffect } from "react";
import { Header } from "../../Layouts/Header/Header";
import { Main } from "../../Layouts/Main/Main";
import "./GestionsCompany.css";
import axiosInstance from "../../../config/axiosInstance";
import { Footer } from "../../Layouts/Footer/Footer";
import { ManageCompany } from "./ManageCompany/ManageCompany";
import { CreateEmpresa } from "../CreateEmpresa/CreateEmpresa";
import fotoPerfilDefect from "../../../assets/Icons/userDefect.png";
import { ManageManager } from "./ManageManager/ManageManager";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faSearch, faFilter, faPlus, faUsers, faIdCard, faChartBar } from '@fortawesome/free-solid-svg-icons';

export const GestionsCompany = () => {
	const [empresas, setEmpresas] = useState([]);
	const [filtro, setFiltro] = useState("");
	const [estadoFiltro, setEstadoFiltro] = useState("Todos");
	const [page, setPage] = useState(1);
	const pageSize = 10;
	const [selectedEmpresa, setSelectedEmpresa] = useState(null);
	const [selectedManager, setSelectedManager] = useState(null);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [loading, setLoading] = useState(true);

	const userSession = (() => {
		try {
			const raw = sessionStorage.getItem("userSession");
			return raw ? JSON.parse(raw) : null;
		} catch (_) {
			return null;
		}
	})();

	const isAdmin = userSession?.accountType === "Administrador";

	const fetchEmpresas = async () => {
		try {
			setLoading(true);
			const res = await axiosInstance.get("/api/users/empresas");
			setEmpresas(res.data);
		} catch (error) {
			setEmpresas([]);
			console.error("Error al cargar empresas:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchEmpresas();
	}, []);

	// Filtrado por nombre/NIT y estado
	const empresasFiltradas = empresas.filter((empresa) => {
		const nombreONitMatch =
			(empresa.Empresa?.nombre_empresa || "")
				.toLowerCase()
				.includes(filtro.toLowerCase()) ||
			(empresa.Empresa?.NIT || "")
				.toLowerCase()
				.includes(filtro.toLowerCase());

		const estadoEmpresa = (empresa.Empresa?.estado || "").toLowerCase();
		const estadoMatch =
			estadoFiltro === "Todos" || estadoEmpresa === estadoFiltro.toLowerCase();

		return nombreONitMatch && estadoMatch;
	});

	const total = empresasFiltradas.length;
	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	const pageClamped = Math.min(page, totalPages);
	const start = (pageClamped - 1) * pageSize;
	const currentItems = empresasFiltradas.slice(start, start + pageSize);

	const getLogoSrc = (logo) => {
		if (!logo) return fotoPerfilDefect;

		if (typeof logo === "string") {
			if (logo.startsWith('data:') || logo.startsWith('http')) {
				return logo;
			}

			if (/(\.png|\.jpg|\.jpeg|\.gif)$/i.test(logo)) {
				return fotoPerfilDefect;
			}

			if (logo.startsWith('iVBOR')) {
				return `data:image/png;base64,${logo}`;
			}
			if (logo.startsWith('/9j/')) {
				return `data:image/jpeg;base64,${logo}`;
			}

			if (logo.length < 100) {
				return fotoPerfilDefect;
			}

			return `data:image/jpeg;base64,${logo}`;
		}

		return fotoPerfilDefect;
	};

	const handleAddCompany = () => {
		setShowCreateModal(true);
	};

	const handleCloseModal = () => {
		setShowCreateModal(false);
	};

	if (loading) {
		return (
			<div className="pantallaGestionsCompany">
				<Header />
				<Main>
					<div className="loading-container">
						<div className="loading-spinner"></div>
						<p>Cargando empresas...</p>
					</div>
				</Main>
				<Footer />
			</div>
		);
	}

	return (
		<div className="pantallaGestionsCompany">
			<Header />
			<Main>
				<div className="gestions-company-container">
					{/* Header Section */}
					<div className="company-header">
						<div className="header-content">
							<div className="title-section">
								<FontAwesomeIcon icon={faBuilding} className="header-icon" />
								<div className="title-text">
									<h1>Gestión de <span>Empresas</span></h1>
									<p className="header-description">
										Consulta y gestiona las empresas registradas en el sistema
									</p>
								</div>
							</div>
							<button className="add-company-btn" onClick={handleAddCompany}>
								<FontAwesomeIcon icon={faPlus} />
								<span>Añadir Empresa</span>
							</button>
						</div>
					</div>

					{/* Search and Filters Panel */}
					<div className="search-filters-panel">
						<div className="search-section">
							<div className="search-input-container">
								<FontAwesomeIcon icon={faSearch} className="search-icon" />
								<input
									type="text"
									placeholder="Buscar por nombre o NIT..."
									value={filtro}
									onChange={(e) => setFiltro(e.target.value)}
									className="search-input"
								/>
							</div>
						</div>

						<div className="filters-section">
							<div className="filter-group">
								<label className="filter-label">Estado de la empresa</label>
								<select
									className="filter-select"
									value={estadoFiltro}
									onChange={(e) => setEstadoFiltro(e.target.value)}
								>
									<option value="Todos">Todos los estados</option>
									<option value="Activo">Activo</option>
									<option value="Inactivo">Inactivo</option>
								</select>
							</div>
						</div>

						<div className="results-count">
							<FontAwesomeIcon icon={faUsers} />
							<div className="results-text">
								<span className="results-number">{total}</span>
								<span className="results-label">empresas encontradas</span>
							</div>
						</div>
					</div>

					{/* Table Section */}
					<div className="table-main-section">
						<div className="table-header-main">
							<div className="table-title-section">
								<FontAwesomeIcon icon={faBuilding} className="table-title-icon" />
								<h2 className="table-main-title">Lista de Empresas</h2>
							</div>
							<div className="pagination-info-main">
								Página {pageClamped} de {totalPages}
							</div>
						</div>

						<div className="table-container-main">
							{empresas.length === 0 ? (
								<div className="empty-state">
									<FontAwesomeIcon icon={faBuilding} />
									<h3>No hay empresas registradas</h3>
									<p>Comienza agregando la primera empresa al sistema.</p>
									<button className="add-company-btn" onClick={handleAddCompany}>
										<FontAwesomeIcon icon={faPlus} />
										<span>Añadir Primera Empresa</span>
									</button>
								</div>
							) : empresasFiltradas.length === 0 ? (
								<div className="empty-state">
									<FontAwesomeIcon icon={faSearch} />
									<h3>No se encontraron resultados</h3>
									<p>Intenta ajustar los filtros de búsqueda.</p>
								</div>
							) : (
								<table className="companies-table-main">
									<thead>
										<tr>
											<th className="logo-header-main">Logo</th>
											<th className="name-header-main">Nombre</th>
											<th className="nit-header-main">NIT</th>
											<th className="category-header-main">Categoría</th>
											<th className="status-header-main">Estado</th>
											<th className="actions-header-main">Acciones</th>
										</tr>
									</thead>
									<tbody>
										{currentItems.map((empresa) => {
											const nombre = empresa.Empresa?.nombre_empresa || "Sin nombre";
											const nit = empresa.Empresa?.NIT || "-";
											const categoria = empresa.Empresa?.categoria || "Sin categoría";
											const estado = (empresa.Empresa?.estado || "").toLowerCase();
											const logo = empresa.Empresa?.img_empresa;
											const logoSrc = getLogoSrc(logo);

											return (
												<tr key={empresa.ID} className="company-row-main">
													<td className="logo-cell-main">
														<img
															className="company-logo-main"
															src={logoSrc}
															alt="Logo empresa"
															onError={(e) => {
																e.currentTarget.src = fotoPerfilDefect;
															}}
														/>
													</td>
													<td className="name-cell-main">
														<div className="company-name-main">{nombre}</div>
													</td>
													<td className="nit-cell-main">
														<div className="nit-badge-main">{nit}</div>
													</td>
													<td className="category-cell-main">
														<div className="category-badge-main">{categoria}</div>
													</td>
													<td className="status-cell-main">
														<div className={`status-badge-main status-${estado}`}>
															{estado === 'activo' ? 'Activo' :
																estado === 'inactivo' ? 'Inactivo' :
																	estado === 'suspendido' ? 'Suspendido' : 'Sin estado'}
														</div>
													</td>
													<td className="actions-cell-main">
														<div className="actions-buttons-main">
															{isAdmin && (
																<button
																	className="action-btn-main manage-btn-main"
																	onClick={() => setSelectedEmpresa(empresa.Empresa)}
																>
																	<FontAwesomeIcon icon={faUsers} />
																	<span>Gestionar</span>
																</button>
															)}
															<button
																className="action-btn-main view-btn-main"
																onClick={() => setSelectedManager(empresa)}
															>
																<FontAwesomeIcon icon={faIdCard} />
																<span>Manager</span>
															</button>
														</div>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							)}
						</div>

						{/* Pagination */}
						{totalPages > 1 && (
							<div className="pagination-controls-main">
								<button
									className="pagination-btn-main prev-btn-main"
									disabled={pageClamped === 1}
									onClick={() => setPage(p => Math.max(1, p - 1))}
								>
									Anterior
								</button>

								<div className="page-indicator-main">
									{pageClamped} / {totalPages}
								</div>

								<button
									className="pagination-btn-main next-btn-main"
									disabled={pageClamped === totalPages}
									onClick={() => setPage(p => Math.min(totalPages, p + 1))}
								>
									Siguiente
								</button>
							</div>
						)}
					</div>
				</div>
			</Main>
			<Footer />

			{/* Modals */}
			{selectedEmpresa && (
				<ManageCompany
					empresa={selectedEmpresa}
					onClose={() => setSelectedEmpresa(null)}
				/>
			)}

			{selectedManager && (
				<ManageManager
					data={selectedManager}
					isAdmin={isAdmin}
					onClose={() => setSelectedManager(null)}
					update={fetchEmpresas}
				/>
			)}

			{showCreateModal && (
				<CreateEmpresa
					onClose={handleCloseModal}
					onCompanyCreated={() => {
						fetchEmpresas();
						handleCloseModal();
					}}
				/>
			)}
		</div>
	);
};