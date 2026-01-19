# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Install system dependencies
# ffmpeg is required for audio processing (m4a, mp3, etc.)
# libsndfile1 is required for librosa/soundfile
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . .

# Make port 8000 available to the world outside this container
# Render will override this with its own $PORT
EXPOSE 8000

# Run the application
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
