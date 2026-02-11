import 'dotenv/config'
import './types'
import { UserDAO } from './domains/user'
import { ClientDAO } from './domains/client'
import { PaymentDAO } from './domains/payment'
import { ActivationDAO } from './domains/activation'
import { WithdrawalDAO } from './domains/withdrawal'
import { SettingDAO } from './domains/setting/setting.dao'
import { DB } from './database'

async function setupDB() {
    DB.logging.enable()

    await UserDAO.sync()
    await ClientDAO.sync()

    await PaymentDAO.sync()

    await ActivationDAO.sync()
    await WithdrawalDAO.sync()

    await SettingDAO.sync()

    DB.logging.disable()
}

async function setup() {
    await setupDB()
}

setup()
