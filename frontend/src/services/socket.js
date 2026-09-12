import { io } from 'socket.io-client';

const getSocketUrl = () => {
  const value = import.meta.env.VITE_SOCKET_URL;
  if (!value) {
    throw new Error('Missing required frontend environment variable: VITE_SOCKET_URL');
  }
  return value.replace(/\/$/, '');
};

export const socket = io(getSocketUrl(), {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});

socket.on('connect', () => {
  console.log('[Socket] Connected to HPL Live Auction Gateway');
});

socket.on('disconnect', () => {
  console.log('[Socket] Disconnected from HPL Live Auction Gateway');
});
