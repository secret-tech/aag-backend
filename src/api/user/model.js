import crypto from 'crypto'
import mongoose, { Schema } from 'mongoose'
import mongooseKeywords from 'mongoose-keywords'

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
  },
  birthday: {
    type: Date,
    required: false,
  },
  age: {        //  "birthday": "02/19/1993"
    type: Number,
    required: false
  },
  services: {
    facebook: String
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
  bio: {
    type: String
  },
  tags: {
    type: [String]
  }
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
    let fields = ['id', 'name', 'picture', 'gender', 'age', 'role', 'tags']

    if (full) {
      fields = [...fields, 'email', 'createdAt', 'bio']
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
  }
}

userSchema.plugin(mongooseKeywords, { paths: ['email', 'name'] })

const model = mongoose.model('User', userSchema)

export const schema = model.schema
export default model
