import { sequelize } from '../../app/utils/filters'
import { ActivationDAO } from './activation.dao'
import { Activation, NewActivation } from './activation.types'

function toActivation(dao: ActivationDAO): Activation {
    return {
        id: dao.id,
        clientId: dao.clientId,
        paymentRef: dao.paymentRef,
        status: dao.status,
        initiatedAt: dao.createdAt
    }
}

export class ActivationRepository {
    async findById(id: number): Promise<Activation | null> {
        const dao = await ActivationDAO.findOne({ where: { id } })
        if (!dao) return null

        return toActivation(dao)
    }

    async findByPaymentReference(paymentRef: string): Promise<Activation | null> {
        const activation = await ActivationDAO.findOne({
            where: { paymentRef }
        })

        return activation ? toActivation(activation) : null
    }

    async count(filters?: Filters<Activation>): Promise<number> {
        return ActivationDAO.count({ where: sequelize(filters) })
    }

    async findAll(
        filters?: Filters<Activation>,
        options?: { offset?: number; limit?: number }
    ): Promise<Activation[]> {
        const activations = await ActivationDAO.findAll({
            where: sequelize(filters),
            ...options
        })

        return activations.map(toActivation)
    }

    async create(activation: NewActivation): Promise<Activation> {
        const dao = await ActivationDAO.create({
            clientId: activation.clientId
        })

        return toActivation(dao)
    }

    async update(id: number, update: Partial<Activation>): Promise<Activation> {
        const dao = await ActivationDAO.findOne({ where: { id } })
        if (!dao) throw new Error('Activation not found')

        await dao.update({
            paymentRef: update.paymentRef,
            status: update.status
        })

        return toActivation(dao)
    }

    async delete(id: number): Promise<void> {
        const dao = await ActivationDAO.findOne({ where: { id } })
        if (!dao) throw new Error('Activation not found')

        await dao.destroy()
    }
}
