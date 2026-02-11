import 'dotenv/config'
import './types'
import { startServer } from './app/app'
import { cache } from './cache'

async function main() {
    await cache.start()

    await startServer(8080)
}

main()

// await main()
