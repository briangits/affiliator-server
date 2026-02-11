import { PaymentMetadata, PaymentStatus, PaymentType } from '../../shared/types/payment'

export { PaymentStatus, PaymentType, PaymentMetadata }

export type Payment = {
    id: number
    type: PaymentType
    reference: string
    phoneNumber: string
    amount: number
    meta: PaymentMetadata
    initiatedAt: Date
    status: PaymentStatus
}

export type NewPayment = Pick<Payment, 'type' | 'reference' | 'phoneNumber' | 'amount' | 'meta'>
export type PaymentRequest = Omit<NewPayment, 'reference'>
