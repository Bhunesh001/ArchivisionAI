// ===== DREAMNEST AI — SHARED APP SHELL =====

const NAV_ITEMS = [
  { id: 'dashboard',   icon: '📊', label: 'Dashboard',     page: 'dashboard.html'   },
  { id: 'projects',    icon: '📁', label: 'Projects',      page: 'projects.html'    },
  { id: 'planner',     icon: '🤖', label: 'AI Planner',    page: 'planner.html'     },
  { id: 'floorplan',   icon: '📐', label: 'Floor Plan',    page: 'floorplan.html'   },
  { id: 'viewer3d',    icon: '🏗️', label: '3D Viewer',     page: 'viewer3d.html'    },
  { id: 'interior',    icon: '🛋️', label: 'Interior',      page: 'interior.html'    },
  { id: 'walkthrough', icon: '🚶', label: 'Walkthrough',   page: 'walkthrough.html' },
  { id: 'budget',      icon: '💰', label: 'Budget',        page: 'budget.html'      },
  { id: 'export',      icon: '📤', label: 'Export',        page: 'export.html'      },
  { id: 'ar',          icon: '📱', label: 'AR Preview',    page: 'ar.html'          },
  { id: 'settings',    icon: '⚙️', label: 'Settings',      page: 'settings.html'   },
];

function buildShell(activeId) {
  // Find the app-shell wrapper
  const shell = document.querySelector('.app-shell');
  if (!shell) return;

  const sidebarHTML = `
    <nav class="sidebar" id="sidebar">
      <div class="sb-logo">🏠 DreamNest</div>
      <div class="sb-nav">
        <div class="sb-section">Main</div>
        ${NAV_ITEMS.slice(0,3).map(i => navItem(i, activeId)).join('')}
        <div class="sb-section">Design</div>
        ${NAV_ITEMS.slice(3,7).map(i => navItem(i, activeId)).join('')}
        <div class="sb-section">Tools</div>
        ${NAV_ITEMS.slice(7).map(i => navItem(i, activeId)).join('')}
      </div>
      <div class="sb-user">
        <div class="sb-avatar">JD</div>
        <div class="sb-user-info">
          <div class="sb-name">John Doe</div>
          <div class="sb-role">⭐ Pro Plan</div>
        </div>
        <button class="sb-logout" onclick="logout()" title="Logout">⏻</button>
      </div>
    </nav>`;

  // Insert sidebar as the FIRST child of .app-shell (before .main-area)
  shell.insertAdjacentHTML('afterbegin', sidebarHTML);
}

function navItem(item, activeId) {
  const isActive = item.id === activeId ? 'active' : '';
  return `<a class="sb-item ${isActive}" href="${item.page}">
    <span class="sb-icon">${item.icon}</span>
    <span>${item.label}</span>
  </a>`;
}

function logout() {
  if (confirm('Sign out of DreamNest AI?')) window.location.href = '../index.html';
}

function showToast(msg, ok = true) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'notif-toast';
    t.id = 'toast';
    t.innerHTML = '<span id="toast-msg"></span>';
    document.body.appendChild(t);
  }
  document.getElementById('toast-msg').textContent = msg;
  t.style.background = ok ? 'rgba(16,185,129,.12)' : 'rgba(239,68,68,.12)';
  t.style.borderColor = ok ? 'rgba(16,185,129,.4)' : 'rgba(239,68,68,.4)';
  t.style.color       = ok ? '#34d399' : '#f87171';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}
