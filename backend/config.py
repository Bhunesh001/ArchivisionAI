import os
from datetime import timedelta

# Application Configuration
class Config:
    """Base configuration"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False
    
    # JWT Configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)
    
    # File Upload
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    UPLOAD_FOLDER = 'backend/uploads'
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///Archivision.db')
    
    # CORS
    CORS_ORIGINS = ["*"]

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False
    SQLALCHEMY_ECHO = True

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://user:password@localhost/Archivision')

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

# Building Types
BUILDING_TYPES = {
    'house': {
        'name': 'House',
        'min_area': 1000,
        'max_area': 50000,
        'rooms': ['bedroom', 'bathroom', 'kitchen', 'living_room', 'dining_room'],
        'base_cost_per_sqft': 150
    },
    'apartment': {
        'name': 'Apartment',
        'min_area': 500,
        'max_area': 10000,
        'rooms': ['bedroom', 'bathroom', 'kitchen', 'living_room'],
        'base_cost_per_sqft': 180
    },
    'office': {
        'name': 'Office',
        'min_area': 1000,
        'max_area': 100000,
        'rooms': ['conference_room', 'office_space', 'meeting_room', 'lobby'],
        'base_cost_per_sqft': 120
    },
    'shop': {
        'name': 'Shop',
        'min_area': 500,
        'max_area': 20000,
        'rooms': ['sales_area', 'storage', 'checkout'],
        'base_cost_per_sqft': 130
    },
    'restaurant': {
        'name': 'Restaurant',
        'min_area': 1000,
        'max_area': 50000,
        'rooms': ['dining_area', 'kitchen', 'restroom'],
        'base_cost_per_sqft': 200
    },
    'mall': {
        'name': 'Mall',
        'min_area': 20000,
        'max_area': 500000,
        'rooms': ['retail_space', 'food_court', 'restroom'],
        'base_cost_per_sqft': 100
    },
    'hotel': {
        'name': 'Hotel',
        'min_area': 10000,
        'max_area': 200000,
        'rooms': ['guest_room', 'lobby', 'restaurant', 'conference_room'],
        'base_cost_per_sqft': 250
    },
    'commercial': {
        'name': 'Commercial Building',
        'min_area': 10000,
        'max_area': 500000,
        'rooms': ['office_space', 'conference_room', 'lobby'],
        'base_cost_per_sqft': 140
    }
}

# Color Palettes
COLOR_PALETTES = {
    'modern': {
        'primary': '#2C3E50',
        'secondary': '#3498DB',
        'accent': '#E74C3C',
        'wall': '#ECF0F1'
    },
    'minimalist': {
        'primary': '#FFFFFF',
        'secondary': '#000000',
        'accent': '#808080',
        'wall': '#F5F5F5'
    },
    'warm': {
        'primary': '#D4AF37',
        'secondary': '#C9A961',
        'accent': '#8B4513',
        'wall': '#F0E68C'
    },
    'cool': {
        'primary': '#4A90E2',
        'secondary': '#50C878',
        'accent': '#9B59B6',
        'wall': '#E8F4F8'
    },
    'earthy': {
        'primary': '#8B7355',
        'secondary': '#D2B48C',
        'accent': '#6B4423',
        'wall': '#F5DEB3'
    }
}

# Room Sizes (in square feet)
ROOM_SIZES = {
    'bedroom': (100, 200),
    'bathroom': (50, 100),
    'kitchen': (100, 300),
    'living_room': (200, 500),
    'dining_room': (150, 300),
    'conference_room': (200, 800),
    'office_space': (100, 400),
    'meeting_room': (150, 300),
    'lobby': (200, 1000),
    'sales_area': (500, 5000),
    'storage': (100, 1000),
    'checkout': (50, 200),
    'dining_area': (500, 2000),
    'food_court': (1000, 10000),
    'restroom': (50, 150),
    'retail_space': (500, 5000),
    'guest_room': (200, 300)
}

# Cost Estimation
COST_MULTIPLIERS = {
    'premium': 1.5,
    'standard': 1.0,
    'budget': 0.7
}

# Get config based on environment
def get_config():
    env = os.getenv('FLASK_ENV', 'development')
    if env == 'production':
        return ProductionConfig
    elif env == 'testing':
        return TestingConfig
    return DevelopmentConfig
