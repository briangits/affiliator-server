import { Setting, setting } from './setting'

// AI code, even I dont know how it works but it does
type Primitive = string | number | boolean | null | undefined

type SettingConfig<T = any> = {
    defaultValue: T
    encoder?: (value: T) => string
    decoder?: (value: string) => T
}

type SettingInput = Primitive | SettingConfig | SettingTree

type SettingTree = {
    [key: string]: SettingInput
}

type WidenPrimitive<T> = T extends string
    ? string
    : T extends number
      ? number
      : T extends boolean
        ? boolean
        : T

type InferSettingValue<T> =
    T extends SettingConfig<infer V> ? V : T extends Primitive ? WidenPrimitive<T> : never

type SettingGroup<T> = {
    [K in keyof T]: T[K] extends SettingConfig | Primitive
        ? Setting<InferSettingValue<T[K]>>
        : T[K] extends SettingTree | SettingGroup<any>
          ? SettingGroup<T[K]>
          : never
}

function isSettingConfig(value: unknown): value is SettingConfig {
    return typeof value === 'object' && value !== null && 'defaultValue' in value
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function settings<T extends SettingTree>(name: string, settingsGroup: T): SettingGroup<T> {
    const group = {} as SettingGroup<T>

    for (const key in settingsGroup) {
        const value = settingsGroup[key]

        if (value instanceof Setting) {
            ;(group as any)[key] = setting({
                group: `${name}.${value.group}`,
                name: value.name,
                defaultValue: value.defaultValue,
                encoder: value.encoder,
                decoder: value.decoder
            })
        } else if (isSettingConfig(value)) {
            ;(group as any)[key] = setting({
                group: name,
                name: key,
                defaultValue: value.defaultValue,
                encoder: value.encoder,
                decoder: value.decoder
            })
        } else if (isPlainObject(value)) {
            ;(group as any)[key] = settings(`${name}.${key}`, value as SettingTree)
        } else {
            ;(group as any)[key] = setting({
                group: name,
                name: key,
                defaultValue: value
            })
        }
    }

    return group
}

function flattenGroup(group: Record<string, any>): Setting<any>[] {
    const settings: Setting<any>[] = []
    for (const key in group) {
        const value = group[key]
        if (value instanceof Setting) {
            settings.push(value)
        } else if (typeof value === 'object' && value !== null) {
            settings.push(...flattenGroup(value))
        }
    }
    return settings
}

export async function walkdownSettings(
    group: Record<string, any>,
    action: (setting: Setting<any>) => Promise<void>
) {
    const settings = flattenGroup(group)
    await Promise.all(settings.map(setting => action(setting)))
}
