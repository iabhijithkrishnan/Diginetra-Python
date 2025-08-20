from PyQt6.QtCore import QObject

class EventsController(QObject):
    """Controller for events history page"""
    def __init__(self, database, events_page):
        super().__init__()
        self.db = database
        self.view = events_page
        
        # Connect the refresh button
        self.view.refresh_btn.clicked.connect(self.load_events)
        
        # Set up auto refresh
        self.view.start_auto_refresh(self.load_events)
    
    def load_events(self):
        """Load events from database and display in view"""
        events = self.db.get_events()
        self.view.display_events(events)
    
    def cleanup(self):
        """Clean up resources before closing"""
        self.view.stop_auto_refresh()