import User from '../../api/user/model'
import Conversation  from '../../api/chat/conversation.model'
import Message from '../../api/chat/message.model'

export const onMessage = (user, message) => {
    const notification = new Notification({      
        headings: {
          en: user.name
        },
        contents: {      
            en: message.text
        },
        url: 'askagirl://app/chat/conversation/' + user._id.toString(),
        include_player_ids: [receiver.services.oneSignal]
      })
    //create notification
    //send message to receiver
    //retrieve conversations
    //load conversations

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
