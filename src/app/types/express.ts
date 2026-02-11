import express from 'express'
import { MissingBodyError } from '../app.errors'
import { User } from '../../services/users'
import { Client } from '../../services/clients'

declare global {
    namespace Express {
        interface Request {
            authToken: string
            user: User
            client: Client

            body: any | null

            getBody(): any
        }

        interface Response {
            message(message: string): this
            error(code?: string, message?: string): this
            fieldError(field: string, message: string, code?: string): this
        }
    }
}

const req = express.request
const res = express.response

req.getBody = function (): any {
    if (this.body) return this.body
    else throw new MissingBodyError()
}

res.message = function (message: string) {
    return this.json({ message })
}

res.error = function (code?: string, message?: string) {
    return this.json({ error: true, code, message })
}

res.fieldError = function (field: string, message: string, code?: string) {
    return this.json({
        error: 'InvalidParameter',
        code: code,
        parameter: field,
        message
    })
}

export {}
