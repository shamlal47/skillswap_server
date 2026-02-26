import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import { PORT } from './config/env.js';
import connectDB from './database/mongodb.js';
import errorHandler from './middleware/error.middleware.js';
import authRouter from './routes/auth.route.js';
import userRouter from './routes/user.route.js';
import courseRouter from './routes/course.route.js';
import chatRouter from './routes/chat.route.js';
import Message from './model/message.model.js';
import ChatRequest from './model/chatRequest.model.js';

import cors from 'cors';

const app = express();
const httpServer = createServer(app);

// Socket.io setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Store connected users
const connectedUsers = new Map();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use('/uploads', express.static('uploads'));

app.use((req, res, next) => {
  console.log(req.method, req.originalUrl);
  next();
});

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/courses', courseRouter);
app.use('/api/chat', chatRouter);

app.use(errorHandler);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Register user with their ID
  socket.on('register', (userId) => {
    connectedUsers.set(userId, socket.id);
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  // Join a chat room
  socket.on('join-chat', (chatRequestId) => {
    socket.join(chatRequestId);
    console.log(`Socket ${socket.id} joined chat room ${chatRequestId}`);
  });

  // Leave a chat room
  socket.on('leave-chat', (chatRequestId) => {
    socket.leave(chatRequestId);
    console.log(`Socket ${socket.id} left chat room ${chatRequestId}`);
  });

  // Handle new message
  socket.on('send-message', async (data) => {
    const { chatRequestId, senderId, content } = data;

    try {
      // Verify chat is accepted
      const chatRequest = await ChatRequest.findById(chatRequestId);
      if (!chatRequest || chatRequest.status !== 'accepted') {
        socket.emit('error', { message: 'Chat is not active' });
        return;
      }

      // Create and save message
      const message = await Message.create({
        chatRequest: chatRequestId,
        sender: senderId,
        content
      });

      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'name profilePicture');

      // Broadcast to chat room
      io.to(chatRequestId).emit('new-message', populatedMessage);
    } catch (error) {
      console.error('Socket message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle new chat request notification
  socket.on('new-request', (data) => {
    const { receiverId, request } = data;
    const receiverSocketId = connectedUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('chat-request', request);
    }
  });

  // Handle request response notification
  socket.on('request-response', (data) => {
    const { senderId, response } = data;
    const senderSocketId = connectedUsers.get(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit('request-responded', response);
    }
  });

  socket.on('disconnect', () => {
    // Remove user from connected users
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

httpServer.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Socket.io enabled for real-time chat');
  await connectDB();
});