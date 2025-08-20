#!/usr/bin/env python3
"""
RTSP Server Setup Script (Fixed SSL)

This script:
1. Downloads MediaMTX (RTSP server) for your platform
2. Configures MediaMTX for your video file
3. Launches the RTSP server and ffmpeg to stream your video in a loop

Requirements:
- Python 3.6+
- FFmpeg installed and available in PATH

Usage:
    python3 rtsp_server_setup.py --input elephant.mp4 --path elephant-test
"""

import os
import sys
import argparse
import platform
import subprocess
import shutil
import signal
import time
import zipfile
import tarfile
import urllib.request
import tempfile
import atexit
import json
import ssl
import requests

# Define MediaMTX download URLs for different platforms
MEDIAMTX_URLS = {
    "Darwin-x86_64": "https://github.com/bluenviron/mediamtx/releases/download/v1.5.0/mediamtx_v1.5.0_darwin_amd64.tar.gz",
    "Darwin-arm64": "https://github.com/bluenviron/mediamtx/releases/download/v1.5.0/mediamtx_v1.5.0_darwin_arm64.tar.gz",
    "Windows-AMD64": "https://github.com/bluenviron/mediamtx/releases/download/v1.5.0/mediamtx_v1.5.0_windows_amd64.zip",
    "Linux-x86_64": "https://github.com/bluenviron/mediamtx/releases/download/v1.5.0/mediamtx_v1.5.0_linux_amd64.tar.gz",
}

class RTSPServer:
    def __init__(self, video_path, stream_path="elephant-test", rtsp_port=8554):
        """
        Initialize the RTSP server setup.
        
        Args:
            video_path (str): Path to the video file to stream
            stream_path (str): RTSP stream path (default: elephant-test)
            rtsp_port (int): RTSP server port (default: 8554)
        """
        self.video_path = os.path.abspath(video_path)
        self.stream_path = stream_path
        self.rtsp_port = rtsp_port
        
        # Create a temporary directory for MediaMTX
        self.temp_dir = tempfile.mkdtemp(prefix="mediamtx_")
        
        # Set executable paths
        self.mediamtx_path = None
        self.mediamtx_config_path = os.path.join(self.temp_dir, "mediamtx.yml")
        
        # Set process handles
        self.mediamtx_process = None
        self.ffmpeg_process = None
    
    def download_file(self, url, destination):
        """Download a file using requests library to avoid SSL issues."""
        try:
            # Try first with requests (preferred method)
            try:
                import requests
                print(f"Downloading {url} with requests...")
                response = requests.get(url, stream=True)
                response.raise_for_status()
                
                with open(destination, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                return True
            except ImportError:
                # If requests is not available, fall back to urllib with SSL context
                print(f"Requests not available, using urllib with custom SSL context...")
                
                # Create an SSL context that doesn't verify certificates
                ctx = ssl.create_default_context()
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE
                
                with urllib.request.urlopen(url, context=ctx) as response:
                    with open(destination, 'wb') as f:
                        f.write(response.read())
                return True
        except Exception as e:
            print(f"Download failed: {e}")
            return False
    
    def download_mediamtx(self):
        """Download MediaMTX for the current platform."""
        system = platform.system()
        machine = platform.machine()
        
        if system == "Darwin":  # macOS
            if machine == "arm64":
                key = "Darwin-arm64"  # Apple Silicon
            else:
                key = "Darwin-x86_64"  # Intel Mac
        elif system == "Windows":
            key = "Windows-AMD64"
        elif system == "Linux":
            key = "Linux-x86_64"
        else:
            raise OSError(f"Unsupported platform: {system} {machine}")
        
        if key not in MEDIAMTX_URLS:
            raise OSError(f"No MediaMTX build available for platform: {key}")
        
        url = MEDIAMTX_URLS[key]
        archive_path = os.path.join(self.temp_dir, os.path.basename(url))
        
        print(f"Downloading MediaMTX for {key} from {url}")
        if not self.download_file(url, archive_path):
            raise RuntimeError(f"Failed to download MediaMTX from {url}")
        
        # Extract the archive
        if url.endswith(".zip"):
            with zipfile.ZipFile(archive_path, 'r') as zip_ref:
                zip_ref.extractall(self.temp_dir)
        elif url.endswith(".tar.gz"):
            with tarfile.open(archive_path, 'r:gz') as tar_ref:
                tar_ref.extractall(self.temp_dir)
        
        # Find the executable
        if system == "Windows":
            self.mediamtx_path = os.path.join(self.temp_dir, "mediamtx.exe")
        else:
            self.mediamtx_path = os.path.join(self.temp_dir, "mediamtx")
        
        # Make executable on Unix
        if system != "Windows":
            os.chmod(self.mediamtx_path, 0o755)
        
        # Clean up the archive
        os.remove(archive_path)
    
    def check_ffmpeg(self):
        """Check if FFmpeg is installed and available."""
        try:
            subprocess.run(["ffmpeg", "-version"], 
                           stdout=subprocess.DEVNULL, 
                           stderr=subprocess.DEVNULL, 
                           check=True)
            return True
        except (subprocess.SubprocessError, FileNotFoundError):
            return False
    
    def create_mediamtx_config(self):
        """Create a configuration file for MediaMTX."""
        # Basic configuration for MediaMTX
        config = {
            "rtspAddress": f":{self.rtsp_port}",
            "readTimeout": "1m",
            "protocols": ["tcp"],
            "paths": {
                self.stream_path: {
                    "runOnDemand": None,
                    "runOnDemandRestart": True
                }
            }
        }
        
        # Save as JSON for simplicity
        config_json_path = os.path.join(self.temp_dir, "mediamtx.json")
        with open(config_json_path, 'w') as f:
            json.dump(config, f, indent=2)
        
        # Convert to YAML format expected by MediaMTX
        try:
            import yaml
            with open(config_json_path, 'r') as f:
                config_data = json.load(f)
            
            with open(self.mediamtx_config_path, 'w') as f:
                yaml.dump(config_data, f)
        except ImportError:
            # If PyYAML is not available, use the JSON file
            # MediaMTX can also read JSON configs
            self.mediamtx_config_path = config_json_path
    
    def start_mediamtx(self):
        """Start the MediaMTX RTSP server."""
        print(f"Starting MediaMTX RTSP server on port {self.rtsp_port}")
        
        # Build the command
        cmd = [self.mediamtx_path, self.mediamtx_config_path]
        
        # Start the process
        self.mediamtx_process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True
        )
        
        # Give it a moment to start
        time.sleep(2)
        
        # Check if it started successfully
        if self.mediamtx_process.poll() is not None:
            stderr = self.mediamtx_process.stderr.read()
            raise RuntimeError(f"MediaMTX failed to start: {stderr}")
        
        print(f"MediaMTX RTSP server started")
    
    def start_ffmpeg(self):
        """Start FFmpeg to stream the video to MediaMTX."""
        rtsp_url = f"rtsp://localhost:{self.rtsp_port}/{self.stream_path}"
        
        # Create the FFmpeg command
        cmd = [
            "ffmpeg",
            "-re",  # Read input at native frame rate
            "-stream_loop", "-1",  # Loop input infinitely
            "-i", self.video_path,  # Input file
            "-c", "copy",  # Copy codecs without re-encoding
            "-f", "rtsp",  # Output format RTSP
            "-rtsp_transport", "tcp",  # Use TCP for RTSP
            rtsp_url  # Output URL
        ]
        
        print(f"Starting FFmpeg to stream video to {rtsp_url}")
        print(f"FFmpeg command: {' '.join(cmd)}")
        
        # Start FFmpeg process
        self.ffmpeg_process = subprocess.Popen(
            cmd,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            universal_newlines=True
        )
        
        # Give it a moment to start
        time.sleep(2)
        
        # Check if it started successfully
        if self.ffmpeg_process.poll() is not None:
            stderr = self.ffmpeg_process.stderr.read()
            raise RuntimeError(f"FFmpeg failed to start: {stderr}")
        
        print(f"FFmpeg streaming started")
        print(f"\nRTSP stream is available at: {rtsp_url}")
        print("You can play this stream with VLC or other RTSP clients.")
        print("Press Ctrl+C to stop the server.")
    
    def setup_and_run(self):
        """Set up and run the RTSP server with the video stream."""
        try:
            # Check FFmpeg
            if not self.check_ffmpeg():
                raise RuntimeError("FFmpeg is not installed or not found in PATH.")
            
            # Download MediaMTX
            self.download_mediamtx()
            
            # Create MediaMTX config
            self.create_mediamtx_config()
            
            # Start MediaMTX
            self.start_mediamtx()
            
            # Start FFmpeg
            self.start_ffmpeg()
            
            # Register cleanup
            atexit.register(self.cleanup)
            
            # Keep the main thread alive
            while True:
                # Check if processes are still running
                if self.mediamtx_process.poll() is not None:
                    stderr = self.mediamtx_process.stderr.read()
                    raise RuntimeError(f"MediaMTX stopped unexpectedly: {stderr}")
                
                if self.ffmpeg_process.poll() is not None:
                    stderr = self.ffmpeg_process.stderr.read()
                    raise RuntimeError(f"FFmpeg stopped unexpectedly: {stderr}")
                
                time.sleep(1)
        
        except KeyboardInterrupt:
            print("\nInterrupted by user")
        finally:
            self.cleanup()
    
    def cleanup(self):
        """Clean up resources."""
        print("\nCleaning up...")
        
        # Stop FFmpeg
        if self.ffmpeg_process and self.ffmpeg_process.poll() is None:
            print("Stopping FFmpeg...")
            self.ffmpeg_process.terminate()
            try:
                self.ffmpeg_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.ffmpeg_process.kill()
        
        # Stop MediaMTX
        if self.mediamtx_process and self.mediamtx_process.poll() is None:
            print("Stopping MediaMTX...")
            self.mediamtx_process.terminate()
            try:
                self.mediamtx_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.mediamtx_process.kill()
        
        # Remove temporary directory
        try:
            shutil.rmtree(self.temp_dir)
        except Exception as e:
            print(f"Warning: Could not remove temporary directory: {e}")
        
        print("Cleanup complete")

def main():
    parser = argparse.ArgumentParser(description="Set up an RTSP server for video streaming")
    parser.add_argument("--input", "-i", required=True, help="Path to the input video file")
    parser.add_argument("--path", "-p", default="elephant-test", help="RTSP stream path (default: elephant-test)")
    parser.add_argument("--port", "-P", type=int, default=8554, help="RTSP server port (default: 8554)")
    args = parser.parse_args()
    
    # Check if file exists
    if not os.path.isfile(args.input):
        print(f"Error: Input file not found: {args.input}")
        return 1
    
    try:
        server = RTSPServer(
            video_path=args.input,
            stream_path=args.path,
            rtsp_port=args.port
        )
        
        # Setup signal handlers for clean shutdown
        signal.signal(signal.SIGINT, lambda sig, frame: server.cleanup())
        signal.signal(signal.SIGTERM, lambda sig, frame: server.cleanup())
        
        # Run the server
        server.setup_and_run()
    
    except Exception as e:
        print(f"Error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())