import { UserRepository } from './user.repository'
import { NewUser, User, UserUpdate } from './user.types'

export class Users {
    private readonly repository: UserRepository

    constructor(repository: UserRepository) {
        this.repository = repository
    }

    async get(filters: Filters<User>): Promise<User | null> {
        return this.repository.find(filters)
    }

    async getById(id: number): Promise<User | null> {
        return await this.get({ id: { eq: id } })
    }

    async getByUsername(username: string): Promise<User | null> {
        return await this.get({ username: { eq: username } })
    }

    async getByEmail(email: string): Promise<User | null> {
        return await this.get({ email: { eq: email } })
    }

    async getAll(
        filters?: Filters<User>,
        options?: { offset?: number; limit?: number }
    ): Promise<User[]> {
        return await this.repository.findAll(filters, options)
    }

    async search(
        query: string,
        filters?: Filters<User>,
        options?: { offset?: number; limit?: number }
    ): Promise<User[]> {
        return await this.repository.search(query, filters, options)
    }

    async register(user: NewUser): Promise<User> {
        if ((await this.repository.count({ username: { eq: user.username } })) > 0)
            throw error('UsernameAlreadyExists')
        if ((await this.repository.count({ email: { eq: user.email } })) > 0)
            throw error('EmailAlreadyExists')
        if ((await this.repository.count({ phoneNumber: { eq: user.phoneNumber } })) > 0)
            throw error('PhoneNumberAlreadyExists')

        return await this.repository.create(user)
    }

    async update(id: number, update: UserUpdate): Promise<User> {
        const user = await this.getById(id)
        if (!user) throw error('UserNotFound')

        if (
            update.username !== user.username &&
            (await this.repository.count({ username: { eq: update.username } })) > 0
        )
            throw error('UsernameAlreadyExists')
        if (
            update.email !== user.email &&
            (await this.repository.count({ email: { eq: update.email } })) > 0
        )
            throw error('EmailAlreadyExists')
        if (
            update.phoneNumber !== user.phoneNumber &&
            (await this.repository.count({
                phoneNumber: { eq: update.phoneNumber }
            })) > 0
        )
            throw error('PhoneNumberAlreadyExists')

        return await this.repository.update(id, update)
    }

    async updatePassword(id: number, newPassword: string): Promise<void> {
        const user = await this.getById(id)
        requireNotNull(user, 'UserNotFound')

        await this.repository.update(user.id, {
            password: newPassword
        })
    }

    async validatePassword(
        username: string,
        validator: (password: string) => Promise<boolean>
    ): Promise<User | null> {
        const user = await this.getByUsername(username)
        if (!user) return null

        return (await validator(user.password)) ? user : null
    }

    async delete(userId: number): Promise<User> {
        const user = await this.getById(userId)
        requireNotNull(user, 'UserNotFound')

        await this.repository.delete(user.id)

        return user
    }
}
