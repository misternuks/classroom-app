// src/socket.js

import { io } from 'socket.io-client';

const socket = io(process.env.REACT_APP_SOCKET_IO_SERVER, {
  withCredentials: true,
});

export default socket;
