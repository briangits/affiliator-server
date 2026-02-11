import { WithdrawalStatus } from '../../shared/types/withdrawal'

export { WithdrawalStatus }

export type Withdrawal = {
    id: number
    clientId: number
    amount: number
    status: WithdrawalStatus
    initiatedAt: Date
    paymentRef?: string
}

export type NewWithdrawal = Pick<Withdrawal, 'clientId' | 'amount'>

export type WithdrawalFilters = {
    clientId?: number
    status?: WithdrawalStatus
    amount?: { gte?: number; lte?: number }
    initiatedAt?: { gte?: Date; lte?: Date }
}
