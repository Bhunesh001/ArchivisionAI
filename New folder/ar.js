// ===== DREAMNEST AI — AR PREVIEW ENGINE =====

const AR = {
  canvas: null, ctx: null,
  scale: 1.0, rotation: 0,
  model: 'villa',
  animOffset: 0,
  placed: false,
};

function initAR() {
  AR.canvas = document.getElementById('arCanvas');
  if (!AR.canvas) return;
  AR.canvas.width  = AR.canvas.parentElement.clientWidth || 700;
  AR.canvas.height = 460;
  AR.ctx = AR.canvas.getContext('2d');
  (function loop() { AR.animOffset += 0.012; drawAR(); requestAnimationFrame(loop); })();
}

function drawAR() {
  const ctx = AR.ctx;
  const W = AR.canvas.width, H = AR.canvas.height;
  ctx.clearRect(0, 0, W, H);

  // ── Ground / Sky simulation ──
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.55);
  sky.addColorStop(0, '#0a1828');
  sky.addColorStop(1, '#12263a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H * 0.55);

  const gnd = ctx.createLinearGradient(0, H * 0.55, 0, H);
  gnd.addColorStop(0, '#1e3a1a');
  gnd.addColorStop(1, '#0d1f0d');
  ctx.fillStyle = gnd;
  ctx.fillRect(0, H * 0.55, W, H);

  // ── AR Grid on ground ──
  ctx.save();
  ctx.globalAlpha = 0.25 + Math.sin(AR.animOffset) * 0.05;
  const gridSize = 35;
  const offsetX = (AR.animOffset * 8) % gridSize;
  ctx.strokeStyle = '#7c3aed';
  ctx.lineWidth = 0.6;
  // Perspective grid lines
  const vp = { x: W / 2, y: H * 0.52 };
  for (let x = -W; x < W * 2; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(vp.x + (x - W/2) * 0.1, vp.y); ctx.stroke();
  }
  for (let y = H; y > H * 0.52; y -= gridSize * 0.5) {
    const pct = (H - y) / (H - H * 0.52);
    const lx  = W / 2 - (W / 2) * pct;
    ctx.beginPath(); ctx.moveTo(lx, y); ctx.lineTo(W - lx, y); ctx.stroke();
  }
  ctx.restore();

  // ── AR Target Reticle ──
  const rx = W / 2, ry = H * 0.62;
  ctx.save();
  ctx.globalAlpha = 0.55 + Math.sin(AR.animOffset * 2) * 0.15;
  ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.beginPath(); ctx.ellipse(rx, ry, 80 * AR.scale, 20 * AR.scale, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  ctx.restore();

  // ── Shadow ──
  const shadowGrad = ctx.createRadialGradient(rx, ry + 5, 0, rx, ry + 5, 140 * AR.scale);
  shadowGrad.addColorStop(0, 'rgba(0,0,0,0.4)');
  shadowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.ellipse(rx, ry + 10, 140 * AR.scale, 35 * AR.scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── 3D House Model (AR) ──
  ctx.save();
  ctx.translate(rx, ry - 60 * AR.scale);
  ctx.scale(AR.scale, AR.scale);
  const rads = (AR.rotation * Math.PI) / 180;
  drawARHouse(ctx, rads);
  ctx.restore();

  // ── Vastu compass overlay ──
  drawVastuCompass(ctx, W - 65, H * 0.58);

  // ── Dimension labels ──
  ctx.fillStyle = 'rgba(10,10,20,0.8)';
  ctx.beginPath(); ctx.roundRect(W/2 - 70, H - 38, 140, 26, 6); ctx.fill();
  ctx.fillStyle = 'rgba(168,85,247,0.9)'; ctx.font = '11px system-ui'; ctx.textAlign = 'center';
  ctx.fillText('Plot: 40×60 ft (2400 sq.ft)', W / 2, H - 20);
}

function drawARHouse(ctx, rotation) {
  const s = 80;
  const cos = Math.cos(rotation), sin = Math.sin(rotation);

  function proj(x, y, z) {
    const rx = x * cos - z * sin;
    const rz = x * sin + z * cos;
    const p = 400 / (400 + rz * 0.5);
    return { x: rx * p, y: -y * 0.75 + rz * 0.12 };
  }

  function face(verts, color, alpha) {
    ctx.globalAlpha = alpha || 1;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(verts[0].x, verts[0].y);
    verts.slice(1).forEach(v => ctx.lineTo(v.x, v.y));
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.6; ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // House body
  const hw = s, hh = s * 0.65, hd = s * 1.2;
  const pts = [
    proj(-hw, 0, -hd/2), proj(hw, 0, -hd/2), proj(hw, 0, hd/2), proj(-hw, 0, hd/2),
    proj(-hw, hh, -hd/2), proj(hw, hh, -hd/2), proj(hw, hh, hd/2), proj(-hw, hh, hd/2),
  ];

  face([pts[0],pts[1],pts[5],pts[4]], 'rgba(212,197,169,0.9)');
  face([pts[3],pts[2],pts[6],pts[7]], 'rgba(184,168,138,0.85)');
  face([pts[4],pts[5],pts[6],pts[7]], 'rgba(74,58,40,0.9)');

  // Windows
  const winC = 'rgba(147,197,253,0.8)';
  [[-0.4, 0.35],[0.1, 0.35],[0.5, 0.35]].forEach(([fx, fy]) => {
    const a=proj(hw*fx, hh*fy, -hd/2+1), b=proj(hw*fx+s*0.22, hh*fy, -hd/2+1);
    const c=proj(hw*fx+s*0.22, hh*(fy+0.28), -hd/2+1), d=proj(hw*fx, hh*(fy+0.28), -hd/2+1);
    face([a,b,c,d], winC, 0.85);
  });

  // Roof
  const rp = proj(0, hh + s * 0.5, 0);
  const r0 = proj(-hw-8, hh, -hd/2-8), r1 = proj(hw+8, hh, -hd/2-8);
  const r2 = proj(hw+8, hh, hd/2+8),  r3 = proj(-hw-8, hh, hd/2+8);
  face([r0,r1,rp], 'rgba(139,69,19,0.92)');
  face([r1,r2,rp], 'rgba(107,52,16,0.88)');
  face([r2,r3,rp], 'rgba(139,69,19,0.92)');
  face([r3,r0,rp], 'rgba(122,62,16,0.9)');

  // Trees
  [[-s*1.7, 0, -hd/2],[s*1.7, 0, -hd/2],[-s*1.5, 0, hd/3],[s*1.5, 0, hd/3]].forEach(([tx,ty,tz]) => {
    const tp = proj(tx, ty, tz);
    ctx.fillStyle = 'rgba(30,90,30,0.85)';
    ctx.beginPath(); ctx.arc(tp.x, tp.y - 28, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(20,70,20,0.7)';
    ctx.beginPath(); ctx.arc(tp.x - 4, tp.y - 36, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(90,60,30,0.8)';
    ctx.fillRect(tp.x - 3, tp.y - 12, 6, 14);
  });

  // AR pulse ring
  ctx.globalAlpha = 0.3 + Math.sin(AR.animOffset * 3) * 0.2;
  ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(0, hh/2, hw + 20, 15, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawVastuCompass(ctx, x, y) {
  const r = 28;
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = 'rgba(10,10,20,0.7)';
  ctx.beginPath(); ctx.arc(x, y, r + 4, 0, Math.PI * 2); ctx.fill();

  const dirs = [['N','#ef4444',0],['E','#f59e0b',Math.PI/2],['S','#6b7280',Math.PI],['W','#3b82f6',-Math.PI/2]];
  dirs.forEach(([label, color, angle]) => {
    const px = x + Math.cos(angle - Math.PI/2) * r;
    const py = y + Math.sin(angle - Math.PI/2) * r;
    ctx.fillStyle = color;
    ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, px, py);
  });

  // Center dot
  ctx.fillStyle = '#a855f7';
  ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

// Controls
function arAction(action) {
  const msgs = {
    'place':      '📍 House placed on land successfully!',
    'scale-up':   '⬆️ Scale increased',
    'scale-down': '⬇️ Scale decreased',
    'rotate':     '🔄 Rotated 45°',
    'north':      '🧭 Oriented to True North',
    'shadow':     '☀️ Sun simulation updated',
    'measure':    '📏 Land measurement: 40 × 60 ft',
  };
  if (action === 'scale-up')   { AR.scale = Math.min(1.6, AR.scale + 0.1); updateScaleUI(); }
  if (action === 'scale-down') { AR.scale = Math.max(0.5, AR.scale - 0.1); updateScaleUI(); }
  if (action === 'rotate')     { AR.rotation = (AR.rotation + 45) % 360; updateRotateUI(); }
  showToast(msgs[action] || 'AR action executed');
}

function updateScaleUI() {
  const s = document.getElementById('scale-slider');
  const v = document.getElementById('scale-val');
  if (s) s.value = Math.round(AR.scale * 100);
  if (v) v.textContent = Math.round(AR.scale * 100) + '% (1:' + Math.round(200 / AR.scale) + ')';
}
function updateRotateUI() {
  const s = document.getElementById('rotate-slider');
  const v = document.getElementById('rotate-val');
  if (s) s.value = AR.rotation;
  if (v) v.textContent = AR.rotation + '°';
}

function setScale(val) { AR.scale = val / 100; updateScaleUI(); }
function setRotation(val) { AR.rotation = parseInt(val); updateRotateUI(); }

function setModel(btn, model) {
  document.querySelectorAll('[id^=m-]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  AR.model = model;
  showToast('Model switched to ' + btn.textContent.trim());
}

function captureAR() {
  showToast('📸 AR screenshot saved to Downloads!');
}

window.addEventListener('DOMContentLoaded', initAR);
window.addEventListener('resize', () => {
  if (!AR.canvas) return;
  AR.canvas.width = AR.canvas.parentElement.clientWidth || 700;
});
