import { handleError } from '../../utils/error-handler'
import { Service } from '../service'
import { Profile, ProfileUpdate } from './user-profile.types'
import { User, UserManagementService } from '../users'

export class UserProfileService extends Service {
    private users: UserManagementService

    constructor(users: UserManagementService) {
        super()

        this.users = users
    }

    private toProfile(user: User): Profile {
        return {
            username: user.username,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber
        }
    }

    async getUserProfile(userId: number): Promise<Profile> {
        const user = await this.users.getUser(userId)
        if (!user) throw error('AccountNotFound')

        return this.toProfile(user)
    }

    async updateProfile(userId: number, update: ProfileUpdate): Promise<Result<Profile>> {
        const [user, error] = await this.users.updateUser(userId, {
            username: update.username,
            name: update.name,
            email: update.email,
            phoneNumber: update.phoneNumber
        })

        if (error) {
            return handleError(
                { code: error.code },
                {
                    AccountNotFound: Result.error('AccountNotFound'),
                    UsernameTaken: Result.error('UsernameTaken'),
                    EmailRegistered: Result.error('EmailRegistered'),
                    PhoneNumberRegistered: Result.error('PhoneNumberRegistered')
                }
            )
        }

        const profile = this.toProfile(user)

        return Result.ok(profile)
    }
}
