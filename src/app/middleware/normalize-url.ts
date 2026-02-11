import { RequestHandler } from 'express'
import path from 'path'

export const NormalizeUrl: RequestHandler = (req, res, next) => {
    try {
        let url = new URL(req.url, 'http://localhost')

        let pathname = url.pathname
        const query = url.search

        pathname = decodeURIComponent(pathname).replaceAll('\\', '/')

        pathname = path.posix.normalize(pathname)

        if (!pathname.startsWith('/')) pathname = '/' + pathname

        if (pathname.length > 1 && pathname.endsWith('/')) {
            pathname = pathname.slice(0, -1)
        }

        req.url = pathname + query

        next()
    } catch (e) {
        return res.status(400).send('Malformed/Invalid request URL').end()
    }
}
