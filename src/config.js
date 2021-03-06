/* eslint-disable no-unused-vars */
import path from 'path'
import merge from 'lodash/merge'

/* istanbul ignore next */
const requireProcessEnv = (name) => {
  if (!process.env[name]) {
    throw new Error('You must set the ' + name + ' environment variable')
  }
  return process.env[name]
}

/* istanbul ignore next */
if (process.env.NODE_ENV !== 'production') {
  const dotenv = require('dotenv-safe')
  dotenv.load({
    path: path.join(__dirname, '../.env'),
    sample: path.join(__dirname, '../.env.example')
  })
}

const config = {
  all: {
    env: process.env.NODE_ENV || 'development',
    root: path.join(__dirname, '..'),
    port: process.env.PORT || 9000,
    ip: process.env.IP || '0.0.0.0',
    apiRoot: process.env.API_ROOT || '',
    masterKey: requireProcessEnv('MASTER_KEY'),
    jwtSecret: requireProcessEnv('JWT_SECRET'),
    oneSignal: {
      appId: requireProcessEnv('ONESIGNAL_APP_ID') || '',
      apiKey: requireProcessEnv('ONESIGNAL_API_KEY') || '',
      userKey: requireProcessEnv('ONESIGNAL_USER_KEY') || ''
    },
    mongo: {
      options: {
        db: {
          safe: true
        }
      }
    },
    redis: {
      url: requireProcessEnv('REDIS_URL') || ''
    }
  },
  test: { },
  development: {
    mongo: {
      uri: requireProcessEnv('MONGO_URI'),
      options: {
        debug: true
      }
    }
  },
  production: {
    ip: process.env.IP || undefined,
    port: process.env.PORT || 8080,
    mongo: {
      uri: requireProcessEnv('MONGO_URI'),
    }
  }
}

module.exports = merge(config.all, config[config.all.env])
export default module.exports
