import { DataTypes, Model } from 'sequelize'
import sequelize from '../../database'
import { ClientStatus } from './client.types'
import { UserDAO } from '../user'

type Attributes = {
    id: number
    userId: number
    invitorId: number | null
    status: ClientStatus
    balance: number
}

type CreationAttributes = Pick<Attributes, 'userId' | 'invitorId'>

export class ClientDAO extends Model<Attributes, CreationAttributes> {
    declare readonly id: number
    declare readonly userId: number
    declare readonly invitorId: number | null
    declare balance: number
    declare status: ClientStatus

    declare readonly createdAt: Date

    declare getUser: () => Promise<UserDAO>

    declare getInvitor: () => Promise<ClientDAO | null>
    declare getInvitees: () => Promise<ClientDAO[]>
}

ClientDAO.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: UserDAO }
        },
        invitorId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
            references: { model: ClientDAO }
        },
        status: {
            type: DataTypes.ENUM(...Object.values(ClientStatus)),
            allowNull: false,
            defaultValue: ClientStatus.Inactive
        },
        balance: {
            type: DataTypes.FLOAT,
            allowNull: true,
            defaultValue: 0
        }
    },
    {
        sequelize: sequelize,
        tableName: 'Clients',
        modelName: 'Client',
        timestamps: true,
        defaultScope: { order: [['createdAt', 'DESC']] },
        indexes: [{ unique: true, fields: ['userId'] }]
    }
)

ClientDAO.belongsTo(UserDAO, { foreignKey: 'userId', as: 'user' })
ClientDAO.belongsTo(ClientDAO, { foreignKey: 'invitorId', as: 'invitor' })
ClientDAO.hasMany(ClientDAO, { foreignKey: 'invitorId', as: 'invitees' })

// await ClientDAO.sync()
