// ===== DREAMNEST AI — ISOMETRIC FLOOR PLAN ENGINE =====

const ISO = {
  TW: 72, TH: 36,
  zoom: 1,
  wireframe: false,
  selectedIdx: -1,
  dragging: false,
  dragStart: null,
  rooms: [],
  canvas: null,
  ctx: null,
  cx: 0, cy: 0,
};

const ROOM_PALETTE = {
  'Living Room': { top:'#e8dcc8', left:'#c8b89a', right:'#d4c4a8', wall:'#f2ece0', wallL:'#d4c8b0', wallR:'#e0d4bc', fur:'#9b8ea8' },
  'Bedroom':     { top:'#c8d8e8', left:'#9ab8c8', right:'#adc4d8', wall:'#dce8f4', wallL:'#b0c8da', wallR:'#c4d8ea', fur:'#6a90b4' },
  'Master Bedroom':{ top:'#cce0f0', left:'#9ac0d8', right:'#b0cee0', wall:'#dceef8', wallL:'#b4cede', wallR:'#c8dcea', fur:'#5a80a4' },
  'Kitchen':     { top:'#d4e8c8', left:'#aac89a', right:'#bdd4a8', wall:'#e4f2d8', wallL:'#c0d8aa', wallR:'#d0e4b8', fur:'#b8905a' },
  'Bathroom':    { top:'#e8e4dc', left:'#c4c0b8', right:'#d4d0c8', wall:'#f0ece4', wallL:'#d0ccc4', wallR:'#e0dcd4', fur:'#f0f0f0' },
  'Dining':      { top:'#e0dcc0', left:'#c0bc98', right:'#d0cc a8', wall:'#ece8cc', wallL:'#ccC8a8', wallR:'#dcd8b8', fur:'#9a9870' },
  'Study':       { top:'#d0e0cc', left:'#a8c4a4', right:'#bcd0b8', wall:'#dcecd8', wallL:'#b8c8b4', wallR:'#c8d8c4', fur:'#7a9870' },
  'Garden':      { top:'#b8d8a0', left:'#88b870', right:'#a0c888', wall:'#c8e8b0', wallL:'#98c880', wallR:'#b0d898', fur:'#5a9850' },
  'Parking':     { top:'#c8c8c0', left:'#a8a8a0', right:'#b8b8b0', wall:'#d8d8d0', wallL:'#b8b8b0', wallR:'#c8c8c0', fur:'#888880' },
};

function getPalette(name) {
  for (const key of Object.keys(ROOM_PALETTE)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return ROOM_PALETTE[key];
  }
  return ROOM_PALETTE['Living Room'];
}

function toIso(col, row, z) {
  z = z || 0;
  const tw = ISO.TW / 2 * ISO.zoom;
  const th = ISO.TH / 2 * ISO.zoom;
  return {
    x: ISO.cx + (col - row) * tw,
    y: ISO.cy + (col + row) * th - z * ISO.TH * ISO.zoom
  };
}

function initIsometric() {
  ISO.canvas = document.getElementById('isoCanvas');
  if (!ISO.canvas) return;
  ISO.canvas.width  = ISO.canvas.parentElement.clientWidth || 700;
  ISO.canvas.height = 520;
  ISO.cx = ISO.canvas.width / 2;
  ISO.cy = ISO.canvas.height * 0.38;
  ISO.ctx = ISO.canvas.getContext('2d');

  // Default rooms matching reference image
  ISO.rooms = [
    { name:'Living Room',    col:0, row:0, w:3.5, d:3.5, h:1.0 },
    { name:'Kitchen',        col:3.7, row:0, w:2.8, d:2.5, h:1.0 },
    { name:'Dining',         col:3.7, row:2.7, w:2.8, d:2.0, h:1.0 },
    { name:'Master Bedroom', col:3.7, row:5.0, w:2.8, d:2.5, h:1.0 },
    { name:'Bathroom',       col:0, row:3.7, w:2.5, d:3.0, h:1.0 },
    { name:'Bedroom',        col:2.7, row:5.0, w:2.8, d:2.5, h:1.0 },
    { name:'Study',          col:0, row:7.0, w:6.5, d:1.2, h:0.6 },
  ];

  drawIso();
  updateRoomList();
  bindEvents();
}

function drawIso() {
  const ctx = ISO.ctx;
  const W = ISO.canvas.width, H = ISO.canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#16162a');
  bg.addColorStop(1, '#0a0a14');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Ambient grid dots
  ctx.fillStyle = 'rgba(124,58,237,0.06)';
  for (let i = 0; i < W; i += 30) {
    for (let j = 0; j < H; j += 30) {
      ctx.fillRect(i, j, 1, 1);
    }
  }

  // Sort rooms back-to-front (painter's algorithm)
  const sorted = [...ISO.rooms].map((r,i) => ({...r, idx:i}))
    .sort((a,b) => (a.col + a.row + a.d/2 + a.w/2) - (b.col + b.row + b.d/2 + b.w/2));

  sorted.forEach(room => drawRoom(room, room.idx));

  // Walls around entire plan
  drawBoundaryWalls();
}

function drawRoom(room, idx) {
  const ctx = ISO.ctx;
  const pal = getPalette(room.name);
  const sel = idx === ISO.selectedIdx;
  const c = room.col, r = room.row, w = room.w, d = room.d, h = room.h;
  const tw = ISO.TW / 2 * ISO.zoom;
  const th = ISO.TH / 2 * ISO.zoom;
  const wallH = h * ISO.TH * ISO.zoom;

  // 4 corners of the top face
  const tl = toIso(c,     r,     h);
  const tr = toIso(c + w, r,     h);
  const br = toIso(c + w, r + d, h);
  const bl = toIso(c,     r + d, h);
  const bbl = toIso(c,    r + d, 0);
  const bbr = toIso(c+w,  r + d, 0);

  if (ISO.wireframe) {
    ctx.strokeStyle = sel ? '#fff' : 'rgba(124,58,237,0.6)';
    ctx.lineWidth = sel ? 2 : 0.8;
    ctx.beginPath();
    [tl,tr,br,bl].forEach((p,i) => i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));
    ctx.closePath(); ctx.stroke();
    return;
  }

  // ── Left wall (bottom-left face)
  ctx.beginPath();
  ctx.moveTo(bl.x, bl.y);
  ctx.lineTo(tl.x, tl.y);
  ctx.lineTo(tl.x - 0, tl.y + wallH);
  ctx.lineTo(bbl.x, bbl.y);
  ctx.closePath();
  ctx.fillStyle = sel ? lighten(pal.wallL, 20) : pal.wallL;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 0.6; ctx.stroke();

  // ── Right wall (bottom-right face)
  ctx.beginPath();
  ctx.moveTo(br.x, br.y);
  ctx.lineTo(tr.x, tr.y);
  ctx.lineTo(tr.x, tr.y + wallH);
  ctx.lineTo(bbr.x, bbr.y);
  ctx.closePath();
  ctx.fillStyle = sel ? lighten(pal.wallR, 15) : pal.wallR;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.stroke();

  // ── Top face (floor of room)
  ctx.beginPath();
  ctx.moveTo(tl.x, tl.y);
  ctx.lineTo(tr.x, tr.y);
  ctx.lineTo(br.x, br.y);
  ctx.lineTo(bl.x, bl.y);
  ctx.closePath();

  // Floor texture gradient
  const flGrad = ctx.createLinearGradient(tl.x, tl.y, br.x, br.y);
  flGrad.addColorStop(0, sel ? lighten(pal.top, 25) : pal.top);
  flGrad.addColorStop(1, sel ? lighten(pal.left, 20) : pal.left);
  ctx.fillStyle = flGrad;
  ctx.fill();
  ctx.strokeStyle = sel ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.12)';
  ctx.lineWidth = sel ? 2 : 0.5;
  ctx.stroke();

  // Selection glow
  if (sel) {
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // ── Furniture (simple shapes on floor)
  drawFurniture(ctx, room, pal);

  // ── Room label
  const midX = (tl.x + tr.x + br.x + bl.x) / 4;
  const midY = (tl.y + tr.y + br.y + bl.y) / 4 - wallH * 0.6;
  ctx.font = `bold ${Math.max(9, 11 * ISO.zoom)}px system-ui`;
  ctx.textAlign = 'center';
  ctx.fillStyle = sel ? '#fff' : 'rgba(40,30,60,0.85)';
  ctx.fillText(room.name.toUpperCase(), midX, midY);
  ctx.font = `${Math.max(8, 9 * ISO.zoom)}px system-ui`;
  ctx.fillStyle = sel ? 'rgba(255,255,255,0.7)' : 'rgba(40,30,60,0.55)';
  const sqft = Math.round(room.w * room.d * 100);
  ctx.fillText(`~${sqft} sq.ft`, midX, midY + 13 * ISO.zoom);
}

function drawFurniture(ctx, room, pal) {
  const name = room.name.toLowerCase();
  const c = room.col, r = room.row, w = room.w, d = room.d, h = room.h;

  function miniBox(dc, dr, bw, bd, bh, color) {
    const tw = ISO.TW / 2 * ISO.zoom;
    const th = ISO.TH / 2 * ISO.zoom;
    const bH = bh * ISO.TH * ISO.zoom;
    const p = toIso(c + dc + bw/2, r + dr + bd/2, h);

    // top
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - th * bd);
    ctx.lineTo(p.x + tw * bw, p.y);
    ctx.lineTo(p.x, p.y + th * bd);
    ctx.lineTo(p.x - tw * bw, p.y);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 0.5; ctx.stroke();

    // left
    ctx.beginPath();
    ctx.moveTo(p.x - tw * bw, p.y);
    ctx.lineTo(p.x, p.y + th * bd);
    ctx.lineTo(p.x, p.y + th * bd + bH);
    ctx.lineTo(p.x - tw * bw, p.y + bH);
    ctx.closePath();
    ctx.fillStyle = darken(color, 20);
    ctx.fill(); ctx.stroke();

    // right
    ctx.beginPath();
    ctx.moveTo(p.x, p.y + th * bd);
    ctx.lineTo(p.x + tw * bw, p.y);
    ctx.lineTo(p.x + tw * bw, p.y + bH);
    ctx.lineTo(p.x, p.y + th * bd + bH);
    ctx.closePath();
    ctx.fillStyle = darken(color, 10);
    ctx.fill(); ctx.stroke();
  }

  function circle(dc, dr, size, color) {
    const p = toIso(c + dc, r + dr, h + 0.05);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, size * ISO.zoom, size * 0.5 * ISO.zoom, 0, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 0.5; ctx.stroke();
  }

  if (name.includes('living')) {
    // Sofa
    miniBox(0.2, d*0.55, w*0.6, d*0.2, 0.35, '#9b8ea8');
    miniBox(0.2, d*0.5, w*0.6, d*0.08, 0.5, '#8a7a98'); // back
    // Coffee table
    miniBox(w*0.25, d*0.25, w*0.35, d*0.2, 0.15, '#c8a87a');
    // Armchair
    miniBox(w*0.75, d*0.1, w*0.2, d*0.2, 0.4, '#e8b0a0');
    // Round rug
    circle(w*0.45, d*0.55, 20, 'rgba(140,100,180,0.3)');
    // TV stand
    miniBox(w*0.1, d*0.05, w*0.5, d*0.1, 0.2, '#555');
  } else if (name.includes('kitchen')) {
    // Counter
    miniBox(0.1, 0.1, w*0.85, d*0.22, 0.5, '#e0dbd0');
    // Island
    miniBox(w*0.2, d*0.45, w*0.55, d*0.2, 0.45, '#ccc8bc');
    // Fridge
    miniBox(w*0.78, 0.1, w*0.18, d*0.25, 1.1, '#f0f0f0');
    // Sink
    miniBox(w*0.35, 0.12, w*0.2, d*0.17, 0.52, '#b8b8c8');
  } else if (name.includes('dining')) {
    // Table
    miniBox(w*0.15, d*0.15, w*0.65, d*0.6, 0.25, '#c4905a');
    // Chairs
    miniBox(w*0.12, d*0.18, w*0.18, d*0.18, 0.35, '#a07045');
    miniBox(w*0.65, d*0.18, w*0.18, d*0.18, 0.35, '#a07045');
    miniBox(w*0.12, d*0.6,  w*0.18, d*0.18, 0.35, '#a07045');
    miniBox(w*0.65, d*0.6,  w*0.18, d*0.18, 0.35, '#a07045');
  } else if (name.includes('bedroom')) {
    // Bed
    miniBox(w*0.1, d*0.15, w*0.78, d*0.6, 0.4, '#8ab0d4');
    miniBox(w*0.12, d*0.17, w*0.28, d*0.15, 0.55, '#f0f0f0'); // pillow L
    miniBox(w*0.55, d*0.17, w*0.28, d*0.15, 0.55, '#f0f0f0'); // pillow R
    // Wardrobe
    miniBox(w*0.75, d*0.15, w*0.2, d*0.7, 1.2, '#c8a870');
    // Bedside table
    miniBox(w*0.05, d*0.4, w*0.14, d*0.18, 0.35, '#c8a870');
    // Rug
    circle(w*0.45, d*0.8, 22, 'rgba(80,150,100,0.35)');
  } else if (name.includes('bathroom')) {
    // Bathtub
    miniBox(w*0.08, d*0.1, w*0.55, d*0.42, 0.4, '#f4f0ec');
    // Toilet
    miniBox(w*0.7, d*0.08, w*0.25, d*0.3, 0.5, '#f0eee8');
    // Sink
    miniBox(w*0.7, d*0.55, w*0.25, d*0.2, 0.45, '#e8e4e0');
    // Mat
    circle(w*0.4, d*0.75, 14, 'rgba(100,180,140,0.4)');
  } else if (name.includes('study')) {
    miniBox(w*0.05, d*0.1, w*0.45, d*0.6, 0.45, '#6a7a8a'); // desk
    miniBox(w*0.12, d*0.15, w*0.3, d*0.5, 0.15, '#aab4be');  // monitor
    miniBox(w*0.6, d*0.1, w*0.35, d*0.75, 1.0, '#5a4a3a');   // bookshelf
  } else if (name.includes('garden')) {
    // Shrubs
    circle(w*0.2, d*0.3, 14, 'rgba(60,140,60,0.6)');
    circle(w*0.6, d*0.3, 12, 'rgba(60,160,60,0.5)');
    circle(w*0.4, d*0.6, 10, 'rgba(80,180,80,0.5)');
    miniBox(w*0.75, d*0.1, w*0.18, d*0.3, 0.35, '#8a7060');
  }
}

function drawBoundaryWalls() {
  if (ISO.rooms.length === 0) return;
  // Subtle outer border
  const tw = ISO.TW / 2 * ISO.zoom;
  const th = ISO.TH / 2 * ISO.zoom;
  const maxC = Math.max(...ISO.rooms.map(r => r.col + r.w)) + 0.3;
  const maxR = Math.max(...ISO.rooms.map(r => r.row + r.d)) + 0.3;

  const corners = [
    toIso(-0.3, -0.3, 0),
    toIso(maxC,  -0.3, 0),
    toIso(maxC,  maxR, 0),
    toIso(-0.3,  maxR, 0),
  ];
  ISO.ctx.beginPath();
  corners.forEach((p, i) => i === 0 ? ISO.ctx.moveTo(p.x, p.y) : ISO.ctx.lineTo(p.x, p.y));
  ISO.ctx.closePath();
  ISO.ctx.strokeStyle = 'rgba(124,58,237,0.25)';
  ISO.ctx.lineWidth = 1.5;
  ISO.ctx.setLineDash([6, 4]);
  ISO.ctx.stroke();
  ISO.ctx.setLineDash([]);
}

// ── Colour helpers
function hexToRgb(hex) {
  hex = hex.replace('#','');
  return [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
}
function lighten(hex, amt) {
  const [r,g,b] = hexToRgb(hex);
  return `rgb(${Math.min(255,r+amt)},${Math.min(255,g+amt)},${Math.min(255,b+amt)})`;
}
function darken(hex, amt) {
  if (hex.startsWith('rgb')) return hex;
  const [r,g,b] = hexToRgb(hex);
  return `rgb(${Math.max(0,r-amt)},${Math.max(0,g-amt)},${Math.max(0,b-amt)})`;
}

// ── Interactions
function bindEvents() {
  const canvas = ISO.canvas;
  canvas.addEventListener('click', onCanvasClick);
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
}

function screenToGrid(mx, my) {
  // Approximate inverse isometric projection
  const tw = ISO.TW / 2 * ISO.zoom;
  const th = ISO.TH / 2 * ISO.zoom;
  const dx = mx - ISO.cx;
  const dy = my - ISO.cy;
  const col = (dx / tw + dy / th) / 2;
  const row = (dy / th - dx / tw) / 2;
  return { col, row };
}

function onCanvasClick(e) {
  const rect = ISO.canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const { col, row } = screenToGrid(mx, my);
  let hit = -1;
  ISO.rooms.forEach((room, idx) => {
    if (col >= room.col && col <= room.col + room.w &&
        row >= room.row && row <= room.row + room.d) {
      hit = idx;
    }
  });
  ISO.selectedIdx = (hit === ISO.selectedIdx) ? -1 : hit;
  if (hit >= 0) showSelectedPanel(hit);
  else hideSelectedPanel();
  drawIso();
}

let dragRoom = null, dragStartGrid = null, dragOrigPos = null;
function onMouseDown(e) {
  const rect = ISO.canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const { col, row } = screenToGrid(mx, my);
  ISO.rooms.forEach((room, idx) => {
    if (col >= room.col && col <= room.col + room.w &&
        row >= room.row && row <= room.row + room.d) {
      dragRoom = idx;
      dragStartGrid = { col, row };
      dragOrigPos = { col: room.col, row: room.row };
    }
  });
}
function onMouseMove(e) {
  if (dragRoom === null) return;
  const rect = ISO.canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const { col, row } = screenToGrid(mx, my);
  const dc = col - dragStartGrid.col;
  const dr = row - dragStartGrid.row;
  ISO.rooms[dragRoom].col = Math.max(0, Math.round((dragOrigPos.col + dc) * 2) / 2);
  ISO.rooms[dragRoom].row = Math.max(0, Math.round((dragOrigPos.row + dr) * 2) / 2);
  drawIso();
}
function onMouseUp() { dragRoom = null; updateRoomList(); }
function onWheel(e) {
  e.preventDefault();
  ISO.zoom = Math.max(0.4, Math.min(2.2, ISO.zoom + (e.deltaY < 0 ? 0.1 : -0.1)));
  drawIso();
}

function showSelectedPanel(idx) {
  const room = ISO.rooms[idx];
  document.getElementById('sel-title').textContent = room.name;
  document.getElementById('sel-w').value = room.w;
  document.getElementById('sel-d').value = room.d;
  document.getElementById('sel-h').value = room.h;
  document.getElementById('selected-panel').style.display = '';
}
function hideSelectedPanel() {
  document.getElementById('selected-panel').style.display = 'none';
}
function updateSelected(prop, val) {
  if (ISO.selectedIdx < 0) return;
  ISO.rooms[ISO.selectedIdx][prop] = parseFloat(val);
  drawIso(); updateRoomList();
}
function deleteSelected() {
  if (ISO.selectedIdx < 0) return;
  ISO.rooms.splice(ISO.selectedIdx, 1);
  ISO.selectedIdx = -1;
  hideSelectedPanel();
  drawIso(); updateRoomList();
}

function updateRoomList() {
  const el = document.getElementById('room-list');
  if (!el) return;
  el.innerHTML = ISO.rooms.map((r,i) => {
    const pal = getPalette(r.name);
    return `<div style="display:flex;align-items:center;gap:.5rem;padding:.4rem .3rem;border-bottom:1px solid var(--border);cursor:pointer;border-radius:6px;transition:.15s"
                 onclick="selectRoomFromList(${i})"
                 onmouseenter="this.style.background='var(--bg3)'"
                 onmouseleave="this.style.background=''">
      <div style="width:12px;height:12px;border-radius:3px;background:${pal.top};border:1px solid ${pal.left};flex-shrink:0"></div>
      <span style="font-size:.82rem;flex:1">${r.name}</span>
      <span style="font-size:.72rem;color:var(--text3)">${Math.round(r.w*r.d*100)}ft²</span>
    </div>`;
  }).join('');
  const infoRooms = document.getElementById('info-rooms');
  const infoArea  = document.getElementById('info-area');
  if (infoRooms) infoRooms.textContent = ISO.rooms.length;
  if (infoArea)  infoArea.textContent  = Math.round(ISO.rooms.reduce((a,r)=>a+r.w*r.d,0)*100) + ' sq.ft';
}

function selectRoomFromList(idx) {
  ISO.selectedIdx = idx;
  showSelectedPanel(idx);
  drawIso();
}

// ── Global controls called by HTML
function addRoom(name, color) {
  ISO.rooms.push({ name, col: 0.5, row: 0.5, w: 2, d: 2, h: 1 });
  ISO.selectedIdx = ISO.rooms.length - 1;
  showSelectedPanel(ISO.selectedIdx);
  drawIso(); updateRoomList();
  showToast('Room "' + name + '" added — drag to position it');
}
function resetPlan() {
  ISO.zoom = 1;
  ISO.selectedIdx = -1;
  ISO.rooms = [
    { name:'Living Room',    col:0, row:0, w:3.5, d:3.5, h:1.0 },
    { name:'Kitchen',        col:3.7, row:0, w:2.8, d:2.5, h:1.0 },
    { name:'Dining',         col:3.7, row:2.7, w:2.8, d:2.0, h:1.0 },
    { name:'Master Bedroom', col:3.7, row:5.0, w:2.8, d:2.5, h:1.0 },
    { name:'Bathroom',       col:0, row:3.7, w:2.5, d:3.0, h:1.0 },
    { name:'Bedroom',        col:2.7, row:5.0, w:2.8, d:2.5, h:1.0 },
    { name:'Study',          col:0, row:7.0, w:6.5, d:1.2, h:0.6 },
  ];
  hideSelectedPanel(); drawIso(); updateRoomList();
}
function zoomIn()  { ISO.zoom = Math.min(2.2, ISO.zoom + 0.15); drawIso(); }
function zoomOut() { ISO.zoom = Math.max(0.4, ISO.zoom - 0.15); drawIso(); }
function toggleWire() {
  ISO.wireframe = !ISO.wireframe;
  const btn = document.getElementById('wireBtn');
  if (btn) btn.classList.toggle('active', ISO.wireframe);
  drawIso();
}

// Init on load
window.addEventListener('DOMContentLoaded', initIsometric);
window.addEventListener('resize', () => {
  if (!ISO.canvas) return;
  ISO.canvas.width = ISO.canvas.parentElement.clientWidth || 700;
  ISO.cx = ISO.canvas.width / 2;
  drawIso();
});
