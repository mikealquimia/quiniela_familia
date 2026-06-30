// ─── Firebase config ────────────────────────────────────────────────────────
// IMPORTANTE: Estos son los datos de quiniela_familia. No cambiar.
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAAQ5LBKV9nav8FRm8HJIvZU6wmV5tT-RE",
  authDomain: "quiniela-familia-2026-8c4a9.firebaseapp.com",
  projectId: "quiniela-familia-2026-8c4a9",
  storageBucket: "quiniela-familia-2026-8c4a9.firebasestorage.app",
  messagingSenderId: "230703417525",
  appId: "1:230703417525:web:859a9e538f6998b0fc96fc"
};

// ─── API-Football config ─────────────────────────────────────────────────────
// La key se guarda en localStorage via el panel de configuración en Admin.
const API_FOOTBALL_KEY_DEFAULT = "9999ebd705992251ae7de01915a6deac";

// ─── API Config helpers ───────────────────────────────────────────────────────
const API_CFG_KEY = 'quiniela_api_config';

function getApiConfig() {
  try {
    const saved = localStorage.getItem(API_CFG_KEY);
    if (saved) return JSON.parse(saved);
  } catch(e) {}
  return {
    apiKey: API_FOOTBALL_KEY_DEFAULT,
    leagueId: '',
    season: '2026',
    leagueName: 'FIFA World Cup'
  };
}

function saveApiConfig() {
  const cfg = {
    apiKey:     document.getElementById('cfg-apikey').value.trim(),
    leagueId:   document.getElementById('cfg-leagueid').value.trim(),
    season:     document.getElementById('cfg-season').value.trim() || '2026',
    leagueName: document.getElementById('cfg-leaguename').value.trim() || 'FIFA World Cup',
  };
  if (!cfg.apiKey) { alert('Ingresa una API key.'); return; }
  localStorage.setItem(API_CFG_KEY, JSON.stringify(cfg));
  updateApiConfigStatus();
  showToast('✅ Configuración guardada');
}

function resetApiConfig() {
  localStorage.removeItem(API_CFG_KEY);
  loadApiConfigForm();
  updateApiConfigStatus();
  showToast('↩️ Configuración restaurada a defaults');
}

function loadApiConfigForm() {
  const cfg = getApiConfig();
  document.getElementById('cfg-apikey').value     = cfg.apiKey || '';
  document.getElementById('cfg-leagueid').value   = cfg.leagueId || '';
  document.getElementById('cfg-season').value     = cfg.season || '2026';
  document.getElementById('cfg-leaguename').value = cfg.leagueName || 'FIFA World Cup';
}

function updateApiConfigStatus() {
  const cfg = getApiConfig();
  const el = document.getElementById('api-config-status');
  if (!el) return;
  const hasKey = cfg.apiKey && cfg.apiKey !== API_FOOTBALL_KEY_DEFAULT;
  el.textContent = hasKey ? '🟢 Key configurada' : '🔴 Usando key de ejemplo';
  el.style.color = hasKey ? 'var(--success-text,green)' : 'var(--warning-text,orange)';
}

function toggleApiKeyVisibility() {
  const inp = document.getElementById('cfg-apikey');
  const eye = document.getElementById('cfg-apikey-eye');
  if (inp.type === 'password') { inp.type = 'text';     eye.textContent = '🙈'; }
  else                          { inp.type = 'password'; eye.textContent = '👁';  }
}

async function testApiConfig() {
  const cfg = {
    apiKey:     document.getElementById('cfg-apikey').value.trim(),
    leagueId:   document.getElementById('cfg-leagueid').value.trim(),
    season:     document.getElementById('cfg-season').value.trim() || '2026',
    leagueName: document.getElementById('cfg-leaguename').value.trim() || 'FIFA World Cup',
  };
  if (!cfg.apiKey) { alert('Ingresa una API key primero.'); return; }

  const btn = document.getElementById('btn-test-api');
  const res = document.getElementById('api-test-result');
  btn.textContent = 'Probando...'; btn.disabled = true;
  res.style.display = 'block';
  res.textContent = '⏳ Consultando API...';

  try {
    const leagueUrl = `https://v3.football.api-sports.io/leagues?name=${encodeURIComponent(cfg.leagueName)}&season=${cfg.season}`;
    const lr = await fetch(leagueUrl, { headers: { 'x-rapidapi-key': cfg.apiKey, 'x-rapidapi-host': 'v3.football.api-sports.io' } });
    const ld = await lr.json();
    const leagues = ld.response || [];
    const errors  = ld.errors || {};

    let lines = [];
    if (Object.keys(errors).length > 0) {
      lines.push(`❌ Error de API: ${JSON.stringify(errors)}`);
      lines.push(`   → Verifica que tu API key sea válida.`);
    } else if (leagues.length === 0) {
      lines.push(`⚠️ No se encontró liga con nombre "${cfg.leagueName}" en temporada ${cfg.season}`);
    } else {
      lines.push(`✅ Liga(s) encontrada(s):`);
      leagues.forEach(l => lines.push(`   • ${l.league.name} — ID: ${l.league.id} (${l.country?.name || ''})`));
    }

    const useId = cfg.leagueId || (leagues[0]?.league?.id ?? 1);
    lines.push(`\n📡 Consultando fixtures (League ID: ${useId}, Season: ${cfg.season})...`);
    const fr = await fetch(`https://v3.football.api-sports.io/fixtures?league=${useId}&season=${cfg.season}`,
      { headers: { 'x-rapidapi-key': cfg.apiKey, 'x-rapidapi-host': 'v3.football.api-sports.io' } });
    const fd = await fr.json();
    const fixtures = fd.response || [];
    const finished = fixtures.filter(f => ['FT','AET','PEN'].includes(f.fixture?.status?.short));
    const remaining = fr.headers.get('x-ratelimit-requests-remaining');
    const limit     = fr.headers.get('x-ratelimit-requests-limit');

    lines.push(`📋 Total partidos en torneo: ${fixtures.length}`);
    lines.push(`✅ Finalizados (FT/AET/PEN): ${finished.length}`);
    if (remaining != null) lines.push(`🔑 Llamadas restantes hoy: ${remaining}/${limit}`);

    res.textContent = lines.join('\n');
    res.style.background = fixtures.length > 0 ? '#f0fff4' : '#fff8f0';
  } catch(e) {
    res.textContent = `❌ Error de red: ${e.message}`;
  }

  btn.textContent = '🔌 Probar conexión'; btn.disabled = false;
}

function showToast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#222;color:#fff;padding:10px 20px;border-radius:8px;font-size:14px;z-index:99999;opacity:0;transition:opacity .2s';
  document.body.appendChild(t);
  requestAnimationFrame(() => { t.style.opacity = '1'; setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2500); });
}

function getApiKey() { return getApiConfig().apiKey || API_FOOTBALL_KEY_DEFAULT; }

// ─── State ──────────────────────────────────────────────────────────────────
let db;
let state = {
  users: [],
  matches: [],
  picks: {},
  points: { result: 1, exact: 3 },   // puntos familia: exacto=3, resultado=1
  currentUser: null,
  editingAs: null
};

const COLORS = ['#3B6D11','#185FA5','#A32D2D','#854F0B','#993556','#3C3489','#0F6E56','#993C1D'];

// ─── Banderas de países (emoji via código ISO 3166-1 alpha-2) ────────────────
const COUNTRY_FLAGS = {
  'Mexico': 'MX', 'México': 'MX',
  'USA': 'US', 'United States': 'US', 'Estados Unidos': 'US',
  'Canada': 'CA', 'Canadá': 'CA',
  'Brazil': 'BR', 'Brasil': 'BR',
  'Argentina': 'AR',
  'Colombia': 'CO',
  'Ecuador': 'EC',
  'Uruguay': 'UY',
  'Chile': 'CL',
  'Paraguay': 'PY',
  'Peru': 'PE', 'Perú': 'PE',
  'Bolivia': 'BO',
  'Venezuela': 'VE',
  'Spain': 'ES', 'España': 'ES',
  'France': 'FR', 'Francia': 'FR',
  'Germany': 'DE', 'Alemania': 'DE',
  'England': 'GB', 'Inglaterra': 'GB',
  'Portugal': 'PT',
  'Netherlands': 'NL', 'Países Bajos': 'NL', 'Holanda': 'NL',
  'Belgium': 'BE', 'Bélgica': 'BE',
  'Italy': 'IT', 'Italia': 'IT',
  'Croatia': 'HR', 'Croacia': 'HR',
  'Denmark': 'DK', 'Dinamarca': 'DK',
  'Switzerland': 'CH', 'Suiza': 'CH',
  'Austria': 'AT',
  'Serbia': 'RS',
  'Poland': 'PL', 'Polonia': 'PL',
  'Ukraine': 'UA', 'Ucrania': 'UA',
  'Hungary': 'HU', 'Hungría': 'HU',
  'Slovakia': 'SK', 'Eslovaquia': 'SK',
  'Slovenia': 'SI', 'Eslovenia': 'SI',
  'Romania': 'RO', 'Rumanía': 'RO',
  'Czechia': 'CZ', 'Czech Republic': 'CZ', 'República Checa': 'CZ',
  'Scotland': 'GB', 'Escocia': 'GB',
  'Wales': 'GB', 'Gales': 'GB',
  'Turkey': 'TR', 'Turquía': 'TR',
  'Greece': 'GR', 'Grecia': 'GR',
  'Morocco': 'MA', 'Marruecos': 'MA',
  'Senegal': 'SN',
  'Nigeria': 'NG',
  'Ghana': 'GH',
  'Ivory Coast': 'CI', 'Côte d\'Ivoire': 'CI', 'Costa de Marfil': 'CI',
  'Egypt': 'EG', 'Egipto': 'EG',
  'Cameroon': 'CM', 'Camerún': 'CM',
  'Tunisia': 'TN', 'Túnez': 'TN',
  'Algeria': 'DZ', 'Argelia': 'DZ',
  'Mali': 'ML',
  'South Africa': 'ZA', 'Sudáfrica': 'ZA',
  'DR Congo': 'CD', 'Congo': 'CD',
  'Japan': 'JP', 'Japón': 'JP',
  'South Korea': 'KR', 'Corea del Sur': 'KR', 'Korea Republic': 'KR',
  'Australia': 'AU',
  'Iran': 'IR', 'Irán': 'IR',
  'Saudi Arabia': 'SA', 'Arabia Saudita': 'SA',
  'Qatar': 'QA',
  'Iraq': 'IQ',
  'Jordan': 'JO', 'Jordania': 'JO',
  'Uzbekistan': 'UZ', 'Uzbekistán': 'UZ',
  'China': 'CN',
  'Indonesia': 'ID',
  'New Zealand': 'NZ', 'Nueva Zelanda': 'NZ',
  'Costa Rica': 'CR',
  'Panama': 'PA', 'Panamá': 'PA',
  'Honduras': 'HN',
  'Guatemala': 'GT',
  'Jamaica': 'JM',
  'Trinidad and Tobago': 'TT',
  'Cuba': 'CU',
  'Haiti': 'HT', 'Haití': 'HT',
  'El Salvador': 'SV',
  'Nicaragua': 'NI',
};

// ─── Banderas imagen via flagcdn.com ─────────────────────────────────────────
const TEAM_FLAGS = {
  'Algeria':'dz','Argentina':'ar','Australia':'au','Austria':'at','Belgium':'be',
  'Bosnia & Herzegovina':'ba','Brazil':'br','Canada':'ca','Cape Verde':'cv',
  'Colombia':'co','Croatia':'hr','Curaçao':'cw','Czech Republic':'cz',
  'DR Congo':'cd','Ecuador':'ec','Egypt':'eg','England':'gb-eng','France':'fr',
  'Germany':'de','Ghana':'gh','Haiti':'ht','Iran':'ir','Iraq':'iq',
  'Ivory Coast':'ci','Japan':'jp','Jordan':'jo','Mexico':'mx','Morocco':'ma',
  'Netherlands':'nl','New Zealand':'nz','Norway':'no','Panama':'pa',
  'Paraguay':'py','Portugal':'pt','Qatar':'qa','Saudi Arabia':'sa',
  'Scotland':'gb-sct','Senegal':'sn','South Africa':'za','South Korea':'kr',
  'Spain':'es','Sweden':'se','Switzerland':'ch','Tunisia':'tn','Turkey':'tr',
  'USA':'us','Uruguay':'uy','Uzbekistan':'uz','Honduras':'hn','Guatemala':'gt',
  'Costa Rica':'cr','Jamaica':'jm','El Salvador':'sv',
};

function flagImg(team, cls = 'flag') {
  const c = TEAM_FLAGS[team];
  const w = cls === 'flag' ? 'w40' : 'w80';
  return c
    ? `<img class="${cls}" src="https://flagcdn.com/${w}/${c}.png" alt="" loading="lazy">`
    : `<span class="${cls} flag-tbd">⚽</span>`;
}

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

  onSnapshot(doc(db, 'quiniela', 'data'), (snap) => {
    if (snap.exists()) {
      const d = snap.data();
      state.users   = d.users   || [];
      state.matches = d.matches || [];
      state.picks   = d.picks   || {};
      state.points  = d.points  || { result: 1, exact: 3 };
      if (state.currentUser) {
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
  renderMyStats();
  renderMatches();
  renderTabla();
  renderStats();
  renderComparar();
  renderAdminMatches();
  renderAdminUsers();
  renderBracket();
  document.getElementById('pts-result').value = state.points.result;
  document.getElementById('pts-exact').value   = state.points.exact;
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
function showTab(id, btn) {
  ['tab-quiniela','tab-tabla','tab-stats','tab-comparar','tab-admin','tab-bracket'].forEach(t => {
    document.getElementById(t).classList.add('hidden');
  });
  document.getElementById(id).classList.remove('hidden');
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (id === 'tab-comparar') renderComparar();
  if (id === 'tab-bracket')  renderBracket();
}

// ─── Pick helpers ─────────────────────────────────────────────────────────────
function hasVal(v) { return v !== '' && v !== null && v !== undefined; }
function pickSet(pick) {
  if (!pick) return false;
  return hasVal(pick.home) || hasVal(pick.away);
}
function normPick(pick) {
  if (!pick) return { home: 0, away: 0 };
  return {
    home: hasVal(pick.home) ? pick.home : 0,
    away: hasVal(pick.away) ? pick.away : 0
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function isLocked(match) {
  return Date.now() >= new Date(match.datetime).getTime() - 60 * 60 * 1000;
}

// Ganador por penales en un empate: 'H' | 'A' | null
function penWinner(result) {
  if (!result || result.penHome == null || result.penAway == null) return null;
  if (result.penHome === '' || result.penAway === '') return null;
  const ph = parseInt(result.penHome), pa = parseInt(result.penAway);
  if (isNaN(ph) || isNaN(pa) || ph === pa) return null;
  return ph > pa ? 'H' : 'A';
}

// Sistema de puntos familia: exacto=3, resultado=1 (sin bonos adicionales)
function calcPoints(userId, match) {
  if (!match.result || match.result.home === '') return 0;
  const pick = state.picks[userId]?.[match.id];
  if (!pickSet(pick)) return 0;
  const np = normPick(pick);
  const rh = parseInt(match.result.home ?? 0), ra = parseInt(match.result.away ?? 0);
  const ph = parseInt(np.home ?? 0),           pa = parseInt(np.away ?? 0);
  if (ph === rh && pa === ra) return state.points.exact;
  const rawRes = rh > ra ? 'H' : rh < ra ? 'A' : 'D';
  const pen = penWinner(match.result);
  // En empate con penales: quien predijo empate (marcador real) O quien predijo
  // al ganador de penales, ambos reciben puntos de ganador.
  const pRes = ph > pa ? 'H' : ph < pa ? 'A' : 'D';
  if (pen) {
    return (pRes === 'D' || pRes === pen) ? state.points.result : 0;
  }
  return rawRes === pRes ? state.points.result : 0;
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

function countDraws(userId) {
  let d = 0;
  state.matches.forEach(m => {
    const pk = state.picks[userId]?.[m.id];
    if (pickSet(pk)) { const np = normPick(pk); if (+np.home === +np.away) d++; }
  });
  return d;
}

// ─── Zona horaria Guatemala ──────────────────────────────────────────────────
// Guatemala es UTC-6, sin cambio de horario de verano

// Retorna fecha 'YYYY-MM-DD' en zona horaria de Guatemala
function todayGuatemala() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guatemala' });
}

// Retorna la fecha 'YYYY-MM-DD' de un datetime almacenado, en zona Guatemala.
// Datetimes se almacenan como UTC ISO (con sufijo Z) o sin sufijo (se trata como UTC).
function matchDateGT(datetime) {
  const d = new Date(datetime.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(datetime)
    ? datetime
    : datetime + 'Z');
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Guatemala' });
}

// Formatea datetime para mostrar en zona Guatemala
function fmtDatetimeGT(datetime) {
  const d = new Date(datetime.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(datetime)
    ? datetime
    : datetime + 'Z');
  const day  = d.toLocaleDateString('es',  { timeZone: 'America/Guatemala', weekday: 'short', month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString('es',  { timeZone: 'America/Guatemala', hour: '2-digit', minute: '2-digit' });
  return day + ' ' + time;
}

// Formatea solo la hora en Guatemala
function fmtTime(datetime) {
  const d = new Date(datetime.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(datetime)
    ? datetime : datetime + 'Z');
  return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Guatemala' });
}

// Formatea fecha corta (ej: "12 jun")
function fmtDateShort(datetime) {
  const d = new Date(datetime.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(datetime)
    ? datetime : datetime + 'Z');
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short', timeZone: 'America/Guatemala' });
}

// Formatea fecha larga (ej: "viernes, 12 de junio")
function fmtDateLong(datetime, options = {}) {
  const d = typeof datetime === 'string'
    ? new Date((datetime.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(datetime)) ? datetime : datetime + 'Z')
    : datetime;
  return d.toLocaleDateString('es', { timeZone: 'America/Guatemala', ...options });
}

// ─── Render: My Stats (mini grid en tab quiniela) ────────────────────────────
function renderMyStats() {
  const grid = document.getElementById('my-stats-grid');
  if (!grid || !state.currentUser) return;
  const u = state.currentUser;
  let pts = 0, exact = 0, result = 0, played = 0, pending = 0;
  state.matches.forEach(m => {
    if (m.result && m.result.home !== '') {
      played++;
      const p = calcPoints(u.id, m);
      pts += p;
      if (p === state.points.exact) exact++;
      else if (p === state.points.result) result++;
    } else {
      pending++;
    }
  });
  const color = colorFor(u.name);
  grid.innerHTML = `
    <div class="stat-card" style="border-left:3px solid ${color}">
      <div class="stat-label">Mis puntos</div>
      <div class="stat-value" style="color:${color}">${pts}</div>
    </div>
    <div class="stat-card" style="border-left:3px solid var(--success-text)">
      <div class="stat-label">Marcador exacto</div>
      <div class="stat-value" style="color:var(--success-text)">${exact}</div>
    </div>
    <div class="stat-card" style="border-left:3px solid var(--accent)">
      <div class="stat-label">Resultado acertado</div>
      <div class="stat-value" style="color:var(--accent)">${result}</div>
    </div>
    <div class="stat-card" style="border-left:3px solid var(--text-secondary)">
      <div class="stat-label">Por jugar</div>
      <div class="stat-value">${pending}</div>
    </div>
  `;
}

// ─── Date filter para Mi quiniela ────────────────────────────────────────────
function populateDateFilter() {
  const sel = document.getElementById('date-filter');
  if (!sel) return;
  const current = sel.value;
  const today = todayGuatemala();
  const dates = [...new Set(
    state.matches.map(m => m.datetime ? matchDateGT(m.datetime) : null).filter(Boolean)
  )].sort();
  sel.innerHTML = '<option value="all">Todos los partidos</option>';
  dates.forEach(d => {
    const label = fmtDateLong(d + 'T12:00:00Z', { weekday: 'long', day: 'numeric', month: 'long' });
    const o = document.createElement('option');
    o.value = d;
    o.textContent = (d === today ? '📅 Hoy — ' : '') + label.charAt(0).toUpperCase() + label.slice(1);
    sel.appendChild(o);
  });
  if (current && current !== 'all') {
    sel.value = current;
  } else if (!current || current === 'all') {
    if (dates.includes(today)) sel.value = today;
  }
}

function stepDay(dir) {
  const sel = document.getElementById('date-filter');
  if (!sel) return;
  const opts = [...sel.options].map(o => o.value);
  const i = Math.max(0, Math.min(opts.length - 1, opts.indexOf(sel.value) + dir));
  sel.value = opts[i];
  renderMatches();
}

// ─── Render: Matches ─────────────────────────────────────────────────────────
function renderMatches() {
  const container = document.getElementById('matches-list');
  const editUser = state.editingAs;
  if (!editUser) { container.innerHTML = ''; return; }

  renderMyStats();
  populateDateFilter();

  const dateFilter = document.getElementById('date-filter')?.value || 'all';

  if (state.matches.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--text-secondary)">
      <i class="ti ti-calendar-off" style="font-size:28px;display:block;margin-bottom:10px"></i>
      Aún no hay partidos cargados
    </div>`;
    return;
  }

  const today = todayGuatemala();
  let matches = [...state.matches].sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  if (dateFilter === 'today') {
    matches = matches.filter(m => matchDateGT(m.datetime) === today);
  } else if (dateFilter !== 'all') {
    matches = matches.filter(m => matchDateGT(m.datetime) === dateFilter);
  }

  if (matches.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--text-secondary)">
      <i class="ti ti-calendar-off" style="font-size:28px;display:block;margin-bottom:10px"></i>
      No hay partidos en esta fecha
    </div>`;
    return;
  }

  const phases = [...new Set(matches.map(m => m.phase))];
  let html = '';

  phases.forEach(phase => {
    const ms = matches.filter(m => m.phase === phase);
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

      const dtStr = fmtDatetimeGT(m.datetime);
      const np = normPick(pick);

      const inputsOrPick = locked || resultKnown
        ? `<span style="font-size:14px;font-weight:600;min-width:64px;text-align:center;color:var(--text-secondary)">
             ${pickSet(pick) ? np.home + ' – ' + np.away : '– –'}
           </span>`
        : `<input type="number" min="0" max="20" class="score-input" value="${pick.home}"
             placeholder="0" onchange="setPick('${editUser.id}','${m.id}','home',this.value)">
           <span class="score-sep">–</span>
           <input type="number" min="0" max="20" class="score-input" value="${pick.away}"
             placeholder="0" onchange="setPick('${editUser.id}','${m.id}','away',this.value)">`;

      html += `<div class="match-row">
        <div class="match-teams">
          <div class="match-teams-row">
            <span class="team-flag">${flagImg(m.home)}</span>
            <span class="team-name right">${m.home}</span>
            ${inputsOrPick}
            <span class="team-name">${m.away}</span>
            <span class="team-flag">${flagImg(m.away)}</span>
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
function rankingHtml() {
  if (!state.users.length) return '';
  const rows = getTableData().map((d, i) => {
    const color = colorFor(d.user.name);
    const pos = i < 3 ? ['🥇','🥈','🥉'][i] : (i + 1);
    return '<div class="cmp-rank-row">'
      + '<span class="cmp-rank-pos">' + pos + '</span>'
      + '<span class="cmp-avatar" style="background:' + color + '30;color:' + color + '">' + initials(d.user.name) + '</span>'
      + '<span class="cmp-rank-name">' + d.user.name.split(' ')[0] + '</span>'
      + '<span class="cmp-rank-pts">' + d.pts + '<small> pts</small></span>'
      + '</div>';
  }).join('');
  return '<div class="cmp-rank"><div class="cmp-rank-head"><i class="ti ti-trophy"></i> Ranking general</div>' + rows + '</div>';
}

function renderTabla() {
  const rankEl = document.getElementById('tabla-rank');
  if (!rankEl) return;
  const totalPlayed = state.matches.filter(m => m.result && m.result.home !== '').length;

  rankEl.innerHTML = rankingHtml();

  document.getElementById('tabla-stats').innerHTML = `
    <div class="stat-card"><div class="stat-label">Partidos jugados</div><div class="stat-value">${totalPlayed}</div></div>
    <div class="stat-card"><div class="stat-label">Partidos totales</div><div class="stat-value">${state.matches.length}</div></div>
    <div class="stat-card"><div class="stat-label">Participantes</div><div class="stat-value">${state.users.length}</div></div>
    <div class="stat-card"><div class="stat-label">Pts exacto</div><div class="stat-value">${state.points.exact}</div></div>
    <div class="stat-card"><div class="stat-label">Pts resultado</div><div class="stat-value">${state.points.result}</div></div>
  `;
}

// ─── Render: Stats ───────────────────────────────────────────────────────────
function renderStats() {
  if (!document.getElementById('stats-body')) return;
  const data = getTableData();
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

  // Destacados
  const arr = data.map(d => ({
    name: d.user.name.split(' ')[0],
    aciertos: d.exact + d.result,
    draws: countDraws(d.user.id),
    played: d.played,
    pct: d.played > 0 ? Math.round((d.exact + d.result) / d.played * 100) : 0
  }));
  const playedArr = arr.filter(x => x.played > 0);
  const maxBy = (pool, k) => pool.length ? pool.reduce((b, x) => x[k] > b[k] ? x : b) : null;
  const ifPos = (w, k) => (w && w[k] > 0) ? w : null;
  const statCard = (label, w, fmt) =>
    `<div class="stat-card">
      <div class="stat-label">${label}</div>
      <div class="stat-value" style="font-size:20px">${w ? w.name : '—'}</div>
      <div style="font-size:12px;color:var(--text-secondary);margin-top:2px">${w ? fmt(w) : 'Aún sin datos'}</div>
    </div>`;
  const hl = document.getElementById('stats-highlights');
  if (hl) hl.innerHTML =
      statCard('Quién acierta más', ifPos(maxBy(playedArr, 'aciertos'), 'aciertos'), w => w.aciertos + ' aciertos')
    + statCard('Rey del empate',    ifPos(maxBy(arr, 'draws'), 'draws'),             w => w.draws + ' empates predichos')
    + statCard('Mejor precisión',   ifPos(maxBy(playedArr, 'pct'), 'pct'),           w => w.pct + '% de aciertos');

  // Tabla detallada de todos los picks
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
      const np = normPick(pick);
      const pickStr = pickSet(pick) ? `${np.home}–${np.away}` : '–';
      const cls = pts === state.points.exact ? 'badge-success'
                : pts === state.points.result ? 'badge-info' : 'badge-gray';
      html += `<td style="text-align:center"><span class="badge ${cls}">${pickStr}</span></td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table></div>';
  document.getElementById('all-picks-container').innerHTML = html;
}

// ─── Render: Comparar (tarjetas colapsables estilo oscar) ────────────────────
function populateCmpDates() {
  const sel = document.getElementById('cmp-date-filter');
  if (!sel) return;
  const current = sel.value;
  const today = todayGuatemala();
  const dates = [...new Set(
    state.matches.map(m => m.datetime ? matchDateGT(m.datetime) : null).filter(Boolean)
  )].sort();
  sel.innerHTML = '<option value="all">Todos los partidos</option>';
  dates.forEach(d => {
    const label = fmtDateLong(d + 'T12:00:00Z', { weekday: 'long', day: 'numeric', month: 'long' });
    const o = document.createElement('option');
    o.value = d;
    o.textContent = (d === today ? '📅 Hoy — ' : '') + label.charAt(0).toUpperCase() + label.slice(1);
    sel.appendChild(o);
  });
  if (current && current !== 'all') {
    sel.value = current;
  } else if (!current || current === 'all') {
    if (dates.includes(today)) sel.value = today;
  }
}

function stepCmpDay(dir) {
  const sel = document.getElementById('cmp-date-filter');
  if (!sel) return;
  const opts = [...sel.options].map(o => o.value);
  const i = Math.max(0, Math.min(opts.length - 1, opts.indexOf(sel.value) + dir));
  sel.value = opts[i];
  renderComparar();
}

function toggleCmpGroup(key) {
  const el = document.getElementById('cmpg-' + key);
  if (el) el.classList.toggle('open');
}

function toggleCmpCard(matchId) {
  const el = document.getElementById('cmpc-' + matchId);
  if (el) el.classList.toggle('open');
}

function renderComparar() {
  const listEl = document.getElementById('comparar-list');
  if (!listEl) return;

  populateCmpDates();
  const dayFilter = document.getElementById('cmp-date-filter')?.value || 'all';
  let matches = [...state.matches].sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  if (dayFilter !== 'all') matches = matches.filter(m => m.datetime && matchDateGT(m.datetime) === dayFilter);

  if (matches.length === 0) {
    listEl.innerHTML = '<div class="cmp-empty">No hay partidos para este día. Usa ‹ › para ver otro día.</div>';
    return;
  }

  const groups = { done: [], live: [], pend: [] };
  matches.forEach(m => {
    if (m.result && m.result.home !== '') groups.done.push(m);
    else if (isLocked(m)) groups.live.push(m);
    else groups.pend.push(m);
  });

  const meta = {
    done: { label: 'Finalizados', icon: 'ti-circle-check' },
    live: { label: 'En curso',    icon: 'ti-ball-football' },
    pend: { label: 'Pendientes',  icon: 'ti-clock' }
  };
  const order = ['done', 'live', 'pend'];
  const firstVisible = order.find(k => groups[k].length);

  let html = '';
  order.forEach(key => {
    const ms = groups[key];
    if (!ms.length) return;
    const open = true; // todos los grupos abiertos por defecto
    html += '<div class="cmp-group' + (open ? ' open' : '') + '" id="cmpg-' + key + '">'
      + '<button class="cmp-group-head" onclick="toggleCmpGroup(\'' + key + '\')">'
      + '<i class="ti ' + meta[key].icon + ' cmp-group-icon"></i>'
      + '<span class="cmp-group-title">' + meta[key].label + '</span>'
      + '<span class="cmp-group-count">' + ms.length + '</span>'
      + '<i class="ti ti-chevron-down cmp-chev"></i>'
      + '</button>'
      + '<div class="cmp-group-wrap"><div class="cmp-group-body">'
      + ms.map(cmpCard).join('')
      + '</div></div></div>';
  });

  listEl.innerHTML = html;
}

function cmpCard(m) {
  const hasResult = m.result && m.result.home !== '';
  const meId = state.currentUser?.id;

  const badgeFor = pts => pts === state.points.exact ? 'badge-success' : pts > 0 ? 'badge-info' : 'badge-danger';

  let winnersHtml = '';
  if (hasResult) {
    const scored = state.users
      .filter(u => pickSet(state.picks[u.id]?.[m.id]))
      .map(u => ({ u, pts: calcPoints(u.id, m) }));
    const max = scored.reduce((mx, s) => Math.max(mx, s.pts), 0);
    const winners = max > 0 ? scored.filter(s => s.pts === max) : [];
    winnersHtml = winners.length
      ? winners.map(s => '<span class="cmp-win">🥇 ' + s.u.name.split(' ')[0]
          + '<span class="badge-win">+' + s.pts + '</span></span>').join('')
      : '<span class="cmp-noone">Nadie acertó este partido</span>';
  }

  const myPick = meId ? state.picks[meId]?.[m.id] : null;
  const myHas = pickSet(myPick);
  const myNp = normPick(myPick);
  const myPts = hasResult && myHas ? calcPoints(meId, m) : null;
  const mineStr = myHas
    ? myNp.home + ' - ' + myNp.away + (myPts !== null ? ' <span class="cmp-mine-pts">(+' + myPts + ')</span>' : '')
    : '<span class="cmp-noone">Sin predicción</span>';

  const detailHtml = state.users
    .map(u => {
      const pk = state.picks[u.id]?.[m.id];
      const has = pickSet(pk);
      const np = normPick(pk);
      const pts = hasResult && has ? calcPoints(u.id, m) : null;
      return { u, has, np, pts };
    })
    .sort((a, b) => (b.pts ?? -1) - (a.pts ?? -1))
    .map(r => {
      const color = colorFor(r.u.name);
      const pickStr = r.has ? r.np.home + '-' + r.np.away : '–';
      const cls = r.pts !== null ? badgeFor(r.pts) : 'badge-gray';
      // Ocultar picks ajenos si no está bloqueado ni hay resultado
      const visible = isLocked(m) || hasResult || (r.u.id === meId);
      const displayStr = visible ? pickStr : '🔒';
      return '<div class="cmp-pred' + (r.u.id === meId ? ' me' : '') + '">'
        + '<span class="cmp-avatar" style="background:' + color + '30;color:' + color + '">' + initials(r.u.name) + '</span>'
        + '<span class="cmp-pred-name">' + r.u.name.split(' ')[0] + '</span>'
        + '<span class="cmp-pred-pick">' + displayStr + '</span>'
        + '<span class="badge ' + cls + ' cmp-pred-badge">' + (r.pts !== null && visible ? '+' + r.pts : '·') + '</span>'
        + '</div>';
    }).join('');

  const center = hasResult
    ? '<span class="cmp-score">' + m.result.home + ' - ' + m.result.away + '</span>'
    : '<span class="cmp-vs">vs</span>';
  const subline = hasResult
    ? 'Resultado final'
    : fmtDateShort(m.datetime) + ' · ' + fmtTime(m.datetime);

  return '<div class="cmp-card" id="cmpc-' + m.id + '">'
    + '<div class="cmp-fixture">'
    +   '<span class="cmp-team home">' + m.home + ' ' + flagImg(m.home) + '</span>'
    +   center
    +   '<span class="cmp-team away">' + flagImg(m.away) + ' ' + m.away + '</span>'
    + '</div>'
    + '<div class="cmp-subline">' + subline + '</div>'
    + (winnersHtml ? '<div class="cmp-winners">' + winnersHtml + '</div>' : '')
    + '<div class="cmp-mine"><span class="cmp-mine-label">⭐ Tu predicción</span>'
    +   '<span class="cmp-mine-val">' + mineStr + '</span></div>'
    + '<button class="cmp-toggle" onclick="toggleCmpCard(\'' + m.id + '\')">'
    +   '<span class="cmp-toggle-label"></span><i class="ti ti-chevron-down cmp-chev"></i>'
    + '</button>'
    + '<div class="cmp-detail-wrap"><div class="cmp-detail">' + detailHtml + '</div></div>'
    + '</div>';
}

// ─── Render: Admin Matches ───────────────────────────────────────────────────
function renderAdminMatches() {
  const container = document.getElementById('admin-matches-list');
  if (state.matches.length === 0) {
    container.innerHTML = '<p style="font-size:13px;color:var(--text-secondary)">No hay partidos aún.</p>';
    return;
  }

  const adminSel = document.getElementById('admin-date-filter');
  if (adminSel) {
    const currentVal = adminSel.value;
    const dates = [...new Set(
      state.matches.map(m => m.datetime ? matchDateGT(m.datetime) : null).filter(Boolean)
    )].sort();
    adminSel.innerHTML = '<option value="all">Todas las fechas</option>';
    dates.forEach(d => {
      const label = fmtDateLong(d + 'T12:00:00Z', { weekday: 'short', day: 'numeric', month: 'short' });
      const o = document.createElement('option');
      o.value = d; o.textContent = label;
      adminSel.appendChild(o);
    });
    if (currentVal) adminSel.value = currentVal;
  }

  const adminDateFilter = document.getElementById('admin-date-filter')?.value || 'all';
  let matches = adminDateFilter === 'all'
    ? state.matches
    : state.matches.filter(m => m.datetime && matchDateGT(m.datetime) === adminDateFilter);

  matches = [...matches].sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

  if (matches.length === 0) {
    container.innerHTML = '<p style="font-size:13px;color:var(--text-secondary)">No hay partidos para esta fecha.</p>';
    return;
  }

  container.innerHTML = matches.map(m => {
    const dtStr = fmtDateShort(m.datetime) + ' ' + fmtTime(m.datetime);
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
async function deleteMatch(matchId) { openDeleteModal(matchId); }

let _editMatchId = null;
function openEditModal(matchId) {
  const m = state.matches.find(x => x.id === matchId);
  if (!m) return;
  _editMatchId = matchId;
  document.getElementById('edit-home').value  = m.home;
  document.getElementById('edit-away').value  = m.away;
  // Show datetime in Guatemala local time for the input
  const _ed = new Date(m.datetime.endsWith('Z') ? m.datetime : m.datetime + 'Z');
  const _gtOff = -6 * 60, _brOff = _ed.getTimezoneOffset();
  const _edLocal = new Date(_ed.getTime() + (_gtOff - (-_brOff)) * 60000);
  document.getElementById('edit-date').value = _edLocal.toISOString().slice(0,16);
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
  const _editVal = document.getElementById('edit-date').value;
  if (_editVal) {
    const _gt = new Date(_editVal);
    const _bOff = _gt.getTimezoneOffset();
    const _utc = new Date(_gt.getTime() + (_bOff - 6*60) * 60000);
    m.datetime = _utc.toISOString().replace('.000Z','Z').slice(0,19) + 'Z';
  }
  m.phase    = document.getElementById('edit-phase').value        || m.phase;
  closeModal();
  await saveState();
  renderAdminMatches();
  renderMatches();
}

async function addMatch() {
  const home = document.getElementById('m-home').value.trim();
  const away = document.getElementById('m-away').value.trim();
  const _rawDate = document.getElementById('m-date').value;
  let datetime = _rawDate;
  if (_rawDate) {
    const _d = new Date(_rawDate);
    const _utc2 = new Date(_d.getTime() + (_d.getTimezoneOffset() - 6*60) * 60000);
    datetime = _utc2.toISOString().replace('.000Z','Z').slice(0,19) + 'Z';
  }
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

// ─── Sincronización completa desde openfootball ──────────────────────────────
async function syncAll() {
  const btn = document.getElementById('btn-sync-all');
  const steps = ['Conectando...','Importando partidos...','Corrigiendo horarios y fases...','Limpiando duplicados...','Guardando...'];
  let si = 0;
  const tick = () => { if (btn) btn.textContent = steps[Math.min(si++, steps.length-1)]; };
  tick(); if (btn) btn.disabled = true;

  try {
    tick();
    const res = await fetch('https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json');
    if (!res.ok) throw new Error('No se pudo conectar con openfootball');
    const data = await res.json();
    const ofMatches = data.matches || [];

    const pad = n => String(n).padStart(2,'0');

    // Convierte "19:00 UTC-6" en fecha "2026-06-29" → ISO UTC correcto usando Date.UTC
    function toUTC(dateStr, timeAndTz) {
      const parts = (timeAndTz || '12:00 UTC-6').split(' ');
      const timeStr = parts[0], tzStr = parts[1] || 'UTC-6';
      const [h, min] = timeStr.split(':').map(Number);
      const [yyyy, mm, dd] = dateStr.split('-').map(Number);
      const tzMatch = tzStr.match(/UTC([+-]\d+)/);
      const tzOffset = tzMatch ? parseInt(tzMatch[1]) : -6;
      const utcMs = Date.UTC(yyyy, mm - 1, dd, h, min, 0) - tzOffset * 3600000;
      const u = new Date(utcMs);
      return u.getUTCFullYear() + '-' + pad(u.getUTCMonth()+1) + '-' + pad(u.getUTCDate())
        + 'T' + pad(u.getUTCHours()) + ':' + pad(u.getUTCMinutes()) + ':00Z';
    }

    function roundToPhase(round, group) {
      const r = (round || '').toLowerCase();
      if (r.includes('third') || r.includes('tercer'))  return 'Tercer lugar';
      if (r.includes('quarter'))                         return 'Cuartos de final';
      if (r.includes('semi'))                            return 'Semifinal';
      if (r.includes('round of 32'))                     return 'Dieciseisavos de final';
      if (r.includes('round of 16'))                     return 'Octavos de final';
      if (r === 'final')                                 return 'Final';
      if (group)                                         return 'Fase de grupos - ' + group;
      return 'Fase de grupos';
    }

    function isPlaceholder(name) {
      if (!name) return true;
      if (/^[WL]\d+$/.test(name)) return true;
      if (/^\d+[A-Z](\/[A-Z])*$/.test(name)) return true;
      if (/^\d[A-Z](\/[A-Z\/]+)?$/.test(name)) return true;
      return false;
    }

    // PASO 1: Importar nuevos y corregir existentes
    tick();
    let added = 0, timeFixed = 0, phaseFixed = 0, resultsFixed = 0;

    ofMatches.forEach(of => {
      const home = of.team1, away = of.team2;
      if (!home || !away || isPlaceholder(home) || isPlaceholder(away)) return;

      const datetime = toUTC(of.date, of.time);
      const phase    = roundToPhase(of.round, of.group);
      const result   = of.score?.ft
        ? { home: String(of.score.ft[0]), away: String(of.score.ft[1]) }
        : null;
      const goals1 = (of.goals1 || []).map(g => ({ name: g.name, minute: g.minute }));
      const goals2 = (of.goals2 || []).map(g => ({ name: g.name, minute: g.minute }));

      const existing = state.matches.find(m => m.home === home && m.away === away);

      if (existing) {
        if (existing.datetime !== datetime) { existing.datetime = datetime; timeFixed++; }
        if (existing.phase !== phase)       { existing.phase = phase;       phaseFixed++; }
        if (result && (existing.result?.home !== result.home || existing.result?.away !== result.away)) {
          existing.result = result; resultsFixed++;
        }
        if (result) { existing.goals1 = goals1; existing.goals2 = goals2; }
      } else {
        state.matches.push({
          id: 'm' + Date.now() + Math.random().toString(36).slice(2,6),
          home, away, datetime, phase,
          result: result || { home: '', away: '' }
        });
        added++;
      }
    });

    // PASO 2: Eliminar placeholders y duplicados exactos
    tick();
    const beforeCount = state.matches.length;
    state.matches = state.matches.filter(m => !isPlaceholder(m.home) && !isPlaceholder(m.away));
    const seen = new Set();
    state.matches = state.matches.filter(m => {
      const k = m.home + '|' + m.away;
      if (seen.has(k)) return false;
      seen.add(k); return true;
    });
    const removed = beforeCount - state.matches.length;

    // PASO 3: Guardar y refrescar
    tick();
    await saveState();
    renderAdminMatches(); renderTabla(); renderStats(); renderMatches(); renderBracket();

    const parts = [];
    if (added > 0)        parts.push(added + ' nuevos');
    if (timeFixed > 0)    parts.push(timeFixed + ' horarios corregidos');
    if (phaseFixed > 0)   parts.push(phaseFixed + ' fases corregidas');
    if (resultsFixed > 0) parts.push(resultsFixed + ' resultados actualizados');
    if (removed > 0)      parts.push(removed + ' eliminados');

    if (btn) {
      btn.textContent = parts.length ? '✓ ' + parts.join(' · ') : '✓ Todo al día';
      setTimeout(() => { btn.textContent = '🔄 Sincronizar'; btn.disabled = false; }, 4000);
    }
  } catch(e) {
    if (btn) { btn.textContent = '✗ Error: ' + e.message; btn.disabled = false; }
    console.error(e);
  }
}

// Alias para compatibilidad
async function importFixtures() { return syncAll(); }

// ─── Verificar horarios contra openfootball ──────────────────────────────────
async function verifySchedule() {
  const btn = document.getElementById('btn-verify-schedule');
  const out = document.getElementById('verify-schedule-output');
  btn.disabled = true;
  btn.textContent = 'Verificando...';
  out.innerHTML = '';

  try {
    const res = await fetch('https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json');
    if (!res.ok) throw new Error('No se pudo conectar con openfootball');
    const data = await res.json();
    const matches = data.matches || [];

    const pad = n => String(n).padStart(2, '0');
    const sourceMap = {};
    matches.forEach(m => {
      if (!m.team1 || !m.team2) return;
      const timeParts = (m.time || '12:00 UTC-6').split(' ');
      const timeStr = timeParts[0];
      const tzStr   = timeParts[1] || 'UTC-6';
      const tzMatch = tzStr.match(/UTC([+-]\d+)/);
      const tzOffset = tzMatch ? parseInt(tzMatch[1]) : -6;
      const [th, tm] = timeStr.split(':').map(Number);
      const [dy, dmo, dd] = m.date.split('-').map(Number);
      const utcMs = Date.UTC(dy, dmo - 1, dd, th, tm, 0) - tzOffset * 60 * 60 * 1000;
      const utcDate = new Date(utcMs);
      const utcISO = utcDate.getUTCFullYear() + '-'
        + pad(utcDate.getUTCMonth()+1) + '-'
        + pad(utcDate.getUTCDate()) + 'T'
        + pad(utcDate.getUTCHours()) + ':'
        + pad(utcDate.getUTCMinutes()) + ':00Z';
      sourceMap[m.team1 + '|' + m.team2] = { utcISO, rawTime: m.time, date: m.date };
    });

    let issues = [];
    let ok = 0;
    state.matches.forEach(m => {
      const key = m.home + '|' + m.away;
      const src = sourceMap[key];
      if (!src) return;
      const savedDate  = new Date(m.datetime);
      const sourceDate = new Date(src.utcISO);
      const diffMin = Math.abs((savedDate.getTime() - sourceDate.getTime()) / 60000);
      if (diffMin > 1) {
        const toGT = dt => {
          const d = new Date(new Date(dt).getTime() - 6*60*60*1000);
          return pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes());
        };
        issues.push({
          match: m,
          savedGT:   toGT(m.datetime),
          correctGT: toGT(src.utcISO),
          correctUTC: src.utcISO,
          diffMin
        });
      } else {
        ok++;
      }
    });

    if (issues.length === 0) {
      out.innerHTML = '<div style="color:var(--success-text);background:var(--success-bg);border-radius:var(--radius);padding:10px 14px;font-size:13px">'
        + '<i class="ti ti-circle-check"></i> ¡Todos los horarios están correctos! (' + ok + ' partidos verificados)</div>';
    } else {
      let html = '<div style="font-size:13px;margin-bottom:10px;color:var(--danger-text)">'
        + '<i class="ti ti-alert-triangle"></i> ' + issues.length + ' partido(s) con horario incorrecto:</div>';
      issues.forEach(issue => {
        html += '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 10px;background:var(--bg-secondary);border-radius:var(--radius);margin-bottom:6px;font-size:13px">'
          + '<span style="font-weight:600;flex:1;min-width:140px">' + issue.match.home + ' vs ' + issue.match.away + '</span>'
          + '<span style="color:var(--danger-text)">Guardado: ' + issue.savedGT + ' GT</span>'
          + '<span style="color:var(--text-secondary)">→</span>'
          + '<span style="color:var(--success-text)">Correcto: ' + issue.correctGT + ' GT</span>'
          + '<button class="btn btn-sm btn-primary" style="font-size:11px;padding:3px 8px" '
          + 'onclick="fixOneSchedule(\'' + issue.match.id + '\',\'' + issue.correctUTC + '\',this)">'
          + '<i class="ti ti-check"></i> Corregir</button>'
          + '</div>';
      });
      out.innerHTML = html;
    }
  } catch(e) {
    out.innerHTML = '<div style="color:var(--danger-text);font-size:13px"><i class="ti ti-alert-circle"></i> Error: ' + e.message + '</div>';
  }
  btn.disabled = false;
  btn.textContent = 'Verificar horarios';
}

async function fixOneSchedule(matchId, correctUTC, btn) {
  const m = state.matches.find(x => x.id === matchId);
  if (!m) return;
  m.datetime = correctUTC;
  btn.disabled = true;
  btn.textContent = '✓ Corregido';
  btn.style.background = 'var(--success-bg)';
  btn.style.color = 'var(--success-text)';
  await saveState();
  renderMatches();
}

// ─── Corrección masiva de horarios ───────────────────────────────────────────
function openFixTimesModal() {
  const fromHour = document.getElementById('fix-from-hour').value.padStart(2,'0') + ':00';
  const toHour   = document.getElementById('fix-to-hour').value.padStart(2,'0')   + ':00';
  const affected = state.matches.filter(m => m.datetime && m.datetime.includes('T' + fromHour + ':'));
  document.getElementById('fix-times-preview').textContent =
    affected.length > 0
      ? `Se cambiarán ${affected.length} partido(s) de ${fromHour} → ${toHour}`
      : `No hay partidos con hora ${fromHour}`;
  document.getElementById('modal-fixtimes-overlay').classList.remove('hidden');
}
function closeFixTimesModal() {
  document.getElementById('modal-fixtimes-overlay').classList.add('hidden');
}
async function confirmFixTimes() {
  const fromHour = document.getElementById('fix-from-hour').value.padStart(2,'0') + ':00';
  const toHour   = document.getElementById('fix-to-hour').value.padStart(2,'0')   + ':00';
  let changed = 0;
  state.matches.forEach(m => {
    if (m.datetime && m.datetime.includes('T' + fromHour + ':')) {
      m.datetime = m.datetime.replace('T' + fromHour + ':', 'T' + toHour + ':');
      changed++;
    }
  });
  closeFixTimesModal();
  await saveState();
  showToast(`✅ ${changed} partido(s) corregidos`);
  renderMatches();
  renderAdminMatches();
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
loadApiConfigForm();
updateApiConfigStatus();

initFirebase().catch(err => {
  console.error('Firebase error:', err);
  document.body.innerHTML = `<div style="padding:2rem;font-family:sans-serif;color:#a32d2d">
    <h2>Error de configuración</h2>
    <p>Asegúrate de haber reemplazado los valores de Firebase en <code>app.js</code>.</p>
  </div>`;
});
// ─── Bracket Mundial 2026 ────────────────────────────────────────────────────
const BRACKET_STRUCTURE = {
  r32: [
    { home: 'South Africa', away: 'Canada' },   // 0=M73
    { home: 'Germany',      away: 'Paraguay' },  // 1=M74  ↘ R16[0]
    { home: 'Netherlands',  away: 'Morocco' },   // 2=M75
    { home: 'Brazil',       away: 'Japan' },     // 3=M76  ↘ R16[2]
    { home: 'France',       away: 'Sweden' },    // 4=M77  ↘ R16[0]
    { home: 'Ivory Coast',  away: 'Norway' },    // 5=M78
    { home: 'Mexico',       away: 'Ecuador' },   // 6=M79  ↘ R16[3]
    { home: 'England',      away: 'DR Congo' },  // 7=M80
    { home: 'USA',          away: 'Bosnia & Herzegovina' }, // 8=M81
    { home: 'Belgium',      away: 'Senegal' },              // 9=M82
    { home: 'Portugal',     away: 'Croatia' },              // 10=M83
    { home: 'Spain',        away: 'Austria' },              // 11=M84
    { home: 'Switzerland',  away: 'Algeria' },              // 12=M85
    { home: 'Argentina',    away: 'Cape Verde' },           // 13=M86
    { home: 'Colombia',     away: 'Ghana' },                // 14=M87
    { home: 'Australia',    away: 'Egypt' },                // 15=M88
  ],
  // R16: W74vsW77, W73vsW75, W76vsW78, W79vsW80, W83vsW84, W81vsW82, W86vsW88, W85vsW87
  r16Pairs: [
    [1, 4],   // R16[0]: W74 vs W77
    [0, 2],   // R16[1]: W73 vs W75
    [3, 5],   // R16[2]: W76 vs W78
    [6, 7],   // R16[3]: W79 vs W80
    [10,11],  // R16[4]: W83 vs W84
    [8, 9],   // R16[5]: W81 vs W82
    [13,15],  // R16[6]: W86 vs W88
    [12,14],  // R16[7]: W85 vs W87
  ],
  // QF: W89vsW90=R16[0]vsR16[1], W91vsW92=R16[2]vsR16[3], W93vsW94=R16[4]vsR16[5], W95vsW96=R16[6]vsR16[7]
  qfPairs:  [[0,1],[2,3],[4,5],[6,7]],
  // SF: W97vsW98=QF[0]vsQF[1], W99vsW100=QF[2]vsQF[3]
  sfPairs:  [[0,1],[2,3]],
};

function getWinnerOf(home, away) {
  if (!home || !away) return null;
  const m = state.matches.find(sm =>
    (sm.home === home && sm.away === away) ||
    (sm.home === away && sm.away === home)
  );
  if (!m) return null;
  const rh = m.result?.home, ra = m.result?.away;
  if (rh === '' || rh == null || ra === '' || ra == null) return null;
  const nh = parseInt(rh), na = parseInt(ra);
  if (isNaN(nh) || isNaN(na)) return null;
  if (nh > na) return m.home;
  if (na > nh) return m.away;
  // Empate en tiempo reglamentario: desempate por penales
  const pw = penWinner(m.result);
  if (!pw) return null; // aún sin resultado de penales
  return pw === 'H' ? m.home : m.away;
}

function resolveBracket() {
  const r32 = BRACKET_STRUCTURE.r32;
  const w32 = r32.map(m => getWinnerOf(m.home, m.away));
  const w16 = BRACKET_STRUCTURE.r16Pairs.map(([a,b]) => {
    const ha = w32[a], hb = w32[b];
    return (ha && hb) ? getWinnerOf(ha, hb) : null;
  });
  const wQF = BRACKET_STRUCTURE.qfPairs.map(([a,b]) => {
    const ha = w16[a], hb = w16[b];
    return (ha && hb) ? getWinnerOf(ha, hb) : null;
  });
  const wSF = BRACKET_STRUCTURE.sfPairs.map(([a,b]) => {
    const ha = wQF[a], hb = wQF[b];
    return (ha && hb) ? getWinnerOf(ha, hb) : null;
  });
  // SF losers → 3rd place
  const sfLosers = BRACKET_STRUCTURE.sfPairs.map(([a,b]) => {
    const ha = wQF[a], hb = wQF[b];
    if (!ha || !hb) return null;
    const w = getWinnerOf(ha, hb);
    return w ? (w === ha ? hb : ha) : null;
  });
  const champion = (wSF[0] && wSF[1]) ? getWinnerOf(wSF[0], wSF[1]) : null;
  return { w32, w16, wQF, wSF, sfLosers, champion };
}

// ── Flag-only compact bracket ──
function brFlag(team, isWinner, size) {
  const c = team ? TEAM_FLAGS[team] : null;
  // flagcdn.com only supports specific widths: 20, 40, 80, 160, 320...
  if (c) {
    return `<img src="https://flagcdn.com/w40/${c}.png" alt="${team}" title="${team}" loading="lazy"
      class="brf${isWinner ? ' brf-win' : ''}">`;
  }
  return `<span class="brf brf-tbd"><i class="ti ti-star-filled"></i></span>`;
}

function brMatch(homeTeam, awayTeam, winner, isVertical) {
  const hW = winner && winner === homeTeam;
  const aW = winner && winner === awayTeam;
  return `<div class="brm${isVertical ? ' brm-v' : ''}">
    <div class="brm-team${hW ? ' brm-w' : ''}">${brFlag(homeTeam, hW, 28)}</div>
    <div class="brm-team${aW ? ' brm-w' : ''}">${brFlag(awayTeam, aW, 28)}</div>
  </div>`;
}

function renderBracket() {
  const el = document.getElementById('tab-bracket');
  if (!el || el.classList.contains('hidden')) return;

  const { w32, w16, wQF, wSF, sfLosers, champion } = resolveBracket();
  const r32 = BRACKET_STRUCTURE.r32;
  const r16p = BRACKET_STRUCTURE.r16Pairs;
  const qfp  = BRACKET_STRUCTURE.qfPairs;
  const sfp  = BRACKET_STRUCTURE.sfPairs;

  // Build team pairs for each round
  const r16t = r16p.map(([a,b]) => ({ home: w32[a], away: w32[b] }));
  const qft  = qfp.map(([a,b])  => ({ home: w16[a], away: w16[b] }));
  const sft  = sfp.map(([a,b])  => ({ home: wQF[a], away: wQF[b] }));

  // Left side: indices 0-3 from each round
  // Layout: 8 r32 → 4 r16 → 2 qf → 1 sf → center
  function col(items) {
    return `<div class="brcol">${items.join('')}</div>`;
  }
  function spacer() { return '<div class="brspc"></div>'; }

  // Champion flag
  const champC = champion ? TEAM_FLAGS[champion] : null;
  const champFlag = champC
    ? `<img src="https://flagcdn.com/w80/${champC}.png" alt="${champion}" title="${champion}" class="br-champ-flag">`
    : `<span class="br-champ-tbd"><i class="ti ti-trophy"></i></span>`;

  // 3rd place
  const tp1 = sfLosers[0], tp2 = sfLosers[1];
  const tpW = (tp1 && tp2) ? getWinnerOf(tp1, tp2) : null;

  // Build columns — left side (r32 idx 0-7, r16 idx 0-3, qf idx 0-1, sf idx 0)
  const leftR32 = [
    brMatch(r32[1].home, r32[1].away, w32[1]),
    brMatch(r32[4].home, r32[4].away, w32[4]),
    spacer(),
    brMatch(r32[0].home, r32[0].away, w32[0]),
    brMatch(r32[2].home, r32[2].away, w32[2]),
    spacer(),
    brMatch(r32[3].home, r32[3].away, w32[3]),
    brMatch(r32[5].home, r32[5].away, w32[5]),
    spacer(),
    brMatch(r32[6].home, r32[6].away, w32[6]),
    brMatch(r32[7].home, r32[7].away, w32[7]),
  ];
  const leftR16 = [
    brMatch(r16t[0].home, r16t[0].away, w16[0]),
    spacer(), spacer(),
    brMatch(r16t[1].home, r16t[1].away, w16[1]),
    spacer(), spacer(),
    brMatch(r16t[2].home, r16t[2].away, w16[2]),
    spacer(), spacer(),
    brMatch(r16t[3].home, r16t[3].away, w16[3]),
  ];
  const leftQF = [
    spacer(),
    brMatch(qft[0].home, qft[0].away, wQF[0]),
    spacer(), spacer(), spacer(),
    brMatch(qft[1].home, qft[1].away, wQF[1]),
    spacer(),
  ];
  const leftSF = [
    spacer(), spacer(),
    brMatch(sft[0].home, sft[0].away, wSF[0]),
    spacer(), spacer(),
  ];

  // Right side (mirrored)
  const rightR32 = [
    brMatch(r32[10].home, r32[10].away, w32[10]),
    brMatch(r32[11].home, r32[11].away, w32[11]),
    spacer(),
    brMatch(r32[8].home,  r32[8].away,  w32[8]),
    brMatch(r32[9].home,  r32[9].away,  w32[9]),
    spacer(),
    brMatch(r32[13].home, r32[13].away, w32[13]),
    brMatch(r32[15].home, r32[15].away, w32[15]),
    spacer(),
    brMatch(r32[12].home, r32[12].away, w32[12]),
    brMatch(r32[14].home, r32[14].away, w32[14]),
  ];
  const rightR16 = [
    brMatch(r16t[4].home, r16t[4].away, w16[4]),
    spacer(), spacer(),
    brMatch(r16t[5].home, r16t[5].away, w16[5]),
    spacer(), spacer(),
    brMatch(r16t[6].home, r16t[6].away, w16[6]),
    spacer(), spacer(),
    brMatch(r16t[7].home, r16t[7].away, w16[7]),
  ];
  const rightQF = [
    spacer(),
    brMatch(qft[2].home, qft[2].away, wQF[2]),
    spacer(), spacer(), spacer(),
    brMatch(qft[3].home, qft[3].away, wQF[3]),
    spacer(),
  ];
  const rightSF = [
    spacer(), spacer(),
    brMatch(sft[1].home, sft[1].away, wSF[1]),
    spacer(), spacer(),
  ];

  el.innerHTML = `
  <div class="brwrap">
    <div class="brtitle"><i class="ti ti-trophy"></i> Bracket Mundial 2026</div>
    <div class="brscroll">
      <div class="brgrid">
        <div class="brhdr">16avos</div>
        <div class="brhdr">8vos</div>
        <div class="brhdr">Cuartos</div>
        <div class="brhdr">Semi</div>
        <div class="brhdr"></div>
        <div class="brhdr">Semi</div>
        <div class="brhdr">Cuartos</div>
        <div class="brhdr">8vos</div>
        <div class="brhdr">16avos</div>

        ${col(leftR32)}
        ${col(leftR16)}
        ${col(leftQF)}
        ${col(leftSF)}

        <div class="brcenter">
          <div class="br-champion">
            ${champFlag}
            <div class="br-champ-label">🏆 Campeón</div>
            <div class="br-champ-name">${champion || '?'}</div>
          </div>
          <div class="br-third-wrap">
            <div class="br-third-label">🥉 3er lugar</div>
            <div class="br-third-flags">
              ${brFlag(tp1, tpW===tp1, 32)}
              <span class="br-third-vs">vs</span>
              ${brFlag(tp2, tpW===tp2, 32)}
            </div>
          </div>
        </div>

        ${col(rightSF)}
        ${col(rightQF)}
        ${col(rightR16)}
        ${col(rightR32)}
      </div>
    </div>
    <p class="br-note"><i class="ti ti-info-circle"></i> Se actualiza automáticamente con los resultados oficiales.</p>
  </div>`;
}
