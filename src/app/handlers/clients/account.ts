import express, { Router } from 'express'
import { ClientAuth } from '../../middleware/auth'
import { DI } from '../../../di'
import { ClientAccountService } from '../../../services/client-account'

const service = DI.resolve(ClientAccountService)

const router: Router = Router()

router.use(express.json())
router.use(ClientAuth)

router.get('/', async (req, res) => {
    const account = await service.getAccount(req.user.id)

    return res.json(account)
})

export { router as Account }
