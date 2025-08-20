// Add this to your server.js or create a new route
app.get('/latest-image', (req, res) => {
    const fs = require('fs');
    const path = require('path');
    
    const eventsDir = path.join(__dirname, 'events');
    
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
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.sendFile(latestFile);
        } else {
            res.status(404).send('No images found');
        }
    } catch (error) {
        res.status(500).send('Error reading files');
    }
});