import { Client as DomainClient } from '../../domains/client'
import { Client } from './clients.types'
import { User } from '../users'

export const ClientMapper = {
    fromDomain(client: DomainClient, user: User, invitor?: Client): Client {
        return {
            id: client.id,
            username: user.username,
            invitor: invitor?.username || null,
            status: client.status,
            balance: client.balance
        }
    },
    filters(
        filters?: Filters<Client> & {
            invitorId?: Filters<number>
            userId?: Filter<number>
        }
    ): Filters<DomainClient> | undefined {
        return {
            id: filters?.id,
            userId: filters?.userId,
            invitorId: filters?.invitorId,
            status: filters?.status,
            balance: filters?.balance
        }
    }
}
