import { Router } from 'express'
import { Token } from './token'
import { RefreshToken } from './refresh-token'

const router: Router = Router()

router.use('/token', Token)
router.use('/token/refresh', RefreshToken)

export { router as Auth }
