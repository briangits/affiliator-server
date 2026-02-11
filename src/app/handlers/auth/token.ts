import express, { Router } from 'express'
import { DI } from '../../../di'
import { AuthService } from '../../../services/auth'
import { field, validate } from '../../validators/validate'
import { toString } from '../../validators/transforms'

const router: Router = Router()

router.use(express.json())

const service = DI.resolve(AuthService)

router.post('/', async (req, res) => {
    const { username, password } = validate(req.getBody(), {
        username: () => field(toString),
        password: () => field(toString)
    })

    const [token, error] = await service.authenticate(username, password)

    if (error) {
        return when(error.code, {
            IncorrectCredentials: () => res.status(401).message('Incorrect username or password'),
            else: () => {
                throw error
            }
        })
    }

    return res.json(token)
})

export { router as Token }
