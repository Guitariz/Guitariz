# Use Python 3.10 Full (non-slim) to include all networking libraries
# Note: Madmom support disabled as it requires <3.9
FROM python:3.10

# Install system dependencies and build tools + networking fixes
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    build-essential \
    gcc \
    g++ \
    ca-certificates \
    dnsutils \
    iputils-ping \
    && rm -rf /var/lib/apt/lists/*

# Configure libc to prefer IPv4 (fixes [Errno -5] in some containers)
RUN echo "precedence ::ffff:0:0/96 100" >> /etc/gai.conf

# Create a user to avoid running as root (required by Hugging Face)
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /app

# Copy the requirements file into the container
COPY --chown=user requirements.txt .

# Install Cython and numpy<1.24 first (required for madmom compatibility)
RUN pip install --no-cache-dir "Cython>=0.25" "numpy<1.24.0"

# Install all packages except madmom first
RUN pip install --no-cache-dir -r requirements.txt || true

# Install madmom separately with --no-build-isolation to use the installed Cython and numpy
# RUN pip install --no-cache-dir --no-build-isolation madmom>=0.16.1

# Copy the rest of the backend code
COPY --chown=user . .

# Hugging Face uses port 7860
ENV PORT=7860
# Preload models at build time (optional - can be done at runtime too)
# This caches the models in the container image
RUN python preload_models.py || true
# Run the application
CMD ["python", "main.py"]
