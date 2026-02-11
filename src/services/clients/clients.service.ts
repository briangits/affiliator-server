import { Service } from '../service'
import { Clients } from '../../domains/client'
import { UserManagementService } from '../users'
import { Client, ClientUpdate, NewClient } from './clients.types'
import { ClientMapper } from './clients.mapper'
import { cache } from '../../cache'

const ClientCache = cache.createKey<Client, [id: number]>('client')
const ClientByUserIdCache = cache.createKey<Client, [userId: number]>('client-by-userId')

export class ClientManagementService extends Service {
    private clients: Clients
    private users: UserManagementService

    constructor(clients: Clients, users: UserManagementService) {
        super()

        this.clients = clients
        this.users = users
    }

    async getClient(id: number): Promise<Client | null> {
        return await cache.getOrElse(ClientCache(id), async () => {
            const client = await this.clients.getById(id)
            if (!client) return null

            const user = await this.users.getUser(client.userId)
            if (!user) {
                // TODO: Log incident
                throw error(
                    'UserAccountNotFound',
                    `User account for Client(${client.id}) not found`
                )
            }

            return ClientMapper.fromDomain(client, user)
        })
    }

    async getClientByUserId(userId: number): Promise<Client | null> {
        return await cache.getOrElse(ClientByUserIdCache(userId), async () => {
            const client = await this.clients.getByUserId(userId)
            if (!client) return null

            const user = await this.users.getUser(client.userId)
            if (!user) {
                // TODO: Log incident
                throw error(
                    'UserAccountNotFound',
                    `User account for Client(${client.id}) not found`
                )
            }

            return ClientMapper.fromDomain(client, user)
        })
    }

    async getClients(
        filters?: Filters<Client>,
        options?: { offset?: number; limit?: number }
    ): Promise<Client[]> {
        const users = await this.users.getUsers({ username: filters?.username })
        const uInviters = await this.users.getUsers({
            username: filters?.invitor as Filters<string>
        })
        const inviters = await uInviters
            .map(async user => await this.getClientByUserId(user.id))
            .resolveAll()

        const clients = await this.clients.getAll(
            {
                ...ClientMapper.filters(filters),
                userId: { in: users.map(user => user.id) },
                invitorId: { in: inviters.map(invitor => invitor?.id || null) }
            },
            options
        )

        return await clients
            .map(async client => {
                const user = await this.users.getUser(client.userId)
                if (!user) {
                    // TODO: Log incident
                    return null
                }

                return ClientMapper.fromDomain(client, user)
            })
            .resolveAll()
            .then(clients => clients.filter(client => client !== null))
    }

    async searchClients(
        query: string,
        filters?: Filters<Client>,
        options?: { offset?: number; limit?: number }
    ): Promise<Client[]> {
        return this.getClients({ ...filters, username: { like: query } }, options)
    }

    async getInvitor(clientId: number): Promise<Client | null> {
        const client = await this.clients.getInvitor(clientId)
        if (!client || !client.invitorId) return null

        return this.getClient(client.invitorId)
    }

    async getInvitees(
        clientId: number,
        filters?: Pick<Filters<Client>, 'status'>,
        options?: { offset?: number; limit?: number }
    ): Promise<Client[]> {
        const client = await this.getClient(clientId)
        if (!client) return []

        return this.getClients({ ...filters, invitor: client.username }, options)
    }

    async getReferralCount(clientId: number, filters?: Filters<Client>): Promise<number> {
        return await this.clients.getCount({
            ...ClientMapper.filters(filters),
            invitorId: { eq: clientId }
        })
    }

    async register(client: NewClient): Promise<Result<Client>> {
        try {
            const user = await this.users.getUserByUsername(client.username)
            if (!user) return Result.error('UserNotRegistered')

            let invitor: Client | null = null
            if (client.invitor) {
                const uInvitor = await this.users.getUserByUsername(client.invitor)
                if (uInvitor) {
                    invitor = await this.getClientByUserId(uInvitor.id)
                }
            }

            const newClient = await this.clients.register({
                userId: user.id,
                invitorId: invitor?.id || null
            })

            const mappedClient = ClientMapper.fromDomain(newClient, user)

            await cache.set(ClientCache(newClient.id), mappedClient)
            await cache.set(ClientByUserIdCache(newClient.userId), mappedClient)

            return Result.ok(mappedClient)
        } catch (e: any) {
            return when(e.code, {
                UserNotFound: Result.error('AccountNotFound'),
                else: () => {
                    throw e
                }
            })
        }
    }

    async updateClient(id: number, update: ClientUpdate): Promise<Result<Client>> {
        try {
            const client = await this.clients.update(id, {
                status: update.status,
                balance: update.balance
            })

            await cache.clear(ClientCache(id))
            await cache.clear(ClientByUserIdCache(client.userId))

            const user = await this.users.getUser(client.userId)
            if (!user) {
                // TODO: Log incident
                throw error(
                    'UserAccountNotFound',
                    `User account for Client(${client.id}) not found`
                )
            }

            return ClientMapper.fromDomain(client, user)
                .also(async client => {
                    await cache.set(ClientCache(client.id), client)
                    await cache.set(ClientByUserIdCache(user.id), client)
                })
                .wrapAsResult()
        } catch (e: any) {
            return when(e.code, {
                ClientNofFound: Result.error('AccountNotFound'),
                else: () => {
                    throw e
                }
            })
        }
    }

    async incrementBalance(clientId: number, amount: number): Promise<Result<Client>> {
        try {
            const client = await this.clients.incrementBalance(clientId, amount)

            await cache.clear(ClientCache(clientId))
            await cache.clear(ClientByUserIdCache(client.userId))

            const updatedClient = await this.getClient(client.id)
            if (!updatedClient) return Result.error('AccountNotFound')

            return updatedClient.wrapAsResult()
        } catch (e: any) {
            return when(e.code, {
                ClientNotFound: Result.error('AccountNotFound'),
                else: () => {
                    throw e
                }
            })
        }
    }

    async decrementBalance(clientId: number, amount: number): Promise<Result<Client>> {
        try {
            const client = await this.clients.decrementBalance(clientId, amount)

            await cache.clear(ClientCache(clientId))
            await cache.clear(ClientByUserIdCache(client.userId))

            const updatedClient = await this.getClient(client.id)
            if (!updatedClient) return Result.error('AccountNotFound')

            return updatedClient.wrapAsResult()
        } catch (e: any) {
            return when(e.code, {
                ClientNotFound: Result.error('AccountNotFound'),
                else: () => {
                    throw e
                }
            })
        }
    }

    async deleteClient(id: number): Promise<Result> {
        try {
            await this.clients.delete(id)
            return Result.ok()
        } catch (e: any) {
            return when(e.code, {
                UserNotFound: Result.ok(),
                else: () => {
                    throw e
                }
            })
        }
    }
}
