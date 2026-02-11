import { ClientDAO } from './client.dao'
import { Client, NewClient } from './client.types'
import { sequelize } from '../../app/utils/filters'

async function toClient(dao: ClientDAO): Promise<Client> {
    return {
        id: dao.id,
        userId: dao.userId,
        invitorId: dao.invitorId,
        status: dao.status,
        balance: dao.balance
    }
}

export class ClientRepository {
    private async find(query: Partial<ClientDAO>): Promise<Client | null> {
        const client = await ClientDAO.findOne({ where: query })
        if (!client) return null

        return toClient(client)
    }

    async findById(id: number): Promise<Client | null> {
        return this.find({ id })
    }

    async findByUserId(userId: number): Promise<Client | null> {
        return this.find({ userId })
    }

    async count(filters?: Filters<Client>): Promise<number> {
        return await ClientDAO.count({ where: sequelize(filters) })
    }

    async findAll(
        filters?: Filters<Client>,
        options?: { offset?: number; limit?: number }
    ): Promise<Client[]> {
        const clients = await ClientDAO.findAll({
            where: sequelize(filters),
            offset: options?.offset,
            limit: options?.limit
        })

        return Promise.all(clients.map(toClient))
    }

    async create(client: NewClient): Promise<Client> {
        const existing = await this.findById(client.userId)
        if (existing) throw new Error('Client already exists')

        if (client.invitorId) {
            const invitor = await this.findById(client.invitorId)
            if (!invitor) throw new Error('Invitor not found')
        }

        const newClient = await ClientDAO.create({
            userId: client.userId,
            invitorId: client.invitorId
        })

        return toClient(newClient)
    }

    async update(id: number, update: Partial<Client>): Promise<Client> {
        const client = await ClientDAO.findOne({ where: { id } })
        if (!client) throw new Error('Client not found')

        const updatedClient = await client.update({
            status: update.status,
            balance: update.balance
        })

        return toClient(updatedClient)
    }

    async updateBalance(id: number, delta: number): Promise<Client> {
        const client = await ClientDAO.findOne({ where: { id } })
        if (!client) throw new Error('Client not found')

        client.increment('balance', { by: delta })
        const updatedClient = await client.reload()

        return toClient(updatedClient)
    }

    async delete(id: number): Promise<void> {
        const client = await ClientDAO.findOne({ where: { id } })
        if (!client) throw new Error('Client not found')

        await client.destroy()
    }
}
