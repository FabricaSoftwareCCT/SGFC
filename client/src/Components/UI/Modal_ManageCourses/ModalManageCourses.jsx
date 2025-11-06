import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../../config/axiosInstance";
import "./ModalManageCourses.css";
import Swal from "sweetalert2";

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
        Swal.fire({
          icon:"info",
          title:"Instructor inactivo",
          text:"No se pueden asignar cursos a instructores inactivos.",
          confirmButtonText:"Okay",
          theme:"bulma",
          customClass:{
            confirmButton: 'centered-swal-button'
          }
        })
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
  const result = await Swal.fire({
        title: 'Instructor rechazado previamente',
        text: msg || 'Este instructor rechazó previamente. ¿Desea asignarlo nuevamente?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, asignar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        theme: "bulma",
        customClass: {
            confirmButton: 'button is-primary',
            cancelButton: 'button is-danger',
            actions: 'swal2-actions-centered'
        },
        buttonsStyling: false
    });

    if (result.isConfirmed) {
        return asignar(cursoId, { force: true });
    }
    return;
}

if (status === 409 || status === 400) {
    await Swal.fire({
        title: 'Conflicto',
        text: msg || "Conflicto al asignar curso.",
        icon: 'error',
        confirmButtonText: 'Aceptar',
        theme: "bulma",
        customClass: {
            confirmButton: 'button is-danger',
            actions: 'swal2-actions-centered'
        },
        buttonsStyling: false
    });
} else if (status === 404) {
    await Swal.fire({
        title: 'No encontrado',
        text: msg || "Curso o instructor no encontrado.",
        icon: 'warning',
        confirmButtonText: 'Aceptar',
        theme: "bulma",
        customClass: {
            confirmButton: 'button is-warning',
            actions: 'swal2-actions-centered'
        },
        buttonsStyling: false
    });
} else {
    await Swal.fire({
        title: 'Error',
        text: "Error al asignar el curso.",
        icon: 'error',
        confirmButtonText: 'Aceptar',
        theme: "bulma",
        customClass: {
            confirmButton: 'button is-danger',
            actions: 'swal2-actions-centered'
        },
        buttonsStyling: false
    });
}
  };
  }
 const eliminar = async (cursoId) => {
    try {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: '¿Deseas eliminar esta asignación?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            theme: "bulma",
            customClass: {
                confirmButton: 'button is-danger',
                cancelButton: 'button is-light',
                actions: 'swal2-actions-centered'
            },
            buttonsStyling: false
        });

        if (!result.isConfirmed) {
            return; // Si cancela, sale de la función
        }

        // Lógica para eliminar
        await axiosInstance.delete(`/api/courses/asignaciones/${instructorId}/${cursoId}`);
        
        // Actualizar estado local
        setCursosAsignados((prev) => prev.filter((c) => Number(c.Curso?.ID ?? c.curso_ID ?? c.ID) !== Number(cursoId)));
        
        // Callback si existe
        onChanged && onChanged({ removedId: Number(cursoId) });

        // Mostrar mensaje de éxito
        await Swal.fire({
            title: '¡Eliminado!',
            text: 'La asignación ha sido eliminada.',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            theme: "bulma",
            customClass: {
                confirmButton: 'button is-primary',
                actions: 'swal2-actions-centered'
            },
            buttonsStyling: false
        });

    } catch (e) {
        console.error('Error al eliminar:', e);
        
        // Mostrar error con SweetAlert2
        await Swal.fire({
            title: 'Error',
            text: e?.response?.data?.message || "Error al eliminar asignación.",
            icon: 'error',
            confirmButtonText: 'Aceptar',
            theme: "bulma",
            customClass: {
                confirmButton: 'button is-danger',
                actions: 'swal2-actions-centered'
            },
            buttonsStyling: false
        });
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


