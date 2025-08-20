import React, { useState } from 'react';
import { Bell, CheckCircle2, Volume2 } from 'lucide-react';

interface AlarmLevel {
  level: number;
  color: string;
}

const AlarmRecords: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'latest' | 'history'>('latest');
  const [selectedLevels, setSelectedLevels] = useState<number[]>([1, 2, 3, 4, 5]);

  const alarmLevels: AlarmLevel[] = [
    { level: 1, color: 'bg-red-500' },
    { level: 2, color: 'bg-orange-500' },
    { level: 3, color: 'bg-yellow-500' },
    { level: 4, color: 'bg-blue-500' },
    { level: 5, color: 'bg-green-500' }
  ];

  const toggleLevel = (level: number) => {
    if (selectedLevels.includes(level)) {
      setSelectedLevels(selectedLevels.filter(l => l !== level));
    } else {
      setSelectedLevels([...selectedLevels, level]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-gray-800">
        <button
          className={`px-6 py-3 text-sm font-medium ${
            activeTab === 'latest' 
              ? 'bg-red-600 text-white' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
          onClick={() => setActiveTab('latest')}
        >
          Latest Alarm
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium ${
            activeTab === 'history' 
              ? 'bg-red-600 text-white' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
          onClick={() => setActiveTab('history')}
        >
          History Alarm
        </button>
      </div>
      
      <div className="p-4 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="text-gray-400 mr-2">Alarm Type</span>
              <select className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-300">
                <option>All</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Alarm Level Filter</span>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedLevels.length === 5}
                  onChange={() => setSelectedLevels(selectedLevels.length === 5 ? [] : [1,2,3,4,5])}
                  className="form-checkbox text-red-600"
                />
                <span className="text-sm text-gray-300">Select All</span>
              </label>
              
              {alarmLevels.map((alarm) => (
                <button
                  key={alarm.level}
                  className={`px-3 py-1 rounded text-sm ${
                    selectedLevels.includes(alarm.level) 
                      ? alarm.color + ' text-white' 
                      : 'bg-gray-800 text-gray-400'
                  }`}
                  onClick={() => toggleLevel(alarm.level)}
                >
                  Level {alarm.level}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button className="flex items-center px-3 py-1.5 bg-gray-800 rounded text-sm text-gray-300">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Acknowledge
            </button>
            <button className="flex items-center px-3 py-1.5 bg-gray-800 rounded text-sm text-gray-300">
              <Volume2 className="h-4 w-4 mr-2" />
              Audio
            </button>
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
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">Alarm Time</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">Alarm Source</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">Alarm Type</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">Alarm Level</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">Preview</th>
            </tr>
          </thead>
          <tbody className="bg-gray-950">
            {/* Add alarm records here */}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AlarmRecords;