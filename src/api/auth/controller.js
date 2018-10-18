import { sign } from '../../services/jwt'
import { success } from '../../services/response/'
import User from '../user/model'

export const login = ({ user }, res, next) => {
  if (user.id) {
    console.log("user:", user)
    sign(user.id)
    .then((token) => ({ token, user: user.view(true) }))
    .then(success(res, 201))
    .catch(next)
  } else {
    res.status(200).json({user: null})
  }
}

export const register = (req, res, next) => {
  req.user.role = req.body.role
  User.createFromService(req.user, true).then((user) => {
    sign(user.id)
    .then((token) => {
      res.status(201).json({token, user: user.view(true)})
    })
    .catch(next)
  })
  
}