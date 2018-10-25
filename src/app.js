import http from 'http'
import { env, mongo, port, ip, apiRoot } from './config'
import mongoose from './services/mongoose'
import express from './services/express'
import api from './api'
import * as socketio from 'socket.io';
import { createMessage, loadMessages } from './api/chat/controller'
import { verify } from './services/jwt'

const app = express(apiRoot, api)
const server = http.createServer(app)
const io = socketio.listen(server);
const sockets = {};
const sock = io.of('/')

io.use((socket, next) => {
  if (socket.handshake.query && socket.handshake.query.token){
    verify(socket.handshake.query.token, function(decoded) {
      socket.decoded = decoded;
      console.log(decoded)
      next();
    });
  } else {
      console.log("No toke in handshake")
      next(new Error('Authentication error'));
  }    
})

mongoose.connect(mongo.uri)
mongoose.Promise = Promise

setImmediate(() => {
  server.listen(port, ip, () => {
    console.log('Express server listening on http://%s:%d, in %s mode', ip, port, env)
  })
})

sock.on('connection', async (socket) => {
  console.log("Auth ", socket.request.user);
  socket.on('init', async (initData) => {
    sockets[initData.senderId] = socket;
    const conversation = await loadMessages(initData.conversationId)
    sockets[initData.senderId].emit('loadMessages', conversation.messages)
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