const express = require('express');
const http = require('http');
const app = express();

const clients = [];

app.get('/feed1', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'multipart/x-mixed-replace; boundary=frame',
    'Connection': 'close',
    'Expires': 'Fri, 01 Jan 1990 00:00:00 GMT',
    'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
    'Pragma': 'no-cache',
  });

  clients.push(res);
  req.on('close', () => {
    const index = clients.indexOf(res);
    if (index !== -1) clients.splice(index, 1);
  });
});

const server = http.createServer(app);
server.listen(8090, () => {
  console.log('📡 MJPEG server running at http://localhost:8090/feed1');
});

// Accept image stream from FFmpeg
process.stdin.on('data', (chunk) => {
  clients.forEach((res) => {
    res.write(`--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${chunk.length}\r\n\r\n`);
    res.write(chunk);
    res.write('\r\n');
  });
});
