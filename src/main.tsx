import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// @ts-ignore: allow CSS side-effect import without module declarations
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);