type MaybePromise<T> = T | Promise<T>
type ErrorHandler<T> = MaybePromise<T> | (() => MaybePromise<T>)

type Handlers<T> = Record<string, ErrorHandler<T>> & {
    default?: ErrorHandler<T>
}

async function handleError<T, H extends Handlers<T>>(e: any, handlers: H): Promise<T> {
    const code = e?.code

    const handler =
        (code && handlers[code]) ||
        handlers.default ||
        (() => {
            throw e
        })

    if (!handler) return undefined as any

    if (typeof handler === 'function') {
        return (await handler()) as any
    }

    return (await handler) as any
}

export { handleError }
