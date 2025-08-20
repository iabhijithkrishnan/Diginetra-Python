import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import VideoControls from '../components/VideoControls';

const cameraFeeds = [
  {
    id: '1',
    name: 'Front Door',
    status: 'online',
    streamUrl: 'http://localhost:5000/latest-image', // Use Node.js route
  },
];

const LiveView: React.FC = () => {
  const [layout, setLayout] = useState<'1x1' | '2x2' | '3x3' | '4x4'>('2x2');
  const [selectedCamera, setSelectedCamera] = useState<string | undefined>('1');
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(50);
  const [refreshKey, setRefreshKey] = useState(0);

  // Force refresh every 1 second for immediate live feed
  React.useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const selectedFeed = cameraFeeds.find(c => c.id === selectedCamera);

  return (
    <div className="flex h-full">
      <Sidebar title="Live View">
        <div className="p-4">
          <div className="mb-4">
            <h3 className="text-gray-400 mb-2 text-sm">Camera Groups</h3>
            <div className="space-y-1">
              <div className="px-3 py-2 bg-gray-800 rounded text-gray-300 text-sm flex justify-between items-center">
                <span>All Cameras</span>
                <span className="text-gray-500 text-xs">{cameraFeeds.length}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-gray-400 mb-2 text-sm">Cameras</h3>
            <div className="space-y-1">
              {cameraFeeds.map(camera => (
                <div
                  key={camera.id}
                  className={`px-3 py-2 rounded text-sm flex justify-between items-center cursor-pointer ${
                    selectedCamera === camera.id
                      ? 'bg-gray-800 text-gray-200'
                      : 'text-gray-400 hover:bg-gray-800'
                  }`}
                  onClick={() => setSelectedCamera(camera.id)}
                >
                  <span>{camera.name}</span>
                  <span className={`text-xs ${camera.status === 'online' ? 'text-green-500' : 'text-red-500'}`}>
                    {camera.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Sidebar>

      <div className="flex-1 flex flex-col">
        <div className="flex-1 bg-black flex items-center justify-center">
          {selectedFeed ? (
            <div className="relative w-full h-full">
              <img
                key={refreshKey}
                src={`http://localhost:5000/live-feed?t=${Date.now()}`}
                alt={selectedFeed.name}
                className="w-full h-full object-cover"
                style={{ display: 'block' }}
                onError={() => console.log('Image load error')}
                onLoad={() => console.log('Image loaded at', new Date().toLocaleTimeString())}
              />
              <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                {selectedFeed.name} - LIVE - {new Date().toLocaleTimeString()}
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Select a camera to view live stream.</p>
          )}
        </div>

        <VideoControls
          playing={isPlaying}
          volume={volume}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          onVolumeChange={setVolume}
          onLayoutChange={(newLayout) => {
            if (newLayout === '2x2') setLayout('2x2');
            if (newLayout === '3x3') setLayout('3x3');
          }}
        />
      </div>
    </div>
  );
};

export default LiveView;