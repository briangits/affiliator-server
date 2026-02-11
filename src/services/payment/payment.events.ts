import { Events } from '../../events'
import { PaymentStatus } from './payment.types'

type PaymentEventMap = {
    initiated: [{ reference: string }]
    cancelled: [{ reference: string }]
    failed: [{ reference: string }]
    completed: [{ reference: string }]

    statusChange: [{ reference: string; status: PaymentStatus }]
}

export class PaymentEvents extends Events<PaymentEventMap> {
    constructor() {
        super()
    }

    onStatusChange = this.createHandler('statusChange')

    emitStatusChange(data: { reference: string; status: PaymentStatus }) {
        this.emit('statusChange', data)

        when(data.status, {
            [PaymentStatus.Cancelled]: () => this.emit('cancelled', { reference: data.reference }),
            [PaymentStatus.Failed]: () => this.emit('failed', { reference: data.reference }),
            [PaymentStatus.Completed]: () => this.emit('completed', { reference: data.reference })
        })
    }
}
