import { sign } from '../../services/jwt'
import { success } from '../../services/response/'
import User from '../user/model'

/**
 * Returns data for the main explorer page 
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
export const explore = ({ querymen: { cursor } }, res, next) => {
    User.findFeatured(cursor).then((featured) => {
        User.findNew(cursor).then((newAdvisors) => {
            User.findOnline(cursor).then((online) => {
                res.status(200).json([
                    { type: 'featured', advisors: featured }, 
                    {type: 'online', advisors: online }, 
                    {type: 'new', advisors: newAdvisors }
                ])
            })
        })
    })
}

/**
 * Returns data for "Online now explorer section"
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
export const exploreOnline = ({ querymen: { cursor } }, res, next) => {
    User.findOnline(cursor).then((data) => {
        res.status(200).json({ data })
    })
}

/**
 * Returns data for "Featured advisors" explorer section
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
export const exploreFeatured = ({ querymen: { cursor } }, res, next) => {
    User.findFeatured(cursor).then((data) => {
        res.status(200).json({ data })
    })
}

/**
 * Returns data for "New advisors" section
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
export const exploreNew = ({ querymen: { cursor } }, res, next) => {
    User.findNew(cursor).then((data) => {
        res.status(200).json({ data })
    })
}