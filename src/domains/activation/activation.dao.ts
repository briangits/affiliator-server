import { DataTypes, Model } from 'sequelize'
import sequelize from '../../database'
import { ActivationStatus } from './activation.types'
import { ClientDAO } from '../client'
import { PaymentDAO } from '../payment'

type Attributes = {
    id: number
    clientId: number
    paymentRef: string
    status: ActivationStatus
}

type CreationAttributes = Pick<Attributes, 'clientId'>

export class ActivationDAO extends Model<Attributes, CreationAttributes> {
    declare readonly id: number
    declare readonly clientId: number
    declare paymentRef: string
    declare status: ActivationStatus

    declare readonly createdAt: Date

    declare readonly getClient: () => Promise<ClientDAO>
    declare readonly getPayment: () => Promise<PaymentDAO>
}

ActivationDAO.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        clientId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: ClientDAO }
        },
        paymentRef: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
            references: { model: PaymentDAO, key: 'reference' }
        },
        status: {
            type: DataTypes.ENUM(...Object.values(ActivationStatus)),
            defaultValue: ActivationStatus.Pending,
            allowNull: false
        }
    },
    {
        sequelize: sequelize,
        tableName: 'Activations',
        modelName: 'Activation',
        timestamps: true,
        defaultScope: { order: [['createdAt', 'DESC']] },
        indexes: [{ fields: ['clientId'] }, { unique: true, fields: ['paymentRef'] }]
    }
)

ActivationDAO.belongsTo(ClientDAO, { foreignKey: 'clientId', as: 'client' })
ActivationDAO.belongsTo(PaymentDAO, {
    foreignKey: 'paymentRef',
    as: 'payment'
})

// await ActivationDAO.sync()
