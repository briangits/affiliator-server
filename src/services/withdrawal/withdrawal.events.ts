import { Events } from '../../events'

type WithdrawalEventMap = {
    request: [{ clientId: number; amount: number }]
    rejected: [{ reference: string }]
    failed: [{ reference: string }]
    completed: [{ reference: string }]
}

export class WithdrawalEvents extends Events<WithdrawalEventMap> {
    constructor() {
        super()
    }

    onRequest = this.createHandler('request')
    onRejected = this.createHandler('rejected')
    onFailed = this.createHandler('failed')
    onCompleted = this.createHandler('completed')
}
