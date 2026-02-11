import { Sequelize } from 'sequelize'

const DBConfig = {
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!
}

const logging = {
    enabled: true,
    logger: console.log
}

const sequelize = new Sequelize(DBConfig.database, DBConfig.user, DBConfig.password, {
    host: DBConfig.host,
    dialect: 'mysql',
    logging: log => {
        if (logging.enabled) logging.logger(log)
    },
    define: {
        timestamps: false
    }
})

type DB = typeof sequelize & {
    logging: {
        enable: () => void
        disable(): void
        setLogger: () => () => void | Promise<void>
    }
}

export const DB = sequelize as DB

DB.logging = {
    enable: () => {
        logging.enabled = true
    },
    disable: () => {
        logging.enabled = false
    },
    setLogger: () => logging.logger
}

export default DB
