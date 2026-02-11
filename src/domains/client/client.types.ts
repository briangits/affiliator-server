import { ClientStatus } from '../../shared/types/client-status'

export { ClientStatus }

export type Client = {
    id: number
    userId: number
    invitorId: number | null
    status: ClientStatus
    balance: number
}

export type NewClient = Pick<Client, 'userId' | 'invitorId'>
export type ClientUpdate = Partial<Pick<Client, 'status' | 'balance'>>

export type ClientFilters = {
    userId?: number
    invitorId?: number
    status?: ClientStatus
    balance?: {
        lte?: number
        gte?: number
    }
}
