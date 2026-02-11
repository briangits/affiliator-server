export class MissingBodyError extends Error {
    constructor() {
        super('No request body was provided')
    }
}

export class MissingParameterError extends Error {
    parameter: string
    code?: string

    constructor(parameter: string, code?: string) {
        super(`Missing required parameter: ${parameter}`)
        this.parameter = parameter
        this.code = code
    }
}

export class IllegalArgumentError extends Error {
    parameter: string
    code?: string

    constructor(parameter: string, message: string, code?: string) {
        super(message)
        this.name = 'IllegalArgumentError'
        this.parameter = parameter
        this.code = code
    }
}
