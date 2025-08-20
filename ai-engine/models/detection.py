import cv2
import numpy as np
import os
import time
import platform
import json
from queue import Queue
from PyQt6.QtCore import QThread, pyqtSignal
from ultralytics import YOLO

class DetectionThread(QThread):
    """Thread to handle object detection processing with hardware-aware optimizations"""
    detection_complete = pyqtSignal(list, np.ndarray, str)  # detections, processed_frame, camera_id
    event_detected = pyqtSignal(str, str, np.ndarray, tuple)  # camera_id, object_type, frame, bbox
    
    def __init__(self, model_path=None, device='cpu', use_gpu=False, batch_size=4,
             frame_skip=2, target_size=(640, 480), half_precision=False,
             max_det=20, conf_threshold=0.45, iou_threshold=0.45,
             agnostic_nms=True, gpu_memory_fraction=0.75, num_threads=4):
        super().__init__()
        
        # Initialize basic properties first
        self.frame_queue = Queue(maxsize=16)  # Reduced queue size for lower memory usage
        self.is_running = False
        self.model = None
        self.model_path = model_path
        self.frame_counter = {}  # Count frames per camera for frame skipping
        self.tracking_objects = {}  # Track detected objects to avoid duplicate events
        
        # Target class configuration for dashboard categories
        self.target_classes = ['person', 'car', 'truck', 'motorcycle', 'bus', 'bicycle', 
                              'cat', 'dog', 'horse', 'elephant', 'bear', 'zebra']
        self.target_categories = {
            'Human': ['person'],
            'Vehicle': ['car', 'truck', 'motorcycle', 'bus', 'bicycle'],
            'Animal': ['cat', 'dog', 'horse', 'elephant', 'bear', 'zebra']
        }
        
        # COCO class IDs for target objects only
        self.target_class_ids = [0, 1, 2, 3, 5, 7, 15, 16, 17, 18, 19, 22]  # person, bicycle, car, motorcycle, bus, truck, cat, dog, horse, elephant, bear, zebra
        
        # Hardware-aware optimization parameters
        self.has_gpu = self._check_gpu_availability()
        self.is_mac = platform.system() == "Darwin"
        
        # Set parameters based on input
        self.device = device
        self.use_gpu = use_gpu
        self.batch_size = batch_size
        self.frame_skip = frame_skip
        self.target_size = target_size
        self.half_precision = half_precision
        self.max_det = max_det
        self.confidence_threshold = conf_threshold
        self.iou_threshold = iou_threshold
        self.agnostic_nms = agnostic_nms
        self.gpu_memory_fraction = gpu_memory_fraction
        self.num_threads = num_threads
        
        # Adjust parameters based on hardware
        if self.has_gpu:
            self.confidence_threshold = conf_threshold
            self.batch_size = batch_size
            self.frame_skip = frame_skip
            self.target_size = target_size
        elif self.is_mac:
            # More conservative settings for Mac without GPU
            self.confidence_threshold = 0.5
            self.batch_size = 1
            self.frame_skip = max(3, frame_skip)
            self.target_size = (384, 288)
        else:
            # General CPU settings
            self.confidence_threshold = 0.5
            self.batch_size = 2
            self.frame_skip = max(2, frame_skip)
            self.target_size = (480, 360)
            
        print(f"Detection initialized: GPU={self.has_gpu}, Mac={self.is_mac}, "
              f"FrameSkip={self.frame_skip}, BatchSize={self.batch_size}, "
              f"TargetSize={self.target_size}")
    
    def _check_gpu_availability(self):
        """Check if CUDA GPU is available"""
        try:
            import torch
            has_cuda = torch.cuda.is_available()
            if has_cuda:
                device_name = torch.cuda.get_device_name(0)
                print(f"GPU detected: {device_name}")
            else:
                print("No CUDA GPU detected, using CPU mode")
            return has_cuda
        except ImportError:
            print("PyTorch not available, assuming CPU mode")
            return False
        except Exception as e:
            print(f"Error checking GPU: {str(e)}")
            return False
        
    def load_model(self):
        """Load the YOLO model with hardware-aware optimizations"""
        try:
            if self.model_path and os.path.exists(self.model_path):
                self.model = YOLO(self.model_path)
            else:
                self.model = YOLO("yolov8n.pt")
            
            # Apply hardware-specific optimizations
            if hasattr(self.model, 'to'):
                self.model.to(self.device)
                if self.device == 'cuda' and self.half_precision and hasattr(self.model, 'half'):
                    self.model.half()
                print("Model loaded with GPU optimizations")
            else:
                print("Model loaded for CPU inference")
                
        except Exception as e:
            print(f"Error loading model: {str(e)}")
            self.model = YOLO("yolov8n.pt")
            print("Fallback to basic model")
    
    def add_frame(self, frame, camera_id):
        """Add a frame to the processing queue with frame skipping"""
        if camera_id not in self.frame_counter:
            self.frame_counter[camera_id] = 0
            
        self.frame_counter[camera_id] += 1
        
        # Process only every nth frame (frame skipping)
        if self.frame_counter[camera_id] % self.frame_skip != 0:
            return
            
        # Skip if queue is almost full to avoid backlog
        if self.frame_queue.qsize() >= self.frame_queue.maxsize - 1:
            return
            
        # Resize frame for faster processing
        if self.target_size:
            frame = cv2.resize(frame, self.target_size, interpolation=cv2.INTER_AREA)
            
        self.frame_queue.put((frame.copy(), camera_id))
        
    def map_class_to_category(self, class_name):
        """Map YOLO class name to our dashboard categories (Human, Vehicle, Animal)"""
        for category, classes in self.target_categories.items():
            if class_name in classes:
                return category
        return None
    
    def save_detection_metadata(self, detections, filename, camera_id):
        """Save detection metadata alongside the image for dashboard integration"""
        metadata = {
            'filename': filename,
            'timestamp': time.time(),
            'camera_id': camera_id,
            'detections': []
        }
        
        for detection in detections:
            if detection['class'] in ['Human', 'Vehicle', 'Animal']:
                metadata['detections'].append({
                    'type': detection['class'],
                    'confidence': detection['confidence'],
                    'bbox': detection['bbox']
                })
        
        # Save metadata file
        try:
            metadata_file = filename.replace('.jpg', '_metadata.json')
            events_dir = 'api-backend/events'
            if not os.path.exists(events_dir):
                os.makedirs(events_dir)
                
            with open(os.path.join(events_dir, metadata_file), 'w') as f:
                json.dump(metadata, f)
        except Exception as e:
            print(f"Error saving metadata: {str(e)}")
        
    def run(self):
        """Thread main function to process frames with hardware-aware batch processing"""
        self.is_running = True
        self.load_model()
        
        while self.is_running:
            # Collect frames for batch processing
            frames_batch = []
            camera_ids = []
            original_frames = []
            
            batch_size = self.batch_size if self.has_gpu else 1
            
            # Collect up to batch_size frames or until queue is empty
            while len(frames_batch) < batch_size and not self.frame_queue.empty():
                if not self.frame_queue.empty():
                    try:
                        frame, camera_id = self.frame_queue.get(block=False)
                        frames_batch.append(frame)
                        camera_ids.append(camera_id)
                        original_frames.append(frame.copy())
                    except:
                        pass
                
            # Skip if no frames to process
            if not frames_batch:
                time.sleep(0.01)
                continue
                
            # Process frames in a batch
            start_time = time.time()
            
            try:
                # Run detection with only target classes - THIS IS THE KEY CHANGE
                results = self.model(
                    frames_batch, 
                    conf=self.confidence_threshold, 
                    verbose=False,
                    agnostic_nms=True,
                    max_det=10 if not self.has_gpu else 20,
                    classes=self.target_class_ids  # Only detect target objects
                )
                
                # Monitor performance
                inference_time = time.time() - start_time
                if len(frames_batch) > 0:
                    print(f"Processed {len(frames_batch)} frames in {inference_time:.3f}s. "
                        f"Average: {inference_time/len(frames_batch):.3f}s per frame")
                
                # Process results for each frame
                current_time = time.time()
                for i, result in enumerate(results):
                    if i >= len(camera_ids):
                        continue
                        
                    frame = original_frames[i]
                    camera_id = camera_ids[i]
                    result_frame = frame.copy()
                    detections = []
                    new_events = []
                    
                    # Process detection boxes - only target classes will be present now
                    if hasattr(result, 'boxes') and len(result.boxes) > 0:
                        boxes = result.boxes
                        for box in boxes:
                            try:
                                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                                class_id = int(box.cls[0].item())
                                class_name = result.names[class_id]
                                conf = float(box.conf[0].item())
                                
                                # Map to category (this should always succeed now since we're only detecting target classes)
                                category = self.map_class_to_category(class_name)
                                if category:
                                    bbox = (x1, y1, x2-x1, y2-y1)
                                    
                                    detections.append({
                                        "class": category,
                                        "confidence": conf,
                                        "box": (x1, y1, x2, y2),
                                        "bbox": bbox
                                    })
                                    
                                    # Check for new events
                                    cooldown = 45 if not self.has_gpu else 30
                                    object_key = f"{camera_id}_{category}"
                                    if object_key not in self.tracking_objects or current_time - self.tracking_objects[object_key] > cooldown:
                                        self.tracking_objects[object_key] = current_time
                                        new_events.append({
                                            "category": category,
                                            "frame": frame.copy(),
                                            "bbox": bbox
                                        })
                                    
                                    # Draw bounding box on the frame
                                    color_map = {
                                        "Human": (0, 255, 0),      # Green for humans
                                        "Vehicle": (0, 0, 255),   # Red for vehicles  
                                        "Animal": (255, 0, 0)     # Blue for animals
                                    }
                                    color = color_map.get(category, (255, 255, 255))
                                    
                                    cv2.rectangle(result_frame, (x1, y1), (x2, y2), color, 2)
                                    cv2.putText(result_frame, f"{category}: {conf:.2f}", 
                                            (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                                else:
                                    # This should not happen anymore since we filter at model level
                                    print(f"Unexpected class detected: {class_name}")
                                    
                            except Exception as e:
                                print(f"Error processing detection: {str(e)}")
                    
                    # Save image and metadata if there are valid detections
                    if detections:
                        timestamp = int(time.time())
                        filename = f"det_{timestamp}.jpg"
                        events_dir = 'api-backend/events'
                        
                        if not os.path.exists(events_dir):
                            os.makedirs(events_dir)
                            
                        image_path = os.path.join(events_dir, filename)
                        cv2.imwrite(image_path, result_frame)
                        
                        # Save metadata for dashboard
                        self.save_detection_metadata(detections, filename, camera_id)
                        print(f"Saved detection: {filename} with {len(detections)} objects")
                    
                    # Emit the detection results
                    self.detection_complete.emit(detections, result_frame, camera_id)
                    
                    # Emit new events
                    if new_events:
                        for event in new_events[:1]:  # Limit to one event at a time
                            self.event_detected.emit(camera_id, event["category"], event["frame"], event["bbox"])
            
            except Exception as e:
                print(f"Error in detection processing: {str(e)}")
                
            # Sleep based on hardware
            if not self.has_gpu:
                time.sleep(0.03)
            else:
                time.sleep(0.01)
    
    def stop(self):
        """Stop the thread safely"""
        self.is_running = False
        self.wait(1000)