import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { URL } from 'node:url'
import config from '../config.js'

/**
 * 读取指定平台的 cookie 文件
 * @param {string} server - 平台名称 (netease, tencent 等)
 * @returns {Promise<string>} cookie 字符串，失败时返回空字符串
 */
export async function readCookieFile (server) {
  try {
    const cookiePath = resolve(process.cwd(), 'cookie', server)
    const cookie = await readFile(cookiePath, 'utf-8')
    return cookie.trim()
  } catch (error) {
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
