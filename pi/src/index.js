import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'font-awesome/css/font-awesome.min.css';
import { BrowserRouter } from 'react-router-dom';
import { UserProvider } from './JS/UserProvider';

// La vérification de connectivité a été désactivée pour la compilation Docker

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(

<BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
  </BrowserRouter>
);