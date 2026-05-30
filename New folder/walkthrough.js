// ===== DREAMNEST AI — WALKTHROUGH ENGINE =====

const WT = {
  x: 3.5, y: 3.5,      // player position (grid units)
  angle: 0,             // facing angle in radians
  room: 'living',
  autoTour: false,
  speed: 5,
  canvas: null, ctx: null,
  minimap: null, mctx: null,
  animId: null,
};

const ROOMS = {
  living:   { label:'🛋️ Living Room',   sky:'#1a0e30', floor:'#3d2b1f', walls:['#2c1440','#1e0e2e','#381a50'], info:'18 × 14 ft · 5 Furniture pieces' },
  kitchen:  { label:'🍳 Kitchen',        sky:'#0e2010', floor:'#2a1e0e', walls:['#1a3010','#122008','#223818'], info:'12 × 10 ft · 6 Furniture pieces' },
  bedroom:  { label:'🛏️ Master Bedroom', sky:'#080e1c', floor:'#1e1408', walls:['#0c1428','#08101e','#101c30'], info:'14 × 12 ft · 7 Furniture pieces' },
  bathroom: { label:'🚿 Bathroom',       sky:'#080f0f', floor:'#c8c8c0', walls:['#0e1a1a','#081212','#101e1e'], info:'8 × 6 ft · 6 Fixtures' },
  outdoor:  { label:'🌿 Garden',         sky:'#050a18', floor:'#1a3a1a', walls:['#050e08','#040a06','#071208'], info:'Open Area · Garden & Patio' },
};

// Simple map (1=wall, 0=open)
const MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,1,1,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,1,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,1,0,0,0,0,0,1],
  [1,0,0,1,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,1,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const FURNITURE_SPRITES = {
  living:   [{x:3,y:5,w:0.9,h:0.5,label:'Sofa',color:'#8a7898'},{x:5,y:3,w:0.6,h:1.0,label:'TV',color:'#111'},{x:7,y:5,w:0.5,h:0.5,label:'Chair',color:'#e8b0a0'}],
  kitchen:  [{x:3,y:2,w:1.5,h:0.4,label:'Counter',color:'#e0dbd0'},{x:9,y:2,w:0.5,h:0.8,label:'Fridge',color:'#f0f0f0'}],
  bedroom:  [{x:5,y:5,w:1.2,h:0.6,label:'Bed',color:'#7090b8'},{x:10,y:3,w:0.5,h:1.5,label:'Wardrobe',color:'#c8a870'}],
  bathroom: [{x:3,y:3,w:1.0,h:0.5,label:'Bathtub',color:'#f0ecea'},{x:9,y:3,w:0.5,h:0.5,label:'Toilet',color:'#f0ecea'}],
  outdoor:  [{x:5,y:7,w:0.3,h:1.2,label:'Tree',color:'#2a7a2a'},{x:9,y:7,w:0.3,h:1.4,label:'Tree',color:'#1a6a1a'}],
};

function initWalkthrough() {
  WT.canvas  = document.getElementById('wtCanvas');
  WT.minimap = document.getElementById('minimap');
  if (!WT.canvas) return;
  WT.canvas.width  = WT.canvas.parentElement.clientWidth || 640;
  WT.canvas.height = 400;
  WT.ctx   = WT.canvas.getContext('2d');
  if (WT.minimap) WT.mctx = WT.minimap.getContext('2d');

  document.addEventListener('keydown', onKey);
  WT.canvas.addEventListener('mousemove', onMouseLook);

  renderFrame();
  drawMinimap();
}

function renderFrame() {
  const ctx = WT.ctx;
  const W = WT.canvas.width, H = WT.canvas.height;
  const rm = ROOMS[WT.room] || ROOMS.living;
  ctx.clearRect(0, 0, W, H);

  // Ceiling
  const ceilG = ctx.createLinearGradient(0, 0, 0, H * 0.5);
  ceilG.addColorStop(0, rm.sky);
  ceilG.addColorStop(1, shadeColor(rm.sky, 30));
  ctx.fillStyle = ceilG;
  ctx.fillRect(0, 0, W, H * 0.5);

  // Floor
  const floorG = ctx.createLinearGradient(0, H * 0.5, 0, H);
  floorG.addColorStop(0, rm.floor);
  floorG.addColorStop(1, '#000');
  ctx.fillStyle = floorG;
  ctx.fillRect(0, H * 0.5, W, H * 0.5);

  // Raycasting
  const FOV = Math.PI / 2.8;
  const RAYS = 120;
  const MAX_DEPTH = 15;

  for (let i = 0; i < RAYS; i++) {
    const rayAngle = WT.angle - FOV / 2 + (i / RAYS) * FOV;
    let dist = 0, hit = false;
    let rx = WT.x, ry = WT.y;
    const dx = Math.cos(rayAngle) * 0.05;
    const dy = Math.sin(rayAngle) * 0.05;

    while (dist < MAX_DEPTH && !hit) {
      rx += dx; ry += dy;
      dist += 0.05;
      const mx = Math.floor(rx), my = Math.floor(ry);
      if (my < 0 || my >= MAP.length || mx < 0 || mx >= MAP[0].length || MAP[my][mx] === 1) hit = true;
    }

    // Fix fish-eye
    const corrDist = dist * Math.cos(rayAngle - WT.angle);
    const wallH = Math.min(H, (H / (corrDist + 0.001)) * 1.5);
    const shade = Math.max(0, Math.min(1, 1 - corrDist / MAX_DEPTH));

    const wallX = (i / RAYS) * W;
    const wallW = W / RAYS + 1;

    // Wall color based on room
    const wallIdx = Math.floor((dist * 3) % rm.walls.length);
    const baseColor = rm.walls[wallIdx] || rm.walls[0];
    ctx.fillStyle = blendColor(baseColor, shade * 0.8);
    ctx.fillRect(wallX, (H - wallH) / 2, wallW, wallH);

    // Wall edge shading
    const edgeG = ctx.createLinearGradient(wallX, 0, wallX + wallW, 0);
    edgeG.addColorStop(0, 'rgba(0,0,0,0.15)');
    edgeG.addColorStop(0.5, 'transparent');
    edgeG.addColorStop(1, 'rgba(0,0,0,0.1)');
    ctx.fillStyle = edgeG;
    ctx.fillRect(wallX, (H - wallH) / 2, wallW, wallH);
  }

  // Furniture sprites (billboard)
  const sprites = FURNITURE_SPRITES[WT.room] || [];
  sprites.forEach(sp => {
    const dx = sp.x - WT.x, dy = sp.y - WT.y;
    const spDist = Math.sqrt(dx * dx + dy * dy);
    if (spDist < 0.5 || spDist > 10) return;

    let spAngle = Math.atan2(dy, dx) - WT.angle;
    while (spAngle < -Math.PI) spAngle += 2 * Math.PI;
    while (spAngle >  Math.PI) spAngle -= 2 * Math.PI;

    const FOV2 = Math.PI / 2.8;
    if (Math.abs(spAngle) > FOV2 / 2) return;

    const spX = (0.5 + spAngle / FOV2) * W;
    const spH = Math.min(H * 1.5, (H / spDist) * sp.h);
    const spW = Math.min(W * 0.4, (W / spDist) * sp.w * 0.5);
    const shade = Math.max(0.2, 1 - spDist / 8);

    ctx.globalAlpha = shade * 0.9;
    ctx.fillStyle = sp.color;
    ctx.fillRect(spX - spW / 2, (H - spH) / 2, spW, spH);

    // Simple sprite shading
    const spG = ctx.createLinearGradient(spX - spW/2, 0, spX + spW/2, 0);
    spG.addColorStop(0,'rgba(0,0,0,0.3)');spG.addColorStop(0.4,'transparent');spG.addColorStop(1,'rgba(0,0,0,0.2)');
    ctx.fillStyle = spG;
    ctx.fillRect(spX - spW/2, (H - spH)/2, spW, spH);
    ctx.globalAlpha = 1;
  });

  // Vignette
  const vig = ctx.createRadialGradient(W/2, H/2, H*0.2, W/2, H/2, H*0.8);
  vig.addColorStop(0, 'transparent');
  vig.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);

  // Crosshair
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(W/2 - 10, H/2); ctx.lineTo(W/2 + 10, H/2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W/2, H/2 - 10); ctx.lineTo(W/2, H/2 + 10); ctx.stroke();

  drawMinimap();
}

function drawMinimap() {
  const mc = WT.mctx;
  if (!mc) return;
  mc.clearRect(0, 0, 100, 100);
  mc.fillStyle = 'rgba(10,10,20,0.85)';
  mc.fillRect(0, 0, 100, 100);
  const cell = 7;
  MAP.forEach((row, r) => {
    row.forEach((tile, c) => {
      mc.fillStyle = tile === 1 ? 'rgba(124,58,237,0.7)' : 'rgba(255,255,255,0.06)';
      mc.fillRect(c * cell, r * cell, cell - 1, cell - 1);
    });
  });
  // Player dot
  const px = WT.x * cell, py = WT.y * cell;
  mc.fillStyle = '#a855f7';
  mc.beginPath(); mc.arc(px, py, 3, 0, Math.PI * 2); mc.fill();
  // Direction arrow
  mc.strokeStyle = '#f0f0f0'; mc.lineWidth = 1.5;
  mc.beginPath(); mc.moveTo(px, py);
  mc.lineTo(px + Math.cos(WT.angle) * 7, py + Math.sin(WT.angle) * 7); mc.stroke();
}

function shadeColor(hex, pct) {
  // Slightly lighten a hex colour
  const v = parseInt(hex.replace('#',''),16);
  const r = Math.min(255, ((v>>16)&0xff) + pct);
  const g = Math.min(255, ((v>>8)&0xff)  + pct);
  const b = Math.min(255, ( v     &0xff) + pct);
  return `rgb(${r},${g},${b})`;
}
function blendColor(hex, light) {
  const v = parseInt(hex.replace('#',''), 16);
  const r = Math.min(255, Math.floor(((v>>16)&0xff) * (0.4 + light * 0.8)));
  const g = Math.min(255, Math.floor(((v>>8)&0xff)  * (0.4 + light * 0.8)));
  const b = Math.min(255, Math.floor(( v     &0xff) * (0.4 + light * 0.8)));
  return `rgb(${r},${g},${b})`;
}

function moveWT(dir) {
  const spd = (parseInt(document.getElementById('speed-slider')?.value || 5)) * 0.008;
  const flashKey = id => {
    const el = document.getElementById('key-' + id);
    if (el) { el.classList.add('active'); setTimeout(() => el.classList.remove('active'), 150); }
  };
  flashKey(dir);

  if (dir === 'w') { WT.x += Math.cos(WT.angle) * spd * 12; WT.y += Math.sin(WT.angle) * spd * 12; }
  if (dir === 's') { WT.x -= Math.cos(WT.angle) * spd * 12; WT.y -= Math.sin(WT.angle) * spd * 12; }
  if (dir === 'a') WT.angle -= spd * 8;
  if (dir === 'd') WT.angle += spd * 8;

  // Boundary clamp
  WT.x = Math.max(1.2, Math.min(MAP[0].length - 1.2, WT.x));
  WT.y = Math.max(1.2, Math.min(MAP.length    - 1.2, WT.y));
  // Wall collision
  if (MAP[Math.floor(WT.y)]?.[Math.floor(WT.x)] === 1) {
    WT.x -= Math.cos(WT.angle) * spd * 14;
    WT.y -= Math.sin(WT.angle) * spd * 14;
  }

  updateCompass();
  renderFrame();
}

function onKey(e) {
  const map = { w:'w', s:'s', a:'a', d:'d', ArrowUp:'w', ArrowDown:'s', ArrowLeft:'a', ArrowRight:'d' };
  if (map[e.key]) { e.preventDefault(); moveWT(map[e.key]); }
}

let lastMouseX = null;
function onMouseLook(e) {
  if (!e.buttons) { lastMouseX = null; return; }
  if (lastMouseX !== null) WT.angle += (e.clientX - lastMouseX) * 0.005;
  lastMouseX = e.clientX;
  updateCompass(); renderFrame();
}

function updateCompass() {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  const normalized = ((WT.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const idx = Math.round(normalized / (Math.PI / 4)) % 8;
  const el = document.getElementById('compass');
  if (el) el.textContent = dirs[idx];
}

function teleport(room) {
  WT.room = room;
  const positions = { living:{x:3.5,y:5,a:4.7}, kitchen:{x:9,y:3,a:3.1}, bedroom:{x:5,y:5,a:1.6}, bathroom:{x:3,y:3,a:0}, outdoor:{x:5,y:8,a:4.7} };
  const pos = positions[room] || positions.living;
  WT.x = pos.x; WT.y = pos.y; WT.angle = pos.a;
  const rm = ROOMS[room];
  const lbl = document.getElementById('wt-label');
  if (lbl) lbl.textContent = rm.label;
  const info = document.getElementById('room-info');
  if (info) info.innerHTML = `<div>📍 ${rm.label.replace(/[^\w\s]/g,'')}</div><div>📐 ${rm.info}</div><div>💡 Warm Lighting</div>`;
  updateCompass(); renderFrame();
}

let autoInterval = null;
function toggleAutoTour(el) {
  el.classList.toggle('on');
  WT.autoTour = el.classList.contains('on');
  if (WT.autoTour) {
    const rooms = Object.keys(ROOMS);
    let idx = 0;
    autoInterval = setInterval(() => {
      idx = (idx + 1) % rooms.length;
      teleport(rooms[idx]);
    }, 4000);
  } else {
    clearInterval(autoInterval);
  }
}

window.addEventListener('DOMContentLoaded', initWalkthrough);
window.addEventListener('resize', () => {
  if (!WT.canvas) return;
  WT.canvas.width = WT.canvas.parentElement.clientWidth || 640;
  renderFrame();
});
