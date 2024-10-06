import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import StudentView from './components/StudentView';
import AdminView from './components/AdminView';

// src/App.js

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/student" element={<StudentView />} />
      <Route path="/admin" element={<AdminView />} />
    </Routes>
  );
}

export default App;
