import koaPino from 'koa-pino-logger'
import pino from 'pino'

const requestLogger = koaPino()
const logger = pino()

export {
  requestLogger,
  logger
}
