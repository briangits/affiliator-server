import { Payments } from '../../domains/payment'
import { Service } from '../service'
import { GatewayPaymentRequest, PaymentGateway } from './gateway'
import { PaymentEvents } from './payment.events'
import { Payment, PaymentRequest, PaymentStatus, PaymentType } from './payment.types'

export class PaymentService extends Service<PaymentEvents> {
    private payments: Payments
    private gateway: PaymentGateway

    constructor(events: PaymentEvents, payments: Payments, gateway: PaymentGateway) {
        super(events)

        this.payments = payments
        this.gateway = gateway
    }

    async initiatePayment(request: PaymentRequest): Promise<Result<Payment>> {
        const payment = await this.payments.initiate({
            type: request.type,
            phoneNumber: request.phoneNumber,
            amount: request.amount,
            meta: request.meta
        })

        const gatewayRequest: GatewayPaymentRequest = {
            reference: payment.reference,
            phoneNumber: payment.phoneNumber,
            amount: payment.amount,
            meta: payment.meta
        }

        const [_, error] =
            request.type === PaymentType.Charge
                ? await this.gateway.initiateCharge(gatewayRequest)
                : await this.gateway.initiatePayout(gatewayRequest)

        if (error) {
            // TODO: Report incident
            await this.payments.markAsFailed(payment.id)
            return Result.error('InitializationFailed')
        }

        this.events.emit('initiated', { reference: payment.reference })
        this.events.emitStatusChange({ reference: payment.reference, status: payment.status })

        return Result.ok(payment)
    }

    async processCallback(data: any): Promise<Result> {
        const [gatewayPayment, error] = await this.gateway.processCallback(data)

        if (error) {
            // TODO: Report incident
            return Result.error('CallbackProcessingFailed')
        }

        const { reference, status } = gatewayPayment

        const payment = await this.payments.getByReference(reference)
        if (!payment) {
            // TODO: Report incident
            return Result.error('UnknownPayment')
        }

        if (payment.status === status) {
            return Result.ok()
        }

        const terminalStates = [
            PaymentStatus.Completed,
            PaymentStatus.Failed,
            PaymentStatus.Cancelled
        ]
        if (terminalStates.includes(payment.status)) {
            return Result.ok()
        }

        try {
            switch (status) {
                case PaymentStatus.Cancelled:
                    await this.payments.markAsCancelled(payment.id)
                    this.events.emitStatusChange({
                        reference: payment.reference,
                        status: PaymentStatus.Failed
                    })
                    break
                case PaymentStatus.Failed:
                    await this.payments.markAsFailed(payment.id)
                    this.events.emitStatusChange({
                        reference: payment.reference,
                        status: PaymentStatus.Failed
                    })
                    break
                case PaymentStatus.Completed:
                    await this.payments.markAsCompleted(payment.id)
                    this.events.emitStatusChange({
                        reference: payment.reference,
                        status: PaymentStatus.Completed
                    })
                    break
            }

            return Result.ok()
        } catch (error) {
            // TODO: Report incident
            console.error(error)
            return Result.error('CallbackProcessingFailed')
        }
    }
}
