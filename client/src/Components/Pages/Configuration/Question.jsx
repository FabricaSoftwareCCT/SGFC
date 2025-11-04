import React, { useState } from 'react';
import Swal from 'sweetalert2';
import './Question.css';
import 'sweetalert2/themes/bulma.css'

const Question = () => {
  // Estado inicial: ya tiene una pregunta guardada (como en la imagen)
  const [hasQuestion, setHasQuestion] = useState(true);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  const handleSave = () => {
    if (newQuestion.trim() && newAnswer.trim()) {
      setQuestion(newQuestion);
      setAnswer(newAnswer);
      setHasQuestion(true);
      setIsEditing(false);
      setNewQuestion('');
      setNewAnswer('');
      
      // Mostrar alerta de éxito
      Swal.fire({
        title: '¡Éxito!',
        text: 'Pregunta de seguridad guardada correctamente',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#01873d',
        theme: 'bulma',
        timer: 3000,
        timerProgressBar: true,
        customClass: {
          actions: 'swal2-center-actions'
        }
      });
    } else {
      // Mostrar alerta de error si los campos están vacíos
      Swal.fire({
        title: 'Error',
        text: 'Por favor, completa tanto la pregunta como la respuesta',
        icon: 'error',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#d33',
        theme: 'bulma',
        customClass: {
          actions: 'swal2-center-actions'
        }
      });
    }
  };

  const handleCancel = () => {
    // Mostrar confirmación antes de cancelar si hay cambios
    if (newQuestion !== question || newAnswer !== answer) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: 'Los cambios no guardados se perderán',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'Continuar editando',
        theme: 'bulma',
        customClass: {
          actions: 'swal2-center-actions'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          setIsEditing(false);
          setNewQuestion('');
          setNewAnswer('');
          Swal.fire({
            title: 'Cancelado',
            text: 'Los cambios no fueron guardados',
            icon: 'info',
            timer: 2000,
            timerProgressBar: true,
            theme: 'bulma',
            customClass: {
              actions: 'swal2-center-actions'
            }
          });
        }
      });
    } else {
      setIsEditing(false);
      setNewQuestion('');
      setNewAnswer('');
    }
  };

  const handleEdit = () => {
    setNewQuestion(question);
    setNewAnswer(answer);
    setIsEditing(true);
  };

  return (
    <div className="question-container">
      <div className="question-header">
        <h1>Pregunta de <span>seguridad</span></h1>
        <p className="question-subtitle">Pregunta de seguridad de SGFC</p>
      </div>

      <div className="divider"></div>

      <div className="question-content">
        <div className="question-section">
          <h2>Agrega una pregunta de seguridad</h2>
          
          {/* Estado: Ya tiene pregunta guardada (como en la imagen) */}
          {hasQuestion && !isEditing && (
            <div className="question-display">
              <div className="info-display">
                <div className="display-group">
                  <span className="display-label">Pregunta:</span>
                  <span className="display-value">{question}</span>
                </div>
                
                <div className="display-group">
                  <span className="display-label">Respuesta:</span>
                  <span className="display-value">{answer}</span>
                </div>
              </div>

              <div className="button-group-single">
                <button className="btn-edit" onClick={handleEdit}>
                  Editar
                </button>
              </div>
            </div>
          )}

          {/* Estado: Modo edición (aparece cuando hace clic en Editar) */}
          {isEditing && (
            <div className="question-form edit-mode">
              <div className="form-group">
                <label className="form-label">Pregunta:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ingrese una pregunta..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Respuesta:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ingrese una respuesta..."
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                />
              </div>

              <div className="button-group">
                <button className="btn-save" onClick={handleSave}>
                  Guardar
                </button>
                <button className="btn-cancel" onClick={handleCancel}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Estado: No tiene pregunta guardada (solo aparece si no hay pregunta) */}
          {!hasQuestion && !isEditing && (
            <div className="question-form">
              <div className="form-group">
                <label className="form-label">Pregunta:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ingrese una pregunta..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Respuesta:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ingrese una respuesta..."
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                />
              </div>

              <div className="button-group">
                <button className="btn-save" onClick={handleSave}>
                  Guardar
                </button>
                <button className="btn-cancel" onClick={handleCancel}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Question;