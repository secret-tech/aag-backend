import mongoose, { Schema } from 'mongoose'

const messageSchema = new Schema({
    text: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }
})

const model = mongoose.model('Message', messageSchema)

export const schema = model.schema
export default model