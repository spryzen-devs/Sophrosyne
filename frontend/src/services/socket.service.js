import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
let socket = null;

function createSocket() {
  const token = localStorage.getItem('sentinel_token');
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      auth: {
        token: token || undefined,
      },
    });
  } else if (token && socket.auth) {
    socket.auth.token = token;
  }
  return socket;
}

const socketService = {
  connect() {
    const client = createSocket();
    if (!client.connected) {
      client.connect();
    }
    return client;
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  joinPatient(patientId) {
    if (!patientId) return;
    const client = createSocket();
    client.emit('join:patient', patientId);
    client.emit('joinPatient', { patientId });
  },

  leavePatient(patientId) {
    if (!patientId) return;
    const client = createSocket();
    client.emit('leave:patient', patientId);
    client.emit('leavePatient', { patientId });
  },

  subscribe(event, handler) {
    const client = createSocket();
    client.on(event, handler);
  },

  unsubscribe(event, handler) {
    if (!socket) return;
    if (handler) {
      socket.off(event, handler);
    } else {
      socket.off(event);
    }
  },
};

export default socketService;
