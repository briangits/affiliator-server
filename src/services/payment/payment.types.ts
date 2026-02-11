import { PaymentMetadata, PaymentStatus, PaymentType } from '../../shared/types/payment'

export { PaymentStatus, PaymentType }

export type Payment = {
    type: PaymentType
    reference: string
    phoneNumber: string
    amount: number
    meta: PaymentMetadata
    status: PaymentStatus
}

export type PaymentRequest = Pick<Payment, 'type' | 'phoneNumber' | 'amount' | 'meta'>
