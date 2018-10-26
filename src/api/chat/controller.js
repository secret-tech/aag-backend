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
                    friend,
                    user
                } })
            })
        } else {
            User.findById(body.userId).then((friend) => {
                console.log('USER:::', user);
                console.log('FRIEND::', friend, body)
                const newConversation = new Conversation({
                    userOne: user._id,
                    userTwo: friend._id,
                })
                newConversation.save().then(async (conversation) => {
                    user.conversations.push(conversation)
                    await user.save()
                    friend.conversations.push(conversation)
                    await friend.save()
                    res.status(200).json({ conversation: {
                        _id: conversation._id,
                        messages: conversation.messages,
                        friend,
                        user
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
        .populate('userOne')
        .populate('userTwo')
    const messages = await Message.find({conversationId})
        .populate('user')
        .limit(50)
        .sort({createdAt: -1})
    const friend = user._id.toString() === conversation.userOne._id.toString() ? conversation.userTwo : conversation.userOne;
    return {
        _id: conversation._id,
        messages: messages,
        friend,
        user
    }
}