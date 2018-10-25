import http from 'http'
import { env, mongo, port, ip, apiRoot } from './config'
import mongoose from './services/mongoose'
import express from './services/express'
import api from './api'
import * as socketio from 'socket.io';
import { createMessage } from './api/chat/controller'

const app = express(apiRoot, api)
const server = http.createServer(app)
const io = socketio.listen(server);
const sockets = {};
const sock = io.of('/')

console.log("Socket: ", sock)

mongoose.connect(mongo.uri)
mongoose.Promise = Promise

setImmediate(() => {
  server.listen(port, ip, () => {
    console.log('Express server listening on http://%s:%d, in %s mode', ip, port, env)
  })
})

sock.on('connection', (socket) => {
  console.log('Socket connection');
  socket.on('init', (userId) => {
    sockets[userId.senderId] = socket;
  });
  socket.on('message', (message) => {
    if (sockets[message.receiverId]) {
      sockets[message.receiverId].emit('message', message);
    }
    createMessage(message)
  });
  socket.on('disconnect', (userId) => {
    delete sockets[userId.senderId];
  });
})

export default app
