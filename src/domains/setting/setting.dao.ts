import { DataTypes, Model } from 'sequelize'
import sequelize from '../../database'

type Attributes = {
    id: number
    group: string
    name: string
    value: string
}

type CreationAttributes = Pick<Attributes, 'group' | 'name' | 'value'>

export class SettingDAO extends Model<Attributes, CreationAttributes> {
    declare group: string
    declare name: string
    declare value: string
}

SettingDAO.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        group: {
            type: DataTypes.STRING,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        value: {
            type: DataTypes.STRING,
            allowNull: false
        }
    },
    {
        sequelize: sequelize,
        tableName: 'Settings',
        modelName: 'Setting',
        timestamps: false,
        indexes: [{ unique: true, fields: ['group', 'name'] }]
    }
)

// await SettingDAO.sync()
