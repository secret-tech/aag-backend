import { ratingNotificationQueue, messageNotificationQueue } from './services/queue'
import { processRateAdvisorNotificationQueue, processMessageNotificationQueue } from './services/notification'

ratingNotificationQueue.process(async (job) => {
    await processRateAdvisorNotificationQueue(job.data)
    return true
})

messageNotificationQueue.process(async (job) => {
    await processMessageNotificationQueue(job.data)
    return true
})

ratingNotificationQueue.on('completed', job => {
    console.log('Rating job with id ' + job.id + ' has been completed');
})
