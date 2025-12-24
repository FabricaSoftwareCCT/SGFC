describe('Prueba Modulo Aprendiz', () => {
  // Limpiar sesiones antes de todas las pruebas
  before(() => {
    Cypress.session.clearAllSavedSessions();
  });

  // Función para iniciar sesión como aprendiz
  const loginAprendiz = () => {
    cy.visit('http://localhost:5173/');
    cy.get('.button_signIn').first().click({ force: true });
    
    // Ingresar credenciales del rol Aprendiz
    cy.get('input[type="email"]').first()
      .type('fakewo8113@arugy.com');
    cy.get('input[type="password"]')
      .type('Prueba1234*');
      
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
    cy.session('aprendiz', loginAprendiz, {
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

  it.skip('visitar la pagina y registrarse como aprendiz', () => {
    cy.visit("http://localhost:5173/") 
    cy.get(".button_signIn").first().click({force : true})

    //Registro aprendiz
    cy.get('.goTo_register').click()
    cy.get('.container_AccountTypeAprendiz').first().click({force : true})
    cy.get('.form_register').first()
    cy.get('.form_register').first().find('input[type="email"]').first().type('fakewo8113@arugy.com')
    cy.get('.password-container').first().find('input[type="password"]').first().type('Prueba1234*')
    cy.get('.confirmPassword-container').first().find('input[type="password"]').first().type('Prueba1234*')
    cy.get('.button_register').first().click({force : true})
  })

  it.skip("Iniciar sesion como aprendiz", () => {
    // La sesión ya está iniciada por el beforeEach
    // Solo verificamos que estamos en la página principal
    cy.url().should('include', 'http://localhost:5173/');
  })

  it.skip("Ingresar al modulo de cursos como aprendiz", () => {
    // La sesión ya está iniciada, vamos directamente a cursos
    cy.visit("http://localhost:5173/Cursos/MisCursosAsignados");
    
    //Entrar a un curso asignado
    cy.get('.course-card-carousel').click({force : true});
    
    //Ver los horarios del curso
    cy.contains('Ver Horarios').click()
    cy.get('.close-btn-view').click()
    
    //Ver las actividades del curso
    cy.contains('Ver Actividades').click()
    cy.get('.btn-outline').click()
    
    //Entregar actividad
    cy.get('.btn-primary.btn-primary--loud').click()
    cy.get('.file-input').click()
    
    //Añadir comentarios a la entrega
    cy.get('.form-field').find('textarea[placeholder="Añade notas relevantes a tu entrega..."]').type('AAAAAAAAAAAAAA')
    
    //Enviar Entrega
    //cy.contains('button', 'Guardar entrega').click()
    
    cy.contains('button','Cancelar').click()
    
    //Regresar a las actividades
    cy.contains('button','Volver a actividades').click()
    
    //Regresar al curso
    cy.contains('button','Volver al curso').click()
    
    
  })

  it.skip('Buscar cursos como aprendiz', () => {
    // Visitar directamente la página de búsqueda de cursos
    cy.visit("http://localhost:5173/Cursos/BuscarCursos");
    
    //Usar Filtros de Buscar Cursos
    cy.get('.search-input-container').find('input[placeholder="¿Qué curso estás buscando?"]').type('Analisis y Desarrollo de Software');

    cy.get('.filter-select').eq(1).select('Cerrada').wait(1000);
    cy.get('.filter-select').eq(0).select('En oferta').wait(1000);

  
  })

  it.skip('cerrar sesión como aprendiz', () => {
    // Cerrar sesión
    cy.get('.svg-inline--fa.fa-right-from-bracket').first().click({force : true});
    
    // Verificar que hemos cerrado sesión
    cy.url().should('include', 'http://localhost:5173/');
    cy.get('.button_signIn').should('exist');
  });
});