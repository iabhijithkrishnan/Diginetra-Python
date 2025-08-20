import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import VideoGrid from '../components/VideoGrid';
import { Camera, Grid, Settings } from 'lucide-react';
import { CameraFeed } from '../types';


const FaceRecognition: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'realtime' | 'library' | 'monitoring' | 'alarm' | 'passthru' | 'search'>('realtime');
  const [layout, setLayout] = useState<'1x1' | '2x2' | '3x3' | '4x4'>('1x1');
  
  const dummyFeeds: CameraFeed[] = [
  { id: '1', name: 'Front Door', status: 'online' },
  { id: '2', name: 'Back Yard', status: 'online' },
  { id: '3', name: 'Garage', status: 'offline' },
  { id: '4', name: 'Living Room', status: 'online' },
];

  const tabs: { id: 'realtime' | 'library' | 'monitoring' | 'alarm' | 'passthru' | 'search'; label: string; color?: string }[] = [
  { id: 'realtime', label: 'Realtime Monitoring', color: 'red' },
  { id: 'library', label: 'Face Library Management' },
  { id: 'monitoring', label: 'Monitoring Task' },
  { id: 'alarm', label: 'Alarm Records' },
  { id: 'passthru', label: 'Pass-Thru Records' },
  { id: 'search', label: 'Search By Image' },
];

  return (
    <div className="flex h-full">
      <Sidebar title="Video Channel">
        <div className="p-4">
          <div className="space-y-1">
            <div className="px-3 py-2 bg-gray-800 rounded text-gray-300 text-sm">
              Camera 1
            </div>
            <div className="px-3 py-2 rounded text-gray-400 text-sm hover:bg-gray-800">
              Camera 2
            </div>
          </div>
        </div>
      </Sidebar>
      
      <div className="flex-1 flex flex-col">
        <div className="flex border-b border-gray-800">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === tab.id
                  ? tab.color === 'red' 
                    ? 'bg-red-600 text-white'
                    : 'text-gray-200'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="flex-1 bg-black">
          <VideoGrid 
            feeds={dummyFeeds}
            layout={layout}
          />
        </div>
        
        <div className="bg-gray-900 border-t border-gray-800">
          <div className="p-2 flex items-center justify-between">
            <div className="flex space-x-2">
              <button className="p-1.5 rounded hover:bg-gray-800 text-gray-400">
                <Grid className="h-5 w-5" onClick={() => setLayout('1x1')} />
              </button>
              <button className="p-1.5 rounded hover:bg-gray-800 text-gray-400">
                <Camera className="h-5 w-5" />
              </button>
              <button className="p-1.5 rounded hover:bg-gray-800 text-gray-400">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="border-t border-gray-800 p-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Snapshots</span>
              <button className="text-red-500 text-sm hover:text-red-400">
                More &gt;
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="w-64 bg-gray-900 border-l border-gray-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-400">Comparison Result</span>
          <div className="flex space-x-2">
            <button className="p-1 bg-gray-800 rounded">
              <Camera className="h-4 w-4 text-red-500" />
            </button>
            <button className="p-1 bg-gray-800 rounded">
              <Camera className="h-4 w-4 text-red-500" />
            </button>
          </div>
        </div>
        
        <select className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-300 mb-4">
          <option>All Cameras</option>
        </select>
      </div>
    </div>
  );
};

export default FaceRecognition;