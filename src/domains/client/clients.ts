import { ClientRepository } from './client.repository'
import { Client, ClientUpdate, NewClient } from './client.types'

export class Clients {
    private repository: ClientRepository

    constructor(repository: ClientRepository) {
        this.repository = repository
    }

    async getById(id: number): Promise<Client | null> {
        return this.repository.findById(id)
    }

    async getByUserId(userId: number): Promise<Client | null> {
        return this.repository.findByUserId(userId)
    }

    async exists(userId: number): Promise<boolean> {
        return (await this.getByUserId(userId)) !== null
    }

    private async assertExists(id: number): Promise<Client> {
        const client = await this.repository.findById(id)
        requireNotNull(client, 'ClientNotFound')

        return client
    }

    async getInvitor(id: number): Promise<Client | null> {
        const client = await this.assertExists(id)

        const invitorId = client.invitorId
        if (!invitorId) return null

        return this.repository.findById(invitorId)
    }

    async getAll(
        filters?: Filters<Client>,
        options?: { offset?: number; limit?: number }
    ): Promise<Client[]> {
        return this.repository.findAll(filters, options)
    }

    async getInvitees(
        id: number,
        filters?: Pick<Filters<Client>, 'status'>,
        options?: { offset?: number; limit?: number }
    ) {
        await this.assertExists(id)
        return this.repository.findAll({ ...filters, invitorId: { eq: id } }, options)
    }

    async getCount(filters?: Filters<Client>): Promise<number> {
        return this.repository.count(filters)
    }

    async register(user: NewClient): Promise<Client> {
        return this.repository.create(user)
    }

    async update(id: number, update: ClientUpdate): Promise<Client> {
        await this.assertExists(id)
        return this.repository.update(id, update)
    }

    async incrementBalance(id: number, amount: number): Promise<Client> {
        await this.assertExists(id)
        return this.repository.updateBalance(id, amount)
    }

    async decrementBalance(id: number, amount: number): Promise<Client> {
        await this.assertExists(id)
        return this.repository.updateBalance(id, -amount)
    }

    async delete(id: number): Promise<void> {
        await this.assertExists(id)
        return this.repository.delete(id)
    }
}
