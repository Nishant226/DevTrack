import { io } from 'socket.io-client';

// Production ke liye EC2 IP ya environment variable use karein
const SOCKET_URL = process.env.REACT_APP_BACKEND_URL || 'http://16.171.172.227:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
});