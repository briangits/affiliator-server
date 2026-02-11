import { Express, Router } from 'express'
import { Auth } from './handlers/auth'
import { Clients } from './handlers/clients'
import { RouteErrors } from './handlers/route-errors'
import { Users } from './handlers/users'
import { Webhooks } from './handlers/webhooks'

const router = Router()

router.get('/', (_, res) => {
    res.json({ message: 'Affiliator API', version: '1.0.0' })
})

router.use(RouteErrors(router))

router.use('/auth', Auth)
router.use('/', Users)
router.use('/', Clients)
router.use('/webhooks', Webhooks)

function configureRouting(app: Express) {
    app.use('/', router)
}

export { configureRouting }
