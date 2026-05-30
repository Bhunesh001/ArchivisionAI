// ===== DREAMNEST AI — INTERIOR ISOMETRIC ENGINE (Realistic Cutaway) =====

const INT = {
  room: 'living',
  wallColor: '#d8c8b0',
  floorType: 'wood',
  lightLevel: 78,
  lightType: 'warm',
  furniture: {},
  canvas: null, ctx: null,
  rotY: 30,
};

const ROOM_FURNITURE = {
  living:   ['Modern Sofa','L-Sofa','Coffee Table','TV Unit','Armchair','Floor Lamp','Ceiling Light','Rug','Plants','Bookshelf'],
  kitchen:  ['Kitchen Counter','Kitchen Island','Refrigerator','Stove/Oven','Microwave','Dining Chairs','Pendant Light','Ceiling Light'],
  bedroom:  ['King Bed','Wardrobe','Bedside Tables','Study Desk','Floor Lamp','Ceiling Light','Rug','Mirror','Dressing Table'],
  bathroom: ['Bathtub','Shower Cubicle','Vanity Sink','Toilet','Bath Mat','Towel Rack','Mirror Cabinet','Ceiling Light'],
  dining:   ['Dining Table','Dining Chairs (6)','Sideboard','Pendant Light','Ceiling Light','Rug','Plants'],
};

const ROOM_LABELS = {
  living:'🛋️ Living Room', kitchen:'🍳 Kitchen', bedroom:'🛏️ Master Bedroom',
  bathroom:'🚿 Bathroom', dining:'🍽️ Dining Room',
};

const ROOM_CONFIGS = {
  living:  {w:5, d:4, floor:'#c8a870', wall:'#d8c8b0', wallDark:'#c0b098', accent:'#9b8ea8'},
  kitchen: {w:4, d:3.5, floor:'#e0d8c8', wall:'#d8d4c8', wallDark:'#c8c4b8', accent:'#b8905a'},
  bedroom: {w:5, d:4, floor:'#c0a878', wall:'#d0c8b8', wallDark:'#b8b0a0', accent:'#7090b8'},
  bathroom:{w:3.5, d:3, floor:'#e0e8ec', wall:'#c8d8e0', wallDark:'#b0c8d8', accent:'#90b8c8'},
  dining:  {w:4.5, d:3.5, floor:'#c4a868', wall:'#d4c4a8', wallDark:'#bca898', accent:'#c0905a'},
};

function initInterior() {
  INT.canvas = document.getElementById('interiorCanvas');
  if (!INT.canvas) return;
  INT.canvas.width  = INT.canvas.parentElement.clientWidth  || 680;
  INT.canvas.height = INT.canvas.parentElement.clientHeight || 460;
  INT.ctx = INT.canvas.getContext('2d');

  Object.keys(ROOM_FURNITURE).forEach(room => {
    INT.furniture[room] = {};
    ROOM_FURNITURE[room].forEach(f => INT.furniture[room][f] = true);
  });

  renderFurnitureList();
  drawInterior();
}

// ISO helpers
function isoInt(gx, gy, gz) {
  const cfg = ROOM_CONFIGS[INT.room];
  const W = INT.canvas.width, H = INT.canvas.height;
  const TW = Math.min(100, W / (cfg.w + 2));
  const TH = TW * 0.5;
  const cx = W * 0.5, cy = H * 0.35;
  const rads = (INT.rotY * Math.PI) / 180;
  const rx = gx * Math.cos(rads) - gy * Math.sin(rads);
  const ry = gx * Math.sin(rads) + gy * Math.cos(rads);
  return { x: cx + (rx - ry) * TW / 2, y: cy + (rx + ry) * TH / 2 - gz };
}

function iBox(ctx, gx, gy, gz, gw, gd, gh, top, left, right, alpha) {
  const li = INT.lightLevel / 100;
  if (alpha !== undefined) ctx.globalAlpha = alpha;

  function s(c, f) {
    if (!c||c[0]!=='#') return c;
    const [r,g,b]=[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
    return `rgb(${Math.round(r*f)},${Math.round(g*f)},${Math.round(b*f)})`;
  }

  const tfl=isoInt(gx,   gy,   gz+gh), tfr=isoInt(gx+gw,gy,   gz+gh);
  const tbr=isoInt(gx+gw,gy+gd,gz+gh), tbl=isoInt(gx,   gy+gd,gz+gh);
  const bfl=isoInt(gx,   gy,   gz),    bfr=isoInt(gx+gw,gy,   gz);
  const bbr=isoInt(gx+gw,gy+gd,gz),    bbl=isoInt(gx,   gy+gd,gz);

  function face(pts, col) {
    ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y);
    pts.slice(1).forEach(p=>ctx.lineTo(p.x,p.y)); ctx.closePath();
    ctx.fillStyle=col; ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.lineWidth=0.5; ctx.stroke();
  }
  face([tbl,tbr,bbr,bbl], s(left,  li*0.62));
  face([tfl,tbl,bbl,bfl], s(right, li*0.72));
  face([tfr,tbr,bbr,bfr], s(right, li*0.52));
  face([tfl,tfr,tbr,tbl], s(top,   li));
  if (alpha !== undefined) ctx.globalAlpha = 1;
}

function iFloor(ctx, gx, gy, gw, gd, col) {
  iBox(ctx, gx, gy, 0, gw, gd, 2, col, shade(col,0.8), shade(col,0.9));
}

function shade(hex, f) {
  if (!hex||hex[0]!=='#') return hex;
  const [r,g,b]=[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];
  return `rgb(${Math.round(r*f)},${Math.round(g*f)},${Math.round(b*f)})`;
}

function drawInterior() {
  const ctx = INT.ctx;
  if (!ctx) return;
  const W = INT.canvas.width, H = INT.canvas.height;
  const cfg = ROOM_CONFIGS[INT.room];
  const li = INT.lightLevel / 100;

  ctx.clearRect(0,0,W,H);

  // Sky/ceiling colour
  const skyC = INT.lightType==='warm' ? `rgba(255,230,180,${li*0.15})`
             : INT.lightType==='cool' ? `rgba(180,210,255,${li*0.12})`
             : `rgba(255,255,240,${li*0.1})`;
  const bg = ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#1a1828'); bg.addColorStop(1,'#0d0c14');
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

  const WALLH = 95; // px wall height

  // Floor tiles
  const floorColors = {
    wood:'#c4935a', marble:'#ddd8d0', tile:'#3a3848', carpet:'#7060a0'
  };
  const fc = floorColors[INT.floorType] || '#c4935a';
  for (let c=0; c<cfg.w; c++) {
    for (let r=0; r<cfg.d; r++) {
      const alt = (c+r)%2===0;
      iFloor(ctx, c, r, 1, 1, alt ? fc : shade(fc, 0.88));
    }
  }

  // Back walls
  const wc  = INT.wallColor;
  const wcd = shade(INT.wallColor, 0.78);

  // Back-left wall
  for (let r=0; r<cfg.d; r++) {
    const t0=isoInt(0,r,  WALLH), t1=isoInt(0,r+1,WALLH);
    const b0=isoInt(0,r,  2),     b1=isoInt(0,r+1,2);
    ctx.beginPath(); ctx.moveTo(t0.x,t0.y); ctx.lineTo(t1.x,t1.y);
    ctx.lineTo(b1.x,b1.y); ctx.lineTo(b0.x,b0.y); ctx.closePath();
    ctx.fillStyle=shade(wcd, li*0.88); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.1)'; ctx.lineWidth=0.4; ctx.stroke();
  }
  // Back-right wall (top face)
  for (let c=0; c<cfg.w; c++) {
    const t0=isoInt(c,  0,WALLH), t1=isoInt(c+1,0,WALLH);
    const b0=isoInt(c,  0,2),     b1=isoInt(c+1,0,2);
    ctx.beginPath(); ctx.moveTo(t0.x,t0.y); ctx.lineTo(t1.x,t1.y);
    ctx.lineTo(b1.x,b1.y); ctx.lineTo(b0.x,b0.y); ctx.closePath();
    ctx.fillStyle=shade(wc, li*0.92); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.08)'; ctx.lineWidth=0.4; ctx.stroke();
  }

  // Wall decorations (baseboard)
  ctx.strokeStyle=`rgba(255,255,255,${li*0.12})`; ctx.lineWidth=1;
  const sb0=isoInt(0,0,8), sb1=isoInt(cfg.w,0,8), sb2=isoInt(0,cfg.d,8);
  ctx.beginPath(); ctx.moveTo(sb0.x,sb0.y); ctx.lineTo(sb1.x,sb1.y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(sb0.x,sb0.y); ctx.lineTo(sb2.x,sb2.y); ctx.stroke();

  // Draw furniture
  drawIntFurniture(ctx, cfg);

  // Ceiling light glow
  if (INT.furniture[INT.room]['Ceiling Light'] || INT.furniture[INT.room]['Pendant Light']) {
    const lp = isoInt(cfg.w/2, cfg.d/2, WALLH - 5);
    const lightAlpha = li * 0.4;
    const lightColor = INT.lightType==='warm' ? `rgba(255,210,120,${lightAlpha})`
                     : INT.lightType==='cool' ? `rgba(180,210,255,${lightAlpha})`
                     : `rgba(255,255,240,${lightAlpha})`;
    const lg = ctx.createRadialGradient(lp.x,lp.y,0,lp.x,lp.y,W*0.55);
    lg.addColorStop(0,lightColor); lg.addColorStop(1,'transparent');
    ctx.fillStyle=lg; ctx.fillRect(0,0,W,H);
    // Fixture
    ctx.fillStyle=INT.lightType==='warm'?'rgba(255,220,100,0.9)':'rgba(200,225,255,0.9)';
    ctx.beginPath(); ctx.arc(lp.x,lp.y,7,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=0.5; ctx.stroke();
  }

  // Overall light overlay
  ctx.fillStyle=skyC; ctx.fillRect(0,0,W,H);
}

function drawIntFurniture(ctx, cfg) {
  const furn = INT.furniture[INT.room] || {};
  const li = INT.lightLevel / 100;

  if (INT.room === 'living') {
    if (furn['Rug']) {
      const rp=[isoInt(0.4,1.2,2.5),isoInt(3.0,1.2,2.5),isoInt(3.0,3.2,2.5),isoInt(0.4,3.2,2.5)];
      ctx.beginPath(); rp.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y)); ctx.closePath();
      ctx.fillStyle=`rgba(140,90,180,${li*0.45})`; ctx.fill();
      ctx.strokeStyle=`rgba(120,70,160,${li*0.6})`; ctx.lineWidth=1; ctx.stroke();
    }
    if (furn['Modern Sofa']||furn['L-Sofa']) {
      iBox(ctx,0.3,2.0,2,2.8,0.7,38,'#9a8898','#7a6878','#8a7888');
      iBox(ctx,0.3,1.85,2,2.8,0.3,50,'#8a7888','#6a5868','#7a6878');
    }
    if (furn['Coffee Table']) iBox(ctx,1.0,1.1,2,1.4,0.9,22,'#c8a870','#a88050','#b89060');
    if (furn['TV Unit']) {
      iBox(ctx,0.2,0.1,2,3.0,0.5,28,'#1e1e28','#111118','#181820');
      iBox(ctx,0.5,0.12,30,2.2,0.35,65,'#0d0d12','#080808','#0f0f14'); // screen
      ctx.globalAlpha=li*0.6;
      const sp=isoInt(1.6,0.12,95);
      const sg=ctx.createRadialGradient(sp.x,sp.y,0,sp.x,sp.y,50);
      sg.addColorStop(0,'rgba(80,160,255,0.3)'); sg.addColorStop(1,'transparent');
      ctx.fillStyle=sg; ctx.fillRect(0,0,INT.canvas.width,INT.canvas.height);
      ctx.globalAlpha=1;
    }
    if (furn['Armchair']) iBox(ctx,3.3,0.8,2,0.9,0.9,42,'#d0a898','#b08878','#c09888');
    if (furn['Plants'])   { drawCylinder(ctx,4.3,0.2,2,0.18,55,'#2a7a2a'); drawCylinder(ctx,4.5,3.2,2,0.15,45,'#3a8a2a'); }
    if (furn['Bookshelf'])iBox(ctx,4.2,0.1,2,0.6,2.5,85,'#c0a878','#a08858','#b09868');
    if (furn['Floor Lamp']){ iBox(ctx,3.8,3.4,2,0.12,0.12,80,'#aaa','#888','#999'); const lp2=isoInt(3.86,3.46,82); ctx.fillStyle='rgba(255,230,150,0.8)'; ctx.beginPath(); ctx.arc(lp2.x,lp2.y,7,0,Math.PI*2); ctx.fill(); }

  } else if (INT.room === 'kitchen') {
    if (furn['Kitchen Counter']) {
      iBox(ctx,0.1,0.1,2,3.5,0.65,55,'#e0dbd0','#c0b8a8','#d0c8b8');
      iBox(ctx,0.1,0.1,57,3.5,0.65,10,'#d0cbc0','#b0a898','#c0b8a8');
    }
    if (furn['Kitchen Island'])  iBox(ctx,0.8,1.5,2,2.0,1.0,52,'#d8d4c8','#b8b0a0','#c8c4b4');
    if (furn['Refrigerator'])    iBox(ctx,3.5,0.1,2,0.55,0.9,110,'#f0f0f0','#d0d0d0','#e0e0e0');
    if (furn['Stove/Oven'])      iBox(ctx,0.2,0.12,57,0.9,0.6,18,'#555','#333','#444');
    if (furn['Microwave'])       iBox(ctx,1.5,0.12,57,0.7,0.5,25,'#888','#666','#777');
    if (furn['Dining Chairs'])   { [0.7,1.6,2.5].forEach(cx=>{ iBox(ctx,cx,1.42,2,0.5,0.45,42,'#a08060','#806040','#907050'); iBox(ctx,cx,2.48,2,0.5,0.45,42,'#a08060','#806040','#907050'); }); }
    if (furn['Pendant Light'])   { const pp=isoInt(1.8,1.95,85); ctx.fillStyle='rgba(255,220,100,0.85)'; ctx.beginPath(); ctx.arc(pp.x,pp.y,9,0,Math.PI*2); ctx.fill(); }

  } else if (INT.room === 'bedroom') {
    if (furn['Rug']) {
      const rp=[isoInt(0.6,0.7,2.5),isoInt(4.2,0.7,2.5),isoInt(4.2,3.2,2.5),isoInt(0.6,3.2,2.5)];
      ctx.beginPath(); rp.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y)); ctx.closePath();
      ctx.fillStyle=`rgba(80,110,180,${li*0.38})`; ctx.fill();
    }
    if (furn['King Bed']) {
      iBox(ctx,0.5,0.2,2,3.5,2.2,48,'#6888b0','#486088','#587898');
      iBox(ctx,0.5,0.1,2,3.5,0.25,70,'#b89860','#988040','#a89050'); // headboard
      iBox(ctx,0.6,0.25,50,1.4,0.8,28,'#f0f0f0','#d8d8d8','#e8e8e8'); // pillow
      iBox(ctx,2.5,0.25,50,1.4,0.8,28,'#f0f0f0','#d8d8d8','#e8e8e8');
      iBox(ctx,0.5,2.3,50,3.5,0.5,20,'#7888a8','#587080','#688090'); // blanket fold
    }
    if (furn['Wardrobe'])       iBox(ctx,4.0,0.1,2,0.75,3.5,108,'#c8a870','#a88850','#b89860');
    if (furn['Bedside Tables']) { iBox(ctx,0.1,0.3,2,0.5,0.7,42,'#c0a070','#a08050','#b09060'); iBox(ctx,3.9,0.3,2,0.5,0.7,42,'#c0a070','#a08050','#b09060'); }
    if (furn['Study Desk'])     iBox(ctx,0.1,3.0,2,1.8,0.85,52,'#8898a8','#687888','#788898');
    if (furn['Dressing Table']) iBox(ctx,0.1,2.0,2,1.4,0.7,48,'#c8b080','#a89060','#b8a070');
    if (furn['Mirror'])         iBox(ctx,4.05,1.5,40,0.55,0.1,70,'#90b8d8','#70a0c0','#80b0cc');
    if (furn['Floor Lamp'])     { iBox(ctx,3.6,3.2,2,0.1,0.1,82,'#bbb','#999','#aaa'); }

  } else if (INT.room === 'bathroom') {
    if (furn['Bathtub']) {
      iBox(ctx,0.2,0.2,2,2.2,1.2,42,'#e8f4f8','#c8dce4','#d8ecf4');
      const inner=[isoInt(0.32,0.32,44),isoInt(2.3,0.32,44),isoInt(2.3,1.28,44),isoInt(0.32,1.28,44)];
      ctx.beginPath(); inner.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y)); ctx.closePath();
      ctx.fillStyle=`rgba(140,210,230,${li*0.45})`; ctx.fill();
    }
    if (furn['Shower Cubicle']) {
      iBox(ctx,0.1,2.0,2,1.5,0.9,90,'rgba(180,230,245,0.22)','rgba(160,210,230,0.18)','rgba(170,220,238,0.2)');
    }
    if (furn['Vanity Sink'])    { iBox(ctx,2.5,0.1,2,0.85,1.0,55,'#e0e8f0','#c0c8d8','#d0d8e8'); iBox(ctx,2.55,0.2,57,0.7,0.8,12,'#c8e0f0','#a8c0d8','#b8d0e4'); }
    if (furn['Toilet'])         { iBox(ctx,2.5,1.4,2,0.75,1.1,52,'#f0f0f0','#d0d0d0','#e0e0e0'); }
    if (furn['Bath Mat'])       { const mp=[isoInt(0.5,1.6,2.5),isoInt(1.8,1.6,2.5),isoInt(1.8,2.3,2.5),isoInt(0.5,2.3,2.5)]; ctx.beginPath(); mp.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y)); ctx.closePath(); ctx.fillStyle=`rgba(100,180,140,${li*0.5})`; ctx.fill(); }
    if (furn['Towel Rack'])     iBox(ctx,2.9,2.5,30,0.08,0.8,55,'#c0c0c0','#a0a0a0','#b0b0b0');
    if (furn['Mirror Cabinet']) iBox(ctx,2.5,0.1,58,0.85,0.08,60,'#90b8d8','#78a0c4','#84acc0');

  } else if (INT.room === 'dining') {
    if (furn['Rug']) {
      const rp=[isoInt(0.3,0.5,2.5),isoInt(4.0,0.5,2.5),isoInt(4.0,3.0,2.5),isoInt(0.3,3.0,2.5)];
      ctx.beginPath(); rp.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y)); ctx.closePath();
      ctx.fillStyle=`rgba(160,120,70,${li*0.38})`; ctx.fill();
    }
    if (furn['Dining Table'])   iBox(ctx,0.8,0.8,2,2.8,1.8,32,'#c4a060','#a48040','#b49050');
    if (furn['Dining Chairs (6)']) {
      [[0.4,1.0],[0.4,2.0],[3.6,1.0],[3.6,2.0],[1.5,0.4],[2.5,0.4]].forEach(([cx,cy])=>
        iBox(ctx,cx,cy,2,0.55,0.52,48,'#a08060','#806040','#907050'));
    }
    if (furn['Sideboard'])      iBox(ctx,0.1,0.1,2,1.2,3.1,55,'#7a5a3a','#5a3a1a','#6a4a2a');
    if (furn['Plants'])         { drawCylinder(ctx,3.9,3.0,2,0.2,62,'#2a7a2a'); }
    if (furn['Pendant Light'])  { const pp=isoInt(2.2,1.7,88); ctx.fillStyle='rgba(255,215,90,0.9)'; ctx.beginPath(); ctx.arc(pp.x,pp.y,11,0,Math.PI*2); ctx.fill(); const pg=ctx.createRadialGradient(pp.x,pp.y,0,pp.x,pp.y,80); pg.addColorStop(0,`rgba(255,210,100,${li*0.35})`); pg.addColorStop(1,'transparent'); ctx.fillStyle=pg; ctx.fillRect(0,0,INT.canvas.width,INT.canvas.height); }
  }
}

function drawCylinder(ctx, gx, gy, gz, r, h, col) {
  const li = INT.lightLevel / 100;
  const cfg = ROOM_CONFIGS[INT.room];
  const W = INT.canvas.width;
  const TW = Math.min(100, W/(cfg.w+2));
  const TH = TW*0.5;
  const top = isoInt(gx,gy,gz+h), bot = isoInt(gx,gy,gz);
  const rx = TW*r*0.9, ry = TH*r*0.9;

  ctx.fillStyle=shade(col, li*0.7);
  ctx.beginPath();
  ctx.ellipse(bot.x,bot.y,rx,ry,0,0,Math.PI);
  ctx.lineTo(top.x-rx,top.y);
  ctx.ellipse(top.x,top.y,rx,ry,0,Math.PI,0);
  ctx.lineTo(bot.x+rx,bot.y);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.lineWidth=0.4; ctx.stroke();

  ctx.fillStyle=shade(col,li);
  ctx.beginPath(); ctx.ellipse(top.x,top.y,rx,ry,0,0,Math.PI*2); ctx.fill(); ctx.stroke();

  // Leaves
  [[-rx*0.6,-ry*1.3],[rx*0.6,-ry*1.3],[0,-ry*2.0],[-rx,-ry*0.5],[rx,-ry*0.5]].forEach(([ox,oy])=>{
    ctx.fillStyle=shade('#3a8a3a',li);
    ctx.beginPath(); ctx.ellipse(top.x+ox,top.y+oy,rx*0.75,ry*0.75,0,0,Math.PI*2); ctx.fill();
  });
}

// Controls
function switchRoom(room, btn) {
  INT.room = room;
  document.querySelectorAll('[id^=tab-]').forEach(b=>b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const badge = document.getElementById('room-badge');
  if (badge) badge.textContent = ROOM_LABELS[room]||room;
  renderFurnitureList();
  drawInterior();
}
function setWallColor(el, color) {
  document.querySelectorAll('.theme-sw').forEach(s=>s.classList.remove('active'));
  if (el) el.classList.add('active');
  INT.wallColor = color;
  drawInterior();
}
function setFloor(btn, type) {
  document.querySelectorAll('[id^=fl-]').forEach(b=>b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  INT.floorType = type;
  drawInterior();
}
function setLighting(val) { INT.lightLevel = parseInt(val); drawInterior(); }
function setLightType(btn, type) {
  document.querySelectorAll('[id^=lt-]').forEach(b=>b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  INT.lightType = type;
  drawInterior();
}
function renderFurnitureList() {
  const el = document.getElementById('furniture-list');
  if (!el) return;
  const items = ROOM_FURNITURE[INT.room]||[];
  el.innerHTML = items.map(f=>`
    <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer;padding:.2rem 0">
      <input type="checkbox" ${INT.furniture[INT.room][f]?'checked':''} style="accent-color:var(--purple)"
             onchange="toggleFurniture('${f.replace(/'/g,"\\'")}',this.checked)"/>
      <span style="font-size:.82rem">${f}</span>
    </label>`).join('');
}
function toggleFurniture(name, on) { INT.furniture[INT.room][name]=on; drawInterior(); }

window.addEventListener('DOMContentLoaded', initInterior);
window.addEventListener('resize', () => {
  if (!INT.canvas) return;
  INT.canvas.width  = INT.canvas.parentElement.clientWidth  || 680;
  INT.canvas.height = INT.canvas.parentElement.clientHeight || 460;
  drawInterior();
});
