import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { master, token } from '../../services/passport'
import { explore, exploreNew, exploreOnline, exploreFeatured } from './controller'
import User from '../user/model'


const router = new Router()

router.get('/',
    token({ required: true }),
    query(),
    explore)

router.get('/new',
    token({ required: true }),
    query(),
    exploreNew)

router.get('/online',
    token({ required: true }),
    query(),
    exploreOnline)

router.get('/featured',
    token({ required: true }),
    query(),
    exploreFeatured)

export default router