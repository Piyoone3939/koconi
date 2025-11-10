# tech/ai/serve.py
import io, json, faiss, numpy as np
from PIL import Image
from fastapi import FastAPI, UploadFile, File
from embedder import ClipEmbedder

app = FastAPI()
index = faiss.read_index("faiss.index")
meta  = json.load(open("meta.json", "r", encoding="utf-8"))
embed = ClipEmbedder()

def rerank_with_gps(cands, user_latlng=None):
    # 位置情報があれば簡易再ランク（任意）
    return cands

@app.post("/match")
async def match(file: UploadFile = File(...), lat: float | None = None, lng: float | None = None, k: int = 5):
    img = Image.open(io.BytesIO(await file.read())).convert("RGB")
    v = embed.image_emb(img).astype("float32")[None, :]
    D, I = index.search(v, k)  # 内積スコア
    cands = []
    for score, idx in zip(D[0].tolist(), I[0].tolist()):
        m = meta[idx]
        cands.append({
            "asset_id": m["asset_id"],
            "match_score": float(score),
            "suggested_scale": m.get("default_scale", 1.0),
            "suggested_rotation": m.get("default_rotation", [0,0,0]),
        })
    cands = rerank_with_gps(cands, user_latlng=(lat,lng) if lat and lng else None)
    return {"candidates": cands}
