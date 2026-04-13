const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files completely
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/Landing.html'));
});

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    
    if (!uri || uri.includes('<password>')) {
      console.error('❌ Critical Error: No Valid MONGO_URI in .env detected.');
      process.exit(1);
    }
    
    console.log('⏳ Attempting to connect to MongoDB Atlas...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      family: 4,
    });
    console.log('✅ MongoDB connected securely at Atlas Cluster.');
  } catch (err) {
    console.warn('⚠️ Atlas Connection Failed. Falling back to Local Memory DB...');
    try {
      const mongod = await MongoMemoryServer.create();
      const localUri = mongod.getUri();
      console.log(`🚀 Local Memory DB started at: ${localUri}`);
      
      await mongoose.connect(localUri);
      console.log('✅ Connected to Local Memory Database. App is now in DEV MODE.');
    } catch (fallbackErr) {
      console.error('❌ Critical Error: Could not start local database fallback.');
      console.error(fallbackErr);
      process.exit(1);
    }
  }
};
connectDB();

// Websocket / Socket.io for Real-time Notifications & Application Tracking
io.on('connection', (socket) => {
    console.log('⚡ A user connected Real-time:', socket.id);
    
    // Listen for Application Tracking Updates
    socket.on('applicationUpdate', (data) => {
        io.emit('notification', `App status changed to ${data.status} for ${data.jobTitle}`);
    });

    socket.on('disconnect', () => console.log('User disconnected'));
});

// Import Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/resume', require('./routes/resumeRoutes'));

// Connect the newly created professional Error Handler middleware
const errorHandler = require('./middlewares/error');
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 PIROS Advanced API running on port ${PORT}`);
});
