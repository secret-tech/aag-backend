import { sign } from '../../services/jwt'
import { success } from '../../services/response/'
import User from '../user/model'

export const login = async (req, res, next) => {
  req.user.services.oneSignal = req.body.playerId
  await req.user.save()
  console.log("Saved user: ", req.user)
  sign(req.user.id)
    .then((token) => ({ token, user: req.user.view(true) }))
    .then(success(res, 201))
    .catch(next)
}