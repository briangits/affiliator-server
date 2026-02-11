import { EventMap } from './events.types'

export class Events<EMap extends EventMap> {
    private listeners: {
        [K in keyof EMap]?: Array<(...args: EMap[K]) => void | Promise<void>>
    } = {}

    emit<K extends keyof EMap>(event: K, ...args: EMap[K]) {
        this.listeners[event]?.forEach(fn => fn(...args))
    }

    on<K extends keyof EMap>(event: K, listener: (...args: EMap[K]) => void | Promise<void>) {
        if (!this.listeners[event]) this.listeners[event] = []
        this.listeners[event]!.push(listener)
    }

    createHandler<K extends keyof EMap>(event: K) {
        return (listener: (...args: EMap[K]) => void | Promise<void>) => this.on(event, listener)
    }

    addHandlers<K extends keyof EMap>(listeners: {
        [K in keyof EMap]?: (...args: EMap[K]) => void | Promise<void>
    }) {
        Object.entries(listeners).forEach(([event, listener]) => {
            if (listener) this.on(event as keyof EMap, listener)
        })
    }
}
