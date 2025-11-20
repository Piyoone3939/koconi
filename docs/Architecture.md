# 🧩 Koconi Full Architecture — Unity × AI × Cloud

> 本ドキュメントは「Koconi 3D版 技術スタック完全図」と「Unityプロジェクト構成設計」を統合した、
> Koconiの**モバイル・AI・バックエンド・インフラ全体の包括アーキテクチャ設計書**です。

---

# 🗺️ 第1章: Koconi 3D版 技術スタック完全図（Unityベース）

> 以下は、Unityを中心に構築する Koconi モバイルアプリの全体技術構成・AI連携・インフラ構成です。

## 0. 目的と原則

- **目的**: 写真・位置・3Dランドマークを関連付け、**地図上に思い出を“建てる”**体験を提供する。
- **原則**
  - オンデバイス優先（オフライン対応）
  - 3D優先UI（地図×3Dの融合）
  - プライバシーファースト（位置・写真の扱いを透明化）
  - MVP→拡張を意識した段階的スケーラビリティ

---

## 1. 全体アーキテクチャ図

```
[Unityクライアント]
  ├─ Mapbox SDK for Unity
  ├─ Barracuda (ONNX AI)
  ├─ SQLite / Resources DB
  ├─ 自作3Dモデル (GLB/GLTF)
  └─ REST / JWT 通信
           │
           ▼
[Hono APIサーバー (TypeScript)]
  ├─ Auth / Trips / Photos / Landmarks
  ├─ Prisma / Drizzle ORM
  ├─ Redisキャッシュ
           │
           ▼
[AI推論サーバー (FastAPI + Python)]
  ├─ CLIP / ViTモデル
  ├─ Faiss / Milvus ベクトル検索
  ├─ Celery / Redis Queue
           │
           ▼
[DB + ストレージ + インフラ]
  ├─ PostgreSQL + PostGIS
  ├─ MinIO（S3互換）
  ├─ Grafana + Loki + Prometheus
  └─ GitHub Actions / Cloudflare
```

---

## 2. 層別構成（Unity・AI・API・Infra）

### Unityクライアント

| 機能 | 技術 | 補足 |
|------|------|------|
| 地図描画 | Mapbox SDK for Unity | 白地図スタイル対応 |
| 3D描画 | Unity 2023 LTS + URP | 軽量レンダリング |
| AI推論 | Barracuda / ONNX Runtime | オフラインマッチング |
| 位置情報 | GPS (Input.location) | 経路追跡 |
| DB | SQLite | キャッシュ |
| 認証 | JWT (Keychain/Keystore) | セキュリティ |
| 通信 | UnityWebRequest | API通信 |

### AIモジュール

| レイヤー | 技術 | 概要 |
|-----------|--------|------|
| オンデバイス | Barracuda / ONNX | 内蔵モデルで埋め込み類似度 |
| クラウド | FastAPI + PyTorch | 高精度マッチング |
| ベクトルDB | Faiss / Milvus / pgvector | 埋め込み検索 |
| 継続学習 | W&B / MLflow | モデル更新 |
| 特徴データ | PostgreSQL / JSON | メタ情報保持 |

### API / DB / ストレージ

| 層 | 技術 | 内容 |
|----|------|------|
| API | Hono + TypeScript | 軽量REST構成 |
| DB | PostgreSQL + PostGIS | 位置情報管理 |
| ストレージ | MinIO (S3互換) | 写真・GLB管理 |
| CDN | Cloudflare | 配信最適化 |
| 監視 | Grafana Stack | ログ・メトリクス |
| CI/CD | GitHub Actions | 自動デプロイ |

---

## 3. データフロー

1. Unityで撮影 → EXIF + GPS付与  
2. Barracudaが写真特徴量を抽出  
3. 内蔵ローポリモデルの特徴量と類似度比較 → 候補提示  
4. ユーザー選択・配置 → APIで保存  
5. Hono APIがPostgres/MinIOに登録  
6. FastAPIサーバーが再マッチング（オンライン時）  
7. クラウド結果を同期・再描画

---

## 4. セキュリティ設計

- 通信: TLS1.3 + JWT(RS256署名)  
- 位置データ: ユーザー許可ベース  
- 署名付きURLによるS3直PUT  
- GDPR/CCPA対応API（削除・ポータビリティ）  
- オンデバイス優先でプライバシー保護

---

## 5. フェーズ別拡張計画

| フェーズ | 主要実装 | 技術テーマ |
|----------|----------|-------------|
| M0 | 設計・環境構築 | Docker + Unity 雛形 |
| M1 | 経路 + 写真 + 3D表示 | Mapbox + glTF Loader |
| M2 | AIローカル推論 | ONNX + Barracuda |
| M3 | 共有・通知 | Redis + JWT + FCM |
| M4 | Webビューア | Next.js + MapLibre |
| M5 | 継続学習AI | Faiss + CLIP再学習 |

---

# 🎮 第2章: Koconi Unity プロジェクト構成設計

> ここでは、Unityプロジェクト内部構成と主要スクリプトを設計します。

## 📁 フォルダ構成

```
KoconiUnity/
├── Assets/
│   ├── Scripts/
│   │   ├── Managers/        # GameManager, MapManager, AIManager, LandmarkManager
│   │   ├── UI/              # UIController, PopupManager
│   │   ├── Data/            # DTO/Entity, Repositories
│   │   ├── Network/         # ApiClient, AuthClient
│   │   └── Utils/           # Extensions, Logger
│   ├── Models/              # 自作ローポリ(GLB/GLTF)
│   ├── Prefabs/             # LandmarkPrefab, MapPins
│   ├── Materials/
│   ├── Textures/
│   ├── Scenes/              # Main, Album, Map, Login
│   ├── Resources/           # assets_catalog.json, config.json
│   └── Plugins/             # Mapbox, Barracuda, SQLite
├── Packages/
├── ProjectSettings/
└── README.md
```

---

## 🧠 主要スクリプト設計

| スクリプト | 概要 | 依存 |
|-------------|------|------|
| `GameManager.cs` | 全体状態制御 | PlayerPrefs, NetworkManager |
| `MapManager.cs` | 地図制御 | Mapbox SDK |
| `PhotoManager.cs` | 撮影/保存処理 | NativeCamera |
| `AIManager.cs` | 特徴量推論 | Barracuda / ONNX |
| `LandmarkManager.cs` | 3D配置・操作 | glTF Importer |
| `NetworkManager.cs` | REST通信 | UnityWebRequest |
| `DataManager.cs` | SQLite制御 | SQLite.NET |
| `UIController.cs` | 画面遷移 | uGUI |
| `GroupManager.cs` | 共有機能 | JWT / API |
| `DebugConsole.cs` | デバッグ用UI | EditorGUI |

---

## 💾 データ管理

- ローカル: SQLite（位置履歴・設定・キャッシュ）  
- クラウド: Hono API（Trip, Photo, Landmark, Group）  
- モデル情報: `model_asset_id`, `transform`, `confidence` をJSONで保持

---

## 🌐 API通信

| エンドポイント | メソッド | 機能 |
|----------------|-----------|------|
| `/api/v1/auth/login` | POST | ログイン |
| `/api/v1/trips` | GET/POST | 旅行記録 |
| `/api/v1/photos` | POST | 写真アップロード |
| `/api/v1/landmarks` | GET/POST | ランドマーク同期 |
| `/api/v1/groups` | GET/POST | グループ管理 |
| `/api/v1/search` | GET | 検索 |

---

## 🔧 開発フェーズ指針

| フェーズ | 目的 | 内容 |
|----------|------|------|
| Phase1 | オフラインMVP | 地図描画＋写真撮影 |
| Phase2 | AI統合 | Barracuda推論 |
| Phase3 | クラウド同期 | Hono API接続 |
| Phase4 | 継続運用 | Web連携 + CI/CD |

---

# ✅ 統合まとめ

| レイヤー | 主体 | 技術 | 目的 |
|-----------|------|------|------|
| クライアント | Unity | Mapbox, Barracuda, SQLite | 3D地図・AI推論 |
| API | Hono | TypeScript, Prisma | 軽量REST構成 |
| AIサーバ | FastAPI | PyTorch, Faiss | 高精度マッチング |
| DB | PostgreSQL | PostGIS | 空間データ保存 |
| ストレージ | MinIO | S3互換 | 画像/モデル保存 |
| CDN | Cloudflare | Free Plan | 配信高速化 |
| CI/CD | GitHub Actions | Docker | 自動デプロイ |
| 監視 | Grafana Stack | Loki / Prometheus | 運用可視化 |

---

🧭 **本資料はMVPから商用化までの技術・構造の統一基盤として利用可能です。**
