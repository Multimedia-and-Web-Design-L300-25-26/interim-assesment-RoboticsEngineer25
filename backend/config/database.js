const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Mongoose connection options for production
    const options = {
      maxPoolSize: 10, // Maximum number of connections in the pool
      minPoolSize: 5, // Minimum number of connections in the pool
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
      retryReads: true,
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
    console.log(`✓ Database: ${conn.connection.name}`);

    // Connection event handlers
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('Mongoose disconnected from MongoDB');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.disconnect();
        console.log('Mongoose disconnected on app termination');
        process.exit(0);
      } catch (error) {
        console.error('Error disconnecting:', error.message);
        process.exit(1);
      }
    });

    return conn;
  } catch (error) {
    console.error(`✗ MongoDB Connection Error: ${error.message}`);
    // Wait 5 seconds before retrying (optional)
    setTimeout(() => {
      console.log('Retrying connection...');
      connectDB();
    }, 5000);
  }
};

module.exports = connectDB;
