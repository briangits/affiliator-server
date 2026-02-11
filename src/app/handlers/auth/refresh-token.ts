import { Router } from 'express'
import { DI } from '../../../di'
import { AuthService } from '../../../services/auth'
import { Auth } from '../../middleware/auth'
import { field, validate } from '../../validators/validate'
import { toString } from '../../validators/transforms'

const router: Router = Router()

const service = DI.resolve(AuthService)

router.post('/', async (req, res) => {
    const { token } = validate(req.getBody(), {
        token: () => field(toString)
    })

    const [newToken, error] = await service.refreshToken(token)

    if (error) {
        return when(error.code, {
            TokenExpired: () =>
                res.status(401).message('Your session expired. You need to log in again.'),
            InvalidToken: () => res.status(401).message('You are not logged in'),
            else: () => {
                throw error
            }
        })
    }

    return res.json(newToken)
})

export { router as RefreshToken }
