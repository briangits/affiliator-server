import { Events } from '../../events'

type ActivationEventMap = {
    clientActivated: [number]
}

export class ActivationEvents extends Events<ActivationEventMap> {
    constructor() {
        super()
    }

    onClientActivated = this.createHandler('clientActivated')
}
