import { Events } from '../../events'

type RegistrationEventMap = {
    userRegistered: [{ username: string; email: string; invitor?: string }]
}

export class RegistrationEvents extends Events<RegistrationEventMap> {
    constructor() {
        super()
    }

    onUserRegistered = this.createHandler('userRegistered')
}
