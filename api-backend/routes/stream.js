const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const { PassThrough } = require('stream');

const router = express.Router();
ffmpeg.setFfmpegPath(ffmpegPath);

const rtspUrl = 'rtsp://admin:abcd1234@192.168.1.99:554/h264/ch1/main/av_stream';

router.get('/', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'multipart/x-mixed-replace; boundary=frame',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Pragma': 'no-cache',
  });

  const stream = new PassThrough();

  const ffmpegProcess = ffmpeg(rtspUrl)
    .addInputOption('-rtsp_transport', 'tcp')
    .inputFormat('rtsp')
    .outputFormat('mjpeg')
    .size('640x480')
    .outputOptions('-q:v 5')
    .on('start', () => {
      console.log('📹 FFmpeg stream started');
    })
    .on('error', (err) => {
      console.error('❌ FFmpeg error:', err.message);
      stream.end();
      res.end();
    })
    .pipe(stream);

  stream.on('data', (chunk) => {
    res.write(`--frame\r\n`);
    res.write('Content-Type: image/jpeg\r\n');
    res.write(`Content-Length: ${chunk.length}\r\n\r\n`);
    res.write(chunk);
    res.write('\r\n');
  });

  req.on('close', () => {
    console.log('⛔ Client disconnected, closing stream');
    stream.end();
    ffmpegProcess.kill('SIGKILL');
  });
});

module.exports = router;
