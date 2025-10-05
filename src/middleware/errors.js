export default async (c, next) => {
  try {
    await next()
  } catch (err) {
    if (err?.kind === 'ObjectId') {
      err.status = 404
    }
    const status = err.status || 500
    c.header('x-error-message', err.message)
    return c.text('服务器未知异常', status)
  }
}
