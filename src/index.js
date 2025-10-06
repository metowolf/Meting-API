import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { createServer } from 'node:https'
import { readFileSync } from 'node:fs'
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
  port: config.http.port
})

console.log(`HTTP server listening on port ${config.http.port}`)

if (config.https.enabled) {
  if (!config.https.keyPath || !config.https.certPath) {
    console.error('HTTPS_ENABLED is true but SSL_KEY_PATH or SSL_CERT_PATH is not configured')
    process.exit(1)
  }

  let key
  let cert

  try {
    key = readFileSync(config.https.keyPath)
    cert = readFileSync(config.https.certPath)
  } catch (error) {
    console.error(`Failed to read SSL certificate files: ${error.message}`)
    process.exit(1)
  }

  serve({
    fetch: app.fetch,
    port: config.https.port,
    createServer,
    serverOptions: { key, cert }
  })

  console.log(`HTTPS server listening on port ${config.https.port}`)
} else {
  console.log('HTTPS server is disabled')
}
