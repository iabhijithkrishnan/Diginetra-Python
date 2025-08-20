// UPDATED: server.js with detection metadata support
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

dotenv.config();

const eventRoutes = require('./routes/events');
const streamRoutes = require('./routes/stream');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is running. Visit /api/stream for live feed or /api/events.');
});

console.log("Serving images from:", path.resolve(__dirname, process.env.EVENTS_DIR || 'events'));
app.use('/events', express.static(path.resolve(__dirname, process.env.EVENTS_DIR || 'events')));

app.get('/live-feed', (req, res) => {
    const eventsDir = path.resolve(__dirname, process.env.EVENTS_DIR || 'events');
    try {
        const files = fs.readdirSync(eventsDir)
            .filter(file => file.startsWith('det_') && file.endsWith('.jpg'))
            .map(file => ({
                name: file,
                time: fs.statSync(path.join(eventsDir, file)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time);

        if (files.length > 0) {
            const latestFile = path.join(eventsDir, files[0].name);
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.sendFile(path.resolve(latestFile));
        } else {
            res.status(404).json({ error: 'No detection images found' });
        }
    } catch (error) {
        console.error('Live feed error:', error);
        res.status(500).json({ error: 'Error reading detection images: ' + error.message });
    }
});

// NEW: API endpoint for detection data
app.get('/api/detections', (req, res) => {
    const eventsDir = path.resolve(__dirname, process.env.EVENTS_DIR || 'events');
    try {
        const detections = [];
        
        if (!fs.existsSync(eventsDir)) {
            return res.json([]);
        }
        
        const metadataFiles = fs.readdirSync(eventsDir)
            .filter(file => file.endsWith('_metadata.json'))
            .sort((a, b) => {
                const timeA = fs.statSync(path.join(eventsDir, a)).mtime.getTime();
                const timeB = fs.statSync(path.join(eventsDir, b)).mtime.getTime();
                return timeB - timeA; // Most recent first
            });
        
        for (const file of metadataFiles) {
            try {
                const metadataPath = path.join(eventsDir, file);
                const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
                
                // Add formatted timestamp and other useful fields
                metadata.formattedTimestamp = new Date(metadata.timestamp * 1000).toISOString();
                metadata.url = `/events/${metadata.filename}`;
                
                detections.push(metadata);
            } catch (parseError) {
                console.error(`Error parsing metadata file ${file}:`, parseError);
            }
        }
        
        res.json(detections);
    } catch (error) {
        console.error('Detections API error:', error);
        res.status(500).json({ error: 'Error reading detection metadata: ' + error.message });
    }
});

// NEW: API endpoint for detection statistics
app.get('/api/detection-stats', (req, res) => {
    const eventsDir = path.resolve(__dirname, process.env.EVENTS_DIR || 'events');
    try {
        const stats = {
            totalDetections: 0,
            totalHuman: 0,
            totalVehicle: 0,
            totalAnimal: 0,
            todayDetections: 0,
            monthDetections: 0,
            lastUpdated: new Date().toISOString()
        };
        
        if (!fs.existsSync(eventsDir)) {
            return res.json(stats);
        }
        
        const metadataFiles = fs.readdirSync(eventsDir)
            .filter(file => file.endsWith('_metadata.json'));
        
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        
        for (const file of metadataFiles) {
            try {
                const metadataPath = path.join(eventsDir, file);
                const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
                const detectionDate = new Date(metadata.timestamp * 1000);
                
                stats.totalDetections++;
                
                // Count by detection type
                for (const detection of metadata.detections) {
                    switch (detection.type) {
                        case 'Human':
                            stats.totalHuman++;
                            break;
                        case 'Vehicle':
                            stats.totalVehicle++;
                            break;
                        case 'Animal':
                            stats.totalAnimal++;
                            break;
                    }
                }
                
                // Count by time period
                if (detectionDate >= todayStart) {
                    stats.todayDetections++;
                }
                if (detectionDate >= monthStart) {
                    stats.monthDetections++;
                }
                
            } catch (parseError) {
                console.error(`Error parsing metadata file ${file}:`, parseError);
            }
        }
        
        res.json(stats);
    } catch (error) {
        console.error('Detection stats error:', error);
        res.status(500).json({ error: 'Error calculating detection stats: ' + error.message });
    }
});

app.get('/api/health', (req, res) => {
    const eventsDir = path.resolve(__dirname, process.env.EVENTS_DIR || 'events');
    
    // Count detection files
    let detectionCount = 0;
    let metadataCount = 0;
    
    if (fs.existsSync(eventsDir)) {
        const files = fs.readdirSync(eventsDir);
        detectionCount = files.filter(f => f.startsWith('det_') && f.endsWith('.jpg')).length;
        metadataCount = files.filter(f => f.endsWith('_metadata.json')).length;
    }
    
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        eventsPath: eventsDir,
        eventsExists: fs.existsSync(eventsDir),
        detectionImages: detectionCount,
        metadataFiles: metadataCount,
        services: {
            nodeServer: 'running',
            mjpegServer: 'check http://localhost:8090',
            aiDetection: 'check process logs'
        }
    });
});

app.use('/api/events', eventRoutes);
app.use('/api/stream', streamRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Live feed available at http://localhost:${PORT}/live-feed`);
    console.log(`Events API available at http://localhost:${PORT}/api/events`);
    console.log(`Detections API available at http://localhost:${PORT}/api/detections`);
    console.log(`Detection stats at http://localhost:${PORT}/api/detection-stats`);
    console.log(`Health check at http://localhost:${PORT}/api/health`);
    startContinuousDetection(); // start AI detection here
});

// Auto-start detection loop
function startContinuousDetection() {
  console.log('Starting continuous AI detection service...');
  const scriptPath = path.resolve(__dirname, process.env.PYTHON_SCRIPT);
  const rtspUrl = process.env.RTSP_URL;

  function run() {
    const process = spawn('python', [scriptPath, rtspUrl]);

    process.stdout.on('data', (data) => {
      console.log(`[AI] ${data.toString().trim()}`);
    });

    process.stderr.on('data', (data) => {
      console.error(`[AI Error] ${data.toString().trim()}`);
    });

    process.on('close', (code) => {
      console.log(`AI script exited with code ${code}. Restarting in 3 seconds...`);
      setTimeout(run, 3000); // restart loop
    });

    process.on('error', (err) => {
      console.error(`Failed to start AI process: ${err.message}`);
      setTimeout(run, 5000); // retry after 5 seconds
    });
  }

  run();
}