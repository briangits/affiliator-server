import { User as DomainUser } from '../../domains/user'
import { User } from './users.types'

export const UserMapper = {
    fromDomain(user: DomainUser): User {
        return {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            joinedOn: user.joinedOn
        }
    },
    filters(filters?: Filters<User>): Filters<DomainUser> | undefined {
        if (!filters) return undefined

        return {
            id: filters.id,
            username: filters.username,
            name: filters.name,
            email: filters.email,
            phoneNumber: filters.phoneNumber,
            joinedOn: filters.joinedOn
        }
    }
}
