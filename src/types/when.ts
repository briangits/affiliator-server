declare global {
    type Handler<T> = T | (() => T)
    type ElseHandler<T> = Handler<T> | (() => never)

    type Handlers<T> = Record<any, Handler<T>>
    type HandlesWithDefault<T> = Handlers<T> & { else: ElseHandler<T> }

    function when<T = void>(value: any, handlers: HandlesWithDefault<T>): T

    function when<T = void>(value: any, handlers: Handlers<T>): T | undefined
}

global.when = function <T = any>(value: any, handlers: Handlers<T>): T | undefined {
    const handler = handlers[value] ?? (handlers as any).else

    if (!handler) return undefined

    if (typeof handler === 'function') {
        return (handler as Function)()
    }

    return handler
}

export {}
