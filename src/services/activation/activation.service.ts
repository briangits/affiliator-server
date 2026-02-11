import { ClientStatus } from '../../domains/client'
import { ActivationRequest } from './activation.types'
import { Activations } from '../../domains/activation'
import { PaymentService } from '../payment'
import { PaymentStatus, PaymentType } from '../../shared/types/payment'
import { ActivationSettings } from './activation.settings'
import { ActivationEvents } from './activation.events'
import { Service } from '../service'
import { cache } from '../../cache'
import { ClientManagementService } from '../clients'
import { UserManagementService } from '../users'

const ActivationStatusCache = cache.createKey<ClientStatus, [clientId: number]>(
    'client-activation-status',
    {
        ttl: 60 * 10
    }
)

export class ActivationService extends Service<ActivationEvents> {
    private activations: Activations
    private users: UserManagementService
    private clients: ClientManagementService
    private paymentService: PaymentService

    constructor(
        events: ActivationEvents,
        activations: Activations,
        users: UserManagementService,
        clients: ClientManagementService,
        paymentService: PaymentService
    ) {
        super(events)

        this.activations = activations
        this.users = users
        this.clients = clients
        this.paymentService = paymentService

        this.paymentService.events.onStatusChange(async ({ reference, status }) => {
            await this.handlePaymentResult({ reference, status })
        })
    }

    async getActivationFee(): Promise<number> {
        return await ActivationSettings.activationFee.get()
    }

    async getClientStatus(clientId: number): Promise<ClientStatus> {
        return await cache.getOrElse(ActivationStatusCache(clientId), async () => {
            const client = await this.clients.getClient(clientId)
            if (!client) throw error('ClientNotFound', `client(id: ${clientId}) not found`)

            return client.status
        })
    }

    async initiateActivation(request: ActivationRequest): Promise<Result> {
        const client = await this.clients.getClient(request.clientId)
        if (!client) return Result.error('AccountNotFound')

        if (client.status !== ClientStatus.Inactive) return Result.error('AccountAlreadyActive')

        const user = await this.users.getUserByUsername(client.username)
        if (!user) return Result.error('AccountNotFound')

        try {
            const activation = await this.activations.initiate({
                clientId: request.clientId
            })

            const activationFee = await ActivationSettings.activationFee.get()

            const [payment, error] = await this.paymentService.initiatePayment({
                type: PaymentType.Charge,
                phoneNumber: request.phoneNumber,
                amount: activationFee,
                meta: {
                    recipient: {
                        username: user.username,
                        name: user.name,
                        email: user.email,
                        phoneNumber: user.phoneNumber
                    },
                    reason: 'Account activation'
                }
            })

            if (error) {
                // TODO: Report incident
                return Result.error('PaymentFailed')
            }

            await this.activations.setPaymentReference(activation.id, payment.reference)

            return Result.ok()
        } catch (error) {
            throw error
        }
    }

    private async handlePaymentResult(payment: {
        reference: string
        status: PaymentStatus
    }): Promise<Result> {
        const activation = await this.activations.getByPaymentReference(payment.reference)
        if (!activation) return Result.ok()

        switch (payment.status) {
            case PaymentStatus.Cancelled:
            case PaymentStatus.Failed:
                await this.activations.markAsFailed(activation.id)
                return Result.ok()
            case PaymentStatus.Completed:
                await this.activations.markAsCompleted(activation.id)

                await this.clients.updateClient(activation.clientId, {
                    status: ClientStatus.Active
                })

                await cache.set(ActivationStatusCache(activation.clientId), ClientStatus.Active)
                this.events.emit('clientActivated', activation.clientId)

                return Result.ok()
        }

        return Result.ok()
    }
}
