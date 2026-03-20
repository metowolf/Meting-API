import Meting from '@meting/core'
import { createHmac } from 'node:crypto'
import { HTTPException } from '../utils/http-exception.js'
import config from '../config.js'
import { format as lyricFormat } from '../utils/lyric.js'
import { readCookieFile, isAllowedHost } from '../utils/cookie.js'
import { getKugouCoverFromSonginfo } from '../utils/kugou-songinfo.js'
import {
  canUseKugouSharePlaylist,
  getKugouPlaylistFromShare,
  normalizeKugouSharePlaylistInput
} from '../utils/kugou-share-playlist.js'
import { LRUCache } from 'lru-cache'

const cache = new LRUCache({
  max: 1000,
  ttl: 1000 * 30
})
const METING_METHODS = {
  search: 'search',
  song: 'song',
  album: 'album',
  artist: 'artist',
  playlist: 'playlist',
  lrc: 'lyric',
  url: 'url',
  pic: 'pic'
}

export default async (request, ctx) => {
  // 1. 初始化参数
  const url = new URL(request.url)
  const query = Object.fromEntries(url.searchParams)
  const server = query.server || 'netease'
  const type = query.type || 'search'
  let id = query.id || 'hello'
  const token = query.token || query.auth || 'token'

  if (server === 'kugou' && type === 'playlist') {
    id = normalizeKugouSharePlaylistInput(id) || id
  }

  const isKugouSharePlaylist = server === 'kugou' && type === 'playlist' && canUseKugouSharePlaylist(id)

  // 2. 校验参数
  if (!['netease', 'tencent', 'kugou', 'baidu', 'kuwo'].includes(server)) {
    throw new HTTPException(400, { message: 'server 参数不合法' })
  }
  if (!['song', 'album', 'search', 'artist', 'playlist', 'lrc', 'url', 'pic'].includes(type)) {
    throw new HTTPException(400, { message: 'type 参数不合法' })
  }

  // 3. 鉴权
  if (['lrc', 'url', 'pic'].includes(type)) {
    if (auth(server, type, id) !== token) {
      throw new HTTPException(401, { message: '鉴权失败,非法调用' })
    }
  }

  // 4. 调用 API
  const cacheKey = `${server}/${type}/${id}`
  let data = cache.get(cacheKey)
  if (data === undefined) {
    ctx.responseHeaders.set('x-cache', 'miss')
    const meting = new Meting(server)
    meting.format(true)

    // 检查 referrer 并配置 cookie
    const referrer = request.headers.get('referer')
    if (isAllowedHost(referrer)) {
      const cookie = await readCookieFile(server)
      if (cookie) {
        meting.cookie(cookie)

        if (server === 'kugou' && type === 'pic') {
          const cover = await getKugouCoverFromSonginfo({ hash: id, cookie, size: 400 })
          if (cover) {
            data = cover
          }
        }
      }
    }

    if (data === undefined) {
      if (isKugouSharePlaylist) {
        data = await getKugouPlaylistFromShare(id)
      }

      if (data === undefined) {
        const method = METING_METHODS[type]
        let response
        try {
          response = await meting[method](id)
        } catch {
          throw new HTTPException(500, { message: '上游 API 调用失败' })
        }
        try {
          data = JSON.parse(response)
        } catch {
          throw new HTTPException(500, { message: '上游 API 返回格式异常' })
        }
      }
    }
    cache.set(cacheKey, data, {
      ttl: isKugouSharePlaylist
        ? 1000 * 30
        : (type === 'url' ? 1000 * 60 * 10 : 1000 * 60 * 60)
    })
  }

  // 5. 组装结果
  if (type === 'url') {
    let url = data.url
    // 空结果返回 404
    if (!url) {
      return new Response(null, { status: 404 })
    }
    // 链接转换
    if (server === 'netease') {
      url = url
        .replace('://m7c.', '://m7.')
        .replace('://m8c.', '://m8.')
        .replace('http://', 'https://')
      if (url.includes('vuutv=')) {
        const tempUrl = new URL(url)
        tempUrl.search = ''
        url = tempUrl.toString()
      }
    }
    if (server === 'tencent') {
      url = url
        .replace('http://', 'https://')
        .replace('://ws.stream.qqmusic.qq.com', '://dl.stream.qqmusic.qq.com')
    }
    if (server === 'baidu') {
      url = url
        .replace('http://zhangmenshiting.qianqian.com', 'https://gss3.baidu.com/y0s1hSulBw92lNKgpU_Z2jR7b2w6buu')
    }
    return new Response(null, { status: 302, headers: { location: url } })
  }

  if (type === 'pic') {
    const url = data.url
    // 空结果返回 404
    if (!url) {
      return new Response(null, { status: 404 })
    }
    return new Response(null, { status: 302, headers: { location: url } })
  }

  if (type === 'lrc') {
    return new Response(lyricFormat(data.lyric, data.tlyric || ''), {
      headers: { 'content-type': 'text/plain; charset=utf-8' }
    })
  }

  const safeData = Array.isArray(data) ? data : (data?.error ? [] : [data])
  return Response.json(safeData.map(x => {
    const title = x.name || x.songName || '未知歌曲'
    let author = '未知歌手'
    if (Array.isArray(x.artist)) {
      author = x.artist.join(' / ')
    } else if (Array.isArray(x.authors)) {
      author = x.authors.map(a => a.author_name).join(' / ')
    } else if (typeof x.singerName === 'string') {
      author = x.singerName
    }

    const urlId = server === 'kugou'
      ? (x.hash || x.url_id || id)
      : (x.url_id || x.hash || id)
    const picId = server === 'kugou'
      ? (x.hash || x.pic_id || x.url_id || id)
      : (x.pic_id || x.album_audio_id || x.albumid || x.hash || id)
    const lrcId = x.lyric_id || x.hash || id

    return {
      title,
      author,
      url: `${config.meting.url}/api?server=${server}&type=url&id=${urlId}&auth=${auth(server, 'url', urlId)}`,
      pic: `${config.meting.url}/api?server=${server}&type=pic&id=${picId}&auth=${auth(server, 'pic', picId)}`,
      lrc: `${config.meting.url}/api?server=${server}&type=lrc&id=${lrcId}&auth=${auth(server, 'lrc', lrcId)}`
    }
  }))
}

const auth = (server, type, id) => {
  return createHmac('sha1', config.meting.token).update(`${server}${type}${id}`).digest('hex')
}
