export const PasswordUtils = {
    async hashPassword(password: string): Promise<string> {
        return password // TODO: Hash the password
    },

    async comparePassword(password: string, hash: string): Promise<boolean> {
        return password === hash // TODO: Compare the password with the hash
    }
}
