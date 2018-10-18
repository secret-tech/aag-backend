import { Router } from 'express'
import { login, register } from './controller'
import { facebook, registerFacebook } from '../../services/passport'

const router = new Router()

/**
 * @api {post} /auth/facebook Authenticate with Facebook
 * @apiName AuthenticateFacebook
 * @apiGroup Auth
 * @apiParam {String} access_token Facebook user accessToken.
 * @apiSuccess (Success 201) {String} token User `access_token` to be passed to other requests.
 * @apiSuccess (Success 201) {Object} user Current user's data.
 * @apiError 401 Invalid credentials.
 */
router.post('/facebook',
  facebook(),
  login)

router.post('/registerFacebok',
  registerFacebook(),
  register)

export default router
