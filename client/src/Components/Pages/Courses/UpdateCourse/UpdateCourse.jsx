import React, { useEffect, useRef, useState } from "react";
import "./UpdateCourse.css";
import { Header } from "../../../Layouts/Header/Header";
import { Footer } from "../../../Layouts/Footer/Footer";
import { Main } from "../../../Layouts/Main/Main";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../../../config/axiosInstance";
import addIMG from "../../../../assets/Icons/addImg.png";
import EditCalendar from "../../../UI/Modal_Calendar/EditCalendar/EditCalendar";
import calendar from '../../../../assets/Icons/calendar.png';
import debounce from "lodash.debounce";
import buttonEdit from '../../../../assets/Icons/buttonEdit.png';
import { useModal } from "../../../../Context/ModalContext";
import { AssignInstructorCourse } from "../AssignInstructorCourse/AssignInstructorCourse";


export const UpdateCourse = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [curso, setCurso] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [isEditCalendarOpen, setIsEditCalendarOpen] = useState(false);
  const [calendarData, setCalendarData] = useState({
    startDate: "",
    endDate: "",
    selectedSlots: [],
  });

  const { showAssignModal, setShowAssignModal } = useModal();

  // Estado para búsqueda y selección de empresa
  const [empresaNIT, setEmpresaNIT] = useState("");
  const [resultadosEmpresa, setResultadosEmpresa] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [showResultados, setShowResultados] = useState(false);

  useEffect(() => {
    const fetchCurso = async () => {
      try {
        const response = await axiosInstance.get(`/api/courses/cursos/${id}`);
        // Normaliza tipo_oferta
        const tipoOfertaNormalizado = response.data.tipo_oferta
          ? response.data.tipo_oferta.charAt(0).toUpperCase() + response.data.tipo_oferta.slice(1).toLowerCase()
          : "";

        setCurso({
          ...response.data,
          tipo_oferta: tipoOfertaNormalizado,
          empresa_ID: response.data.empresa_ID,
        });

        // Imagen base64:
        if (response.data.imagen) {
          setPreview(`data:image/png;base64,${response.data.imagen}`);
        }

        setCalendarData({
          startDate: response.data.fecha_inicio?.split("T")[0] || "",
          endDate: response.data.fecha_fin?.split("T")[0] || "",
          selectedSlots: response.data.slots_formacion
            ? JSON.parse(response.data.slots_formacion)
            : [],
        });

        // Si el curso ya tiene empresa asignada y es cerrada, selecciona la empresa por ID
        if (tipoOfertaNormalizado === "Cerrada" && response.data.empresa_ID) {
          try {
            const empresaResp = await axiosInstance.get(`/api/users/empresa/id/${response.data.empresa_ID}`);
            setEmpresaSeleccionada(empresaResp.data);
            setEmpresaNIT('');
          } catch {
            setEmpresaSeleccionada(null);
          }
        }
      } catch (error) {
        console.error("Error al obtener el curso:", error);
      }
    };

    fetchCurso();
  }, [id]);

  const handleCalendarSave = (data) => {
    setCalendarData(data);
    setIsEditCalendarOpen(false);
  };

  const handleUpdateCourse = async () => {
    try {
      if (curso.tipo_oferta === "Cerrada" && !empresaSeleccionada) {
        alert("Por favor selecciona una empresa válida.");
        return;
      }

      const slotsByDay = {};
      calendarData.selectedSlots.forEach(slot => {
        const [dia, hora] = slot.split("-");
        if (!slotsByDay[dia]) slotsByDay[dia] = [];
        slotsByDay[dia].push(hora);
      });

      let horaInicio = "23:59";
      let horaFin = "00:00";
      Object.values(slotsByDay).flat().forEach(hora => {
        if (hora < horaInicio) horaInicio = hora;
        if (hora > horaFin) horaFin = hora;
      });

      const diasMapping = {
        Lun: "Lunes",
        Mar: "Martes",
        Mié: "Miércoles",
        Jue: "Jueves",
        Vie: "Viernes",
        Sáb: "Sábado",
      };
      const diasSemana = Object.keys(slotsByDay).map(dia => diasMapping[dia] || dia);

      const updatedCurso = {
        ficha: curso.ficha,
        nombre_curso: curso.nombre_curso,
        descripcion: curso.descripcion,
        tipo_oferta: curso.tipo_oferta,
        estado: curso.estado,
        fecha_inicio: calendarData.startDate,
        fecha_fin: calendarData.endDate,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        dias_formacion: JSON.stringify(diasSemana),
        lugar_formacion: curso.lugar_formacion || "",
        slots_formacion: JSON.stringify(calendarData.selectedSlots),
        empresa_ID:
          curso.tipo_oferta === "Cerrada"
            ? empresaSeleccionada?.ID || curso.empresa_ID
            : null,
      };

      const response = await axiosInstance.put(`/api/courses/cursos/${id}`, updatedCurso, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        alert("Curso actualizado con éxito");
        navigate(`/Cursos/${id}`);
      } else {
        alert("Ocurrió un error al actualizar el curso");
      }
    } catch (error) {
      console.error("Error al actualizar el curso:", error);
      alert("Ocurrió un error al actualizar el curso");
    }
  };

  // Buscar empresa por NIT
  const buscarEmpresaPorNIT = async (nit) => {
    if (!nit.trim()) {
      setResultadosEmpresa([]);
      return;
    }
    try {
      const response = await axiosInstance.get(`/api/users/empresa/${nit}`);
      setResultadosEmpresa([response.data]);
      setShowResultados(true);
    } catch {
      setResultadosEmpresa([]);
      setShowResultados(false);
    }
  };

  const debouncedBuscarEmpresa = useRef(debounce(buscarEmpresaPorNIT, 500)).current;

  useEffect(() => {
    debouncedBuscarEmpresa(empresaNIT);
    return () => debouncedBuscarEmpresa.cancel();
  }, [empresaNIT]);

  const handleSeleccionEmpresa = (empresa) => {
    setEmpresaSeleccionada(empresa);
    setEmpresaNIT(empresa.NIT);
    setShowResultados(false);
  };

  if (!curso) return <p>Cargando...</p>;


  return (
    <>
      <Header />
      <Main>
        <div className="container_createCourse">
          <h2>
            Actualizar
            <span className="complementary"> Curso</span>
          </h2>

          <div className="containerInformation_CreateCourse">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => setPreview(reader.result);
                  reader.readAsDataURL(file);
                }
              }}
              hidden
            />

            <label
              className="upload-area"
              onClick={() => fileInputRef.current.click()}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Vista previa"
                  className="preview-image"
                />
              ) : (
                <div className="upload-placeholder">
                  <img
                    src={addIMG}
                    alt="icono agregar imagen"
                    className="icon"
                  />
                  <p>Arrastra o sube la foto del curso aquí.</p>
                </div>
              )}
            </label>


            <div className="containerDetails_course">
              <div id="containerInput_ficha">
                <label htmlFor="fichaCourse">Ficha: </label>
                <input
                  id="fichaCourse"
                  type="text"
                  value={curso.ficha || ""}
                  onChange={(e) =>
                    setCurso({ ...curso, ficha: e.target.value })
                  }
                />
              </div>
              <input
                className="addName"
                type="text"
                value={curso.nombre_curso || ""}
                onChange={(e) => {
                  setCurso({ ...curso, nombre_curso: e.target.value });
                }}
              />
              <div className='containerInput_description_course'>
                <textarea
                  className='addDetails'
                  placeholder='Agregar descripción del curso (mínimo 300 caracteres)'
                  value={curso.descripcion || ""}  // <- aquí estaba el error
                  onChange={(e) => {
                    setCurso({ ...curso, descripcion: e.target.value });
                  }} minLength={300}
                  rows={6}
                  style={{ resize: "vertical", width: "99%" }}
                />
                <div
                  className={`descripcion-counter ${curso.descripcion.length < 300 ? 'rojo' : 'verde'}`}
                >
                  {curso.descripcion.length} / 300 caracteres
                </div>
              </div>


              <div className="containerDetails_course2">
                <div>
                  <div className="offer-type-container">
                    <span>Tipo de oferta:</span>
                    <div className="offer-options">
                      <button
                        className={`offer-button ${curso.tipo_oferta?.toLowerCase() === "cerrada" ? "active" : ""}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurso({ ...curso, tipo_oferta: "Cerrada" });
                        }}
                        type="button"
                      >
                        Cerrada
                      </button>
                      <button
                        className={`offer-button ${curso.tipo_oferta?.toLowerCase() === "abierta" ? "active" : ""}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurso({ ...curso, tipo_oferta: "Abierta" });
                        }}
                        type="button"
                      >
                        Abierta
                      </button>
                    </div>
                  </div>
                  <div className="offer-type-container">
                    <span>Estado:</span>
                    <div className="offer-options">
                      <button
                        className={`offer-button ${curso.estado?.toLowerCase() === "activo" ? "active" : ""}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurso({ ...curso, estado: "Activo" });
                        }}
                        type="button"
                      >
                        Activo
                      </button>
                      <button
                        className={`offer-button ${curso.estado?.toLowerCase() === "en oferta" ? "active" : ""}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurso({ ...curso, estado: "En oferta" });
                        }}
                        type="button"
                      >
                        En oferta
                      </button>
                    </div>
                  </div>
                  {/* Mostrar campo empresa solo si la oferta es Cerrada */}
                  {curso.tipo_oferta === "Cerrada" && (
                    <div className='containerInput_company'>
                      <label htmlFor="nit_company">Empresa</label>
                      {empresaSeleccionada ? (
                        <div className='empresa-seleccionada'>
                          <p className='nombre_empresaSeleccionada'>
                            {empresaSeleccionada.nombre_empresa}
                          </p>
                          <button
                            type="button"
                            className='buttonEditEmpresa'
                            onClick={() => {
                              setEmpresaSeleccionada(null);
                              setEmpresaNIT('');
                              setResultadosEmpresa([]);
                              setShowResultados(false);
                            }}
                          >
                            <img src={buttonEdit} alt="Editar empresa" style={{ width: 20, height: 20 }} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <input
                            id='nit_company'
                            type="text"
                            placeholder='NIT de la empresa'
                            value={empresaNIT}
                            onChange={(e) => {
                              setEmpresaNIT(e.target.value);
                              setShowResultados(true);
                            }}
                            autoComplete="off"
                          />
                          {empresaNIT.trim() !== '' && (
                            <ul className="resultados-empresa">
                              {showResultados && resultadosEmpresa.length > 0 ? (
                                resultadosEmpresa.map((empresa) => (
                                  <li
                                    key={empresa.ID}
                                    onClick={() => {
                                      setEmpresaSeleccionada(empresa);
                                      setEmpresaNIT('');
                                      setShowResultados(false);
                                    }}
                                  >
                                    {empresa.nombre_empresa}
                                  </li>
                                ))
                              ) : (
                                <li style={{ color: '#d32f2f' }}>No hay resultados</li>
                              )}
                            </ul>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <p id='p_addInstructor'>

                    Instructor: {curso?.Instructor ? `${curso.Instructor.nombres} ${curso.Instructor.apellidos}` : "Sin asignar"}
                    <button
                      className='addInstructor'
                      type="button"
                      onClick={() => setShowAssignModal(true)}
                    >
                      <img src={buttonEdit} alt="Invitar instructor" />

                    </button>

                  </p>
                  {showAssignModal && (
                    <AssignInstructorCourse
                      curso_ID={curso?.ID || id}
                      onClose={() => setShowAssignModal(false)}
                    />
                  )}
                  <button
                    className="addDate"
                    type="button"
                    onClick={() => setIsEditCalendarOpen(true)}
                  >
                    <img src={calendar} alt="" />
                    Editar fechas y horarios
                  </button>


                </div>
              </div>

              <button
                className="buttonCreate_Course"
                onClick={handleUpdateCourse}
              >
                Actualizar curso
              </button>
            </div>
          </div>
        </div>
      </Main>
      <Footer />
      {isEditCalendarOpen && (
        <EditCalendar
          show={isEditCalendarOpen}
          closeModal={() => setIsEditCalendarOpen(false)}
          onSave={handleCalendarSave}
          initialData={calendarData}
        />
      )}
    </>
  );
};