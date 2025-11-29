FROM node:20-alpine



WORKDIR /app

# 依存関係を先にコピー＆インストール
COPY package*.json ./
RUN npm install --omit=dev

# ソースをコピー
COPY . .

# Prismaクライアント生成
RUN npx prisma generate

EXPOSE 3000
CMD ["npm", "start"]