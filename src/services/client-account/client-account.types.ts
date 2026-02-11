import { ClientStatus } from '../../domains/client'

export type AccountStatus = ClientStatus

export type ClientAccount = {
    invitor: string | null
    status: AccountStatus
    balance: number
}
