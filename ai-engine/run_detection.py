# run_detection.py
from ultralytics import YOLO
import cv2
import time
import os
import sys
import json

# Read RTSP URL from command-line argument
if len(sys.argv) < 2:
    print("Error: RTSP URL is required.\nUsage: python run_detection.py <rtsp_url>")
    sys.exit(1)

rtsp_url = sys.argv[1]
model_path = "yolov8n.pt"

# Target class IDs for security monitoring only
TARGET_CLASSES = [0, 1, 2, 3, 5, 7, 15, 16, 17, 18, 19, 22]
# 0=person, 1=bicycle, 2=car, 3=motorcycle, 5=bus, 7=truck
# 15=cat, 16=dog, 17=horse, 18=elephant, 19=bear, 22=zebra

# Class mapping for dashboard categories
CLASS_CATEGORIES = {
    0: 'Human',    # person
    1: 'Vehicle',  # bicycle
    2: 'Vehicle',  # car
    3: 'Vehicle',  # motorcycle
    5: 'Vehicle',  # bus
    7: 'Vehicle',  # truck
    15: 'Animal',  # cat
    16: 'Animal',  # dog
    17: 'Animal',  # horse
    18: 'Animal',  # elephant
    19: 'Animal',  # bear
    22: 'Animal'   # zebra
}

# Load model
model = YOLO(model_path)

# Open RTSP stream
cap = cv2.VideoCapture(rtsp_url)

if not cap.isOpened():
    print(f"Failed to open RTSP stream: {rtsp_url}")
    sys.exit(1)

# Output folder
output_dir = "events"
os.makedirs(output_dir, exist_ok=True)

print("Starting security detection from RTSP stream... Press 'q' to quit.")
print("Monitoring for: Humans, Vehicles, and Animals only")

try:
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Frame not received. Exiting.")
            break

        # YOLOv8 detection with filtered classes
        results = model(frame, classes=TARGET_CLASSES, conf=0.45)

        for result in results:
            if result.boxes:
                detections = []
                print(f"Security alert: {len(result.boxes)} object(s) detected")

                # Process each detection
                for box in result.boxes:
                    class_id = int(box.cls[0].item())
                    class_name = result.names[class_id]
                    confidence = float(box.conf[0].item())
                    category = CLASS_CATEGORIES.get(class_id, 'Unknown')
                    
                    # Get bounding box coordinates
                    x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                    
                    detections.append({
                        'type': category,
                        'class_name': class_name,
                        'confidence': confidence,
                        'bbox': [x1, y1, x2-x1, y2-y1]
                    })
                    
                    print(f"  - {category}: {class_name} ({confidence:.2f})")

                # Annotate frame and save
                annotated = result.plot()
                timestamp = int(time.time())
                filename = f"det_{timestamp}.jpg"
                filepath = os.path.join(output_dir, filename)
                cv2.imwrite(filepath, annotated)
                
                # Save metadata for dashboard
                metadata = {
                    'filename': filename,
                    'timestamp': timestamp,
                    'camera_id': 'rtsp_camera',
                    'detections': detections
                }
                
                metadata_file = os.path.join(output_dir, f"det_{timestamp}_metadata.json")
                with open(metadata_file, 'w') as f:
                    json.dump(metadata, f)
                
                print(f"Saved: {filename} with {len(detections)} security objects")

        # Optional: preview window (comment out if running headless)
        cv2.imshow("Security Detection", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            print("Quit signal received. Stopping detection.")
            break

except KeyboardInterrupt:
    print("Interrupted by user.")

# Cleanup
cap.release()
cv2.destroyAllWindows()
print("Stream closed and resources released.")