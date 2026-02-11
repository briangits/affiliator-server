import { ActivationStatus } from '../../shared/types/activation'

export { ActivationStatus }

export type ActivationRequest = {
    clientId: number
    phoneNumber: string
}
