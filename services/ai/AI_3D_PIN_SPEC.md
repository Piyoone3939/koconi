# AI 3Dピン生成・設置機能 仕様（Step 1-2）

## 目的
- ユーザーが投稿した写真を、AIで指定テイストの3Dモデル（glTF形式）に変換し、マップ上にピンとして設置する
- ピンをタップすると元写真詳細画面に遷移する

## テイスト例
- lowpoly（ローポリ）

## 3Dモデル形式
- glTF（.glb）
- サンプル: services/ai/assets_render/sample_lowpoly.glb

## AI方式
- Step 2ではダミーAPI（サンプルglb返却）
- 将来的に本物AIへ差し替え可能な設計

## サーバAPI設計
### [POST] /generate_3d_model
- 入力: multipart/form-data
    - file: 画像ファイル
    - taste: テイスト名（例: lowpoly）
- 出力: JSON
    - model_url: 生成3DモデルのURL
    - taste: テイスト名

### サンプルレスポンス
{
  "model_url": "http://localhost:8000/assets_render/sample_lowpoly.glb",
  "taste": "lowpoly"
}

## サンプルglbファイル
- services/ai/assets_render/sample_lowpoly.glb
- （まずはダミーで配置）

---

この仕様に沿って、次はservices/ai/serve.pyにAPIエンドポイントを実装します。