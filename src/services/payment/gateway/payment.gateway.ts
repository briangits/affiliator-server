import { GatewayPayment, GatewayPaymentRequest } from './payment.gateway.types'

export interface PaymentGateway {
    initiateCharge(request: GatewayPaymentRequest): Promise<Result<GatewayPayment>>

    initiatePayout(request: GatewayPaymentRequest): Promise<Result<GatewayPayment>>

    getPayment(reference: string): Promise<Result<GatewayPayment | null>>

    processCallback(data: any): Promise<Result<GatewayPayment>>
}
