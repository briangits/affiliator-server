import { NewPayment, Payment } from './payment.types'
import { PaymentDAO } from './payment.dao'
import { sequelize } from '../../app/utils/filters'

function toPayment(dao: PaymentDAO): Payment {
    return {
        id: dao.id,
        type: dao.type,
        reference: dao.reference,
        phoneNumber: dao.phoneNumber,
        amount: dao.amount,
        meta: dao.meta,
        initiatedAt: dao.createdAt,
        status: dao.status
    }
}

class PaymentRepository {
    private async find(query: Partial<PaymentDAO>): Promise<Payment | null> {
        const payment = await PaymentDAO.findOne({ where: query })
        if (!payment) return null

        return toPayment(payment)
    }

    async findById(id: number): Promise<Payment | null> {
        return this.find({ id })
    }

    async findByReference(reference: string): Promise<Payment | null> {
        return this.find({ reference })
    }

    async count(filters?: Filters<Payment>): Promise<number> {
        return PaymentDAO.count({ where: sequelize(filters) })
    }

    async findAll(
        filters?: Filters<Payment>,
        options?: { offset?: number; limit?: number }
    ): Promise<Payment[]> {
        const payments = await PaymentDAO.findAll({
            where: sequelize(filters),
            ...options
        })

        return payments.map(toPayment)
    }

    async create(payment: NewPayment): Promise<Payment> {
        const newPayment = await PaymentDAO.create({
            type: payment.type,
            reference: payment.reference,
            phoneNumber: payment.phoneNumber,
            amount: payment.amount,
            meta: payment.meta
        })

        return toPayment(newPayment)
    }

    async update(id: number, update: Partial<Payment>) {
        const payment = await PaymentDAO.findOne({ where: { id } })
        if (!payment) throw new Error("Can't update payment, it doesn't exist")

        const updatedPayment = await payment.update({
            status: update.status
        })

        return toPayment(updatedPayment)
    }

    async delete(id: number): Promise<void> {
        const payment = await PaymentDAO.findOne({ where: { id } })
        if (!payment) throw new Error("Cannot delete payment, it doesn't exist")

        await payment.destroy()
    }
}

export { PaymentRepository }
