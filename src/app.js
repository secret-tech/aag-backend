import http from 'http'
import { env, mongo, port, ip, apiRoot } from './config'
import mongoose from './services/mongoose'
import express from './services/express'
import api from './api'
import * as socketio from 'socket.io';
import { createMessage, listConversations, loadMessages } from './api/chat/controller'
import { verify } from './services/jwt'
import User from './api/user/model'

const app = express(apiRoot, api)
const server = http.createServer(app)
const io = socketio.listen(server);
const sockets = {};
const sock = io.of('/')

io.use(async (socket, next) => {
  if (socket.handshake.query && socket.handshake.query.token){
    try {
      const decoded = await verify(socket.handshake.query.token);
      if(decoded.id) {
        socket.request.user = await User.findById(decoded.id)
        next()
      } else {
        next(new Error('Authentication error'));
      }
    } catch(err) {
      next(new Error('Authentication error'));
    }
  } else {
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

sock.on('connection', async (socket, conversationId) => {
  const user = socket.request.user
  sockets[user._id.toString()] = socket
  const conversations = await listConversations(user)
  sockets[user._id.toString()].emit('loadConversations', conversations)
  socket.on('message', async (message) => {
    const textMessage = await createMessage(message)
    if (sockets[message.receiverId]) {
      textMessage.user = await User.findById(textMessage.user)
      sockets[message.receiverId].emit('message', textMessage);
    }
  });

  socket.on('loadMessages', async (request) => {
    console.log("LOAD MESSAGES!!!", request)
    const messages = await loadMessages(user, request.conversationId)
    sockets[user._id.toString()].emit('messages', messages)
  })
  
  socket.on('disconnect', (userId) => {
    delete sockets[userId.senderId];
  });
})

export default app