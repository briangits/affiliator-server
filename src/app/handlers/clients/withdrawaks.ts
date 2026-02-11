import express, { Router } from 'express'
import { DI } from '../../../di'
import {
    type WithdrawalFilters,
    WithdrawalService,
    WithdrawalStatus
} from '../../../services/withdrawal'
import { field, optionalField, validate } from '../../validators/validate'
import { toEnum, toNumber } from '../../validators/transforms'
import { ActiveClientAuth, ClientAuth } from '../../middleware/auth'

const service = DI.resolve(WithdrawalService)

const router: Router = Router()

router.use(express.json())
router.use(ClientAuth)

router.get('/stats', async (req, res) => {
    const stats = await service.getStats(req.client.id)
    return res.send(stats)
})

router.get('/range', async (req, res) => {
    const range = await service.getAmountRange()
    return res.send(range)
})

router.get('/', async (req, res) => {
    const { offset, limit, status } = validate(req.query, {
        offset: () => optionalField(toNumber),
        limit: () => optionalField(toNumber),
        status: () => optionalField(toEnum(WithdrawalStatus))
    })

    const filters: WithdrawalFilters = { status }

    if (status) filters.status = status

    const total = await service.getCount(req.client.id, filters)

    const withdrawals = await service.getWithdrawals(req.client.id, filters, {
        offset,
        limit
    })

    return res.json({ total, withdrawals })
})

router.post('/', ActiveClientAuth, async (req, res) => {
    const range = await service.getAmountRange()

    const { amount } = validate(req.getBody(), {
        amount: () =>
            field(toNumber, value => [
                [value > 0, 'Must be greater than KES 0', 'InvalidAmount'],
                [
                    value >= range.min,
                    `The minimum amount you can withdraw is ${range.min}`,
                    'BelowMinAmount'
                ],
                [
                    value <= range.max,
                    `The maximum amount you can withdraw is ${range.max}`,
                    'ExceedsMaxAmount'
                ]
            ])
    })

    const [_, error] = (
        await service.initiateWithdrawal({
            clientId: req.client.id,
            amount
        })
    ).destructured

    if (error) {
        return when(error.code, {
            AccountNotFound: () => res.status(401).message('You are not logged in'),
            InsufficientBalance: () =>
                res
                    .status(400)
                    .error('InsufficientBalance', 'Your account balance is insufficient'),
            BelowMinAmount: () =>
                res
                    .status(400)
                    .error(
                        'BelowMinAmount',
                        `The minimum amount you can withdraw is KES ${range.min}`
                    ),
            ExceedsMaxAmount: () =>
                res
                    .status(400)
                    .error(
                        'ExceedsMaxAmount',
                        `The maximum amount you can withdraw is KES ${range.max}`
                    ),
            else: () => {
                throw error
            }
        })
    }

    return res.status(201).message('Withdrawal intiated successfully')
})

export { router as Withdrawals }
