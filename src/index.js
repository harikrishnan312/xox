import * as process from 'process';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Context from './context/AuthContext';
import Footer from './components/footer/Footer';

(window).global = window;
(window).process = process;
(window).Buffer = [];

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Context>
    <React.StrictMode>
      <App />
      <Footer />
    </React.StrictMode>
  </Context>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
