import { Service } from '../service'
import { RegistrationEvents } from './registartion.events'
import { NewUser } from './registration.types'
import { UserManagementService } from '../users'
import { ClientManagementService } from '../clients'

export class RegistrationService extends Service<RegistrationEvents> {
    private users: UserManagementService
    private clients: ClientManagementService

    constructor(
        events: RegistrationEvents,
        users: UserManagementService,
        clients: ClientManagementService
    ) {
        super(events)

        this.users = users
        this.clients = clients
    }

    async register(user: NewUser): Promise<Result<void>> {
        const [newUser, userError] = await this.users.register({
            username: user.username,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            password: user.password
        })

        if (userError) return Result.error(userError.code, userError.message)

        const [_, clientError] = await this.clients.register({
            username: newUser.username,
            invitor: user.invitor
        })

        if (clientError) return Result.error(clientError.code, clientError.message)

        this.events.emit('userRegistered', {
            username: newUser.username,
            email: newUser.email,
            invitor: user.invitor
        })

        return Result.ok()
    }
}
