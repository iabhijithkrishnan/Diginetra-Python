import React from 'react';
import { Search } from 'lucide-react';

interface SidebarProps {
  children: React.ReactNode;
  title?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ children, title }) => {
  return (
    <div className="h-full w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      {title && (
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-gray-200 font-medium">{title}</h2>
        </div>
      )}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Enter Keywords"
            className="w-full bg-gray-800 border border-gray-700 rounded pl-10 pr-4 py-2 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-red-500 placeholder-gray-600"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

export default Sidebar;