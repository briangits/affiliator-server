import { Router } from 'express'
import { Withdrawals } from './withdrawaks'
import { Registration } from './registration'
import { Referrals } from './referrals'
import { Activation } from './activation'
import { Account } from './account'

const router: Router = Router()

router.use('/register', Registration)
router.use('/account', Account)
router.use('/activation', Activation)
router.use('/referrals', Referrals)
router.use('/withdrawals', Withdrawals)

export { router as Clients }
