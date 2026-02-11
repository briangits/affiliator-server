import { randomBytes } from 'crypto'

declare global {
    function randomString(length: number): string
}

global.randomString = function (length: number): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const bytes = randomBytes(length)
    let reference = ''
    for (let i = 0; i < length; i++) {
        reference += letters[bytes[i] % letters.length]
    }
    return reference
}

export {}
