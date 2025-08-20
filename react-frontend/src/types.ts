export interface CameraFeed {
  id: string;
  name: string;
  status: 'online' | 'offline';
  thumbnail?: string; // ✅ Add this line
}
