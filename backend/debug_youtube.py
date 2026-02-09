
import os
import sys
import logging
import argparse
from pathlib import Path

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from youtube import extract_audio, get_video_info

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def debug_youtube(url: str):
    print(f"--- Debugging YouTube Extraction for {url} ---")
    
    # Check Environment Variables
    print("\n[Environment Variables]")
    print(f"YOUTUBE_PO_TOKEN: {'SET' if os.environ.get('YOUTUBE_PO_TOKEN') else 'NOT SET'}")
    print(f"YOUTUBE_VISITOR_DATA: {'SET' if os.environ.get('YOUTUBE_VISITOR_DATA') else 'NOT SET'}")
    print(f"YOUTUBE_COOKIES: {'SET' if os.environ.get('YOUTUBE_COOKIES') else 'NOT SET'}")
    print(f"HTTP_PROXY: {'SET' if os.environ.get('HTTP_PROXY') else 'NOT SET'}")
    
    # Step 1: Get Video Info
    print("\n[Step 1: Get Video Info]")
    try:
        info = get_video_info(url)
        print("Success!")
        print(f"Title: {info['title']}")
        print(f"Duration: {info['duration']}s")
    except Exception as e:
        print(f"Failed to get info: {e}")
        # Continue anyway as extract_audio might have different fallback logic (though unlikely for info)

    # Step 2: Extract Audio
    print("\n[Step 2: Extract Audio]")
    try:
        result = extract_audio(url)
        print("Success!")
        print(f"Audio Path: {result['audio_path']}")
        print(f"Video ID: {result['video_id']}")
    except Exception as e:
        print(f"Failed to extract audio: {e}")
        print("\nFull traceback:")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python backend/debug_youtube.py <youtube_url>")
        sys.exit(1)
        
    url = sys.argv[1]
    debug_youtube(url)
