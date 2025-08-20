import React from 'react';
import { User, HelpCircle, MinusIcon, SquareIcon, XIcon } from 'lucide-react';

interface TopNavigationProps {
  username?: string;
  currentTab: string;
  tabs: { id: string; label: string }[];
  onTabChange: (tabId: string) => void;
}

const TopNavigation: React.FC<TopNavigationProps> = ({ 
  username = 'admin', 
  currentTab,
  tabs,
  onTabChange
}) => {
  return (
    <div className="bg-gray-900 border-b border-gray-800 flex flex-col">
      {/* Title Bar */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center">
          <div className="h-6 w-6 rounded-full bg-gray-700 flex items-center justify-center mr-2">
            <div className="h-4 w-4 rounded-full bg-red-500"></div>
          </div>
          <span className="text-gray-200 font-medium">iVMS810</span>
        </div>
        <div className="flex items-center">
          <span className="text-gray-400 text-sm mr-4">{username}</span>
          <User className="h-4 w-4 text-gray-400 mr-4" />
          <HelpCircle className="h-4 w-4 text-gray-400 mr-4" />
          <MinusIcon className="h-4 w-4 text-gray-400 mr-2" />
          <SquareIcon className="h-4 w-4 text-gray-400 mr-2" />
          <XIcon className="h-4 w-4 text-gray-400" />
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              currentTab === tab.id
                ? "text-red-500 border-b-2 border-red-500"
                : "text-gray-400 hover:text-gray-200"
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TopNavigation;