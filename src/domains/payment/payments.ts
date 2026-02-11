import { PaymentRepository } from './payment.repository'
import { Payment, PaymentRequest, PaymentStatus } from './payment.types'
import generateUniqueReference from '../../utils/uniqe-reference'

export class Payments {
    private repository: PaymentRepository

    constructor(repository: PaymentRepository) {
        this.repository = repository
    }

    async getByReference(reference: string): Promise<Payment | null> {
        return this.repository.findByReference(reference)
    }

    async getCount(filters?: Filters<Payment>): Promise<number> {
        return this.repository.count(filters)
    }

    async getAll(
        filters?: Filters<Payment>,
        options?: { offset?: number; limit?: number }
    ): Promise<Payment[]> {
        return this.repository.findAll(filters, options)
    }

    async getByPhoneNumber(
        phoneNumber: string,
        filters?: Filters<Payment>,
        options?: { offset?: number; limit?: number }
    ): Promise<Payment[]> {
        return this.repository.findAll({ ...filters, phoneNumber: { eq: phoneNumber } }, options)
    }

    async initiate(payment: PaymentRequest): Promise<Payment> {
        const reference = await generateUniqueReference(6, 100, async candidate => {
            return (await this.repository.findByReference(candidate)) === null
        })

        const newPayment = await this.repository.create({ ...payment, reference })
        return newPayment
    }

    private async updateStatus(id: number, status: PaymentStatus): Promise<Payment> {
        const payment = await this.repository.findById(id)
        requireNotNull(payment, 'PaymentNotFound')

        const allowedTransitions: { [key in PaymentStatus]: PaymentStatus[] } = {
            [PaymentStatus.Pending]: [
                PaymentStatus.Cancelled,
                PaymentStatus.Failed,
                PaymentStatus.Completed
            ],
            [PaymentStatus.Cancelled]: [PaymentStatus.Failed, PaymentStatus.Completed],
            [PaymentStatus.Failed]: [PaymentStatus.Completed],
            [PaymentStatus.Completed]: []
        }

        requireCondition(
            allowedTransitions[payment.status].includes(status),
            'InvalidStatusTransitition'
        )

        return await this.repository.update(payment.id, { status })
    }

    async markAsCancelled(id: number): Promise<Payment> {
        return this.updateStatus(id, PaymentStatus.Cancelled)
    }

    async markAsFailed(id: number): Promise<Payment> {
        return this.updateStatus(id, PaymentStatus.Failed)
    }

    async markAsCompleted(id: number): Promise<Payment> {
        return this.updateStatus(id, PaymentStatus.Completed)
    }
}
