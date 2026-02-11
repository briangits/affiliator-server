import { AuthToken, AuthTokenPayload, AuthTokens, AuthTokenType, UserRole } from './auth.types'
import { AuthSettings } from './auth.settings'
import { Service } from '../service'
import { AuthEvents } from './auth.events'
import { cache } from '../../cache'
import { PasswordUtils } from './utils/password'
import { JWTUtils } from './utils/jwt'
import { User, UserManagementService } from '../users'
import { Client, ClientManagementService } from '../clients'

const AUTH_TOKEN_VALIDITY = parseInt(process.env.AUTH_TOKEN_VALIDITY || '') || 3600
const REFRESH_AUTH_TOKEN_VALIDITY = parseInt(process.env.REFRESH_AUTH_TOKEN_VALIDITY || '') || 24

const AuthedUserCache = cache.createKey<User | null, [userId: string]>('authed-user', {
    ttl: 60 * 60
})
const AuthedClientCache = cache.createKey<Client | null, [userId: number]>('authed-client', {
    ttl: 60 * 60
})

export class AuthService extends Service<AuthEvents> {
    private users: UserManagementService
    private clients: ClientManagementService

    constructor(
        events: AuthEvents,
        users: UserManagementService,
        clients: ClientManagementService
    ) {
        super(events)

        this.users = users
        this.clients = clients
    }

    private async getRoles(user: User): Promise<UserRole[]> {
        const roles: UserRole[] = []

        if (await this.clients.getClientByUserId(user.id)) roles.push(UserRole.Client)

        return roles
    }

    private async generateToken(
        user: User,
        type: AuthTokenType,
        validity: number
    ): Promise<AuthToken> {
        const payload: AuthTokenPayload = {
            type: type,
            userId: user.id.toString(),
            roles: await this.getRoles(user)
        }

        const tokenExpiry = Date.now() / 1000 + validity

        return {
            token: await JWTUtils.sign(payload, tokenExpiry),
            expiry: tokenExpiry
        }
    }

    private async validatePassword(username: string, password: string): Promise<Result<User>> {
        const validator = async (hash: string): Promise<boolean> => {
            return await PasswordUtils.comparePassword(password, hash)
        }

        const user = await this.users.validatePassword(username, validator)

        if (!user) return Result.error('IncorrectCredentials', 'Invalid username or password.')

        return Result.ok(user)
    }

    async authenticate(username: string, password: string): Promise<Result<AuthTokens>> {
        const [user, error] = await this.validatePassword(username, password)
        if (error) return Result.error(error.code, error.message)

        const authToken = await this.generateToken(user, AuthTokenType.Auth, AUTH_TOKEN_VALIDITY)
        const refreshToken = await this.generateToken(
            user,
            AuthTokenType.Refresh,
            REFRESH_AUTH_TOKEN_VALIDITY * 3600
        )

        return Result.ok({ authToken, refreshToken })
    }

    async verifyToken(
        token: string,
        type: AuthTokenType = AuthTokenType.Auth
    ): Promise<Result<User>> {
        try {
            const payload = await JWTUtils.verify<AuthTokenPayload>(token)

            if (payload.type !== type) return Result.error('InvalidToken')

            const user = await cache.getOrElse(AuthedUserCache(payload.userId), async () => {
                return await this.users.getUser(parseInt(payload.userId))
            })

            if (!user) return Result.error('InvalidToken')

            return Result.ok(user)
        } catch (e: any) {
            return when(e.code, {
                ERR_JWS_INVALID: Result.error('InvalidToken'),
                else: Result.error('TokenExpired')
            })
        }
    }

    async getClient(userId: number): Promise<Client | null> {
        return cache.getOrElse(AuthedClientCache(userId), async () => {
            return await this.clients.getClientByUserId(userId)
        })
    }

    async refreshToken(token: string): Promise<Result<AuthToken>> {
        const [user, error] = await this.verifyToken(token, AuthTokenType.Refresh)
        if (error) return Result.error(error.code, error.message)

        const authToken = await this.generateToken(user, AuthTokenType.Auth, AUTH_TOKEN_VALIDITY)

        return Result.ok(authToken)
    }

    async changePassword(userId: number, newPassword: string): Promise<Result<void>> {
        const minPasswordLength = await AuthSettings.minPasswordLength.get()
        if (newPassword.length < minPasswordLength) return Result.error('PasswordTooShort')

        const passwordHash = await PasswordUtils.hashPassword(newPassword)

        return await this.users.setPassword(userId, passwordHash)
    }
}
