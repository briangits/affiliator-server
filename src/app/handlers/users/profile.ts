import express, { Router } from 'express'
import { DI } from '../../../di'
import { UserProfileService } from '../../../services/user-profile'
import { optionalField, validate } from '../../validators/validate'
import { toEmail, toPhoneNumber, toString } from '../../validators/transforms'
import { Auth } from '../../middleware/auth'

const service = DI.resolve(UserProfileService)

const router: Router = Router()

router.use(express.json())
router.use(Auth)

router.get('/', async (req, res) => {
    const profile = await service.getUserProfile(req.user.id)

    return res.json(profile)
})

router.patch('/', async (req, res) => {
    const { username, name, email, phoneNumber } = validate(req.getBody(), {
        username: () =>
            optionalField(toString, value => [
                [
                    value.length >= 3,
                    'Your username must be at least 3 characters long',
                    'InvalidUsername'
                ]
            ]),
        name: () =>
            optionalField(toString, value => [
                [value.length >= 3, 'Your name must be at least 3 characters long', 'InvalidName']
            ]),
        email: () => optionalField(toEmail),
        phoneNumber: () => optionalField(toPhoneNumber)
    })

    const [profile, error] = (
        await service.updateProfile(req.user.id, {
            username,
            name,
            email,
            phoneNumber
        })
    ).destructured

    if (error) {
        return when(error.code, {
            AccountNotFound: () => res.status(401).message('You are not logged in'),
            UsernameTaken: () =>
                res.status(409).fieldError('username', 'Username already taken', 'InvalidUsername'),
            EmailRegistered: () =>
                res.status(409).fieldError('email', 'Email already registered', 'InvalidEmail'),
            PhoneNumberRegistered: () =>
                res
                    .status(409)
                    .fieldError(
                        'phoneNumber',
                        'Phone number already registered',
                        'InvalidPhoneNumber'
                    ),
            else: () => {
                throw error
            }
        })
    }

    return res.status(200).json(profile)
})

export { router as Profile }
