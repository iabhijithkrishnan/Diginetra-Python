import React from 'react';
import * as LucideIcons from 'lucide-react'; // Import all Lucide icons
import { CameraFeed } from '../types';

interface VideoGridProps {
  feeds: CameraFeed[];
  layout: '1x1' | '2x2' | '3x3' | '4x4';
  highlightedFeed?: string;
  onFeedClick?: (feedId: string) => void;
}

const VideoGrid: React.FC<VideoGridProps> = ({
  feeds,
  layout = '2x2',
  highlightedFeed,
  onFeedClick,
}) => {
  const gridConfig = {
    '1x1': 'grid-cols-1',
    '2x2': 'grid-cols-2',
    '3x3': 'grid-cols-3',
    '4x4': 'grid-cols-4',
  };

  // ✅ Fix typing issues by casting to any
  const CameraIcon = LucideIcons.Camera as any;
  const CameraOffIcon = LucideIcons.CameraOff as any;

  return (
    <div className={`grid ${gridConfig[layout]} gap-1 h-full w-full bg-black`}>
      {feeds.map((feed) => (
        <div
          key={feed.id}
          className={`relative bg-gray-900 border ${
            highlightedFeed === feed.id ? 'border-red-500' : 'border-gray-800'
          } flex items-center justify-center cursor-pointer transition-all duration-200 hover:border-gray-600`}
          onClick={() => onFeedClick && onFeedClick(feed.id)}
        >
          {feed.status === 'online' ? (
            feed.thumbnail ? (
              <img
                src={feed.thumbnail}
                alt={feed.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center">
                <CameraIcon className="h-16 w-16 text-gray-700" />
                <span className="text-gray-500 text-sm mt-2">{feed.name}</span>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center">
              <CameraOffIcon className="h-16 w-16 text-gray-700" />
              <span className="text-gray-500 text-sm mt-2">Camera Offline</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default VideoGrid;
