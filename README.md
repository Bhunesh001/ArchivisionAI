# Archivision AI - Intelligent Infrastructure Planning & 3D Design Platform

A full-stack web application for intelligent infrastructure planning with AI-powered layout generation, interactive 3D visualization, and true **photorealistic AI rendering** using Stable Diffusion XL.

## 🚀 Features

- **User Authentication** - Secure login and registration with JWT.
- **AI-Based Layout Generation** - Smart floor plan creation based on dimensions, floors, and building type.
- **2D Floor Plan Editor** - Interactive editor with an architectural tool strip (Doors, Windows, Stairs, Rooms).
- **3D Building Visualization** - Real-time split-screen interactive 3D models with Three.js.
- **Photorealistic AI Renders** - Generate 4K photorealistic architectural renders from your 2D plans using Stable Diffusion XL and ControlNet.
- **Color & Style Customization** - AI-recommended color schemes (Modern, Colonial, Minimalist, etc.).
- **Budget Estimation** - Instant cost calculations based on area and quality.
- **Project Save & Export** - Save to cloud, export floor plans to PNG.
- **Modern Indigo UI** - Clean, professional interface inspired by top-tier architectural software.

## 🛠️ Tech Stack

### Frontend
- HTML5, CSS3 (Vanilla), JavaScript (ES6+)
- **Three.js** (3D visualization engine)
- Inter & Outfit Typography

### Backend
- Python 3.9+
- Flask (Web framework)
- Flask-SQLAlchemy (SQLite/PostgreSQL)
- Flask-JWT-Extended (Authentication)

### Machine Learning Engine
- **PyTorch** (Core ML framework)
- **Diffusers** (HuggingFace pipeline for Stable Diffusion XL)
- **ControlNet** (For edge-conditioned layout guidance)
- **Real-ESRGAN** (For 4x upscaling to 4K resolution)

## 📋 Prerequisites

- Python 3.9 or higher
- Nvidia GPU with ≥8GB VRAM (Required for fast photorealistic renders; otherwise it will fallback to slow CPU rendering)
- ~10GB of free disk space (for HuggingFace ML models)

## 🔧 Installation & Setup

### 1. Clone and Navigate to Project
```bash
cd ArchivisionAI
```

### 2. Create Virtual Environment
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 3. Install Dependencies
```bash
# Install core backend dependencies
pip install -r requirements.txt

# Install PyTorch with CUDA (Example for CUDA 12.1)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# Install ML Render dependencies
pip install diffusers transformers accelerate controlnet-aux basicsr realesrgan
```

### 4. Start Backend Server
```bash
python backend/app.py
```
Server runs at: `http://localhost:5000`

### 5. Open Frontend
Open your browser and navigate to `http://localhost:5000`.

## 📁 Project Structure

```
ArchivisionAI/
├── backend/
│   ├── app.py                 # Main Flask API & Server
│   ├── render_engine.py       # Stable Diffusion XL + ControlNet Pipeline
│   ├── models/                # SQLAlchemy Models
│   ├── renders/               # Output directory for 4K AI Renders
│   ├── uploads/               # Project file storage
│   └── instance/              # SQLite Database
├── frontend/
│   ├── index.html             # Landing Page (Hero, Features, Auth Modal)
│   ├── dashboard.html         # User Dashboard (Projects, Budget, Profile)
│   ├── editor.html            # Split-screen 2D/3D Floor Plan Editor
│   └── hero_house.png         # UI Assets
└── README.md
```

## 🚀 Quick Start

1. Install dependencies and start the backend server.
2. Open `http://localhost:5000` in your browser.
3. Register an account and log in.
4. Click **New Project** and input your plot dimensions and requirements.
5. The AI will generate a base layout. Use the **Left Tool Strip** in the editor to add Stairs, Furniture, Kitchens, and Walkthroughs.
6. Use the **Properties Panel** on the right to toggle windows or change room colors.
7. Switch between the 2D Plan and interactive 3D View instantly.
8. (Upcoming) Click **AI Render** to transform your basic 3D model into a photorealistic 4K image!

## 📖 Core API Endpoints

- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Authenticate user
- `POST /api/projects` - Generate new AI layout & save project
- `GET /api/projects/<id>` - Retrieve project for editor
- `POST /api/ai/budget-estimate` - Calculate cost
- `POST /api/ai/render` - Trigger SDXL Photorealistic Render (in development)

## 🔐 Security

- JWT-based authentication
- Password hashing with Werkzeug
- CORS protection
- SQLite database (Easily upgradeable to PostgreSQL)

## 🤝 Contributing
Feel free to fork, modify, and enhance this project! 

---
**Happy Building! 🏗️**
