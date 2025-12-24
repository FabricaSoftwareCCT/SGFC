describe('Prueba Modulo Aprendiz', () => {
  // Limpiar sesiones antes de todas las pruebas
  before(() => {
    Cypress.session.clearAllSavedSessions();
  });

  // Función para iniciar sesión como gestor
  const loginGestor= () => {
    cy.visit('http://localhost:5173/');
    cy.get('.button_signIn').first().click({ force: true });
    
    // Ingresar credenciales del rol gestor
    cy.get('input[type="email"]').first()
      .type('natifo2396@gamintor.com');
    cy.get('input[type="password"]')
      .type('d7F=!+g)');
      
    // Iniciar sesión
    cy.get('.button_register').click();

    // Opcional: Completar formulario de perfil si es necesario
    cy.url().then((url) => {
      if (url.includes('/profile') || url.includes('/perfil')) {
        cy.get('.container_profile').find('input[name="nombres"]').type('Jawix');
        cy.get('.container_profile').find('input[name="apellidos"]').type('Avila');
        cy.get('.container_profile').find('input[name="celular"]').type('3124567890');
        cy.get('.updateProfile1').click();
      }
    });
    
    // Esperar a que la redirección se complete
    cy.url().should('include', 'http://localhost:5173/');
  };

  // Configuración de la sesión antes de cada prueba
  beforeEach(() => {
    cy.session('gestor', loginGestor, {
      validate: () => {
        // Verificar que la sesión sigue activa
        cy.visit('http://localhost:5173/');
        // Verificar que estamos autenticados (puedes ajustar esto según tu app)
        cy.get('.container_options_profile').should('exist');
        
        // Volver a la página principal para no interferir con las pruebas
        cy.visit('http://localhost:5173/');
      },
      cacheAcrossSpecs: false // Mantener sesión entre archivos de prueba
    });
    
    // Visitar la página después de restaurar la sesión
    cy.visit('http://localhost:5173/');
  });

    it.skip("Buscar Cursos", ()=>{
        cy.visit("http://localhost:5173/Cursos/BuscarCursos") 
        cy.get('.search-input-container').find('input[placeholder="¿Qué curso estás buscando?"]').type('Analisis y Desarrollo de Software');

        cy.get('.filter-select').eq(1).select('Cerrada').wait(1000);
        cy.get('.filter-select').eq(0).select('En oferta').wait(1000);
    })
        
        

    it.skip("Crear Curso",()=>{
        cy.visit("http://localhost:5173/Cursos/CrearCurso") 
        cy.get('.ficha-container').find('input[placeholder="000000"]').type('2825020')
    cy.contains('label', 'Nombre del Curso').parent('.form-group').find('input').type('Gestión de Bases de Dtos', { force: true });

    const description = 'A'.repeat(100);
    cy.get('textarea[placeholder="Describe el curso en detalle (mínimo 100 caracteres)"]').type(description);       

    cy.contains('button', 'En Oferta').click()
    cy.contains('button', 'Abierta').click()

    cy.get('.info-item').find('input[placeholder="Número de días"]').clear().type('20')
    cy.get('.info-item').find('input[placeholder="Sena Agropecuario"]').type('Virtual')

    cy.get('.schedule-btn').first().click()

    cy.get('.date-input-wrapper').find('input[type="date"]').eq(0).type('2026-01-20')
    cy.get('.date-input-wrapper').find('input[type="date"]').last().type('2026-02-24')
    
    const selectTimeSlot = (time, day) => {
        const timeSlots = {
            '06:00': 1, '07:00': 2, '08:00': 3, '09:00': 4, '10:00': 5,
            '11:00': 6, '12:00': 7, '13:00': 8, '14:00': 9, '15:00': 10,
            '16:00': 11, '17:00': 12, '18:00': 13
        }
        
        const days = {
            'Lun': 1, 'Mar': 2, 'Mié': 3, 'Jue': 4, 'Vie': 5, 'Sáb': 6
        }
        
        cy.get('.schedule-section-calendar')
            .find('table tbody tr').eq(timeSlots[time])
            .find('td').eq(days[day])
            .click()
    }

    cy.get('.schedule-section-calendar').then(($section) => {
        const hasTable = $section.find('table').length > 0;
        
        if (hasTable) {
            selectTimeSlot('08:00', 'Lun') 
            selectTimeSlot('08:00', 'Mar') 
            selectTimeSlot('14:00', 'Mié')
        } else {
            cy.get('.schedule-section-calendar').find('*').then(($elements) => {
                const plusElements = $elements.filter((index, el) => {
                    return el.textContent && el.textContent.trim() === '+';
                });
                
                if (plusElements.length >= 3) {
                    cy.wrap(plusElements[0]).click({ force: true });
                    cy.wrap(plusElements[1]).click({ force: true });
                    cy.wrap(plusElements[2]).click({ force: true });
                }
            });
        }
    });

    cy.wait(500);
    
    cy.contains('button','Guardar Horarios').click()
    
    cy.contains('Temario del Curso').parent().find('input[type="date"]').type('2026-11-11');

    cy.get('textarea[placeholder*="Agregar nuevo tema"]').type('Introducción al curso');
    cy.contains('button','+').click()

    cy.contains('button','Crear Curso').click()
    
    })



    it.skip('Revisar la sección de Material de Apoyo',()=>{
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
    })

    

    it.skip('Filtrar criterios de certificación y descargar criterios',()=>{
        cy.visit("http://localhost:5173/") 
        

         //Ver criterios de un curso
        cy.contains('button', 'Ver criterios').first().click({force:true})
        cy.contains('button', 'Ver criterios').first().click({force:true})

        //Filtrar criterios
        cy.contains('button', 'Filtrar').click({force:true})
        cy.get('input[placeholder="Nombre..."]').first().type('Asistencias')
        cy.get('button[id="filtrar-button"').click({force:true})
        cy.contains('button', 'Filtrar').click({force:true})
        cy.contains('button', 'Descargar').click({force:true})

        //Generar Reporte
        cy.get('.modal-background').contains('button', 'Generar reporte').click({force:true})
        cy.get('.modal-background').contains('a', 'Descargar').click({force:true})
    })

    it.skip('Ingresar a un curso y editar su información', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales con el rol de gestor
        cy.get('input[type="email"]').first()
            .type('royib51906@filipx.com')
        cy.get('input[type="password"]')
            .type('GGX}Jh5i')
       
         //Iniciar sesión
        cy.get(".button_register").click({force:true})

        //dar click a los cursos
        cy.get('.container_options').find('.courses-menu').contains('button', 'Cursos').first().click({force : true})

        //Entrar a los cursos
        cy.get('.courses-menu').find('.dropdown-courses').contains('button','Mis cursos').first().click({force:true})
        cy.get('.cursos-list-container').get('.ver-curso').first().click({force:true})
        cy.get('.edit-btn').click()

        const descripcion = 'A'.repeat(300)
        cy.get('.container_createCourse')
        .find('.containerInput_description_course')
        .find('textarea[placeholder="Agregar descripción del curso (mínimo 300 caracteres)"]')
        .clear()
        .should('have.value', '')  // Verifica que esté vacío
        .type(descripcion)
        .should('have.value', descripcion)  // Verifica que se haya escrito

        cy.get('.buttonCreate_Course').contains('Actualizar curso').click();


    })

    it.skip('Ir a la sección de Gestiones(Crear Instructor)', ()=>{
        cy.visit("http://localhost:5173/Gestiones/Instructor") 
        
        //Agregar Instructor
        cy.contains('button','Agregar Instructor').click()
        
        //Llenar datos del instructor
        cy.get('.input-field-create').eq(0).type('Joan');      // Nombres
        cy.get('.input-field-create').eq(1).type('Pérez');     // Apellidos
        cy.get('.input-field-create').eq(2).type('1234567890'); // Cédula
        cy.get('.input-field-create').eq(3).type('Ingeniero de Software'); // Título
        cy.get('.input-field-create').eq(4).type('3001234567'); // Celular
        cy.get('.input-field-create').eq(5).type('joan.perez@example.com'); // Email
        cy.contains('button','Activo').first().click({force:true}) // Estado
        cy.contains('button', 'Crear Instructor').click({force:true}) // Guardar Instructor
    })

     it.skip('Buscar Instructor y Modificar perfil Instructor', ()=>{
        cy.visit("http://localhost:5173/Gestiones/Instructor") 
       
        cy.get('.search-input').get('input[placeholder="Buscar instructor..."]').type('joan')

        //Ver pefil de un instructor y Editar
        cy.get('.view-profile-btn-improved').first().click({force:true})
        cy.get('.submit-btn-update').contains('button', 'Editar Perfil').click()

        //Modificar datos del instructor
        cy.get('.form-grid-update input[name="nombres"]').clear({ force: true }).type('Joan Esteban', { force: true });
        cy.contains('button','Guardar Cambios').click()
    })


     it.skip('asignar un curso a un instructor desde gestionar instructores',()=>{
        cy.visit("http://localhost:5173/Gestiones/Instructor") 
        
        cy.contains('button', 'Ver Perfil Completo').click()
        cy.contains('button', 'Gestionar Cursos').click()
        cy.get('.search-row').find('input[placeholder="Buscar por nombre o ficha"]').type('python')
        cy.contains('button','Asignar').first().click()
    })

    it.skip('Eliminar un curso asignado desde gestionar instructores',()=>{
        cy.visit("http://localhost:5173/Gestiones/Instructor") 
        
        cy.contains('button', 'Ver Perfil Completo').click()
        cy.contains('button', 'Gestionar Cursos').click()
        cy.get('.asignado-item').contains('button', 'Eliminar').click()
        cy.contains('button','Sí, eliminar').click()
    })

   it.skip('Modulo de Criterios de Certificación',()=>{
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
    })

    it.skip('modificar y eliminar criterio de certificación',()=>{
        cy.visit("http://localhost:5173/Gestiones/Criterios") 
       
        //Ver criterios de un curso
        cy.contains('button', 'Ver Criterios').first().click({force:true})
        cy.contains('button', 'Ver criterios del curso').first().click({force:true})
        cy.contains('button', 'Modo Edición').first().click({force:true})
        cy.get('textarea.editing-criteria-description').first().clear().type('Nueva descripción editada para el primer criterio')
        cy.get('.btn-primary').contains('button', 'Guardar Cambios').first().click({force:true})
    })

    it.skip('Filtrado de Criterios de Certificación',()=>{
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
    })

    it.skip('Gestión de Empleados', ()=>{
        cy.visit("http://localhost:5173/Empleados/MisEmpleados") 
       
        //Agregar Empleado
        cy.get('.create-employee-btn-improved').click()
        cy.get('.form-grid-create-employe').find('input[name="nombres"]').first().type('Samuel')
        cy.get('.form-grid-create-employe input[name="apellidos"]').first().type('Herrera')
        // Dentro del contenedor específico
        cy.get('.input-field-create-employe').get('select[name="tipoDocumento"]').select('TarjetaIdentidad', { force: true });
        cy.get('.form-grid-create-employe').find('input[name="cedula"]').type(92836422)
        cy.get('.form-grid-create-employe').find('input[name="celular"]').first().type(3234367956)
        cy.get('.form-grid-create-employe').find('input[name="email"]').first().type('samuh679@nrlord.com')
        cy.get('.input-field-create-employe').get('select[name="empresaId"]').select('Mactech', { force: true });
        cy.contains('button', 'Activo').first().click({force:true})
        cy.contains('button', 'Crear Empleado').click({force:true})

        
    })

    it.skip('Editar Empleado', ()=>{
        cy.visit("http://localhost:5173/Empleados/MisEmpleados") 
       
        //Actualizar información del empleado
        cy.get('.profile-btn-improved').first().click({force:true})
        cy.get('.submit-btn-employe').first().click({force:true})
        cy.get('.form-grid-employe').find('input[name="nombres"]').clear().first().type('San Martin')
        cy.get('.form-grid-employe').find('input[name="apellidos"]').clear().type('De Napolés')
        cy.get('.form-grid-employe').find('input[name="documento"]').clear().type(45567867)
        cy.contains('button', 'Guardar Cambios').click({force:true})

    })

    it.skip('Reportes y estadisticas',()=>{
        cy.visit("http://localhost:5173/GestionReporteEstadisticas/ReporteEstadisticas") 

        //Ingresar a un curso
        cy.get('.re-action-button').first().click({force:true})

        //Generar reporte de estudiantes
        cy.contains('button','Generar reporte')

        //Eficiencia
        cy.get('.button-eficiencia-estudiantes').click()
        cy.contains('button','Generar reporte').clock()
    })

    it.skip('Asistencias y Progreso de Estudiantes',()=>{
        cy.visit("http://localhost:5173/reportes/asistencia-progreso")

        //Filtrar por aprendiz
        cy.get('select').first().select('3')

        //Generar reporte
        cy.contains('button','Generar reporte').click()

        //Descargar reporte
        cy.contains('button','Descargar PDF').click({force:true})
     
    })

   it.skip('cerrar sesión como gestor', ()=>{
       cy.visit("http://localhost:5173/") 

        //Cerrar sesión
        cy.get('.svg-inline--fa.fa-right-from-bracket').first().click({force : true})
   })

})
    



        



