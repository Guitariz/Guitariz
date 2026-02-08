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
RATE_LIMIT_REQUESTS = 100  # max requests (increased for testing)creased for testing)
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
        'force_ipv4': True,  # Fix for HF/Docker DNS issues
    }
    
    # COOKIES HANDLING
    # Check for YOUTUBE_COOKIES env var (Netscape format content)
    cookie_path = None
    try:
        cookies_content = os.environ.get("YOUTUBE_COOKIES")
        if cookies_content:
            print("[YouTube] Found YOUTUBE_COOKIES in env, creating temp cookie file...")
            # Create a temp file for cookies
            # We use delete=False so we can pass the path to yt-dlp, then delete it manually
            with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as cf:
                cf.write(cookies_content)
                cookie_path = cf.name
            ydl_opts['cookiefile'] = cookie_path
    except Exception as e:
        print(f"[YouTube] ⚠️ Failed to setup cookies: {e}")

    if ffmpeg_path:
        ydl_opts['ffmpeg_location'] = ffmpeg_path
    
    try:
        # Try yt-dlp first
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        
        # Verify file exists
        if not output_path.exists():
            raise RuntimeError("yt-dlp failed to create file")
            
        print(f"[YouTube] Audio extracted with yt-dlp: {output_path}")

    except Exception as e_yt:
        print(f"[YouTube] yt-dlp failed: {e_yt}. Trying pytubefix fallback...")
        try:
            from pytubefix import YouTube
            yt = YouTube(url)
            
            # If cookies are available, use them for pytubefix too?
            # pytubefix doesn't easily accept a cookiefile path in constructor?
            # It uses 'use_oauth' or 'po_token'.
            # But we can try 'use_oauth=False, allow_oauth_cache=False' default.
            
            # Filter for audio only
            stream = yt.streams.get_audio_only()
            if not stream:
                stream = yt.streams.get_highest_resolution()
                
            if not stream:
                raise RuntimeError("No stream found via pytubefix")

            # Pytubefix output handling
            downloaded_path = stream.download(output_path=str(output_dir), filename=f"{video_id}.mp4") 
            
            # Convert to mp3
            import subprocess
            print(f"[YouTube] Converting pytubefix output {downloaded_path} to {output_path}...")
            subprocess.run([
                'ffmpeg', '-y', '-i', downloaded_path, 
                '-vn', '-acodec', 'libmp3lame', '-q:a', '2', 
                str(output_path)
            ], check=True)
            
            # Cleanup raw extraction
            Path(downloaded_path).unlink(missing_ok=True)
            print(f"[YouTube] Audio extracted with pytubefix: {output_path}")

        except Exception as e_py:
            print(f"[YouTube] pytubefix also failed: {e_py}")
            raise RuntimeError(f"Download failed.\nyt-dlp: {e_yt}.\npytubefix: {e_py}\n\nRunning in Datacenter? Try setting YOUTUBE_COOKIES env var!")

    finally:
        # Cleanup cookie file
        if cookie_path and os.path.exists(cookie_path):
            try:
                os.unlink(cookie_path)
            except:
                pass

    return {
        'audio_path': str(output_path),
        'video_id': video_id,
        'title': info.get('title', 'Unknown'),
        'duration': info.get('duration', 0),
        'thumbnail': info.get('thumbnail', f'https://img.youtube.com/vi/{video_id}/maxresdefault.jpg'),
        'channel': info.get('channel', info.get('uploader', 'Unknown')),
        'cached': False,
    }


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
