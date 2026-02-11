import { NewWithdrawal, Withdrawal, WithdrawalStatus } from './withdrawal.types'
import { WithdrawalRepository } from './withdrawal.repository'

export class Withdrawals {
    private repository: WithdrawalRepository

    constructor(repository: WithdrawalRepository) {
        this.repository = repository
    }

    async getById(id: number): Promise<Withdrawal | null> {
        return this.repository.findById(id)
    }

    async getByPaymentReference(paymentRef: string): Promise<Withdrawal | null> {
        return this.repository.findByPaymentRef(paymentRef)
    }

    async getCount(filters?: Filters<Withdrawal>): Promise<number> {
        return this.repository.count(filters)
    }

    async getAll(
        filters?: Filters<Withdrawal>,
        options?: { offset?: number; limit?: number }
    ): Promise<Withdrawal[]> {
        return this.repository.findAll(filters, options)
    }

    async getByClient(
        clientId: number,
        filters?: Filters<Withdrawal>,
        options?: { offset?: number; limit?: number }
    ): Promise<Withdrawal[]> {
        return this.repository.findAll({ ...filters, clientId: { eq: clientId } }, options)
    }

    async sumAmount(filters?: Filters<Withdrawal>): Promise<number> {
        return this.repository.sumAmount(filters)
    }

    async initiate(withdrawal: NewWithdrawal): Promise<Withdrawal> {
        return this.repository.create(withdrawal)
    }

    async setPaymentReference(id: number, paymentRef: string): Promise<Withdrawal> {
        return this.repository.update(id, { paymentRef })
    }

    private async updateStatus(id: number, status: WithdrawalStatus): Promise<Withdrawal> {
        const withdrawal = await this.repository.findById(id)
        requireNotNull(withdrawal, 'WithdrawalNotFound')

        const allowedTransitions: {
            [key in WithdrawalStatus]: WithdrawalStatus[]
        } = {
            [WithdrawalStatus.Pending]: [WithdrawalStatus.Rejected, WithdrawalStatus.Completed],
            [WithdrawalStatus.Rejected]: [],
            [WithdrawalStatus.Failed]: [WithdrawalStatus.Completed],
            [WithdrawalStatus.Completed]: []
        }

        if (!allowedTransitions[withdrawal.status].includes(status))
            throw error('InvalidStatusTransition')

        return this.repository.update(id, { status })
    }

    async markAsRejected(id: number): Promise<Withdrawal> {
        return this.updateStatus(id, WithdrawalStatus.Rejected)
    }

    async markAsFailed(id: number): Promise<Withdrawal> {
        return this.updateStatus(id, WithdrawalStatus.Failed)
    }

    async markAsCompleted(id: number): Promise<Withdrawal> {
        return this.updateStatus(id, WithdrawalStatus.Completed)
    }
}
