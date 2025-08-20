import os
import cv2
import time
import platform
import requests
from datetime import datetime
from PyQt6.QtCore import QObject, QThreadPool
from config import DARK_THEME, EVENTS_DIR, WEBHOOK_URL, WEBHOOK_SECRET, AUTH_TOKEN, DEFAULT_LATITUDE, DEFAULT_LONGITUDE

# Hardware detection
IS_MAC = platform.system() == "Darwin"
HAS_GPU = False
try:
    import torch
    HAS_GPU = torch.cuda.is_available()
except:
    pass

# Hardware-aware configuration parameters
if IS_MAC:
    # Mac-specific settings
    MAX_RESOLUTION = (960, 540)  # Lower resolution for Mac
    FRAME_SKIP = 3  # Skip more frames on Mac
    BATCH_SIZE = 1  # Process one frame at a time
    JPEG_QUALITY = 75  # Lower quality for faster saving
else:
    # General settings with GPU/CPU distinction
    MAX_RESOLUTION = (1920, 1080) if HAS_GPU else (1024, 576)
    FRAME_SKIP = 5 if HAS_GPU else 8  # Same frame skip for now
    BATCH_SIZE = 4 if HAS_GPU else 2
    JPEG_QUALITY = 85 if HAS_GPU else 80

class LiveController(QObject):
    """Controller for live camera view functionality with hardware-aware optimizations"""
    def __init__(self, database, live_view_page):
        super().__init__()
        self.db = database
        self.view = live_view_page
        self.camera_streams = {}  # Dictionary of RTSPStream threads
        self.detection_thread = None  # Will be set later
        
        # Initialize thread pool for parallel tasks
        self.thread_pool = QThreadPool.globalInstance()
        # Set thread count based on hardware
        if IS_MAC:
            max_threads = 2
        elif HAS_GPU:
            max_threads = 8
        else:
            max_threads = 4
            
        self.thread_pool.setMaxThreadCount(max_threads)
        print(f"Using thread pool with max {self.thread_pool.maxThreadCount()} threads")
    
    def set_detection_thread(self, detection_thread):
        """Set the detection thread and connect signals"""
        self.detection_thread = detection_thread
        self.detection_thread.detection_complete.connect(self.process_detection_results)
        self.detection_thread.event_detected.connect(self.on_event_detected)
    
    def load_cameras(self):
        """Load cameras from database and create widgets with optimization"""
        # Clear existing streams and widgets
        self.cleanup_cameras()
        
        # Load cameras from database
        cameras = self.db.get_cameras()
        
        # Calculate optimal batch size based on camera count
        batch_size = min(BATCH_SIZE, max(1, len(cameras)))
        if self.detection_thread:
            self.detection_thread.batch_size = batch_size
            self.detection_thread.frame_skip = FRAME_SKIP
        
        for camera in cameras:
            # Unpack camera data including latitude and longitude
            camera_id, name, rtsp_url, enabled, latitude, longitude = camera
            
            if enabled:
                # Create camera widget through the view
                camera_widget = self.view.add_camera_widget(str(camera_id), name)
                
                # Store location info in the widget for webhook use
                camera_widget.latitude = latitude
                camera_widget.longitude = longitude
                
                # Create and start stream with optimized parameters
                from models.rtsp_stream import RTSPStream  # Import here to avoid circular imports
                
                # Determine optimal queue size based on hardware
                queue_size = 16 if IS_MAC else 32 if not HAS_GPU else 64
                
                stream_thread = RTSPStream(
                    str(camera_id), 
                    rtsp_url,
                    queue_size=queue_size,
                    max_resolution=MAX_RESOLUTION
                )
                stream_thread.frame_ready.connect(self.process_frame)
                stream_thread.connection_status.connect(self.update_connection_status)
                stream_thread.start()
                
                # Store thread reference
                self.camera_streams[str(camera_id)] = stream_thread
                
                # Small delay between starting cameras to distribute load
                # Longer delay for Mac to reduce initial load spike
                time.sleep(0.5 if IS_MAC else 0.2)
        
        print(f"Started {len(self.camera_streams)} camera streams")
    
    def process_frame(self, frame, camera_id):
        """Process incoming frame from camera stream with optimizations"""
        if camera_id in self.view.camera_widgets:
            # Send frame to detection thread
            if self.detection_thread:
                self.detection_thread.add_frame(frame, camera_id)
    
    def process_detection_results(self, detections, processed_frame, camera_id):
        """Process detection results and update camera display"""
        if camera_id in self.view.camera_widgets:
            # Update the frame with bounding boxes
            self.view.camera_widgets[camera_id].update_frame(processed_frame)
    
    def update_connection_status(self, camera_id, status):
        """Update connection status for camera widget"""
        if camera_id in self.view.camera_widgets:
            self.view.camera_widgets[camera_id].update_connection_status(status)
    
    def on_event_detected(self, camera_id, object_type, frame, bbox):
        """Handle new object detection event with optimizations"""
        if camera_id in self.view.camera_widgets:
            # Show notification in camera widget
            self.view.camera_widgets[camera_id].show_notification(object_type)
            
            # Save event image (run in background thread to avoid blocking)
            self._save_event_image_async(camera_id, object_type, frame, bbox)
    
    def _save_event_image_async(self, camera_id, object_type, frame, bbox):
        """Save event image and send webhook in background thread"""
        # Save event image
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        image_path = os.path.join(EVENTS_DIR, f"{camera_id}_{timestamp}_{object_type}.jpg")
        
        # Compression parameters for faster saving
        encode_params = [int(cv2.IMWRITE_JPEG_QUALITY), JPEG_QUALITY]  # Lower quality for faster saving
        
        # Save image with reduced quality
        cv2.imwrite(image_path, frame, encode_params)
        
        # Save to database
        self.db.add_event(int(camera_id), object_type, image_path)

        # For Mac with limited resources, don't send webhook immediately for better performance
        if IS_MAC and not HAS_GPU:
            # Show notification
            self.view.show_badge_notification(f"{object_type} detected - saving image", 
                                              color=DARK_THEME['success'], 
                                              duration=2000)
            # Delay webhook sending to reduce system load spikes
            time.sleep(0.5)
            
        # Send webhook notification with bounding box information
        # self.send_webhook(image_path, object_type, camera_id, bbox)
    
    def send_webhook(self, image_path, object_type, camera_id, bbox=None):
        """Send webhook notification with detected object information and bounding box"""
        try:
            # Get camera location from the widget
            latitude = None
            longitude = None
            
            # Get location from camera widget or database if available
            if camera_id in self.view.camera_widgets:
                widget = self.view.camera_widgets[camera_id]
                latitude = getattr(widget, 'latitude', None)
                longitude = getattr(widget, 'longitude', None)
                
            # If location not found in widget, try to get from database
            if not latitude or not longitude:
                location = self.db.get_camera_location(int(camera_id))
                if location:
                    latitude, longitude = location
            
            # If still not found, use defaults
            if not latitude or not longitude:
                latitude = DEFAULT_LATITUDE
                longitude = DEFAULT_LONGITUDE
            
            # Map object type to animal type
            if object_type == "Animal":
                animal_type = "Tiger"  # Example animal type
            else:
                animal_type = object_type
            
            # Set severity based on object type
            if object_type == "Human":
                severity = "high"
            elif object_type == "Vehicle":
                severity = "medium"
            else:
                severity = "high"  # Animals are high priority
            
            # Set case details
            camera_name = self.view.camera_widgets[camera_id].camera_name
            detection_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            case_details = f"{object_type} detected on {camera_name} at {detection_time}"
            
            # Create a notification that we're sending the webhook
            self.view.show_badge_notification(f"Sending {object_type} detection...")
            
            # Add bounding box to the image if provided
            send_image_path = image_path
            if bbox is not None:
                # Create a copy of the image to avoid modifying the original
                image = cv2.imread(image_path)
                x, y, w, h = bbox
                # Draw the bounding box (green rectangle, 2px thickness)
                cv2.rectangle(image, (x, y), (x+w, y+h), (0, 255, 0), 2)
                # Create a temporary file for the modified image
                temp_image_path = os.path.join(os.path.dirname(image_path), 
                                            f"temp_{os.path.basename(image_path)}")
                # Save with compression for faster processing
                cv2.imwrite(temp_image_path, image, [int(cv2.IMWRITE_JPEG_QUALITY), JPEG_QUALITY])
                # Use the modified image instead
                send_image_path = temp_image_path
            
            # Get the correct MIME type based on file extension
            mime_type = 'image/jpeg'  # Default for .jpg files
            if send_image_path.lower().endswith('.png'):
                mime_type = 'image/png'
            
            # Debug info about location being sent
            print(f"Sending webhook with location: Lat={latitude}, Long={longitude}")
            
            # Prepare files and data for multipart/form-data request
            with open(send_image_path, 'rb') as img_file:
                files = {
                    'image': (os.path.basename(send_image_path), img_file, mime_type)
                }
                
                data = {
                    'latitude': latitude,
                    'longitude': longitude,
                    'objectType': animal_type,
                    'caseDetails': case_details,
                    'severity': severity
                }
                
                # Set timeout based on hardware (longer for Mac)
                timeout = 10 if IS_MAC else 5
                
                # Send the POST request with authentication headers
                response = requests.post(
                    WEBHOOK_URL, 
                    files=files, 
                    data=data, 
                    headers={
                        'x-webhook-secret': WEBHOOK_SECRET,
                        'authorization': AUTH_TOKEN
                    },
                    timeout=timeout)
            
            # Clean up the temporary file if we created one
            if bbox is not None:
                try:
                    os.remove(send_image_path)
                except:
                    pass
            
            # Show badge notification
            if response.status_code == 200:
                # Success notification
                self.view.show_badge_notification(f"{object_type} alert sent ✓", 
                                            color=DARK_THEME['success'], 
                                            duration=3000)
            else:
                # Error notification
                self.view.show_badge_notification(f"Alert failed ({response.status_code})", 
                                            color=DARK_THEME['error'], 
                                            duration=4000)
            
            return True, response.status_code
            
        except requests.RequestException as e:
            # Network error
            self.view.show_badge_notification(f"Network error: {str(e)[:30]}...", 
                                        color=DARK_THEME['error'], 
                                        duration=4000)
            return False, str(e)
            
        except Exception as e:
            # Other error
            self.view.show_badge_notification(f"Error: {str(e)[:30]}...", 
                                        color=DARK_THEME['error'], 
                                        duration=4000)
            return False, str(e)
    
    def cleanup_cameras(self):
        """Clean up camera streams and widgets"""
        for stream in self.camera_streams.values():
            stream.stop()
        self.camera_streams.clear()
        self.view.clear_camera_widgets()
    
    def cleanup(self):
        """Clean up resources before closing"""
        self.cleanup_cameras()