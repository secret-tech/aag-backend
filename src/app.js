import http from 'http'
import { env, mongo, redis, port, ip, apiRoot } from './config'
import { findOrCreateConversation, processMessage, listConversations, loadMessages } from  './services/chat'
import mongoose from './services/mongoose'
import express from './services/express'
import api from './api'
import * as socketio from 'socket.io';
import { verify } from './services/jwt'
import User from './api/user/model'

const app = express(apiRoot, api)
const server = http.createServer(app)
const io = socketio.listen(server);
const sockets = {};
const sock = io.of('/')

mongoose.connect(mongo.uri)

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

setImmediate(() => {
  server.listen(port, ip, () => {
    console.log('Express server listening on http://%s:%d, in %s mode', ip, port, env)
  })
})

sock.on('connection', async (socket) => {
  
  const user = socket.request.user
  sockets[user._id.toString()] = socket
  sockets[user._id.toString()].emit('loadConversations', await listConversations(user._id))
  
  socket.on('message', async (message) => {
    const textMessage = await processMessage(user, message)
    if (sockets[message.receiverId]) {
      sockets[message.receiverId].emit('message', textMessage)
      sockets[message.receiverId].emit('loadConversations', await listConversations(message.receiverId))
    }
  });

  socket.on('createConversation', async (request) => {
    sockets[user._id.toString()].emit('conversationCreated', await findOrCreateConversation(user, request.userId))
  })

  socket.on('loadMessages', async (request) => {
    const messages = await loadMessages(user, request.conversationId)
    sockets[user._id.toString()].emit('messages', messages)
  })

  socket.on('fetchMoreMessages', async (request) => {
    const messages = await loadMessages(user, request.conversationId, new Date(request.key))
    sockets[user._id.toString()].emit('loadMoreMessages', messages)
  })
  
  socket.on('disconnect', (userId) => {
    delete sockets[userId.senderId];
  });
  
})

export default app