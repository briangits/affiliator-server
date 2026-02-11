import { settings } from '../../domains/setting'

export const WithdrawalSettings = settings('withdrawal', {
    minAmount: 200,
    maxAmount: 100000,
    percentageFee: 10.0,
    instantWithdrawals: true
})
