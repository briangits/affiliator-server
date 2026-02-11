import { EventMap, Events } from '../events'

export class Service<E extends Events<EventMap> | undefined = undefined> {
    readonly events: E

    constructor()
    constructor(events: E)
    constructor(events?: E) {
        this.events = events as E
    }
}
