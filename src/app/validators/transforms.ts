export type Transform<T> = {
    transform: (value: any) => T | null
    message: string
}

export function transform<T>(message: string, transform: (value: any) => T | null): Transform<T> {
    return { transform, message }
}

export const toNumber: Transform<number> = transform('must be an interger', value => {
    if (typeof value === 'number') return value
    else if (typeof value === 'string') {
        const parsed = Number.parseInt(value)
        if (!isNaN(parsed)) return parsed
    }

    return null
})

export const toFloat: Transform<number> = transform('must be a float', value => {
    if (typeof value === 'number') return value
    else if (typeof value === 'string') return Number.parseFloat(value)

    return null
})

export const toBoolean: Transform<boolean> = transform('must be a boolean', value => {
    if (typeof value === 'boolean') return value
    else if (typeof value === 'string') return value.toLowerCase() === 'true'
    else if (typeof value === 'number') return value !== 0

    return null
})

export const toString: Transform<string> = transform('must be a string', value => {
    return value !== undefined && value !== null ? value.toString() : null
})

export const toObject: Transform<Record<string, any>> = transform('must be an object', value => {
    if (typeof value === 'object') return value
    else if (typeof value === 'string') return JSON.parse(value)

    return null
})

export const toArray: Transform<any[]> = transform('must be an array', value => {
    if (Array.isArray(value)) return value
    else if (typeof value === 'string') {
        try {
            const array = JSON.parse(value)
            if (Array.isArray(array)) return array
            else return null
        } catch (e) {
            return null
        }
    }

    return null
})

export const toEnum = <E extends Record<string, string | number>>(enumType: E) =>
    transform<E[keyof E]>('must be a valid enum value', value => {
        if (Object.values(enumType).includes(value as E[keyof E])) {
            return value as E[keyof E]
        }
        return null
    })

export const toPhoneNumber: Transform<string> = transform('must be a valid phone number', value => {
    let phoneNumber = toString.transform(value)
    if (!phoneNumber) return null

    phoneNumber =
        phoneNumber.match(/^\+?(?:254|0)(?<phoneNumber>(?:1|7)\d{8})$/)?.groups?.phoneNumber || null

    if (!phoneNumber) return null

    return `254${phoneNumber}`
})

export const toEmail: Transform<string> = transform('must be a valid email', value => {
    const email = toString.transform(value)
    if (!email) return null

    return (
        email.match(/^(?<email>\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+)$/)?.groups?.email ||
        null
    )
})
