import { DataTypes, Model } from 'sequelize'
import sequelize from '../../database'
import { UserDAO } from '../user'
import { WithdrawalStatus } from './withdrawal.types'
import { PaymentDAO } from '../payment'
import { ClientDAO } from '../client'

type Attributes = {
    id: number
    clientId: number
    amount: number
    status: WithdrawalStatus
    paymentRef: string | null

    createdAt?: Date
}

type CreationAttributes = Pick<Attributes, 'clientId' | 'amount'>

export class WithdrawalDAO extends Model<Attributes, CreationAttributes> {
    declare readonly id: number
    declare readonly clientId: number
    declare readonly amount: number
    declare status: WithdrawalStatus
    declare paymentRef?: string

    declare readonly createdAt: Date

    declare readonly getClient: () => Promise<UserDAO>
    declare readonly getPayment: () => Promise<PaymentDAO>
}

WithdrawalDAO.init(
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
        amount: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM(...Object.values(WithdrawalStatus)),
            defaultValue: WithdrawalStatus.Pending,
            allowNull: false
        },
        paymentRef: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
            references: { model: PaymentDAO, key: 'reference' }
        }
    },
    {
        sequelize: sequelize,
        tableName: 'Withdrawals',
        modelName: 'Withdrawal',
        timestamps: true,
        defaultScope: { order: [['createdAt', 'DESC']] },
        indexes: [{ fields: ['clientId'] }, { unique: true, fields: ['paymentRef'] }]
    }
)

WithdrawalDAO.belongsTo(ClientDAO, { foreignKey: 'clientId', as: 'client' })
WithdrawalDAO.belongsTo(PaymentDAO, {
    foreignKey: 'paymentRef',
    as: 'payment'
})

// await WithdrawalDAO.sync()
