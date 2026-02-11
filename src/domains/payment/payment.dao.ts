import { DataTypes, Model } from 'sequelize'
import sequelize from '../../database'
import { PaymentMetadata, PaymentStatus, PaymentType } from './payment.types'

type Attributes = {
    id: number
    type: PaymentType
    reference: string
    phoneNumber: string
    amount: number
    meta: PaymentMetadata
    status: PaymentStatus
}

type CreationAttributes = Pick<Attributes, 'type' | 'reference' | 'phoneNumber' | 'amount' | 'meta'>

export class PaymentDAO extends Model<Attributes, CreationAttributes> {
    declare readonly id: number
    declare readonly type: PaymentType
    declare readonly reference: string
    declare readonly phoneNumber: string
    declare readonly amount: number
    declare readonly meta: PaymentMetadata
    declare status: PaymentStatus

    declare readonly createdAt: Date
}

PaymentDAO.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        type: {
            type: DataTypes.ENUM(...Object.values(PaymentType)),
            allowNull: false
        },
        reference: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false
        },
        phoneNumber: {
            type: DataTypes.STRING,
            allowNull: false
        },
        amount: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        meta: {
            type: DataTypes.JSON,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM(...Object.values(PaymentStatus)),
            defaultValue: PaymentStatus.Pending,
            allowNull: false
        }
    },
    {
        sequelize: sequelize,
        tableName: 'Payments',
        modelName: 'Payment',
        timestamps: true,
        defaultScope: { order: [['createdAt', 'DESC']] },
        indexes: [
            { unique: true, fields: ['reference'] },
            { fields: ['type'] },
            { fields: ['phoneNumber'] }
        ]
    }
)

// await PaymentDAO.sync()
