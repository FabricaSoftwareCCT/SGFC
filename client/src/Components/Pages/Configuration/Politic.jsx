import React from 'react';
import './Politic.css';

const Politic = () => {
  // Función para manejar el clic en enlaces
  const handleLinkClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="politic-container">
      <div className="politic-header">
        <h1>Políticas y <span>Seguridad</span></h1>
        <p className="subtitle">Políticas y seguridad de SGFC</p>
      </div>

      <div className="politic-content">
        {/* Sección de Introducción */}
        <div className="politic-section">
          <h2>Introducción a nuestras políticas</h2>
          <div className="politic-article">
            <p>
              Apreciado usuario, el Sistema de Gestión de Formación Complementaria (SGFC) tiene como función la creación de cursos complementarios, para las empresas que lo soliciten.
            </p>
            <p>
              Las empresas podrán solicitar por medio de esta plataforma, cursos complementarios, para sus trabajadores, donde, dependiendo del curso que se solicite, los administradores o gestores podrán rechazar o aceptar la creación del mismo.
            </p>
            <p>
              Los cursos que solicita una empresa no tiene un coste, los cursos son gratuitos, si alguna persona o empresa, cobra por participar en los cursos, llame a la línea nacional de emergencia, 123, y denuncié o al Sena a través de 
              <span 
                className="link" 
                onClick={() => handleLinkClick('https://www.sena.edu.co')}
                style={{cursor: 'pointer', color: '#01873d', textDecoration: 'underline', margin: '0 4px'}}
              >
                www.sena.edu.co
              </span>.
            </p>
            <p>
              No se podrá usar la imágenes, logos, eslogan, foto, videos, animaciones, texto o material representativo de la institución Sena, para sacar benefició monetario o de publicidad, en caso de que ocurra, será demandado por violación de derecho de autor.
            </p>
          </div>
        </div>

        {/* Sección de Funciones */}
        <div className="politic-section">
          <h2>Nuestras funciones</h2>
          <div className="politic-article">
            <p>
              La función de SGFC, es ayudar a las empresas para que pueda especializar a sus empleados, por medio de cursos complementarios, que puede tener una duración de 6 meses como máximo, además, las empresas ditan donde se impartirán los cursos, puede ser en una Universidad, Sena, Colegio o un sitio adecuado para realizar dicho curso.
            </p>
            <p>
              El Sena proporciona a un instructor que imparta el curso, no puede decir ni donde y cuando se debe realizar dicho curso complementario, sin embargo, el instructor elige si está disponible o si acepta impartir la clase.
            </p>
          </div>
        </div>

        {/* Secciones originales manteniendo la estructura */}
        <div className="politic-section">
          <h2>Definición de Formación Complementaria</h2>
          <div className="politic-article">
            <p>
              Este es el artículo clave que define qué son los cursos complementarios.
            </p>
            <blockquote className="quote">
              "La Formación Complementaria es la oferta de formación del SENA, orientada a la adquisición y desarrollo de conocimientos, aptitudes y
              destrezas, para el desempeño de una función productiva, en un área específica, sin el nivel de profundidad de un programa de formación
              titulada. Su duración será hasta de seis (6) meses."
            </blockquote>
          </div>
        </div>

        <div className="politic-section">
          <h2>Modalidades de Formación</h2>
          <div className="politic-article">
            <p>
              Aquí se establece que los aprendices de formación complementaria están sujetos a las mismas normas.
            </p>
            <blockquote className="quote">
              "Los Aprendices de Formación Complementaria se regirán por las disposiciones establecidas en el presente Reglamento para la modalidad
              presencial o virtual, según corresponda."
            </blockquote>
          </div>
        </div>

        <div className="politic-section">
          <h2>Condiciones para ser Aprendiz SENA</h2>
          <div className="politic-article">
            <p>
              Este artículo incluye explícitamente a los de formación complementaria.
            </p>
            <blockquote className="quote">
              "Son condiciones para ser Aprendiz SENA: ... c) Estar matriculado en un programa de formación titulada o en un curso de formación
              complementaria."
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Politic;