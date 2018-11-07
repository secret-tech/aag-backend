import crypto, { timingSafeEqual } from 'crypto'
import mongoose, { Schema } from 'mongoose'
import mongooseKeywords from 'mongoose-keywords'
import RatingSchema from './rating.model'

const roles = ['user', 'advisor', 'admin']
const genders = ['male', 'female', 'other']

const userSchema = new Schema({
  email: {
    type: String,
    match: /^\S+@\S+\.\S+$/,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  gender: {
    type: String,
    enum: genders,
    required: true,
    default: 'male'
  },
  rating: {
    type: Number,
    default: 0
  },
  ratings: [ RatingSchema ],
  birthday: {
    type: Date,
    required: false,
  },
  age: {        //  "birthday": "02/19/1993"
    type: Number,
    required: false
  },
  services: {
    facebook: String,
    oneSignal: String
  },
  role: {
    type: String,
    enum: roles,
    required: true,
    default: 'user'
  },
  picture: {
    type: String,
    trim: true
  },
  pictures: {
    type: [String]
  },
  bio: {
    type: String
  },
  tags: {
    type: [String]
  },
  featured: {
    type: Boolean
  },
  conversations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
  }]
}, {
  timestamps: true
})

userSchema.path('email').set(function (email) {
  if (!this.picture || this.picture.indexOf('https://gravatar.com') === 0) {
    const hash = crypto.createHash('md5').update(email).digest('hex')
    this.picture = `https://gravatar.com/avatar/${hash}?d=identicon`
  }

  return email
})

userSchema.methods = {
  view (full) {
    let view = {}
    let fields = ['id', 'name', 'picture', 'gender', 'age', 'role', 'tags', 'rating']

    if (full) {
      fields = [...fields, 'email', 'createdAt', 'bio', 'pictures']
    }

    fields.forEach((field) => { view[field] = this[field] })

    return view
  }}

userSchema.statics = {
  roles,
  genders,

  createFromService ({ service, id, email, name, picture, gender, birthday, role }, create) {
    return this.findOne({ $or: [{ [`services.${service}`]: id }, { email }] }).then((user) => {
      if (user) {
        user.services[service] = id
        user.name = name
        user.picture = picture
        user.gender = gender
        // if (birthday) {
        user.age = 21 //@TODO: implement age
        // }
        user.birthday = birthday
        return user.save()
      } else {
        if(create) return this.create({ services: { [service]: id }, age: 21, email, name, picture, gender, role, birthday }) //@TODO: implement age
      }
    })
  },
  findFeatured (cursor) {
    return this.find({featured:  true}, {}, cursor).then((users) => {
      return users
    })
  },
  findNew ({ limit, skip }) {
    return this.find({role:  'advisor'}, {}, {limit, skip, sort: {createdAt: -1}}).then((users) => {
      return users
    })
  },
  findOnline (cursor) {
    return this.find({role: 'advisor'}, {}, cursor).then((users) => {
      return users
    })
  },
  rate (user, rating) {
    if (rating === 0) return false
    return this.find({ _id: this._id, 'ratings.user': user._id })
      .then(async (users) => {
        if (users) return false
        if (this.ratings.length === 0) {
          this.rating = rating
        } else {
          this.rating = ((this.rating * this.ratings.length) + rating) / (this.ratings.length + 1)  
        }
        this.ratings.push({ user:  user._id, target: this._id, rating })
        await this.save()
        return true
      })
  }
}

userSchema.plugin(mongooseKeywords, { paths: ['email', 'name'] })

const model = mongoose.model('User', userSchema)

export const schema = model.schema
export default model
