# tech/ai/build_index.py
import json, os, faiss, numpy as np
from PIL import Image
from embedder import ClipEmbedder

CATALOG = "catalog.json"     # [{ "asset_id": "tokyo_tower", "image": "assets_render/tt_az15_el0.png",
                             #   "default_scale": 1.0, "default_rotation": [0,180,0] }, ...]

def main():
    emb = ClipEmbedder()
    items = json.load(open(CATALOG, "r", encoding="utf-8"))

    vecs, meta = [], []
    for it in items:
        img = Image.open(it["image"]).convert("RGB")
        v = emb.image_emb(img)
        vecs.append(v)
        # lat/lng を含む全フィールドをメタとして保持する
        meta.append({k: it[k] for k in it if k != "image"})

    mat = np.vstack(vecs).astype("float32")
    index = faiss.IndexFlatIP(mat.shape[1])     # コサイン向け：正規化済み前提の内積
    index.add(mat)
    faiss.write_index(index, "faiss.index")
    json.dump(meta, open("meta.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
