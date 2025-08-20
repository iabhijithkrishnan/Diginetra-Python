import React from 'react';
import { 
  Play, Pause, Square, SkipBack, SkipForward, 
  Volume2, Mic, Download, Maximize2,
  Grid, Grid3X3
} from 'lucide-react';

interface VideoControlsProps {
  playing?: boolean;
  volume?: number;
  showTimeline?: boolean;
  onPlayPause?: () => void;
  onVolumeChange?: (value: number) => void;
  onLayoutChange?: (layout: string) => void;
}

const VideoControls: React.FC<VideoControlsProps> = ({
  playing = false,
  volume = 50,
  showTimeline = false,
  onPlayPause,
  onVolumeChange,
  onLayoutChange
}) => {
  return (
    <div className="bg-gray-900 border-t border-gray-800 flex flex-col">
      {showTimeline && (
        <div className="px-4 py-2 flex items-center">
          <div className="text-xs text-gray-500 mr-2">00:00:00</div>
          <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 w-1/4"></div>
          </div>
          <div className="text-xs text-gray-500 ml-2">23:59:59</div>
        </div>
      )}
      
      <div className="flex items-center justify-between p-2">
        <div className="flex space-x-2">
          <button className="p-1.5 rounded hover:bg-gray-800 text-gray-400">
            <Grid className="h-5 w-5" onClick={() => onLayoutChange?.('2x2')} />
          </button>
          <button className="p-1.5 rounded hover:bg-gray-800 text-gray-400">
            <Grid3X3 className="h-5 w-5" onClick={() => onLayoutChange?.('3x3')} />
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="p-1.5 rounded hover:bg-gray-800 text-gray-400">
            <SkipBack className="h-5 w-5" />
          </button>
          
          <button 
            className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300"
            onClick={onPlayPause}
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          
          <button className="p-1.5 rounded hover:bg-gray-800 text-gray-400">
            <Square className="h-5 w-5" />
          </button>
          
          <button className="p-1.5 rounded hover:bg-gray-800 text-gray-400">
            <SkipForward className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="p-1.5 rounded hover:bg-gray-800 text-gray-400">
            <Volume2 className="h-5 w-5" />
          </button>
          
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => onVolumeChange?.(Number(e.target.value))}
            className="w-20 accent-red-500"
          />
          
          <button className="p-1.5 rounded hover:bg-gray-800 text-gray-400">
            <Download className="h-5 w-5" />
          </button>
          
          <button className="p-1.5 rounded hover:bg-gray-800 text-gray-400">
            <Maximize2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoControls;