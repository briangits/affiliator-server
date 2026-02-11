import { Router } from 'express'
import { DI } from '../../../di'
import { PaymentService } from '../../../services/payment'

const service = DI.resolve(PaymentService)

const router: Router = Router()

router.post('/paystack', async (req, res) => {
    res.status(200).message('Event processed successfully').end()

    await service.processCallback(req.body).catch((e: any) => console.error(e))
})

export { router as Payments }
