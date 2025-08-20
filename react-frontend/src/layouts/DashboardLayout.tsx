// src/layouts/DashboardLayout.tsx
import React from 'react';
import TopNavigation from '../components/TopNavigation';
import Sidebar from '../components/Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentTab: string;
  onTabChange: (tabId: string) => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, currentTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'live', label: 'Live View' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'playback', label: 'Playback' },
    { id: 'alerts', label: 'Alerts' }
  ];

  return (
    <div className="h-screen flex flex-col">
      <TopNavigation currentTab={currentTab} onTabChange={onTabChange} tabs={tabs} />

      <div className="flex flex-1 overflow-hidden">
        {/* Only show sidebar for non-dashboard tabs */}
        {currentTab !== 'dashboard' && (
          <Sidebar title="Camera Search">
            <></> {/* Empty children to satisfy prop requirement */}
          </Sidebar>
        )}

        <div className={`flex-1 overflow-y-auto ${currentTab === 'dashboard' ? 'bg-gray-950' : 'bg-black'} text-white`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;