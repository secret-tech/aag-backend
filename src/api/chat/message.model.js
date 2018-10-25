import mongoose, { Schema } from 'mongoose'

const messageSchema = new Schema({
    text: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
    userId: Object
})

const model = mongoose.model('Message', messageSchema)

export const schema = model.schema
export default model