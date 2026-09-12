const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connUri = process.env.MONGO_URI;
    const conn = await mongoose.connect(connUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
