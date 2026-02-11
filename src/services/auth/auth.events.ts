import { Events } from '../../events'

type AuthEventMap = {
    authenticationFailed: [{ username: string; password: string; ip: string }]
    userAuthenticated: [{ username: string; ip: string }]
    passwordResetRequest: [{ email: string; ip: string }]
    passwordReset: [{ username: string; ip: string }]
    passwordChanged: [{ username: string; ip: string }]
}

export class AuthEvents extends Events<AuthEventMap> {
    constructor() {
        super()
    }

    onAuthenticationFailed = this.createHandler('authenticationFailed')

    onUserAuthenticated = this.createHandler('userAuthenticated')

    onPasswordResetRequest = this.createHandler('passwordResetRequest')

    onPasswordReset = this.createHandler('passwordReset')

    onPasswordChanged = this.createHandler('passwordChanged')
}
