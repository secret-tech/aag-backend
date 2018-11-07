import { Schema } from 'mongoose'

const ratingSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    target: { type: Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, required: true }
})

export default ratingSchema