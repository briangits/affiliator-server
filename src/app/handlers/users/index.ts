import express, { Router } from 'express'
import { Profile } from './profile'

const router: Router = Router()

router.use(express.json())

router.use('/profile', Profile)

export { router as Users }
