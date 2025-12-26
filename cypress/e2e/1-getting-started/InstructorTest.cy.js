describe("Prueba instructor", () => {
  // Limpiar sesiones antes de todas las pruebas
before(() => {
  Cypress.session.clearAllSavedSessions();
});

// Función para iniciar sesión como instructor
const loginInstructor = () => {
  cy.visit('http://localhost:5173/');
  cy.get('.button_signIn').first().click({ force: true });
  
  // Ingresar credenciales del rol instructor
  cy.get('input[type="email"]').first()
    .type('icn0ybaowh@zudpck.com');
  cy.get('input[type="password"]')
    .type('Prueba1234*');
    
  // Iniciar sesión
  cy.get('.button_register').click({ force: true });
  
  // Esperar a que la redirección se complete
  cy.url().should('include', 'http://localhost:5173/');
};

// Configuración de la sesión antes de cada prueba
beforeEach(() => {
  cy.session('instructor', loginInstructor, {
    validate: () => {
      // Verificar que la sesión sigue activa
      cy.visit('http://localhost:5173/');
      // Verificar que estamos autenticados
      cy.get('.container_options_profile').should('exist');
      
      // Volver a la página principal para no interferir con las pruebas
      cy.visit('http://localhost:5173/');
    },
    cacheAcrossSpecs: false
  });
  
  // Visitar la página después de restaurar la sesión
  cy.visit('http://localhost:5173/');
});

  it.skip("Seleccionar el modulo de cursos y ver mis cursos", () => {
    cy.visit("http://localhost:5173/Cursos/MisCursosAsignados");
    
    //Entrar a un curso asignado
    cy.get('.course-card-carousel').click({force : true});
  });

  it.skip('Buscar Cursos', () => {
    cy.visit("http://localhost:5173/Cursos/BuscarCursos") 
        
        //Usar Filtros de Buscar Cursos
        //Primer filtro - Estado
        cy.get('.filter-select').eq(0).select('Activo').wait(1000)

        // Segundo filtro - Oferta  
       cy.get('.filter-group select').eq(1).select('cerrada').wait(1000)
       cy.get('.filter-group select').eq(0).select('En oferta').wait(1000)

        //Tercer Filtro
        cy.get('.search-input').get('input[placeholder="¿Qué curso estás buscando?"]').type('Analisis y Desarrollo de Software')
  });

  it.skip('buscar un curso y ver detalles', () => {
    cy.visit('http://localhost:5173/Cursos/2')

    //Ver Material del curso
    cy.contains('Ver Material').click()
    cy.get('.btn-back').click()
    
    //Ver los horarios del curso
    cy.contains('Ver Horarios').click()
    cy.get('.close-btn-view').click()
    
    //Ver las actividades del curso
    cy.contains('Ver Actividades').click()
    cy.get('.btn-outline').click()
  });

  it.skip('Gestionar Asistencias', () => {
    cy.visit('http://localhost:5173/Cursos/2')
    //Ir a la sección de asistencias
    cy.contains('button', 'Gestionar Asistencias').click()

    cy.get('.calendar-day').contains('26').click()

    //Agregar Asistencia
    // cy.get('.option-card-attendance ').first().click({force : true})
    // cy.get('.back-btn-attendance').click({force : true})

    //Actualizar Asistencia
//     cy.get('.option-card-attendance ').eq(1).click({force : true})
//     cy.get('.back-btn-attendance').click({force : true})

    //Consultar Asistencia
    cy.get('.option-card-attendance ').eq(2).click({force : true})
})

  it.skip('Crear Actividad',()=>{
    cy.visit('http://localhost:5173/Cursos/2/actividades')

    //Crear nueva actividad
    cy.get('.btn-primary').contains('button','Nueva actividad').click({force : true})

    //Llenar formulario de nueva actividad
    cy.get('input[placeholder="Ej: Taller de cierre"]').type('Actividad de Prueba Automatizada')
    cy.get('textarea[placeholder="Describe las instrucciones, criterios y alcance de la actividad."]').type('Descripción de la actividad de prueba automatizada')
    cy.get('input[type="datetime-local"]').type('2025-12-31T23:59');

    //Guardar actividad
    cy.contains('button','Crear actividad').click({force : true})
  })

  it.skip('Ver y crear material de apoyo', () => {
    cy.visit("http://localhost:5173/SupportMaterial") 
       
        // Seleccionar el primer curso de la lista
        cy.get('.support-cursos-grid').get('.support-curso-card').first().click({force : true})
        cy.get('.support-create-btn.outline').click({force:true})

        /// Obtener los botones de opciones
        cy.get('.type-option-support').should('have.length', 3);

        // Recorrer las tres opciones
        const opciones = ['PDF', 'Video', 'Enlace'];

        opciones.forEach((opcion, index) => {
        // Solo hacer clic y verificar texto
        cy.get('.type-option-support').eq(index)
            .click()
            .should('contain', opcion);
        });

        // Solo en la última opción (Enlace) hacer las acciones adicionales
        cy.get('.type-option-support').eq(2).click(); // Asegurar que Enlace está seleccionado
        cy.get('.link-input-support').type('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        cy.get('.add-link-btn-support').contains('button', 'Agregar').click({force:true});
        cy.contains('button', 'Crear Material').click({force:true});
        cy.contains('button', 'Perfecto').click({force:true});

        // Resto de acciones
        cy.get('.action-btn.edit-btn').first().click({ force: true });
        cy.get('.support-material-input').clear().type('https://www.youtube.com/watch?v=vOzHbrYHpQ0&list=RDvOzHbrYHpQ0&start_radio=1').click();
        cy.get('.action-btn.save-btn').contains('button', 'Guardar').click({ force: true });
        cy.get('.swal2-confirm.centered-swal-button.swal2-styled').contains('button','Entendido').click({ force: true });
        cy.get('.action-btn.delete-btn').first().click({ force: true });
        cy.get('.swal2-confirm.centered-swal-button.swal2-styled').click({ force: true });
  });

  it.skip('Criterios de Certificación', () => {
    cy.visit("http://localhost:5173/Gestiones/Criterios") 
        
        //Ver criterios de un curso
        cy.get('.criteria-btn-improved.primary').contains('Ver Criterios').click({force: true});
        cy.get('.button.see-criteria-button').contains('button', 'Ver criterios').click({force:true})
        
        //Agregar Criterios
        cy.get('.actions-left').get('.btn-primary').click({force:true})
        cy.get('.criteria-title-input').type('Asistencias')
        cy.get('.type-selector-btn').click()
        cy.contains('button', 'Asistencias').click()
        cy.get('.detail-input-group').get('input[placeholder="0"]').first().clear({force:true}).type('80')
        cy.get('.detail-input-group').get('input[placeholder="0"]').eq(1).clear({force:true}).type('100')

        //Guardar Criterio
        cy.contains('button', 'Confirmar Selección').click({force:true})

        //Añadir descripción al criterio y guardar
        cy.get('.criteria-description').type('El participante debe cumplir con el 80% de asistencias para certificar el curso.')
        cy.contains('button', 'Guardar Criterio').click({force:true})
  });

  it.skip('Editar criterios de certificación', () => {
    cy.visit("http://localhost:5173/Gestiones/Criterios") 
       
        //Ver criterios de un curso
        cy.contains('button', 'Ver Criterios').first().click({force:true})
        cy.contains('button', 'Ver criterios del curso').first().click({force:true})
        cy.contains('button', 'Modo Edición').first().click({force:true})
        cy.get('textarea.editing-criteria-description').first().clear().type('Nueva descripción editada para el primer criterio')
        cy.get('.btn-primary').contains('button', 'Guardar Cambios').first().click({force:true})
  });

  it.skip('Filtrar criterios de certificación y descargar criterios', () => {
    cy.visit("http://localhost:5173/Gestiones/Criterios") 
       
        //Ver criterios de un curso
        cy.contains('button', 'Ver Criterios').first().click({force:true})
        cy.contains('button', 'Ver criterios').first().click({force:true})

        //Filtrar criterios
        cy.contains('button', 'Filtrar').click({force:true})
        cy.get('input[placeholder="Buscar por nombre..."]').first().type('awegerwherHERH')
        cy.get('.btn-primary').contains('button', 'Aplicar Filtros').click({force:true})
        cy.contains('button', 'Filtrar').click({force:true})
        cy.contains('button', 'Reporte').click({force:true})
  });


  it.skip('Generar Actas', () => {
    cy.visit('http://localhost:5173/Gestiones/Actas')

    // Generar Acta
    cy.get('.generate-acta-btn').first().click({ force: true });

    // Seleccionar Acta
    cy.get('.modal-acta-type-content').contains('Concertación').click({ force: true });

    // Editar Acta
    cy.get('.botones-solicitud-proceedings').find('button[id="editar1"]').click({ force: true });

    // Rellenar campos del acta
    cy.get('.input-solicitud-proceedings').get('input[placeholder="Nombre de la entidad"]').type('Entidad de Prueba');
    cy.get('.input-solicitud-proceedings').get('input[placeholder="Ciudad"]').type('Armenia');
    cy.get('.input-solicitud-proceedings').get('input[placeholder="Sede, modalidad"]').type('Virtual');
    cy.get('.input-solicitud-proceedings').get('input[placeholder="Nombre del coordinador académico"]').type('Rodolfo Pérez');
    cy.contains('button', '+ Agregar instructor').click({ force: true });
    cy.get('.input-solicitud-proceedings').get('input[placeholder="Nombre del instructor participante"]').type('Antonio Gómez');
    cy.get('.input-solicitud-proceedings').get('input[placeholder="Nombre del curso"]').type('Gestión de Proyectos');
    cy.get('.input-solicitud-proceedings').get('input[placeholder="Nombre instructor asignado"]').type('Patricia Ramírez');

    // Ingresar Fechas
    cy.get('.input-solicitud-date-proceedings').first().type('2025-10-29');
    cy.get('.input-solicitud-date-proceedings').eq(1).type('2025-10-30');

    // Ingresar Horas
    cy.get('.input-solicitud-time-proceedings').first().type('08:00');
    cy.get('.input-solicitud-time-proceedings').eq(1).type('13:00');

    // Seleccionar Modalidad
    cy.get('.input-solicitud-select-proceedings').select('Virtual');

    // Agregar Participantes
    cy.contains('button', '+ Agregar participante').click();
    cy.get('.input-solicitud-proceedings').get('input[placeholder="Nombre participante"]').type('Laura Martínez');

    // Seguir con el resto de campos
    cy.get('.textarea-proceedings').first().clear().type('Nuevas notas relevantes para el curso.');
    cy.get('.textarea-proceedings').eq(1).clear().type('Condiciones especiales actualizadas:{enter}• Sala virtual para 3 personas{enter}• Material 48 horas antes');

    // Agregar firmas
    const personas = ['Patricia Ramírez', 'Rodolfo Pérez', 'Antonio Gómez', 'Laura Martínez'];

    personas.forEach(persona => {
      cy.contains('td', persona).parent('tr').within(() => {
        cy.contains('button', 'Agregar firma').click();
      });
      cy.wait(5000);
      cy.get('.submit-button-proceedings-firmar').click();
      cy.wait(1000); // Esperar entre firmas
    });

    cy.get('.submit-button-proceedings').contains('button', 'Guardar').click({ force: true });
    cy.get('.submit-button-proceedings').contains('button', 'Generar acta').click({ force: true });
  });

  it.skip('Visualizar acta de concertación', () => {
    cy.visit('http://localhost:5173/Gestiones/Actas')

    // Visualizar Acta
    cy.get('.actas-grid').first().click({ force: true });
  });

  it.skip('generar acta de lugar de formación', () => {
    cy.visit('http://localhost:5173/Gestiones/Actas')

    // Generar Acta
    cy.get('.generate-acta-btn').first().click({ force: true });

    // Seleccionar Acta
    cy.get('.modal-acta-type-content').contains('Lugar de Formación').click({ force: true });

    // Editar Acta
    cy.get('.training-place-proceeding-submit-button').contains('button', 'Editar').click({ force: true });

    // Rellenar campos del acta
    cy.get('.training-place-proceeding-input').get('input[placeholder="Dirección completa del lugar"]').type('Calle 123 #45-67');
    cy.get('.training-place-proceeding-input').get('input[placeholder="Número de personas que puede albergar"]').type('15');
    cy.get('.training-place-proceeding-input').get('input[placeholder="Descripción de las instalaciones disponibles"]').type('Descripción');
    cy.contains('button', '+ Agregar').click();
    cy.get('.input-solicitud-proceedings').get('input[placeholder="Recurso disponible (ej. equipos, mobiliario, conectividad, etc.)"]').type('Computadores y proyector');

    cy.get('.training-place-proceeding-input').get('textarea[id="observaciones-inspeccion"]').type('Observaciones de prueba para el acta de lugar de formación.');
    cy.get('.training-place-proceeding-input').get('textarea[id="documentos-respaldo"]').type('Observaciones de prueba para el acta de lugar de formación.');
    cy.get('.training-place-proceeding-input').get('input[placeholder="Nombre del Inspector"]').type('Edgar Hincapié');

    // Agregar firma
    cy.contains('button', 'Agregar firma').click();
    cy.wait(5000);
    cy.get('.submit-button-proceedings-firmar').click();
    cy.wait(1000);

    // Guardar y Generar Acta
    cy.get('.training-place-proceeding-submit-button').contains('button', 'Guardar').click({ force: true });
    cy.get('.training-place-proceeding-submit-button').contains('button', 'Generar acta').click({ force: true });
  });


  it.skip('Cerrar sesión instructor', () => {
    // Cerrar sesión
    cy.get('.container_options_profile').find('img[alt="Cerrar sesión"]').first().click({ force: true });

    // Verificar que se cerró la sesión
    cy.get('.button_signIn').should('exist');
  });
});