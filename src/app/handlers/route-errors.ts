import express, { RequestHandler, Router } from 'express'
import { match } from 'path-to-regexp'

type SingleRoute = {
    single: true
    methods: string[]
    matchers: ReturnType<typeof match>[]
}

type RouteGroup = {
    single: false
    matchers: ReturnType<typeof match>[] | (() => boolean)[]
    routes: (SingleRoute | RouteGroup)[]
}

type Route = SingleRoute | RouteGroup

function getRoutes(layer: any): Route {
    if (layer.route && typeof layer.route === 'object') {
        const methods: Set<string> = new Set(Object.keys(layer.route.methods))
        methods.add('options')
        if (methods.has('get')) methods.add('head')

        const matchers = layer.matchers
        if (layer.slash) matchers.push(() => true)

        return { single: true, matchers, methods: Array.from(methods) }
    } else if (layer.handle && (layer.handle as Router).stack) {
        const matchers = layer.matchers
        if (layer.slash) matchers.push(() => true)

        const routes = layer.handle.stack
            .map((l: any) => getRoutes(l))
            .filter((r: Route) => !r.single || (r.single && r.methods.length > 0))

        return { single: false, matchers, routes }
    } else if (layer.stack) {
        const matchers = [() => true]
        const routes = layer.stack
            .map((l: any) => getRoutes(l))
            .filter((r: Route) => !r.single || (r.single && r.methods.length > 0))
        return { single: false, matchers, routes }
    }

    return { single: true, matchers: [() => layer.slash], methods: [] }
}

function getRoute(route: Route, path: string): SingleRoute[] {
    const matchers = route.matchers.filter(matcher => matcher(path) !== false)
    if (matchers.length <= 0) return []

    const result: SingleRoute[] = []

    if (route.single) result.push(route)
    else {
        for (const matcher of matchers) {
            const match: any = matcher(path)

            let matchedPath: string = match.path || ''
            matchedPath = matchedPath === '/' ? '' : matchedPath

            if (match) {
                for (const subRoute of route.routes) {
                    const _result = getRoute(subRoute, path.slice(matchedPath.length) || '/') || []
                    if (_result) result.push(..._result)
                }
            }
        }
    }
    ;``

    return result
}

function methodAllowed(routes: SingleRoute[], ctx: { path: string; method: string }): boolean {
    const allowesMethods = routes.reduce((acc, route) => {
        return acc.concat(route.methods)
    }, [] as string[])

    return allowesMethods.includes('_all') || allowesMethods.includes(ctx.method.toLowerCase())
}

const MethodNotAllowed: (router: express.Router) => RequestHandler = router => {
    const routes = getRoutes(router)

    return (req, res, next) => {
        const route = getRoute(routes, req.path)
        if (!route) return next()

        if (!methodAllowed(route, { path: req.path, method: req.method })) {
            return res.status(405).message('Method Not Allowed').end()
        }

        next()
    }
}

const RouteNotFound: (router: Router) => RequestHandler = router => {
    const routes = getRoutes(router)

    return (req, res, next) => {
        const route = getRoute(routes, req.path)

        if (!route) {
            return res.status(404).message('Not Found').end()
        }

        next()
    }
}

const RouteErrors: (router: Router) => RequestHandler = router => {
    return (req, res, next) => {
        const routes = getRoutes(router)

        const route = getRoute(routes, req.path)
        if (route?.length <= 0) return res.status(404).message('Not Found').end()

        if (!methodAllowed(route, { path: req.path, method: req.method })) {
            return res.status(405).message('Method Not Allowed').end()
        }

        next()
    }
}

export { MethodNotAllowed, RouteNotFound, RouteErrors }
