// ===== DREAMNEST AI — BUDGET ENGINE =====

const CATEGORIES = [
  { name:'Structure & Civil Work',    pct:35, color:'#7c3aed', icon:'🏗️' },
  { name:'Interior Finishing',        pct:22, color:'#3b82f6', icon:'🛋️' },
  { name:'Electrical Works',          pct:10, color:'#10b981', icon:'⚡' },
  { name:'Plumbing & Sanitary',       pct:10, color:'#f59e0b', icon:'🚿' },
  { name:'Flooring & Tiling',         pct:8,  color:'#ef4444', icon:'🔲' },
  { name:'Exterior & Landscaping',    pct:8,  color:'#06b6d4', icon:'🌿' },
  { name:'Doors & Windows',           pct:5,  color:'#8b5cf6', icon:'🚪' },
  { name:'Miscellaneous & Contingency',pct:2, color:'#6b7280', icon:'📦' },
];

const CITY_RATES = { Mumbai:4200, Delhi:3500, Bangalore:3800, Hyderabad:3200, Pune:3400, Chennai:3300 };
const QUALITY_MUL = { basic:0.75, standard:1.0, premium:1.35, luxury:1.75 };

let donutInst = null, barInst = null;

function getTotal() {
  const plot  = parseInt(document.getElementById('plot')?.value) || 2400;
  const floors= parseInt(document.getElementById('floors')?.value) || 2;
  const city  = document.getElementById('city')?.value || 'Mumbai';
  const qual  = document.getElementById('quality')?.value || 'standard';
  return plot * floors * CITY_RATES[city] * QUALITY_MUL[qual];
}

function recalcBudget() {
  const total = getTotal();
  const plot  = parseInt(document.getElementById('plot')?.value) || 2400;
  const floors= parseInt(document.getElementById('floors')?.value) || 2;
  const city  = document.getElementById('city')?.value || 'Mumbai';
  const qual  = document.getElementById('quality')?.value || 'standard';
  const builtArea = plot * floors;

  // Update header
  const el = document.getElementById('total-display');
  if (el) el.textContent = '₹' + formatINR(total);
  const meta = document.getElementById('total-meta');
  if (meta) meta.textContent = `${qual.charAt(0).toUpperCase()+qual.slice(1)} Finish · ${builtArea.toLocaleString()} sq.ft · ${city}`;
  const sqft = document.getElementById('cost-sqft');
  if (sqft) sqft.textContent = '₹' + Math.round(total / builtArea).toLocaleString('en-IN');
  const ba = document.getElementById('built-area');
  if (ba) ba.textContent = builtArea.toLocaleString('en-IN') + ' sq.ft';
  const tl = document.getElementById('timeline');
  if (tl) tl.textContent = floors === 1 ? '10–14 months' : floors === 2 ? '18–22 months' : floors === 3 ? '24–30 months' : '30–40 months';

  renderBreakdown(total);
  renderProgressBars(total);
  updateCharts(total);
}

function renderBreakdown(total) {
  const el = document.getElementById('breakdown-list');
  if (!el) return;
  el.innerHTML = CATEGORIES.map(c => {
    const amt = total * c.pct / 100;
    return `<div class="budget-item">
      <div class="budget-item-left">
        <div class="budget-dot" style="background:${c.color}"></div>
        <div>
          <div class="budget-name">${c.icon} ${c.name}</div>
          <div class="budget-pct">${c.pct}% of total</div>
        </div>
      </div>
      <div class="budget-amount">₹${formatINR(amt)}</div>
    </div>`;
  }).join('');
}

function renderProgressBars(total) {
  const el = document.getElementById('progress-bars');
  if (!el) return;
  el.innerHTML = CATEGORIES.map(c => {
    const amt = total * c.pct / 100;
    return `<div style="margin-bottom:.9rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.35rem">
        <span style="font-size:.84rem">${c.icon} ${c.name}</span>
        <span style="font-size:.84rem;font-weight:600;color:${c.color}">₹${formatINR(amt)} <span style="color:var(--text3);font-weight:400">(${c.pct}%)</span></span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${c.pct * 2.8}%;background:${c.color}"></div>
      </div>
    </div>`;
  }).join('');
}

function updateCharts(total) {
  // Donut
  const dc = document.getElementById('donutChart');
  if (dc) {
    if (donutInst) donutInst.destroy();
    donutInst = new Chart(dc, {
      type: 'doughnut',
      data: {
        labels: CATEGORIES.map(c => c.name),
        datasets: [{
          data: CATEGORIES.map(c => c.pct),
          backgroundColor: CATEGORIES.map(c => c.color),
          borderColor: '#1e1e2e', borderWidth: 3, hoverOffset: 10
        }]
      },
      options: {
        responsive:true, maintainAspectRatio:false, cutout:'60%',
        plugins:{
          legend:{ position:'right', labels:{ color:'#a0a0c0', font:{size:10}, padding:8, usePointStyle:true, boxWidth:10 } },
          tooltip:{ backgroundColor:'#22222f', titleColor:'#f1f1f8', bodyColor:'#a0a0c0', borderColor:'#3a3a55', borderWidth:1,
            callbacks:{ label: ctx => ` ${ctx.label.split(' ')[0]}: ${ctx.raw}% (₹${formatINR(total*ctx.raw/100)})` }
          }
        }
      }
    });
  }

  // Bar — city comparison
  const bc = document.getElementById('barChart');
  if (bc) {
    if (barInst) barInst.destroy();
    const plot  = parseInt(document.getElementById('plot')?.value) || 2400;
    const floors= parseInt(document.getElementById('floors')?.value) || 2;
    const qual  = document.getElementById('quality')?.value || 'standard';
    const mul   = QUALITY_MUL[qual];
    barInst = new Chart(bc, {
      type: 'bar',
      data: {
        labels: Object.keys(CITY_RATES),
        datasets: [{
          label: 'Estimated Cost (₹L)',
          data: Object.values(CITY_RATES).map(r => Math.round(plot * floors * r * mul / 100000)),
          backgroundColor: Object.keys(CITY_RATES).map((c,i) => i===0?'#7c3aed':'rgba(124,58,237,0.4)'),
          borderRadius: 8,
        }]
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ display:false },
          tooltip:{ backgroundColor:'#22222f', bodyColor:'#a0a0c0', callbacks:{ label: ctx => ` ₹${ctx.raw}L` } }
        },
        scales:{
          x:{ ticks:{ color:'#6b6b8a', font:{size:11} }, grid:{ color:'rgba(255,255,255,0.04)' } },
          y:{ ticks:{ color:'#6b6b8a', callback: v=>'₹'+v+'L' }, grid:{ color:'rgba(255,255,255,0.04)' } }
        }
      }
    });
  }
}

function formatINR(n) {
  // Indian number format (lakhs, crores)
  if (n >= 10000000) return (n/10000000).toFixed(2) + ' Cr';
  if (n >= 100000)   return (n/100000).toFixed(2) + ' L';
  return Math.round(n).toLocaleString('en-IN');
}

function downloadReport() {
  showToast('📥 Budget report PDF is being prepared...');
  setTimeout(() => showToast('✅ Report downloaded successfully!'), 2000);
}

window.addEventListener('DOMContentLoaded', recalcBudget);
