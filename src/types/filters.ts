declare global {
    type Filter<T> =
        | T
        | {
              eq?: T
              neq?: T
              like?: T
              gte?: T
              gt?: T
              lte?: T
              lt?: T
              in?: T[]
          }

    type Filters<T> = {
        [K in keyof T]?: Filter<T[K]>
    }
}

export {}
