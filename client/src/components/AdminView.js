import React, { useEffect, useState } from 'react';
import socket from '../socket'; // Import the socket instance
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import styles from './AdminView.module.css';

function AdminView() {
  const [groups, setGroups] = useState({});
  const [classCode, setClassCode] = useState('');

  useEffect(() => {
    // Fetch initial data
    fetch('/admin/get-class-data')
      .then((res) => res.json())
      .then((data) => {
        setClassCode(data.classCode);
        setGroups(data.groups);
      });

    // Listen for group updates
    socket.on('updateGroups', (updatedGroups) => {
      setGroups(updatedGroups);
    });

    // Listen for class code updates
    socket.on('classCodeGenerated', (newClassCode) => {
      setClassCode(newClassCode);
    });

    // Clean up listeners on unmount
    return () => {
      socket.off('updateGroups');
      socket.off('classCodeGenerated');
    };
  }, []);

  const handleShuffleAll = () => {
    socket.emit('adminShuffle');
  };

  const handleEndSession = () => {
    socket.emit('adminEndSession');
    window.location.href = '/';
  };

  const onDragEnd = (result) => {
    const { source, destination } = result;

    if (!destination) return;

    // If the student was dropped in the same place
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    socket.emit('adminMoveStudent', {
      sourceGroup: source.droppableId,
      sourceIndex: source.index,
      destGroup: destination.droppableId,
      destIndex: destination.index,
    });
  };

  return (
    <div className={styles.background}>
      <div className={styles.card}>
        <h2>Admin View</h2>
        <p>Class Code: <strong>{classCode}</strong></p>
        <button onClick={handleShuffleAll}>Shuffle All</button>
        <button onClick={handleEndSession}>End Session</button>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className={styles.tilecontainer}>
          {Object.keys(groups).map((groupNumber) => (
            <Droppable droppableId={groupNumber} key={groupNumber}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={styles.tile}
                >
                  <h3>Group {groupNumber}</h3>
                  {groups[groupNumber].map((student, index) => (
                    <Draggable key={student.studentID} draggableId={student.studentID} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={styles.tilestudent}

                        >
                          {student.name}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}

export default AdminView;
