"""
Archivision AI — AI Service
Utility methods for layout analysis, recommendations, and suggestions.
All heavy computation lives in app.py's generate_floor_plan().
This module adds value-add features on top.
"""

import math
import random
from config import ROOM_SIZES, COLOR_PALETTES, BUILDING_TYPES


class AIService:

    # ── Space utilization analysis ────────────────────────────

    @staticmethod
    def analyze_space(floor_plan: dict) -> dict:
        """
        Analyze a generated floor plan and return utilization metrics
        plus actionable improvement suggestions.
        """
        total_area = floor_plan.get('total_area', 1)
        build_area = floor_plan.get('build_area', 0)
        open_area  = floor_plan.get('open_area', 0)
        park_area  = floor_plan.get('parking_area', 0)

        build_pct  = round(build_area / total_area * 100, 1)
        open_pct   = round(open_area  / total_area * 100, 1)
        park_pct   = round(park_area  / total_area * 100, 1)

        # Room-level analysis
        all_rooms = []
        for floor in floor_plan.get('floors', []):
            all_rooms.extend(floor)

        rooms_excl_service = [r for r in all_rooms
                               if r['type'] not in ('parking', 'garden', 'stairs', 'hallway')]
        room_area_total = sum(r['area'] for r in rooms_excl_service)

        suggestions = []
        if build_pct < 50:
            suggestions.append("Build area is under 50% — consider reducing open space or adding a floor.")
        if build_pct > 85:
            suggestions.append("Build area exceeds 85% — local codes may require more open space.")
        if park_pct > 25:
            suggestions.append("Parking takes up >25% of the plot — consider a multi-level car park.")
        if open_pct < 10:
            suggestions.append("Open space is below 10% — consider adding a rooftop garden.")

        # Detect oversized or undersized rooms
        for r in rooms_excl_service:
            if r['type'] in ROOM_SIZES:
                lo, hi = ROOM_SIZES[r['type']]
                if r['area'] < lo:
                    suggestions.append(f"{r['label']} ({r['area']:.0f} sq ft) is below minimum — consider enlarging.")
                elif r['area'] > hi:
                    suggestions.append(f"{r['label']} ({r['area']:.0f} sq ft) is oversized — you may reclaim space.")

        return {
            'build_pct':       build_pct,
            'open_pct':        open_pct,
            'park_pct':        park_pct,
            'room_count':      len(rooms_excl_service),
            'room_area_total': round(room_area_total, 1),
            'suggestions':     suggestions[:5],   # cap at 5
        }

    # ── Color recommendations ─────────────────────────────────

    @staticmethod
    def get_color_recommendations(building_type: str, preference: str = 'modern') -> list:
        """
        Return top-3 color palette recommendations.
        Preferred palette always scores 100; others scored by building-type fit.
        """
        FIT_MATRIX = {
            'house':      ['warm', 'earthy', 'modern'],
            'apartment':  ['modern', 'minimalist', 'cool'],
            'office':     ['cool', 'minimalist', 'modern'],
            'shop':       ['modern', 'cool', 'warm'],
            'restaurant': ['warm', 'earthy', 'modern'],
            'mall':       ['modern', 'cool', 'minimalist'],
            'hotel':      ['warm', 'modern', 'cool'],
            'commercial': ['modern', 'cool', 'minimalist'],
        }
        priority = FIT_MATRIX.get(building_type, ['modern', 'warm', 'cool'])

        results = []
        for name, palette in COLOR_PALETTES.items():
            if name == preference:
                score = 100
            elif name in priority:
                score = 85 - priority.index(name) * 5
            else:
                score = random.randint(60, 75)

            results.append({'name': name.capitalize(), 'palette': palette, 'score': score})

        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:3]

    # ── Furniture suggestions ─────────────────────────────────

    @staticmethod
    def suggest_furniture(room_type: str, room_w: float, room_h: float) -> list:
        """
        Return furniture placement suggestions scaled to actual room dimensions.
        All coordinates are in feet relative to the room's top-left corner.
        """
        templates = {
            'bedroom': [
                {'item': 'Bed (Queen)',   'w': 5.0, 'h': 6.7, 'x': 0.5, 'y': 0.5},
                {'item': 'Wardrobe',      'w': 3.0, 'h': 2.0, 'x': None, 'y': 0.5},  # x = right-aligned
                {'item': 'Nightstand',    'w': 1.5, 'h': 1.5, 'x': 5.8, 'y': 1.5},
                {'item': 'Dresser',       'w': 3.0, 'h': 1.5, 'x': 0.5, 'y': None},  # y = bottom-aligned
            ],
            'living_room': [
                {'item': 'Sofa (3-seat)', 'w': 7.5, 'h': 3.0, 'x': 0.5, 'y': 0.5},
                {'item': 'Coffee Table',  'w': 3.5, 'h': 2.0, 'x': 2.0, 'y': 4.0},
                {'item': 'TV Unit',       'w': 5.0, 'h': 1.5, 'x': None, 'y': None},
                {'item': 'Armchair',      'w': 2.5, 'h': 2.5, 'x': 8.5, 'y': 0.5},
            ],
            'kitchen': [
                {'item': 'Counter (L)',   'w': room_w - 1.0, 'h': 2.0, 'x': 0.5, 'y': 0.5},
                {'item': 'Island',        'w': 3.0, 'h': 2.0, 'x': room_w / 2 - 1.5, 'y': 4.0},
                {'item': 'Refrigerator',  'w': 2.5, 'h': 2.5, 'x': 0.5, 'y': 2.8},
            ],
            'office_space': [
                {'item': 'Workstation',   'w': 5.0, 'h': 2.5, 'x': 0.5, 'y': 0.5},
                {'item': 'Office Chair',  'w': 2.0, 'h': 2.0, 'x': 1.5, 'y': 3.0},
                {'item': 'Bookshelf',     'w': 3.0, 'h': 1.0, 'x': None, 'y': 0.5},
                {'item': 'Filing Cabinet','w': 1.5, 'h': 2.0, 'x': None, 'y': 3.0},
            ],
            'dining_area': [
                {'item': 'Dining Table',  'w': 4.0, 'h': 3.0, 'x': room_w / 2 - 2, 'y': room_h / 2 - 1.5},
                {'item': 'Chairs (×6)',   'w': 4.0, 'h': 0.5, 'x': room_w / 2 - 2, 'y': None},
            ],
            'conference_room': [
                {'item': 'Conference Table','w': room_w - 4, 'h': 4.0,
                 'x': 2.0, 'y': room_h / 2 - 2},
                {'item': 'Chairs (×10)',   'w': room_w - 4, 'h': 0.5, 'x': 2.0, 'y': None},
            ],
        }

        items = templates.get(room_type, [])
        result = []
        for item in items:
            x = item['x'] if item['x'] is not None else room_w - item['w'] - 0.5
            y = item['y'] if item['y'] is not None else room_h - item['h'] - 0.5
            x = max(0.2, min(x, room_w - item['w'] - 0.2))
            y = max(0.2, min(y, room_h - item['h'] - 0.2))
            result.append({'item': item['item'], 'x': round(x, 2), 'y': round(y, 2),
                           'w': round(item['w'], 2), 'h': round(item['h'], 2)})
        return result

    # ── Safety suggestions ────────────────────────────────────

    @staticmethod
    def get_safety_suggestions(building_type: str) -> list:
        base = [
            "Ensure emergency exits are clearly marked on all floors.",
            "Maintain minimum hallway width of 3 ft (36 in) per code.",
            "Install fire safety equipment as per local municipal codes.",
            "Ensure adequate cross-ventilation in every habitable room.",
        ]
        extra = {
            'house':      ["GFCI outlets required in kitchen, bathrooms, and exterior.",
                           "Carbon monoxide detectors on every sleeping floor."],
            'apartment':  ["GFCI outlets in wet areas.", "CO detectors on every floor."],
            'hotel':      ["Sprinkler systems on all floors.", "Emergency evacuation plans posted in every room."],
            'mall':       ["Fire suppression systems throughout.", "Multiple clearly-marked emergency exits per level."],
            'restaurant': ["Automatic kitchen fire suppression hood required.",
                           "Grease traps on all cooking drain lines."],
            'office':     ["Backup power for emergency lighting.", "Cable management to prevent trip hazards."],
        }
        return base + extra.get(building_type, [])
