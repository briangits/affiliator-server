import { Withdrawals, WithdrawalStatus } from '../../domains/withdrawal'
import { PaymentService } from '../payment'
import { PaymentStatus, PaymentType } from '../payment/payment.types'
import { Service } from '../service'
import { WithdrawalEvents } from './withdrawal.events'
import { WithdrawalSettings } from './withdrawal.settings'
import {
    AmountRange,
    Withdrawal,
    WithdrawalFilters,
    WithdrawalRequest,
    WithdrawalStats
} from './withdrawal.types'
import { UserManagementService } from '../users'
import { ClientManagementService } from '../clients'
import { cache } from '../../cache'

const WithdrawalStatsCache = cache.createKey<WithdrawalStats, [clientId: number]>(
    'withdrawal-stats'
)

export class WithdrawalService extends Service<WithdrawalEvents> {
    private users: UserManagementService
    private clients: ClientManagementService
    private withdrawals: Withdrawals

    private paymentService: PaymentService

    constructor(
        events: WithdrawalEvents,
        users: UserManagementService,
        clients: ClientManagementService,
        withdrawals: Withdrawals,
        paymentService: PaymentService
    ) {
        super(events)

        this.users = users
        this.clients = clients
        this.withdrawals = withdrawals
        this.paymentService = paymentService

        this.paymentService.events.onStatusChange(async ({ reference, status }) => {
            await this.handleWithdrawalResult({ reference, status })
        })
    }

    async getAmountRange(): Promise<AmountRange> {
        const minAmount = await WithdrawalSettings.minAmount.get()
        const maxAmount = await WithdrawalSettings.maxAmount.get()
        return { min: minAmount, max: maxAmount }
    }

    async getStats(clientId: number): Promise<WithdrawalStats> {
        return await cache.getOrElse(WithdrawalStatsCache(clientId), async () => {
            const [total, pending, completed, amountWithdrawn] = await Promise.all([
                this.withdrawals.getCount({ clientId }),
                this.withdrawals.getCount({
                    clientId,
                    status: WithdrawalStatus.Pending
                }),
                this.withdrawals.getCount({
                    clientId,
                    status: WithdrawalStatus.Completed
                }),
                this.withdrawals.sumAmount({
                    clientId,
                    status: WithdrawalStatus.Completed
                })
            ])

            return { total, pending, completed, amountWithdrawn }
        })
    }

    async getCount(clientId: number, filters?: WithdrawalFilters): Promise<number> {
        return await this.withdrawals.getCount({
            clientId,
            status: filters?.status
        })
    }

    async getWithdrawals(
        clientId: number,
        filters?: WithdrawalFilters,
        options?: { offset?: number; limit?: number }
    ): Promise<Withdrawal[]> {
        return await this.withdrawals.getByClient(
            clientId,
            {
                status: filters?.status
            },
            options
        )
    }

    private async getPayableAmount(amount: number): Promise<number> {
        const percentageFee = await WithdrawalSettings.percentageFee.get()
        const fee = amount * (percentageFee / 100)
        return amount - fee
    }

    private async initiatePayment(withdrawalId: number) {
        const withdrawal = await this.withdrawals.getById(withdrawalId)
        if (!withdrawal) throw error('WithdrawalNotFound')

        const client = await this.clients.getClient(withdrawal.clientId)
        if (!client) {
            // TODO: Log incident
            throw error('ClientNotFound')
        }

        const user = await this.users.getUserByUsername(client.username)
        if (!user) {
            // TODO: Log incident
            throw error('UserNotFound')
        }

        const payableAmount = await this.getPayableAmount(withdrawal.amount)

        const [payment, err] = await this.paymentService.initiatePayment({
            type: PaymentType.Payout,
            amount: payableAmount,
            phoneNumber: user.phoneNumber,
            meta: {
                recipient: {
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    phoneNumber: user.phoneNumber
                },
                reason: 'Earnings withdrawal'
            }
        })

        if (err) return

        await this.withdrawals.setPaymentReference(withdrawal.id, payment.reference)
    }

    async initiateWithdrawal(request: WithdrawalRequest): Promise<Result<Withdrawal>> {
        const client = await this.clients.getClient(request.clientId)
        if (!client) return Result.error('AccountNotFound')

        if (client.balance < request.amount) {
            return Result.error('InsufficientBalance')
        }

        const minAmount = await WithdrawalSettings.minAmount.get()
        if (request.amount < minAmount) {
            return Result.error('BelowMinAmount')
        }

        const maxAmount = await WithdrawalSettings.maxAmount.get()
        if (request.amount > maxAmount) {
            return Result.error('ExceedsMaxAmount')
        }

        this.events.emit('request', {
            clientId: request.clientId,
            amount: request.amount
        })

        try {
            const withdrawal = await this.withdrawals.initiate({
                clientId: client.id,
                amount: request.amount
            })

            const [_, error] = await this.clients.decrementBalance(client.id, withdrawal.amount)
            if (error) {
                // TODO: Report incident
                throw error
            }

            await cache.clear(WithdrawalStatsCache(client.id))

            if (await WithdrawalSettings.instantWithdrawals.get())
                await this.initiatePayment(withdrawal.id)

            return Result.ok({
                amount: withdrawal.amount,
                initiatedAt: withdrawal.initiatedAt,
                status: withdrawal.status
            })
        } catch (e) {
            throw e
        }
    }

    private async handleWithdrawalResult(payment: {
        reference: string
        status: PaymentStatus
    }): Promise<Result> {
        const withdrawal = await this.withdrawals.getByPaymentReference(payment.reference)
        if (!withdrawal) return Result.ok()

        switch (payment.status) {
            case PaymentStatus.Failed:
                await this.withdrawals.markAsFailed(withdrawal.id)
                await cache.clear(WithdrawalStatsCache(withdrawal.clientId))
                return Result.ok()
            case PaymentStatus.Completed:
                await this.withdrawals.markAsCompleted(withdrawal.id)
                await cache.clear(WithdrawalStatsCache(withdrawal.clientId))
                return Result.ok()
        }

        return Result.ok()
    }
}
