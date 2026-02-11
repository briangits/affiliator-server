import { WithdrawalStatus } from '../../shared/types/withdrawal'

export { WithdrawalStatus }

export type Withdrawal = {
    amount: number
    initiatedAt: Date
    status: WithdrawalStatus
}

export type WithdrawalRequest = {
    clientId: number
    amount: number
}

export type WithdrawalStats = {
    total: number
    pending: number
    completed: number
    amountWithdrawn: number
}

export type AmountRange = {
    min: number
    max: number
}

export type WithdrawalFilters = {
    status?: WithdrawalStatus
}
