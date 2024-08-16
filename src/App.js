import './App.css';
import React from "react"
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import XoxRoutes from './routes/XoxRoutes'
function App() {
  
  return (
    <Router>
      <Routes>
        <Route element={<XoxRoutes />} path="/*" />
      </Routes>
    </Router>
  );
}

export default App;
