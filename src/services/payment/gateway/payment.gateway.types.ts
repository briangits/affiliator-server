import { PaymentMetadata } from '../../../shared/types/payment'
import { PaymentStatus } from '../payment.types'

export type GatewayPaymentRequest = {
    reference: string
    phoneNumber: string
    amount: number
    meta: PaymentMetadata
}

export type GatewayPayment = {
    reference: string
    transactionId: string
    status: PaymentStatus
}
