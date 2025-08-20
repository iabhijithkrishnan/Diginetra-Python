import React, { useState } from 'react';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import LiveView from './pages/LiveView';
import Gallery from './components/Gallery';

// Create placeholder components for missing ones
const Playback: React.FC = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-200 mb-4">Playback</h2>
      <p className="text-gray-400">Video playback functionality coming soon...</p>
    </div>
  </div>
);

const Alerts: React.FC = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-200 mb-4">Alerts</h2>
      <p className="text-gray-400">Alert management system coming soon...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('dashboard');

  const handleTabChange = (tabId: string) => {
    setCurrentTab(tabId);
  };

  const handleNavigate = (route: string) => {
    setCurrentTab(route);
  };

  const renderCurrentView = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'live':
        return <LiveView />;
      case 'gallery':
        return <Gallery />;
      case 'playback':
        return <Playback />;
      case 'alerts':
        return <Alerts />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <DashboardLayout currentTab={currentTab} onTabChange={handleTabChange}>
      {renderCurrentView()}
    </DashboardLayout>
  );
};

export default App;