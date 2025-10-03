import React, { useRef, useState, useEffect } from 'react';
import './CreateCourse.css';
import { Footer } from '../../../Layouts/Footer/Footer';
import { Main } from '../../../Layouts/Main/Main';
import { Modal_General } from '../../../UI/Modal_General/Modal_General';
import EditCalendar from '../../../UI/Modal_Calendar/EditCalendar/EditCalendar';
import addIMG from '../../../../assets/Icons/addImg.png';
import buttonEdit from '../../../../assets/Icons/buttonEdit.png';
import calendar from '../../../../assets/Icons/calendar.png';
import imgDefectCourse from '../../../../assets/Icons/picDefectCourse.png';
import axiosInstance from '../../../../config/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { AssignInstructorCourse } from '../AssignInstructorCourse/AssignInstructorCourse';
import debounce from 'lodash.debounce';

export const CreateCourse = ( ) => {
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [selected, setSelected] = useState('Cerrada');
  const [selectedStatus, setSelectedStatus] = useState('En oferta');
  const [ficha, setFicha] = useState('');
  const [nombreCurso, setNombreCurso] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [instructor_ID, setInstructor_ID] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [empresaNIT, setEmpresaNIT] = useState('');
  const [resultadosEmpresa, setResultadosEmpresa] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [showResultados, setShowResultados] = useState(false);

  // New state for calendar data
  const [calendarData, setCalendarData] = useState({
    startDate: "",
    endDate: "",
    selectedSlots: [],
  });

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Función para abrir el modal general
  const [isEditCalendarOpen, setIsEditCalendarOpen] = React.useState(false);

  const showModalGeneral = () => {
    setIsEditCalendarOpen(true);
  };

  // Callback to receive calendar data from EditCalendar
  const handleCalendarSave = (data) => {
    setCalendarData(data);
    setIsEditCalendarOpen(false);
  };

  const handleAssignInstructor = (instructorId) => {
    setInstructor_ID(instructorId);
    setShowAssignModal(false);
  };

  // Función para manejar la creación del curso
  const handleCreateCourse = async () => {
    if (!ficha || !nombreCurso || !descripcion || !selected || !selectedStatus) {
      alert("Por favor, completa todos los campos requeridos.");
      return;
    }

    // Validar que ficha sea un número
    if (isNaN(Number(ficha))) {
      alert("El campo ficha debe ser un número.");
      return;
    }

    // Validar longitud mínima de la descripción
    if (descripcion.length < 300) {
      alert("La descripción debe tener mínimo 300 caracteres.");
      return;
    }

    // Validar que se hayan seleccionado fechas y horarios
    if (!calendarData.startDate || !calendarData.endDate || calendarData.selectedSlots.length === 0) {
      alert("Por favor, selecciona las fechas y horarios del curso.");
      return;
    }

    try {
      const formData = new FormData();
      // Agrega el campo empresa_NIT al formData si hay empresa seleccionada
      if (empresaSeleccionada) {
        formData.append("empresa_ID", empresaSeleccionada.ID); // usa el nombre exacto del campo
      }

      formData.append("ficha", ficha);
      // Enviar el nombre del curso en mayúsculas
      formData.append("nombre_curso", nombreCurso.toUpperCase());
      formData.append("descripcion", descripcion);
      formData.append("tipo_oferta", selected);
      formData.append("estado", selectedStatus);
      formData.append("fecha_inicio", calendarData.startDate);
      formData.append("fecha_fin", calendarData.endDate);

      // Procesar los slots para obtener horarios y días
      const slotsByDay = {};
      calendarData.selectedSlots.forEach(slot => {
        const [dia, hora] = slot.split('-');
        if (!slotsByDay[dia]) {
          slotsByDay[dia] = [];
        }
        slotsByDay[dia].push(hora);
      });

      // Obtener la primera hora de inicio y la última hora de fin
      let horaInicio = '23:59';
      let horaFin = '00:00';
      Object.values(slotsByDay).flat().forEach(hora => {
        if (hora < horaInicio) horaInicio = hora;
        if (hora > horaFin) horaFin = hora;
      });

      // Asegurarse de que las horas tengan el formato correcto (HH:mm)
      horaInicio = horaInicio.padStart(5, '0');
      horaFin = horaFin.padStart(5, '0');

      formData.append("hora_inicio", horaInicio);
      formData.append("hora_fin", horaFin);

      // Obtener los días únicos y asegurarse de que estén en formato completo
      const diasMapping = {
        'Lun': 'Lunes',
        'Mar': 'Martes',
        'Mié': 'Miércoles',
        'Jue': 'Jueves',
        'Vie': 'Viernes',
        'Sáb': 'Sábado'
      };
      const diasSemana = Object.keys(slotsByDay).map(dia => diasMapping[dia] || dia);
      formData.append("dias_formacion", JSON.stringify(diasSemana));

      // --- GUARDAR LOS SLOTS SELECCIONADOS ---
      formData.append("slots_formacion", JSON.stringify(calendarData.selectedSlots));

      // Imagen: si no se subió, usar la imagen por defecto
      if (fileInputRef.current.files[0]) {
        formData.append("imagen", fileInputRef.current.files[0]);
      } else {
        // Convertir la imagen por defecto a blob y agregarla al formData
        const response = await fetch(imgDefectCourse);
        const blob = await response.blob();
        formData.append("imagen", blob, "imgDefectCourse.png");
      }

      if (instructor_ID) {
        formData.append("instructor_ID", instructor_ID);
      }

      if (empresaSeleccionada) {
        formData.append("empresa_ID", empresaSeleccionada.ID);
      }

      const response = await axiosInstance.post("/api/courses/cursos", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Curso creado con éxito");  

      // Redirigir al usuario a la página del curso creado
      if (response.data.curso && response.data.curso.ID) {
        navigate('/Cursos/MisCursos');
      } 
      
    } catch (error) {
      console.error("Error al crear el curso:", error);
      if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert("Ocurrió un error al crear el curso");
      }
    }
  };

  // Función para buscar empresa por NIT
  const buscarEmpresaPorNIT = async (nit) => {
    if (!nit.trim()) {
      setResultadosEmpresa([]);
      return;
    }
    try {
      const response = await axiosInstance.get(`/api/users/empresa/${nit}`);
      setResultadosEmpresa([response.data]); // se espera una sola empresa activa
      setShowResultados(true);
    } catch (error) {
      setResultadosEmpresa([]);
      setShowResultados(false);
    }
  };

  // Debounce para evitar llamadas en cada tecla
  const debouncedBuscarEmpresa = useRef(debounce(buscarEmpresaPorNIT, 500)).current;

  useEffect(() => {
    debouncedBuscarEmpresa(empresaNIT);
    return () => {
      debouncedBuscarEmpresa.cancel();
    };
  }, [empresaNIT]);

  const handleSeleccionEmpresa = (empresa) => {
    setEmpresaSeleccionada(empresa);
    setEmpresaNIT(empresa.NIT);
    setShowResultados(false);
  };


  return (
    <>
      <Main>
        <div className="container_createCourse">
          <h2>
            Crear
            <span className="complementary"> Curso</span>
          </h2>

          <div className="containerInformation_CreateCourse">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleChange}
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

            <div className='containerDetails_course '>
              <input
                className='addName'
                type="text"
                placeholder='Agregar nombre del curso'
                value={nombreCurso}
                onChange={(e) => setNombreCurso(e.target.value)}
              />
              <div className='containerInput_description_course'>
                <textarea
                  className='addDetails'
                  placeholder='Agregar descripción del curso (mínimo 300 caracteres)'
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  minLength={300}
                  rows={6}
                  style={{ resize: "vertical", width: "99%" }}
                />
                <div
                  className={`descripcion-counter ${descripcion.length < 300 ? 'rojo' : 'verde'}`}
                >
                  {descripcion.length} / 300 caracteres
                </div>
              </div>

              <div className='containerDetails_course2'>
                <div>
                  {/* Campo Ficha - Siempre visible */}
                  <div className='containerInput_ficha'>
                    <label htmlFor="fichaCourse">Ficha: </label>
                    <input
                      className='input-field'
                      id='fichaCourse'
                      type="number"
                      placeholder='N° ficha'
                      value={ficha}
                      onChange={(e) => setFicha(e.target.value)}
                    />
                  </div>

                  <div className="offer-type-container">
                    <span>Tipo de oferta:</span>
                    <div className="offer-options">
                      <button
                        className={`offer-button ${selected === 'Cerrada' ? 'active' : ''}`}
                        onClick={() => setSelected('Cerrada')}
                        type="button"
                      >
                        Cerrada
                      </button>
                      <button
                        className={`offer-button ${selected === 'Abierta' ? 'active' : ''}`}
                        onClick={() => setSelected('Abierta')}
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
                        className={`offer-button ${selectedStatus === 'Activo' ? 'active' : ''}`}
                        onClick={() => setSelectedStatus('Activo')}
                        type="button"
                      >
                        Activo
                      </button>
                      <button
                        className={`offer-button ${selectedStatus === 'En oferta' ? 'active' : ''}`}
                        onClick={() => setSelectedStatus('En oferta')}
                        type="button"
                      >
                        En oferta
                      </button>
                    </div>
                  </div>
                  {/* Mostrar campo empresa solo si la oferta es Cerrada */}
                  {selected === 'Cerrada' && (
                    <div className='containerInput_company'>
                      <label htmlFor="nit_company">Empresa</label>
                      {empresaSeleccionada ? (
                        <div className='empresa-seleccionada'>
                          <p className='nombre_empresaSeleccionada'>{empresaSeleccionada.nombre_empresa}</p>
                          <button
                            type="button"
                            className='buttonEditEmpresa'
                            onClick={() => {
                              setEmpresaSeleccionada(null);
                              setEmpresaNIT('');
                              setShowResultados(false);
                            }}
                          >
                            <img src={buttonEdit} alt="Editar empresa" style={{ width: 20, height: 20 }} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <input
                            className='input-field'
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
                  {/* Botón para abrir el modal general */}
                  <button className='addDate' type="button" onClick={showModalGeneral}>
                    <img src={calendar} alt="" />
                    Agregar fechas y horarios
                  </button>
                </div>
              </div>

              {/* Botón para crear el curso */}
              <button className='buttonCreate_Course' type="button" onClick={handleCreateCourse}>
                Crear curso
              </button>
            </div>
          </div>
        </div>
      </Main>
      <Footer />
      {showAssignModal && (
        <AssignInstructorCourse
          curso_ID={null}
          onClose={() => setShowAssignModal(false)}
          onAssign={handleAssignInstructor}
        />
      )}

      {/* Edit Calendar Modal */}
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