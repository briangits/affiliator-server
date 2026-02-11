export enum PaymentStatus {
    Pending = 'pending',
    Cancelled = 'cancelled',
    Failed = 'failed',
    Completed = 'completed'
}

export enum PaymentType {
    Charge = 'charge',
    Payout = 'payout'
}

export type PaymentMetadata = {
    recipient: {
        username: string
        name: string
        email: string
        phoneNumber: string
    }
    reason: string
}
