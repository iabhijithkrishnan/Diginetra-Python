# DigiNetra - Wildlife Monitoring System

DigiNetra is a real-time wildlife monitoring solution that uses IP cameras with RTSP streams and AI-powered object detection to identify and alert on the presence of humans, vehicles, and animals in monitored areas.

## Features

- Live camera feed monitoring
- Real-time AI detection of humans, vehicles, and animals
- Event history with captured images
- Camera management with location tracking
- Webhook integration for alerts with geolocation
- Performance-optimized for minimal latency
- Dark theme UI for field usage

## Project Architecture

The project follows the Model-View-Controller (MVC) architecture pattern:

### Models
- Handle data and business logic
- Database management
- Video stream processing
- Object detection using YOLO

### Views
- User interface components
- Camera feed display
- Event listing
- Settings management

### Controllers
- Connect models and views
- Handle user input
- Process events and notifications

## Directory Structure

```
diginetra/
├── main.py                     # Entry point for the application
├── config.py                   # Configuration constants
├── models/
│   ├── __init__.py            
│   ├── database.py             # Database model
│   ├── rtsp_stream.py          # RTSP stream handling model
│   └── detection.py            # Object detection model
├── views/
│   ├── __init__.py
│   ├── style.py                # UI styling constants
│   ├── main_window.py          # Main application window
│   ├── sidebar.py              # Sidebar navigation
│   ├── camera_widget.py        # Camera display widget
│   ├── live_view.py            # Live view page
│   ├── events_view.py          # Events history page
│   ├── settings_view.py        # Settings page
│   └── dialogs/
│       ├── __init__.py
│       ├── add_camera.py       # Add camera dialog
│       ├── edit_camera.py      # Edit camera dialog
│       └── webhook_notification.py # Webhook notification dialog
└── controllers/
    ├── __init__.py
    ├── live_controller.py      # Live view controller
    ├── events_controller.py    # Events controller
    └── settings_controller.py  # Settings controller
```

## Camera Location Tracking

DigiNetra now supports tracking the geographic location of each camera:

- Each camera can have its own latitude and longitude coordinates
- Location data is stored in the database
- When adding or editing cameras, you can:
  - Use the default location from the config file
  - Set a custom location for the camera
- Location data is included in alert webhooks
- The system follows a priority order for location data:
  1. Camera-specific coordinates (if available)
  2. Default coordinates from the config file (fallback)

## Performance Optimizations

DigiNetra includes several optimizations to minimize latency:

- **Detection Model Optimizations**:
  - Batch processing of frames
  - Frame skipping for reduced load
  - Reduced processing resolution
  - GPU acceleration with FP16 precision
  - High-priority detection thread

- **Video Stream Optimizations**:
  - Resolution limiting
  - Hardware-accelerated decoding
  - Optimized RTSP connection parameters
  - Adaptive frame queue management

- **System-Level Enhancements**:
  - OpenCV built-in optimizations
  - CUDA performance environment variables
  - Multi-threading control
  - Process priority optimization

## Requirements

- Python 3.8+
- PyQt6
- OpenCV (with CUDA support recommended)
- Ultralytics YOLO
- SQLite3
- Requests
- psutil (optional, for process priority management)

## Installation

1. Clone the repository
2. Install the required dependencies:
```bash
# Basic dependencies
pip install PyQt6 opencv-python-headless ultralytics requests

# For GPU acceleration (highly recommended)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# For system optimization
pip install psutil
```

3. Create an "icons" directory and add the following icon files:
   - live_icon.png
   - events_icon.png
   - settings_icon.png

## Running the Application

```bash
python main.py
```

## Usage

1. **Adding Cameras**:
   - Go to the Settings page
   - Click "Add Camera"
   - Enter camera name and RTSP URL
   - Set camera location or use default

2. **Viewing Live Feeds**:
   - Switch to the Live View page
   - Camera feeds will display with real-time detection

3. **Monitoring Events**:
   - The Events page shows a history of detections
   - Each event includes an image, timestamp, and camera info

4. **Editing Camera Settings**:
   - Select a camera in the Settings page
   - Click "Edit" to modify camera details and location
   - Click "Delete" to remove a camera

## Configuration

Edit `config.py` to customize:

- Default latitude and longitude
- Detection thresholds
- Performance parameters
- Webhook settings
- UI theme colors

## Additional Information

- Events are stored in the 'events' directory
- Database file is 'diginetra.db'
- Webhook URL and authentication can be configured in config.py
- Performance parameters can be tuned based on available hardware





# Hardware-Aware Optimizations for DigiNetra

DigiNetra now incorporates adaptive optimizations that automatically adjust settings based on the available hardware. This ensures optimal performance across different systems, including Mac computers without dedicated GPUs.

## Key Hardware Detection

The system detects:
- Operating system (Mac, Windows, Linux)
- GPU availability (CUDA-compatible)
- CPU capabilities

## Mac-Specific Optimizations

For Mac systems without a dedicated GPU:

1. **Detection Thread Optimizations**:
   - Single-frame processing instead of batch processing
   - Increased frame skipping (processing every 3rd frame)
   - Reduced resolution (384×288) for detection
   - Higher confidence threshold to reduce false positives
   - Normal thread priority to prevent system slowdowns

2. **Video Stream Optimizations**:
   - Reduced maximum resolution (960×540)
   - Smaller frame queue size (16 frames max)
   - Longer frame interval to reduce CPU load
   - Conservative buffer settings for RTSP streams

3. **Memory & Resource Management**:
   - Reduced JPEG quality (75%) for faster image saving
   - More aggressive frame queue management
   - Fewer OpenCV threads (2 instead of 4-8)
   - Delayed webhook sending to prevent load spikes

## Windows/Linux CPU Optimizations

For non-Mac systems without a dedicated GPU:

1. **Detection Thread Optimizations**:
   - Small batch size (2 frames)
   - Medium resolution (480×360) for detection
   - High thread priority but not highest
   - Limited maximum detections per frame

2. **Video Stream Optimizations**:
   - Medium resolution (1024×576)
   - Moderate frame queue size (32 frames)
   - Balanced throughput settings

## GPU System Optimizations

For systems with NVIDIA GPUs:

1. **Detection Thread Optimizations**:
   - CUDA acceleration with FP16 precision
   - Larger batch size (4 frames at once)
   - Higher resolution processing (640×480)
   - Highest thread priority

2. **Video Stream Optimizations**:
   - Full HD resolution support (1280×720)
   - Hardware-accelerated decoding
   - Larger frame queue (64 frames)
   - Optimized CUDA environment variables

## Adaptive Parameters

The following parameters automatically adjust based on the detected hardware:

| Parameter                | Mac (no GPU)   | CPU (non-Mac)   | GPU System    |
|--------------------------|----------------|-----------------|---------------|
| Detection Resolution     | 384×288        | 480×360         | 640×480       |
| Batch Size               | 1              | 2               | 4             |
| Frame Skip               | 3              | 2               | 2             |
| OpenCV Threads           | 2              | 4               | 8             |
| Max Camera Resolution    | 960×540        | 1024×576        | 1280×720      |
| Frame Queue Size         | 16             | 32              | 64            |
| Thread Priority          | Normal         | High            | Highest       |
| JPEG Quality             | 75%            | 80%             | 85%           |
| Max Detections/Frame     | 10             | 10              | 20            |
| Webhook Timeout          | 10 seconds     | 5 seconds       | 5 seconds     |

## Performance Impact

These optimizations should significantly improve performance on Mac systems without dedicated GPUs, while still maintaining good detection accuracy. You should see:

1. Reduced CPU usage
2. Lower memory consumption
3. Better responsiveness
4. Acceptable detection latency
5. Fewer system slowdowns

The trade-off is slightly reduced detection frequency (every 3rd frame instead of every 2nd frame) and lower resolution processing. However, these differences are generally not noticeable in wildlife monitoring applications where subjects move relatively slowly.



# Hardware Stats UI

I've added a hardware monitoring panel to the sidebar that displays real-time system resource usage. This panel appears at the bottom of the sidebar, below the navigation buttons.

## Features

### Core Metrics
- **CPU Usage**: Shows the percentage of CPU utilization with a color-coded progress bar
- **RAM Usage**: Displays memory consumption percentage with a warning-colored progress bar
- **GPU Usage**: Conditionally appears when a GPU is detected, showing its utilization

### Additional Information
- **Process Count**: Shows the number of active processes on the system
- **Memory Details**: Displays used and total RAM in GB
- **System Uptime**: Shows how long the system has been running

## Technical Details

The widget:
- Updates every 2 seconds to show current resource usage
- Uses `psutil` for CPU, memory, and process information
- Uses NVIDIA SMI when available for GPU information
- Adapts to available hardware (shows/hides GPU stats appropriately)
- Features a compact design that fits within the sidebar
- Collapses when the sidebar is collapsed

## Visual Design

The hardware stats panel features:
- Progress bars with percentage indicators
- Color-coded metrics (blue for CPU, orange for RAM, green for GPU)
- Clear section heading with subtle divider
- Compact, informative layout
- Dark theme compatible design

## Integration

The component is seamlessly integrated into the existing sidebar and automatically:
- Updates in the background without affecting application performance
- Cleans up its resources when the application closes
- Adjusts to window resizing and sidebar toggling

## Requirements

This feature requires the `psutil` package, which has been added to the requirements.txt file. For GPU monitoring on systems with NVIDIA graphics cards, it will attempt to use `nvidia-smi` functionality if available.