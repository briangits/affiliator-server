import { ActivationRepository } from './activation.repository'
import { Activation, ActivationStatus, NewActivation } from './activation.types'

export class Activations {
    private repository: ActivationRepository

    constructor(repository: ActivationRepository) {
        this.repository = repository
    }

    async initiate(request: NewActivation): Promise<Activation> {
        return await this.repository.create(request)
    }

    async getByPaymentReference(paymentRef: string): Promise<Activation | null> {
        return await this.repository.findByPaymentReference(paymentRef)
    }

    async count(filters?: Filters<Activation>): Promise<number> {
        return await this.repository.count(filters)
    }

    async getAll(
        filters?: Filters<Activation>,
        options?: { offset?: number; limit?: number }
    ): Promise<Activation[]> {
        return this.repository.findAll(filters, options)
    }

    private async assertExist(id: number): Promise<Activation> {
        const activation = await this.repository.findById(id)
        if (!activation) throw error('ActivationNotFound')

        return activation
    }

    async setPaymentReference(id: number, paymentRef: string): Promise<Activation> {
        await this.assertExist(id)

        return await this.repository.update(id, { paymentRef })
    }

    private async updateStatus(id: number, status: ActivationStatus): Promise<Activation> {
        const activation = await this.assertExist(id)

        const allowedTransitions: {
            [key in ActivationStatus]: ActivationStatus[]
        } = {
            [ActivationStatus.Pending]: [ActivationStatus.Failed, ActivationStatus.Completed],
            [ActivationStatus.Failed]: [ActivationStatus.Completed],
            [ActivationStatus.Completed]: []
        }

        if (!allowedTransitions[activation.status].includes(status))
            throw error('InvalidStatusTransition')

        return await this.repository.update(activation.id, { status })
    }

    async markAsFailed(id: number): Promise<Activation> {
        return await this.updateStatus(id, ActivationStatus.Failed)
    }

    async markAsCompleted(id: number): Promise<Activation> {
        return await this.updateStatus(id, ActivationStatus.Completed)
    }
}
