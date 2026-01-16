import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // Permite usar rutas
import App from './App.jsx';
import './index.css';

// Importa el provider del contexto de los modales
import { ModalProvider } from './Context/ModalContext.jsx'; // Ajusta la ruta si es necesario

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
    <ModalProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ModalProvider>
  // </React.StrictMode>
);
