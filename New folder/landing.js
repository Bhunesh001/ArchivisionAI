// ===== DREAMNEST AI — LANDING PAGE =====

// Stat counters
(function animateCounters() {
  const targets = [
    { id: 'stat1', end: 50000, suffix: '+' },
    { id: 'stat2', end: 12000, suffix: '+' },
    { id: 'stat3', end: 42,    suffix: ''  }
  ];
  targets.forEach(t => {
    const el = document.getElementById(t.id);
    if (!el) return;
    let cur = 0;
    const step = t.end / 80;
    const timer = setInterval(() => {
      cur = Math.min(cur + step, t.end);
      el.textContent = Math.floor(cur).toLocaleString('en-IN') + t.suffix;
      if (cur >= t.end) clearInterval(timer);
    }, 25);
  });
})();

// Mobile menu
function toggleMenu() {
  const links = document.querySelector('.land-nav-links');
  if (!links) return;
  if (links.style.display === 'flex') {
    links.style.display = '';
  } else {
    links.style.display = 'flex';
    links.style.flexDirection = 'column';
    links.style.position = 'absolute';
    links.style.top = '64px';
    links.style.left = '0';
    links.style.right = '0';
    links.style.background = 'rgba(18,18,26,0.98)';
    links.style.padding = '1.5rem 2rem';
    links.style.borderBottom = '1px solid #2e2e45';
    links.style.zIndex = '999';
  }
}

// ===== ISOMETRIC DEMO CANVAS =====
(function drawIsometricDemo() {
  const canvas = document.getElementById('isoDemo');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  drawFullIso(ctx, canvas.width, canvas.height);
})();

function drawFullIso(ctx, W, H) {
  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, W, H);

  const cx = W / 2, cy = H * 0.42;
  const TW = 64, TH = 32; // tile width/height

  // Convert grid coords to isometric screen coords
  function toIso(col, row, z = 0) {
    return {
      x: cx + (col - row) * (TW / 2),
      y: cy + (col + row) * (TH / 2) - z * TH
    };
  }

  function drawTile(col, row, z, topColor, leftColor, rightColor, height = 1) {
    const p = toIso(col, row, z);
    const tw = TW / 2, th = TH / 2;

    // Top face
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - th);
    ctx.lineTo(p.x + tw, p.y);
    ctx.lineTo(p.x, p.y + th);
    ctx.lineTo(p.x - tw, p.y);
    ctx.closePath();
    ctx.fillStyle = topColor;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    if (height > 0) {
      // Left face
      ctx.beginPath();
      ctx.moveTo(p.x - tw, p.y);
      ctx.lineTo(p.x, p.y + th);
      ctx.lineTo(p.x, p.y + th + height * TH);
      ctx.lineTo(p.x - tw, p.y + height * TH);
      ctx.closePath();
      ctx.fillStyle = leftColor;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.stroke();

      // Right face
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + th);
      ctx.lineTo(p.x + tw, p.y);
      ctx.lineTo(p.x + tw, p.y + height * TH);
      ctx.lineTo(p.x, p.y + th + height * TH);
      ctx.closePath();
      ctx.fillStyle = rightColor;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.stroke();
    }
  }

  // ---- FLOOR TILES ----
  const rooms = [
    // Living room (beige/cream)
    { cols: [0,1,2,3], rows: [0,1,2,3], top: '#e8dcc8', left: '#c8b89a', right: '#d4c4a8' },
    // Kitchen (light green)
    { cols: [4,5,6], rows: [0,1,2], top: '#d4e8c8', left: '#aac89a', right: '#bdd4a8' },
    // Bedroom (light blue)
    { cols: [4,5,6], rows: [3,4,5], top: '#c8d8e8', left: '#9ab8c8', right: '#adc4d8' },
    // Bathroom (brown/warm)
    { cols: [0,1,2], rows: [4,5,6], top: '#d4b898', left: '#b49078', right: '#c4a488' },
    // Hallway (neutral)
    { cols: [3,4], rows: [3,4], top: '#d0d0c0', left: '#b0b0a0', right: '#c0c0b0' },
  ];

  rooms.forEach(room => {
    room.cols.forEach(col => {
      room.rows.forEach(row => {
        drawTile(col, row, 0, room.top, room.left, room.right, 0);
      });
    });
  });

  // ---- WALLS ----
  function drawWall(col, row, z, top, left, right) {
    drawTile(col, row, z, top, left, right, 1.2);
  }

  // Outer walls
  const wallTop = '#f0ece0', wallLeft = '#c8c4b8', wallRight = '#d8d4c8';
  // Top boundary
  for (let c = 0; c <= 6; c++) drawWall(c, -1, 0, wallTop, wallLeft, wallRight);
  // Left boundary
  for (let r = 0; r <= 6; r++) drawWall(-1, r, 0, wallTop, wallLeft, wallRight);
  // Right boundary
  for (let r = 0; r <= 6; r++) drawWall(7, r, 0, wallTop, wallLeft, wallRight);
  // Bottom boundary
  for (let c = -1; c <= 7; c++) drawWall(c, 7, 0, wallTop, wallLeft, wallRight);
  // Internal wall between living and bathroom
  for (let c = 0; c <= 2; c++) drawWall(c, 3.5, 0, wallTop, wallLeft, wallRight);
  // Internal wall between kitchen and bedroom
  for (let r = 0; r <= 2; r++) drawWall(3.5, r, 0, wallTop, wallLeft, wallRight);

  // ---- FURNITURE ----

  // Living room sofa (large, grey)
  function drawBox(col, row, z, w, d, h, top, left, right) {
    const p = toIso(col + w / 2, row + d / 2, z);
    const tw = (TW / 2) * w, th = (TH / 2) * d;

    ctx.beginPath();
    ctx.moveTo(p.x, p.y - th);
    ctx.lineTo(p.x + tw, p.y);
    ctx.lineTo(p.x, p.y + th);
    ctx.lineTo(p.x - tw, p.y);
    ctx.closePath();
    ctx.fillStyle = top; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.8; ctx.stroke();

    const wallH = h * TH;
    ctx.beginPath();
    ctx.moveTo(p.x - tw, p.y);
    ctx.lineTo(p.x, p.y + th);
    ctx.lineTo(p.x, p.y + th + wallH);
    ctx.lineTo(p.x - tw, p.y + wallH);
    ctx.closePath();
    ctx.fillStyle = left; ctx.fill(); ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(p.x, p.y + th);
    ctx.lineTo(p.x + tw, p.y);
    ctx.lineTo(p.x + tw, p.y + wallH);
    ctx.lineTo(p.x, p.y + th + wallH);
    ctx.closePath();
    ctx.fillStyle = right; ctx.fill(); ctx.stroke();
  }

  // Sofa — living room
  drawBox(0.3, 1.8, 0, 1.8, 0.7, 0.5, '#9b8ea8', '#7a6e88', '#8a7e98');
  // Coffee table
  drawBox(1.0, 0.8, 0, 0.9, 0.7, 0.25, '#c8a87a', '#a88858', '#b89868');
  // Armchair
  drawBox(2.8, 0.3, 0, 0.7, 0.7, 0.5, '#e8b0a0', '#c89080', '#d8a090');
  // Round table (simulated as small box)
  drawBox(2.0, 1.5, 0, 0.6, 0.6, 0.3, '#f0e8d8', '#c8c0b0', '#d8d0c0');
  // Floor lamp dot
  const lampPos = toIso(3.2, 0.5, 0);
  ctx.beginPath(); ctx.arc(lampPos.x, lampPos.y - 10, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#f5e870'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(lampPos.x, lampPos.y); ctx.lineTo(lampPos.x, lampPos.y - 10);
  ctx.strokeStyle = '#888'; ctx.lineWidth = 1.5; ctx.stroke();

  // Kitchen counter
  drawBox(4.0, 0.0, 0, 2.8, 0.6, 0.6, '#e8e4d8', '#c0bcb0', '#d4d0c4');
  // Kitchen island
  drawBox(4.4, 1.2, 0, 1.6, 0.6, 0.5, '#d8d4c8', '#b0aca0', '#c4c0b4');
  // Fridge
  drawBox(6.2, 0.1, 0, 0.6, 0.8, 1.2, '#f0f0f0', '#c8c8c8', '#dcdcdc');
  // Dining table
  drawBox(4.2, 1.8, 0, 1.5, 1.0, 0.3, '#d4aa78', '#b48858', '#c49868');
  // Dining chairs
  drawBox(4.1, 1.6, 0, 0.4, 0.4, 0.4, '#a08060', '#806040', '#907050');
  drawBox(5.3, 1.6, 0, 0.4, 0.4, 0.4, '#a08060', '#806040', '#907050');

  // Bedroom bed
  drawBox(4.1, 3.1, 0, 2.4, 1.8, 0.5, '#8ab0d4', '#6a90b4', '#7aa0c4');
  // Pillow 1
  drawBox(4.2, 3.2, 0.5, 0.7, 0.4, 0.2, '#f0f0f0', '#d0d0d0', '#e0e0e0');
  // Pillow 2
  drawBox(5.3, 3.2, 0.5, 0.7, 0.4, 0.2, '#f0f0f0', '#d0d0d0', '#e0e0e0');
  // Wardrobe
  drawBox(6.0, 4.0, 0, 0.8, 1.8, 1.5, '#c8a870', '#a88850', '#b89860');
  // Nightstand
  drawBox(4.0, 4.6, 0, 0.5, 0.5, 0.4, '#c8a870', '#a88850', '#b89860');
  // Bedroom rug
  const rugPos = toIso(5.0, 4.8, 0);
  ctx.beginPath();
  ctx.moveTo(rugPos.x, rugPos.y - 16);
  ctx.lineTo(rugPos.x + 50, rugPos.y);
  ctx.lineTo(rugPos.x, rugPos.y + 16);
  ctx.lineTo(rugPos.x - 50, rugPos.y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(80,140,100,0.4)'; ctx.fill();
  ctx.strokeStyle = 'rgba(60,120,80,0.6)'; ctx.lineWidth = 1; ctx.stroke();

  // Bathroom bathtub
  drawBox(0.2, 4.2, 0, 1.0, 1.8, 0.5, '#f4f0ec', '#d4d0cc', '#e4e0dc');
  // Toilet
  drawBox(1.4, 4.2, 0, 0.6, 0.8, 0.6, '#f0eeec', '#d0cecc', '#e0dedc');
  // Sink
  drawBox(1.4, 5.5, 0, 0.6, 0.5, 0.5, '#e8e4e0', '#c8c4c0', '#d8d4d0');
  // Bathroom mat
  const matPos = toIso(1.2, 6.2, 0);
  ctx.beginPath();
  ctx.moveTo(matPos.x, matPos.y - 10);
  ctx.lineTo(matPos.x + 30, matPos.y);
  ctx.lineTo(matPos.x, matPos.y + 10);
  ctx.lineTo(matPos.x - 30, matPos.y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(100,180,150,0.5)'; ctx.fill();

  // ---- ROOM LABELS ----
  function drawLabel(col, row, text, color) {
    const p = toIso(col, row, 0);
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.fillText(text, p.x, p.y + 4);
  }
  drawLabel(1.5, 1.5, 'LIVING', 'rgba(80,50,120,0.9)');
  drawLabel(5.0, 1.0, 'KITCHEN', 'rgba(50,100,50,0.9)');
  drawLabel(5.0, 4.2, 'BEDROOM', 'rgba(40,80,120,0.9)');
  drawLabel(1.2, 5.2, 'BATHROOM', 'rgba(120,80,40,0.9)');

  // ---- LIGHTING GLOW ----
  const glow = ctx.createRadialGradient(cx, cy - 20, 0, cx, cy - 20, 200);
  glow.addColorStop(0, 'rgba(255,240,200,0.06)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
}
