// app.js

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple route for testing
app.get('/', (req, res) => {
  res.send('Server is up and running!');
});

// Socket.IO setup
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle student login
  socket.on('studentLogin', ({ studentID, classCode: inputClassCode }) => {
    if (inputClassCode !== classCode) {
      socket.emit('loginError', 'Invalid class code.');
      return;
    }

    // For simplicity, we'll assume studentID is valid.
    // In practice, you should verify the studentID against your student list.

    const studentName = `Student ${studentID}`; // Placeholder for student name

    // Assign student to a group
    let assigned = false;
    for (let i = 1; i <= 14; i++) {
      if (groups[i].length < 4) {
        groups[i].push({ studentID, name: studentName });
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      socket.emit('loginError', 'All groups are full.');
      return;
    }

    // Keep track of online students
    studentsOnline[socket.id] = studentID;

    // Notify the student of login success
    socket.emit('loginSuccess');
    socket.emit('studentInfo', { studentID, name: studentName });

    // Update all clients
    io.emit('updateGroups', groups);
  });

  // Handle student logout
  socket.on('studentLogout', () => {
    const studentID = studentsOnline[socket.id];
    if (studentID) {
      // Remove student from groups
      for (let i = 1; i <= 14; i++) {
        groups[i] = groups[i].filter((student) => student.studentID !== studentID);
      }
      delete studentsOnline[socket.id];
      io.emit('updateGroups', groups);
    }
  });

  // Handle admin actions
  socket.on('adminShuffle', () => {
    // Flatten all students into one array
    let allStudents = [];
    for (let i = 1; i <= 14; i++) {
      allStudents = allStudents.concat(groups[i]);
      groups[i] = [];
    }
    // Shuffle the array
    allStudents.sort(() => Math.random() - 0.5);
    // Redistribute students
    let index = 0;
    for (let i = 1; i <= 14; i++) {
      groups[i] = allStudents.slice(index, index + 4);
      index += 4;
    }
    io.emit('updateGroups', groups);
  });

  socket.on('adminMoveStudent', ({ sourceGroup, sourceIndex, destGroup, destIndex }) => {
    sourceGroup = parseInt(sourceGroup);
    destGroup = parseInt(destGroup);
    const student = groups[sourceGroup][sourceIndex];
    if (groups[destGroup].length < 4) {
      groups[sourceGroup].splice(sourceIndex, 1);
      groups[destGroup].splice(destIndex, 0, student);
      io.emit('updateGroups', groups);
    } else {
      socket.emit('moveError', 'Destination group is full.');
    }
  });

  socket.on('adminEndSession', () => {
    classCode = null;
    groups = {};
    studentsOnline = {};
    io.emit('sessionEnded');
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const studentID = studentsOnline[socket.id];
    if (studentID) {
      // Remove student from groups
      for (let i = 1; i <= 14; i++) {
        groups[i] = groups[i].filter((student) => student.studentID !== studentID);
      }
      delete studentsOnline[socket.id];
      io.emit('updateGroups', groups);
    }
    console.log('A user disconnected:', socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 5000;

// In-memory data storage
let classCode = null;
let groups = {};
let studentsOnline = {};

// Endpoint to generate class code (admin only)
app.post('/admin/generate-code', (req, res) => {
  const { email, password } = req.body;
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    classCode = Math.floor(1000 + Math.random() * 9000).toString();
    // Initialize groups
    groups = {};
    for (let i = 1; i <= 14; i++) {
      groups[i] = [];
    }
    res.json({ classCode });
  } else {
    res.status(401).json({ message: 'Invalid admin credentials' });
  }
});

// Endpoint to get class data (admin only)
app.get('/admin/get-class-data', (req, res) => {
  res.json({ classCode, groups });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
