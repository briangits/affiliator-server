declare global {
    interface Object {
        also<T>(
            this: T,
            action: (value: T) => unknown | Promise<unknown>
        ): ReturnType<typeof action> extends Promise<unknown> ? Promise<T> : T
    }
}

Object.defineProperty(Object.prototype, 'also', {
    value: function <T>(
        this: T,
        action: (value: T) => unknown | Promise<unknown>
    ): ReturnType<typeof action> extends Promise<unknown> ? Promise<T> : T {
        action(this)
        return this
    },
    writable: true,
    enumerable: false,
    configurable: true
})

export {}
