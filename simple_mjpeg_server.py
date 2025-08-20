#!/usr/bin/env python3
import os
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

class SimpleHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/live_feed':
            self.serve_detection_stream()
        elif self.path == '/':
            self.serve_test_page()
        else:
            self.send_response(404)
            self.end_headers()

    def serve_detection_stream(self):
        """Serve detection images as MJPEG stream"""
        try:
            self.send_response(200)
            self.send_header('Content-Type', 'multipart/x-mixed-replace; boundary=frame')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Access-Control-Allow-Origin', '*')
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
                                self.wfile.write(b'Content-Type: image/jpeg\r\n')
                                self.wfile.write(f'Content-Length: {len(frame_data)}\r\n\r\n'.encode())
                                self.wfile.write(frame_data)
                                
                                last_file = latest_file
                                print(f"Streamed: {os.path.basename(latest_file)}")
                    
                    time.sleep(0.5)  # Check for new images every 500ms
                
                except Exception as e:
                    print(f"Stream error: {e}")
                    break

        except Exception as e:
            print(f"MJPEG error: {e}")

    def serve_test_page(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()
        html = """
        <html>
        <head><title>Live Feed Test</title></head>
        <body style="background:#000; color:#fff; text-align:center; font-family:Arial;">
            <h1>Live Camera Feed</h1>
            <img src="/live_feed" style="max-width:90%; border:2px solid #333;">
            <p>AI Detection Stream</p>
        </body>
        </html>
        """
        self.wfile.write(html.encode())

    def log_message(self, format, *args):
        pass  # Suppress logs

def main():
    print("Starting Simple MJPEG Server...")
    print("Live stream: http://localhost:8090/live_feed")
    print("Test page: http://localhost:8090/")
    
    try:
        server = ThreadedHTTPServer(('localhost', 8090), SimpleHandler)
        print("Server running on port 8090")
        server.serve_forever()
    except KeyboardInterrupt:
        print("Server stopped")

if __name__ == "__main__":
    main()