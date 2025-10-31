import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../../config/axiosInstance";
import "./ModalManageCourses.css";

export const ModalManageCourses = ({
  instructorId,
  instructorEstado,
  cursosAsignadosIniciales,
  onClose,
  onChanged,
}) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultados, setResultados] = useState([]);
  const [notFound, setNotFound] = useState(false);
  const [cursosAsignados, setCursosAsignados] = useState(
    Array.isArray(cursosAsignadosIniciales) ? cursosAsignadosIniciales : []
  );

  const cursosAsignadosIds = useMemo(
    () => new Set(cursosAsignados.map((c) => (c.Curso?.ID ?? c.curso_ID ?? c.ID))),
    [cursosAsignados]
  );

  const isInstructorActivo = (instructorEstado || "").toLowerCase() === "activo";

  useEffect(() => {
    setCursosAsignados(Array.isArray(cursosAsignadosIniciales) ? cursosAsignadosIniciales : []);
  }, [cursosAsignadosIniciales]);

  const buscarCursos = async (texto) => {
    if (!texto || texto.trim().length < 2) {
      setResultados([]);
      setNotFound(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await axiosInstance.get(`/api/courses/searchCurso`, { params: { input: texto } });
      const lista = Array.isArray(res.data) ? res.data : [];
      setResultados(lista);
      setNotFound(lista.length === 0);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 404) {
        setResultados([]);
        setNotFound(true);
      } else {
        // Evitar alertas; mostrar estado vacío
        setResultados([]);
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const asignar = async (cursoId, opts = {}) => {
    try {
      if (!isInstructorActivo) {
        alert("No se pueden asignar cursos a instructores inactivos.");
        return;
      }
      await axiosInstance.post(`/api/courses/asignaciones`, {
        instructor_ID: instructorId,
        curso_ID: cursoId,
        ...(opts?.force ? { force: true } : {})
      });
      // Refrescar asignados localmente
      const cursoAsignado = resultados.find((c) => c.ID === cursoId);
      const entrada = cursoAsignado
        ? { Curso: { ID: cursoAsignado.ID, nombre_curso: cursoAsignado.nombre_curso } }
        : { curso_ID: cursoId };
      setCursosAsignados((prev) => [...prev, entrada]);
      onChanged && onChanged();
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message;
      const code = e?.response?.data?.code;
      if (code === 'REJECTED_EXISTS') {
        const confirmar = window.confirm(msg || 'Este instructor rechazó previamente. ¿Desea asignarlo nuevamente?');
        if (confirmar) {
          return asignar(cursoId, { force: true });
        }
        return;
      }
      if (status === 409 || status === 400) {
        alert(msg || "Conflicto al asignar curso.");
      } else if (status === 404) {
        alert(msg || "Curso o instructor no encontrado.");
      } else {
        alert("Error al asignar el curso.");
      }
    }
  };

  const eliminar = async (cursoId) => {
    try {
      const confirmar = window.confirm('¿Deseas eliminar esta asignación?');
      if (!confirmar) return;
      await axiosInstance.delete(`/api/courses/asignaciones/${instructorId}/${cursoId}`);
      setCursosAsignados((prev) => prev.filter((c) => Number(c.Curso?.ID ?? c.curso_ID ?? c.ID) !== Number(cursoId)));
      onChanged && onChanged({ removedId: Number(cursoId) });
    } catch (e) {
      alert(e?.response?.data?.message || "Error al eliminar asignación.");
    }
  };

  const cursoEstaAsignadoAOtro = (curso) => {
    const instructorAsignado = curso?.instructor_ID || curso?.Instructor?.ID; // puede venir embed
    return instructorAsignado && Number(instructorAsignado) !== Number(instructorId);
  };

  return (
    <div className="modal-manage-overlay" role="dialog" aria-modal="true">
      <div className="modal-manage">
        <div className="modal-manage-header">
          <h3>Gestionar cursos asignados</h3>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Cerrar" />
        </div>

        {!isInstructorActivo && (
          <div className="banner-inactivo">No se pueden asignar cursos a instructores inactivos.</div>
        )}

        <div className="manage-content">
          <div className="panel panel-busqueda">
            <div className="search-row">
              <input
                type="text"
                placeholder="Buscar por nombre o ficha"
                value={query}
                onChange={(e) => {
                  const t = e.target.value;
                  setQuery(t);
                  buscarCursos(t);
                }}
              />
            </div>
            {loading && <div className="info-row">Buscando…</div>}
            {error && <div className="error-row">{error}</div>}
            <ul className="resultados">
              {notFound && resultados.length === 0 && !loading && (
                <li className="resultado-item" style={{ color: '#999' }}>No se encontraron cursos</li>
              )}
              {resultados.map((curso) => {
                const yaAsignadoEste = cursosAsignadosIds.has(curso.ID);
                const asignadoOtro = cursoEstaAsignadoAOtro(curso);
                const nombreInstructorAsignado = curso?.Instructor ? `${curso.Instructor.nombres || ''} ${curso.Instructor.apellidos || ''}`.trim() : '';
                return (
                  <li key={curso.ID} className="resultado-item">
                    <div className="curso-info">
                      <span className="nombre" title={curso.nombre_curso}>{curso.nombre_curso}</span>
                      <span className="ficha">Ficha: {curso.ficha}</span>
                    </div>
                    <div className="acciones">
                      {yaAsignadoEste ? (
                        <button type="button" className="btn-eliminar" onClick={() => eliminar(curso.ID)}>Eliminar</button>
                      ) : (
                        <button
                          type="button"
                          className="btn-asignar"
                          disabled={!isInstructorActivo || asignadoOtro}
                          title={!isInstructorActivo ? 'Instructor inactivo' : asignadoOtro ? (nombreInstructorAsignado ? `Asignado a: ${nombreInstructorAsignado}` : 'Ya asignado a otro instructor') : 'Asignar'}
                          onClick={() => asignar(curso.ID)}
                        >
                          {asignadoOtro ? (nombreInstructorAsignado ? `Asignado a ${nombreInstructorAsignado}` : 'No disponible') : 'Asignar'}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="panel panel-asignados">
            <div className="panel-title">Asignados actualmente</div>
            <ul className="asignados">
              {cursosAsignados.map((c) => {
                const id = c.Curso?.ID ?? c.curso_ID ?? c.ID;
                const nombre = c.Curso?.nombre_curso ?? c.nombre_curso ?? `Curso ${id}`;
                return (
                  <li key={id} className="asignado-item">
                    <span className="nombre" title={nombre}>{nombre}</span>
                    <button type="button" className="btn-eliminar" onClick={() => eliminar(id)}>Eliminar</button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};


