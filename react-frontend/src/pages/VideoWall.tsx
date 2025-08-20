import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import VideoGrid from '../components/VideoGrid';
import VideoControls from '../components/VideoControls';
import Calendar from '../components/Calendar';
import { CameraFeed } from '../types';

const dummyCameraFeeds: CameraFeed[] = [
  { id: '1', name: 'Front Door', status: 'online' },
  { id: '2', name: 'Back Yard', status: 'online' },
  { id: '3', name: 'Garage', status: 'offline' },
  { id: '4', name: 'Living Room', status: 'online' },
];

// Dates with recordings
const datesWithRecordings = [
  '2025-06-01', '2025-06-02', '2025-06-05', '2025-06-07',
  '2025-06-12', '2025-06-15', '2025-06-20', '2025-06-25'
];

const Playback: React.FC = () => {
  const [layout, setLayout] = useState<'1x1' | '2x2' | '3x3' | '4x4'>('2x2');
  const [selectedCamera, setSelectedCamera] = useState<string | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [playbackMode, setPlaybackMode] = useState<'device' | 'local'>('device');

  return (
    <div className="flex h-full">
      <Sidebar>
        <div>
          <div className="flex mb-4">
            <button
              className={`flex-1 py-2 text-sm font-medium ${
                playbackMode === 'device' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
              onClick={() => setPlaybackMode('device')}
            >
              Device
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium ${
                playbackMode === 'local' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
              onClick={() => setPlaybackMode('local')}
            >
              Local
            </button>
          </div>
          
          <div className="px-4 py-2 bg-gray-800 text-gray-300 text-sm mb-4">
            Normal Recording Playback
          </div>
          
          <Calendar 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            markedDates={datesWithRecordings}
          />
        </div>
      </Sidebar>
      
      <div className="flex-1 flex flex-col">
        <div className="flex-1 bg-black">
          <VideoGrid 
            feeds={dummyCameraFeeds}
            layout={layout}
            highlightedFeed={selectedCamera}
            onFeedClick={setSelectedCamera}
          />
        </div>
        
        <div className="border-t border-gray-800 p-2 bg-gray-900 flex items-center justify-between">
          <div className="flex items-center text-gray-400 text-sm">
            <span className="mr-2">Device</span>
            <div className="text-xs px-2 py-1 bg-gray-800 rounded">2025/06/05</div>
          </div>
          
          <div className="flex">
            {['00:00', '01:30', '03:30', '05:30', '07:30', '09:30', '11:30', '13:30', '15:30', '17:30', '19:30', '21:30', '23:30'].map((time, index) => (
              <div 
                key={index}
                className={`text-xs px-2 py-1 ${index === 0 ? 'bg-red-600 text-white' : 'text-gray-500 hover:bg-gray-800'}`}
              >
                {time}
              </div>
            ))}
          </div>
        </div>
        
        <VideoControls 
          playing={isPlaying}
          volume={volume}
          showTimeline={true}
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

export default Playback;