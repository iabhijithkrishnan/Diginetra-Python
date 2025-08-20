import sqlite3
from config import DB_PATH

class Database:
    """Database manager for camera settings and events"""
    def __init__(self, db_path=DB_PATH):
        self.conn = sqlite3.connect(db_path)
        self.cursor = self.conn.cursor()
        self.create_tables()
        self.update_schema()  # Add this to handle schema updates
    
    def create_tables(self):
        # Create cameras table
        self.cursor.execute('''
        CREATE TABLE IF NOT EXISTS cameras (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            rtsp_url TEXT NOT NULL,
            enabled INTEGER DEFAULT 1,
            latitude TEXT DEFAULT NULL,
            longitude TEXT DEFAULT NULL
        )
        ''')
        
        # Create events table
        self.cursor.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            camera_id INTEGER,
            object_type TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            image_path TEXT NOT NULL,
            FOREIGN KEY (camera_id) REFERENCES cameras (id)
        )
        ''')
        self.conn.commit()
    
    def update_schema(self):
        """Update database schema if needed"""
        # Check if latitude and longitude columns exist, add them if not
        try:
            self.cursor.execute("SELECT latitude, longitude FROM cameras LIMIT 1")
        except sqlite3.OperationalError:
            print("Updating database schema - adding location columns")
            self.cursor.execute("ALTER TABLE cameras ADD COLUMN latitude TEXT DEFAULT NULL")
            self.cursor.execute("ALTER TABLE cameras ADD COLUMN longitude TEXT DEFAULT NULL")
            self.conn.commit()
    
    def add_camera(self, name, rtsp_url, latitude=None, longitude=None):
        """Add a new camera to the database with optional location"""
        self.cursor.execute(
            "INSERT INTO cameras (name, rtsp_url, latitude, longitude) VALUES (?, ?, ?, ?)", 
            (name, rtsp_url, latitude, longitude)
        )
        self.conn.commit()
        return self.cursor.lastrowid
    
    def update_camera(self, camera_id, name, rtsp_url, latitude=None, longitude=None):
        """Update an existing camera's details including location"""
        self.cursor.execute(
            "UPDATE cameras SET name=?, rtsp_url=?, latitude=?, longitude=? WHERE id=?", 
            (name, rtsp_url, latitude, longitude, camera_id)
        )
        self.conn.commit()
    
    def delete_camera(self, camera_id):
        """Delete a camera from the database"""
        self.cursor.execute("DELETE FROM cameras WHERE id=?", (camera_id,))
        self.conn.commit()
    
    def get_cameras(self):
        """Get all cameras from the database including location info"""
        self.cursor.execute("SELECT id, name, rtsp_url, enabled, latitude, longitude FROM cameras")
        return self.cursor.fetchall()
    
    def get_camera_location(self, camera_id):
        """Get location information for a specific camera"""
        self.cursor.execute("SELECT latitude, longitude FROM cameras WHERE id=?", (camera_id,))
        return self.cursor.fetchone()
    
    def add_event(self, camera_id, object_type, image_path):
        """Add a new detection event to the database"""
        self.cursor.execute(
            "INSERT INTO events (camera_id, object_type, image_path) VALUES (?, ?, ?)",
            (camera_id, object_type, image_path)
        )
        self.conn.commit()
        return self.cursor.lastrowid
    
    def get_events(self, limit=100):
        """Get detection events with camera details"""
        self.cursor.execute("""
        SELECT e.id, c.name, e.object_type, e.timestamp, e.image_path
        FROM events e
        JOIN cameras c ON e.camera_id = c.id
        ORDER BY e.timestamp DESC
        LIMIT ?
        """, (limit,))
        return self.cursor.fetchall()
    
    def close(self):
        """Close the database connection"""
        self.conn.close()