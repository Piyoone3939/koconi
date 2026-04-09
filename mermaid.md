:::mermaid
 graph TB
      subgraph Client
          Mobile["📱 Mobile App\nReact Native + Expo\nMapbox GL"]
          LP["🌐 Landing Page\nReact + Vite\nTailwindCSS / shadcn"]
      end

      subgraph Backend["Backend (Go)"]
          API["🔧 API Server\nGo + chi router\nClean Architecture"]
          PG[("🗄️ PostgreSQL\n(pgx)")]
          S3["☁️ Object Storage\n(image_key)"]
      end

      subgraph AI["AI Service (Python)"]
          FastAPI["⚡ FastAPI"]
          FAISS["🔍 FAISS\nベクトル検索"]
          CLIP["🖼️ CLIP\n画像埋め込み"]
          ShapE["🧊 Shap-E\n3Dモデル生成\n(OpenAI)"]
          Rembg["✂️ rembg\n背景除去"]
      end

      MapboxAPI["🗺️ Mapbox API"]

      Mobile -->|"REST/HTTP\n/v1/*"| API
      Mobile -->|"タイル取得\nGPS表示"| MapboxAPI
      LP -.->|"(直接接続なし)"| API

      API -->|"SQL (pgx)"| PG
      API -->|"PUT 画像"| S3
      API -->|"POST /jobs\nGET /jobs/:id\nPOST /match"| FastAPI

      FastAPI --> FAISS
      FastAPI --> CLIP
      FastAPI --> ShapE
      FastAPI --> Rembg
      FastAPI -->|"GLBファイル配信\n/assets_render/*"| Mobile
::::