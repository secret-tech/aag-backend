import { redis, oneSignal } from './config'
import Queue from 'bull'

const oneSignalClient = new Client({
    userAuthKey: oneSignal.userKey,
    app: { appAuthKey: oneSignal.apiKey, appId: oneSignal.appId }
})
const notificationQueue = new Queue('rating-notifications', redis.url)

notificationQueue.process(async (job, data) => {
    await oneSignalClient.sendNotification(data)
});

notificationQueue.on('completed', job => {
    console.log('Job with id ' + job.id + ' has been completed');
})