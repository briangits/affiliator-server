declare global {
    interface Object {
        resolveAll<T>(this: Promise<T>[]): Promise<T[]>
    }
}

Object.defineProperty(Array.prototype, 'resolveAll', {
    value: async function <T>(this: Promise<T>[]): Promise<T[]> {
        return Promise.all(this)
    },
    writable: true,
    enumerable: false,
    configurable: true
})

export {}
