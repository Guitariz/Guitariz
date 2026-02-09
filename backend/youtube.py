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
import subprocess

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


def _setup_ydl_opts(base_opts: Dict[str, Any]) -> Dict[str, Any]:
    """Helper to add cookies and client args to ydl_opts"""
    opts = base_opts.copy()
    
    # Check for Cookies First
    has_cookies = False
    try:
        cookies_content = os.environ.get("YOUTUBE_COOKIES")
        if cookies_content:
            print("[YouTube] 🍪 Found YOUTUBE_COOKIES environment variable. loaded successfully.")
            line_count = cookies_content.count('\n')
            if line_count < 2:
                # Naive fix for mangled secrets
                cookies_content = cookies_content.replace(".youtube.com", "\n.youtube.com")
                cookies_content = cookies_content.replace("# Netscape", "# Netscape")
                
            with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as cf:
                cf.write(cookies_content)
                opts['cookiefile'] = cf.name
                has_cookies = True
            
            # When using cookies, avoid custom client overrides that might mismatch the session
            # We trust yt-dlp defaults + cookies to behave like a browser
            opts['extractor_args'] = {}
            
        else:
            print("[YouTube] ❌ No YOUTUBE_COOKIES found in environment.")
    except Exception as e:
        print(f"[YouTube] ⚠️ Failed to setup cookies: {e}")

    # Fallback to PO Token & Visitor Data (Only if no cookies)
    if not has_cookies:
        po_token = os.environ.get("YOUTUBE_PO_TOKEN")
        visitor_data = os.environ.get("YOUTUBE_VISITOR_DATA")
        
        # Default robust clients for non-cookie requests
        opts['extractor_args'] = {
            'youtube': {
                'player_client': ['web', 'android', 'ios', 'mweb', 'tv'],
                'player_skip': ['webpage', 'configs', 'js'],
                'innertube_client': ['web', 'android'],
            }
        }
        
        if po_token and visitor_data:
            print(f"[YouTube] 🛡️ Using PO Token and Visitor Data for authentication")
            opts['extractor_args']['youtube']['po_token'] = [f"web+{visitor_data}+{po_token}"]
            opts['extractor_args']['youtube']['player_client'] = ['web', 'android', 'ios', 'mweb', 'tv']
    else:
        print("[YouTube] 🍪 Cookies present, skipping manual PO Token/Client Config to avoid session mismatch.")
        
    return opts


def get_video_info(url: str) -> Dict[str, Any]:
    """
    Get video metadata without downloading.
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
    
    # Use helper to add cookies and client config
    ydl_opts = _setup_ydl_opts(ydl_opts)
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(url, download=False)
            # Clean up cookie if created
            if 'cookiefile' in ydl_opts and os.path.exists(ydl_opts['cookiefile']):
                try: os.unlink(ydl_opts['cookiefile'])
                except: pass

            return {
                'video_id': video_id,
                'title': info.get('title', 'Unknown'),
                'duration': info.get('duration', 0),
                'thumbnail': info.get('thumbnail', f'https://img.youtube.com/vi/{video_id}/maxresdefault.jpg'),
                'channel': info.get('channel', info.get('uploader', 'Unknown')),
            }
        except Exception as e:
            # Cleanup on error too
            if 'cookiefile' in ydl_opts and os.path.exists(ydl_opts['cookiefile']):
                try: os.unlink(ydl_opts['cookiefile'])
                except: pass
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
        # 'force_ipv4': True, # Removed: We fixed DNS at system level, IPv6 might be less blocked
    }
    
    # Use helper for cookies & clients
    ydl_opts = _setup_ydl_opts(ydl_opts)
    cookie_path = ydl_opts.get('cookiefile')
    
    # Proxy Support
    proxy_url = os.environ.get("HTTP_PROXY")
    if proxy_url:
        ydl_opts['proxy'] = proxy_url

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
            
            # Pass PO Token to pytubefix if available
            po_token = os.environ.get("YOUTUBE_PO_TOKEN")
            visitor_data = os.environ.get("YOUTUBE_VISITOR_DATA")
            
            # Prepare kwargs
            yt_kwargs = {}
            # Attempt to init YouTube object
            try:
                if po_token and visitor_data:
                    print(f"[YouTube] Passing PO Token to pytubefix...")
                    yt_kwargs['use_po_token'] = True
                    yt_kwargs['po_token'] = po_token
                    yt_kwargs['visitor_data'] = visitor_data
                    yt = YouTube(url, **yt_kwargs)
                else:
                    yt_kwargs['use_po_token'] = True # Try auto-generation
                    yt = YouTube(url, **yt_kwargs)
            except TypeError as te:
                print(f"[YouTube] ⚠️ pytubefix init failed with args: {te}. Retrying with defaults...")
                yt = YouTube(url, use_po_token=True)
            
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
            
            # ---------------------------------------------------------
            # FALLBACK 3: Invidious Instances (The "Hail Mary")
            # ---------------------------------------------------------
            print("[YouTube] Trying Invidious fallback (proxying)...")
            invidious_instances = [
                # Top tier (usually reliable)
                "https://inv.tux.pizza",
                "https://yt.artemislena.eu", 
                "https://invidious.drgns.space",
                
                # Second tier
                "https://invidious.flokinet.to",
                "https://invidious.nerdvpn.de",
                "https://inv.nadeko.net",
                "https://yewtu.be",
                
                # Extra fallbacks
                "https://invidious.io.lol",
                "https://invidious.private.coffee",
                "https://iv.ggtyler.dev",
                "https://invidious.lunar.icu",
            ]
            
            import requests
            
            success = False
            last_err = None
            
            # --- Invidious Loop ---
            for instance in invidious_instances:
                try:
                    # m4a audio itag=140
                    download_url = f"{instance}/latest_version?id={video_id}&itag=140"
                    print(f"[YouTube] Trying {instance}...")
                    
                    with requests.get(download_url, stream=True, timeout=15) as r:
                         if r.status_code == 200:
                             content_type = r.headers.get('Content-Type', '')
                             if 'text/html' in content_type:
                                 print(f"[YouTube] {instance} returned HTML. Skipping.")
                                 continue
                             
                             temp_audio = output_dir / f"{video_id}.m4a"
                             file_size = 0
                             with open(temp_audio, 'wb') as f:
                                 for chunk in r.iter_content(chunk_size=8192):
                                     f.write(chunk)
                                     file_size += len(chunk)
                             
                             if file_size < 10000:
                                 print(f"[YouTube] {instance} too small ({file_size}b). Skipping.")
                                 temp_audio.unlink(missing_ok=True)
                                 continue

                             print(f"[YouTube] Converting Invidious output {temp_audio} to {output_path}...")
                             subprocess.run([
                                 'ffmpeg', '-y', '-i', str(temp_audio), 
                                 '-vn', '-acodec', 'libmp3lame', '-q:a', '2', 
                                 str(output_path)
                             ], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                             
                             temp_audio.unlink(missing_ok=True)
                             print(f"[YouTube] Audio extracted via Invidious: {output_path}")
                             success = True
                             break
                except Exception as e_inv:
                    print(f"[YouTube] {instance} failed: {e_inv}")
                    last_err = e_inv

            # --- Piped Fallback (If Invidious fails) ---
            if not success:
                 print("[YouTube] Invidious failed. Trying Piped API fallback...")
                 piped_instances = [
                     "https://pipedapi.kavin.rocks",
                     "https://api.piped.privacy.com.de",
                     "https://pipedapi.drgns.space",
                     "https://api.piped.yt",
                     "https://pipedapi.tokhmi.xyz", 
                     "https://piped-api.lunar.icu",
                 ]
                 
                 for api_base in piped_instances:
                     try:
                         print(f"[YouTube] Trying Piped API: {api_base}...")
                         # Get video streams
                         resp = requests.get(f"{api_base}/streams/{video_id}", timeout=10)
                         if resp.status_code != 200:
                             print(f"[YouTube] Piped {api_base} returned {resp.status_code}")
                             continue
                         
                         data = resp.json()
                         audio_streams = data.get('audioStreams', [])
                         # Find m4a stream
                         target_stream = next((s for s in audio_streams if s.get('format') == 'M4A'), None)
                         if not target_stream and audio_streams:
                             target_stream = audio_streams[0] # Fallback to any
                             
                         if target_stream:
                             stream_url = target_stream['url']
                             print(f"[YouTube] Downloading from Piped stream...")
                             
                             # Download the stream
                             with requests.get(stream_url, stream=True, timeout=20) as r_stream:
                                 if r_stream.status_code == 200:
                                     temp_audio = output_dir / f"{video_id}_piped.m4a"
                                     with open(temp_audio, 'wb') as f:
                                         for chunk in r_stream.iter_content(chunk_size=8192):
                                             f.write(chunk)
                                     
                                     # Convert
                                     print(f"[YouTube] Converting Piped output...")
                                     subprocess.run([
                                        'ffmpeg', '-y', '-i', str(temp_audio), 
                                        '-vn', '-acodec', 'libmp3lame', '-q:a', '2', 
                                        str(output_path)
                                     ], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                                     
                                     temp_audio.unlink(missing_ok=True)
                                     success = True
                                     break
                     except Exception as e_piped:
                         print(f"[YouTube] Piped {api_base} failed: {e_piped}")

            # --- Cobalt Fallback (The Professional Downloader) ---
            if not success:
                 print("[YouTube] Piped failed. Trying Cobalt API fallback...")
                 cobalt_instances = [
                     "https://cobalt.git.gay",
                     "https://cobalt.maybreak.com",
                     "https://cobalt.tools",
                     "https://api.cobalt.tools", 
                     "https://cobalt.api.kwiatekmiki.pl",
                 ]
                 
                 for api_base in cobalt_instances:
                     try:
                         print(f"[YouTube] Trying Cobalt API: {api_base}...")
                         headers = {
                             "Accept": "application/json",
                             "Content-Type": "application/json",
                             "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                         }
                         
                         # Try v10 payload first (POST /)
                         payload_v10 = {
                             "url": f"https://www.youtube.com/watch?v={video_id}",
                             "downloadMode": "audio",
                             "audioFormat": "mp3"
                         }
                         
                         try:
                             resp = requests.post(f"{api_base}/", json=payload_v10, headers=headers, timeout=15)
                             if resp.status_code == 200:
                                 data = resp.json()
                                 download_url = data.get('url')
                                 if download_url:
                                     # Success with v10
                                     pass 
                                 else:
                                     # Try v7 payload (POST /api/json)
                                     raise ValueError("v10 failed")
                             else:
                                 raise ValueError(f"v10 returned {resp.status_code}")
                         except Exception:
                             # Fallback to v7 style
                             payload_v7 = {
                                 "url": f"https://www.youtube.com/watch?v={video_id}",
                                 "isAudioOnly": True,
                                 "aFormat": "mp3"
                             }
                             resp = requests.post(f"{api_base}/api/json", json=payload_v7, headers=headers, timeout=15)
                             if resp.status_code != 200:
                                 print(f"[YouTube] Cobalt {api_base} returned {resp.status_code}: {resp.text}")
                                 continue
                             data = resp.json()
                             download_url = data.get('url')

                         if download_url:
                             print(f"[YouTube] Downloading from Cobalt stream...")
                             with requests.get(download_url, stream=True, timeout=30) as r_stream:
                                 if r_stream.status_code == 200:
                                     temp_audio = output_dir / f"{video_id}_cobalt.mp3"
                                     with open(temp_audio, 'wb') as f:
                                         for chunk in r_stream.iter_content(chunk_size=8192):
                                             f.write(chunk)
                                     
                                     if temp_audio.stat().st_size < 10000:
                                          print("[YouTube] Cobalt download too small.")
                                          temp_audio.unlink(missing_ok=True)
                                          continue

                                     subprocess.run([
                                        'ffmpeg', '-y', '-i', str(temp_audio), 
                                        '-vn', '-acodec', 'libmp3lame', '-q:a', '2', 
                                        str(output_path)
                                     ], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                                     
                                     temp_audio.unlink(missing_ok=True)
                                     success = True
                                     break
                         else:
                             print(f"[YouTube] Cobalt response missing url: {data}")
                             
                     except Exception as e_cobalt:
                         print(f"[YouTube] Cobalt {api_base} failed: {e_cobalt}")

            if not success:
                raise RuntimeError(f"All methods failed.\nyt-dlp: {e_yt}\npytubefix: {e_py}\nInvidious/Piped/Cobalt failed.\n\nRunning in Datacenter? IP is heavily blocked.")

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
