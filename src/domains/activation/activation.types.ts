import { ActivationStatus } from '../../shared/types/activation'

export type Activation = {
    id: number
    clientId: number
    paymentRef: string
    status: ActivationStatus
    initiatedAt: Date
}

export type NewActivation = Pick<Activation, 'clientId'>

export type ActivationUpdate = Partial<Pick<Activation, 'status' | 'paymentRef'>>

export { ActivationStatus }
