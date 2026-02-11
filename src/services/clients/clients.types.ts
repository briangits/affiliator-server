import { ClientStatus } from '../../shared/types/client-status'

export { ClientStatus }

export type Client = {
    id: number
    username: string
    invitor: string | null
    status: ClientStatus
    balance: number
}

export type NewClient = Pick<Client, 'username' | 'invitor'>

export type ClientUpdate = Partial<Pick<Client, 'status' | 'balance'>>
