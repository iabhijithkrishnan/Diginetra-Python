import React, { useState, useEffect } from 'react';
import { 
  Camera, Clock, Users, TrendingUp, Zap, Anchor, 
  Eye, Calendar, RefreshCw, Cpu, HardDrive, Monitor
} from 'lucide-react';

interface DetectionData {
  filename: string;
  timestamp: number;
  formattedTimestamp: string;
  camera_id: string;
  url: string;
  detections: Array<{
    type: 'Human' | 'Vehicle' | 'Animal';
    confidence: number;
    bbox: number[];
  }>;
}

interface DetectionStats {
  totalDetections: number;
  totalHuman: number;
  totalVehicle: number;
  totalAnimal: number;
  todayDetections: number;
  monthDetections: number;
  lastUpdated: string;
}

interface DashboardProps {
  onNavigate: (route: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [detections, setDetections] = useState<DetectionData[]>([]);
  const [stats, setStats] = useState<DetectionStats>({
    totalDetections: 0,
    totalHuman: 0,
    totalVehicle: 0,
    totalAnimal: 0,
    todayDetections: 0,
    monthDetections: 0,
    lastUpdated: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Hardware monitoring state
  const [systemStats, setSystemStats] = useState({
    cpu: { usage: 45, temperature: 52 },
    ram: { usage: 68, total: 32, used: 21.8 },
    gpu: { usage: 23, memory: 85, temperature: 45 },
    storage: { usage: 78, total: 1000, used: 780 }
  });

  // Fetch detection statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/detection-stats');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const statsData = await response.json();
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching stats:', err);
      throw err;
    }
  };

  // Fetch recent detections for display
  const fetchDetections = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both stats and recent detections
      await fetchStats();
      
      const response = await fetch('http://localhost:5000/api/detections');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const detectionsData = await response.json();
      setDetections(detectionsData.slice(0, 10)); // Keep only recent 10
      
    } catch (err) {
      console.error('Error fetching detections:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch detection data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDetections();
    
    // Refresh data every 10 seconds
    const interval = setInterval(fetchDetections, 10000);
    return () => clearInterval(interval);
  }, []);

  // Simulate hardware stats updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStats(prev => ({
        cpu: {
          usage: Math.max(10, Math.min(95, prev.cpu.usage + (Math.random() - 0.5) * 10)),
          temperature: Math.max(35, Math.min(85, prev.cpu.temperature + (Math.random() - 0.5) * 3))
        },
        ram: {
          ...prev.ram,
          usage: Math.max(20, Math.min(95, prev.ram.usage + (Math.random() - 0.5) * 8)),
          used: Math.max(6.4, Math.min(30.4, prev.ram.used + (Math.random() - 0.5) * 2.5))
        },
        gpu: {
          usage: Math.max(0, Math.min(100, prev.gpu.usage + (Math.random() - 0.5) * 15)),
          memory: Math.max(10, Math.min(95, prev.gpu.memory + (Math.random() - 0.5) * 5)),
          temperature: Math.max(30, Math.min(80, prev.gpu.temperature + (Math.random() - 0.5) * 4))
        },
        storage: {
          ...prev.storage,
          usage: Math.max(60, Math.min(90, prev.storage.usage + (Math.random() - 0.5) * 2))
        }
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getRecentDetectionsByType = (type: 'Human' | 'Vehicle' | 'Animal') => {
    return detections
      .filter(detection => 
        detection.detections.some(det => det.type === type)
      )
      .slice(0, 3);
  };

  const getProgressBarColor = (usage: number) => {
    if (usage < 50) return 'bg-green-500';
    if (usage < 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusColor = (usage: number) => {
    if (usage < 50) return 'text-green-400';
    if (usage < 75) return 'text-yellow-400';
    return 'text-red-400';
  };

  const ProgressBar = ({ value, label, icon: Icon, details }: {
    value: number;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    details: Array<{ label: string; value: string }>;
  }) => (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-blue-400" />
          <span className="font-medium text-gray-200 text-sm">{label}</span>
        </div>
        <span className={`text-sm font-bold ${getStatusColor(value)}`}>
          {Math.round(value)}%
        </span>
      </div>
      
      <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
        <div 
          className={`h-2 rounded-full transition-all duration-1000 ${getProgressBarColor(value)}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        ></div>
      </div>
      
      {details && (
        <div className="text-xs text-gray-400 space-y-1">
          {details.map((detail, index) => (
            <div key={index} className="flex justify-between">
              <span>{detail.label}</span>
              <span>{detail.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const StatCard = ({ 
    title, 
    count, 
    icon: Icon, 
    color, 
    bgColor, 
    recentDetections, 
    onClick 
  }: {
    title: string;
    count: number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    recentDetections: DetectionData[];
    onClick?: () => void;
  }) => (
    <div 
      className={`${bgColor} border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all duration-300 cursor-pointer transform hover:scale-105`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
          <p className={`text-3xl font-bold ${color} mt-1`}>{count}</p>
        </div>
        <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('-400', '-500/20')}`}>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </div>
      
      {recentDetections.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center text-gray-500 text-xs">
            <Eye className="h-3 w-3 mr-1" />
            Recent Detections
          </div>
          {recentDetections.map((detection) => (
            <div key={detection.filename} className="flex items-center space-x-3 p-2 bg-gray-800/50 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center">
                <span className="text-xs text-gray-400 font-medium">
                  {detection.detections.length}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(detection.timestamp * 1000).toLocaleTimeString()}</span>
                  <Calendar className="h-3 w-3 ml-2" />
                  <span>{new Date(detection.timestamp * 1000).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Camera {detection.camera_id}</p>
                <p className="text-xs text-blue-400 mt-1">
                  {detection.detections.length} object{detection.detections.length !== 1 ? 's' : ''} detected
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {recentDetections.length === 0 && (
        <div className="text-center text-gray-500 text-xs py-2">
          No recent detections
        </div>
      )}
    </div>
  );

  if (loading && detections.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading detection data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="text-red-400 text-4xl mb-4">⚠</div>
          <h2 className="text-xl font-bold text-gray-200 mb-2">Error Loading Data</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchDetections}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gray-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-200 mb-2">Security Dashboard</h1>
            <p className="text-gray-400">Real-time monitoring and detection tracking</p>
            <p className="text-gray-500 text-sm mt-1">
              Last updated: {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleTimeString() : 'Never'} | 
              Total detections: {stats.totalDetections}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono text-gray-300">
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="text-sm text-gray-500">
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Total Detections This Month"
          count={stats.monthDetections}
          icon={TrendingUp}
          color="text-blue-400"
          bgColor="bg-gray-900"
          recentDetections={detections.slice(0, 3)}
          onClick={() => onNavigate('gallery')}
        />
        
        <StatCard
          title="Total Today"
          count={stats.todayDetections}
          icon={Zap}
          color="text-green-400"
          bgColor="bg-gray-900"
          recentDetections={detections.filter(d => {
            const today = new Date().toDateString();
            const detectionDate = new Date(d.timestamp * 1000).toDateString();
            return today === detectionDate;
          }).slice(0, 3)}
          onClick={() => onNavigate('gallery')}
        />
        
        <StatCard
          title="Total Vehicles"
          count={stats.totalVehicle}
          icon={Anchor}
          color="text-cyan-400"
          bgColor="bg-gray-900"
          recentDetections={getRecentDetectionsByType('Vehicle')}
          onClick={() => onNavigate('gallery')}
        />
        
        <StatCard
          title="Total Animals"
          count={stats.totalAnimal}
          icon={Camera}
          color="text-orange-400"
          bgColor="bg-gray-900"
          recentDetections={getRecentDetectionsByType('Animal')}
          onClick={() => onNavigate('gallery')}
        />
        
        <StatCard
          title="Total Humans"
          count={stats.totalHuman}
          icon={Users}
          color="text-purple-400"
          bgColor="bg-gray-900"
          recentDetections={getRecentDetectionsByType('Human')}
          onClick={() => onNavigate('gallery')}
        />
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-300 mb-4">System Status</h3>
          <div className="space-y-3">
            {[
              { name: 'Camera Network', status: 'Online', color: 'text-green-400' },
              { name: 'AI Detection', status: 'Running', color: 'text-blue-400' },
              { name: 'Recording System', status: 'Active', color: 'text-green-400' },
              { name: 'Storage', status: `${stats.totalDetections} files`, color: 'text-yellow-400' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-400">{item.name}</span>
                <span className={`text-sm font-medium ${item.color}`}>{item.status}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-800">
            <button
              onClick={fetchDetections}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-600 flex items-center justify-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {/* Hardware Monitor */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-300">Hardware Monitor</h3>
            <div className="ml-auto">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-400">Live</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ProgressBar
              value={systemStats.cpu.usage}
              label="CPU"
              icon={Cpu}
              details={[
                { label: 'Temp', value: `${Math.round(systemStats.cpu.temperature)}°C` },
                { label: 'Cores', value: '8' }
              ]}
            />

            <ProgressBar
              value={systemStats.ram.usage}
              label="RAM"
              icon={Zap}
              details={[
                { label: 'Used', value: `${systemStats.ram.used.toFixed(1)} GB` },
                { label: 'Total', value: `${systemStats.ram.total} GB` }
              ]}
            />

            <ProgressBar
              value={systemStats.gpu.usage}
              label="GPU"
              icon={Monitor}
              details={[
                { label: 'VRAM', value: `${Math.round(systemStats.gpu.memory)}%` },
                { label: 'Temp', value: `${Math.round(systemStats.gpu.temperature)}°C` }
              ]}
            />

            <ProgressBar
              value={systemStats.storage.usage}
              label="Storage"
              icon={HardDrive}
              details={[
                { label: 'Used', value: `${Math.round(systemStats.storage.used)} GB` },
                { label: 'Free', value: `${systemStats.storage.total - systemStats.storage.used} GB` }
              ]}
            />
          </div>

          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>System Status: Normal</span>
              <span>Updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;