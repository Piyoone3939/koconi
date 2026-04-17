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


def _remove_background(image_bytes: bytes) -> Image.Image:
    """背景除去して白背景RGB画像を返す"""
    from rembg import remove as rembg_remove
    img_rgba = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
    img_no_bg = rembg_remove(img_rgba)
    background = Image.new("RGBA", img_no_bg.size, (255, 255, 255, 255))
    background.paste(img_no_bg, mask=img_no_bg.split()[3])
    return background.convert("RGB")


def _run_shap_e_job(job_id: str, image_bytes: bytes, base_url: str) -> None:
    """バックグラウンドでShap-E推論を実行し、GLBファイルを保存する"""
    with _jobs_lock:
        _jobs[job_id]["status"] = "processing"

    try:
        import torch
        from shap_e.diffusion.sample import sample_latents
        from shap_e.rendering.torch_mesh import TorchMesh
        from shap_e.util.collections import AttrDict

        def decode_latent_mesh(xm, latent):
            """shap_e.util.notebooks.decode_latent_mesh の ipywidgets 非依存版"""
            from shap_e.models.nn.camera import DifferentiableCameraBatch, DifferentiableProjectiveCamera
            import numpy as np
            origins, xs, ys, zs = [], [], [], []
            for theta in np.linspace(0, 2 * np.pi, num=20):
                z = np.array([np.sin(theta), np.cos(theta), -0.5])
                z /= np.sqrt(np.sum(z**2))
                origin = -z * 4
                x = np.array([np.cos(theta), -np.sin(theta), 0.0])
                y = np.cross(z, x)
                origins.append(origin); xs.append(x); ys.append(y); zs.append(z)
            cameras = DifferentiableCameraBatch(
                shape=(1, len(xs)),
                flat_camera=DifferentiableProjectiveCamera(
                    origin=torch.from_numpy(np.stack(origins)).float().to(latent.device),
                    x=torch.from_numpy(np.stack(xs)).float().to(latent.device),
                    y=torch.from_numpy(np.stack(ys)).float().to(latent.device),
                    z=torch.from_numpy(np.stack(zs)).float().to(latent.device),
                    width=2, height=2, x_fov=0.7, y_fov=0.7,
                ),
            )
            from shap_e.models.transmitter.base import Transmitter
            with torch.no_grad():
                decoded = xm.renderer.render_views(
                    AttrDict(cameras=cameras),
                    params=(xm.encoder if isinstance(xm, Transmitter) else xm).bottleneck_to_params(latent[None]),
                    options=AttrDict(rendering_mode="stf", render_with_direction=False),
                )
            return decoded.raw_meshes[0]

        _load_shap_e()

        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        img = _remove_background(image_bytes)

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

def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """2点間の距離をキロメートルで返す（Haversine公式）"""
    import math
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


# GPS距離スコアの有効半径 (km)。この範囲外は距離スコア = 0
_GPS_RADIUS_KM = 50.0


def rerank_with_gps(cands: list, user_latlng: tuple | None = None) -> list:
    """
    ユーザー位置情報がある場合、match_score と距離スコアを合成して再ソートする。
    meta に lat/lng がないアセットは距離スコアを 0 として扱う。
    """
    if user_latlng is None or user_latlng[0] is None or user_latlng[1] is None:
        return cands

    user_lat, user_lng = user_latlng
    meta_map = {m["asset_id"]: m for m in meta}

    for cand in cands:
        asset_meta = meta_map.get(cand["asset_id"], {})
        asset_lat = asset_meta.get("lat")
        asset_lng = asset_meta.get("lng")

        if asset_lat is not None and asset_lng is not None:
            dist_km = _haversine_km(user_lat, user_lng, asset_lat, asset_lng)
            # 半径内なら距離スコア [0, 1]、外なら 0
            dist_score = max(0.0, 1.0 - dist_km / _GPS_RADIUS_KM)
        else:
            dist_score = 0.0

        # match_score (コサイン類似度) 70% + 距離スコア 30% で合成
        cand["combined_score"] = 0.7 * cand["match_score"] + 0.3 * dist_score

    cands.sort(key=lambda c: c["combined_score"], reverse=True)
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
