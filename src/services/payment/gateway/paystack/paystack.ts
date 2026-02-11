import { PaymentStatus } from '../../payment.types'
import { PaymentGateway } from '../payment.gateway'
import { GatewayPayment, GatewayPaymentRequest } from '../payment.gateway.types'
import PaystackAPI from './paystack-api'
import {
    BankCodes,
    CallbackData,
    Currency,
    NewRecipient,
    PaymentRequest,
    RecipientType,
    RequestResponse,
    Transfer,
    TransferRecipient,
    TransferRequest,
    TransferSource
} from './paystack.types'

const CALLBACK_URL = process.env.PAYSTACK_CALLBACK_URL!

class PaystackMapper {
    static toAmountInCents(amount: number): number {
        return Math.round(amount * 100)
    }

    private static toPhoneNumber(phoneNumber: string): string {
        const stripped =
            phoneNumber.match(/^\+?(?:254|0)(?<phoneNumber>[17]\d{8})$/)?.groups?.phoneNumber ||
            null

        if (!stripped) throw new Error('Invalid phone number')

        return stripped
    }

    static formatChargePhoneNumber(phoneNumber: string): string {
        return `+254${PaystackMapper.toPhoneNumber(phoneNumber)}`
    }

    static formatPayoutNumber(phoneNumber: string): string {
        return `0${PaystackMapper.toPhoneNumber(phoneNumber)}`
    }

    static toGatewayPayment(
        reference: string,
        status: string,
        transactionId?: string
    ): GatewayPayment {
        return {
            reference,
            transactionId: transactionId ?? reference,
            status: when(status, {
                success: PaymentStatus.Completed,
                failed: PaymentStatus.Failed,
                reversed: PaymentStatus.Cancelled,
                else: PaymentStatus.Pending
            })
        }
    }
}

export class PaystackClient implements PaymentGateway {
    async initiateCharge(request: GatewayPaymentRequest): Promise<Result<GatewayPayment>> {
        try {
            const res = await PaystackAPI.post<RequestResponse, PaymentRequest>('/charge', {
                reference: request.reference,
                amount: PaystackMapper.toAmountInCents(request.amount),
                currency: Currency.KES,
                email: request.meta.recipient.email,
                mobile_money: {
                    phone: PaystackMapper.formatChargePhoneNumber(request.phoneNumber),
                    provider: 'mpesa'
                }
                // callback_url: CALLBACK_URL
            })

            const payment = res.data
            if (!payment.status) {
                console.error('Payment initialization error', payment)
                return Result.error('PaymentInitializationFailed')
            }

            return Result.ok(
                PaystackMapper.toGatewayPayment(payment.data.reference, payment.data.status)
            )
        } catch (e: any) {
            console.error('Payment initialization error', e)
            return Result.error('PaymentInitializationError', e.message)
        }
    }

    async initiatePayout(request: GatewayPaymentRequest): Promise<Result<GatewayPayment>> {
        const prepareRecipient = async () => {
            const res = await PaystackAPI.post<TransferRecipient, NewRecipient>(
                '/transferRecipient',
                {
                    type: RecipientType.MobileMoney,
                    name: request.meta.recipient.name,
                    bank_code: BankCodes.MPesa,
                    account_number: PaystackMapper.formatPayoutNumber(request.phoneNumber),
                    currency: Currency.KES
                }
            )

            return res.data
        }

        try {
            const recipient = await prepareRecipient()

            const res = await PaystackAPI.post<Transfer, TransferRequest>('/transfer', {
                source: TransferSource.Balance,
                recipient: recipient.data.recipient_code,
                reference: request.reference,
                amount: PaystackMapper.toAmountInCents(request.amount),
                currency: Currency.KES
            })

            const transfer = res.data
            if (!transfer.status) {
                console.error('Transfer initialization failed', transfer)
                return Result.error('InitializationFailed')
            }

            return Result.ok(
                PaystackMapper.toGatewayPayment(request.reference, transfer.data.status)
            )
        } catch (error) {
            console.error('Transfer initialization failed', error)
            return Result.error('InitializationFailed')
        }
    }

    async getPayment(reference: string): Promise<Result<GatewayPayment | null>> {
        try {
            const res = await PaystackAPI.get<RequestResponse>(`/transaction/verify/${reference}`)
            const data = res.data
            if (!data.status) return Result.ok(null)

            return Result.ok(PaystackMapper.toGatewayPayment(data.data.reference, data.data.status))
        } catch (e) {
            return Result.ok(null)
        }
    }

    async processCallback(data: any): Promise<Result<GatewayPayment>> {
        try {
            const callback: CallbackData = typeof data === 'string' ? JSON.parse(data) : data

            const reference = callback.data.reference
            const status = callback.data.status
            const transactionId = callback.data.reference || reference

            return when<Result<GatewayPayment>>(callback.event, {
                'charge.success': () =>
                    Result.ok(
                        PaystackMapper.toGatewayPayment(reference, status, String(transactionId))
                    ),
                'transfer.success': () =>
                    Result.ok(
                        PaystackMapper.toGatewayPayment(reference, status, String(transactionId))
                    ),
                'transfer.failed': () =>
                    Result.ok(
                        PaystackMapper.toGatewayPayment(reference, 'failed', String(transactionId))
                    ),
                'transfer.reversed': () =>
                    Result.ok(
                        PaystackMapper.toGatewayPayment(
                            reference,
                            'reversed',
                            String(transactionId)
                        )
                    ),
                else: () => {
                    console.error('Unknown payment event', callback.event)
                    return Result.error('UnknownCallbackEvent')
                }
            })
        } catch (e: any) {
            console.error('Payment error', e)
            return Result.error('CallbackProcessingFailed')
        }
    }
}
