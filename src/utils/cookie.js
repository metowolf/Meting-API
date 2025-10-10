import { readFile, watch } from 'node:fs/promises'
import { resolve } from 'node:path'
import { URL } from 'node:url'
import config from '../config.js'

// Cookie 缓存
const cookieCache = new Map()
const COOKIE_TTL = 1000 * 60 * 5 // 5分钟缓存过期

// 启动文件监听
const cookieDir = resolve(process.cwd(), 'cookie')
let watcher = null

async function startWatcher () {
  try {
    watcher = watch(cookieDir)
    for await (const event of watcher) {
      if (event.filename) {
        // 文件变化时清除对应缓存
        cookieCache.delete(event.filename)
      }
    }
  } catch (error) {
    // 监听失败不影响正常运行
  }
}

// 启动监听（仅启动一次）
if (!watcher) {
  startWatcher().catch(() => {})
}

/**
 * 读取指定平台的 cookie 文件
 * @param {string} server - 平台名称 (netease, tencent 等)
 * @returns {Promise<string>} cookie 字符串，失败时返回空字符串
 */
export async function readCookieFile (server) {
  const now = Date.now()
  const cached = cookieCache.get(server)

  // 检查缓存是否有效
  if (cached && now - cached.timestamp < COOKIE_TTL) {
    return cached.value
  }

  // 优先从环境变量读取
  const envKey = `METING_COOKIE_${server.toUpperCase()}`
  const envCookie = process.env[envKey]
  if (envCookie) {
    const value = envCookie.trim()
    // 更新缓存
    cookieCache.set(server, {
      value,
      timestamp: now
    })
    return value
  }

  // 从文件读取
  try {
    const cookiePath = resolve(process.cwd(), 'cookie', server)
    const cookie = await readFile(cookiePath, 'utf-8')
    const value = cookie.trim()

    // 更新缓存
    cookieCache.set(server, {
      value,
      timestamp: now
    })

    return value
  } catch (error) {
    // 读取失败时也缓存空字符串，避免频繁读取不存在的文件
    cookieCache.set(server, {
      value: '',
      timestamp: now
    })
    return ''
  }
}

/**
 * 验证 referrer 是否在允许的主机列表中
 * @param {string} referrer - 请求的 referrer
 * @returns {boolean} 是否允许
 */
export function isAllowedHost (referrer) {
  if (config.meting.cookie.allowHosts.length === 0) return true
  if (!referrer) return false

  try {
    const url = new URL(referrer)
    const hostname = url.hostname.toLowerCase()
    return config.meting.cookie.allowHosts.includes(hostname)
  } catch (error) {
    return false
  }
}
