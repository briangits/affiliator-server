export enum ActivationState {
    InProgress = 'InProgress',
    NoneInProgress = 'NoneInProgress',
    Completed = 'Completed'
}

export type ActivationRequest = {
    clientId: number
    phoneNumber: string
}
