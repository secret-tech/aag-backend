import mongoose, { Schema } from 'mongoose'

const messageSchema = new Schema({
    _id: { type: String},
    text: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    conversationId: { type: String }
})

const model = mongoose.model('Message', messageSchema)

export const schema = model.schema
export default model