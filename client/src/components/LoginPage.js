// src/components/LoginPage.js
import styles from './LoginPage.module.css';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket'; // Import the socket instance

function LoginPage() {
  const [studentID, setStudentID] = useState('');
  const [classCode, setClassCode] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const navigate = useNavigate();

  const handleStudentLogin = (e) => {
    e.preventDefault();

    // Emit 'studentLogin' event to the server
    socket.emit('studentLogin', { studentID, classCode });

    // Listen for login success or error
    socket.on('loginSuccess', () => {
      navigate('/student');
    });

    socket.on('loginError', (message) => {
      alert(message);
    });
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/admin/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/admin');
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Error during admin login:', error);
      alert('An error occurred during admin login.');
    }
  };

  return (
    <div className={styles.background}>
      <h1>Digital Production Groups</h1>
      <div className={styles.card}>
        <h2>Student Login</h2>
        <form onSubmit={handleStudentLogin} className={styles.form}>
          <input
            type="text"
            placeholder="Student ID"
            value={studentID}
            onChange={(e) => setStudentID(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Class Code"
            value={classCode}
            onChange={(e) => setClassCode(e.target.value)}
            required
          />
          <button type="submit">Login as Student</button>
        </form>

        <h2>Admin Login</h2>
        <form onSubmit={handleAdminLogin} className={styles.form}>
          <input
            type="email"
            placeholder="Admin Email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            required
          />
          <button type="submit">Login as Admin</button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
