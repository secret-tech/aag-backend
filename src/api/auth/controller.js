import { sign } from '../../services/jwt'
import { success } from '../../services/response/'
import User from '../user/model'

export const login = async (req, res, next) => {
  if(req.body.playerId && req.body.playerId !== '') {
    req.user.services.oneSignal = req.body.playerId
    await req.user.save()
  }
  sign(req.user.id)
    .then((token) => ({ token, user: req.user.view(true) }))
    .then(success(res, 201))
    .catch(next)
}