// src/components/StudentView.js

import React, { useEffect, useState } from 'react';
import socket from '../socket'; // Import the socket instance

function StudentView() {
  const [groups, setGroups] = useState({});
  const [studentInfo, setStudentInfo] = useState(null);

  useEffect(() => {
    // Listen for group updates
    socket.on('updateGroups', (updatedGroups) => {
      setGroups(updatedGroups);
    });

    // Receive student info upon login success
    socket.on('studentInfo', (info) => {
      setStudentInfo(info);
    });

    // Clean up listeners on unmount
    return () => {
      socket.off('updateGroups');
      socket.off('studentInfo');
    };
  }, []);

  const handleLogout = () => {
    socket.emit('studentLogout');
    window.location.href = '/';
  };

  return (
    <div>
      <h2>Welcome, {studentInfo ? studentInfo.name : 'Student'}</h2>
      <button onClick={handleLogout}>Log Out</button>
      <div>
        {/* Render the groups in the classroom layout */}
        {Object.keys(groups).map((groupNumber) => (
          <div key={groupNumber} style={{ border: '1px solid black', margin: '10px', padding: '10px' }}>
            <h3>Group {groupNumber}</h3>
            <ul>
              {groups[groupNumber].map((student) => (
                <li key={student.studentID}>{student.name}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StudentView;
