declare global {
    interface Object {
        takeIf<T>(this: T): T | undefined
    }
}

Object.defineProperty(Object.prototype, 'takeIf', {
    value: function <T>(this: T, condition: (value: T) => boolean): T | undefined {
        return condition(this) ? this : undefined
    },
    writable: true,
    enumerable: false,
    configurable: true
})

export {}
