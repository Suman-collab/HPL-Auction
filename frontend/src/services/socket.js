import { io } from 'socket.io-client';

export const socket = io(import.meta.env.DEV ? undefined : 'https://hpl-auction.onrender.com', {
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
