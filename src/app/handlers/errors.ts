import { NextFunction, Request, Response } from 'express'
import { IllegalArgumentError, MissingBodyError, MissingParameterError } from '../app.errors'

const ErrorHandler = (e: any, _: Request, res: Response, next: NextFunction) => {
    switch (true) {
        case e instanceof IllegalArgumentError:
        case e instanceof MissingParameterError:
            return res.status(400).fieldError(e.parameter, e.message, e.code)
        case e instanceof MissingBodyError:
            return res.status(400).message(e.message)
        default:
            console.log(e)
            if (e.expose) {
                return when(e.type, {
                    'entity.parse.failed': () =>
                        res.status(400).message(`Invalid request body. ${e.message}`),
                    else: () => res.status(e.status || 500).message(e.message)
                })
            } else return res.status(500).message('Internal Server Error')
    }
}

export { ErrorHandler }
