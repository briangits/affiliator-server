import { SettingDAO } from './setting.dao'

export class Setting<T> {
    readonly group: string
    readonly name: string
    readonly defaultValue: T
    readonly encoder: (value: T) => string
    readonly decoder: (value: string) => T

    constructor(
        group: string,
        name: string,
        defaultValue: T,
        encoder?: (value: T) => string,
        decoder?: (value: string) => T
    ) {
        this.group = group
        this.name = name
        this.defaultValue = defaultValue
        this.encoder = encoder || JSON.stringify
        this.decoder = decoder || JSON.parse
    }

    async get(): Promise<T> {
        const rawSetting = await SettingDAO.findOne({
            where: {
                group: this.group,
                name: this.name
            }
        })
        if (!rawSetting) return this.defaultValue

        const parser = this.decoder || JSON.parse

        return parser(rawSetting.value)
    }

    async set(value: T): Promise<Result<void>> {
        try {
            const encoded = this.encoder(value)

            const [setting] = await SettingDAO.upsert({
                group: this.group,
                name: this.name,
                value: encoded
            })

            return Result.ok()
        } catch (error) {
            return Result.error('SettingUpdateFailed')
        }
    }

    async clear() {
        await SettingDAO.destroy({
            where: {
                group: this.group,
                name: this.name
            }
        })
    }
}

export function setting<T>(config: {
    group: string
    name: string
    defaultValue: T
    encoder?: (value: T) => string
    decoder?: (value: string) => T
}): Setting<T> {
    return new Setting(
        config.group,
        config.name,
        config.defaultValue,
        config.encoder,
        config.decoder
    )
}
