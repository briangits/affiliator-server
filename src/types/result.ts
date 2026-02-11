declare global {
    namespace Result {
        interface IResult<T> {
            ok?: boolean | true | false
            getOrTrow(): T
            getOrElse(defaultValue: T): T
        }
        interface Success<T> extends IResult<T> {
            readonly ok: true
            getData(): T
            getError(): undefined
            readonly destructured: [T, undefined]
        }
        interface Error extends IResult<never> {
            readonly ok: false
            readonly code: string
            readonly message?: string
            getData(): undefined
            getError(): { code: string; message?: string }
            readonly destructured: [undefined, { code: string; message?: string }]
        }
        function ok(): Result<void>
        function ok<T>(data: T): Result<T>
        function error(code: string, message?: string): Result<never>
    }

    interface Object {
        wrapAsResult<T>(this: Promise<T>): Promise<Result<T>>
        wrapAsResult<T>(this: T): Result<T>
    }

    type Result<T = void> = (Result.Success<T> | Result.Error) &
        ([T, undefined] | [undefined, { code: string; message?: string }])
}

class ResultImpl<T> {
    protected constructor(
        protected readonly _data?: T,
        protected readonly _error?: { code: string; message?: string }
    ) {}

    *[Symbol.iterator](): Iterator<T | undefined | { code: string; message?: string }> {
        yield this._data
        yield this._error
    }

    static Success = class<T> extends ResultImpl<T> implements Result.Success<T> {
        readonly ok = true as const
        constructor(protected _data: T) {
            super(_data)
        }
        getData(): T {
            return this._data
        }
        getError(): undefined {
            return undefined
        }
        get destructured(): [T, undefined] {
            return [this.getData(), undefined]
        }
        getOrTrow(): T {
            return this._data
        }
        getOrElse(defaultValue: T): T {
            return this._data
        }
    }

    static Error = class extends ResultImpl<never> implements Result.Error {
        readonly ok = false as const
        constructor(protected _error: { code: string; message?: string }) {
            super(undefined, _error)
        }
        get code(): string {
            return this._error.code
        }
        get message(): string | undefined {
            return this._error.message
        }
        getData(): undefined {
            return undefined
        }
        getError() {
            return this._error
        }
        get destructured(): [undefined, { code: string; message?: string }] {
            return [undefined, this.getError()]
        }
        getOrTrow(): never {
            throw this._error
        }
        getOrElse<T>(defaultValue: T): T {
            return defaultValue
        }
    }

    static ok<T>(data?: T): Result<T> {
        return new ResultImpl.Success(data as T) as any
    }

    static error(code: string, message?: string): Result {
        return new ResultImpl.Error({ code, message }) as any
    }
}

Object.defineProperty(Object.prototype, 'wrapAsResult', {
    value: function <T>(this: T): Result<T> | Promise<Result<T>> {
        if (this instanceof Promise) {
            return this.then(Result.ok)
        }

        return Result.ok(this)
    },
    writable: true,
    enumerable: false,
    configurable: true
})

const Result = ResultImpl

Object.assign(globalThis, { Result })

export {}
