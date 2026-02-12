import { ClientStatus } from '../../domains/client'
import { ActivationRequest, ActivationState } from './activation.types'
import { Activations, ActivationStatus } from '../../domains/activation'
import { PaymentService } from '../payment'
import { PaymentStatus, PaymentType } from '../../shared/types/payment'
import { ActivationSettings } from './activation.settings'
import { ActivationEvents } from './activation.events'
import { Service } from '../service'
import { cache } from '../../cache'
import { ClientManagementService } from '../clients'
import { UserManagementService } from '../users'

const ActivationStatusCache = cache.createKey<ActivationState, [clientId: number]>(
    'client-activation-state',
    {
        ttl: 60 * 10
    }
)

export class ActivationService extends Service<ActivationEvents> {
    private activations: Activations
    private users: UserManagementService
    private clients: ClientManagementService
    private payments: PaymentService

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
        this.payments = paymentService

        this.payments.events.onStatusChange(async ({ reference, status }) => {
            await this.handlePaymentResult({ reference, status })
        })
    }

    async getActivationFee(): Promise<number> {
        return await ActivationSettings.activationFee.get()
    }

    async getStatus(clientId: number): Promise<ActivationState> {
        return await cache.getOrElse(ActivationStatusCache(clientId), async () => {
            const client = await this.clients.getClient(clientId)
            if (!client) throw error('ClientNotFound', `client(id: ${clientId}) not found`)

            if (client.status === ClientStatus.Active) return ActivationState.Completed

            const pendingActivations = await this.activations.getAll({
                clientId,
                status: ActivationStatus.Pending
            })
            if (pendingActivations.length <= 0) return ActivationState.NoneInProgress

            pendingActivations.forEach(activation => {
                if (!activation.paymentRef) return
                this.payments.checkPayment(activation.paymentRef)
            })

            return ActivationState.InProgress
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

            const [payment, error] = await this.payments.initiatePayment({
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
                await this.activations.markAsFailed(activation.id)

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
                await cache.clear(ActivationStatusCache(activation.clientId))

                return Result.ok()
            case PaymentStatus.Completed:
                await this.activations.markAsCompleted(activation.id)

                await this.clients.updateClient(activation.clientId, {
                    status: ClientStatus.Active
                })

                await cache.set(
                    ActivationStatusCache(activation.clientId),
                    ActivationState.Completed
                )
                this.events.emit('clientActivated', activation.clientId)

                return Result.ok()
        }

        return Result.ok()
    }
}
