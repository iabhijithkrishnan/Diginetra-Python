const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// ✅ Run the Python detection script
exports.runDetection = (req, res) => {
  const scriptPath = path.resolve(__dirname, '../../ai-engine/run_detection.py');

  exec(`python "${scriptPath}"`, (err, stdout, stderr) => {
    if (err) {
      console.error("❌ Python Error:", stderr);
      return res.status(500).json({ success: false, error: stderr });
    }
    return res.json({ success: true, message: stdout });
  });
};

// ✅ Serve images from ai-engine/events (not just events/)
exports.getEvents = (req, res) => {
  const eventsDir = path.resolve(__dirname, '../../ai-engine/events');

  fs.readdir(eventsDir, (err, files) => {
    if (err) {
      console.error("❌ Failed to read events folder:", err);
      return res.status(500).json([]);
    }

    const data = files
      .filter(f => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg') || f.toLowerCase().endsWith('.png'))
      .map(f => ({
        filename: f,
        url: `/events/${f}` // this matches your static path in server.js
      }));

    res.json(data);
  });
};
