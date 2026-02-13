import { createClient } from 'redis'

const CACHE_ENABLED = process.env.CACHE_ENABLED === 'true'
const NAMESPACE = process.env.CACHE_NAMESPACE || randomString(4)

const redis = createClient()

redis.on('error', err => console.log('Redis Client Error', err))

async function connectRedis() {
    await redis.connect()
}

type CacheArg = string | number | boolean | null

export type CacheOptions = {
    ttl?: number
}

export type CacheKey<T> = {
    name: string
    options?: CacheOptions
}

export const cache = {
    namespace: NAMESPACE,
    started: false,
    async start() {
        try {
            await connectRedis()

            this.started = true
        } catch (e: any) {
            console.error('Error connecting Redis', e)
        }
    },
    enabled: CACHE_ENABLED,
    disable() {
        this.enabled = false
    },
    enable() {
        this.enabled = true
    },
    createKey<T, K extends readonly CacheArg[] = CacheArg[]>(name: string, options?: CacheOptions) {
        return (...args: K): CacheKey<T> => ({
            name: `${this.namespace}:${name}:${args.join(':')}`,
            options
        })
    },
    async get<T>(key: CacheKey<T>): Promise<T | null> {
        if (!this.started || !this.enabled) return null

        const cached = await redis.get(key.name)
        if (cached === null) return null

        try {
            return JSON.parse(cached)
        } catch (e: any) {
            this.clear(key)
            return null
        }
    },
    async getOrElse<T>(key: CacheKey<T>, factory: () => T | Promise<T>): Promise<T> {
        const cached = await this.get(key)
        if (cached !== null) return cached

        const value = await factory()

        await this.set(key, value)

        return value
    },
    async set<T>(key: CacheKey<T>, value: T, options?: CacheOptions): Promise<T> {
        if (this.started && this.enabled && value !== null) {
            const mergedOptions = { ...key.options, ...options }
            await redis.set(key.name, JSON.stringify(value), {
                EX: mergedOptions?.ttl || 60 * 60
            })
        }

        return value
    },
    async clear(key: CacheKey<any>) {
        if (this.enabled) await redis.del(key.name)
    }
}
