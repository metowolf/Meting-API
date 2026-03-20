const KUGOU_SHARE_HTML_PATTERNS = [
  /var\s+dataFromSmarty\s*=\s*(\[[\s\S]*?\])\s*,\s*\/\//,
  /var\s+dataFromSmarty\s*=\s*(\[[\s\S]*?\])\s*;/
]

const KUGOU_SHARE_HOSTS = new Set([
  't1.kugou.com',
  'wwwapi.kugou.com'
])

const KUGOU_SHARE_CODE_PATTERN = /^(?=.*[A-Za-z])[A-Za-z0-9]{8,}$/
const FETCH_TIMEOUT_MS = 15000

const normalizeHash = value => String(value || '').trim().toUpperCase()

function normalizeShareInput (value) {
  if (!value || typeof value !== 'string') return null

  const input = value.trim()
  if (KUGOU_SHARE_CODE_PATTERN.test(input)) {
    return `https://t1.kugou.com/${input}`
  }

  try {
    const url = new URL(input)
    const hostname = url.hostname.toLowerCase()
    if (!KUGOU_SHARE_HOSTS.has(hostname)) return null

    if (hostname === 't1.kugou.com') {
      const code = url.pathname.replace(/^\//, '')
      if (!KUGOU_SHARE_CODE_PATTERN.test(code)) return null
      return `https://t1.kugou.com/${code}`
    }

    if (url.pathname !== '/share/zlist.html') return null

    const chain = url.searchParams.get('chain') || ''
    if (KUGOU_SHARE_CODE_PATTERN.test(chain)) {
      return `https://t1.kugou.com/${chain}`
    }

    return url.toString()
  } catch {
    return null
  }
}

function parseSharePlaylistData (html) {
  if (!html) return []

  for (const pattern of KUGOU_SHARE_HTML_PATTERNS) {
    const match = html.match(pattern)
    if (!match) continue

    try {
      const parsed = JSON.parse(match[1])
      if (Array.isArray(parsed)) return parsed
    } catch {}
  }

  return []
}

function normalizeShareSongs (items) {
  const songs = []
  const seen = new Set()

  for (const item of items) {
    const hash = normalizeHash(item?.hash)
    if (!hash || seen.has(hash)) continue
    seen.add(hash)

    const artist = String(item?.author_name || '').trim()
    songs.push({
      name: String(item?.song_name || '').trim(),
      artist: artist ? [artist] : [],
      album: '',
      album_id: String(item?.album_id || '').trim(),
      hash,
      source: 'kugou-share'
    })
  }

  return songs
}

async function fetchText (url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    })

    if (!response.ok) return null

    return {
      url: response.url,
      html: await response.text()
    }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export function canUseKugouSharePlaylist (value) {
  return Boolean(normalizeShareInput(value))
}

export function normalizeKugouSharePlaylistInput (value) {
  return normalizeShareInput(value)
}

export async function getKugouPlaylistFromShare (value) {
  const normalizedInput = normalizeShareInput(value)
  if (!normalizedInput) return null

  const response = await fetchText(normalizedInput)
  if (!response) return null

  const finalUrl = response.url || normalizedInput
  if (!normalizeShareInput(finalUrl)) return null

  const items = parseSharePlaylistData(response.html)
  if (items.length === 0) return null

  return normalizeShareSongs(items)
}
