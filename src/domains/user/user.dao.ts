import { DataTypes, Model } from 'sequelize'
import sequelize from '../../database'

type Attributes = {
    id: number
    username: string
    name: string
    email: string
    phoneNumber: string
    password: string

    createdAt?: Date
}

type CreationAttributes = Omit<Attributes, 'id'>

export class UserDAO extends Model<Attributes, CreationAttributes> {
    declare readonly id: number
    declare username: string
    declare name: string
    declare email: string
    declare phoneNumber: string
    declare password: string

    declare readonly createdAt: Date
}

UserDAO.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        username: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false
        },
        phoneNumber: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false
        },
        password: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    },
    {
        sequelize: sequelize,
        tableName: 'Users',
        modelName: 'User',
        timestamps: true,
        defaultScope: { order: [['createdAt', 'DESC']] },
        indexes: [
            { unique: true, fields: ['username'] },
            { unique: true, fields: ['email'] },
            { unique: true, fields: ['phoneNumber'] }
        ]
    }
)

// await UserDAO.sync()
