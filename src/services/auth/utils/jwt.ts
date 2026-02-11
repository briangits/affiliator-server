import { jwtVerify, SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)

export const JWTUtils = {
    async sign(payload: any, expiry: number): Promise<string> {
        return await new SignJWT(payload)
            .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
            .setIssuedAt()
            .setExpirationTime(expiry)
            .sign(JWT_SECRET)
    },
    async verify<T>(token: string): Promise<T> {
        const { payload } = await jwtVerify<T>(token, JWT_SECRET)

        return payload
    }
}
