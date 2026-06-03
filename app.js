// ─── Firebase config ───────────────────────────────────────────────────────
// IMPORTANTE: Reemplaza estos valores con los de tu proyecto Firebase
// Instrucciones en README.md
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDtKXEWtu2z8cPNqX3EvYG7Qe6Ic5hOfzo",
  authDomain: "quiniela-pitaya-tech-2026.firebaseapp.com",
  projectId: "quiniela-pitaya-tech-2026",
  storageBucket: "quiniela-pitaya-tech-2026.firebasestorage.app",
  messagingSenderId: "100399049705",
  appId: "1:100399049705:web:5169f2dfcd4d5995023978"
};


// ─── API-Football config ─────────────────────────────────────────────────────
// Registrate gratis en https://dashboard.api-football.com/register
// y pega tu API key aqui:
const API_FOOTBALL_KEY = "9999ebd705992251ae7de01915a6deac"; // <-- pega tu key aqui

// ─── State ──────────────────────────────────────────────────────────────────
let db;
let state = {
  users: [],
  matches: [],
  picks: {},
  points: { result: 1, exact: 3 },
  currentUser: null,
  editingAs: null
};

const COLORS = ['#3B6D11','#185FA5','#A32D2D','#854F0B','#993556','#3C3489','#0F6E56','#993C1D'];
function colorFor(name) {
  let h = 0;
  for (let c of name) h = (h * 31 + c.charCodeAt(0)) % COLORS.length;
  return COLORS[h];
}
function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Firebase init ──────────────────────────────────────────────────────────
async function initFirebase() {
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
  const { getFirestore, doc, getDoc, setDoc, onSnapshot, collection } =
    await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

  const app = initializeApp(FIREBASE_CONFIG);
  db = getFirestore(app);

  // Live listener — actualiza la UI cuando cambia algo en Firestore
  onSnapshot(doc(db, 'quiniela', 'data'), (snap) => {
    if (snap.exists()) {
      const d = snap.data();
      state.users   = d.users   || [];
      state.matches = d.matches || [];
      state.picks   = d.picks   || {};
      state.points  = d.points  || { result: 1, exact: 3 };
      if (state.currentUser) {
        // Refresh current user object in case admin status changed
        state.currentUser = state.users.find(u => u.id === state.currentUser.id) || state.currentUser;
        if (!state.editingAs || state.editingAs.id === state.currentUser.id) {
          state.editingAs = state.currentUser;
        }
        refreshAll();
      }
    }
    renderLogin();
  });
}

async function saveState() {
  const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
  await setDoc(doc(db, 'quiniela', 'data'), {
    users:   state.users,
    matches: state.matches,
    picks:   state.picks,
    points:  state.points
  });
}

// ─── Login / Logout ──────────────────────────────────────────────────────────
function renderLogin() {
  const sel = document.getElementById('login-select');
  const current = sel.value;
  sel.innerHTML = '<option value="">— Selecciona tu nombre —</option>';
  state.users.forEach(u => {
    const o = document.createElement('option');
    o.value = u.id;
    o.textContent = u.name + (u.isAdmin ? ' (admin)' : '');
    sel.appendChild(o);
  });
  if (current) sel.value = current;
}

function pinNext(el, nextIdx) {
  if (el.value.length === 1 && nextIdx !== null) {
    document.getElementById("pin-" + nextIdx).focus();
  }
}
function pinBack(e, el, prevIdx) {
  if (e.key === "Backspace" && el.value === "" && prevIdx !== null) {
    document.getElementById("pin-" + prevIdx).focus();
  }
}
function getPin() {
  return [0,1,2,3].map(i => document.getElementById("pin-"+i).value).join("");
}
function clearPin() {
  [0,1,2,3].forEach(i => { document.getElementById("pin-"+i).value = ""; });
  document.getElementById("pin-0").focus();
}

function doLogin() {
  const id = document.getElementById('login-select').value;
  if (!id) { alert('Selecciona tu nombre'); return; }
  const user = state.users.find(u => u.id === id);
  if (!user) return;

  const pin = getPin();
  if (pin.length < 4) { alert('Ingresa tu PIN de 4 digitos'); return; }
  if (user.pin && user.pin !== pin) {
    document.getElementById('pin-error').classList.remove('hidden');
    [0,1,2,3].forEach(i => document.getElementById('pin-'+i).classList.add('error'));
    clearPin();
    return;
  }
  document.getElementById('pin-error').classList.add('hidden');
  [0,1,2,3].forEach(i => document.getElementById('pin-'+i).classList.remove('error'));

  state.currentUser = user;
  state.editingAs = user;
  document.getElementById('screen-login').classList.add('hidden');
  document.getElementById('screen-main').classList.remove('hidden');

  const av = document.getElementById('user-avatar');
  av.textContent = initials(user.name);
  av.style.background = colorFor(user.name) + '30';
  av.style.color = colorFor(user.name);
  document.getElementById('user-name-display').textContent = user.name;

  const adminBadge = document.getElementById('admin-badge');
  const adminTab   = document.getElementById('tab-admin-btn');
  if (user.isAdmin) {
    adminBadge.classList.remove('hidden');
    adminTab.classList.remove('hidden');
  } else {
    adminBadge.classList.add('hidden');
    adminTab.classList.add('hidden');
  }

  document.getElementById('pts-result').value = state.points.result;
  document.getElementById('pts-exact').value   = state.points.exact;
  refreshAll();
}

function doLogout() {
  state.currentUser = null;
  state.editingAs = null;
  clearPin();
  document.getElementById('screen-login').classList.remove('hidden');
  document.getElementById('screen-main').classList.add('hidden');
  document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i === 0));
  ['tab-quiniela','tab-tabla','tab-stats','tab-admin'].forEach((id, i) => {
    document.getElementById(id).classList.toggle('hidden', i !== 0);
  });
}

function refreshAll() {
  renderMatches();
  renderTabla();
  renderStats();
  renderComparar(_compararFilter);
  renderAdminMatches();
  renderAdminUsers();
  document.getElementById('pts-result').value = state.points.result;
  document.getElementById('pts-exact').value   = state.points.exact;
}

// ─── Tabs ────────────────────────────────────────────────────────────────────
let _compararFilter = 'all';
function showTab(id, btn) {
  ['tab-quiniela','tab-tabla','tab-stats','tab-comparar','tab-admin'].forEach(t => {
    document.getElementById(t).classList.add('hidden');
  });
  document.getElementById(id).classList.remove('hidden');
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (id === 'tab-comparar') renderComparar(_compararFilter);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function isLocked(match) {
  return Date.now() >= new Date(match.datetime).getTime() - 60 * 60 * 1000;
}

function calcPoints(userId, match) {
  if (!match.result || match.result.home === '') return 0;
  const pick = state.picks[userId]?.[match.id];
  if (!pick || pick.home === '' || pick.away === '') return 0;
  const rh = parseInt(match.result.home), ra = parseInt(match.result.away);
  const ph = parseInt(pick.home),         pa = parseInt(pick.away);
  if (ph === rh && pa === ra) return state.points.exact;
  const rRes = rh > ra ? 'H' : rh < ra ? 'A' : 'D';
  const pRes = ph > pa ? 'H' : ph < pa ? 'A' : 'D';
  return rRes === pRes ? state.points.result : 0;
}

function getTableData() {
  return state.users.map(u => {
    let pts = 0, exact = 0, result = 0, played = 0;
    state.matches.forEach(m => {
      if (m.result && m.result.home !== '') {
        played++;
        const p = calcPoints(u.id, m);
        pts += p;
        if (p === state.points.exact) exact++;
        else if (p === state.points.result) result++;
      }
    });
    return { user: u, pts, exact, result, played };
  }).sort((a, b) => b.pts - a.pts || b.exact - a.exact);
}

function getStreak(userId) {
  const played = state.matches
    .filter(m => m.result && m.result.home !== '')
    .sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
  let streak = 0;
  for (const m of played) {
    const pts = calcPoints(userId, m);
    if (streak === 0) { streak = pts > 0 ? 1 : -1; continue; }
    if (streak > 0 && pts > 0) streak++;
    else if (streak < 0 && pts === 0) streak--;
    else break;
  }
  return streak;
}

// ─── Render: Matches ─────────────────────────────────────────────────────────
function renderMatches() {
  const container = document.getElementById('matches-list');
  const editUser = state.editingAs;
  if (!editUser) { container.innerHTML = ''; return; }

  if (state.matches.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--text-secondary)">
      <i class="ti ti-calendar-off" style="font-size:28px;display:block;margin-bottom:10px"></i>
      Aún no hay partidos cargados
    </div>`;
    return;
  }

  const phases = [...new Set(state.matches.map(m => m.phase))];
  let html = '';

  phases.forEach(phase => {
    const ms = state.matches.filter(m => m.phase === phase);
    html += `<div class="phase-group"><div class="card"><div class="phase-header">${phase}</div>`;

    ms.forEach(m => {
      const locked = isLocked(m);
      const pick = state.picks[editUser.id]?.[m.id] || { home: '', away: '' };
      const resultKnown = m.result && m.result.home !== '' && m.result.away !== '';

      let statusBadge = '';
      if (resultKnown) {
        const pts = calcPoints(editUser.id, m);
        if (pts === state.points.exact)
          statusBadge = `<span class="badge badge-success">+${pts} exacto ✓</span>`;
        else if (pts === state.points.result)
          statusBadge = `<span class="badge badge-info">+${pts} resultado</span>`;
        else if (pick.home !== '' || pick.away !== '')
          statusBadge = `<span class="badge badge-gray">+0</span>`;
      }

      const dt = new Date(m.datetime);
      const dtStr = dt.toLocaleDateString('es', { weekday: 'short', month: 'short', day: 'numeric' })
        + ' ' + dt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

      const inputsOrPick = locked || resultKnown
        ? `<span style="font-size:14px;font-weight:600;min-width:64px;text-align:center;color:var(--text-secondary)">
             ${pick.home !== '' ? pick.home + ' – ' + pick.away : '– –'}
           </span>`
        : `<input type="number" min="0" max="20" class="score-input" value="${pick.home}"
             placeholder="0" onchange="setPick('${editUser.id}','${m.id}','home',this.value)">
           <span class="score-sep">–</span>
           <input type="number" min="0" max="20" class="score-input" value="${pick.away}"
             placeholder="0" onchange="setPick('${editUser.id}','${m.id}','away',this.value)">`;

      html += `<div class="match-row">
        <div class="match-teams">
          <div class="match-teams-row">
            <span class="team-name right">${m.home}</span>
            ${inputsOrPick}
            <span class="team-name">${m.away}</span>
          </div>
          <div class="match-meta">
            <span>${dtStr}</span>
            ${locked ? `<span class="badge badge-warning"><i class="ti ti-lock"></i> bloqueado</span>` : ''}
            ${resultKnown ? `<span class="badge badge-gray">${m.result.home}–${m.result.away}</span>` : ''}
            ${statusBadge}
          </div>
        </div>
      </div>`;
    });

    html += '</div></div>';
  });

  container.innerHTML = html;
}

async function setPick(userId, matchId, side, val) {
  if (!state.picks[userId]) state.picks[userId] = {};
  if (!state.picks[userId][matchId]) state.picks[userId][matchId] = { home: '', away: '' };
  state.picks[userId][matchId][side] = val === '' ? '' : parseInt(val);
  await saveState();
}

// ─── Render: Tabla ───────────────────────────────────────────────────────────
function renderTabla() {
  const data = getTableData();
  const totalPlayed = state.matches.filter(m => m.result && m.result.home !== '').length;

  document.getElementById('tabla-stats').innerHTML = `
    <div class="stat-card"><div class="stat-label">Partidos jugados</div><div class="stat-value">${totalPlayed}</div></div>
    <div class="stat-card"><div class="stat-label">Partidos totales</div><div class="stat-value">${state.matches.length}</div></div>
    <div class="stat-card"><div class="stat-label">Participantes</div><div class="stat-value">${state.users.length}</div></div>
    <div class="stat-card"><div class="stat-label">Pts por exacto</div><div class="stat-value">${state.points.exact}</div></div>
  `;

  const medals = ['🥇', '🥈', '🥉'];
  document.getElementById('tabla-body').innerHTML = data.map((d, i) => {
    const color = colorFor(d.user.name);
    return `<tr>
      <td><span class="pos-num" style="background:${color}22;color:${color}">${medals[i] || i + 1}</span></td>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="avatar" style="width:28px;height:28px;font-size:11px;background:${color}30;color:${color}">${initials(d.user.name)}</div>
          <span style="font-weight:500">${d.user.name}</span>
          ${d.user.isAdmin ? '<span class="badge badge-gray" style="font-size:10px">admin</span>' : ''}
        </div>
      </td>
      <td class="text-right"><strong style="font-size:16px">${d.pts}</strong></td>
      <td class="text-right"><span class="badge badge-success">${d.exact}</span></td>
      <td class="text-right"><span class="badge badge-info">${d.result}</span></td>
      <td class="text-right" style="color:var(--text-secondary)">${d.played}</td>
    </tr>`;
  }).join('');
}

// ─── Render: Stats ───────────────────────────────────────────────────────────
function renderStats() {
  const data = getTableData();

  document.getElementById('stats-body').innerHTML = data.map(d => {
    const total = d.played;
    const pctExact  = total > 0 ? Math.round(d.exact / total * 100) : 0;
    const pctResult = total > 0 ? Math.round((d.exact + d.result) / total * 100) : 0;
    const streak = getStreak(d.user.id);
    const color = colorFor(d.user.name);
    return `<tr>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="avatar" style="width:26px;height:26px;font-size:10px;background:${color}30;color:${color}">${initials(d.user.name)}</div>
          ${d.user.name}
        </div>
      </td>
      <td class="text-right"><strong>${pctExact}%</strong></td>
      <td class="text-right">${pctResult}%</td>
      <td class="text-right">
        ${streak > 0
          ? `<span class="badge badge-success">🔥 ${streak}</span>`
          : streak < 0
          ? `<span class="badge badge-danger">${streak}</span>`
          : `<span class="badge badge-gray">—</span>`}
      </td>
    </tr>`;
  }).join('');

  const played = state.matches.filter(m => m.result && m.result.home !== '');
  if (played.length === 0) {
    document.getElementById('all-picks-container').innerHTML =
      '<p style="font-size:13px;color:var(--text-secondary);padding:1rem 0">Aún no hay partidos con resultado.</p>';
    return;
  }

  let html = '<div class="table-wrapper"><table><thead><tr><th>Partido</th><th>Real</th>';
  state.users.forEach(u => html += `<th style="text-align:center">${initials(u.name)}</th>`);
  html += '</tr></thead><tbody>';

  played.forEach(m => {
    html += `<tr>
      <td style="font-size:12px;white-space:nowrap">${m.home} vs ${m.away}</td>
      <td><span class="badge badge-gray">${m.result.home}–${m.result.away}</span></td>`;
    state.users.forEach(u => {
      const pick = state.picks[u.id]?.[m.id];
      const pts = calcPoints(u.id, m);
      const pickStr = pick && pick.home !== '' ? `${pick.home}–${pick.away}` : '–';
      const cls = pts === state.points.exact ? 'badge-success'
                : pts === state.points.result ? 'badge-info' : 'badge-gray';
      html += `<td style="text-align:center"><span class="badge ${cls}">${pickStr}</span></td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table></div>';
  document.getElementById('all-picks-container').innerHTML = html;
}

// ─── Render: Admin Matches ───────────────────────────────────────────────────
function renderAdminMatches() {
  const container = document.getElementById('admin-matches-list');
  if (state.matches.length === 0) {
    container.innerHTML = '<p style="font-size:13px;color:var(--text-secondary)">No hay partidos aún.</p>';
    return;
  }

  container.innerHTML = state.matches.map(m => {
    const dt = new Date(m.datetime);
    const dtStr = dt.toLocaleDateString('es', { day: 'numeric', month: 'short' })
      + ' ' + dt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    const hasResult = m.result && m.result.home !== '';

    return `<div class="admin-match-row">
      <span style="font-size:13px;flex:1;min-width:160px">
        <strong>${m.home}</strong> vs <strong>${m.away}</strong><br>
        <span style="color:var(--text-secondary);font-size:11px">${dtStr} · ${m.phase}</span>
      </span>
      <input type="number" min="0" max="20" placeholder="L" value="${hasResult ? m.result.home : ''}"
        id="res-h-${m.id}" class="score-input">
      <span class="score-sep">–</span>
      <input type="number" min="0" max="20" placeholder="V" value="${hasResult ? m.result.away : ''}"
        id="res-a-${m.id}" class="score-input">
      <button class="btn btn-sm btn-primary" onclick="saveResult('${m.id}')">
        <i class="ti ti-check"></i> Guardar
      </button>
      <button class="btn btn-sm" onclick="openEditModal('${m.id}')" title="Editar partido">
        <i class="ti ti-edit"></i>
      </button>
      <button class="btn btn-sm btn-danger" onclick="openDeleteModal('${m.id}')" title="Eliminar">
        <i class="ti ti-trash"></i>
      </button>
    </div>`;
  }).join('');
}

async function saveResult(matchId) {
  const h = document.getElementById('res-h-' + matchId).value;
  const a = document.getElementById('res-a-' + matchId).value;
  const m = state.matches.find(x => x.id === matchId);
  if (!m) return;
  m.result = { home: h, away: a };
  await saveState();
}

let _deleteMatchId = null;
function openDeleteModal(matchId) {
  const m = state.matches.find(x => x.id === matchId);
  if (!m) return;
  _deleteMatchId = matchId;
  document.getElementById('delete-confirm-text').textContent =
    '¿Eliminar ' + m.home + ' vs ' + m.away + '? Esta acción no se puede deshacer.';
  document.getElementById('modal-delete-overlay').classList.remove('hidden');
}
function closeDeleteModal() {
  _deleteMatchId = null;
  document.getElementById('modal-delete-overlay').classList.add('hidden');
}
async function confirmDelete() {
  if (!_deleteMatchId) return;
  state.matches = state.matches.filter(m => m.id !== _deleteMatchId);
  closeDeleteModal();
  await saveState();
  renderAdminMatches();
  renderMatches();
}

// Keep old deleteMatch as alias for backwards compat
async function deleteMatch(matchId) { openDeleteModal(matchId); }

let _editMatchId = null;
function openEditModal(matchId) {
  const m = state.matches.find(x => x.id === matchId);
  if (!m) return;
  _editMatchId = matchId;
  document.getElementById('edit-home').value  = m.home;
  document.getElementById('edit-away').value  = m.away;
  document.getElementById('edit-date').value  = m.datetime;
  document.getElementById('edit-phase').value = m.phase;
  document.getElementById('modal-overlay').classList.remove('hidden');
}
function closeModal() {
  _editMatchId = null;
  document.getElementById('modal-overlay').classList.add('hidden');
}
async function saveEdit() {
  if (!_editMatchId) return;
  const m = state.matches.find(x => x.id === _editMatchId);
  if (!m) return;
  m.home     = document.getElementById('edit-home').value.trim()  || m.home;
  m.away     = document.getElementById('edit-away').value.trim()  || m.away;
  m.datetime = document.getElementById('edit-date').value         || m.datetime;
  m.phase    = document.getElementById('edit-phase').value        || m.phase;
  closeModal();
  await saveState();
  renderAdminMatches();
  renderMatches();
}

async function addMatch() {
  const home = document.getElementById('m-home').value.trim();
  const away = document.getElementById('m-away').value.trim();
  const datetime = document.getElementById('m-date').value;
  const phase = document.getElementById('m-phase').value;
  if (!home || !away || !datetime) { alert('Completa todos los campos del partido'); return; }
  state.matches.push({ id: 'm' + Date.now(), home, away, datetime, phase, result: { home: '', away: '' } });
  document.getElementById('m-home').value = '';
  document.getElementById('m-away').value = '';
  document.getElementById('m-date').value = '';
  await saveState();
}

// ─── Render: Admin Users ─────────────────────────────────────────────────────
function renderAdminUsers() {
  document.getElementById('admin-users-body').innerHTML = state.users.map(u => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="avatar" style="width:26px;height:26px;font-size:10px;background:${colorFor(u.name)}30;color:${colorFor(u.name)}">${initials(u.name)}</div>
          ${u.name}
        </div>
      </td>
      <td>${u.isAdmin ? '<span class="badge badge-warning">admin</span>' : '<span class="badge badge-gray">jugador</span>'}</td>
      <td style="font-family:monospace;letter-spacing:2px">${u.pin || '—'}</td>
      <td>
        <button class="btn btn-sm" onclick="editPicksFor('${u.id}')">
          <i class="ti ti-edit"></i> Editar
        </button>
      </td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="deleteUser('${u.id}')">
          <i class="ti ti-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

async function addUser() {
  const name = document.getElementById('new-user-name').value.trim();
  const pin  = document.getElementById('new-user-pin').value.trim();
  if (!name) { alert('Escribe el nombre del jugador'); return; }
  if (pin.length !== 4 || isNaN(pin)) { alert('El PIN debe ser de 4 digitos numericos'); return; }
  const isAdmin = document.getElementById('new-user-admin').checked;
  state.users.push({ id: 'u' + Date.now(), name, pin, isAdmin });
  document.getElementById('new-user-name').value = '';
  document.getElementById('new-user-pin').value  = '';
  document.getElementById('new-user-admin').checked = false;
  await saveState();
}

async function deleteUser(userId) {
  if (!confirm('¿Eliminar este usuario?')) return;
  state.users = state.users.filter(u => u.id !== userId);
  await saveState();
}

async function savePoints() {
  state.points.result = parseInt(document.getElementById('pts-result').value) || 1;
  state.points.exact  = parseInt(document.getElementById('pts-exact').value)  || 3;
  await saveState();
}

function editPicksFor(userId) {
  const user = state.users.find(u => u.id === userId);
  if (!user) return;
  state.editingAs = user;
  document.getElementById('quiniela-info').innerHTML =
    `<i class="ti ti-edit"></i> Editando quiniela de <strong>${user.name}</strong>. 
     <a href="#" onclick="resetEditAs(event)" style="color:inherit;font-weight:500">← Volver a la mía</a>`;
  showTab('tab-quiniela', document.querySelectorAll('.tab')[0]);
  document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i === 0));
  renderMatches();
}

function resetEditAs(e) {
  if (e) e.preventDefault();
  state.editingAs = state.currentUser;
  document.getElementById('quiniela-info').innerHTML =
    '<i class="ti ti-info-circle"></i> Puedes editar tu quiniela hasta 1 hora antes de cada partido.';
  renderMatches();
}


// ─── Importar partidos desde openfootball (sin API key) ──────────────────────
async function importFixtures() {
  const btn = document.getElementById('btn-import');
  btn.textContent = 'Importando...';
  btn.disabled = true;
  try {
    const res = await fetch('https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json');
    if (!res.ok) throw new Error('No se pudo conectar');
    const data = await res.json();

    let added = 0;
    const existingKeys = new Set(state.matches.map(m => m.home + '|' + m.away));

    // openfootball 2026 format: data.matches[] with round, date, time, team1, team2, group, score
    const matches = data.matches || [];
    matches.forEach(m => {
      const home = m.team1;
      const away = m.team2;
      if (!home || !away) return;
      if (existingKeys.has(home + '|' + away)) return;

      // Parse datetime - time comes as "13:00 UTC-6", convert to local ISO
      const timeStr = (m.time || '12:00').split(' ')[0];
      const datetime = m.date + 'T' + timeStr + ':00';

      // Phase from round
      const round = (m.round || 'Fase de grupos').toLowerCase();
      let phase = 'Fase de grupos';
      if (round.includes('final') && round.includes('cuarto')) phase = 'Cuartos de final';
      else if (round.includes('octavo') || round.includes('round of 16')) phase = 'Octavos de final';
      else if (round.includes('semifinal') || round.includes('semi')) phase = 'Semifinal';
      else if (round.includes('third') || round.includes('tercer')) phase = 'Tercer lugar';
      else if (round.includes('final')) phase = 'Final';
      else if (m.group) phase = 'Fase de grupos - ' + m.group;

      // Score if available
      let result = { home: '', away: '' };
      if (m.score && m.score.ft) {
        result = { home: String(m.score.ft[0]), away: String(m.score.ft[1]) };
      }

      state.matches.push({
        id: 'm' + Date.now() + Math.random().toString(36).slice(2,6),
        home, away, datetime, phase, result
      });
      existingKeys.add(home + '|' + away);
      added++;
    });

    await saveState();
    btn.textContent = '✓ Importados ' + added + ' partidos';
    renderAdminMatches();
    renderMatches();
    setTimeout(() => { btn.textContent = 'Importar partidos del Mundial'; btn.disabled = false; }, 3000);
  } catch(e) {
    btn.textContent = 'Error: ' + e.message;
    btn.disabled = false;
    console.error(e);
  }
}

// ─── Actualizar resultados desde API-Football ────────────────────────────────
async function syncResults() {
  if (!API_FOOTBALL_KEY) {
    alert('Agrega tu API key de API-Football en app.js primero.\nRegistrate gratis en: https://dashboard.api-football.com/register');
    return;
  }
  const btn = document.getElementById('btn-sync');
  btn.textContent = 'Actualizando...';
  btn.disabled = true;
  try {
    const res = await fetch('https://v3.football.api-sports.io/fixtures?league=1&season=2026&status=FT', {
      headers: {
        'x-rapidapi-key': API_FOOTBALL_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io'
      }
    });
    const data = await res.json();
    if (!data.response) throw new Error('Respuesta inválida de API-Football');

    let updated = 0;
    data.response.forEach(fixture => {
      const home = fixture.teams.home.name;
      const away = fixture.teams.away.name;
      const scoreHome = String(fixture.goals.home ?? '');
      const scoreAway = String(fixture.goals.away ?? '');
      if (scoreHome === '' || scoreAway === '') return;

      // Match by team names (fuzzy - find closest)
      const match = state.matches.find(m =>
        m.home.toLowerCase().includes(home.toLowerCase().slice(0,5)) ||
        home.toLowerCase().includes(m.home.toLowerCase().slice(0,5))
      );
      if (match && (match.result.home !== scoreHome || match.result.away !== scoreAway)) {
        match.result = { home: scoreHome, away: scoreAway };
        updated++;
      }
    });

    await saveState();
    btn.textContent = '✓ ' + updated + ' resultados actualizados';
    renderAdminMatches();
    renderTabla();
    renderStats();
    renderMatches();
    setTimeout(() => { btn.textContent = 'Actualizar resultados'; btn.disabled = false; }, 3000);
  } catch(e) {
    btn.textContent = 'Error: ' + e.message;
    btn.disabled = false;
    console.error(e);
  }
}



// ─── Render: Comparar ────────────────────────────────────────────────────────
function filterComparar(filter, btn) {
  _compararFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderComparar(filter);
}

function renderComparar(filter = 'all') {
  const container = document.getElementById('comparar-list');
  if (!container) return;

  let matches = [...state.matches].sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

  if (filter === 'pending') matches = matches.filter(m => !m.result || m.result.home === '');
  if (filter === 'done')    matches = matches.filter(m => m.result && m.result.home !== '');

  if (matches.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-secondary)">No hay partidos en esta categoría.</div>';
    return;
  }

  const phases = [...new Set(matches.map(m => m.phase))];
  let html = '';

  phases.forEach(phase => {
    const ms = matches.filter(m => m.phase === phase);
    html += `<div class="phase-group"><div class="card"><div class="phase-header">${phase}</div>`;

    ms.forEach(m => {
      const hasResult = m.result && m.result.home !== '';
      const locked = isLocked(m);
      const dt = new Date(m.datetime);
      const dtStr = dt.toLocaleDateString('es', { weekday: 'short', month: 'short', day: 'numeric' })
        + ' ' + dt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

      // Match header
      html += `<div style="padding:12px 0;border-bottom:0.5px solid var(--border)">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap">
          <span style="font-weight:600;font-size:14px">${m.home}</span>
          <span style="color:var(--text-secondary);font-size:12px">vs</span>
          <span style="font-weight:600;font-size:14px">${m.away}</span>
          <span style="flex:1"></span>
          <span style="font-size:11px;color:var(--text-secondary)">${dtStr}</span>
          ${hasResult
            ? `<span class="badge badge-success">Resultado: ${m.result.home}–${m.result.away}</span>`
            : locked
            ? `<span class="badge badge-warning"><i class="ti ti-lock"></i> En curso / bloqueado</span>`
            : `<span class="badge badge-gray">Por jugar</span>`}
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">`;

      // Each user's pick
      state.users.forEach(u => {
        const pick = state.picks[u.id]?.[m.id];
        const hasPick = pick && pick.home !== '' && pick.away !== '';
        const color = colorFor(u.name);
        let badgeCls = 'badge-gray';
        let pts = 0;
        if (hasResult && hasPick) {
          pts = calcPoints(u.id, m);
          if (pts === state.points.exact) badgeCls = 'badge-success';
          else if (pts === state.points.result) badgeCls = 'badge-info';
          else badgeCls = 'badge-danger';
        }

        html += `<div style="display:flex;align-items:center;gap:6px;background:var(--bg-secondary);border-radius:var(--radius);padding:5px 10px">
          <div class="avatar" style="width:22px;height:22px;font-size:9px;background:${color}30;color:${color};flex-shrink:0">${initials(u.name)}</div>
          <span style="font-size:12px;font-weight:500">${u.name.split(' ')[0]}</span>
          <span class="badge ${badgeCls}" style="font-size:11px">
            ${hasPick ? pick.home + '–' + pick.away : '–'}
            ${hasResult && hasPick ? ' · +' + pts : ''}
          </span>
        </div>`;
      });

      html += `</div></div>`;
    });

    html += '</div></div>';
  });

  container.innerHTML = html;
}

// ─── Borrar todos los partidos ───────────────────────────────────────────────
function openDeleteAllModal() {
  document.getElementById('modal-deleteall-overlay').classList.remove('hidden');
}
function closeDeleteAllModal() {
  document.getElementById('modal-deleteall-overlay').classList.add('hidden');
}
async function confirmDeleteAll() {
  state.matches = [];
  state.picks   = {};
  closeDeleteAllModal();
  await saveState();
  renderAdminMatches();
  renderMatches();
  renderTabla();
  renderStats();
}

// ─── Cambiar PIN ─────────────────────────────────────────────────────────────
function cpNext(prefix, el, nextIdx) {
  if (el.value.length === 1 && nextIdx !== null)
    document.getElementById('cp-' + prefix + '-' + nextIdx).focus();
}
function cpBack(prefix, e, el, prevIdx) {
  if (e.key === 'Backspace' && el.value === '' && prevIdx !== null)
    document.getElementById('cp-' + prefix + '-' + prevIdx).focus();
}
function getCpPin(prefix) {
  return [0,1,2,3].map(i => document.getElementById('cp-' + prefix + '-' + i).value).join('');
}
function clearCpPin(prefix) {
  [0,1,2,3].forEach(i => { document.getElementById('cp-' + prefix + '-' + i).value = ''; });
}

function openChangePinModal() {
  ['cur','new','cfm'].forEach(p => clearCpPin(p));
  document.getElementById('cp-error').classList.add('hidden');
  document.getElementById('cp-success').classList.add('hidden');
  ['cur','new','cfm'].forEach(p =>
    [0,1,2,3].forEach(i => document.getElementById('cp-'+p+'-'+i).classList.remove('error'))
  );
  document.getElementById('modal-changepin-overlay').classList.remove('hidden');
  document.getElementById('cp-cur-0').focus();
}
function closeChangePinModal() {
  document.getElementById('modal-changepin-overlay').classList.add('hidden');
}
async function saveNewPin() {
  const errEl = document.getElementById('cp-error');
  const sucEl = document.getElementById('cp-success');
  errEl.classList.add('hidden');
  sucEl.classList.add('hidden');

  const cur = getCpPin('cur');
  const nw  = getCpPin('new');
  const cfm = getCpPin('cfm');

  const user = state.users.find(u => u.id === state.currentUser.id);

  if (cur.length < 4) { errEl.textContent = 'Ingresa tu PIN actual completo'; errEl.classList.remove('hidden'); return; }
  if (user.pin && user.pin !== cur) {
    errEl.textContent = 'PIN actual incorrecto';
    errEl.classList.remove('hidden');
    clearCpPin('cur');
    document.getElementById('cp-cur-0').focus();
    return;
  }
  if (nw.length < 4) { errEl.textContent = 'El nuevo PIN debe tener 4 dígitos'; errEl.classList.remove('hidden'); return; }
  if (nw !== cfm) {
    errEl.textContent = 'Los PINs nuevos no coinciden';
    errEl.classList.remove('hidden');
    clearCpPin('new'); clearCpPin('cfm');
    document.getElementById('cp-new-0').focus();
    return;
  }

  user.pin = nw;
  state.currentUser = user;
  await saveState();
  sucEl.classList.remove('hidden');
  setTimeout(() => closeChangePinModal(), 1500);
}

// ─── Boot ────────────────────────────────────────────────────────────────────
initFirebase().catch(err => {
  console.error('Firebase error:', err);
  document.body.innerHTML = `<div style="padding:2rem;font-family:sans-serif;color:#a32d2d">
    <h2>Error de configuración</h2>
    <p>Asegúrate de haber reemplazado los valores de Firebase en <code>app.js</code>. Ver <code>README.md</code>.</p>
  </div>`;
});
