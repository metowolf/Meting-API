import pino from 'pino'

const logger = pino()

const requestLogger = async (c, next) => {
  const start = Date.now()
  await next()
  const ms = Date.now() - start
  logger.info({
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration: ms
  })
}

export {
  requestLogger,
  logger
}
