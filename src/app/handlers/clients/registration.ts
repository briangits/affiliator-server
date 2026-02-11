import express, { Router } from 'express'
import { field, optionalField, validate } from '../../validators/validate'
import { toEmail, toPhoneNumber, toString } from '../../validators/transforms'
import { DI } from '../../../di'
import { RegistrationService } from '../../../services/registartion'

const service = DI.resolve(RegistrationService)

const router: Router = Router()

router.use(express.json())

router.post('/', async (req, res) => {
    const { username, name, email, phoneNumber, invitor, password } = validate(req.getBody(), {
        username: () =>
            field(toString, value => [
                [
                    value.length >= 3,
                    'Your username must be at least 3 characters long',
                    'InvalidUsername'
                ]
            ]),
        name: () =>
            field(toString, value => [
                [value.length >= 3, 'Your name must be at least 3 characters long', 'InvalidName']
            ]),
        email: () => field(toEmail),
        phoneNumber: () => field(toPhoneNumber),
        invitor: () => optionalField(toString),
        password: () => field(toString)
    })

    const result = await service.register({
        username,
        name,
        email,
        password,
        phoneNumber,
        invitor
    })
    const [_, error] = result.destructured

    if (error) {
        return when(error.code, {
            UsernameAlreadyExists: () =>
                res.status(409).error('InvalidUsername', 'Username already taken'),
            EmailAlreadyExists: () =>
                res.status(409).error('InvalidEmail', 'Email already registed'),
            PhoneNumberAlreadyExists: () =>
                res.status(409).error('InvalidPhoneNumber', 'Phone number already registed'),
            else: () => {
                throw error
            }
        })
    }

    return res.status(201).message('Registration successful. Proceed to login')
})

export { router as Registration }
