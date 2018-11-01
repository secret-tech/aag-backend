import http from 'http'
import { env, mongo, port, ip, apiRoot, oneSignal } from './config'
import mongoose from './services/mongoose'
import express from './services/express'
import api from './api'
import * as socketio from 'socket.io';
import { createMessage, listConversations, loadMessages } from './api/chat/controller'
import { verify } from './services/jwt'
import User from './api/user/model'
import Conversation from './api/chat/conversation.model'
import { Client, Notification } from 'onesignal-node'

const app = express(apiRoot, api)
const server = http.createServer(app)
const io = socketio.listen(server);
const sockets = {};
const sock = io.of('/')
const oneSignalClient = new Client({
  userAuthKey: oneSignal.userKey,
  app: { appAuthKey: oneSignal.apiKey, appId: oneSignal.appId }
})


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
    textMessage.user = await User.findById(textMessage.user)
    const receiver = await User.findById(message.receiverId)
    const notification = new Notification({      
      headings: {
        en: user.name
      },
      contents: {      
          en: message.text
      },
      app_url: 'chat://chat/chat/' + user._id.toString(),
      include_player_ids: [receiver.services.oneSignal]
    })
    await oneSignalClient.sendNotification(notification)
    if (sockets[message.receiverId]) {
      sockets[message.receiverId].emit('message', textMessage)
      const receiverConversations = await listConversations(receiver)
      sockets[message.receiverId].emit('loadConversations', receiverConversations)
    }
  });

  socket.on('createConversation', async (request) => {
    User.findOne({ email: user.email }).populate('conversations').then((user) => {
        const existingConversations = user.conversations.filter((conversation) => {
            return conversation.userOne.toString() === request.userId || conversation.userTwo.toString() === request.userId
        })
        if (existingConversations.length > 0) {
            const conv = existingConversations[0]
            Conversation.findById(conv._id).populate('userOne').populate('userTwo').then((conversation) => {
                const friend = user._id.toString() === conversation.userOne._id.toString() ? conversation.userTwo : conversation.userOne;
                sockets[user._id.toString()].emit('conversationExists', { conversation: {
                  _id: conversation._id,
                  messages: conversation.messages,
                  friend,
                  user
                }})
            })
        } else {
            User.findById(request.userId).then((friend) => {
                const newConversation = new Conversation({
                    userOne: user._id,
                    userTwo: friend._id,
                })
                newConversation.save().then(async (conversation) => {
                    user.conversations.push(conversation)
                    friend.conversations.push(conversation)
                    await user.save()
                    await friend.save()
                    sockets[user._id.toString()].emit('conversationCreated', { conversation: {
                      _id: conversation._id,
                      messages: conversation.messages,
                      friend,
                      user
                  } })
                })
            })
        }
    })
  })

  socket.on('loadMessages', async (request) => {
    const messages = await loadMessages(user, request.conversationId)
    sockets[user._id.toString()].emit('messages', messages)
  })
  
  socket.on('disconnect', (userId) => {
    delete sockets[userId.senderId];
  });
})

export default app