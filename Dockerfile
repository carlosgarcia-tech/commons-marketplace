FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci --legacy-peer-deps

FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run lint

FROM node:22-alpine AS runner

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY --from=builder /app/src ./src
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.env.example ./

RUN mkdir -p logs && chown nodejs:nodejs logs

USER nodejs

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]