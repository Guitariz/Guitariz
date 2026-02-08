"""
YouTube audio extraction utilities using yt-dlp.

Handles downloading audio from YouTube URLs for chord analysis.
"""

import os
import re
import tempfile
import hashlib
import time
from pathlib import Path
from typing import Optional, Dict, Any
from collections import defaultdict
import threading

# Rate limiting: track requests per IP
_rate_limit_lock = threading.Lock()
_request_counts: Dict[str, list] = defaultdict(list)  # IP -> list of timestamps

# Rate limit constants
RATE_LIMIT_REQUESTS = 100  # max requests (increased for testing)
RATE_LIMIT_WINDOW = 3600  # per hour (seconds)


def check_rate_limit(client_ip: str) -> bool:
    """
    Check if a client IP has exceeded the rate limit.
    
    Returns True if request is allowed, False if rate limited.
    """
    with _rate_limit_lock:
        now = time.time()
        # Clean up old timestamps
        _request_counts[client_ip] = [
            ts for ts in _request_counts[client_ip] 
            if now - ts < RATE_LIMIT_WINDOW
        ]
        
        if len(_request_counts[client_ip]) >= RATE_LIMIT_REQUESTS:
            return False
        
        _request_counts[client_ip].append(now)
        return True


def get_remaining_requests(client_ip: str) -> int:
    """Get remaining requests for an IP within the current window."""
    with _rate_limit_lock:
        now = time.time()
        valid_requests = [
            ts for ts in _request_counts[client_ip] 
            if now - ts < RATE_LIMIT_WINDOW
        ]
        return max(0, RATE_LIMIT_REQUESTS - len(valid_requests))


def extract_video_id(url: str) -> Optional[str]:
    """
    Extract YouTube video ID from various URL formats.
    
    Supports:
    - https://www.youtube.com/watch?v=VIDEO_ID
    - https://youtu.be/VIDEO_ID
    - https://www.youtube.com/embed/VIDEO_ID
    - https://music.youtube.com/watch?v=VIDEO_ID
    """
    patterns = [
        r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/|music\.youtube\.com/watch\?v=)([a-zA-Z0-9_-]{11})',
        r'^([a-zA-Z0-9_-]{11})$'  # Just the ID itself
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    return None


def get_video_info(url: str) -> Dict[str, Any]:
    """
    Get video metadata without downloading.
    
    Returns:
        Dict with: title, duration, thumbnail, channel, video_id
    """
    try:
        import yt_dlp
    except ImportError:
        raise RuntimeError("yt-dlp is not installed. Run: pip install yt-dlp")
    
    video_id = extract_video_id(url)
    if not video_id:
        raise ValueError("Invalid YouTube URL")
    
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(url, download=False)
            return {
                'video_id': video_id,
                'title': info.get('title', 'Unknown'),
                'duration': info.get('duration', 0),
                'thumbnail': info.get('thumbnail', f'https://img.youtube.com/vi/{video_id}/maxresdefault.jpg'),
                'channel': info.get('channel', info.get('uploader', 'Unknown')),
            }
        except Exception as e:
            raise RuntimeError(f"Failed to get video info: {str(e)}")


def extract_audio(url: str, output_dir: Optional[Path] = None) -> Dict[str, Any]:
    """
    Download audio from YouTube URL.
    
    Args:
        url: YouTube video URL
        output_dir: Directory to save audio. If None, uses temp directory.
    
    Returns:
        Dict with: audio_path, video_id, title, duration, thumbnail
    """
    try:
        import yt_dlp
    except ImportError:
        raise RuntimeError("yt-dlp is not installed. Run: pip install yt-dlp")
    
    video_id = extract_video_id(url)
    if not video_id:
        raise ValueError("Invalid YouTube URL")

    # Check duration limit (7 minutes)
    try:
        info = get_video_info(url)
        duration = info.get('duration', 0)
        if duration > 420:  # 7 minutes * 60 seconds
            raise ValueError(f"Video is too long ({duration//60}:{duration%60:02d}). Maximum allowed duration is 7 minutes.")
    except Exception as e:
        if "Video is too long" in str(e):
            raise
        # If getting info fails, we might still try to download, or just warn. 
        # But safest is to proceed and let yt-dlp handle it, though we miss the check.
        # For now, let's assume get_video_info works if extract_audio would work.
        print(f"[YouTube] Could not verify duration: {e}")
    
    # Create output directory
    if output_dir is None:
        output_dir = Path(tempfile.gettempdir()) / "guitariz_youtube"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename based on video ID
    output_path = output_dir / f"{video_id}.mp3"
    
    # Check if already downloaded (cache)
    if output_path.exists():
        # Get info without downloading again
        info = get_video_info(url)
        return {
            'audio_path': str(output_path),
            'video_id': video_id,
            'title': info['title'],
            'duration': info['duration'],
            'thumbnail': info['thumbnail'],
            'channel': info['channel'],
            'cached': True,
        }
    
    
    # Try to find ffmpeg path using imageio-ffmpeg if available
    ffmpeg_path = None
    try:
        import imageio_ffmpeg
        ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()
        print(f"[YouTube] Using ffmpeg from imageio-ffmpeg: {ffmpeg_path}")
    except ImportError:
        # Fallback to system ffmpeg if not installed
        pass

    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': str(output_dir / f'{video_id}.%(ext)s'),
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'quiet': True,
        'no_warnings': True,
    }
    
    if ffmpeg_path:
        ydl_opts['ffmpeg_location'] = ffmpeg_path
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(url, download=True)
            
            return {
                'audio_path': str(output_path),
                'video_id': video_id,
                'title': info.get('title', 'Unknown'),
                'duration': info.get('duration', 0),
                'thumbnail': info.get('thumbnail', f'https://img.youtube.com/vi/{video_id}/maxresdefault.jpg'),
                'channel': info.get('channel', info.get('uploader', 'Unknown')),
                'cached': False,
            }
        except Exception as e:
            raise RuntimeError(f"Failed to download audio: {str(e)}")


def cleanup_old_files(directory: Path, max_age_hours: int = 24):
    """Remove audio files older than max_age_hours."""
    if not directory.exists():
        return
    
    now = time.time()
    max_age_seconds = max_age_hours * 3600
    
    for file in directory.glob("*.mp3"):
        if now - file.stat().st_mtime > max_age_seconds:
            try:
                file.unlink()
            except Exception:
                pass  # Ignore errors during cleanup
