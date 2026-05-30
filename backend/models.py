from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import json

db = SQLAlchemy()

class User(db.Model):
    """User model for authentication and profile management"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(120))
    last_name = db.Column(db.String(120))
    avatar_url = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    projects = db.relationship('Project', backref='owner', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verify password"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'avatar_url': self.avatar_url,
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<User {self.username}>'


class Project(db.Model):
    """Project model for user infrastructure projects"""
    __tablename__ = 'projects'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    building_type = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), default='draft')  # draft, active, completed, archived
    
    # Plot Information
    plot_image_url = db.Column(db.String(500))
    plot_width = db.Column(db.Float)  # in feet
    plot_length = db.Column(db.Float)  # in feet
    plot_area = db.Column(db.Float)   # in sq feet
    plot_shape = db.Column(db.String(50))  # rectangular, square, triangular, irregular
    
    # Design Preferences
    parking_spaces = db.Column(db.Integer, default=0)
    open_space_percentage = db.Column(db.Float, default=20)
    number_of_floors = db.Column(db.Integer, default=1)
    color_theme = db.Column(db.String(50), default='modern')
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    designs = db.relationship('Design', backref='project', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self, include_designs=False):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'building_type': self.building_type,
            'status': self.status,
            'plot_area': self.plot_area,
            'plot_width': self.plot_width,
            'plot_length': self.plot_length,
            'plot_shape': self.plot_shape,
            'parking_spaces': self.parking_spaces,
            'open_space_percentage': self.open_space_percentage,
            'number_of_floors': self.number_of_floors,
            'color_theme': self.color_theme,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        if include_designs:
            data['designs'] = [d.to_dict() for d in self.designs]
        return data
    
    def __repr__(self):
        return f'<Project {self.name}>'


class Design(db.Model):
    """Design model for storing floor plans and 3D models"""
    __tablename__ = 'designs'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    version = db.Column(db.Integer, default=1)
    
    # Design Data
    floor_plan_data = db.Column(db.JSON)  # 2D layout coordinates and room info
    room_configurations = db.Column(db.JSON)  # Room details
    furniture_placements = db.Column(db.JSON)  # AI-suggested furniture
    color_scheme = db.Column(db.JSON)  # Color configuration
    
    # 3D Model Data
    model_data = db.Column(db.JSON)  # 3D model structure
    
    # Metadata
    design_type = db.Column(db.String(50))  # floor_plan, 3d_model
    status = db.Column(db.String(20), default='draft')  # draft, generated, approved
    budget_estimate = db.Column(db.Float)
    
    # Files
    floor_plan_image_url = db.Column(db.String(500))
    model_file_url = db.Column(db.String(500))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'project_id': self.project_id,
            'version': self.version,
            'floor_plan_data': self.floor_plan_data,
            'room_configurations': self.room_configurations,
            'color_scheme': self.color_scheme,
            'design_type': self.design_type,
            'status': self.status,
            'budget_estimate': self.budget_estimate,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Design {self.id} v{self.version}>'
