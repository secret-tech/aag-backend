import mongoose, { Schema } from 'mongoose'
import Message  from './message.model'
import User from '../user/model'

const conversationSchema = new Schema({
    userOne: { type: Schema.Types.ObjectId, ref: 'User' },
    userTwo: { type: Schema.Types.ObjectId, ref: 'User' },
    messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
  }]
})

const model = mongoose.model('Conversation', conversationSchema)

export const schema = model.schema
export default model