FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements (if any) or install directly
# Since there is no requirements.txt in the file list, I will install based on imports seen in serve.py
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    python-multipart \
    numpy \
    faiss-cpu \
    Pillow \
    torch \
    transformers \
    ftfy \
    regex \
    tqdm \
    git+https://github.com/openai/CLIP.git

COPY . .

EXPOSE 8000

CMD ["uvicorn", "serve:app", "--host", "0.0.0.0", "--port", "8000"]
