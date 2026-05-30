// ===== DREAMNEST AI — REALISTIC 2D FLOOR PLAN ENGINE =====
// Style: Professional architectural top-down view with rooms, walls, furniture symbols

const FP2D = {
  canvas: null, ctx: null,
  zoom: 1.0, panX: 0, panY: 0,
  isPanning: false, lastPan: {x:0,y:0},
  selectedRoom: -1,
  showDimensions: true,
  showFurniture: true,
  showLabels: true,
  gridSize: 20,
  scale: 1, // pixels per foot
};

// House layout definition (feet)
const HOUSE_PLAN = {
  wallThickness: 8,  // pixels
  outerWidth: 580,
  outerHeight: 440,
  rooms: [
    {
      id:0, name:'Living Room', shortName:'LIVING ROOM',
      x:20, y:20, w:220, h:200,
      color:'#f5f0e8', wallColor:'#8a7a6a',
      furniture:[
        {type:'sofa',    x:30,  y:130, w:130, h:45, color:'#c8b89a'},
        {type:'sofa',    x:155, y:100, w:45,  h:80, color:'#c8b89a'},
        {type:'table',   x:60,  y:155, w:70,  h:50, color:'#b8a880', round:true},
        {type:'tv',      x:30,  y:30,  w:100, h:18, color:'#333'},
        {type:'plant',   x:195, y:25,  w:18,  h:18, color:'#4a8a4a'},
        {type:'plant',   x:25,  y:175, w:15,  h:15, color:'#4a8a4a'},
      ]
    },
    {
      id:1, name:'Master Bedroom', shortName:'MASTER BEDROOM',
      x:240, y:20, w:180, h:200,
      color:'#eef2f8', wallColor:'#7a8a9a',
      furniture:[
        {type:'bed',     x:50,  y:30,  w:130, h:90, color:'#a0b8d0', bedType:'double'},
        {type:'wardrobe',x:10,  y:10,  w:30,  h:80, color:'#c8a870'},
        {type:'wardrobe',x:145, y:10,  w:30,  h:80, color:'#c8a870'},
        {type:'dresser', x:10,  y:150, w:60,  h:30, color:'#c8a870'},
        {type:'plant',   x:155, y:160, w:15,  h:15, color:'#4a8a4a'},
      ]
    },
    {
      id:2, name:'Bedroom 2', shortName:'BEDROOM 2',
      x:420, y:20, w:160, h:190,
      color:'#f0ece4', wallColor:'#9a8a7a',
      furniture:[
        {type:'bed',     x:20,  y:30,  w:110, h:80, color:'#d0b8a0', bedType:'single'},
        {type:'wardrobe',x:10,  y:10,  w:25,  h:70, color:'#c8a870'},
        {type:'desk',    x:100, y:120, w:50,  h:35, color:'#b8a880'},
        {type:'chair',   x:108, y:148, w:25,  h:25, color:'#a09878'},
      ]
    },
    {
      id:3, name:'Kitchen', shortName:'KITCHEN',
      x:20, y:240, w:160, h:180,
      color:'#f8f4e8', wallColor:'#9a8a6a',
      furniture:[
        {type:'counter', x:10,  y:10,  w:140, h:35, color:'#e0d8c0'},
        {type:'counter', x:10,  y:50,  w:35,  h:100, color:'#e0d8c0'},
        {type:'stove',   x:10,  y:55,  w:35,  h:35, color:'#888'},
        {type:'sink',    x:90,  y:12,  w:40,  h:28, color:'#c0d8e0'},
        {type:'fridge',  x:120, y:12,  w:28,  h:35, color:'#d8d8d8'},
        {type:'table',   x:70,  y:110, w:65,  h:55, color:'#c8a870'},
        {type:'chair',   x:58,  y:118, w:22,  h:22, color:'#a89060'},
        {type:'chair',   x:130, y:118, w:22,  h:22, color:'#a89060'},
        {type:'chair',   x:80,  y:158, w:22,  h:22, color:'#a89060'},
      ]
    },
    {
      id:4, name:'Bathroom 1', shortName:'BATHROOM',
      x:200, y:240, w:120, h:100,
      color:'#e8f4f8', wallColor:'#7a9aaa',
      furniture:[
        {type:'bathtub', x:8,   y:8,   w:65,  h:40, color:'#f0f8ff'},
        {type:'toilet',  x:85,  y:8,   w:28,  h:38, color:'#f0f0f0'},
        {type:'sink2',   x:8,   y:60,  w:35,  h:28, color:'#e8f0f8'},
      ]
    },
    {
      id:5, name:'Bathroom 2', shortName:'TOILET',
      x:200, y:350, w:120, h:70,
      color:'#f0f8f4', wallColor:'#7aaa8a',
      furniture:[
        {type:'toilet',  x:8,   y:10,  w:28,  h:38, color:'#f0f0f0'},
        {type:'sink2',   x:60,  y:10,  w:35,  h:28, color:'#e8f0f8'},
        {type:'shower',  x:60,  y:45,  w:50,  h:15, color:'#c0e8f0'},
      ]
    },
    {
      id:6, name:'Dining Room', shortName:'DINING',
      x:340, y:240, w:240, h:180,
      color:'#f4f0e4', wallColor:'#8a8060',
      furniture:[
        {type:'table',   x:55,  y:50,  w:130, h:80, color:'#c0a870'},
        {type:'chair',   x:35,  y:65,  w:25,  h:25, color:'#a08858'},
        {type:'chair',   x:175, y:65,  w:25,  h:25, color:'#a08858'},
        {type:'chair',   x:68,  y:35,  w:25,  h:25, color:'#a08858'},
        {type:'chair',   x:108, y:35,  w:25,  h:25, color:'#a08858'},
        {type:'chair',   x:68,  y:123, w:25,  h:25, color:'#a08858'},
        {type:'chair',   x:108, y:123, w:25,  h:25, color:'#a08858'},
        {type:'sideboard',x:10, y:10,  w:50,  h:25, color:'#b89060'},
        {type:'plant',   x:200, y:140, w:20,  h:20, color:'#4a8a4a'},
      ]
    },
    {
      id:7, name:'Garage', shortName:'GARAGE',
      x:20, y:440, w:200, h:120,
      color:'#ececec', wallColor:'#888888',
      furniture:[
        {type:'car',     x:15,  y:15,  w:75,  h:90, color:'#c0c8d8'},
        {type:'car',     x:110, y:15,  w:75,  h:90, color:'#d0c0b8'},
      ]
    },
    {
      id:8, name:'Hall / Passage', shortName:'HALL',
      x:20, y:220, w:560, h:20,
      color:'#f0ece0', wallColor:'#9a9080',
      furniture:[]
    },
  ],
  doors:[
    {x:130, y:220, w:40, h:8, angle:0, roomSide:'bottom'},
    {x:290, y:220, w:40, h:8, angle:0},
    {x:450, y:210, w:8,  h:40, angle:0},
    {x:200, y:280, w:8,  h:40, angle:0},
    {x:320, y:280, w:8,  h:40, angle:0},
    {x:390, y:240, w:40, h:8,  angle:0},
    {x:130, y:440, w:40, h:8,  angle:0},
    {x:220, y:440, w:8,  h:40, angle:0},
  ],
  windows:[
    {x:60,  y:20, w:60, h:8,  side:'top'},
    {x:280, y:20, w:70, h:8,  side:'top'},
    {x:460, y:20, w:60, h:8,  side:'top'},
    {x:20,  y:80, w:8,  h:60, side:'left'},
    {x:20,  y:310,w:8,  h:50, side:'left'},
    {x:500, y:60, w:8,  h:60, side:'right'},
    {x:500, y:280,w:8,  h:60, side:'right'},
    {x:100, y:568,w:60, h:8,  side:'bottom'},
    {x:200, y:420,w:8,  h:30, side:'internal'},
  ]
};

function initFloorPlan2D() {
  FP2D.canvas = document.getElementById('fp2dCanvas');
  if (!FP2D.canvas) return;
  resizeCanvas2D();
  FP2D.ctx = FP2D.canvas.getContext('2d');

  // Center the plan
  const plan = HOUSE_PLAN;
  FP2D.panX = (FP2D.canvas.width  - plan.outerWidth  * FP2D.zoom) / 2;
  FP2D.panY = (FP2D.canvas.height - plan.outerHeight * FP2D.zoom) / 2 - 20;

  bindEvents2D();
  draw2D();
}

function resizeCanvas2D() {
  const wrap = document.getElementById('fp2dCanvas')?.parentElement;
  if (!wrap) return;
  FP2D.canvas.width  = wrap.clientWidth  || 800;
  FP2D.canvas.height = wrap.clientHeight || 560;
}

function draw2D() {
  const ctx = FP2D.ctx;
  if (!ctx) return;
  const W = FP2D.canvas.width, H = FP2D.canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = '#f8f6f0';
  ctx.fillRect(0, 0, W, H);

  // Grid
  if (FP2D.showDimensions) drawGrid2D(ctx, W, H);

  ctx.save();
  ctx.translate(FP2D.panX, FP2D.panY);
  ctx.scale(FP2D.zoom, FP2D.zoom);

  drawShadow2D(ctx);
  drawRooms2D(ctx);
  drawWalls2D(ctx);
  drawWindows2D(ctx);
  drawDoors2D(ctx);
  if (FP2D.showFurniture) drawFurniture2D(ctx);
  if (FP2D.showLabels)    drawLabels2D(ctx);
  if (FP2D.showDimensions) drawDimensions2D(ctx);

  ctx.restore();
  drawCompass2D(ctx, W, H);
  drawScale2D(ctx, W, H);
}

function drawGrid2D(ctx, W, H) {
  ctx.strokeStyle = 'rgba(180,170,160,0.25)';
  ctx.lineWidth = 0.5;
  const gs = FP2D.gridSize * FP2D.zoom;
  const ox = FP2D.panX % gs, oy = FP2D.panY % gs;
  for (let x = ox; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y = oy; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
}

function drawShadow2D(ctx) {
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur  = 18;
  ctx.shadowOffsetX = 6;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#fff';
  ctx.fillRect(-2, -2, HOUSE_PLAN.outerWidth + 60, HOUSE_PLAN.outerHeight + 140);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur  = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

function drawRooms2D(ctx) {
  HOUSE_PLAN.rooms.forEach((room, idx) => {
    const sel = idx === FP2D.selectedRoom;
    ctx.fillStyle = sel ? lighten2D(room.color, 15) : room.color;
    ctx.fillRect(room.x, room.y, room.w, room.h);
    if (sel) {
      ctx.strokeStyle = '#7c3aed';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(room.x + 1, room.y + 1, room.w - 2, room.h - 2);
      ctx.setLineDash([]);
    }
  });
}

function drawWalls2D(ctx) {
  const wt = HOUSE_PLAN.wallThickness;
  ctx.fillStyle = '#5a5040';
  ctx.lineJoin = 'miter';

  // Outer walls
  const ow = HOUSE_PLAN.outerWidth + 40;
  const oh = HOUSE_PLAN.outerHeight + 20;

  // Draw thick walls as filled rectangles around each room
  HOUSE_PLAN.rooms.forEach(room => {
    ctx.fillStyle = room.wallColor || '#7a6a5a';
    // Top wall
    ctx.fillRect(room.x - wt/2, room.y - wt/2, room.w + wt, wt);
    // Bottom wall
    ctx.fillRect(room.x - wt/2, room.y + room.h - wt/2, room.w + wt, wt);
    // Left wall
    ctx.fillRect(room.x - wt/2, room.y - wt/2, wt, room.h + wt);
    // Right wall
    ctx.fillRect(room.x + room.w - wt/2, room.y - wt/2, wt, room.h + wt);
  });

  // Outer boundary double wall
  ctx.fillStyle = '#4a4030';
  const margin = 10;
  // Top
  ctx.fillRect(10, 10, ow - 20, wt + 3);
  // Bottom (excluding garage extension)
  ctx.fillRect(10, 430, 580, wt + 3);
  ctx.fillRect(10, 560, 210, wt + 3);
  // Left
  ctx.fillRect(10, 10, wt + 3, 560);
  // Right
  ctx.fillRect(575, 10, wt + 3, 430);
  // Garage bottom
  ctx.fillRect(10, 550, 210, wt + 3);
  ctx.fillRect(220, 430, wt + 3, 135);
}

function drawWindows2D(ctx) {
  HOUSE_PLAN.windows.forEach(win => {
    // White gap in wall
    ctx.fillStyle = '#f8f6f0';
    if (win.side === 'top' || win.side === 'bottom') {
      ctx.fillRect(win.x, win.y - 1, win.w, 12);
    } else {
      ctx.fillRect(win.x - 1, win.y, 12, win.h);
    }
    // Window lines (triple line style)
    ctx.strokeStyle = '#5090c0';
    ctx.lineWidth = 1.5;
    if (win.side === 'top' || win.side === 'bottom') {
      const y = win.y + 2;
      ctx.strokeRect(win.x, y, win.w, 6);
      ctx.beginPath(); ctx.moveTo(win.x + win.w/2, y); ctx.lineTo(win.x + win.w/2, y + 6); ctx.stroke();
      // Glass fill
      ctx.fillStyle = 'rgba(160,210,240,0.35)';
      ctx.fillRect(win.x + 1, y + 1, win.w/2 - 1, 4);
      ctx.fillRect(win.x + win.w/2 + 1, y + 1, win.w/2 - 1, 4);
    } else {
      const x = win.x + 2;
      ctx.strokeRect(x, win.y, 6, win.h);
      ctx.beginPath(); ctx.moveTo(x, win.y + win.h/2); ctx.lineTo(x + 6, win.y + win.h/2); ctx.stroke();
      ctx.fillStyle = 'rgba(160,210,240,0.35)';
      ctx.fillRect(x + 1, win.y + 1, 4, win.h/2 - 1);
      ctx.fillRect(x + 1, win.y + win.h/2 + 1, 4, win.h/2 - 1);
    }
  });
}

function drawDoors2D(ctx) {
  HOUSE_PLAN.doors.forEach(door => {
    ctx.fillStyle = '#f8f6f0';
    ctx.fillRect(door.x, door.y, door.w, door.h);

    // Door arc symbol
    ctx.strokeStyle = '#8a7060';
    ctx.lineWidth = 1.2;
    if (door.w > door.h) {
      // Horizontal door
      ctx.fillStyle = '#d4c8b0';
      ctx.fillRect(door.x, door.y, door.w, 6);
      ctx.strokeRect(door.x, door.y, door.w, 6);
      // Swing arc
      ctx.beginPath();
      ctx.arc(door.x, door.y + 3, door.w, -Math.PI/2, 0);
      ctx.setLineDash([3, 2]);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      // Vertical door
      ctx.fillStyle = '#d4c8b0';
      ctx.fillRect(door.x, door.y, 6, door.h);
      ctx.strokeRect(door.x, door.y, 6, door.h);
      ctx.beginPath();
      ctx.arc(door.x + 3, door.y, door.h, 0, Math.PI/2);
      ctx.setLineDash([3, 2]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });
}

function drawFurniture2D(ctx) {
  HOUSE_PLAN.rooms.forEach(room => {
    ctx.save();
    ctx.translate(room.x + FP2D.wallThickness/2, room.y + FP2D.wallThickness/2);
    drawRoomFurniture2D(ctx, room.furniture);
    ctx.restore();
  });
}

function drawRoomFurniture2D(ctx, furniture) {
  furniture.forEach(item => {
    ctx.save();
    ctx.translate(item.x + item.w/2, item.y + item.h/2);

    switch(item.type) {
      case 'sofa':
        drawSofa2D(ctx, item);
        break;
      case 'bed':
        drawBed2D(ctx, item);
        break;
      case 'table':
        drawTable2D(ctx, item);
        break;
      case 'chair':
        drawChair2D(ctx, item);
        break;
      case 'wardrobe':
        drawWardrobe2D(ctx, item);
        break;
      case 'counter':
        drawCounter2D(ctx, item);
        break;
      case 'sink': case 'sink2':
        drawSink2D(ctx, item);
        break;
      case 'stove':
        drawStove2D(ctx, item);
        break;
      case 'bathtub':
        drawBathtub2D(ctx, item);
        break;
      case 'toilet':
        drawToilet2D(ctx, item);
        break;
      case 'shower':
        drawShower2D(ctx, item);
        break;
      case 'fridge':
        drawFridge2D(ctx, item);
        break;
      case 'tv':
        drawTV2D(ctx, item);
        break;
      case 'desk':
        drawDesk2D(ctx, item);
        break;
      case 'plant':
        drawPlant2D(ctx, item);
        break;
      case 'car':
        drawCar2D(ctx, item);
        break;
      case 'sideboard':
        drawSideboard2D(ctx, item);
        break;
      case 'dresser':
        drawDresser2D(ctx, item);
        break;
    }
    ctx.restore();
  });
}

function drawSofa2D(ctx, item) {
  const hw = item.w/2, hh = item.h/2;
  // Base
  ctx.fillStyle = item.color;
  ctx.strokeStyle = darken2D(item.color, 30);
  ctx.lineWidth = 1;
  roundRect2D(ctx, -hw, -hh, item.w, item.h, 4); ctx.fill(); ctx.stroke();
  // Cushions
  ctx.fillStyle = lighten2D(item.color, 15);
  if (item.w > item.h) {
    const cw = (item.w - 10) / 3;
    for (let i = 0; i < 3; i++) {
      roundRect2D(ctx, -hw + 4 + i*(cw+1), -hh + 4, cw - 2, item.h*0.55 - 4, 3);
      ctx.fill(); ctx.stroke();
    }
    // Back
    ctx.fillStyle = darken2D(item.color, 10);
    roundRect2D(ctx, -hw + 2, -hh + item.h*0.55, item.w - 4, item.h*0.4, 3);
    ctx.fill(); ctx.stroke();
  } else {
    const ch = (item.h - 10) / 2;
    for (let i = 0; i < 2; i++) {
      roundRect2D(ctx, -hw + 4, -hh + 4 + i*(ch+1), item.w*0.55 - 4, ch - 2, 3);
      ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = darken2D(item.color, 10);
    roundRect2D(ctx, -hw + item.w*0.55, -hh + 2, item.w*0.4, item.h - 4, 3);
    ctx.fill(); ctx.stroke();
  }
}

function drawBed2D(ctx, item) {
  const hw = item.w/2, hh = item.h/2;
  // Base
  ctx.fillStyle = '#e8e0d0';
  ctx.strokeStyle = '#a09080';
  ctx.lineWidth = 1.5;
  roundRect2D(ctx, -hw, -hh, item.w, item.h, 4); ctx.fill(); ctx.stroke();
  // Mattress
  ctx.fillStyle = item.color;
  roundRect2D(ctx, -hw+4, -hh+20, item.w-8, item.h-24, 3); ctx.fill(); ctx.stroke();
  // Headboard
  ctx.fillStyle = '#c8a870';
  ctx.fillRect(-hw, -hh, item.w, 18);
  ctx.strokeRect(-hw, -hh, item.w, 18);
  // Pillows
  ctx.fillStyle = '#f8f4f0';
  ctx.strokeStyle = '#c8c0b8';
  ctx.lineWidth = 0.8;
  if (item.bedType === 'double') {
    roundRect2D(ctx, -hw+8, -hh+22, item.w/2-12, 25, 4); ctx.fill(); ctx.stroke();
    roundRect2D(ctx, 4, -hh+22, item.w/2-12, 25, 4); ctx.fill(); ctx.stroke();
  } else {
    roundRect2D(ctx, -hw+8, -hh+22, item.w-16, 22, 4); ctx.fill(); ctx.stroke();
  }
  // Blanket fold
  ctx.fillStyle = lighten2D(item.color, 10);
  ctx.strokeStyle = item.color;
  ctx.lineWidth = 0.5;
  ctx.fillRect(-hw+4, hh-20, item.w-8, 16);
  ctx.strokeRect(-hw+4, hh-20, item.w-8, 16);
}

function drawTable2D(ctx, item) {
  const hw = item.w/2, hh = item.h/2;
  if (item.round) {
    ctx.fillStyle = item.color;
    ctx.strokeStyle = darken2D(item.color, 25);
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = darken2D(item.color, 15);
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.ellipse(0, 0, hw-4, hh-4, 0, 0, Math.PI*2); ctx.stroke();
  } else {
    ctx.fillStyle = item.color;
    ctx.strokeStyle = darken2D(item.color, 25);
    ctx.lineWidth = 1.5;
    roundRect2D(ctx, -hw, -hh, item.w, item.h, 3); ctx.fill(); ctx.stroke();
    // Table legs
    ctx.fillStyle = darken2D(item.color, 20);
    [[-hw+3,-hh+3],[hw-8,-hh+3],[-hw+3,hh-8],[hw-8,hh-8]].forEach(([lx,ly])=>{
      ctx.fillRect(lx, ly, 5, 5);
    });
  }
}

function drawChair2D(ctx, item) {
  const hw = item.w/2, hh = item.h/2;
  ctx.fillStyle = item.color;
  ctx.strokeStyle = darken2D(item.color, 30);
  ctx.lineWidth = 1;
  roundRect2D(ctx, -hw, -hh, item.w, item.h, 3); ctx.fill(); ctx.stroke();
  // Seat cushion
  ctx.fillStyle = lighten2D(item.color, 20);
  roundRect2D(ctx, -hw+3, -hh+6, item.w-6, item.h-10, 2); ctx.fill(); ctx.stroke();
  // Back
  ctx.fillStyle = darken2D(item.color, 10);
  ctx.fillRect(-hw+2, -hh+2, item.w-4, 5);
}

function drawWardrobe2D(ctx, item) {
  const hw = item.w/2, hh = item.h/2;
  ctx.fillStyle = item.color;
  ctx.strokeStyle = darken2D(item.color, 30);
  ctx.lineWidth = 1.5;
  ctx.fillRect(-hw, -hh, item.w, item.h); ctx.stroke();
  ctx.strokeRect(-hw, -hh, item.w, item.h);
  // Door lines
  const n = Math.floor(item.w / 20);
  for (let i = 1; i < n; i++) {
    ctx.beginPath();
    ctx.moveTo(-hw + i * (item.w/n), -hh);
    ctx.lineTo(-hw + i * (item.w/n), hh);
    ctx.stroke();
  }
  // Handles
  ctx.fillStyle = '#888';
  for (let i = 0; i < n; i++) {
    ctx.fillRect(-hw + i*(item.w/n) + item.w/(n*2) - 2, -3, 4, 6);
  }
}

function drawCounter2D(ctx, item) {
  const hw = item.w/2, hh = item.h/2;
  ctx.fillStyle = item.color;
  ctx.strokeStyle = darken2D(item.color, 20);
  ctx.lineWidth = 1.5;
  ctx.fillRect(-hw, -hh, item.w, item.h); ctx.stroke();
  ctx.strokeRect(-hw, -hh, item.w, item.h);
  // Inner edge
  ctx.strokeStyle = darken2D(item.color, 10);
  ctx.lineWidth = 0.5;
  ctx.strokeRect(-hw+3, -hh+3, item.w-6, item.h-6);
}

function drawSink2D(ctx, item) {
  const hw = item.w/2, hh = item.h/2;
  ctx.fillStyle = '#ddeef8';
  ctx.strokeStyle = '#8ab0c8';
  ctx.lineWidth = 1.5;
  roundRect2D(ctx, -hw, -hh, item.w, item.h, 4); ctx.fill(); ctx.stroke();
  // Basin
  ctx.fillStyle = 'rgba(160,210,240,0.5)';
  ctx.beginPath(); ctx.ellipse(0, 2, hw*0.65, hh*0.65, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  // Drain
  ctx.fillStyle = '#8ab0c8';
  ctx.beginPath(); ctx.arc(0, 2, 3, 0, Math.PI*2); ctx.fill();
  // Tap
  ctx.fillStyle = '#aaa';
  ctx.fillRect(-3, -hh+4, 6, 8);
}

function drawStove2D(ctx, item) {
  const hw = item.w/2, hh = item.h/2;
  ctx.fillStyle = '#555';
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1.5;
  ctx.fillRect(-hw, -hh, item.w, item.h); ctx.stroke();
  ctx.strokeRect(-hw, -hh, item.w, item.h);
  // Burners
  const burners = [[-hw*0.45,-hh*0.4],[hw*0.45,-hh*0.4],[-hw*0.45,hh*0.4],[hw*0.45,hh*0.4]];
  burners.forEach(([bx,by]) => {
    ctx.strokeStyle = '#888'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(bx, by, 7, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(bx, by, 3, 0, Math.PI*2); ctx.stroke();
  });
}

function drawBathtub2D(ctx, item) {
  const hw = item.w/2, hh = item.h/2;
  ctx.fillStyle = '#e8f4f8';
  ctx.strokeStyle = '#90b8c8';
  ctx.lineWidth = 2;
  roundRect2D(ctx, -hw, -hh, item.w, item.h, 10); ctx.fill(); ctx.stroke();
  // Inner tub
  ctx.fillStyle = 'rgba(160,220,240,0.4)';
  roundRect2D(ctx, -hw+6, -hh+6, item.w-12, item.h-12, 8); ctx.fill();
  ctx.strokeStyle = '#a0c8d8'; ctx.lineWidth = 1;
  roundRect2D(ctx, -hw+6, -hh+6, item.w-12, item.h-12, 8); ctx.stroke();
  // Drain
  ctx.fillStyle = '#90b0c0';
  ctx.beginPath(); ctx.arc(0, hh-12, 4, 0, Math.PI*2); ctx.fill();
  // Tap
  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(-5, -hh+8, 10, 8);
}

function drawToilet2D(ctx, item) {
  const hw = item.w/2, hh = item.h/2;
  // Tank
  ctx.fillStyle = '#f0f0f0';
  ctx.strokeStyle = '#c0c0c0';
  ctx.lineWidth = 1.5;
  ctx.fillRect(-hw, -hh, item.w, item.h*0.3); ctx.stroke();
  ctx.strokeRect(-hw, -hh, item.w, item.h*0.3);
  // Bowl (oval)
  ctx.fillStyle = '#f8f8f8';
  ctx.strokeStyle = '#c0c0c0';
  ctx.beginPath();
  ctx.ellipse(0, hh*0.2, hw*0.85, hh*0.65, 0, 0, Math.PI*2);
  ctx.fill(); ctx.stroke();
  // Seat
  ctx.strokeStyle = '#b0b0b0'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, hh*0.2, hw*0.7, hh*0.52, 0, 0, Math.PI*2);
  ctx.stroke();
}

function drawShower2D(ctx, item) {
  const hw = item.w/2, hh = item.h/2;
  ctx.fillStyle = 'rgba(180,230,245,0.4)';
  ctx.strokeStyle = '#70a8c0';
  ctx.lineWidth = 1.5;
  ctx.fillRect(-hw, -hh, item.w, item.h); ctx.stroke();
  ctx.strokeRect(-hw, -hh, item.w, item.h);
  // Shower head
  ctx.fillStyle = '#90b8c8';
  ctx.beginPath(); ctx.arc(-hw+8, -hh+8, 5, 0, Math.PI*2); ctx.fill();
  // Lines
  ctx.strokeStyle = 'rgba(100,180,210,0.4)'; ctx.lineWidth = 0.5;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(-hw+5, -hh+18+i*8); ctx.lineTo(-hw+item.w-5, -hh+18+i*8); ctx.stroke();
  }
}

function drawFridge2D(ctx, item) {
  const hw = item.w/2, hh = item.h/2;
  ctx.fillStyle = item.color;
  ctx.strokeStyle = '#a0a0a0';
  ctx.lineWidth = 1.5;
  ctx.fillRect(-hw, -hh, item.w, item.h); ctx.stroke();
  ctx.strokeRect(-hw, -hh, item.w, item.h);
  // Divider
  ctx.beginPath(); ctx.moveTo(-hw, 0); ctx.lineTo(hw, 0); ctx.stroke();
  // Handles
  ctx.fillStyle = '#888';
  ctx.fillRect(-3, -hh+6, 6, 10);
  ctx.fillRect(-3, 5, 6, 10);
}

function drawTV2D(ctx, item) {
  const hw = item.w/2, hh = item.h/2;
  ctx.fillStyle = '#222';
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 1.5;
  roundRect2D(ctx, -hw, -hh, item.w, item.h, 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#1a3a5a';
  roundRect2D(ctx, -hw+2, -hh+2, item.w-4, item.h-4, 1); ctx.fill();
  // Stand
  ctx.fillStyle = '#333';
  ctx.fillRect(-5, hh-1, 10, 5);
}

function drawDesk2D(ctx, item) {
  const hw = item.w/2, hh = item.h/2;
  ctx.fillStyle = item.color;
  ctx.strokeStyle = darken2D(item.color, 25);
  ctx.lineWidth = 1.5;
  roundRect2D(ctx, -hw, -hh, item.w, item.h, 3); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = darken2D(item.color, 12);
  ctx.lineWidth = 0.5;
  ctx.strokeRect(-hw+4, -hh+4, item.w-8, item.h-8);
  // Monitor outline
  ctx.fillStyle = '#555';
  ctx.fillRect(-hw+8, -hh+4, item.w*0.5, 10);
}

function drawPlant2D(ctx, item) {
  const hw = item.w/2, hh = item.h/2;
  // Pot
  ctx.fillStyle = '#c87848';
  ctx.strokeStyle = '#a05828';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0, hh*0.3, hw*0.5, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  // Leaves
  ctx.fillStyle = '#2a7a2a';
  ctx.beginPath(); ctx.arc(0, -hh*0.2, hw*0.75, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#3a9a3a';
  ctx.beginPath(); ctx.arc(-hw*0.3, -hh*0.4, hw*0.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(hw*0.3, -hh*0.4, hw*0.5, 0, Math.PI*2); ctx.fill();
}

function drawCar2D(ctx, item) {
  const hw = item.w/2, hh = item.h/2;
  ctx.fillStyle = item.color;
  ctx.strokeStyle = darken2D(item.color, 30);
  ctx.lineWidth = 2;
  roundRect2D(ctx, -hw, -hh, item.w, item.h, 8); ctx.fill(); ctx.stroke();
  // Windshields
  ctx.fillStyle = 'rgba(160,210,240,0.6)';
  roundRect2D(ctx, -hw+8, -hh+10, item.w-16, item.h*0.28, 3); ctx.fill();
  roundRect2D(ctx, -hw+8, hh-item.h*0.28-10, item.w-16, item.h*0.28, 3); ctx.fill();
  // Wheels
  ctx.fillStyle = '#333';
  [[-hw+5,-hh+8],[-hw+5,hh-18],[hw-18,-hh+8],[hw-18,hh-18]].forEach(([wx,wy])=>{
    ctx.fillRect(wx, wy, 13, 13);
  });
}

function drawSideboard2D(ctx, item) {
  const hw = item.w/2, hh = item.h/2;
  ctx.fillStyle = item.color;
  ctx.strokeStyle = darken2D(item.color, 25);
  ctx.lineWidth = 1.5;
  ctx.fillRect(-hw, -hh, item.w, item.h); ctx.stroke();
  ctx.strokeRect(-hw, -hh, item.w, item.h);
  ctx.beginPath(); ctx.moveTo(0, -hh); ctx.lineTo(0, hh); ctx.stroke();
  ctx.fillStyle = '#888';
  ctx.fillRect(-5, -3, 4, 6);
  ctx.fillRect(1, -3, 4, 6);
}

function drawDresser2D(ctx, item) {
  const hw = item.w/2, hh = item.h/2;
  ctx.fillStyle = item.color;
  ctx.strokeStyle = darken2D(item.color, 25);
  ctx.lineWidth = 1.5;
  ctx.fillRect(-hw, -hh, item.w, item.h); ctx.stroke();
  ctx.strokeRect(-hw, -hh, item.w, item.h);
  const rows = 3;
  for (let i = 1; i < rows; i++) {
    ctx.beginPath(); ctx.moveTo(-hw, -hh + i*(item.h/rows)); ctx.lineTo(hw, -hh + i*(item.h/rows)); ctx.stroke();
  }
  for (let i = 0; i < rows; i++) {
    ctx.fillStyle = '#888';
    ctx.fillRect(-4, -hh + i*(item.h/rows) + item.h/(rows*2) - 3, 8, 6);
  }
}

function drawLabels2D(ctx) {
  HOUSE_PLAN.rooms.forEach(room => {
    const cx = room.x + room.w/2;
    const cy = room.y + room.h/2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Room name
    ctx.font = `bold ${Math.max(8, Math.min(12, room.w/10))}px Arial, sans-serif`;
    ctx.fillStyle = 'rgba(60,50,40,0.85)';
    ctx.fillText(room.shortName, cx, cy - 6);
    // Area
    const area = Math.round((room.w / 3.5) * (room.h / 3.5));
    ctx.font = `${Math.max(7, Math.min(10, room.w/12))}px Arial, sans-serif`;
    ctx.fillStyle = 'rgba(80,70,60,0.65)';
    ctx.fillText(`${area} sq.ft`, cx, cy + 8);
  });
}

function drawDimensions2D(ctx) {
  ctx.font = '9px Arial, sans-serif';
  ctx.fillStyle = '#5a6a7a';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#7a8a9a';
  ctx.lineWidth = 0.8;

  HOUSE_PLAN.rooms.forEach(room => {
    if (room.w < 60 || room.h < 40) return;
    const fw = (room.w / 3.5).toFixed(1);
    const fh = (room.h / 3.5).toFixed(1);

    // Width dimension (top)
    const dimY = room.y - 12;
    ctx.beginPath(); ctx.moveTo(room.x, dimY); ctx.lineTo(room.x + room.w, dimY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(room.x, dimY-3); ctx.lineTo(room.x, dimY+3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(room.x+room.w, dimY-3); ctx.lineTo(room.x+room.w, dimY+3); ctx.stroke();
    ctx.fillText(`${fw}'`, room.x + room.w/2, dimY - 3);
  });
}

function drawCompass2D(ctx, W, H) {
  const cx = W - 50, cy = H - 50, r = 28;
  ctx.save();
  ctx.globalAlpha = 0.9;
  // Circle bg
  ctx.fillStyle = 'rgba(240,235,225,0.92)';
  ctx.strokeStyle = '#8a7a6a';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  // N arrow
  ctx.fillStyle = '#c0302a';
  ctx.beginPath(); ctx.moveTo(cx, cy-r+6); ctx.lineTo(cx-6, cy); ctx.lineTo(cx+6, cy); ctx.closePath(); ctx.fill();
  // S arrow
  ctx.fillStyle = '#888';
  ctx.beginPath(); ctx.moveTo(cx, cy+r-6); ctx.lineTo(cx-6, cy); ctx.lineTo(cx+6, cy); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#333'; ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('N', cx, cy - r + 14);
  ctx.restore();
}

function drawScale2D(ctx, W, H) {
  ctx.save();
  ctx.globalAlpha = 0.85;
  const sx = 20, sy = H - 28, sw = 100;
  ctx.fillStyle = 'rgba(240,235,225,0.9)';
  ctx.fillRect(sx - 5, sy - 12, sw + 60, 22);
  ctx.strokeStyle = '#5a6a4a';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + sw, sy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(sx, sy-5); ctx.lineTo(sx, sy+5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(sx+sw, sy-5); ctx.lineTo(sx+sw, sy+5); ctx.stroke();
  ctx.fillStyle = '#5a6a4a';
  ctx.font = '9px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('0', sx, sy+3);
  ctx.fillText("10'", sx+sw/2, sy+3);
  ctx.fillText("20'", sx+sw, sy+3);
  ctx.restore();
}

// ── Helpers
function roundRect2D(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y); ctx.arcTo(x+w, y, x+w, y+r, r);
  ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w, y+h, x+w-r, y+h, r);
  ctx.lineTo(x+r, y+h); ctx.arcTo(x, y+h, x, y+h-r, r);
  ctx.lineTo(x, y+r); ctx.arcTo(x, y, x+r, y, r);
  ctx.closePath();
}
function lighten2D(hex, amt) {
  if (!hex || hex[0]!=='#') return hex;
  const [r,g,b] = [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];
  return `rgb(${Math.min(255,r+amt)},${Math.min(255,g+amt)},${Math.min(255,b+amt)})`;
}
function darken2D(hex, amt) {
  if (!hex || hex[0]!=='#') return hex;
  const [r,g,b] = [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];
  return `rgb(${Math.max(0,r-amt)},${Math.max(0,g-amt)},${Math.max(0,b-amt)})`;
}

// ── Events
function bindEvents2D() {
  const c = FP2D.canvas;
  c.addEventListener('mousedown', e2D_down);
  c.addEventListener('mousemove', e2D_move);
  c.addEventListener('mouseup',   e2D_up);
  c.addEventListener('wheel',     e2D_wheel, {passive:false});
  c.addEventListener('click',     e2D_click);
}
function getCanvasXY(e) {
  const r = FP2D.canvas.getBoundingClientRect();
  return {x: e.clientX - r.left, y: e.clientY - r.top};
}
function screenToWorld(sx, sy) {
  return { x: (sx - FP2D.panX) / FP2D.zoom, y: (sy - FP2D.panY) / FP2D.zoom };
}
let _panStart = null;
function e2D_down(e) { _panStart = getCanvasXY(e); FP2D.isPanning = true; }
function e2D_move(e) {
  if (!FP2D.isPanning || !_panStart) return;
  const p = getCanvasXY(e);
  FP2D.panX += p.x - _panStart.x;
  FP2D.panY += p.y - _panStart.y;
  _panStart = p;
  draw2D();
}
function e2D_up() { FP2D.isPanning = false; _panStart = null; }
function e2D_wheel(e) {
  e.preventDefault();
  const p = getCanvasXY(e);
  const factor = e.deltaY < 0 ? 1.12 : 0.89;
  const wx = (p.x - FP2D.panX) / FP2D.zoom;
  const wy = (p.y - FP2D.panY) / FP2D.zoom;
  FP2D.zoom = Math.max(0.3, Math.min(4, FP2D.zoom * factor));
  FP2D.panX = p.x - wx * FP2D.zoom;
  FP2D.panY = p.y - wy * FP2D.zoom;
  draw2D();
}
function e2D_click(e) {
  const {x,y} = screenToWorld(...Object.values(getCanvasXY(e)));
  let hit = -1;
  HOUSE_PLAN.rooms.forEach((r,i) => {
    if (x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h) hit = i;
  });
  FP2D.selectedRoom = (hit === FP2D.selectedRoom) ? -1 : hit;
  draw2D();
  if (hit >= 0) {
    const room = HOUSE_PLAN.rooms[hit];
    const area = Math.round((room.w/3.5)*(room.h/3.5));
    showRoomInfo(room, area);
  }
}

function showRoomInfo(room, area) {
  const panel = document.getElementById('room-info-panel');
  const name  = document.getElementById('ri-name');
  const areaEl= document.getElementById('ri-area');
  if (panel && name && areaEl) {
    name.textContent  = room.name;
    areaEl.textContent= `${area} sq.ft  ·  ${(room.w/3.5).toFixed(1)}' × ${(room.h/3.5).toFixed(1)}'`;
    panel.style.display = 'block';
  }
}

// ── Controls (called by HTML buttons)
function fp2d_zoomIn()  { FP2D.zoom = Math.min(4, FP2D.zoom * 1.2); draw2D(); }
function fp2d_zoomOut() { FP2D.zoom = Math.max(0.3, FP2D.zoom / 1.2); draw2D(); }
function fp2d_fitView() {
  const plan = HOUSE_PLAN;
  FP2D.zoom  = Math.min(FP2D.canvas.width / (plan.outerWidth + 80), FP2D.canvas.height / (plan.outerHeight + 140)) * 0.9;
  FP2D.panX  = (FP2D.canvas.width  - plan.outerWidth  * FP2D.zoom) / 2;
  FP2D.panY  = (FP2D.canvas.height - plan.outerHeight * FP2D.zoom) / 2;
  draw2D();
}
function fp2d_toggle(what) {
  if (what==='furniture')   FP2D.showFurniture   = !FP2D.showFurniture;
  if (what==='labels')      FP2D.showLabels      = !FP2D.showLabels;
  if (what==='dimensions')  FP2D.showDimensions  = !FP2D.showDimensions;
  draw2D();
}
function fp2d_export() {
  const link = document.createElement('a');
  link.download = 'DreamNest-FloorPlan.png';
  link.href = FP2D.canvas.toDataURL();
  link.click();
  if (typeof showToast === 'function') showToast('Floor plan exported as PNG!');
}

window.addEventListener('DOMContentLoaded', () => {
  initFloorPlan2D();
});
window.addEventListener('resize', () => {
  resizeCanvas2D();
  fp2d_fitView();
});
