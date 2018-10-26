import { Router } from 'express'
import { middleware as query } from 'querymen'
import { middleware as body } from 'bodymen'
import { master, token } from '../../services/passport'
import { createConversation } from './controller'

const router = new Router()

router.post('/',
    token({required: true}),
    createConversation)

export default router