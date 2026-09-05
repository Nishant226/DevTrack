import { io } from 'socket.io-client';

// Browser ke liye seedha production IP ya window location use karein
const SOCKET_URL = 'http://16.171.172.227:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
});