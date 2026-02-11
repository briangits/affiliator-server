import { UserDAO } from './user.dao'
import { NewUser, User } from './user.types'
import { sequelize } from '../../app/utils/filters'
import { Op } from 'sequelize'

function toUser(dao: UserDAO): User {
    return {
        id: dao.id,
        username: dao.username,
        name: dao.name,
        email: dao.email,
        phoneNumber: dao.phoneNumber,
        joinedOn: dao.createdAt,
        password: dao.password
    }
}

export class UserRepository {
    async find(filters: Filters<User>): Promise<User | null> {
        const user = await UserDAO.findOne({ where: sequelize(filters) })
        if (!user) return null

        return toUser(user)
    }

    async count(filters?: Filters<User>): Promise<number> {
        return UserDAO.count({
            where: sequelize(filters)
        })
    }

    async findAll(
        filters?: Filters<User>,
        options?: { offset?: number; limit?: number }
    ): Promise<User[]> {
        const users = await UserDAO.findAll({
            where: sequelize(filters),
            ...options
        })

        return users.map(toUser)
    }

    async search(
        query: string,
        filters?: Filters<User>,
        options?: { offset?: number; limit?: number }
    ): Promise<User[]> {
        const users = await UserDAO.findAll({
            where: {
                [Op.or]: [
                    { username: { [Op.like]: `%${query}%` } },
                    { name: { [Op.like]: `%${query}%` } },
                    { email: { [Op.like]: `%${query}%` } },
                    { phoneNumber: { [Op.like]: `%${query}%` } }
                ],
                ...sequelize(filters)
            },
            ...options
        })

        return users.map(toUser)
    }

    async create(user: NewUser): Promise<User> {
        const dao = await UserDAO.create({
            username: user.username,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            password: user.password
        })

        return toUser(dao)
    }

    async update(id: number, update: Partial<NewUser>): Promise<User> {
        const user = await UserDAO.findOne({ where: { id } })
        if (!user) throw new Error('User not found')

        if (update.username) user.username = update.username
        if (update.name) user.name = update.name
        if (update.email) user.email = update.email
        if (update.phoneNumber) user.phoneNumber = update.phoneNumber
        if (update.password) user.password = update.password

        const updatedUser = await user.save()
        return toUser(updatedUser)
    }

    async delete(id: number): Promise<void> {
        const user = await UserDAO.findOne({ where: { id } })
        if (!user) throw new Error('User not found')

        await user.destroy()
    }
}
