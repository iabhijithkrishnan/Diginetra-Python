import React, { useState } from 'react';
import { Plus, Edit2, Trash2, RefreshCcw, Settings, Search } from 'lucide-react';

const DeviceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'device' | 'group'>('device');
  const [selectedDevice, setSelectedDevice] = useState<string>('encoding');

  const devices = [
    { id: 'encoding', name: 'Encoding Device', count: 0 },
    { id: 'decoding', name: 'Decoding Device', count: 0 },
    { id: 'cloud', name: 'Cloud Device', count: 0 },
    { id: 'access', name: 'Access Control Device', count: 0 },
    { id: 'keyboard', name: 'Network Keyboard', count: 0 }
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-gray-800">
        <button
          className={`px-6 py-3 text-sm font-medium ${
            activeTab === 'device' 
              ? 'bg-red-600 text-white' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
          onClick={() => setActiveTab('device')}
        >
          Device
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium ${
            activeTab === 'group' 
              ? 'bg-red-600 text-white' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
          onClick={() => setActiveTab('group')}
        >
          Group
        </button>
      </div>
      
      <div className="flex flex-1">
        <div className="w-64 bg-gray-900 border-r border-gray-800">
          {devices.map(device => (
            <button
              key={device.id}
              className={`w-full flex items-center px-4 py-3 text-sm ${
                selectedDevice === device.id
                  ? 'bg-gray-800 text-gray-200'
                  : 'text-gray-400 hover:bg-gray-800'
              }`}
              onClick={() => setSelectedDevice(device.id)}
            >
              <span className="flex-1">{device.name}</span>
              <span className="text-gray-500">({device.count})</span>
            </button>
          ))}
        </div>
        
        <div className="flex-1 flex flex-col">
          <div className="p-4 bg-gray-900 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1.5 bg-gray-800 rounded text-sm text-gray-300 flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </button>
                <button className="px-3 py-1.5 bg-gray-800 rounded text-sm text-gray-300 flex items-center">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </button>
                <button className="px-3 py-1.5 bg-gray-800 rounded text-sm text-gray-300 flex items-center">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
                <button className="px-3 py-1.5 bg-gray-800 rounded text-sm text-gray-300 flex items-center">
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Time Sync
                </button>
                <button className="px-3 py-1.5 bg-gray-800 rounded text-sm text-gray-300">
                  Status
                </button>
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter Keywords"
                  className="w-64 bg-gray-800 border border-gray-700 rounded pl-10 pr-4 py-1.5 text-sm text-gray-300"
                />
                <Search className="absolute left-3 top-2 h-4 w-4 text-gray-500" />
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">
                    <input type="checkbox" className="form-checkbox text-red-600" />
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">Name</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">IP Address</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">Status</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">Model</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">Device Configuration</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">Version Info</th>
                </tr>
              </thead>
              <tbody className="bg-gray-950">
                {/* Add device rows here */}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceManagement;