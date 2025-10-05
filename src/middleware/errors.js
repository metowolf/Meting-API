export default async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    if (err?.kind === 'ObjectId') {
      err.status = 404
    } else {
      ctx.status = err.status || 500
      ctx.set('x-error-message', err.message)
      ctx.body = '服务器未知异常'
    }
  }
}
