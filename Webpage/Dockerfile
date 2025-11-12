# --- Build stage ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# もし next export を使わない SSR 運用なら build のみ
RUN npm run build

# --- Run stage ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
# Next.js の本番起動は 3001 番で待ち受け
EXPOSE 3001
# next start でSSR運用（export静的配信にしたい場合は nginx 経由の静的ホスティングに切替可）
CMD ["npm", "start", "--", "-p", "3001"]