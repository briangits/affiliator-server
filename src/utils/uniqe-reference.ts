async function generateUniqueReference(
    length: number,
    maxAttempts: number,
    validator: (code: string) => Promise<boolean>
): Promise<string> {
    let attempts = 0
    let reference: string | null = null

    do {
        const code = randomString(length)
        if (await validator(code)) {
            reference = code
            break
        }
        attempts++
    } while (attempts < maxAttempts)

    if (!reference) throw new Error('Failed to generate unique reference')

    return reference
}

export default generateUniqueReference
