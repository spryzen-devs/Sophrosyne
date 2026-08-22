import { Server } from 'socket.io';
import { env } from '../config/env.js';

let io;

/**
 * Initialize Socket.IO
 * @param {http.Server} server - The HTTP server instance
 * @returns {Server}
 */
export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // More permissive for debugging
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    /**
     * Join a patient-specific room
     */
    socket.on('join:patient', (patientId) => {
      if (patientId) {
        socket.join(`patient:${patientId}`);
        console.log(`Socket ${socket.id} joined room patient:${patientId}`);
      }
    });

    /**
     * Leave a patient-specific room
     */
    socket.on('leave:patient', (patientId) => {
      if (patientId) {
        socket.leave(`patient:${patientId}`);
        console.log(`Socket ${socket.id} left room patient:${patientId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Get Socket.IO instance
 * @returns {Server}
 */
export const getIO = () => {
  return io || null;
};
