import { sign } from '../../services/jwt'
import { success } from '../../services/response/'
import User from '../user/model'

export const login = (req, res, next) => {
  console.log("Req: ", req.body);
  sign(req.user.id)
    .then((token) => ({ token, user: req.user.view(true) }))
    .then(success(res, 201))
    .catch(next)
}