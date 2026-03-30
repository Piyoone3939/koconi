import io
import json
import os
import uuid
import threading
from concurrent.futures import ThreadPoolExecutor

import faiss
import numpy as np
from PIL import Image
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from embedder import ClipEmbedder

app = FastAPI()

index = faiss.read_index("faiss.index")
meta  = json.load(open("meta.json", "r", encoding="utf-8"))
embed = ClipEmbedder()

# 静的ファイル配信: /assets_render 以下のglb等をサービング
app.mount("/assets_render", StaticFiles(directory="assets_render"), name="assets_render")

# ---- 非同期ジョブキュー ----
_jobs: dict[str, dict] = {}
_jobs_lock = threading.Lock()
_executor = ThreadPoolExecutor(max_workers=2)

# Shap-E モデルのグローバルキャッシュ（初回ロード後は再利用）
_shap_e_lock = threading.Lock()
_shap_e_loaded = False
_shap_e_xm = None
_shap_e_model = None
_shap_e_diffusion = None


def _load_shap_e():
    """Shap-Eモデルをロード（スレッドセーフ、初回のみ）"""
    global _shap_e_loaded, _shap_e_xm, _shap_e_model, _shap_e_diffusion
    with _shap_e_lock:
        if _shap_e_loaded:
            return
        import torch
        from shap_e.diffusion.gaussian_diffusion import diffusion_from_config
        from shap_e.models.download import load_config, load_model

        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        _shap_e_xm = load_model("transmitter", device=device)
        _shap_e_model = load_model("image300M", device=device)
        _shap_e_diffusion = diffusion_from_config(load_config("diffusion"))
        _shap_e_loaded = True


def _run_shap_e_job(job_id: str, image_bytes: bytes, base_url: str) -> None:
    """バックグラウンドでShap-E推論を実行し、GLBファイルを保存する"""
    with _jobs_lock:
        _jobs[job_id]["status"] = "processing"

    try:
        import torch
        from shap_e.diffusion.sample import sample_latents
        from shap_e.util.notebooks import decode_latent_mesh

        _load_shap_e()

        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        latents = sample_latents(
            batch_size=1,
            model=_shap_e_model,
            diffusion=_shap_e_diffusion,
            guidance_scale=3.0,
            model_kwargs=dict(images=[img]),
            progress=False,
            clip_denoised=True,
            use_fp16=True,
            use_karras=True,
            karras_steps=32,
            sigma_min=1e-3,
            sigma_max=160,
            s_churn=0,
        )

        out_dir = "assets_render/generated"
        os.makedirs(out_dir, exist_ok=True)
        glb_path = f"{out_dir}/{job_id}.glb"

        for latent in latents:
            t = decode_latent_mesh(_shap_e_xm, latent).tri_mesh()
            with open(glb_path, "wb") as f:
                t.write_glb(f)
            break  # batch_size=1なので1件のみ

        model_url = f"{base_url}/assets_render/generated/{job_id}.glb"
        with _jobs_lock:
            _jobs[job_id]["status"] = "done"
            _jobs[job_id]["model_url"] = model_url

    except Exception as e:
        with _jobs_lock:
            _jobs[job_id]["status"] = "failed"
            _jobs[job_id]["error"] = str(e)


# ---- 非同期3Dモデル生成API ----

@app.post("/jobs")
async def create_job(
    file: UploadFile = File(...),
    taste: str = Form(default="lowpoly"),
):
    """3Dモデル生成ジョブを開始し、job_idを即座に返す"""
    image_bytes = await file.read()
    base_url = os.environ.get("AI_BASE_URL", "http://localhost:8000")

    job_id = str(uuid.uuid4())
    with _jobs_lock:
        _jobs[job_id] = {"status": "pending", "model_url": "", "error": ""}

    _executor.submit(_run_shap_e_job, job_id, image_bytes, base_url)

    return JSONResponse({"job_id": job_id})


@app.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    """ジョブのステータスを返す"""
    with _jobs_lock:
        job = _jobs.get(job_id)

    if job is None:
        return JSONResponse(
            {"status": "not_found", "model_url": "", "error": ""},
            status_code=404,
        )

    return JSONResponse({
        "status": job["status"],
        "model_url": job.get("model_url", ""),
        "error": job.get("error", ""),
    })


# ---- マッチングAPI（既存） ----

def rerank_with_gps(cands, user_latlng=None):
    return cands


@app.post("/match")
async def match(
    file: UploadFile = File(...),
    lat: float | None = None,
    lng: float | None = None,
    k: int = 5,
):
    img = Image.open(io.BytesIO(await file.read())).convert("RGB")
    v = embed.image_emb(img).astype("float32")[None, :]
    D, I = index.search(v, k)
    cands = []
    for score, idx in zip(D[0].tolist(), I[0].tolist()):
        m = meta[idx]
        cands.append({
            "asset_id": m["asset_id"],
            "match_score": float(score),
            "suggested_scale": m.get("default_scale", 1.0),
            "suggested_rotation": m.get("default_rotation", [0, 0, 0]),
        })
    cands = rerank_with_gps(cands, user_latlng=(lat, lng) if lat and lng else None)
    return {"candidates": cands}
