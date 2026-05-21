const cors = require('cors');
const express = require('express');
const app = express();
const mongoose = require('mongoose');
require('dotenv').config();

// Validate required environment variables
if (!process.env.CORS_ORIGIN) {
  throw new Error('Environment variable CORS_ORIGIN is required but not set.');
}
if (!process.env.PORT) {
  throw new Error('Environment variable PORT is required but not set.');
}
if (!process.env.MONGODB_URI) {
  throw new Error('Environment variable MONGODB_URI is required but not set.');
}

const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  credentials: true, // Allow cookies/auth headers
};
app.use(cors(corsOptions));

const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });