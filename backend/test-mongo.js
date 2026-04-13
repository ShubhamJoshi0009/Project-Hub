const mongoose = require('mongoose');
require('dotenv').config();

const testMongo = async () => {
  try {
    console.log('Testing MongoDB connection to:', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('SUCCESS: MongoDB is running and connected.');
    process.exit(0);
  } catch (err) {
    console.error('FAILURE: Could not connect to MongoDB.');
    console.error('Error Details:', err.message);
    process.exit(1);
  }
};

testMongo();
