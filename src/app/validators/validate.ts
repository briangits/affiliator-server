import { IllegalArgumentError, MissingParameterError } from '../app.errors'
import { Transform } from './transforms'

type Rule<T> = [boolean, string?, string?]

type Validator<T> = {
    transform: Transform<T>
    rules?: (value: T) => Rule<T>[] | Rule<T>
}

type MandatoryField<T = any> = {
    optional: false
    validator: Validator<T>
}

type OptionalField<T = any> = {
    optional: true
    validator: Validator<T>
}

type Field<T = any> = MandatoryField<T> | OptionalField<T>

type InferFieldType<F> = F extends (value: any) => Field<infer T> ? T : never

function validate<R extends Record<string, () => Field<any>>>(
    values: NonNullable<any>,
    fields: R
): { [K in keyof R]: InferFieldType<R[K]> } {
    const result = {} as { [K in keyof R]: InferFieldType<R[K]> }

    for (const key in fields) {
        const field = fields[key]()
        const value = values[key]

        if (value === undefined || value === null) {
            if (!field.optional) throw new MissingParameterError(key)
            continue
        }

        const validator = field.validator

        const transformed = validator.transform.transform(value)

        if (transformed === undefined || transformed === null)
            throw new IllegalArgumentError(key, `${key} ${validator.transform.message}`)

        const rules = validator.rules?.(transformed) ?? []
        const validations = Array.isArray(rules) ? (rules as Rule<any>[]) : [rules]

        for (const [check, message, code] of validations) {
            if (!check) {
                throw new IllegalArgumentError(key, message ?? '', code)
            }
        }

        result[key] = transformed
    }

    return result
}

function field<T>(transform: Transform<T>, rules?: (value: T) => Rule<T>[] | Rule<T>): Field<T> {
    return { optional: false, validator: { transform, rules } }
}

function optionalField<T>(
    transform: Transform<T>,
    rules?: (value: T) => Rule<T>[] | Rule<T>
): Field<T> {
    return { optional: true, validator: { transform, rules } }
}

export { field, optionalField, validate }
