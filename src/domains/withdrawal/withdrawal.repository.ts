import { WithdrawalDAO } from './withdrawal.dao'
import { NewWithdrawal, Withdrawal } from './withdrawal.types'
import { sequelize } from '../../app/utils/filters'

function toWithdrawal(dao: WithdrawalDAO): Withdrawal {
    return {
        id: dao.id,
        clientId: dao.clientId,
        amount: dao.amount,
        status: dao.status,
        initiatedAt: dao.createdAt,
        paymentRef: dao.paymentRef
    }
}

export class WithdrawalRepository {
    private async find(query: Partial<Withdrawal>): Promise<Withdrawal | null> {
        const withdrawal = await WithdrawalDAO.findOne({ where: query })
        if (!withdrawal) return null

        return toWithdrawal(withdrawal)
    }

    async findById(id: number): Promise<Withdrawal | null> {
        return this.find({ id })
    }

    async findByPaymentRef(paymentRef: string): Promise<Withdrawal | null> {
        return this.find({ paymentRef })
    }

    async findAll(
        filters?: Filters<Withdrawal>,
        options?: { offset?: number; limit?: number }
    ): Promise<Withdrawal[]> {
        const withdrawals = await WithdrawalDAO.findAll({
            where: sequelize(filters),
            ...options
        })

        return withdrawals.map(toWithdrawal)
    }

    async count(filters?: Filters<Withdrawal>): Promise<number> {
        return await WithdrawalDAO.count({ where: sequelize(filters) })
    }

    async sumAmount(filters?: Filters<Withdrawal>): Promise<number> {
        return (
            (await WithdrawalDAO.sum('amount', {
                where: sequelize(filters)
            })) || 0
        )
    }

    async create(withdrawal: NewWithdrawal): Promise<Withdrawal> {
        const newWithdrawal = await WithdrawalDAO.create({
            clientId: withdrawal.clientId,
            amount: withdrawal.amount
        })

        return toWithdrawal(newWithdrawal)
    }

    async update(id: number, update: Partial<Withdrawal>): Promise<Withdrawal> {
        const withdrawal = await WithdrawalDAO.findOne({ where: { id } })
        if (!withdrawal) throw new Error('Withdrawal not found')

        const updatedWithdrawal = await withdrawal.update({
            status: update.status,
            paymentRef: update.paymentRef
        })

        return toWithdrawal(updatedWithdrawal)
    }

    async delete(id: number): Promise<void> {
        const withdrawal = await WithdrawalDAO.findOne({ where: { id } })
        if (!withdrawal) throw new Error('Withdrawal not found')

        await withdrawal.destroy()
    }
}
