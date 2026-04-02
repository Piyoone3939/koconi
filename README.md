# Koconi

旅行記録・写真管理・マップアプリ。移動経路を地図上に色づけし、写真からAIでランドマークをローポリ3Dモデルとして地図上に"建てる"体験を提供します。

## 機能概要

- **3Dランドマーク**: 写真をAIで解析し、ローポリ3Dモデルを地図上に配置
- **アルバム管理**: 旅行・日付・場所でフィルタリングできる写真アルバム
- **招待制グループ共有**: トークンベースのプライバシー重視の共有モデル

## アーキテクチャ

```
apps/
  mobile/   # React Native (Expo) モバイルアプリ (iOS / Android)
  LP/       # ランディングページ (React + Vite)

services/
  api/      # バックエンド API (Go)
  ai/       # AI ランドマーク抽出サーバー (Python / FastAPI)

infra/
  nginx/    # リバースプロキシ
```

## 必要環境

| ツール | バージョン |
|--------|-----------|
| Go | 1.26+ |
| Node.js | 20+ |
| Python | 3.10+ |
| Docker / Docker Compose | 最新安定版 |
| Expo CLI | `expo@54` |

## 起動方法

### Docker（本番 / 統合確認）

```bash
# ルートで実行
cp services/api/.env.example services/api/.env  # 環境変数を編集する
docker compose up --build
```

| サービス | URL |
|---------|-----|
| API | http://localhost:3000 |
| AI | http://localhost:8000 |
| LP (nginx) | http://localhost:80 |

---

### モバイルアプリ（開発）

```bash
cd apps/mobile
npm install
npx expo start
```

Expo Go アプリ（iOS / Android）でQRコードをスキャンして動作確認できます。

---

### API サーバー（開発）

```bash
cd services/api

# 依存解決
go mod download

# DB マイグレーション & コード生成
npm run prisma:generate   # ※ npx prisma generate は使わない（.envの読み込み問題あり）

# 起動
go run ./cmd/...
```

> PostgreSQL が起動していること（または `docker compose up koconi_db` で先に DB だけ起動）。

---

### AI サーバー（開発）

```bash
cd services/ai
pip install -r requirements.txt

# FAISSインデックスを事前にビルド（初回）
python build_index.py

# サーバー起動
python serve.py
```

---

### LP（開発）

```bash
cd apps/LP
npm install
npm run dev
```

## 環境変数

`services/api/.env` に以下を設定します（`.env.example` を参考に）。

| 変数 | 説明 |
|------|------|
| `DATABASE_URL` | PostgreSQL 接続文字列 |
| `AI_BASE_URL` | AI サーバーのベース URL |
| `CLOUDFLARE_TUNNEL_TOKEN` | Cloudflare Tunnel トークン（本番のみ） |

## データモデル（主要エンティティ）

`Trip` → `TrackPoint` / `Photo` → `Landmark` → `Comment`

詳細は [docs/PRD.md](docs/PRD.md) を参照。

## ロードマップ

| フェーズ | 内容 |
|---------|------|
| M1 (MVP) | 位置トラッキング・写真撮影・アルバム・招待共有・AI PoC |
| M2 | オンデバイス AI・トリップ編集・GPX エクスポート |
| M3 | Web ビューワ・ソーシャル機能・スケール最適化 |
