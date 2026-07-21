# Use Python 3.10 Slim to reduce image size and fix build hangs
FROM python:3.10-slim

WORKDIR /app

# Configure libc to prefer IPv4 (Apply FIRST to fix apt-get hangs)
RUN echo "precedence ::ffff:0:0/96 100" >> /etc/gai.conf

# Install system dependencies (Minimal)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    ca-certificates \
    dnsutils \
    iputils-ping \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create a user to avoid running as root (required by Hugging Face)
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

# Copy the requirements file into the container
COPY --chown=user requirements.txt .

# Install CPU-only Torch first (Much smaller download, prevents build timeout)
RUN pip install --no-cache-dir torch==2.2.2 torchaudio==2.2.2 --index-url https://download.pytorch.org/whl/cpu

# Install remaining dependencies
RUN pip install --no-cache-dir -r requirements.txt

# (Optional) Pre-install cython if needed by other packages, otherwise skip
RUN pip install --no-cache-dir "numpy<2.0.0"

# Copy the rest of the backend code
COPY --chown=user . .

# Hugging Face uses port 7860
ENV PORT=7860
# Disable Python output buffering so logs show up immediately in HF Spaces
ENV PYTHONUNBUFFERED=1
# Preload models at build time (optional - can be done at runtime too)
# This caches the models in the container image
RUN python preload_models.py || true
# Run the application with -u to force unbuffered stdout
CMD ["python", "-u", "main.py"]
