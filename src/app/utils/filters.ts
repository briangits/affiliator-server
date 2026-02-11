import { Op } from 'sequelize'

export function sequelize<T>(filters?: Filters<T>): Partial<Record<keyof T, any>> | undefined {
    if (!filters) return undefined

    const _filters: Partial<Record<keyof T, any>> = {}

    for (const key in filters) {
        const filter = filters[key] as Filter<any>
        if (filter === undefined) continue

        if (Array.isArray(filter)) {
            _filters[key] = { [Op.in]: filter }
            continue
        }

        if (filter === null || typeof filter !== 'object' || filter instanceof Date) {
            _filters[key] = {
                [filter === null ? Op.is : Op.eq]: filter
            }
            continue
        }
        const _filter: any = {}

        if (filter.eq !== undefined) {
            _filter[filter.eq === null ? Op.is : Op.eq] = filter.eq
        }
        if (filter.neq !== undefined) {
            _filter[filter.eq === null ? Op.not : Op.ne] = filter.eq
        }
        if (filter.like !== undefined) _filter[Op.like] = filter.like
        if (filter.gte !== undefined) _filter[Op.gte] = filter.gte
        if (filter.gt !== undefined) _filter[Op.gt] = filter.gt
        if (filter.lte !== undefined) _filter[Op.lte] = filter.lte
        if (filter.lt !== undefined) _filter[Op.lt] = filter.lt
        if (filter.in !== undefined)
            _filter[Op.in] = filter.in
                ?.filter((value: any) => value !== null)
                ?.takeIf((value: any) => value.length > 0)

        if (Object.getOwnPropertySymbols(_filter).length) {
            _filters[key] = _filter
        }
    }

    return _filters
}
