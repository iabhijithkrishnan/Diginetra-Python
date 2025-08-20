import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { Folder } from 'lucide-react';
import VideoGrid from '../components/VideoGrid';
import { CameraFeed } from '../types';


const PeopleCounting: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'realtime' | 'report'>('realtime');
  
  const dummyFeeds: CameraFeed[] = [
    { id: '1', name: 'Entrance A', status: 'online' },
    { id: '2', name: 'Exit B', status: 'online' },
    { id: '3', name: 'Main Hall', status: 'online' },
    { id: '4', name: 'Side Door', status: 'online' },
  ];

  return (
    <div className="flex h-full">
      <Sidebar title="People Counting">
        <div className="p-4">
          <div className="space-y-2">
            <div className="flex items-center text-gray-400 hover:text-gray-300 cursor-pointer">
              <Folder className="h-4 w-4 mr-2" />
              <span>People Flow Counting</span>
            </div>
            <div className="flex items-center text-gray-400 hover:text-gray-300 cursor-pointer">
              <Folder className="h-4 w-4 mr-2" />
              <span>People Density Monitoring</span>
            </div>
          </div>
        </div>
      </Sidebar>
      
      <div className="flex-1 flex flex-col">
        <div className="flex border-b border-gray-800">
          <button
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'realtime' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
            onClick={() => setActiveTab('realtime')}
          >
            Realtime Statistics
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'report' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
            onClick={() => setActiveTab('report')}
          >
            Report Statistics
          </button>
        </div>
        
        <div className="flex-1 bg-black">
          <VideoGrid 
            feeds={dummyFeeds}
            layout="2x2"
          />
        </div>
      </div>
    </div>
  );
};

export default PeopleCounting;