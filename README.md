# Meting-API

基于 Hono.js 的多平台音乐 API 代理服务,封装 [@meting/core](https://www.npmjs.com/package/@meting/core) 提供的统一音乐 API。

## 特性

- 🎵 支持多个音乐平台:网易云、QQ音乐、酷狗、虾米、百度、酷我
- 🚀 基于 Hono.js 高性能框架
- 💾 内置 LRU 缓存机制,减少上游 API 调用
- 🔐 HMAC-SHA1 令牌鉴权,保护敏感接口
- 🐳 Docker 部署支持
- 📝 结构化 JSON 日志输出

## 支持的平台

| 平台 | server 参数 | 说明 |
|------|------------|------|
| 网易云音乐 | `netease` | - |
| QQ音乐 | `tencent` | - |
| 酷狗音乐 | `kugou` | - |
| 虾米音乐 | `xiami` | - |
| 百度音乐 | `baidu` | - |
| 酷我音乐 | `kuwo` | - |

## 快速开始

### 本地运行

```bash
# 安装依赖
yarn install

# 配置环境变量(可选)
cp .env.example .env
# 编辑 .env 文件配置参数

# 开发模式(热重载)
yarn dev

# 生产模式
yarn start
```

### Docker 部署

```bash
# 构建镜像
docker build -t meting-api .

# 运行容器
docker run -d \
  -p 3000:3000 \
  -e METING_URL=https://your-domain.com \
  -e METING_TOKEN=your-secret-token \
  --name meting-api \
  meting-api
```

使用 Docker Compose:

```yaml
version: '3.8'
services:
  meting-api:
    image: ghcr.io/metowolf/meting-api:latest
    ports:
      - "3000:3000"
    environment:
      - METING_URL=https://your-domain.com
      - METING_TOKEN=your-secret-token
    restart: unless-stopped
```

## 环境变量配置

创建 `.env` 文件或通过环境变量传递:

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `HTTP_PREFIX` | HTTP 路由前缀 | `` (空) |
| `METING_URL` | API 服务的公网访问地址(用于生成回调 URL) | - |
| `METING_TOKEN` | HMAC 签名密钥 | `token` |

## API 接口文档

### 基础接口

```
GET /api
```

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `server` | string | 是 | 音乐平台:`netease`/`tencent`/`kugou`/`xiami`/`baidu`/`kuwo` |
| `type` | string | 是 | 操作类型:`search`/`song`/`album`/`artist`/`playlist`/`lrc`/`url`/`pic` |
| `id` | string | 是 | 资源 ID |
| `token` 或 `auth` | string | 条件 | 认证令牌(仅 `lrc`/`url`/`pic` 类型需要) |

### 操作类型说明

| type | 说明 | 需要鉴权 | 返回格式 |
|------|------|----------|----------|
| `search` | 搜索歌曲 | 否 | JSON 数组 |
| `song` | 获取歌曲详情 | 否 | JSON 数组 |
| `album` | 获取专辑 | 否 | JSON 数组 |
| `artist` | 获取歌手 | 否 | JSON 数组 |
| `playlist` | 获取歌单 | 否 | JSON 数组 |
| `lrc` | 获取歌词 | 是 | 纯文本(LRC 格式) |
| `url` | 获取播放链接 | 是 | 302 重定向 |
| `pic` | 获取封面图片 | 是 | 302 重定向 |

### 响应格式

**列表数据** (search/song/album/artist/playlist):

```json
[
  {
    "title": "歌曲名称",
    "author": "艺术家1 / 艺术家2",
    "url": "https://your-domain.com/api?server=netease&type=url&id=xxx&auth=xxx",
    "pic": "https://your-domain.com/api?server=netease&type=pic&id=xxx&auth=xxx",
    "lrc": "https://your-domain.com/api?server=netease&type=lrc&id=xxx&auth=xxx"
  }
]
```

**歌词数据** (lrc):

```
[00:00.000] 歌词第一行
[00:05.123] 歌词第二行 (翻译内容)
[00:10.456] 歌词第三行
```

**音频/图片** (url/pic):
- 成功:302 重定向到实际资源 URL
- 失败:404 Not Found

### 请求示例

搜索歌曲:
```bash
curl "http://localhost:3000/api?server=netease&type=search&id=周杰伦"
```

获取歌曲详情:
```bash
curl "http://localhost:3000/api?server=netease&type=song&id=歌曲ID"
```

获取歌词(需要 token):
```bash
curl "http://localhost:3000/api?server=netease&type=lrc&id=歌曲ID&auth=计算的token"
```

### 鉴权机制

敏感操作(`lrc`、`url`、`pic`)需要提供 HMAC-SHA1 签名的 token:

```javascript
// Token 计算公式
token = HMAC-SHA1(METING_TOKEN, server + type + id)
```

示例(使用 Node.js):
```javascript
const crypto = require('crypto');

function generateToken(server, type, id, secret = 'token') {
  const message = `${server}${type}${id}`;
  return crypto.createHmac('sha1', secret).update(message).digest('hex');
}

const token = generateToken('netease', 'url', '123456');
```

## 缓存策略

- 默认缓存容量:1000 条记录
- 缓存时长:
  - `url` 类型:10 分钟
  - 其他类型:1 小时
- 响应头 `x-cache`:
  - `miss`:缓存未命中,调用上游 API
  - 无此头:缓存命中

## 错误处理

API 返回标准 HTTP 状态码:

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 302 | 重定向到资源(url/pic 类型) |
| 400 | 参数错误 |
| 401 | 鉴权失败 |
| 404 | 资源不存在 |
| 500 | 上游 API 调用失败或返回格式异常 |

错误信息通过响应头 `x-error-message` 返回。

## 开发

### 代码规范

项目使用 ESLint Standard 规范:

```bash
yarn lint
```

### 技术栈

- **运行时**: Node.js 22+ (ES Module)
- **框架**: [Hono](https://hono.dev/) 4.x
- **核心库**: [@meting/core](https://www.npmjs.com/package/@meting/core) 1.5+
- **缓存**: lru-cache 11.x
- **日志**: pino (JSON 格式)
- **加密**: hash.js (HMAC-SHA1)

## 许可证

MIT License

## 相关项目

- [@meting/core](https://www.npmjs.com/package/@meting/core) - Meting 核心库
- [Meting](https://github.com/metowolf/Meting) - PHP 版本
