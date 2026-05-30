"""
Archivision AI — Lightweight Render Engine
Produces clean, print-quality 2D floor plan images from layout JSON.
No ML models required — zero GPU needed.

To add AI photo-rendering later, see the optional StableDiffusion section at the bottom.
"""

from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import datetime, math, os, json, logging

logger = logging.getLogger(__name__)

# ─── Visual constants ───────────────────────────────────────
DPI          = 150          # output resolution
SCALE        = 12           # pixels per foot at DPI=150
MARGIN_PX    = 60           # border around the whole plot
WALL_PX      = 3            # wall line thickness in px
FONT_SIZE_L  = 14           # room label font size
FONT_SIZE_S  = 11           # area sub-label font size
BG_COLOR     = (245, 243, 238)   # parchment background
PLOT_BG      = (255, 255, 255)   # white inside plot boundary
WALL_COLOR   = (50,  50,  50)    # near-black walls
TEXT_COLOR   = (40,  40,  40)
SUBTEXT_COLOR= (100, 100, 100)
GRID_COLOR   = (220, 218, 212)   # subtle grid


def hex_to_rgb(h: str) -> tuple:
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def _load_font(size: int):
    """Try system fonts in order; fall back to PIL default."""
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "C:/Windows/Fonts/arial.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()


def _draw_room(draw: ImageDraw.Draw, room: dict, sx: float, sy: float,
               font_l, font_s, margin: int):
    """Draw a single room rectangle with label and area text."""
    rx = margin + room['x'] * sx
    ry = margin + room['y'] * sy
    rw = room['w'] * sx
    rh = room['h'] * sy

    color = hex_to_rgb(room.get('color', '#cccccc'))
    # Slight darken on the fill so walls pop
    fill  = tuple(max(0, c - 8) for c in color)

    # Room fill
    draw.rectangle([rx, ry, rx + rw, ry + rh], fill=fill)

    # Room border (wall)
    draw.rectangle([rx, ry, rx + rw, ry + rh],
                   outline=WALL_COLOR, width=WALL_PX)

    # Labels — only draw if they fit
    label    = room.get('label', room.get('type', ''))
    area_txt = f"{room.get('area', 0):.0f} sq ft"

    pad = 6
    if rw > 40 and rh > 30:
        # Centre label
        try:
            lb = font_l.getbbox(label)
            lw, lh = lb[2] - lb[0], lb[3] - lb[1]
        except AttributeError:
            lw, lh = font_l.getsize(label)

        lx = rx + (rw - lw) / 2
        ly = ry + (rh / 2) - lh - 2

        if lx >= rx + pad and lx + lw <= rx + rw - pad:
            draw.text((lx, ly), label, fill=TEXT_COLOR, font=font_l)

        # Area sub-label
        try:
            ab = font_s.getbbox(area_txt)
            aw, ah = ab[2] - ab[0], ab[3] - ab[1]
        except AttributeError:
            aw, ah = font_s.getsize(area_txt)

        ax = rx + (rw - aw) / 2
        ay = ry + (rh / 2) + 2

        if ax >= rx + pad and ax + aw <= rx + rw - pad and ay + ah <= ry + rh - pad:
            draw.text((ax, ay), area_txt, fill=SUBTEXT_COLOR, font=font_s)


def floor_plan_to_image(floor_plan_json: dict, floor_index: int = 0) -> Image.Image:
    """
    Convert floor plan JSON (from generate_floor_plan) into a clean PNG image.

    Args:
        floor_plan_json: dict returned by generate_floor_plan()
        floor_index: which floor to render (0 = ground)

    Returns:
        PIL.Image.Image ready to save or encode
    """
    pw = float(floor_plan_json.get('plot_width',  60))
    pl = float(floor_plan_json.get('plot_length', 80))

    floors_data = floor_plan_json.get('floors', [])
    if not floors_data:
        rooms = []
    else:
        idx   = min(floor_index, len(floors_data) - 1)
        rooms = floors_data[idx]

    # Canvas size
    sx     = SCALE
    sy     = SCALE
    img_w  = int(pw * sx) + 2 * MARGIN_PX
    img_h  = int(pl * sy) + 2 * MARGIN_PX

    img  = Image.new('RGB', (img_w, img_h), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # ── Subtle grid ───────────────────────────────────────────
    for gx in range(0, int(pw) + 1, 5):
        x = MARGIN_PX + gx * sx
        draw.line([(x, MARGIN_PX), (x, MARGIN_PX + pl * sy)], fill=GRID_COLOR, width=1)
    for gy in range(0, int(pl) + 1, 5):
        y = MARGIN_PX + gy * sy
        draw.line([(MARGIN_PX, y), (MARGIN_PX + pw * sx, y)], fill=GRID_COLOR, width=1)

    # ── Plot background ───────────────────────────────────────
    draw.rectangle(
        [MARGIN_PX, MARGIN_PX, MARGIN_PX + pw * sx, MARGIN_PX + pl * sy],
        fill=PLOT_BG
    )

    # ── Rooms ─────────────────────────────────────────────────
    font_l = _load_font(FONT_SIZE_L)
    font_s = _load_font(FONT_SIZE_S)

    for room in rooms:
        _draw_room(draw, room, sx, sy, font_l, font_s, MARGIN_PX)

    # ── Plot boundary (drawn last so it's on top) ─────────────
    draw.rectangle(
        [MARGIN_PX, MARGIN_PX, MARGIN_PX + pw * sx, MARGIN_PX + pl * sy],
        outline=(20, 20, 20), width=4
    )

    # ── Dimension annotations ─────────────────────────────────
    font_dim = _load_font(11)
    # Width label (top)
    w_lbl = f"{pw:.0f} ft"
    draw.text((MARGIN_PX + pw * sx / 2 - 20, MARGIN_PX - 22),
              w_lbl, fill=(80, 80, 80), font=font_dim)
    # Length label (left, rotated)
    l_img = Image.new('RGBA', (80, 16), (0, 0, 0, 0))
    ld    = ImageDraw.Draw(l_img)
    ld.text((0, 0), f"{pl:.0f} ft", fill=(80, 80, 80), font=font_dim)
    l_rot = l_img.rotate(90, expand=True)
    img.paste(l_rot, (MARGIN_PX - 36, MARGIN_PX + int(pl * sy / 2) - 20), l_rot)

    # ── Legend ────────────────────────────────────────────────
    seen_types = {}
    for r in rooms:
        t = r.get('type', 'unknown')
        if t not in seen_types:
            seen_types[t] = r.get('color', '#cccccc')

    leg_x = MARGIN_PX
    leg_y = MARGIN_PX + int(pl * sy) + 12
    font_leg = _load_font(10)

    for rtype, color in list(seen_types.items())[:8]:   # max 8 legend items
        draw.rectangle([leg_x, leg_y, leg_x + 14, leg_y + 10],
                       fill=hex_to_rgb(color), outline=(80, 80, 80), width=1)
        draw.text((leg_x + 18, leg_y), rtype.replace('_', ' ').title(),
                  fill=(60, 60, 60), font=font_leg)
        leg_x += 120
        if leg_x > img_w - 120:
            leg_x  = MARGIN_PX
            leg_y += 18

    return img


def render_all_floors(floor_plan_json: dict, project_id: int,
                      output_dir: str = None) -> list:
    """
    Render every floor as a separate PNG and save to disk.

    Returns:
        List of dicts with 'floor', 'path', 'filename' for each rendered image.
    """
    if output_dir is None:
        output_dir = os.path.join(os.path.dirname(__file__), 'renders')

    project_dir = Path(output_dir) / f"project_{project_id}"
    project_dir.mkdir(parents=True, exist_ok=True)

    floors_data = floor_plan_json.get('floors', [])
    timestamp   = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    results     = []

    for i, _ in enumerate(floors_data):
        img      = floor_plan_to_image(floor_plan_json, floor_index=i)
        label    = "Ground_Floor" if i == 0 else f"Floor_{i + 1}"
        filename = f"{label}_{timestamp}.png"
        filepath = project_dir / filename
        img.save(filepath, 'PNG', dpi=(DPI, DPI))
        logger.info(f"Saved: {filepath} ({img.size})")
        results.append({
            'floor':    i,
            'label':    label.replace('_', ' '),
            'filename': filename,
            'path':     str(filepath),
            'url':      f"/renders/project_{project_id}/{filename}",
            'size':     f"{img.size[0]}x{img.size[1]}",
        })

    return results


def floor_plan_to_base64(floor_plan_json: dict, floor_index: int = 0) -> str:
    """Return a base64-encoded PNG string — handy for sending to the frontend."""
    import io, base64
    img    = floor_plan_to_image(floor_plan_json, floor_index)
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    return base64.b64encode(buffer.getvalue()).decode('utf-8')


# ─── Singleton ───────────────────────────────────────────────

_engine_instance = None

class RenderEngine:
    """Thin wrapper kept for API compatibility with existing routes."""

    def __init__(self, renders_dir: str = None):
        self.renders_dir = renders_dir or os.path.join(os.path.dirname(__file__), 'renders')
        Path(self.renders_dir).mkdir(parents=True, exist_ok=True)

    def full_pipeline(self, floor_plan_json: dict, project_id: int, **kwargs) -> dict:
        results = render_all_floors(floor_plan_json, project_id, self.renders_dir)
        if not results:
            return {'error': 'No floors to render'}
        first = results[0]
        return {
            'render_path':  first['path'],
            'render_url':   first['url'],
            'all_floors':   results,
            'resolution':   first['size'],
            'plot_width':   floor_plan_json.get('plot_width'),
            'plot_length':  floor_plan_json.get('plot_length'),
        }

    def floor_plan_to_base64(self, floor_plan_json: dict, floor_index: int = 0) -> str:
        return floor_plan_to_base64(floor_plan_json, floor_index)


def get_engine() -> RenderEngine:
    global _engine_instance
    if _engine_instance is None:
        renders_dir       = os.path.join(os.path.dirname(__file__), 'renders')
        _engine_instance  = RenderEngine(renders_dir=renders_dir)
    return _engine_instance


# ─── Quick test ──────────────────────────────────────────────
if __name__ == '__main__':
    import sys
    sys.path.insert(0, os.path.dirname(__file__))
    from app import generate_floor_plan

    fp  = generate_floor_plan(60, 80, 'house', 2, 20, 2)
    out = render_all_floors(fp, project_id=0, output_dir='./test_renders')
    for r in out:
        print(f"  {r['label']}: {r['path']} ({r['size']})")
