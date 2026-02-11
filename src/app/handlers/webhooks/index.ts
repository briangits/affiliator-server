import { Router } from 'express'
import { Payments } from './payments'

const router: Router = Router()

router.use('/payments', Payments)

export { router as Webhooks }
