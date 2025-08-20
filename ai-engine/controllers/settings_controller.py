from PyQt6.QtCore import QObject
from views.dialogs.add_camera import AddCameraDialog
from views.dialogs.edit_camera import EditCameraDialog

class SettingsController(QObject):
    """Controller for camera settings page"""
    def __init__(self, database, settings_page):
        super().__init__()
        self.db = database
        self.view = settings_page
        
        # Connect signals
        self.view.add_btn.clicked.connect(self.show_add_camera_dialog)
        self.view.edit_btn.clicked.connect(self.edit_camera)
        self.view.delete_btn.clicked.connect(self.delete_camera)
        
        # Load cameras initially
        self.load_cameras()
    
    def load_cameras(self):
        """Load cameras from database and display in view"""
        cameras = self.db.get_cameras()
        self.view.display_cameras(cameras)
    
    def show_add_camera_dialog(self):
        """Show dialog to add a new camera"""
        dialog = AddCameraDialog(self.view)
        if dialog.exec() == 1:  # QDialog.DialogCode.Accepted
            camera_info = dialog.get_camera_info()
            # Add to database with location info
            camera_id = self.db.add_camera(
                camera_info["name"], 
                camera_info["url"], 
                camera_info["latitude"], 
                camera_info["longitude"]
            )
            # Reload list
            self.load_cameras()
            # Emit signal to update live view
            self.view.camera_updated_signal.emit()
    
    def edit_camera(self):
        """Edit the currently selected camera"""
        camera_info = self.view.get_selected_camera()
        if not camera_info:
            self.view.show_no_selection_warning()
            return
        
        # Show edit dialog with location information
        dialog = EditCameraDialog(
            camera_info["id"], 
            camera_info["name"], 
            camera_info["url"],
            camera_info.get("latitude"),
            camera_info.get("longitude"),
            self.view
        )
        
        if dialog.exec() == 1:  # QDialog.DialogCode.Accepted
            updated_info = dialog.get_camera_info()
            # Update in database with location info
            self.db.update_camera(
                updated_info["id"], 
                updated_info["name"], 
                updated_info["url"],
                updated_info["latitude"],
                updated_info["longitude"]
            )
            # Reload list
            self.load_cameras()
            # Emit signal to update live view
            self.view.camera_updated_signal.emit()
    
    def delete_camera(self):
        """Delete the currently selected camera"""
        camera_info = self.view.get_selected_camera()
        if not camera_info:
            self.view.show_no_selection_warning()
            return
        
        # Confirm deletion
        if self.view.show_delete_confirmation(camera_info["name"]):
            # Delete from database
            self.db.delete_camera(camera_info["id"])
            # Reload list
            self.load_cameras()
            # Emit signal to update live view
            self.view.camera_updated_signal.emit()