import express, { Router } from 'express'
import { DI } from '../../../di'
import { ActivationService } from '../../../services/activation'
import { field, validate } from '../../validators/validate'
import { toPhoneNumber } from '../../validators/transforms'
import { ClientAuth } from '../../middleware/auth'

const service = DI.resolve(ActivationService)

const router: Router = Router()

router.use(express.json())

router.get('/fee', async (req, res) => {
    const activationFee = await service.getActivationFee()

    return res.send({ activationFee })
})

router.get('/status', ClientAuth, async (req, res) => {
    const status = await service.getClientStatus(req.client.id)

    return res.send({ status })
})

router.post('/', ClientAuth, async (req, res) => {
    const { phoneNumber } = validate(req.getBody(), {
        phoneNumber: () => field(toPhoneNumber)
    })

    const [_, error] = (
        await service.initiateActivation({
            clientId: req.client.id,
            phoneNumber
        })
    ).destructured

    if (error) {
        return when(error.code, {
            AccountNotFound: () => res.status(401).message('You are not logged in'),
            AccountAlreadyActive: () =>
                res.status(409).error('AccountAlreadyActive', 'Your account is already active'),
            else: () => {
                throw error
            }
        })
    }

    return res.status(201).message('Request successful, check your phone to complete the payment')
})

export { router as Activation }
