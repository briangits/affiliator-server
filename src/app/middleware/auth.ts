import { RequestHandler } from 'express'
import { DI } from '../../di'
import { AuthService } from '../../services/auth'
import { ClientStatus } from '../../domains/client'

const service = DI.resolve(AuthService)

export const Auth: RequestHandler = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')?.[1]
    if (!token) return res.status(401).message('You are not logged in').end()

    const [user, error] = await service.verifyToken(token)

    if (error) {
        return when(error.code, {
            InvalidToken: () => res.status(401).message('You are not logged in').end(),
            TokenExpired: () =>
                res.status(401).message('Your session expired, you need to login again.').end(),
            else: () => {
                throw error
            }
        })
    }

    req.authToken = token
    req.user = user

    next()
}

export const ClientAuth: RequestHandler = async (req, res, next) => {
    await Auth(req, res, async () => {
        const client = await service.getClient(req.user.id)
        if (!client) return res.status(403).message('Access denied').end()

        req.client = client

        next()
    })
}

export const ActiveClientAuth: RequestHandler = async (req, res, next) => {
    await ClientAuth(req, res, async () => {
        if (req.client.status !== ClientStatus.Active)
            return res
                .status(403)
                .message('Your account is inactive, you need to activate it first')
                .end()

        next()
    })
}
