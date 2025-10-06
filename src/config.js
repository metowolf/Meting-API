import dotenv from 'dotenv'

dotenv.config()

const toBoolean = value => {
  if (value === undefined) return false
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase())
}

const toNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

export default {
  http: {
    prefix: process.env.HTTP_PREFIX || '',
    port: toNumber(process.env.HTTP_PORT, 80)
  },
  https: {
    enabled: toBoolean(process.env.HTTPS_ENABLED),
    port: toNumber(process.env.HTTPS_PORT, 443),
    keyPath: process.env.SSL_KEY_PATH || '',
    certPath: process.env.SSL_CERT_PATH || ''
  },
  meting: {
    url: process.env.METING_URL || '',
    token: process.env.METING_TOKEN || 'token'
  }
}
