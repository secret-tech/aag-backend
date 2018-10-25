import User from '../user/model'
import Conversation  from './conversation.model'
import Message from './message.model'


export const listConversations = ({body, params, user}, res, next) => {
    User.findOne({ email: user.email })
        .populate({path: 'conversations', populate: { path: 'userOne' }})
        .populate({path: 'conversations', populate: { path: 'userTwo' }})
        .then((user) => {
            const conversations = user.conversations.map((conversation) => {
                const friend = user._id.toString() === conversation.userOne._id.toString() ? conversation.userTwo : conversation.userOne;
                return {
                    _id: conversation._id,
                    messages: conversation.messages,
                    friend
                }
            })
            res.status(200).json({ conversations })
        })
}

export const createConversation = ({ body, params, user }, res, next) => {
    User.findOne({ email: user.email }).populate('conversations').then((user) => {
        const existingConversations = user.conversations.filter((conversation) => {
            return conversation.userOne.toString() === body.userId || conversation.userTwo.toString() === body.userId
        })
        if (existingConversations.length > 0) {
            const conv = existingConversations[0]
            Conversation.findById(conv._id).populate('userOne').populate('userTwo').then((conversation) => {
                const friend = user._id.toString() === conversation.userOne._id.toString() ? conversation.userTwo : conversation.userOne;
                res.status(200).json({ conversation: {
                    _id: conversation._id,
                    messages: conversation.messages,
                    friend
                } })
            })
        } else {
            User.findById(body.userId).then((friend) => {
                const newConversation = new Conversation({
                    userOne: user._id,
                    userTwo: friend._id,
                })
                newConversation.save().then((conversation) => {
                    user.conversations.push(conversation)
                    user.save()
                    friend.conversations.push(conversation)
                    friend.save()
                    res.status(200).json({ conversation: {
                        _id: conversation._id,
                        messages: conversation.messages,
                        friend
                    } })
                })
            })
        }
    })
}


export const createMessage = (message) => {
    Conversation.findById(message.conversationId).then((conversation) => {
        const textMessage = new Message({
          text: message.text,
          userId: message.senderId,
        })
        textMessage.save().then((savedMessage) => {
          conversation.messages.push(savedMessage);
          conversation.save()
        })
    })
}

export const loadMessages = (conversationId) => {
    Conversation.findById(request.params.conversationId).populate('messages').then((conversation) => {
        return conversation
    })
}