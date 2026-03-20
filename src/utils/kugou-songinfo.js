import { createHash } from 'node:crypto'

const SIGN_KEY = 'NVPh5oo715z5DIWAeQlhMDsWXXQV4hwt'

function parseCookie (cookie = '') {
  const out = {}
  for (const part of cookie.split(';')) {
    const item = part.trim()
    if (!item) continue

    const index = item.indexOf('=')
    if (index === -1) continue

    const key = item.slice(0, index).trim()
    const value = item.slice(index + 1).trim()
    if (!key) continue
    out[key] = value
  }

  return out
}

function signature (params) {
  const sorted = Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join('&')
    .split('&')
    .sort()
    .join('')

  return createHash('md5')
    .update(`${SIGN_KEY}${sorted}${SIGN_KEY}`)
    .digest('hex')
}

function buildSonginfoUrl (params) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    query.set(key, String(value))
  }
  query.set('signature', signature(params))
  return `https://wwwapi.kugou.com/play/songinfo?${query.toString()}`
}

function normalizeCoverUrl (value, size = 400) {
  if (!value) return ''

  let result = String(value)
  if (result.includes('{size}')) {
    result = result.replace('{size}', String(size))
  }
  if (result.startsWith('http://')) {
    result = `https://${result.slice('http://'.length)}`
  }

  return result
}

async function getKugouSonginfo ({ hash, cookie }) {
  if (!hash || !cookie) return null

  const parsed = parseCookie(cookie)
  const token = parsed.t || ''
  const userId = parsed.KugooID || ''
  if (!token || !userId) return null

  const mid = parsed.mid || parsed.kg_mid || ''
  const dfid = parsed.dfid || parsed.kg_dfid || ''
  const uuid = parsed.uuid || mid
  const now = Date.now()

  const params = {
    srcappid: '2919',
    clientver: '20000',
    clienttime: String(now),
    mid,
    uuid,
    dfid,
    appid: '1014',
    platid: '4',
    hash: String(hash).toUpperCase(),
    token,
    userid: userId
  }

  try {
    const response = await fetch(buildSonginfoUrl(params), {
      method: 'GET',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0',
        Cookie: cookie
      }
    })

    if (!response.ok) return null

    const json = await response.json()
    const data = json && typeof json === 'object' ? json.data : null
    return data && typeof data === 'object' ? data : null
  } catch {
    return null
  }
}

export async function getKugouCoverFromSonginfo ({ hash, cookie, size = 400 }) {
  const data = await getKugouSonginfo({ hash, cookie })
  if (!data) return null

  const cover = data.trans_param?.union_cover || data.sizable_cover || data.img || ''
  const url = normalizeCoverUrl(cover, size)
  return url ? { url } : null
}
