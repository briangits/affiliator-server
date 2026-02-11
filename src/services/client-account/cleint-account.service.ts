import { Service } from '../service'
import { ClientAccount } from './client-account.types'
import { UserManagementService } from '../users'
import { ClientManagementService } from '../clients'

export class ClientAccountService extends Service {
    private users: UserManagementService
    private clients: ClientManagementService

    constructor(users: UserManagementService, clients: ClientManagementService) {
        super()

        this.users = users
        this.clients = clients
    }

    async getAccount(userId: number): Promise<ClientAccount> {
        const client = await this.clients.getClientByUserId(userId)
        if (!client) throw error('AccountNotFound')

        return {
            invitor: client.invitor,
            status: client.status,
            balance: client.balance
        }
    }
}
