let ioInstance = null;

function initSocket(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
}

function getIO() {
  return ioInstance;
}

function emitEvent(event, data) {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
}

module.exports = {
  initSocket,
  getIO,
  emitEvent,
};
