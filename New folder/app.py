from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os, json, math, random

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app, origins="*")

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'Archivision-secret-key-2024')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'Archivision-jwt-secret-2024')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///Archivision.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db = SQLAlchemy(app)
jwt = JWTManager(app)


# ─────────────────────────────────────────────────────────────
# DATABASE MODELS
# ─────────────────────────────────────────────────────────────

class User(db.Model):
    __tablename__ = 'users'
    id            = db.Column(db.Integer, primary_key=True)
    username      = db.Column(db.String(80), unique=True, nullable=False)
    email         = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name    = db.Column(db.String(120), default='')
    last_name     = db.Column(db.String(120), default='')
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)
    projects      = db.relationship('Project', backref='owner', lazy=True, cascade='all, delete-orphan')

    def set_password(self, pw):   self.password_hash = generate_password_hash(pw)
    def check_password(self, pw): return check_password_hash(self.password_hash, pw)
    def to_dict(self):
        return {'id': self.id, 'username': self.username, 'email': self.email,
                'first_name': self.first_name, 'last_name': self.last_name,
                'created_at': self.created_at.isoformat()}


class Project(db.Model):
    __tablename__           = 'projects'
    id                      = db.Column(db.Integer, primary_key=True)
    user_id                 = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name                    = db.Column(db.String(255), nullable=False)
    description             = db.Column(db.Text, default='')
    building_type           = db.Column(db.String(50), nullable=False)
    status                  = db.Column(db.String(20), default='draft')
    plot_width              = db.Column(db.Float, default=0)
    plot_length             = db.Column(db.Float, default=0)
    plot_area               = db.Column(db.Float, default=0)
    plot_shape              = db.Column(db.String(50), default='rectangular')
    parking_spaces          = db.Column(db.Integer, default=0)
    open_space_percentage   = db.Column(db.Float, default=20)
    number_of_floors        = db.Column(db.Integer, default=1)
    color_theme             = db.Column(db.String(50), default='modern')
    floor_plan_data         = db.Column(db.Text, default='{}')
    budget_estimate         = db.Column(db.Float, default=0)
    created_at              = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at              = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'name': self.name, 'description': self.description,
            'building_type': self.building_type, 'status': self.status,
            'plot_width': self.plot_width, 'plot_length': self.plot_length,
            'plot_area': self.plot_area, 'plot_shape': self.plot_shape,
            'parking_spaces': self.parking_spaces,
            'open_space_percentage': self.open_space_percentage,
            'number_of_floors': self.number_of_floors,
            'color_theme': self.color_theme,
            'floor_plan_data': json.loads(self.floor_plan_data or '{}'),
            'budget_estimate': self.budget_estimate,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }


# ─────────────────────────────────────────────────────────────
# BUILDING CONFIG
# ─────────────────────────────────────────────────────────────

# Each room entry: (type, aspect_ratio_w_to_h, min_w_ft, max_w_ft)
# Aspect ratio drives realistic proportions (e.g. kitchen is wider than deep)
BUILDING_CONFIGS = {
    'house': {
        'rooms': [
            ('living_room',   1.6, 14, 22),
            ('kitchen',       1.3, 10, 16),
            ('dining_room',   1.2, 10, 14),
            ('bedroom',       1.1, 11, 16),
            ('bedroom',       1.1, 10, 14),
            ('bathroom',      0.8,  6,  9),
            ('hallway',       3.0,  4,  6),
        ],
        'cost_sqft': 150,
    },
    'apartment': {
        'rooms': [
            ('living_room',   1.5, 12, 18),
            ('kitchen',       1.2,  8, 12),
            ('bedroom',       1.1, 10, 14),
            ('bathroom',      0.8,  5,  8),
        ],
        'cost_sqft': 180,
    },
    'office': {
        'rooms': [
            ('lobby',          2.0, 12, 20),
            ('office_space',   1.4, 16, 30),
            ('conference_room',1.5, 14, 22),
            ('meeting_room',   1.3, 10, 16),
            ('restroom',       0.9,  6, 10),
        ],
        'cost_sqft': 120,
    },
    'shop': {
        'rooms': [
            ('sales_area',    1.8, 20, 40),
            ('storage',       1.2, 10, 18),
            ('checkout',      2.5,  8, 14),
            ('restroom',      0.9,  5,  8),
        ],
        'cost_sqft': 130,
    },
    'restaurant': {
        'rooms': [
            ('dining_area',   1.5, 20, 40),
            ('kitchen',       1.3, 14, 22),
            ('restroom',      0.9,  6, 10),
            ('storage',       1.1,  8, 14),
        ],
        'cost_sqft': 200,
    },
    'mall': {
        'rooms': [
            ('retail_space',  2.0, 30, 60),
            ('food_court',    1.8, 25, 50),
            ('restroom',      1.0,  8, 14),
            ('storage',       1.2, 12, 20),
        ],
        'cost_sqft': 100,
    },
    'hotel': {
        'rooms': [
            ('lobby',          2.0, 18, 30),
            ('guest_room',     1.2, 12, 16),
            ('guest_room',     1.2, 12, 16),
            ('restaurant',     1.5, 18, 28),
            ('conference_room',1.5, 14, 22),
            ('restroom',       0.9,  6, 10),
        ],
        'cost_sqft': 250,
    },
    'commercial': {
        'rooms': [
            ('lobby',          2.0, 14, 24),
            ('office_space',   1.4, 18, 34),
            ('conference_room',1.5, 14, 22),
            ('restroom',       0.9,  6, 10),
        ],
        'cost_sqft': 140,
    },
}

ROOM_COLORS = {
    'bedroom':        '#f8b4c8',
    'bathroom':       '#a8d8ea',
    'kitchen':        '#ffd93d',
    'living_room':    '#a8e6cf',
    'dining_room':    '#deb887',
    'dining_area':    '#deb887',
    'conference_room':'#b0c4de',
    'office_space':   '#d3d3d3',
    'meeting_room':   '#b0c4de',
    'lobby':          '#f0e68c',
    'sales_area':     '#c8e6c9',
    'storage':        '#bcaaa4',
    'checkout':       '#ffe0b2',
    'food_court':     '#ffe4b5',
    'restroom':       '#b3e5fc',
    'retail_space':   '#e1bee7',
    'guest_room':     '#f8b4c8',
    'hallway':        '#e0e0e0',
    'parking':        '#90a4ae',
    'garden':         '#81c784',
    'stairs':         '#9e9e9e',
    'restaurant':     '#ffccbc',
}

COLOR_PALETTES = {
    'modern':     {'wall': '#F4F1EC', 'roof': '#2C3E50', 'floor': '#8B7355', 'trim': '#3498DB', 'accent': '#E74C3C'},
    'minimalist': {'wall': '#FFFFFF', 'roof': '#333333', 'floor': '#CCCCCC', 'trim': '#000000', 'accent': '#999999'},
    'warm':       {'wall': '#FFF8E7', 'roof': '#8B4513', 'floor': '#D2B48C', 'trim': '#D4AF37', 'accent': '#CD853F'},
    'cool':       {'wall': '#EBF5FB', 'roof': '#1A5276', 'floor': '#85C1E9', 'trim': '#2980B9', 'accent': '#1ABC9C'},
    'earthy':     {'wall': '#F5F0E8', 'roof': '#5D4037', 'floor': '#A1887F', 'trim': '#795548', 'accent': '#689F38'},
}


# ─────────────────────────────────────────────────────────────
# FLOOR PLAN ENGINE  (the core improvement)
# ─────────────────────────────────────────────────────────────

WALL_THICKNESS = 0.8   # ft — drawn between rooms
HALLWAY_W      = 4.0   # ft — corridor width when present
PARKING_DEPTH  = 18.0  # ft — standard parking stall depth
PARKING_WIDTH  = 9.0   # ft — standard parking stall width
OUTER_MARGIN   = 2.0   # ft — gap between plot boundary and building

def _clamp(val, lo, hi):
    return max(lo, min(hi, val))


def _size_room(rtype, aspect, min_w, max_w, available_area, total_rooms):
    """
    Return (w, h) in feet for a single room given a target area share.
    Uses the declared aspect ratio so rooms look architecturally proportional.
    """
    target_area = available_area / total_rooms
    # w * h = area,  w / h = aspect  =>  w = sqrt(area * aspect)
    w = math.sqrt(target_area * aspect)
    w = _clamp(w, min_w, max_w)
    h = target_area / w
    # Cap h so rooms stay box-like: never more than 1.8× their own width
    h = _clamp(h, 6.0, min(25.0, w * 1.8))
    return round(w, 2), round(h, 2)


def generate_floor_plan(plot_width, plot_length, building_type,
                        parking, open_pct, floors, target_rooms=None):
    """
    Improved floor plan generator.

    Changes vs original:
    - Rooms get realistic aspect ratios instead of all being square.
    - Row-packing respects wall thickness between rooms.
    - Parking is placed at the bottom with proper stall sizing.
    - Open garden area is shown as a separate labeled zone.
    - Stairs block appears on every upper floor (not just ground).
    - Budget uses per-floor build area, not total plot area.
    - Hallways are added when the building warrants it.
    """
    config  = BUILDING_CONFIGS.get(building_type, BUILDING_CONFIGS['house'])
    room_defs = list(config['rooms'])

    # Honour requested room count: repeat or trim room list
    if target_rooms and target_rooms > 0:
        base = list(room_defs)
        while len(room_defs) < target_rooms:
            room_defs.append(base[len(room_defs) % len(base)])
        room_defs = room_defs[:target_rooms]

    total_area   = plot_width * plot_length
    parking_area = parking * PARKING_WIDTH * PARKING_DEPTH
    open_area    = total_area * (open_pct / 100)
    build_area   = max(200, total_area - parking_area - open_area)

    # ── Available building footprint ──────────────────────────
    # Place building in the top portion; parking row at bottom; garden strip on sides.
    park_rows   = math.ceil(parking / max(1, math.floor((plot_width - 2 * OUTER_MARGIN) / PARKING_WIDTH)))
    park_height = park_rows * PARKING_DEPTH + (4 if parking > 0 else 0)   # +4 ft driveway lane

    inner_w = plot_width  - 2 * OUTER_MARGIN
    inner_l = plot_length - 2 * OUTER_MARGIN - park_height

    # Safety: never let inner dims go negative
    inner_w = max(20, inner_w)
    inner_l = max(20, inner_l)

    # ── Place rooms row by row ────────────────────────────────
    rooms_placed = []
    x = OUTER_MARGIN
    y = OUTER_MARGIN
    row_h = 0

    for (rtype, aspect, min_w, max_w) in room_defs:
        w, h = _size_room(rtype, aspect, min_w, max_w, build_area, len(room_defs))

        # Clamp so room never exceeds 80 % of inner width
        w = min(w, inner_w * 0.80)
        h = min(h, inner_l * 0.75)

        # Wrap to next row if it won't fit
        if x + w > plot_width - OUTER_MARGIN + 0.1:
            x  = OUTER_MARGIN
            y += row_h + WALL_THICKNESS
            row_h = 0

        # If we've gone below the building zone, stop (avoid overlap with parking)
        if y + h > OUTER_MARGIN + inner_l:
            break

        rooms_placed.append({
            'type':  rtype,
            'label': rtype.replace('_', ' ').title(),
            'x':     round(x, 2),
            'y':     round(y, 2),
            'w':     round(w, 2),
            'h':     round(h, 2),
            'area':  round(w * h, 1),
            'color': ROOM_COLORS.get(rtype, '#cccccc'),
        })

        x    += w + WALL_THICKNESS
        row_h = max(row_h, h)

    # ── Stairs (ground floor and up) ─────────────────────────
    if floors > 1:
        rooms_placed.append({
            'type': 'stairs', 'label': 'Stairs',
            'x': round(OUTER_MARGIN, 2), 'y': round(OUTER_MARGIN, 2),
            'w': 6.0, 'h': 9.0, 'area': 54,
            'color': ROOM_COLORS['stairs'],
        })

    # ── Parking block ─────────────────────────────────────────
    park_rooms = []
    if parking > 0:
        park_y       = plot_length - OUTER_MARGIN - park_height
        stalls_per_row = max(1, math.floor(inner_w / PARKING_WIDTH))
        remaining    = parking
        py           = park_y + 4   # leave 4 ft driveway at bottom

        while remaining > 0:
            row_stalls = min(remaining, stalls_per_row)
            pw_used    = row_stalls * PARKING_WIDTH
            park_rooms.append({
                'type':  'parking',
                'label': f'Parking ({row_stalls} spaces)',
                'x':     round(OUTER_MARGIN, 2),
                'y':     round(py, 2),
                'w':     round(pw_used, 2),
                'h':     round(PARKING_DEPTH, 2),
                'area':  round(pw_used * PARKING_DEPTH, 1),
                'color': ROOM_COLORS['parking'],
            })
            remaining -= row_stalls
            py        += PARKING_DEPTH

    # ── Open / garden zone ────────────────────────────────────
    garden_rooms = []
    if open_area > 0 and open_pct > 0:
        # Draw a thin strip of garden on the right side if there's space
        g_x = plot_width - OUTER_MARGIN - max(4, open_area / plot_length)
        g_w = max(4, open_area / plot_length)
        g_h = inner_l
        if g_w < inner_w * 0.5:   # only show if it looks reasonable
            garden_rooms.append({
                'type':  'garden',
                'label': f'Open Space ({round(open_area)} sq ft)',
                'x':     round(g_x, 2),
                'y':     round(OUTER_MARGIN, 2),
                'w':     round(g_w, 2),
                'h':     round(g_h, 2),
                'area':  round(open_area, 1),
                'color': ROOM_COLORS['garden'],
            })

    # ── Upper floors: same layout minus parking/garden ────────
    import copy
    floors_data = []
    for f in range(floors):
        if f == 0:
            floor_rooms = rooms_placed + park_rooms + garden_rooms
        else:
            # Upper floors: same rooms but replace parking with extra bedroom/office
            upper = copy.deepcopy(rooms_placed)
            # Replace stairs label to clarify floor
            for r in upper:
                if r['type'] == 'stairs':
                    r['label'] = f'Stairs (Floor {f+1})'
            floors_data.append(upper)
            continue
        floors_data.append(floor_rooms)

    # ── Cost estimate ─────────────────────────────────────────
    cost_per_sqft = config['cost_sqft']
    total_build   = build_area * floors
    cost_base     = total_build * cost_per_sqft
    cost_breakdown = {
        'construction': round(cost_base * 0.65, 2),
        'materials':    round(cost_base * 0.20, 2),
        'interior':     round(cost_base * 0.10, 2),
        'misc':         round(cost_base * 0.05, 2),
    }

    return {
        'floors':         floors_data,
        'total_area':     round(total_area, 1),
        'build_area':     round(build_area, 1),
        'parking_area':   round(parking_area, 1),
        'open_area':      round(open_area, 1),
        'estimated_cost': round(cost_base, 2),
        'cost_breakdown': cost_breakdown,
        'plot_width':     plot_width,
        'plot_length':    plot_length,
        'num_floors':     floors,
    }


# ─────────────────────────────────────────────────────────────
# AUTH ROUTES
# ─────────────────────────────────────────────────────────────

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not all(k in data for k in ['username', 'email', 'password']):
        return jsonify({'error': 'Username, email and password required'}), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 409
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already taken'}), 409
    user = User(username=data['username'], email=data['email'],
                first_name=data.get('first_name', ''), last_name=data.get('last_name', ''))
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    token = create_access_token(identity=str(user.id))
    return jsonify({'message': 'Registered successfully', 'token': token, 'user': user.to_dict()}), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    user = User.query.filter_by(email=data.get('email', '')).first()
    if not user or not user.check_password(data.get('password', '')):
        return jsonify({'error': 'Invalid email or password'}), 401
    token = create_access_token(identity=str(user.id))
    return jsonify({'token': token, 'user': user.to_dict()})


@app.route('/api/auth/profile', methods=['GET'])
@jwt_required()
def get_profile():
    uid  = int(get_jwt_identity())
    user = User.query.get_or_404(uid)
    return jsonify(user.to_dict())


@app.route('/api/auth/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    uid  = int(get_jwt_identity())
    user = User.query.get_or_404(uid)
    data = request.get_json()
    if 'first_name' in data: user.first_name = data['first_name']
    if 'last_name'  in data: user.last_name  = data['last_name']
    db.session.commit()
    return jsonify(user.to_dict())


# ─────────────────────────────────────────────────────────────
# PROJECT ROUTES
# ─────────────────────────────────────────────────────────────

@app.route('/api/projects', methods=['GET'])
@jwt_required()
def list_projects():
    uid = int(get_jwt_identity())
    projects = Project.query.filter_by(user_id=uid).order_by(Project.updated_at.desc()).all()
    return jsonify([p.to_dict() for p in projects])


@app.route('/api/projects', methods=['POST'])
@jwt_required()
def create_project():
    uid  = int(get_jwt_identity())
    data = request.get_json()
    if not data or not data.get('name') or not data.get('building_type'):
        return jsonify({'error': 'Name and building_type required'}), 400

    pw          = float(data.get('plot_width', 50))
    pl          = float(data.get('plot_length', 50))
    parking     = int(data.get('parking_spaces', 2))
    open_pct    = float(data.get('open_space_percentage', 20))
    floors      = int(data.get('number_of_floors', 1))
    target_rooms = int(data.get('number_of_rooms', 0)) or None

    fp = generate_floor_plan(pw, pl, data['building_type'], parking, open_pct, floors, target_rooms)

    project = Project(
        user_id=uid, name=data['name'], description=data.get('description', ''),
        building_type=data['building_type'],
        plot_width=pw, plot_length=pl, plot_area=round(pw * pl, 1),
        plot_shape=data.get('plot_shape', 'rectangular'),
        parking_spaces=parking, open_space_percentage=open_pct,
        number_of_floors=floors, color_theme=data.get('color_theme', 'modern'),
        floor_plan_data=json.dumps(fp), budget_estimate=fp['estimated_cost'],
    )
    db.session.add(project)
    db.session.commit()
    return jsonify(project.to_dict()), 201


@app.route('/api/projects/<int:pid>', methods=['GET'])
@jwt_required()
def get_project(pid):
    uid = int(get_jwt_identity())
    p   = Project.query.filter_by(id=pid, user_id=uid).first_or_404()
    return jsonify(p.to_dict())


@app.route('/api/projects/<int:pid>', methods=['PUT'])
@jwt_required()
def update_project(pid):
    uid  = int(get_jwt_identity())
    p    = Project.query.filter_by(id=pid, user_id=uid).first_or_404()
    data = request.get_json()

    for field in ['name', 'description', 'building_type', 'plot_shape', 'color_theme']:
        if field in data: setattr(p, field, data[field])
    for field in ['plot_width', 'plot_length', 'open_space_percentage']:
        if field in data: setattr(p, field, float(data[field]))
    for field in ['parking_spaces', 'number_of_floors']:
        if field in data: setattr(p, field, int(data[field]))

    target_rooms = int(data['number_of_rooms']) if 'number_of_rooms' in data else None

    regen_fields = {'plot_width', 'plot_length', 'parking_spaces',
                    'open_space_percentage', 'number_of_floors', 'building_type', 'number_of_rooms'}
    if any(f in data for f in regen_fields):
        fp = generate_floor_plan(p.plot_width, p.plot_length, p.building_type,
                                 p.parking_spaces, p.open_space_percentage,
                                 p.number_of_floors, target_rooms)
        p.floor_plan_data = json.dumps(fp)
        p.budget_estimate = fp['estimated_cost']
        p.plot_area       = round(p.plot_width * p.plot_length, 1)

    p.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(p.to_dict())


@app.route('/api/projects/<int:pid>', methods=['DELETE'])
@jwt_required()
def delete_project(pid):
    uid = int(get_jwt_identity())
    p   = Project.query.filter_by(id=pid, user_id=uid).first_or_404()
    db.session.delete(p)
    db.session.commit()
    return jsonify({'message': 'Project deleted'})


# ─────────────────────────────────────────────────────────────
# AI / UTILITY ROUTES
# ─────────────────────────────────────────────────────────────

@app.route('/api/ai/generate-layout', methods=['POST'])
@jwt_required()
def api_generate_layout():
    data         = request.get_json()
    pw           = float(data.get('plot_width', 50))
    pl           = float(data.get('plot_length', 50))
    bt           = data.get('building_type', 'house')
    parking      = int(data.get('parking_spaces', 2))
    open_pct     = float(data.get('open_space_percentage', 20))
    floors       = int(data.get('number_of_floors', 1))
    target_rooms = int(data.get('number_of_rooms', 0)) or None
    fp = generate_floor_plan(pw, pl, bt, parking, open_pct, floors, target_rooms)
    return jsonify({'status': 'success', 'floor_plan': fp})


@app.route('/api/ai/color-recommendations', methods=['POST'])
@jwt_required()
def api_color_recommendations():
    data  = request.get_json()
    theme = data.get('color_theme', 'modern')
    results = [
        {'name': name.capitalize(), 'palette': palette, 'recommended': name == theme}
        for name, palette in COLOR_PALETTES.items()
    ]
    return jsonify({'palettes': results})


@app.route('/api/ai/budget-estimate', methods=['POST'])
@jwt_required()
def api_budget_estimate():
    data    = request.get_json()
    bt      = data.get('building_type', 'house')
    area    = float(data.get('plot_area', 1000))
    floors  = int(data.get('number_of_floors', 1))
    quality = data.get('quality', 'standard')
    config  = BUILDING_CONFIGS.get(bt, {'cost_sqft': 150})
    multiplier = {'premium': 1.5, 'standard': 1.0, 'budget': 0.7}.get(quality, 1.0)
    base   = area * config['cost_sqft'] * floors * multiplier
    return jsonify({
        'construction': round(base * 0.65, 2),
        'materials':    round(base * 0.20, 2),
        'interior':     round(base * 0.10, 2),
        'misc':         round(base * 0.05, 2),
        'total':        round(base, 2),
    })


@app.route('/api/ai/safety-suggestions', methods=['POST'])
@jwt_required()
def api_safety():
    data = request.get_json()
    bt   = data.get('building_type', 'house')
    base = [
        "Ensure emergency exits are clearly marked",
        "Maintain minimum hallway width of 3 feet",
        "Install fire safety equipment per local codes",
        "Proper ventilation in all rooms",
    ]
    extra = {
        'hotel':      ["Sprinkler systems required", "Emergency evacuation plans on every floor"],
        'mall':       ["Fire suppression systems", "Multiple emergency exits on every level"],
        'restaurant': ["Kitchen fire suppression hood", "Proper grease trap installation"],
        'office':     ["Backup power supply", "Cable management for safety"],
        'house':      ["GFCI outlets in wet areas", "Carbon monoxide detectors on each floor"],
        'apartment':  ["GFCI outlets in wet areas", "Carbon monoxide detectors on each floor"],
    }
    return jsonify({'suggestions': base + extra.get(bt, [])})


@app.route('/api/ai/room-suggestions', methods=['POST'])
@jwt_required()
def api_room_suggestions():
    """Return default room list for a building type so the frontend can preview."""
    data = request.get_json()
    bt   = data.get('building_type', 'house')
    cfg  = BUILDING_CONFIGS.get(bt, BUILDING_CONFIGS['house'])
    rooms = [{'type': r[0], 'label': r[0].replace('_', ' ').title()} for r in cfg['rooms']]
    return jsonify({'rooms': rooms, 'default_count': len(rooms)})


# ─────────────────────────────────────────────────────────────
# FRONTEND SERVE
# ─────────────────────────────────────────────────────────────

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("✅ Database initialized")
        print("🚀 Archivision AI running at http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
