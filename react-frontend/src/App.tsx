import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Eye, 
  Play, 
  AlertTriangle, 
  Map, 
  ChevronLeft, 
  ChevronRight,
  Shield
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import LiveView from './pages/LiveView';
import Gallery from './components/Gallery';

// Navigation Sidebar Component
const NavigationSidebar: React.FC<{ 
  currentTab: string; 
  onTabChange: (tabId: string) => void; 
}> = ({ currentTab, onTabChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'live-view', label: 'Live View', icon: Eye },
    { id: 'playback', label: 'Playback', icon: Play },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'e-map', label: 'E-Map', icon: Map }
  ];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleMenuClick = (itemId: string) => {
    onTabChange(itemId);
  };

  return (
    <div className={`bg-gray-900 border-r border-gray-800 transition-all duration-300 flex flex-col ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Digi-netra</h1>
              <p className="text-xs text-gray-400">AI Monitoring System</p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="flex items-center justify-center w-full">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleMenuClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white border-r-2 border-blue-400'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  } ${isCollapsed ? 'justify-center px-2' : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <item.icon className={`${isActive ? 'text-white' : 'text-gray-400'} ${
                    isCollapsed ? 'w-6 h-6' : 'w-5 h-5'
                  }`} />
                  {!isCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                  {isActive && !isCollapsed && (
                    <div className="w-2 h-2 bg-blue-300 rounded-full ml-auto animate-pulse"></div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile Section - Only show on Dashboard and Alerts */}
      {(currentTab === 'dashboard' || currentTab === 'alerts') && (
        <>
          {!isCollapsed && (
            <div className="p-4 border-t border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-300">A</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Admin User</p>
                  <p className="text-xs text-gray-400">System Administrator</p>
                </div>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="p-4 border-t border-gray-800 flex justify-center">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-gray-300">A</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Collapse Toggle - Show on ALL pages - Fixed position */}
      <div className={`p-2 ${(currentTab === 'dashboard' || currentTab === 'alerts') ? '' : 'border-t'} border-gray-800 mt-auto`}>
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors duration-200"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>
    </div>
  );
};

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

const EMap: React.FC = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-200 mb-4">E-Map</h2>
      <p className="text-gray-400">Interactive map view coming soon...</p>
    </div>
  </div>
);

function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');

  const handleTabChange = (tabId: string) => {
    setCurrentTab(tabId);
  };

  const handleNavigate = (route: string) => {
    setCurrentTab(route);
  };

  const renderPage = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'live-view':
        return <LiveView />;
      case 'playback':
        return <Playback />;
      case 'gallery':
        return <Gallery />;
      case 'alerts':
        return <Gallery />;
      case 'e-map':
        return <EMap />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 flex">
      {/* Navigation Sidebar */}
      <NavigationSidebar 
        currentTab={currentTab}
        onTabChange={handleTabChange}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-hidden">
          {renderPage()}
        </div>
        
        {/* Footer */}
        <footer className="bg-gray-900 border-t border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-gray-400 text-sm">
              Location: Pench Tiger Reserve
            </div>
            <div className="text-gray-400 text-sm">
              <a 
                href="https://strofes.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors duration-200"
              >
                Developed by Strofes Technologies
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;