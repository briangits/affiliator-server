import './types'
import express from 'express'
import cors from 'cors'
import { configureRouting } from './app.routes'
import { ErrorHandler } from './handlers/errors'
import { NormalizeUrl } from './middleware/normalize-url'
import morgan from 'morgan'

const app = express()

app.use(NormalizeUrl)
app.use(cors())
app.use(morgan('tiny'))

configureRouting(app)

app.use(ErrorHandler)

async function startServer(port: number = 8080) {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`)
    })
}

export { startServer }
