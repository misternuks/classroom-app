// app.js

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors'; // Make sure cors is imported
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors()); // This handles CORS for Express routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.IO setup with CORS configuration
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // Allow requests from your React app
    methods: ['GET', 'POST'],
    credentials: true,
  },
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

    // Validate student ID against your student list
    // For this example, we'll assume student IDs are valid and have names

    const studentName = `Student ${studentID}`; // Replace with actual student name lookup

    // Check if the student is already assigned to a group
    if (students[studentID]) {
      // Update socket ID in case it's changed
      students[studentID].socketID = socket.id;
      // Send success message
      socket.emit('loginSuccess');
      socket.emit('studentInfo', students[studentID]);
      // Send updated groups to the client
      socket.emit('updateGroups', groups);
      return;
    }

    // Assign student to a group
    let assigned = false;
    for (let i = 1; i <= 14; i++) {
      if (groups[i].length < 4) {
        const studentInfo = {
          studentID,
          name: studentName,
          groupNumber: i,
          socketID: socket.id,
        };
        groups[i].push(studentInfo);
        students[studentID] = studentInfo;
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      socket.emit('loginError', 'All groups are full.');
      return;
    }

    // Notify the student of login success
    socket.emit('loginSuccess');
    socket.emit('studentInfo', students[studentID]);

    // Update all clients
    io.emit('updateGroups', groups);
  });

  // Handle student logout
  socket.on('studentLogout', () => {
    const studentID = Object.keys(students).find(
      (id) => students[id].socketID === socket.id
    );

    if (studentID) {
      const groupNumber = students[studentID].groupNumber;
      // Remove student from the group
      groups[groupNumber] = groups[groupNumber].filter(
        (student) => student.studentID !== studentID
      );
      // Remove student from the students object
      delete students[studentID];
      // Notify all clients
      io.emit('updateGroups', groups);
      // Emit a logout confirmation to the student
      socket.emit('logoutSuccess');
    }
  });

  // Handle admin actions
  socket.on('adminShuffle', () => {
    // Flatten all students into an array
    const allStudents = Object.values(students);

    // Shuffle the array
    allStudents.sort(() => Math.random() - 0.5);

    // Reset groups
    groups = {};
    for (let i = 1; i <= 14; i++) {
      groups[i] = [];
    }

    // Redistribute students and update their groupNumbers
    let index = 0;
    for (let i = 1; i <= 14; i++) {
      groups[i] = allStudents.slice(index, index + 4);
      groups[i].forEach((student) => {
        // Update the student's groupNumber
        student.groupNumber = i;
        // Update the students object
        students[student.studentID].groupNumber = i;
      });
      index += 4;
    }

    // Notify all clients
    io.emit('updateGroups', groups);
  });

  socket.on('adminMoveStudent', ({ sourceGroup, sourceIndex, destGroup, destIndex }) => {
    sourceGroup = parseInt(sourceGroup);
    destGroup = parseInt(destGroup);

    // Check if the destination group is full
    if (groups[destGroup].length >= 4) {
      socket.emit('moveError', 'Destination group is full.');
      return;
    }

    // Get the student object from the source group
    const student = groups[sourceGroup][sourceIndex];

    if (student) {
      // Remove the student from the source group
      groups[sourceGroup].splice(sourceIndex, 1);

      // Update the student's groupNumber in their own object
      student.groupNumber = destGroup;

      // Update the student's groupNumber in the students object
      students[student.studentID].groupNumber = destGroup;

      // Add the student to the destination group at the specified index
      groups[destGroup].splice(destIndex, 0, student);

      // Notify all clients of the updated groups
      io.emit('updateGroups', groups);
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
    console.log('A user disconnected:', socket.id);

    // Find the student with this socket ID
    const studentID = Object.keys(students).find(
      (id) => students[id].socketID === socket.id
    );

    if (studentID) {
      // Optionally, mark the student as offline if you wish
      // For now, we'll just log it
      console.log(`Student ${studentID} disconnected but remains in the group.`);
      // Do not remove the student from the group
    }
  });
});

// Start the server
const PORT = process.env.PORT || 5000;

// In-memory data storage
let classCode = null;
let groups = {}; // Key: group number, Value: array of student objects
let studentsOnline = {}; // Key: socket ID, Value: student ID
let students = {}; // Key: student ID, Value: student info (name, group number, socket ID)


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
    // Clear students data
    students = {};
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
