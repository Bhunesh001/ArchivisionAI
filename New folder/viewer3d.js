// ===== DREAMNEST AI — 3D VIEWER ENGINE =====
let rotX = -20, rotY = 30, isDragging = false, lastMX = 0, lastMY = 0;
let isDayMode = true, isWire = false, lightIntensity = 75;
let animating = true;

function init3DViewer() {
  const canvas = document.getElementById('threeCanvas');
  if (!canvas) return;
  canvas.width  = canvas.parentElement.clientWidth || 700;
  canvas.height = 460;

  canvas.onmousedown  = e => { isDragging=true; lastMX=e.clientX; lastMY=e.clientY; canvas.style.cursor='grabbing'; };
  canvas.onmousemove  = e => {
    if (!isDragging) return;
    rotY += (e.clientX - lastMX) * 0.55;
    rotX  = Math.max(-70, Math.min(15, rotX + (e.clientY - lastMY) * 0.35));
    lastMX=e.clientX; lastMY=e.clientY;
    drawViewer();
  };
  canvas.onmouseup    = () => { isDragging=false; canvas.style.cursor='grab'; };
  canvas.onmouseleave = () => { isDragging=false; };
  canvas.onwheel      = e => e.preventDefault();

  // Auto-rotate when idle
  (function autoRotate() {
    if (!isDragging) { rotY = (rotY + 0.18) % 360; drawViewer(); }
    requestAnimationFrame(autoRotate);
  })();
}

function drawViewer() {
  const canvas = document.getElementById('threeCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);

  // Sky gradient
  const sky = ctx.createLinearGradient(0,0,0,H*0.65);
  if (isDayMode) {
    sky.addColorStop(0, '#0f1a3d');
    sky.addColorStop(1, '#1a2a5a');
  } else {
    sky.addColorStop(0, '#03030a');
    sky.addColorStop(1, '#07070f');
  }
  ctx.fillStyle = sky; ctx.fillRect(0,0,W,H);

  // Stars (night)
  if (!isDayMode) {
    for (let i=0;i<120;i++) {
      const sx=(i*79+13)%W, sy=(i*53+7)%(H*0.55);
      ctx.fillStyle=`rgba(255,255,255,${0.3+Math.sin(i)*0.4})`;
      ctx.fillRect(sx,sy,i%3===0?1.5:1,i%3===0?1.5:1);
    }
  }

  // Sun / Moon
  if (isDayMode) {
    const sg=ctx.createRadialGradient(W*0.78,70,0,W*0.78,70,80);
    sg.addColorStop(0,'rgba(255,225,100,0.35)');sg.addColorStop(1,'transparent');
    ctx.fillStyle=sg;ctx.fillRect(0,0,W,H);
    ctx.beginPath();ctx.arc(W*0.78,70,22,0,Math.PI*2);
    ctx.fillStyle='rgba(255,225,80,0.92)';ctx.fill();
  } else {
    const mg=ctx.createRadialGradient(W*0.78,70,0,W*0.78,70,60);
    mg.addColorStop(0,'rgba(200,210,255,0.2)');mg.addColorStop(1,'transparent');
    ctx.fillStyle=mg;ctx.fillRect(0,0,W,H);
    ctx.beginPath();ctx.arc(W*0.78,70,18,0,Math.PI*2);
    ctx.fillStyle='rgba(220,225,255,0.85)';ctx.fill();
  }

  // Ground
  const gr=ctx.createLinearGradient(0,H*0.62,0,H);
  if (isDayMode){gr.addColorStop(0,'#1a3a1a');gr.addColorStop(1,'#0d1f0d');}
  else{gr.addColorStop(0,'#0a1a0a');gr.addColorStop(1,'#050f05');}
  ctx.fillStyle=gr;ctx.fillRect(0,H*0.62,W,H);

  // Driveway
  ctx.fillStyle=isDayMode?'#2a2a2a':'#181818';
  ctx.beginPath();
  ctx.moveTo(W/2-35,H);ctx.lineTo(W/2+35,H);
  ctx.lineTo(W/2+65,H*0.67);ctx.lineTo(W/2-65,H*0.67);
  ctx.closePath();ctx.fill();
  ctx.setLineDash([12,12]);ctx.strokeStyle='rgba(255,255,255,0.12)';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(W/2,H);ctx.lineTo(W/2,H*0.67);ctx.stroke();
  ctx.setLineDash([]);

  // ── 3D House (canvas-based projection) ──
  const cx=W/2, cy=H*0.56;
  const rY=(rotY*Math.PI)/180;
  const cosY=Math.cos(rY), sinY=Math.sin(rY);

  function proj(x,y,z){
    const rx=x*cosY-z*sinY, rz=x*sinY+z*cosY;
    const pers=700/(700+rz*0.8);
    return {x:cx+rx*pers, y:cy-y*0.72+rz*0.14};
  }

  const hw=165, hh=105, hd=195;
  const li=lightIntensity/100;

  // House base vertices
  const pts=[
    proj(-hw,0,-hd/2),proj(hw,0,-hd/2),proj(hw,0,hd/2),proj(-hw,0,hd/2),
    proj(-hw,hh,-hd/2),proj(hw,hh,-hd/2),proj(hw,hh,hd/2),proj(-hw,hh,hd/2),
  ];

  const shadowEllipse = proj(0,-2,0);
  const shG=ctx.createRadialGradient(shadowEllipse.x,shadowEllipse.y+10,0,shadowEllipse.x,shadowEllipse.y+10,200);
  shG.addColorStop(0,'rgba(0,0,0,0.35)');shG.addColorStop(1,'transparent');
  ctx.fillStyle=shG;ctx.ellipse?ctx.beginPath():null;
  if(ctx.ellipse){ctx.ellipse(shadowEllipse.x,shadowEllipse.y+12,195,35,0,0,Math.PI*2);ctx.fill();}

  function face(verts,col,alpha=1){
    ctx.globalAlpha=alpha*li;
    ctx.fillStyle=col;
    ctx.beginPath();ctx.moveTo(verts[0].x,verts[0].y);
    verts.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));
    ctx.closePath();ctx.fill();
    if(isWire){ctx.strokeStyle='rgba(124,58,237,0.6)';ctx.lineWidth=1;ctx.stroke();}
    else{ctx.strokeStyle='rgba(0,0,0,0.25)';ctx.lineWidth=0.6;ctx.stroke();}
    ctx.globalAlpha=1;
  }

  const wallDay='#d4c5a9', wallNight='#7a6e5a';
  const sideDay='#b8a88a', sideNight='#6a5e4a';
  const wc = isDayMode ? wallDay : wallNight;
  const sc = isDayMode ? sideDay : sideNight;

  // Back faces
  if(sinY>0) face([pts[3],pts[2],pts[6],pts[7]],sc);
  else        face([pts[0],pts[1],pts[5],pts[4]],wc);
  face([pts[0],pts[1],pts[5],pts[4]],wc);
  face([pts[3],pts[2],pts[6],pts[7]],sc);
  face([pts[4],pts[5],pts[6],pts[7]],'#4a3a28');

  // Windows – front face
  const winC=isDayMode?'rgba(180,220,255,0.82)':'rgba(255,220,100,0.75)';
  [[0.3,0.45],[0.52,0.45],[0.74,0.45],[0.3,0.7],[0.74,0.7]].forEach(([fx,fy])=>{
    const a=proj(-hw+2*hw*fx, hh*fy, -hd/2+1);
    const b=proj(-hw+2*hw*fx+28, hh*fy, -hd/2+1);
    const c2=proj(-hw+2*hw*fx+28, hh*(fy+0.2), -hd/2+1);
    const d2=proj(-hw+2*hw*fx, hh*(fy+0.2), -hd/2+1);
    face([a,b,c2,d2],winC,0.9);
    if(isDayMode){ctx.globalAlpha=0.12;ctx.fillStyle='rgba(255,255,200,.2)';
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c2.x,c2.y);ctx.lineTo(d2.x,d2.y);ctx.fill();ctx.globalAlpha=1;}
    // Night glow
    if(!isDayMode){
      const gx=(a.x+c2.x)/2,gy=(a.y+c2.y)/2;
      const wg=ctx.createRadialGradient(gx,gy,0,gx,gy,30);
      wg.addColorStop(0,'rgba(255,200,80,0.25)');wg.addColorStop(1,'transparent');
      ctx.fillStyle=wg;ctx.beginPath();ctx.arc(gx,gy,30,0,Math.PI*2);ctx.fill();
    }
  });

  // Balcony
  const bal=[proj(-hw*0.4,hh,-hd/2-18),proj(hw*0.4,hh,-hd/2-18),proj(hw*0.4,hh,-(hd/2)),proj(-hw*0.4,hh,-(hd/2))];
  face(bal,'rgba(200,190,170,0.8)',0.85);

  // Door
  const dr1=proj(-18,0,-hd/2+1),dr2=proj(18,0,-hd/2+1),dr3=proj(18,hh*0.5,-hd/2+1),dr4=proj(-18,hh*0.5,-hd/2+1);
  face([dr1,dr2,dr3,dr4],'#5a3a1a',1);
  const dkn=proj(12,hh*0.25,-hd/2+1);
  ctx.beginPath();ctx.arc(dkn.x,dkn.y,3,0,Math.PI*2);
  ctx.fillStyle='#f0c840';ctx.fill();

  // Roof
  const r0=proj(-hw-15,hh,-hd/2-10),r1=proj(hw+15,hh,-hd/2-10),r2=proj(hw+15,hh,hd/2+10),r3=proj(-hw-15,hh,hd/2+10),rp=proj(0,hh+82,0);
  const roofC=isDayMode?'#8b4513':'#4a240a';
  face([r0,r1,rp],roofC);
  face([r1,r2,rp],isDayMode?'#6b3410':'#3a1e08');
  face([r2,r3,rp],roofC);
  face([r3,r0,rp],isDayMode?'#7a3e15':'#45200a');
  // Ridge
  ctx.beginPath();ctx.moveTo(r0.x,r0.y);ctx.lineTo(r1.x,r1.y);
  ctx.strokeStyle='rgba(0,0,0,0.3)';ctx.lineWidth=1.5;ctx.stroke();

  // Chimney
  const ch=[proj(60,hh+30,-hd/2+20),proj(85,hh+30,-hd/2+20),proj(85,hh+30,0),proj(60,hh+30,0)];
  face(ch,isDayMode?'#a09080':'#504840',1);

  // Trees
  [[-285,0,-hd/2],[285,0,-hd/2],[-255,0,hd/3],[255,0,hd/3],[-200,0,hd*0.7]].forEach(([tx,ty,tz])=>{
    const tp=proj(tx,ty,tz);
    const tc=isDayMode?'#1e4a1e':'#0d2a0d';
    const tc2=isDayMode?'#2a6a2a':'#153015';
    ctx.fillStyle=tc;ctx.beginPath();ctx.arc(tp.x,tp.y-44,24,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=tc2;ctx.beginPath();ctx.arc(tp.x-6,tp.y-54,17,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=isDayMode?'#5a3a1a':'#2a1a08';
    ctx.fillRect(tp.x-4,tp.y-22,8,22);
  });

  // Hedge
  for(let i=-3;i<=3;i++){
    const hp=proj(hw+20+i*15,0,hd/2+15);
    ctx.fillStyle=isDayMode?'#1e5a1e':'#0d2a0d';
    ctx.beginPath();ctx.arc(hp.x,hp.y-8,8,0,Math.PI*2);ctx.fill();
  }
}

function toggleDayNight(){
  isDayMode=!isDayMode;
  const btn=document.getElementById('daynight-btn');
  if(btn) btn.textContent=isDayMode?'🌙 Night Mode':'☀️ Day Mode';
  drawViewer();
}
function toggleWireframe(){
  isWire=!isWire;
  const btn=document.getElementById('wire-btn');
  if(btn) btn.classList.toggle('active',isWire);
  drawViewer();
}
function resetCamera3D(){rotX=-20;rotY=30;drawViewer();}
function setLight(v){lightIntensity=parseInt(v);drawViewer();}

window.addEventListener('DOMContentLoaded',init3DViewer);
window.addEventListener('resize',()=>{
  const c=document.getElementById('threeCanvas');
  if(!c)return;c.width=c.parentElement.clientWidth||700;drawViewer();
});
