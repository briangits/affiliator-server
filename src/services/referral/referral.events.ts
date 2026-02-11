import { Events } from '../../events'

type ReferralEventMap = {
    newReferral: [{ invitor: string; username: string }]
}

export class ReferralEvents extends Events<ReferralEventMap> {
    constructor() {
        super()
    }

    onNewReferral = this.createHandler('newReferral')
}
