declare global {
    function requireCondition(
        condition: boolean | (() => boolean),
        code?: string,
        message?: string
    ): void

    function requireNotNull<T>(
        value: T,
        code?: string,
        message?: string
    ): asserts value is NonNullable<T>

    function isNotNull<T>(value: T): asserts value is NonNullable<T>

    function requireNull(
        value: any,
        code?: string,
        message?: string
    ): asserts value is null | undefined

    function requireNotEmpty(
        value: string,
        code?: string,
        message?: string
    ): asserts value is string

    function requirePositiveInt(
        value: number,
        code?: string,
        message?: string
    ): asserts value is number
}

global.requireCondition = function (
    condition: boolean | (() => boolean),
    code?: string,
    message?: string
): void {
    if (typeof condition === 'function') {
        condition = condition()
    }
    if (!condition) throw new (global as any).IllegalStateError(code, message)
}

global.requireNotNull = function <T>(
    value: T,
    code?: string,
    message?: string
): asserts value is NonNullable<T> {
    requireCondition(value !== null && value !== undefined, code, message)
}

global.isNotNull = function <T>(value: T): asserts value is NonNullable<T> {
    requireNotNull(value, 'ValueIsNull')
}

global.requireNull = function (
    value: any,
    code?: string,
    message?: string
): asserts value is null | undefined {
    requireCondition(value === null || value === undefined, code, message)
}

global.requireNotEmpty = function (
    value: string,
    code?: string,
    message?: string
): asserts value is string {
    requireCondition(value.length > 0, code, message)
}

global.requirePositiveInt = function (
    value: number,
    code?: string,
    message?: string
): asserts value is number {
    requireCondition(value > 0, code, message)
}

export {}
