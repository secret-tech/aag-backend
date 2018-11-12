import { Client, Notification } from 'onesignal-node'
import { oneSignal } from './config'
import User from '../../api/user/model'

import { ratingNotificationQueue, messageNotificationQueue } from '../queue'

const oneSignalClient = new Client({
    userAuthKey: oneSignal.userKey,
    app: { appAuthKey: oneSignal.apiKey, appId: oneSignal.appId }
})

export const queueMessageNotification = async (user, message) => {
    const receiver = await User.findById(message.receiverId)
    const notificationData = {      
        headings: {
          en: user.name
        },
        contents: {      
            en: message.text
        },
        data: {
            review: false,
            userId: user._id.toString(),
            userPicture: user.picture,
            userName: user.name
          },
        url: 'askagirl://app/chat/conversation/' + user._id.toString(),
        include_player_ids: [receiver.services.oneSignal]
    }
    messageNotificationQueue.add(notificationData)
}

export const processMessageNotificationQueue = async (data) => {
    return await oneSignalClient.sendNotification(new Notification(data))
}

export const queueRateAdvisorNotification = async (user, advisor) => {
    const notificationData = {      
        headings: {
          en: advisor.name + ' is waiting for your feedback'
        },
        contents: {      
            en: "Please rate your conversation with " + advisor.name
        },
        data: {
          review: true,
          userId: advisor._id.toString(),
          userPicture: advisor.picture,
          userName: advisor.name
        },
        include_player_ids: [user.services.oneSignal]
      }
      ratingNotificationQueue.add(notificationData, { delay: 300000})
}

export const processRateAdvisorNotificationQueue = async (data) => {
    return await oneSignalClient.sendNotification(new Notification(data))
}


