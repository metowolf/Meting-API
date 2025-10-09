# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Meting-API 是一个基于 Hono.js 的音乐 API 代理服务,封装了 @meting/core 库提供的多平台音乐 API。项目支持网易云、腾讯、酷狗、虾米、百度、酷我等音乐平台的搜索、歌曲、专辑、歌手、歌单、歌词、URL 和封面图片获取。

## 核心架构

### 认证机制
- 敏感操作(lrc、url、pic)使用 HMAC-SHA1 token 认证
- token 生成逻辑在 `src/service/api.js:120` 的 `auth()` 函数
- 认证参数通过查询字符串中的 `token` 或 `auth` 字段传递
- token 计算公式: `HMAC-SHA1(METING_TOKEN, "${server}${type}${id}")`

### 缓存策略
- 使用 LRU 缓存(lru-cache)缓存 API 响应
- 默认缓存 1000 条记录,TTL 30 秒
- url 类型请求缓存 10 分钟,其他类型缓存 1 小时
- 缓存命中通过 `x-cache` 响应头标识

### URL 转换逻辑
不同音乐平台的 URL 需要特殊处理(在 `src/service/api.js:78-92`):
- **网易云**: m7c/m8c 替换为 m7/m8,强制使用 HTTPS
- **腾讯**: ws.stream.qqmusic.qq.com 替换为 dl.stream.qqmusic.qq.com,强制使用 HTTPS
- **百度**: zhangmenshiting.qianqian.com 替换为 gss3.baidu.com CDN 地址

### 歌词格式化
`src/utils/lyric.js` 实现了歌词与翻译的合并:
- 解析 LRC 时间戳格式 `[mm:ss.xxx]`
- 按时间轴匹配原文和翻译
- 翻译附加在原文后,格式: `原文 (翻译)`

## 常用命令

```bash
# 开发环境(使用 nodemon 自动重启)
yarn dev

# 生产环境
yarn start

# 代码检查(使用 ESLint Standard 规范)
yarn lint

# Docker 构建
docker build -t meting-api .

# Docker 运行
docker run -p 3000:3000 -e METING_URL=https://example.com -e METING_TOKEN=secret meting-api
```

## 环境变量

在 `.env` 文件中配置或通过环境变量传递:

- `HTTP_PREFIX`: HTTP 路由前缀(默认为空)
- `METING_URL`: API 服务的公网访问地址(用于生成回调 URL)
- `METING_TOKEN`: HMAC 签名密钥(默认 "token")

## API 端点

单一端点: `GET /api`(可通过 HTTP_PREFIX 修改)

**查询参数**:
- `server`: 音乐平台(netease/tencent/kugou/xiami/baidu/kuwo)
- `type`: 操作类型(search/song/album/artist/playlist/lrc/url/pic)
- `id`: 资源 ID
- `token`/`auth`: 认证令牌(仅 lrc/url/pic 需要)

## 技术栈

- **运行时**: Node.js 18+ (ES Module)
- **框架**: Hono 4.x + @hono/node-server
- **核心库**: @meting/core 1.5+ (音乐 API 封装)
- **缓存**: lru-cache 7.x
- **日志**: pino (JSON 格式,自定义请求日志中间件)
- **加密**: hash.js (HMAC-SHA1)
- **代码规范**: ESLint Standard

## 开发注意事项

### 版本发布
- 更新 package.json 中的 version，采用 Semantic Versioning
- 打 git tag vX.X.X

### 错误处理
- 使用 Hono 错误中间件统一处理(`src/middleware/errors.js`)
- 错误信息通过 `x-error-message` 响应头传递
- 使用 HTTPException 抛出 HTTP 错误(400/401/404/500)
- 上游 API 错误分为调用失败和格式异常两类,均返回 500

### 参数验证
在处理请求前必须严格校验:
- server 参数必须在白名单内(6 个平台)
- type 参数必须在允许的 8 种类型内
- 不合法参数返回 400 错误

### 代码风格
- 使用 ES Module(`import/export`)
- 遵循 JavaScript Standard Style
- 使用 async/await 处理异步操作
- 文件组织:按职责分离(service/middleware/utils)
