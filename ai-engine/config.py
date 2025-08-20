import os

# Constants for the dark theme
DARK_THEME = {
    'bg_primary': '#121212',
    'bg_secondary': '#1E1E1E',
    'accent': '#0E8059',
    'accent_secondary': '#34C98B',
    'text_primary': '#FFFFFF',
    'text_secondary': '#CCCCCC',
    'text_teritiary': '#2A2A2A',
    'error': '#D45A68',
    'success': '#00B89F',
    'warning': '#FF9800',
}

# Database path
DB_PATH = 'diginetra.db'
EVENTS_DIR = 'events'

# Ensure events directory exists
if not os.path.exists(EVENTS_DIR):
    os.makedirs(EVENTS_DIR)

# Webhook configuration
WEBHOOK_URL = "http://13.232.212.109/api/webhook/receive"
WEBHOOK_SECRET = '0143e782ea5826eb34251436a3cc13cbc4968580'
AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2N2Y2NzcwMWFjYzIyYjlkMjBhMjBmNjYiLCJuYW1lIjoiRGlnaU5ldHJhIFN1cGVyIEFkbWluIERlZmF1bHQiLCJlbWFpbCI6ImluZm8rZGlnaW5ldHJhYWRtaW5Ac3Ryb2Zlcy5jb20iLCJyb2xlIjoid2ViaG9vay1hZG1pbiIsImlhdCI6MTc0NDIwNjcyNCwiZXhwIjoxNzc1NzQyNzI0fQ.9wtgUJeYpkKJduwNYUoyKzie33q6k_7PIhkvlF4xn9E'

# Default location for demo
DEFAULT_LATITUDE = "28.5355"
DEFAULT_LONGITUDE = "77.3910"

# Performance optimization settings
# Camera settings
MAX_CAMERA_RESOLUTION = (1280, 720)  # Maximum resolution for cameras (HD)
CAMERA_QUEUE_SIZE = 32  # Number of frames to buffer per camera
CAMERA_RECONNECT_DELAY = 2  # Seconds between reconnection attempts

# Detection settings
DETECTION_CONFIDENCE = 0.45  # Confidence threshold for detection
TARGET_DETECTION_SIZE = (640, 480)  # Size to resize frames for detection
FRAME_SKIP = 2  # Process every Nth frame (1 = process all frames)
BATCH_SIZE = 4  # Process this many frames at once
EVENT_COOLDOWN = 30  # Seconds between duplicate event detections

# Image compression settings
JPEG_QUALITY = 85  # JPEG quality for saving event images (0-100)

# Webhook settings
WEBHOOK_TIMEOUT = 5  # Seconds to wait for webhook response
ENABLE_WEBHOOKS = True  # Set to False to disable webhook functionality

# Thread settings
OPENCV_THREADS = 4  # Number of threads for OpenCV operations