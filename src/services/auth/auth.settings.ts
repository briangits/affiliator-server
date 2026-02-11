import { settings } from '../../domains/setting'

export const AuthSettings = settings('auth', {
    tokenValidity: 3600, // in seconds
    refreshTokenValidity: 3600 * 24,
    minPasswordLength: 6
})
