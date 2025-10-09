import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL || 'debug',
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty' }
    : undefined
})

const generateRequestId = () => Math.random().toString(36).substring(7)

const requestLogger = async (c, next) => {
  const requestId = generateRequestId()
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now()

  const requestHeaders = c.req.header()
  const request = {
    method: c.req.method,
    url: c.req.path,
    headers: requestHeaders
  }

  const requestScopedLogger = logger.child({ req: request })

  c.set('logger', requestScopedLogger)
  c.set('requestId', requestId)
  c.header('x-request-id', requestId)

  await next()

  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now()
  const responseTime = Math.round(endTime - startTime)

  const responseHeaders = {}
  for (const [key, value] of c.res.headers.entries()) {
    responseHeaders[key] = value
  }

  const bindings = {
    reqId: requestId,
    res: {
      status: c.res.status,
      headers: responseHeaders
    },
    responseTime
  }

  const level = c.error ? 'error' : 'info'
  const message = c.error?.message || 'Request completed'

  requestScopedLogger[level](bindings, message)
}

export {
  requestLogger,
  logger
}
