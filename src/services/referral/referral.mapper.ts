import { Client } from '../clients'
import { Referral } from './referral.types'
import { User } from '../users'

export const ReferralMapper = {
    fromClient(user: User, client: Client): Referral {
        return {
            username: user.username,
            name: user.name,
            status: client.status,
            joinedOn: user.joinedOn
        }
    }
}
