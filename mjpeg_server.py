#!/usr/bin/env python3
import os
import time
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
import queue
import io

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    """Handle requests in a separate thread."""
    daemon_threads = True
    allow_reuse_address = True

# Global frame buffer for FFmpeg stream
frame_buffer = queue.Queue(maxsize=10)
latest_frame = None
frame_lock = threading.Lock()

class MJPEGStreamHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/live_feed':
            # Serve continuous MJPEG stream from FFmpeg
            self.serve_ffmpeg_stream()
        elif self.path == '/feed1':
            # Receive FFmpeg stream (this is where FFmpeg sends data)
            self.receive_ffmpeg_stream()
        elif self.path == '/detection_feed':
            # Serve detection images (fallback)
            self.serve_detection_stream()
        elif self.path == '/latest_image':
            # Serve single latest frame
            self.serve_latest_frame()
        elif self.path == '/':
            # Test page
            self.serve_test_page()
        else:
            self.send_response(404)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

    def do_POST(self):
        if self.path == '/feed1':
            # Receive FFmpeg stream via POST
            self.receive_ffmpeg_stream()
        else:
            self.send_response(404)
            self.end_headers()

    def do_PUT(self):
        if self.path == '/feed1':
            # Receive FFmpeg stream via PUT
            self.receive_ffmpeg_stream()
        else:
            self.send_response(404)
            self.end_headers()

    def receive_ffmpeg_stream(self):
        """Receive MJPEG stream from FFmpeg and buffer frames"""
        global latest_frame, frame_buffer
        
        try:
            self.send_response(200)
            self.send_header('Content-Type', 'application/octet-stream')
            self.end_headers()
            
            print(f"📡 Receiving FFmpeg stream from {self.client_address}")
            
            buffer = b''
            while True:
                try:
                    # Read data from FFmpeg
                    data = self.rfile.read(8192)  # 8KB chunks
                    if not data:
                        break
                    
                    buffer += data
                    
                    # Look for JPEG frame boundaries
                    while b'\xff\xd8' in buffer and b'\xff\xd9' in buffer:
                        # Find JPEG start and end
                        start = buffer.find(b'\xff\xd8')
                        end = buffer.find(b'\xff\xd9', start) + 2
                        
                        if end > start:
                            # Extract complete JPEG frame
                            frame = buffer[start:end]
                            
                            # Update latest frame
                            with frame_lock:
                                latest_frame = frame
                            
                            # Add to buffer (non-blocking)
                            try:
                                frame_buffer.put_nowait(frame)
                            except queue.Full:
                                # Remove old frame and add new one
                                try:
                                    frame_buffer.get_nowait()
                                    frame_buffer.put_nowait(frame)
                                except queue.Empty:
                                    pass
                            
                            # Remove processed data from buffer
                            buffer = buffer[end:]
                            
                            print(f"📦 Buffered frame: {len(frame)} bytes")
                        else:
                            break
                
                except Exception as e:
                    print(f"Error processing FFmpeg data: {e}")
                    break
        
        except Exception as e:
            print(f"Error receiving FFmpeg stream: {e}")

    def serve_ffmpeg_stream(self):
        """Serve continuous MJPEG stream from FFmpeg buffer"""
        global frame_buffer, latest_frame
        
        try:
            self.send_response(200)
            self.send_header('Content-Type', 'multipart/x-mixed-replace; boundary=frame')
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()

            print(f"🎥 Starting MJPEG stream for {self.client_address}")
            last_frame_time = time.time()
            
            while True:
                try:
                    # Try to get frame from buffer first
                    frame = None
                    try:
                        frame = frame_buffer.get(timeout=0.1)
                    except queue.Empty:
                        # If no new frame, use latest frame
                        with frame_lock:
                            if latest_frame:
                                frame = latest_frame
                    
                    if frame:
                        # Write MJPEG frame boundary
                        self.wfile.write(b'\r\n--frame\r\n')
                        self.wfile.write(f'Content-Type: image/jpeg\r\n'.encode())
                        self.wfile.write(f'Content-Length: {len(frame)}\r\n\r\n'.encode())
                        self.wfile.write(frame)
                        
                        last_frame_time = time.time()
                        # print(f"📺 Streamed frame: {len(frame)} bytes")
                    
                    # Check if we haven't received frames for too long
                    if time.time() - last_frame_time > 5:
                        print("⚠️  No frames received for 5 seconds, checking detection fallback...")
                        # Try to serve detection images as fallback
                        detection_frame = self.get_detection_frame()
                        if detection_frame:
                            self.wfile.write(b'\r\n--frame\r\n')
                            self.wfile.write(f'Content-Type: image/jpeg\r\n'.encode())
                            self.wfile.write(f'Content-Length: {len(detection_frame)}\r\n\r\n'.encode())
                            self.wfile.write(detection_frame)
                            last_frame_time = time.time()
                    
                    # Control frame rate (max 30 FPS)
                    time.sleep(0.033)
                
                except Exception as e:
                    print(f"Error streaming frame: {e}")
                    break

        except Exception as e:
            print(f"MJPEG stream error: {e}")

    def get_detection_frame(self):
        """Get latest detection frame as fallback"""
        try:
            events_dir = 'api-backend/events'
            if os.path.exists(events_dir):
                det_files = [f for f in os.listdir(events_dir) 
                           if f.startswith('det_') and f.endswith('.jpg')]
                
                if det_files:
                    det_files.sort(key=lambda x: os.path.getmtime(
                        os.path.join(events_dir, x)), reverse=True)
                    latest_file = os.path.join(events_dir, det_files[0])
                    
                    with open(latest_file, 'rb') as f:
                        return f.read()
        except Exception as e:
            print(f"Error getting detection frame: {e}")
        
        return None

    def serve_detection_stream(self):
        """Serve detection images (fallback method)"""
        try:
            self.send_response(200)
            self.send_header('Content-Type', 'multipart/x-mixed-replace; boundary=frame')
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()

            events_dir = 'api-backend/events'
            last_file = None

            while True:
                try:
                    if os.path.exists(events_dir):
                        det_files = [f for f in os.listdir(events_dir) 
                                   if f.startswith('det_') and f.endswith('.jpg')]
                        
                        if det_files:
                            det_files.sort(key=lambda x: os.path.getmtime(
                                os.path.join(events_dir, x)), reverse=True)
                            latest_file = os.path.join(events_dir, det_files[0])
                            
                            if latest_file != last_file:
                                with open(latest_file, 'rb') as f:
                                    frame_data = f.read()
                                
                                self.wfile.write(b'\r\n--frame\r\n')
                                self.wfile.write(f'Content-Type: image/jpeg\r\n'.encode())
                                self.wfile.write(f'Content-Length: {len(frame_data)}\r\n\r\n'.encode())
                                self.wfile.write(frame_data)
                                
                                last_file = latest_file
                    
                    time.sleep(0.5)  # 2 FPS for detection images
                
                except Exception as e:
                    print(f"Error in detection stream: {e}")
                    time.sleep(1)

        except Exception as e:
            print(f"Detection stream error: {e}")

    def serve_latest_frame(self):
        """Serve single latest frame"""
        global latest_frame
        
        try:
            frame = None
            with frame_lock:
                if latest_frame:
                    frame = latest_frame
            
            if not frame:
                # Fallback to detection images
                frame = self.get_detection_frame()
            
            if frame:
                self.send_response(200)
                self.send_header('Content-Type', 'image/jpeg')
                self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
                self.send_header('Pragma', 'no-cache')
                self.send_header('Expires', '0')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                self.wfile.write(frame)
            else:
                self.send_response(404)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(b'No frames available')
                
        except Exception as e:
            print(f"Error serving latest frame: {e}")
            self.send_response(500)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

    def serve_test_page(self):
        """Serve test page"""
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        html = """
        <html>
        <head>
            <title>Live Camera Feed - FFmpeg + Detection</title>
            <style>
                body { margin:0; background:#000; color:white; font-family:Arial; }
                .container { display:flex; flex-direction:column; align-items:center; padding:20px; }
                .feeds { display:flex; gap:20px; margin:20px 0; }
                .feed-container { text-align:center; }
                img { max-width:640px; max-height:480px; border:2px solid #333; }
                .title { margin:10px 0; font-weight:bold; }
                .status { margin:10px 0; font-size:12px; color:#888; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎥 Live Camera System</h1>
                <div class="feeds">
                    <div class="feed-container">
                        <div class="title">FFmpeg Live Stream</div>
                        <img src="/live_feed" alt="Live Stream">
                        <div class="status">Real-time RTSP → MJPEG</div>
                    </div>
                    <div class="feed-container">
                        <div class="title">Detection Feed</div>
                        <img src="/detection_feed" alt="Detection Stream">
                        <div class="status">AI detection overlay</div>
                    </div>
                </div>
                <div class="feed-container">
                    <div class="title">Latest Frame</div>
                    <img id="snapshot" src="/latest_image" alt="Latest Frame">
                    <div class="status">Single frame (refreshed every 3s)</div>
                </div>
                <div style="margin-top:20px; padding:15px; background:#333; border-radius:5px;">
                    <h3>🔧 System Status</h3>
                    <div id="status">Checking...</div>
                </div>
            </div>
            <script>
                // Refresh snapshot every 3 seconds
                setInterval(() => {
                    document.getElementById('snapshot').src = '/latest_image?' + Date.now();
                }, 3000);
                
                // Check system status
                function updateStatus() {
                    const hasFrames = """ + str(latest_frame is not None).lower() + """;
                    const queueSize = """ + str(frame_buffer.qsize()) + """;
                    document.getElementById('status').innerHTML = 
                        `FFmpeg Connected: ${hasFrames ? '✅' : '❌'}<br>` +
                        `Frame Buffer: ${queueSize} frames<br>` +
                        `Last Update: ${new Date().toLocaleTimeString()}`;
                }
                
                updateStatus();
                setInterval(updateStatus, 2000);
            </script>
        </body>
        </html>
        """
        self.wfile.write(html.encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def log_message(self, format, *args):
        # Only log important messages
        message = format % args
        if any(keyword in message.lower() for keyword in ['error', 'exception', 'failed']):
            print(f"🚨 {message}")

def main():
    print("🚀 Starting Enhanced MJPEG Server with FFmpeg Integration...")
    print("📡 FFmpeg endpoint: http://localhost:8090/feed1")
    print("🎥 Live stream: http://localhost:8090/live_feed")
    print("🔍 Detection stream: http://localhost:8090/detection_feed")
    print("📸 Latest frame: http://localhost:8090/latest_image")
    print("🌐 Test page: http://localhost:8090/")
    print("=" * 60)
    print("🔧 Start FFmpeg with: run_stream.bat")
    print("🤖 Start AI detection for fallback images")
    print("=" * 60)
    
    try:
        server = ThreadedHTTPServer(('localhost', 8090), MJPEGStreamHandler)
        print("✅ Server started successfully on port 8090")
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")

if __name__ == "__main__":
    main()