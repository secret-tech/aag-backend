import User from '../user/model'
import Conversation  from './conversation.model'
import Message from './message.model'

export const listConversations = async (user) => {
    const conversationsUser = await User.findOne({ email: user.email })
        .populate({path: 'conversations', populate: { path: 'userOne' }})
        .populate({path: 'conversations', populate: { path: 'userTwo' }})
        .populate({path: 'conversations', populate: {
            path: 'messages', populate: { path: 'user' }, options: { limit: 30, sort: {createdAt: -1} } 
    }})
    const conversations = await conversationsUser.conversations.map((conversation) => {
        const friend = user._id.toString() === conversation.userOne._id.toString() ? conversation.userTwo : conversation.userOne;
        return {
            _id: conversation._id,
            messages: conversation.messages,
            friend,
            user
        }
    })
    return conversations
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


export const createMessage = async (message) => {
    const conversation = await Conversation.findById(message.conversationId)
    const textMessage = new Message({
        text: message.text,
        user: message.senderId,
        conversationId: message.conversationId,
        _id: message._id
    })
    const savedMessage = await textMessage.save()
    conversation.messages.push(savedMessage)
    await conversation.save()
    return savedMessage;
}

export const loadMessages = async (user, conversationId) => {
    const conversation = await Conversation.findById(conversationId)
        .populate({path: 'messages', populate: { path: 'user' }, options: { limit: 50, sort: {createdAt: -1} }})
        .populate('userOne')
        .populate('userTwo')
    const friend = user._id.toString() === conversation.userOne._id.toString() ? conversation.userTwo : conversation.userOne;
    return {
        _id: conversation._id,
        messages: conversation.messages,
        friend,
        user
    }
}