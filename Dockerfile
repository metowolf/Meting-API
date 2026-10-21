# syntax=docker/dockerfile:1

# 固定次要版本，避免 latest 漂移；如需完全可复现可精确到 1.4.3-alpine
FROM oven/bun:1.4-alpine

ENV NODE_ENV=production

WORKDIR /app

# 先只拷贝依赖清单，利用层缓存；锁文件名为 bun.lock（文本格式）
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --production --no-progress

# 再拷贝源码（.dockerignore 已排除 .git/.env 等无关文件）
COPY . .

EXPOSE 80 443

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD ["bun", "-e", "fetch(`http://127.0.0.1:${process.env.HTTP_PORT || 80}${process.env.HTTP_PREFIX || ''}/demo`).then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]

ENTRYPOINT ["bun", "src/index.js"]
