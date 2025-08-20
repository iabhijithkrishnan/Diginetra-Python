import cv2
import numpy as np
import time
import platform
from queue import Queue
from PyQt6.QtCore import QThread, pyqtSignal

class RTSPStream(QThread):
    """Thread to handle RTSP stream processing with hardware-aware optimizations"""
    frame_ready = pyqtSignal(np.ndarray, str)
    connection_status = pyqtSignal(str, str)  # camera_id, status
    
    def __init__(self, camera_id, rtsp_url, queue_size=64, max_resolution=(1280, 720)):
        super().__init__()
        self.camera_id = camera_id
        
        # Adjust parameters based on hardware - set these BEFORE using them
        self.is_mac = platform.system() == "Darwin"
        self.has_gpu = self._check_gpu_availability()
        
        # Now we can safely use these attributes
        self.rtsp_url = self._optimize_rtsp_url(rtsp_url)
        
        # Hardware-specific adjustments
        if self.is_mac:
            # More conservative settings for Mac
            self.queue_size = min(32, queue_size)  # Smaller queue
            self.max_resolution = (960, 540)  # Reduced resolution
            self.frame_interval = 0.05  # Slower frame rate (20 FPS target)
        elif not self.has_gpu:
            # General CPU settings
            self.queue_size = min(48, queue_size)
            self.max_resolution = (1024, 576)  # Medium resolution
            self.frame_interval = 0.03  # ~30 FPS target
        else:
            # GPU settings (original)
            self.queue_size = queue_size
            self.max_resolution = max_resolution
            self.frame_interval = 0.01  # Up to 100 FPS
        
        self.frame_queue = Queue(maxsize=self.queue_size)
        self.is_running = False
        self.cap = None
        self.last_frame = None
        self.reconnect_attempts = 0
        self.max_reconnect_attempts = 5
        self.reconnect_delay = 2  # seconds
        
        print(f"Stream {camera_id} initialized: Mac={self.is_mac}, GPU={self.has_gpu}, "
              f"MaxRes={self.max_resolution}, FrameInterval={self.frame_interval}")
        
        # Set thread priority to high for GPU, normal for CPU
        if self.has_gpu:
            self.setPriority(QThread.Priority.HighPriority)
        else:
            self.setPriority(QThread.Priority.NormalPriority)
    
    def _check_gpu_availability(self):
        """Check if CUDA GPU is available"""
        try:
            import torch
            return torch.cuda.is_available()
        except:
            return False
    
    def _optimize_rtsp_url(self, url):
        """Optimize RTSP URL for better performance"""
        # If it's a device number (like 0 for webcam), return as is
        if isinstance(url, str) and url.isdigit():
            return int(url)
            
        # Add optimization parameters to RTSP URL if needed
        if isinstance(url, str) and url.startswith('rtsp://'):
            # Add rtsp transport protocol if not present
            if 'rtsp_transport=' not in url:
                if '?' in url:
                    url += '&rtsp_transport=tcp'  # TCP is more reliable than UDP
                else:
                    url += '?rtsp_transport=tcp'
            
            # For non-Mac or GPU systems, add more optimizations
            if not self.is_mac or self.has_gpu:
                # Set buffer size for better performance
                if 'buffer_size=' not in url:
                    url += '&buffer_size=1000000'  # 1MB buffer
                    
                # Decrease latency with low_delay option
                if 'low_delay=' not in url:
                    url += '&low_delay=1'
            else:
                # More conservative buffer for Mac
                if 'buffer_size=' not in url:
                    url += '&buffer_size=500000'  # 500KB buffer
        
        return url
    
    def run(self):
        """Thread main function to capture frames continuously with optimizations"""
        self.is_running = True
        
        # Configure OpenCV to use FFmpeg backend which works well cross-platform
        self.cap = cv2.VideoCapture(self.rtsp_url, cv2.CAP_FFMPEG)
        
        # Try to enable hardware acceleration if available on non-Mac
        if not self.is_mac and isinstance(self.rtsp_url, str) and self.rtsp_url.startswith('rtsp://'):
            # Try to enable hardware acceleration
            try:
                self.cap.set(cv2.CAP_PROP_HW_ACCELERATION, cv2.VIDEO_ACCELERATION_ANY)
                
                # Configure additional options for lower latency
                self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Minimize buffering
            except:
                print(f"Hardware acceleration not available for camera {self.camera_id}")
            
        if not self.cap.isOpened():
            self.connection_status.emit(self.camera_id, "Failed to connect")
            self.is_running = False
            return
            
        self.connection_status.emit(self.camera_id, "Connected")
        
        # Get original resolution
        orig_width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        orig_height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        # Calculate scaling factor if resolution exceeds max_resolution
        scale_down = False
        scale_factor = 1.0
        target_width, target_height = orig_width, orig_height
        
        if self.max_resolution:
            max_width, max_height = self.max_resolution
            if orig_width > max_width or orig_height > max_height:
                scale_down = True
                width_ratio = max_width / orig_width
                height_ratio = max_height / orig_height
                scale_factor = min(width_ratio, height_ratio)
                target_width = int(orig_width * scale_factor)
                target_height = int(orig_height * scale_factor)
                print(f"Camera {self.camera_id}: Scaling down from {orig_width}x{orig_height} to {target_width}x{target_height}")
        
        try:
            frame_count = 0
            last_status_time = time.time()
            last_frame_time = time.time()
            
            while self.is_running:
                # Control frame rate to avoid overwhelming the system
                current_time = time.time()
                elapsed = current_time - last_frame_time
                
                if elapsed < self.frame_interval:
                    # Wait until the frame interval has passed
                    time.sleep(max(0, self.frame_interval - elapsed))
                    continue
                
                last_frame_time = current_time
                ret, frame = self.cap.read()
                
                if not ret:
                    # Try to reconnect if connection is lost
                    self.reconnect_attempts += 1
                    self.connection_status.emit(self.camera_id, f"Reconnecting... ({self.reconnect_attempts}/{self.max_reconnect_attempts})")
                    
                    if self.reconnect_attempts > self.max_reconnect_attempts:
                        self.connection_status.emit(self.camera_id, "Connection failed after multiple attempts")
                        time.sleep(5)  # Wait longer between reconnection cycles
                        self.reconnect_attempts = 0
                    
                    self.cap.release()
                    time.sleep(self.reconnect_delay)
                    self.cap = cv2.VideoCapture(self.rtsp_url, cv2.CAP_FFMPEG)
                    
                    # Try to enable hardware acceleration again
                    if not self.is_mac and isinstance(self.rtsp_url, str) and self.rtsp_url.startswith('rtsp://'):
                        try:
                            self.cap.set(cv2.CAP_PROP_HW_ACCELERATION, cv2.VIDEO_ACCELERATION_ANY)
                            self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                        except:
                            pass
                    continue
                
                # Reset reconnect counter on successful frame
                self.reconnect_attempts = 0
                
                # Scale down the frame if needed
                if scale_down:
                    frame = cv2.resize(frame, (target_width, target_height), 
                                     interpolation=cv2.INTER_AREA)  # INTER_AREA is better for downsampling
                
                # Clear queue if it's getting full to avoid lag - more aggressive on Mac
                queue_threshold = 0.7 if self.is_mac else 0.8
                queue_target = 0.4 if self.is_mac else 0.5
                
                if self.frame_queue.qsize() > self.frame_queue.maxsize * queue_threshold:
                    try:
                        while self.frame_queue.qsize() > self.frame_queue.maxsize * queue_target:
                            self.frame_queue.get_nowait()
                    except:
                        pass
                
                self.last_frame = frame.copy()
                
                # Signal that a new frame is ready
                self.frame_ready.emit(frame, self.camera_id)
                
                # Print stats every 100 frames
                frame_count += 1
                if frame_count % 100 == 0:
                    current_status_time = time.time()
                    elapsed = current_status_time - last_status_time
                    fps = 100 / elapsed if elapsed > 0 else 0
                    print(f"Camera {self.camera_id}: {fps:.1f} FPS, Queue: {self.frame_queue.qsize()}/{self.frame_queue.maxsize}")
                    last_status_time = current_status_time
                
                # Sleep briefly to reduce CPU usage (adaptive based on queue size)
                sleep_time = self.frame_interval  # Base sleep time
                if self.frame_queue.qsize() > self.frame_queue.maxsize * 0.5:
                    sleep_time = self.frame_interval * 1.5  # Sleep longer if queue is getting full
                
                time.sleep(sleep_time * 0.1)  # Short sleep to give other threads a chance to run
                
        except Exception as e:
            print(f"Error in camera {self.camera_id}: {str(e)}")
            self.connection_status.emit(self.camera_id, f"Error: {str(e)[:30]}...")
        finally:
            if self.cap:
                self.cap.release()
            self.connection_status.emit(self.camera_id, "Disconnected")
    
    def stop(self):
        """Stop the thread safely"""
        self.is_running = False
        self.wait(1000)  # Wait for thread to finish