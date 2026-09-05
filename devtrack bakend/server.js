const express = require('express');
globalThis.crypto = require('crypto');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const userRoutes = require('./routes/userRoutes');
const connectDB = require('./config/db');
const validateEnv = require('./config/validateEnv');
const errorHandler = require('./middleware/errorMiddleware');

// 1. Env load & validate
dotenv.config();
validateEnv();

// 2. Database connect
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

const app = express();
const server = http.createServer(app);

// Allowed Origins (Localhost aur AWS EC2 IP dono ke liye)
const allowedOrigins = [
  'http://localhost:3000',
  'http://16.171.172.227:3000',
  process.env.CLIENT_URL
].filter(Boolean);

// --- 3. CORS Configuration ---
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, postman, or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 4. Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Real-Time Events
io.on('connection', (socket) => {
  console.log(`⚡ Client connected: ${socket.id}`);

  socket.on('joinProject', (projectId) => {
    socket.join(projectId);
    console.log(`👤 User joined project room: ${projectId}`);
  });

  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected');
  });
});

app.set('socketio', io);

// 5. Security & Rate Limit Middlewares
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests from this IP, try again after 15 minutes' }
});
app.use('/api', limiter);

app.use(express.json());

// All Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/activities', require('./routes/activityRoutes'));
app.use('/api', require('./routes/uploadRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/users', userRoutes);
app.get('/', (req, res) => {
  res.send('DevTrack Pro API with Socket.io is running live...');
});

app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = { app, server };