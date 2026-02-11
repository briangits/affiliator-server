declare global {
    class IllegalStateError extends Error {
        code: string
        constructor(code?: string, message?: string)
    }

    function error(code: string, message?: string): Error
}

class IllegalStateError extends Error {
    code: string

    constructor(code?: string, message?: string) {
        super(message)
        this.name = 'IllegalStateError'
        this.code = code || 'UNKNOWN'
    }
}

function error(code: string, message?: string): Error {
    return new IllegalStateError(code, message)
}

Object.assign(globalThis, { IllegalStateError, error })

export {}
