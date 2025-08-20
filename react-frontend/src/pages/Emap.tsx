import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { Pencil, Trash2, Image } from 'lucide-react';

const Emap: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'map' | 'edit'>('map');

  return (
    <div className="flex h-full">
      <Sidebar title="Map Resources">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex space-x-2">
              <button className="p-1.5 rounded hover:bg-gray-800 text-gray-400">
                <Pencil className="h-5 w-5" />
              </button>
              <button className="p-1.5 rounded hover:bg-gray-800 text-gray-400">
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
            <button className="flex items-center px-3 py-1.5 bg-gray-800 rounded text-sm text-gray-300">
              <Image className="h-4 w-4 mr-2" />
              Picture Management
            </button>
          </div>
        </div>
      </Sidebar>
      
      <div className="flex-1 flex flex-col">
        <div className="flex border-b border-gray-800">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'map' 
                ? 'text-gray-200' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('map')}
          >
            Map
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'edit' 
                ? 'bg-red-600 text-white' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('edit')}
          >
            Edit Map
          </button>
        </div>
        
        <div className="flex-1 flex items-center justify-center bg-gray-950">
          <button className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors">
            <Image className="h-5 w-5" />
            <span>Add Map</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Emap;