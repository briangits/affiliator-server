export enum UserRole {
    Admin = 'admin',
    Client = 'client'
}

export enum AuthTokenType {
    Auth = 'auth',
    Refresh = 'refresh'
}

export type AuthTokenPayload = {
    type: AuthTokenType
    userId: string
    roles: UserRole[]
}

export type AuthToken = {
    token: string
    expiry: number
}

export type AuthTokens = {
    authToken: AuthToken
    refreshToken: AuthToken
}
