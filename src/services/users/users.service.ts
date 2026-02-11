import { Service } from '../service'
import { NewUser, User, UserUpdate } from './users.types'
import { cache } from '../../cache'
import { Users } from '../../domains/user'
import { UserMapper } from './user.mapper'

const UserCache = cache.createKey<User | null, [id: number]>('user')
const UserByUsernameCache = cache.createKey<User, [username: string]>('user-by-username')

export class UserManagementService extends Service {
    private users: Users

    constructor(users: Users) {
        super()
        this.users = users
    }

    async getUser(id: number): Promise<User | null> {
        return await cache.getOrElse(UserCache(id), async () => {
            const user = await this.users.getById(id)
            if (!user) return null

            return UserMapper.fromDomain(user)
        })
    }

    async getUserByUsername(username: string): Promise<User | null> {
        return await cache.getOrElse(UserByUsernameCache(username), async () => {
            const user = await this.users.getByUsername(username)
            if (!user) return null

            return UserMapper.fromDomain(user)
        })
    }

    async getUsers(
        filters?: Filters<User>,
        options?: { offset?: number; limit?: number }
    ): Promise<User[]> {
        const users = await this.users.getAll(UserMapper.filters(filters), options)

        return users.map(user => UserMapper.fromDomain(user))
    }

    async searchUsers(
        query: string,
        filters?: Filters<User>,
        options?: { offset?: number; limit?: number }
    ): Promise<User[]> {
        const users = await this.users.search(query, UserMapper.filters(filters), options)

        return users.map(user => UserMapper.fromDomain(user))
    }

    async register(user: NewUser): Promise<Result<User>> {
        try {
            const newUser = await this.users.register({
                username: user.username,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                password: user.password
            })

            return UserMapper.fromDomain(newUser)
                .also(async user => {
                    await cache.set(UserCache(user.id), user)
                    await cache.set(UserByUsernameCache(user.username), user)
                })
                .wrapAsResult()
        } catch (e: any) {
            return when(e.code, {
                UsernameAlreadyExists: Result.error('UsernameAlreadyExists'),
                EmailAlreadyExists: Result.error('EmailAlreadyExists'),
                PhoneNumberAlreadyExists: Result.error('PhoneNumberAlreadyExists'),
                else: () => {
                    throw e
                }
            })
        }
    }

    async updateUser(id: number, update: UserUpdate): Promise<Result<User>> {
        try {
            const user = await this.users.update(id, {
                username: update.username,
                name: update.name,
                email: update.email,
                phoneNumber: update.phoneNumber
            })

            return UserMapper.fromDomain(user)
                .also(async user => {
                    await cache.set(UserCache(id), user)
                    await cache.set(UserByUsernameCache(user.username), user)
                })
                .wrapAsResult()
        } catch (e: any) {
            // TODO: Log incident
            console.error('Error updating user', e)

            return when(e.code, {
                UserNotFound: Result.error('AccountNotFound'),
                UsernameAlreadyExists: Result.error('UsernameTaken'),
                EmailAlreadyExists: Result.error('EmailRegistered'),
                PhoneNumberAlreadyExists: Result.error('PhoneNumberRegistered'),
                else: () => {
                    throw e
                }
            })
        }
    }

    async setPassword(id: number, password: string): Promise<Result> {
        try {
            await this.users.updatePassword(id, password)
            return Result.ok()
        } catch (e: any) {
            return when(e.code, {
                UserNotFound: Result.error('AccountNotFound'),
                else: () => {
                    throw e
                }
            })
        }
    }

    async deleteUser(id: number): Promise<Result<void>> {
        try {
            const user = await this.users.delete(id)
            await cache.clear(UserCache(user.id))
            await cache.clear(UserByUsernameCache(user.username))

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

    async validatePassword(
        username: string,
        validator: (hash: string) => Promise<boolean>
    ): Promise<User | null> {
        return await this.users.validatePassword(username, validator)
    }
}
