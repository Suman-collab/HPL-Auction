const mongoose = require('mongoose');

const retryDelayMs = Number(process.env.MONGO_RETRY_DELAY_MS) || 15000;
let connectionAttempt = null;
let retryTimer = null;

function scheduleReconnect() {
  if (retryTimer) return;

  console.log(`Retrying MongoDB connection in ${retryDelayMs / 1000} seconds...`);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    connectDB();
  }, retryDelayMs);
}

const connectDB = () => {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose.connection);
  }

  if (connectionAttempt) {
    return connectionAttempt;
  }

  connectionAttempt = mongoose
    .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
    .then((conn) => {
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return conn;
    })
    .catch((error) => {
      console.error(`MongoDB Connection Error: ${error.message}`);
      scheduleReconnect();
      return null;
    })
    .finally(() => {
      connectionAttempt = null;
    });

  return connectionAttempt;
};

mongoose.connection.on('disconnected', () => {
  if (mongoose.connection.readyState === 0) {
    console.warn('MongoDB disconnected. Keeping the API online and retrying.');
    scheduleReconnect();
  }
});

module.exports = connectDB;
