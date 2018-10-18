import passport from 'passport'
import { Strategy as BearerStrategy } from 'passport-http-bearer'
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt'
import { jwtSecret, masterKey } from '../../config'
import * as facebookService from '../facebook'
import User from '../../api/user/model'

export const facebook = () =>
  passport.authenticate('facebook', { session: false })

export const registerFacebook = () =>
  passport.authenticate('registerFacebook', { session: false })

export const master = () =>
  passport.authenticate('master', { session: false })

export const token = ({ required, roles = User.roles } = {}) => (req, res, next) =>
  passport.authenticate('token', { session: false }, (err, user, info) => {
    if (err || (required && !user) || (required && !~roles.indexOf(user.role))) {
      return res.status(401).end()
    }
    req.logIn(user, { session: false }, (err) => {
      if (err) return res.status(401).end()
      next()
    })
  })(req, res, next)

passport.use('facebook', new BearerStrategy((token, done) => {
  facebookService.getUser(token).then((user) => {
      User.findOne({ email: user.email }).then((dbUser) => {
        if (dbUser) {
          return User.createFromService(user)      
        }
        return {exists: false};
      });
  }).then((user) => {
    done(null, user)
    return null
  }).catch(done)
}))

passport.use('registerFacebook', new BearerStrategy((token, done) => {
  facebookService.getUser(token).then((user) => {
      User.findOne({ email: user.email }).then((dbUser) => {
        if (!dbUser) {
          done(null, user)
        }
        return null
      });
  }).catch(done)
}))

passport.use('master', new BearerStrategy((token, done) => {
  if (token === masterKey) {
    done(null, {})
  } else {
    done(null, false)
  }
}))

passport.use('token', new JwtStrategy({
  secretOrKey: jwtSecret,
  jwtFromRequest: ExtractJwt.fromExtractors([
    ExtractJwt.fromUrlQueryParameter('access_token'),
    ExtractJwt.fromBodyField('access_token'),
    ExtractJwt.fromAuthHeaderWithScheme('Bearer')
  ])
}, ({ id }, done) => {
  User.findById(id).then((user) => {
    done(null, user)
    return null
  }).catch(done)
}))
