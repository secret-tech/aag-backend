import { success, notFound } from '../../services/response/'
import { User } from '.'
import faker from 'faker'

export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  User.count(query)
    .then(count => User.find(query, select, cursor)
      .then(users => ({
        rows: users.map((user) => user.view()),
        count
      }))
    )
    .then(success(res))
    .catch(next)

export const show = ({ params }, res, next) =>
  User.findById(params.id)
    .then(notFound(res))
    .then((user) => user ? user.view() : null)
    .then(success(res))
    .catch(next)

export const showMe = ({ user }, res) =>
  res.json(user.view(true))

export const create = ({ bodymen: { body } }, res, next) =>
  User.create(body)
    .then((user) => user.view(true))
    .then(success(res, 201))
    .catch((err) => {
      /* istanbul ignore else */
      if (err.name === 'MongoError' && err.code === 11000) {
        res.status(409).json({
          valid: false,
          param: 'email',
          message: 'email already registered'
        })
      } else {
        next(err)
      }
    })

export const update = ({ bodymen: { body }, params, user }, res, next) =>
  User.findById(params.id === 'me' ? user.id : params.id)
    .then(notFound(res))
    .then((result) => {
      if (!result) return null
      const isAdmin = user.role === 'admin'
      const isSelfUpdate = user.id === result.id
      if (!isSelfUpdate && !isAdmin) {
        res.status(401).json({
          valid: false,
          message: 'You can\'t change other user\'s data'
        })
        return null
      }
      return result
    })
    .then((user) => user ? Object.assign(user, body).save() : null)
    .then((user) => user ? user.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ params }, res, next) =>
  User.findById(params.id)
    .then(notFound(res))
    .then((user) => user ? user.remove() : null)
    .then(success(res, 204))
    .catch(next)


export const updateTags = ({bodymen: {body}, params, user}, res, next) => {
  User.findById(user.id)
    .then(notFound(res))
    .then((user) => {
      user.tags = body.tags
      user.save()
      res.status(200).json(user)
    });
}


export const updateBio = ({bodymen: {body}, params, user}, res, next) => {
  User.findById(user.id)
    .then(notFound(res))
    .then((user) => {
      user.bio = body.bio
      user.save()
      res.status(200).json(user)
    });
}

export const addFakeAdvisors = (req, res, next) => {
  let users = []
  console.log("Start faking data")
  for(let i = 0; i < 100; i++)  {
    let tags = []
    const kw =  Math.floor(Math.random()*10) + 1
    for(let j = 0; j < kw; j++) {
      tags.push(faker.lorem.word())
    }
    const advisor = {
        email: faker.internet.email(),
        name: faker.name.firstName() + ' ' + faker.name.lastName(),
        gender: 'female',
        role: 'advisor',
        birthday: faker.date.past(),
        picture: faker.image.fashion(),
        bio: faker.lorem.paragraph(),
        tags: tags,
        featured: Math.random() < 0.1,
    }
    User.create(advisor)
  }
  res.status(200).json({status: "ok"})
}