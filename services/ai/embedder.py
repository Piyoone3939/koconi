# tech/ai/embedder.py
import torch, torchvision.transforms as T
from PIL import Image
from transformers import CLIPModel, CLIPProcessor

class ClipEmbedder:
    def __init__(self, model_name="openai/clip-vit-base-patch32", device=None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.model = CLIPModel.from_pretrained(model_name).to(self.device).eval()
        self.proc  = CLIPProcessor.from_pretrained(model_name)

    @torch.inference_mode()
    def image_emb(self, pil: Image.Image):
        inputs = self.proc(images=pil, return_tensors="pt").to(self.device)
        feats = self.model.get_image_features(**inputs)
        feats = torch.nn.functional.normalize(feats, dim=-1)
        return feats.squeeze(0).cpu().numpy()
