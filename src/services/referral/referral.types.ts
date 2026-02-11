import { ClientStatus } from '../../domains/client'

export type ReferralStatus = ClientStatus

export type Referral = {
    username: string
    name: string
    status: ReferralStatus
    joinedOn: Date
}

export type ReferralFilters = {
    status?: ReferralStatus
}

export type ReferralStats = {
    total: number
    active: number
    inactive: number
    earnings: number
}
