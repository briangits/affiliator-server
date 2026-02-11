import express, { Router } from 'express'
import { optionalField, validate } from '../../validators/validate'
import { toEnum, toNumber } from '../../validators/transforms'
import { ClientStatus } from '../../../domains/client'
import { ReferralService } from '../../../services/referral'
import { DI } from '../../../di'
import { ClientAuth } from '../../middleware/auth'

const service = DI.resolve(ReferralService)

const router: Router = Router()

router.use(express.json())

router.get('/reward', async (req, res) => {
    const reward = await service.getReferralReward()
    return res.json({ referralReward: reward })
})

router.get('/stats', ClientAuth, async (req, res) => {
    const stats = await service.getStats(req.user.id)
    return res.json(stats)
})

router.get('/', ClientAuth, async (req, res) => {
    const { offset, limit, status } = validate(req.query, {
        offset: () => optionalField(toNumber),
        limit: () => optionalField(toNumber),
        status: () => optionalField(toEnum(ClientStatus))
    })

    const total = await service.getReferralsCount(req.user.id, { status })

    const referrals = await service.getReferrals(req.user.id, { status }, { offset, limit })

    return res.json({ total, referrals })
})

export { router as Referrals }
