# RTSP Video Streaming Server - Complete Documentation

This documentation provides instructions for setting up and running an RTSP server that streams a local video file in a continuous loop. The server works on both macOS and Windows systems.

## Overview

This solution:
- Creates an RTSP stream at `rtsp://localhost:8554/elephant-test` (or your custom path)
- Continuously loops the video without interruptions
- Automatically downloads and configures the necessary RTSP server software
- Works cross-platform on macOS and Windows

## Requirements

### For macOS

1. **Python 3.6 or newer**
   - Most macOS systems already have Python 3 installed
   - Check with: `python3 --version`
   - If needed, install from [python.org](https://www.python.org/downloads/macos/) or using Homebrew: `brew install python`

2. **FFmpeg**
   - Install using Homebrew: `brew install ffmpeg`
   - Verify installation: `ffmpeg -version`

3. **Requests library** (recommended for easier downloads)
   - Install with: `pip3 install requests`

### For Windows

1. **Python 3.6 or newer**
   - Download and install from [python.org](https://www.python.org/downloads/windows/)
   - During installation, check "Add Python to PATH"
   - Verify installation: `python --version` in Command Prompt

2. **FFmpeg**
   - Download the latest build from [ffmpeg.org](https://ffmpeg.org/download.html#build-windows) or [gyan.dev](https://www.gyan.dev/ffmpeg/builds/)
   - Extract the ZIP file
   - Add the `bin` folder to your PATH:
     - Search for "Environment Variables" in Windows search
     - Edit the "Path" variable
     - Add the path to FFmpeg's bin folder (e.g., `C:\ffmpeg\bin`)
   - Verify installation: `ffmpeg -version` in a new Command Prompt

3. **Requests library** (recommended)
   - Install with: `pip install requests`

## Installation and Usage

### Step 1: Download the Script

Save the RTSP server script to your computer as `rtsp_server_setup.py`.

### Step 2: Prepare Your Video File

Make sure your video file:
- Is in a compatible format (MP4 with H.264 video and AAC audio works best)
- Is accessible to the script (note the full path if it's not in the same folder)

### Step 3: Run the Script

#### On macOS:

Open Terminal and navigate to the folder containing the script:

```bash
cd /path/to/script/folder
python3 rtsp_server_setup.py --input /path/to/your/video.mp4
```

#### On Windows:

Open Command Prompt and navigate to the folder containing the script:

```cmd
cd C:\path\to\script\folder
python rtsp_server_setup.py --input C:\path\to\your\video.mp4
```

### Command-line Options

You can customize the RTSP stream with these options:

- `--input` or `-i`: Path to your video file (required)
- `--path` or `-p`: Custom RTSP stream path (default: elephant-test)
- `--port` or `-P`: Custom port number (default: 8554)

Example with custom path and port:
```bash
python3 rtsp_server_setup.py --input video.mp4 --path camera1 --port 9000
```
This would create a stream at `rtsp://localhost:9000/camera1`

### Step 4: Viewing the Stream

You can view the RTSP stream using:

#### VLC Media Player (recommended):

1. Download and install [VLC Media Player](https://www.videolan.org/vlc/)
2. Open VLC
3. Go to Media > Open Network Stream
4. Enter `rtsp://localhost:8554/elephant-test` (or your custom URL)
5. Click Play

#### FFplay (if FFmpeg is installed):

```bash
ffplay rtsp://localhost:8554/elephant-test
```

#### Accessing from another device:

To access the stream from another device on your network, use your computer's IP address:

```
rtsp://your-computer-ip:8554/elephant-test
```

### Step 5: Stopping the Server

To stop the server, press `Ctrl+C` in the Terminal or Command Prompt. The script will clean up all resources automatically.

## Troubleshooting

### SSL Certificate Issues on macOS

If you see an SSL certificate error when the script tries to download MediaMTX:

1. **Option 1:** Install the requests library (recommended)
   ```bash
   pip3 install requests
   ```
   Then run the script again.

2. **Option 2:** Install certificates for Python
   ```bash
   # Find your Python installation
   cd "$(dirname $(which python3))"
   # Run the certificate installer
   ./Install\ Certificates.command
   ```

### Connection Refused Errors

If FFmpeg shows "Connection refused" errors:

1. Make sure no other service is using port 8554
2. Try a different port with `--port 9000` (or another number)
3. Check if your firewall is blocking the connection

### Missing MediaMTX Error

If the script can't find the MediaMTX executable after download:

1. Check the temporary directory mentioned in the script output
2. Look for files that were extracted
3. Make sure the script has permission to execute files

## How It Works

The script:
1. Downloads the MediaMTX RTSP server for your specific platform (Windows/macOS)
2. Creates a configuration file for the server
3. Starts the MediaMTX server as a background process
4. Uses FFmpeg to read your video file and send it to the RTSP server
5. Sets up loop playback with FFmpeg's stream_loop parameter
6. Cleans up all resources when you stop the script

## Advanced Usage

### Creating a Permanent Installation

If you want a more permanent setup:

1. Download MediaMTX directly from [github.com/bluenviron/mediamtx/releases](https://github.com/bluenviron/mediamtx/releases)
2. Set up the configuration manually (see MediaMTX documentation)
3. Create a startup script or service for your operating system

### Custom Video Processing

To apply video processing before streaming (resize, adjust quality, etc.):

Modify the FFmpeg command in the script's `start_ffmpeg()` function. For example, to resize to 720p:

```python
cmd = [
    "ffmpeg",
    "-re",
    "-stream_loop", "-1",
    "-i", self.video_path,
    "-c:v", "libx264",  # Re-encode video
    "-s", "1280x720",   # Resize to 720p
    "-b:v", "2M",       # Set video bitrate
    "-c:a", "aac",      # Re-encode audio
    "-f", "rtsp",
    "-rtsp_transport", "tcp",
    rtsp_url
]
```

## License

This project is available under the MIT License.