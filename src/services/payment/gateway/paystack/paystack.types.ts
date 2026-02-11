export enum Currency {
    KES = 'KES'
}

export type PaymentRequest = {
    reference: string
    amount: number
    email: string
    currency: Currency
    mobile_money: {
        phone: string
        provider: string
    }
    // callback_url: string
}

export type RequestResponse = {
    status: boolean
    data: {
        reference: string
        status: string
    }
}

export type CallbackData = {
    event: string
    data: {
        id?: string | number
        status: string
        reference: string
        amount: number
    }
}

export enum RecipientType {
    MobileMoney = 'mobile_money'
}

export enum BankCodes {
    MPesa = 'MPESA'
}

export type NewRecipient = {
    type: RecipientType
    name: string
    bank_code: BankCodes
    account_number: string
    currency: Currency
}

export type TransferRecipient = {
    data: {
        recipient_code: string
    }
}

export enum TransferSource {
    Balance = 'balance'
}

export type TransferRequest = {
    source: TransferSource
    reference: string
    recipient: string
    amount: number
    currency: Currency
}

export type Transfer = {
    status: boolean
    data: {
        status: string
        reference: string
    }
}
