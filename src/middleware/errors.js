import { logger as baseLogger } from './logger.js'

export default async (c, next) => {
  try {
    await next()
  } catch (err) {
    if (err?.kind === 'ObjectId') {
      err.status = 404
    }
    const status = err.status || 500

    // 获取请求级 logger，如未设置则回退到全局 logger
    const requestLogger = c.get('logger') ?? baseLogger
    const requestId = c.get('requestId')

    // 记录结构化错误日志
    const logPayload = {
      error: {
        message: err.message,
        stack: err.stack,
        name: err.name,
        status
      },
      request: {
        method: c.req.method,
        path: c.req.path,
        query: c.req.query(),
        userAgent: c.req.header('user-agent'),
        ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'
      }
    }

    if (requestId) {
      logPayload.request.requestId = requestId
    }

    requestLogger.error(logPayload, 'Request error occurred')

    c.header('x-error-message', err.message)
    return c.text('服务器未知异常', status)
  }
}
