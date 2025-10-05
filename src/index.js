import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { requestLogger } from './middleware/logger.js'
import errors from './middleware/errors.js'
import apiService from './service/api.js'
import config from './config.js'

const app = new Hono()

app.use(cors())
app.use(requestLogger)
app.use(errors)

app.get(`${config.http.prefix}/api`, apiService)

serve({
  fetch: app.fetch,
  port: 3000
})
