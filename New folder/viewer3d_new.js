// ===== DREAMNEST AI — REALISTIC 3D ISOMETRIC CUTAWAY VIEWER =====
// Style: Isometric cutaway showing rooms, walls, furniture, colors like reference images

const V3D = {
  canvas: null, ctx: null,
  rotY: 25, isDragging: false,
  lastMX: 0, lastMY: 0,
  isDay: true, isWire: false,
  lightInt: 0.85,
  autoRotate: true,
  animId: null,
};

// Isometric projection constants
const ISO_TW = 88;   // tile width (2x)
const ISO_TH = 44;   // tile height (2x)
const WALL_H  = 120; // wall height in pixels
const FLOOR_H = 12;  // floor slab thickness

function init3DViewer() {
  V3D.canvas = document.getElementById('threeCanvas');
  if (!V3D.canvas) return;
  V3D.canvas.width  = V3D.canvas.parentElement.clientWidth  || 800;
  V3D.canvas.height = V3D.canvas.parentElement.clientHeight || 520;
  V3D.ctx = V3D.canvas.getContext('2d');

  V3D.canvas.addEventListener('mousedown',  e => { V3D.isDragging=true; V3D.lastMX=e.clientX; V3D.autoRotate=false; });
  V3D.canvas.addEventListener('mousemove',  e => {
    if (!V3D.isDragging) return;
    V3D.rotY += (e.clientX - V3D.lastMX) * 0.5;
    V3D.lastMX = e.clientX;
    drawScene();
  });
  V3D.canvas.addEventListener('mouseup',    () => V3D.isDragging = false);
  V3D.canvas.addEventListener('mouseleave', () => V3D.isDragging = false);
  V3D.canvas.addEventListener('wheel', e => { e.preventDefault(); }, {passive:false});

  // Touch support
  V3D.canvas.addEventListener('touchstart', e => { V3D.isDragging=true; V3D.lastMX=e.touches[0].clientX; V3D.autoRotate=false; });
  V3D.canvas.addEventListener('touchmove',  e => {
    if (!V3D.isDragging) return;
    V3D.rotY += (e.touches[0].clientX - V3D.lastMX) * 0.4;
    V3D.lastMX = e.touches[0].clientX;
    drawScene();
  });
  V3D.canvas.addEventListener('touchend', () => V3D.isDragging = false);

  (function loop() {
    if (V3D.autoRotate && !V3D.isDragging) {
      V3D.rotY = (V3D.rotY + 0.15) % 360;
      drawScene();
    }
    V3D.animId = requestAnimationFrame(loop);
  })();
}

// ─── ISO PROJECTION ───────────────────────────────────────────────
function isoProject(gx, gy, gz) {
  // gx,gy = grid position, gz = height in pixels
  const W = V3D.canvas.width, H = V3D.canvas.height;
  const cx = W / 2, cy = H * 0.42;
  const rads = (V3D.rotY * Math.PI) / 180;
  // Rotate around Y axis
  const rx = gx * Math.cos(rads) - gy * Math.sin(rads);
  const ry_r = gx * Math.sin(rads) + gy * Math.cos(rads);
  return {
    x: cx + (rx - ry_r) * (ISO_TW / 2),
    y: cy + (rx + ry_r) * (ISO_TH / 2) - gz,
  };
}

// ─── COLOUR HELPERS ──────────────────────────────────────────────
function hexToArr(h) {
  if (!h || h[0]!=='#') return [128,128,128];
  return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
}
function shade(hex, factor) {
  const [r,g,b] = hexToArr(hex);
  return `rgb(${Math.round(r*factor)},${Math.round(g*factor)},${Math.round(b*factor)})`;
}
function withAlpha(hex, a) {
  const [r,g,b] = hexToArr(hex);
  return `rgba(${r},${g},${b},${a})`;
}

// ─── DRAWING PRIMITIVES ───────────────────────────────────────────
function drawIsoFace(ctx, pts, fillColor, strokeColor, lw) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fillStyle   = fillColor;
  ctx.fill();
  ctx.strokeStyle = strokeColor || 'rgba(0,0,0,0.18)';
  ctx.lineWidth   = lw || 0.6;
  ctx.stroke();
}

// Draw a 3D box in isometric space
// gx,gy = grid (unit) position; gz = bottom height (px); w,d = grid units; h = pixel height
function drawIsoBox(ctx, gx, gy, gz, w, d, h, topCol, leftCol, rightCol) {
  const li = V3D.lightInt;

  // 8 corners
  const tfl = isoProject(gx,   gy,   gz+h);
  const tfr = isoProject(gx+w, gy,   gz+h);
  const tbr = isoProject(gx+w, gy+d, gz+h);
  const tbl = isoProject(gx,   gy+d, gz+h);
  const bfl = isoProject(gx,   gy,   gz);
  const bfr = isoProject(gx+w, gy,   gz);
  const bbr = isoProject(gx+w, gy+d, gz);
  const bbl = isoProject(gx,   gy+d, gz);

  const rads = (V3D.rotY * Math.PI)/180;
  const showLeft  = Math.cos(rads) >= 0;
  const showFront = Math.sin(rads) >= 0;

  // Draw back faces first
  if (!showFront) drawIsoFace(ctx, [tbl,tbr,bbr,bbl], shade(leftCol,  li*0.65));
  if (!showLeft)  drawIsoFace(ctx, [tfl,tbl,bbl,bfl], shade(rightCol, li*0.75));

  // Top
  drawIsoFace(ctx, [tfl,tfr,tbr,tbl], shade(topCol, li));

  // Front faces
  if (showFront)  drawIsoFace(ctx, [tbl,tbr,bbr,bbl], shade(leftCol,  li*0.65));
  if (showLeft)   drawIsoFace(ctx, [tfl,tbl,bbl,bfl], shade(rightCol, li*0.75));
  drawIsoFace(ctx, [tfr,tbr,bbr,bfr], shade(rightCol, li*0.55)); // right
}

// Draw a flat iso floor tile
function drawIsoFloor(ctx, gx, gy, w, d, col) {
  const tfl = isoProject(gx,   gy,   FLOOR_H);
  const tfr = isoProject(gx+w, gy,   FLOOR_H);
  const tbr = isoProject(gx+w, gy+d, FLOOR_H);
  const tbl = isoProject(gx,   gy+d, FLOOR_H);
  drawIsoFace(ctx, [tfl,tfr,tbr,tbl], col, 'rgba(0,0,0,0.1)', 0.5);
}

// Draw a room wall section
function drawWallSection(ctx, gx1, gy1, gx2, gy2, col, height) {
  const h = height || WALL_H;
  const li = V3D.lightInt;
  const t0 = isoProject(gx1, gy1, h);
  const t1 = isoProject(gx2, gy2, h);
  const b0 = isoProject(gx1, gy1, FLOOR_H);
  const b1 = isoProject(gx2, gy2, FLOOR_H);
  // Determine if horizontal or vertical wall
  const isHoriz = Math.abs(gx2-gx1) > Math.abs(gy2-gy1);
  const wallShade = isHoriz ? li * 0.72 : li * 0.58;
  drawIsoFace(ctx, [t0,t1,b1,b0], shade(col, wallShade), 'rgba(0,0,0,0.2)', 0.7);
}

// ─── SCENE DEFINITION ────────────────────────────────────────────
// House layout in grid units (1 unit = approx 3 feet)
const SCENE = {
  // [gx, gy, w, d, floorColor, wallColor, label]
  rooms: [
    { gx:0,  gy:0,  w:3, d:3, floor:'#e8dcc8', wall:'#d4c8b0', label:'Living Room',    labelColor:'#5a4a3a' },
    { gx:3,  gy:0,  w:2.5,d:3, floor:'#e4ecf4', wall:'#c8d4e0', label:'Master Bed',    labelColor:'#3a4a5a' },
    { gx:5.5,gy:0,  w:2, d:2.8,floor:'#ece8e0', wall:'#d8d4cc', label:'Bedroom 2',     labelColor:'#5a5040' },
    { gx:0,  gy:3,  w:2.2,d:2.5,floor:'#f4f0e0', wall:'#e0dcc8', label:'Kitchen',      labelColor:'#5a4820' },
    { gx:2.2,gy:3,  w:1.7,d:1.4,floor:'#e0eef4', wall:'#c0d8e4', label:'Bathroom',     labelColor:'#304858' },
    { gx:2.2,gy:4.4,w:1.7,d:1.1,floor:'#e8f4ec', wall:'#c8e0d0', label:'Toilet',       labelColor:'#284838' },
    { gx:3.9,gy:3,  w:3.6,d:2.5,floor:'#f0ece0', wall:'#dcd8cc', label:'Dining Room',  labelColor:'#504830' },
    { gx:0,  gy:5.6,w:2.8,d:1.8,floor:'#e4e4e4', wall:'#d0d0d0', label:'Garage',       labelColor:'#404040' },
  ],
  // Outer walls [gx1,gy1,gx2,gy2]
  outerWalls: [
    // Perimeter
    [0,0,7.5,0],[7.5,0,7.5,5.5],[7.5,5.5,2.8,5.5],[2.8,5.5,2.8,7.4],[2.8,7.4,0,7.4],[0,7.4,0,0],
    // Internal divisions
    [3,0,3,3],[5.5,0,5.5,2.8],[2.2,3,2.2,5.5],[3.9,3,3.9,5.5],[0,3,2.2,3],[3.9,3,7.5,3],
    [2.2,4.4,3.9,4.4],[0,5.6,2.8,5.6],
  ],
  // Furniture: [type, gx, gy, gz, gw, gd, gh, color]
  furniture: [
    // Living Room
    {t:'box', gx:0.15,gy:1.5,gz:FLOOR_H,gw:2.2,gd:0.65,gh:40,  top:'#b0a090',left:'#8a7a6a',right:'#9a8a7a', label:'Sofa'},
    {t:'box', gx:1.8, gy:0.6,gz:FLOOR_H,gw:0.65,gd:1.0,gh:40,  top:'#b0a090',left:'#8a7a6a',right:'#9a8a7a'},
    {t:'box', gx:0.5, gy:0.6,gz:FLOOR_H,gw:1.0, gd:0.7,gh:22,  top:'#c8a870',left:'#a88050',right:'#b89060', label:'Coffee Table'},
    {t:'box', gx:0.15,gy:0.1,gz:FLOOR_H,gw:1.6, gd:0.25,gh:28, top:'#222',   left:'#111',   right:'#1a1a1a', label:'TV Unit'},
    {t:'cyl', gx:2.7, gy:0.2,gz:FLOOR_H,r:0.15,gh:55, top:'#2a7a2a',label:'Plant'},
    // Master Bedroom
    {t:'box', gx:3.2, gy:0.2,gz:FLOOR_H,gw:1.8,gd:1.3,gh:50,  top:'#7090b8',left:'#506888',right:'#607898', label:'Bed'},
    {t:'box', gx:3.1, gy:0.1,gz:FLOOR_H,gw:2.0,gd:0.25,gh:65, top:'#c8a870',left:'#a88850',right:'#b89860', label:'Headboard'},
    {t:'box', gx:5.0, gy:0.2,gz:FLOOR_H,gw:0.4,gd:1.2,gh:90,  top:'#c0a878',left:'#a08858',right:'#b09868', label:'Wardrobe'},
    {t:'box', gx:3.0, gy:2.3,gz:FLOOR_H,gw:0.7,gd:0.45,gh:35, top:'#c0a878',left:'#a08858',right:'#b09868'},
    // Bedroom 2
    {t:'box', gx:5.65,gy:0.2,gz:FLOOR_H,gw:1.5,gd:1.1,gh:45,  top:'#d0b8a0',left:'#b09880',right:'#c0a890', label:'Bed'},
    {t:'box', gx:5.65,gy:1.55,gz:FLOOR_H,gw:0.8,gd:0.5,gh:35, top:'#b0a080',left:'#908060',right:'#a09070', label:'Desk'},
    {t:'box', gx:6.9, gy:0.1,gz:FLOOR_H,gw:0.5,gd:2.6,gh:88,  top:'#c0a878',left:'#a08858',right:'#b09868', label:'Wardrobe'},
    // Kitchen
    {t:'box', gx:0.1, gy:3.05,gz:FLOOR_H,gw:2.0,gd:0.5,gh:50, top:'#e0d8c0',left:'#c0b8a0',right:'#d0c8b0', label:'Counter'},
    {t:'box', gx:0.1, gy:3.55,gz:FLOOR_H,gw:0.5,gd:1.6,gh:50, top:'#e0d8c0',left:'#c0b8a0',right:'#d0c8b0'},
    {t:'box', gx:0.7, gy:4.2, gz:FLOOR_H,gw:1.0,gd:0.8,gh:32, top:'#c8a870',left:'#a88050',right:'#b89060', label:'Table'},
    // Dining Room
    {t:'box', gx:4.3, gy:3.4,gz:FLOOR_H,gw:2.0,gd:1.2,gh:32,  top:'#c4a060',left:'#a48040',right:'#b49050', label:'Dining Table'},
    {t:'box', gx:4.0, gy:3.5,gz:FLOOR_H,gw:0.35,gd:0.5,gh:45, top:'#a08060',left:'#806040',right:'#907050'},
    {t:'box', gx:6.2, gy:3.5,gz:FLOOR_H,gw:0.35,gd:0.5,gh:45, top:'#a08060',left:'#806040',right:'#907050'},
    {t:'box', gx:4.5, gy:3.1,gz:FLOOR_H,gw:0.5,gd:0.35,gh:45, top:'#a08060',left:'#806040',right:'#907050'},
    {t:'box', gx:5.5, gy:3.1,gz:FLOOR_H,gw:0.5,gd:0.35,gh:45, top:'#a08060',left:'#806040',right:'#907050'},
    {t:'box', gx:4.5, gy:4.55,gz:FLOOR_H,gw:0.5,gd:0.35,gh:45, top:'#a08060',left:'#806040',right:'#907050'},
    {t:'box', gx:5.5, gy:4.55,gz:FLOOR_H,gw:0.5,gd:0.35,gh:45, top:'#a08060',left:'#806040',right:'#907050'},
    {t:'cyl', gx:7.0, gy:4.8,gz:FLOOR_H,r:0.2,gh:60, top:'#2a7a2a'},
    // Bathroom
    {t:'box', gx:2.25,gy:3.05,gz:FLOOR_H,gw:1.0,gd:0.65,gh:30, top:'#e8f4f8',left:'#c0d8e4',right:'#d4eaf0', label:'Bathtub'},
    {t:'box', gx:3.15,gy:3.05,gz:FLOOR_H,gw:0.45,gd:0.55,gh:38, top:'#f0f0f0',left:'#d0d0d0',right:'#e0e0e0', label:'Toilet'},
    // Garage
    {t:'car', gx:0.15,gy:5.75,gz:FLOOR_H, gw:1.1,gd:1.3,gh:38, top:'#b0b8c8',left:'#9098a8',right:'#a0a8b8'},
    {t:'car', gx:1.45,gy:5.75,gz:FLOOR_H, gw:1.1,gd:1.3,gh:38, top:'#c8b8b0',left:'#a89898',right:'#b8a8a0'},
  ],
  // Roof panels [gx,gy,w,d,color]
  roof: [
    {gx:0,gy:0,w:7.5,d:5.5,color:'#8a7060'},
    {gx:0,gy:5.5,w:2.8,d:1.9,color:'#888080'},
  ]
};

// ─── MAIN DRAW ───────────────────────────────────────────────────
function drawScene() {
  const ctx = V3D.ctx;
  const W = V3D.canvas.width, H = V3D.canvas.height;
  if (!ctx) return;
  ctx.clearRect(0,0,W,H);

  // Sky
  const sky = ctx.createLinearGradient(0,0,0,H);
  if (V3D.isDay) {
    sky.addColorStop(0,'#c8daf0'); sky.addColorStop(1,'#e8f0f8');
  } else {
    sky.addColorStop(0,'#0a0a18'); sky.addColorStop(1,'#141428');
  }
  ctx.fillStyle = sky; ctx.fillRect(0,0,W,H);

  if (!V3D.isDay) drawNightStars(ctx, W, H);
  drawGround(ctx, W, H);

  // Draw in painter's order (back to front)
  // 1. Ground floor slabs
  SCENE.rooms.forEach(r => drawIsoFloor(ctx, r.gx, r.gy, r.w, r.d, r.floor));

  // 2. Walls
  SCENE.outerWalls.forEach(([x1,y1,x2,y2]) => {
    const wallCol = '#d0c8b8';
    drawWallSection(ctx, x1, y1, x2, y2, wallCol, WALL_H);
  });

  // 3. Furniture (sorted back to front by depth)
  const rads = (V3D.rotY * Math.PI)/180;
  const sorted = [...SCENE.furniture].sort((a,b) => {
    const da = (a.gx+a.gw/2)*Math.sin(rads) + (a.gy+(a.gd||0)/2)*Math.cos(rads);
    const db = (b.gx+b.gw/2)*Math.sin(rads) + (b.gy+(b.gd||0)/2)*Math.cos(rads);
    return da - db;
  });
  sorted.forEach(f => drawFurnitureItem(ctx, f));

  // 4. Roof outline (ghost / translucent)
  SCENE.roof.forEach(r => {
    const tfl = isoProject(r.gx,     r.gy,     WALL_H + FLOOR_H);
    const tfr = isoProject(r.gx+r.w, r.gy,     WALL_H + FLOOR_H);
    const tbr = isoProject(r.gx+r.w, r.gy+r.d, WALL_H + FLOOR_H);
    const tbl = isoProject(r.gx,     r.gy+r.d, WALL_H + FLOOR_H);
    ctx.globalAlpha = 0.28;
    drawIsoFace(ctx, [tfl,tfr,tbr,tbl], r.color, 'rgba(0,0,0,0.3)', 1);
    ctx.globalAlpha = 1;
  });

  // 5. Ceiling/roof cap (one side visible)
  drawRoofCap(ctx);

  // 6. Labels
  drawRoomLabels3D(ctx);

  // 7. Overlay info
  drawViewerHUD(ctx, W, H);
}

function drawFurnitureItem(ctx, f) {
  if (f.t === 'box' || f.t === 'car') {
    const gc = f.gd || 0.5;
    drawIsoBox(ctx, f.gx, f.gy, f.gz, f.gw, gc, f.gh, f.top, f.left||shade(f.top,0.75), f.right||shade(f.top,0.85));
    // Car windows
    if (f.t === 'car') {
      const wt = isoProject(f.gx+0.1, f.gy+0.25, f.gz+f.gh*0.7);
      const wb = isoProject(f.gx+f.gw-0.1, f.gy+0.25, f.gz+f.gh*0.7);
      ctx.strokeStyle='rgba(160,210,240,0.7)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(wt.x,wt.y); ctx.lineTo(wb.x,wb.y); ctx.stroke();
    }
  } else if (f.t === 'cyl') {
    // Cylinder (plant, post)
    drawIsoCylinder(ctx, f.gx, f.gy, f.gz, f.r, f.gh, f.top);
  }
}

function drawIsoCylinder(ctx, gx, gy, gz, r, h, col) {
  const li = V3D.lightInt;
  const bot  = isoProject(gx, gy, gz);
  const top  = isoProject(gx, gy, gz + h);
  const rx   = (ISO_TW/2) * r * 0.9;
  const ry   = (ISO_TH/2) * r * 0.9;

  // Side (simplified as vertical band)
  ctx.fillStyle = shade(col, li*0.7);
  ctx.beginPath();
  ctx.ellipse(bot.x, bot.y, rx, ry, 0, 0, Math.PI); // bottom half
  ctx.lineTo(top.x - rx, top.y);
  ctx.ellipse(top.x, top.y, rx, ry, 0, Math.PI, 0);
  ctx.lineTo(bot.x + rx, bot.y);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=0.5; ctx.stroke();

  // Top ellipse
  ctx.fillStyle = shade(col, li);
  ctx.beginPath(); ctx.ellipse(top.x, top.y, rx, ry, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.stroke();

  // Leaf crown (if plant)
  if (col.includes('7a') || col.includes('8a')) {
    [[-rx*0.5,-ry*1.2],[rx*0.5,-ry*1.2],[0,-ry*1.8],[-rx,-ry*0.5],[rx,-ry*0.5]].forEach(([ox,oy]) => {
      ctx.fillStyle = shade('#3a8a3a', li);
      ctx.beginPath(); ctx.ellipse(top.x+ox, top.y+oy, rx*0.7, ry*0.7, 0, 0, Math.PI*2); ctx.fill();
    });
  }
}

function drawRoofCap(ctx) {
  // Subtle roof ridge line
  const r1 = isoProject(0,   0,   WALL_H + FLOOR_H);
  const r2 = isoProject(7.5, 0,   WALL_H + FLOOR_H);
  const r3 = isoProject(3.75,0,   WALL_H + FLOOR_H + 40);
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = shade('#7a6050', 0.9);
  ctx.beginPath(); ctx.moveTo(r1.x,r1.y); ctx.lineTo(r2.x,r2.y); ctx.lineTo(r3.x,r3.y); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=1; ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawRoomLabels3D(ctx) {
  SCENE.rooms.forEach(r => {
    const cx = r.gx + r.w/2, cy = r.gy + r.d/2;
    const p  = isoProject(cx, cy, FLOOR_H + 8);
    ctx.save();
    ctx.globalAlpha = 0.88;
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    // Background pill
    const tw = ctx.measureText(r.label).width + 10;
    ctx.fillStyle = 'rgba(255,252,245,0.85)';
    roundRectPath(ctx, p.x - tw/2, p.y - 9, tw, 16, 4);
    ctx.fill();
    ctx.fillStyle = r.labelColor || '#3a3020';
    ctx.fillText(r.label, p.x, p.y);
    ctx.restore();
  });
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r);
  ctx.closePath();
}

function drawGround(ctx, W, H) {
  const groundY = H * 0.72;
  const grd = ctx.createLinearGradient(0, groundY, 0, H);
  grd.addColorStop(0, V3D.isDay ? '#c8d8b0' : '#2a3820');
  grd.addColorStop(1, V3D.isDay ? '#a0b880' : '#1a2410');
  ctx.fillStyle = grd;
  ctx.fillRect(0, groundY, W, H - groundY);

  // Ground shadow under house
  const sc = isoProject(3.75, 3.5, 0);
  const sg = ctx.createRadialGradient(sc.x, sc.y, 0, sc.x, sc.y, 350);
  sg.addColorStop(0, 'rgba(0,0,0,0.22)'); sg.addColorStop(1, 'transparent');
  ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
}

function drawNightStars(ctx, W, H) {
  for (let i = 0; i < 120; i++) {
    const sx = (i * 79 + 13) % W;
    const sy = (i * 53 + 7) % (H * 0.6);
    ctx.fillStyle = `rgba(255,255,255,${0.3+Math.sin(i)*0.4})`;
    ctx.fillRect(sx, sy, i%4===0?1.5:1, i%4===0?1.5:1);
  }
  // Moon
  const mg = ctx.createRadialGradient(W*0.8, 60, 0, W*0.8, 60, 55);
  mg.addColorStop(0,'rgba(220,230,255,0.22)'); mg.addColorStop(1,'transparent');
  ctx.fillStyle=mg; ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(220,228,255,0.88)';
  ctx.beginPath(); ctx.arc(W*0.8, 60, 18, 0, Math.PI*2); ctx.fill();
}

function drawViewerHUD(ctx, W, H) {
  // Bottom-left label
  ctx.save();
  ctx.globalAlpha = 0.78;
  ctx.fillStyle = 'rgba(10,10,20,0.75)';
  roundRectPath(ctx, 14, H-44, 220, 30, 8); ctx.fill();
  ctx.fillStyle = '#d0c8b8'; ctx.font = '11px Arial'; ctx.textAlign='left';
  ctx.fillText('🏠 DreamNest AI  ·  3BHK Modern Villa  ·  2400 sq.ft', 22, H-24);
  ctx.restore();

  // Top-right sun/moon badge
  ctx.save();
  ctx.globalAlpha = 0.82;
  ctx.fillStyle = 'rgba(10,10,20,0.7)';
  roundRectPath(ctx, W-110, 12, 96, 28, 8); ctx.fill();
  ctx.fillStyle = '#f0e8d0'; ctx.font = 'bold 11px Arial'; ctx.textAlign='center';
  ctx.fillText(V3D.isDay ? '☀️ Day Mode' : '🌙 Night Mode', W-62, 30);
  ctx.restore();
}

// ─── CONTROLS ────────────────────────────────────────────────────
function toggleDayNight() {
  V3D.isDay = !V3D.isDay;
  const btn = document.getElementById('daynight-btn');
  if (btn) btn.textContent = V3D.isDay ? '🌙 Night Mode' : '☀️ Day Mode';
  drawScene();
}
function toggleWireframe() {
  V3D.isWire = !V3D.isWire;
  const btn = document.getElementById('wire-btn');
  if (btn) btn.classList.toggle('active', V3D.isWire);
  drawScene();
}
function resetCamera3D() { V3D.rotY = 25; V3D.autoRotate = true; drawScene(); }
function setLight(val) { V3D.lightInt = parseInt(val) / 100; drawScene(); }

window.addEventListener('DOMContentLoaded', init3DViewer);
window.addEventListener('resize', () => {
  if (!V3D.canvas) return;
  V3D.canvas.width  = V3D.canvas.parentElement.clientWidth  || 800;
  V3D.canvas.height = V3D.canvas.parentElement.clientHeight || 520;
  drawScene();
});

// Extra: skip hidden rooms
const _origDrawScene = drawScene;
// patch drawIsoFloor to respect hidden flag
const _patchedDrawScene = function() {
  const ctx = V3D.ctx;
  const W = V3D.canvas.width, H = V3D.canvas.height;
  if (!ctx) return;
  ctx.clearRect(0,0,W,H);
  const sky = ctx.createLinearGradient(0,0,0,H);
  if (V3D.isDay) { sky.addColorStop(0,'#c8daf0'); sky.addColorStop(1,'#e8f0f8'); }
  else           { sky.addColorStop(0,'#0a0a18'); sky.addColorStop(1,'#141428'); }
  ctx.fillStyle = sky; ctx.fillRect(0,0,W,H);
  if (!V3D.isDay) drawNightStars(ctx,W,H);
  drawGround(ctx,W,H);

  // Visible rooms only
  SCENE.rooms.forEach(r => {
    if (!r._hidden) drawIsoFloor(ctx, r.gx, r.gy, r.w, r.d, r.floor);
  });
  SCENE.outerWalls.forEach(([x1,y1,x2,y2]) => drawWallSection(ctx, x1, y1, x2, y2, '#d0c8b8', WALL_H));

  const rads = (V3D.rotY*Math.PI)/180;
  const sorted = [...SCENE.furniture].sort((a,b)=>{
    const da=(a.gx+(a.gw||0)/2)*Math.sin(rads)+(a.gy+(a.gd||0)/2)*Math.cos(rads);
    const db=(b.gx+(b.gw||0)/2)*Math.sin(rads)+(b.gy+(b.gd||0)/2)*Math.cos(rads);
    return da-db;
  });
  sorted.forEach(f => drawFurnitureItem(ctx,f));

  SCENE.roof.forEach(r => {
    const tfl=isoProject(r.gx,r.gy,WALL_H+FLOOR_H);
    const tfr=isoProject(r.gx+r.w,r.gy,WALL_H+FLOOR_H);
    const tbr=isoProject(r.gx+r.w,r.gy+r.d,WALL_H+FLOOR_H);
    const tbl=isoProject(r.gx,r.gy+r.d,WALL_H+FLOOR_H);
    ctx.globalAlpha=0.28;
    drawIsoFace(ctx,[tfl,tfr,tbr,tbl],r.color,'rgba(0,0,0,0.3)',1);
    ctx.globalAlpha=1;
  });
  drawRoofCap(ctx);
  drawRoomLabels3D(ctx);
  drawViewerHUD(ctx,W,H);
};

// Override drawScene
window.drawScene = _patchedDrawScene;
