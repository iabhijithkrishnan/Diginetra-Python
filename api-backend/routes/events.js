const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config(); // Load .env variables

// Absolute path to run_detection.py
const scriptPath = path.resolve(__dirname, '..', process.env.PYTHON_SCRIPT);

// RTSP stream URL
const rtspUrl = process.env.RTSP_URL;

// 📸 GET /api/events - Get all detection images for Gallery
router.get('/', (req, res) => {
  try {
    const eventsDir = path.resolve(__dirname, '..', process.env.EVENTS_DIR || 'events');
    
    // Check if events directory exists
    if (!fs.existsSync(eventsDir)) {
      console.log('Events directory not found:', eventsDir);
      return res.json([]);
    }

    // Read all files from events directory
    const files = fs.readdirSync(eventsDir);
    
    // Filter only image files and sort by modification time (newest first)
    const imageFiles = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext) &&
         file.startsWith('det_')
      })
      .map(file => {
        const filePath = path.join(eventsDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          url: `/events/${file}`,
          timestamp: stats.mtime,
          size: stats.size
        };
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // newest first

    console.log(`📸 Found ${imageFiles.length} images in events folder`);
    res.json(imageFiles);
    
  } catch (error) {
    console.error('Error reading events directory:', error);
    res.status(500).json({ error: 'Failed to read events directory: ' + error.message });
  }
});

// 📸 GET /api/events/:filename - Get specific image info
router.get('/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const eventsDir = path.resolve(__dirname, '..', process.env.EVENTS_DIR || 'events');
    const filePath = path.join(eventsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    const stats = fs.statSync(filePath);
    res.json({
      filename: filename,
      url: `/events/${filename}`,
      timestamp: stats.mtime,
      size: stats.size
    });
    
  } catch (error) {
    console.error('Error getting image info:', error);
    res.status(500).json({ error: 'Failed to get image info: ' + error.message });
  }
});

// 🎯 POST /api/events/detect — triggers Python detection
router.post('/detect', (req, res) => {
  console.log('⚡ Triggering detection script...');

  const python = spawn('python', [scriptPath, rtspUrl]);

  // Collect stdout data
  python.stdout.on('data', (data) => {
    console.log(`🐍 Python Output: ${data.toString().trim()}`);
  });

  // Collect stderr data
  python.stderr.on('data', (data) => {
    console.error(`🐍 Python Error: ${data.toString().trim()}`);
  });

  // Handle script completion
  python.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Detection completed successfully');
      res.json({ message: 'Detection finished successfully' });
    } else {
      console.error(`❌ Detection exited with code ${code}`);
      res.status(500).json({ error: 'Detection failed', exitCode: code });
    }
  });
});

module.exports = router;