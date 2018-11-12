import User from '../../api/user/model'
import Conversation from '../../api/chat/conversation.model'
import Message from '../../api/chat/message.model'
import { queueRateAdvisorNotification, queueMessageNotification } from '../notification'

const viewConversation = (user, friend, conversation) => {
    return {
        _id: conversation._id,
        messages: conversation.messages,
        friend,
        user
    }
}

const createMessage = (message) => {
    const conversation = await Conversation.findById(message.conversationId)
    const textMessage = new Message({
        text: message.text,
        user: message.senderId,
        conversationId: message.conversationId,
        _id: message._id
    })
    conversation.messages.push(await textMessage.save())
    conversation.save()
    return textMessage;
}

export const processMessage = async (user, message) => {
    const textMessage = await createMessage(message)
    textMessage.user = await User.findById(textMessage.user)
    await queueMessageNotification(user, message)
    return textMessage
}

export const loadMessages = async (user, conversationId, from = null) => {
    let conversation = await Conversation.findById(conversationId)
        .populate('userOne')
        .populate('userTwo')
    if (from) {
        conversation.messages = await Message.find({conversationId, createdAt: {$lt: from}})
            .populate('user')
            .limit(50)
            .sort({createdAt: -1})
    } else {
        conversation.messages = await Message.find({conversationId})
            .populate('user')
            .limit(50)
            .sort({createdAt: -1})
    }
    const friend = user._id.toString() === conversation.userOne._id.toString() ? conversation.userTwo : conversation.userOne;
    return viewConversation(conversationsUser, friend, conversation)
}

export const listConversations = async (userId) => {
    const conversationsUser = await User.findById(userId)
        .populate({path: 'conversations', populate: { path: 'userOne' }})
        .populate({path: 'conversations', populate: { path: 'userTwo' }})
        .populate({path: 'conversations', populate: {
            path: 'messages', populate: { path: 'user' }, options: { limit: 30, sort: {createdAt: -1} } 
    }})
    return await conversationsUser.conversations.map((conversation) => {
        const friend = conversationsUser._id.toString() === conversation.userOne._id.toString() ? conversation.userTwo : conversation.userOne;
        return viewConversation(conversationsUser, friend, conversation)
    })
}

export const findOrCreateConversation = async (user, friendId) => {
    const user = await User.findById(user._id).populate('conversations')
    const existingConversations = user.conversations.filter((conversation) => {
        return conversation.userOne.toString() === friendId || conversation.userTwo.toString() === friendId
    })
    let friend, conversation
    if (existingConversations.length > 0) {
        conversation = await Conversation.findById(existingConversations[0]._id).populate('userOne').populate('userTwo')
        friend = user._id.toString() === conversation.userOne._id.toString() ? conversation.userTwo : conversation.userOne;
    } else {
        friend = await User.findById(friendId)
        conversation = await new Conversation({ userOne: user._id, userTwo: friend._id }).save()
        user.conversations.push(conversation)
        friend.conversations.push(conversation)
        await user.save()
        await friend.save()
        await queueRateAdvisorNotification(user, friend)
    }
    return { conversation: viewConversation(user, friend, conversation) }
}