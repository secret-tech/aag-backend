import Queue from 'bull';

export const RATING_NOTIFICATIONS = 'rating-notifications'
export const MESSAGE_NOTIFICATIONS = 'message-notifications'
export const SYSTEM_NOTIFICATIONS = 'system-notifications'

export const ratingNotificationQueue = new Queue(RATING_NOTIFICATIONS, redis.url)
export const messageNotificationQueue = new Queue(MESSAGE_NOTIFICATIONS, redis.url)