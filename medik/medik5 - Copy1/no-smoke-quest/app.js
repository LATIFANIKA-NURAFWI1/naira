/*
  No Smoke Quest — app.js
  - Semua logika aplikasi: state, DOM, event, persistence localStorage, export/import.
  - Tidak ada dependency eksternal.
  - Fungsi utama yang disediakan:
    loadState(), saveState(), resetState(), calculatePointsForLog(log)
    initApp(), renderDashboard(), handleLogSubmit(), awardBadge(id), showConfetti()
  - Catatan QA manual (di akhir file, dalam komentar)
*/

(function () {
  'use strict';

  // ===== Const & Helpers =====
  const STORAGE_KEY = 'noSmokeQuestData';
  const DAY_MAX = 30;

  // Level definisi (inklusif)
  const LEVELS = [
    { id: 1, start: 1, end: 3, rewardPoints: 50, badge: null, name: 'Level 1 — Reduce' },
    { id: 2, start: 4, end: 7, rewardPoints: 100, badge: 'Smoke-Free Week', name: 'Level 2 — No Smoke' },
    { id: 3, start: 8, end: 14, rewardPoints: 200, badge: 'Replacement Master', name: 'Level 3 — Replacement' },
    { id: 4, start: 15, end: 21, rewardPoints: 300, badge: 'Community Supporter', name: 'Level 4 — Share' },
    { id: 5, start: 22, end: 30, rewardPoints: 500, badge: 'Champion', name: 'Level 5 — Champion' },
  ];

  // Badge definisi
  const BADGE_DEFS = {
    'First Step': 'Memulai dan melakukan log pertama.',
    'Smoke-Free Week': 'Melewati 7 hari (4-7) tanpa merokok.',
    'Replacement Master': 'Konsisten melakukan aktivitas pengganti (8-14).',
    'Community Supporter': 'Membagikan progres (15-21).',
    'Champion': 'Selesaikan tantangan 22-30 hari.',
    'Streak 3+': 'Mencapai streak bebas asap ≥ 3.',
    'Streak 7+': 'Mencapai streak bebas asap ≥ 7.',
    'Saver 100k+': 'Mengumpulkan tabungan ≥ Rp100.000.',
  };

  function storageAvailable() {
    try {
      const x = '__t__';
      localStorage.setItem(x, x);
      localStorage.removeItem(x);
      return true;
    } catch (e) {
      return false;
    }
  }

  function formatCurrency(n) {
    try {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
    } catch (e) {
      return 'Rp' + (n || 0).toLocaleString('id-ID');
    }
  }

  function pad2(n) { return String(n).padStart(2, '0'); }

  function toKey(d) {
    const y = d.getFullYear();
    const m = pad2(d.getMonth() + 1);
    const dy = pad2(d.getDate());
    return `${y}-${m}-${dy}`;
  }

  function parseKey(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function daysBetween(start, end) {
    const ms = 24 * 60 * 60 * 1000;
    const a = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const b = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    return Math.floor((b - a) / ms);
  }

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  function getLevelByDay(day) {
    return LEVELS.find(L => day >= L.start && day <= L.end) || LEVELS[LEVELS.length - 1];
  }

  function getLevelProgress(day) {
    const L = getLevelByDay(day);
    const span = L.end - L.start + 1;
    const progressed = clamp(day - L.start + 1, 0, span);
    const pct = Math.round((progressed / span) * 100);
    return { L, progressed, span, pct };
  }

  // ===== State =====
  let state = null;

  function defaultState() {
    return {
      startDate: null, // YYYY-MM-DD
      logs: {}, // key: YYYY-MM-DD -> log
      totalPoints: 0,
      badges: [],
      claimedLevels: [], // [levelId]
      settings: {
        cigarettePrice: 0,
        language: 'id',
        theme: 'light'
      }
    };
  }

  // ===== Persistence =====
  function loadState() {
    if (!storageAvailable()) {
      alert('Peringatan: localStorage tidak tersedia. Data tidak dapat disimpan.');
      state = defaultState();
      return state;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      state = raw ? JSON.parse(raw) : defaultState();
      state.logs = state.logs || {};
      state.badges = Array.isArray(state.badges) ? state.badges : [];
      state.claimedLevels = Array.isArray(state.claimedLevels) ? state.claimedLevels : [];
      state.settings = Object.assign({ cigarettePrice: 0, language: 'id', theme: 'light' }, state.settings || {});
      return state;
    } catch (e) {
      console.warn('loadState error', e);
      state = defaultState();
      return state;
    }
  }

  function saveState() {
    if (!storageAvailable()) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('saveState error', e);
    }
  }

  function resetState() {
    state = defaultState();
    saveState();
  }

  // ===== Points Calculation =====
  function calculatePointsForLog(log) {
    let pts = 0;
    if (log.smoked === false) pts += 20; // tidak merokok
    if (Array.isArray(log.replacementActions) && log.replacementActions.length > 0) pts += 10; // replacement
    const healthy = (log.replacementActions || []).some(v => v === 'exercise' || v === 'walk');
    if (healthy) pts += 15; // olahraga/aktivitas sehat
    if (log.shared === true) pts += 25; // share
    return pts;
  }

  // ===== DOM =====
  const el = {
    onboarding: document.getElementById('onboarding'),
    onboardingForm: document.getElementById('onboardingForm'),
    onbStartDate: document.getElementById('onbStartDate'),
    onbPrice: document.getElementById('onbPrice'),
    onbTheme: document.getElementById('onbTheme'),

    app: document.getElementById('app'),

    dayNow: document.getElementById('dayNow'),
    levelNow: document.getElementById('levelNow'),
    levelProgress: document.getElementById('levelProgress'),
    pointsTotal: document.getElementById('pointsTotal'),

    statsSmokeFree: document.getElementById('statsSmokeFree'),
    statsSavings: document.getElementById('statsSavings'),
    statsBestStreak: document.getElementById('statsBestStreak'),

    badgesList: document.getElementById('badgesList'),

    btnLogToday: document.getElementById('btnLogToday'),
    btnOpenLog: document.getElementById('btnOpenLog'),
    btnViewStats: document.getElementById('btnViewStats'),
    btnClaimSavings: document.getElementById('btnClaimSavings'),

    btnExport: document.getElementById('btnExport'),
    inputImport: document.getElementById('inputImport'),
    btnReset: document.getElementById('btnReset'),
    btnShare: document.getElementById('btnShare'),

    logSection: document.getElementById('logSection'),
    logForm: document.getElementById('logForm'),
    mood: document.getElementById('mood'),
    cigs: document.getElementById('cigs'),
    shareToday: document.getElementById('shareToday'),

    statsSection: document.getElementById('statsSection'),
    statsSummary: document.getElementById('statsSummary'),

    toast: document.getElementById('toast'),

    completeModal: document.getElementById('completeModal'),
    compPoints: document.getElementById('compPoints'),
    compSavings: document.getElementById('compSavings'),
    btnCertificate: document.getElementById('btnCertificate'),
  };

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
  }

  // ===== Init =====
  function initApp() {
    loadState();
    setTheme(state.settings.theme || 'light');

    if (!state.startDate) {
      // Show onboarding
      el.onboarding.classList.add('show');
      document.body.classList.add('modal-open');
      el.app.classList.add('hidden');
      // Prefill defaults
      const todayKey = toKey(new Date());
      el.onbStartDate.value = todayKey;
      el.onbPrice.value = state.settings.cigarettePrice || '';
      el.onbTheme.value = state.settings.theme || 'light';
    } else {
      el.onboarding.classList.remove('show');
      document.body.classList.remove('modal-open');
      el.app.classList.remove('hidden');
      renderDashboard();
    }

    // Events
    bindEvents();
  }

  function bindEvents() {
    // Onboarding submit
    el.onboardingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const startDate = el.onbStartDate.value;
      const price = Number(el.onbPrice.value || 0);
      const theme = el.onbTheme.value || 'light';
      if (!startDate) return alert('Mohon isi tanggal mulai.');
      state.startDate = startDate;
      state.settings.cigarettePrice = price > 0 ? price : 0;
      state.settings.theme = theme;
      saveState();
      setTheme(theme);
      el.onboarding.classList.remove('show');
      document.body.classList.remove('modal-open');
      el.app.classList.remove('hidden');
      showToast('Onboarding selesai. Semangat memulai perjalanan bebas asap!');
      renderDashboard();
    });

    // Open Log
    const openLog = () => {
      el.logSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const first = el.logForm.querySelector('input, select, textarea, button');
      if (first) first.focus();
    };
    el.btnLogToday.addEventListener('click', openLog);
    el.btnOpenLog.addEventListener('click', openLog);

    // View Stats
    el.btnViewStats.addEventListener('click', () => {
      renderStats();
      el.statsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Claim Savings
    el.btnClaimSavings.addEventListener('click', () => {
      showToast('Simulasi: Tabungan digunakan. Tetap semangat!');
    });

    // Export
    el.btnExport.addEventListener('click', exportData);

    // Import
    el.inputImport.addEventListener('change', importData);

    // Reset
    el.btnReset.addEventListener('click', () => {
      const ok = confirm('Apakah Anda yakin ingin mereset progress? Tindakan ini tidak dapat dibatalkan.');
      if (!ok) return;
      resetState();
      // Show onboarding lagi
      el.onboarding.classList.add('show');
      el.app.classList.add('hidden');
      const todayKey = toKey(new Date());
      el.onbStartDate.value = todayKey;
      el.onbPrice.value = '';
      el.onbTheme.value = 'light';
      setTheme('light');
      showToast('Progress berhasil direset.');
    });

    // Share
    el.btnShare.addEventListener('click', shareProgress);

    // Completion modal close
    document.addEventListener('click', (evt) => {
      const target = evt.target;
      if (target && target.hasAttribute && target.hasAttribute('data-close-complete')) {
        el.completeModal.classList.remove('show');
        document.body.classList.remove('modal-open');
      }
    });

    // Log form submit
    el.logForm.addEventListener('submit', handleLogSubmit);
  }

  // ===== Rendering =====
  function currentDayNumber() {
    if (!state.startDate) return 1;
    const start = parseKey(state.startDate);
    const now = new Date();
    const diff = daysBetween(start, now) + 1; // day 1 = startDate
    return clamp(diff, 1, DAY_MAX);
  }

  function computeStatsObj() {
    let smokeFreeDays = 0;
    let bestStreak = 0;
    let streak = 0;
    let savings = 0;
    const keys = Object.keys(state.logs).sort();
    for (const k of keys) {
      const log = state.logs[k];
      savings += Number(log.savingsAdded || 0);
      if (log.smoked === false) {
        smokeFreeDays += 1;
        streak += 1;
        if (streak > bestStreak) bestStreak = streak;
      } else {
        streak = 0;
      }
    }
    return { smokeFreeDays, bestStreak, savings };
  }

  function renderDashboard() {
    const day = currentDayNumber();
    const { L, pct } = getLevelProgress(day);

    el.dayNow.textContent = String(day);
    el.levelNow.textContent = `${L.name}`;
    el.levelProgress.style.width = pct + '%';
    el.levelProgress.setAttribute('aria-valuenow', String(pct));
    el.pointsTotal.textContent = String(state.totalPoints || 0);

    const stats = computeStatsObj();
    el.statsSmokeFree.textContent = String(stats.smokeFreeDays);
    el.statsSavings.textContent = formatCurrency(stats.savings);
    el.statsBestStreak.textContent = String(stats.bestStreak);

    renderBadges();
  }

  function renderBadges() {
    const wrap = el.badgesList;
    wrap.innerHTML = '';
    const frag = document.createDocumentFragment();
    (state.badges || []).forEach((id) => {
      const div = document.createElement('div');
      div.className = 'badge';
      div.title = BADGE_DEFS[id] || id;
      div.innerHTML = `<span class="dot"></span><span>${id}</span>`;
      frag.appendChild(div);
    });
    wrap.appendChild(frag);
  }

  function renderStats() {
    const stats = computeStatsObj();
    const day = currentDayNumber();
    const text = `Hari ke-${day}/30 — Bebas asap: ${stats.smokeFreeDays} hari, Streak terbaik: ${stats.bestStreak} hari, Tabungan: ${formatCurrency(stats.savings)}, Total Poin: ${state.totalPoints}`;
    el.statsSummary.textContent = text;
  }

  // ===== Actions =====
  function handleLogSubmit(e) {
    e.preventDefault();
    if (!state.startDate) return alert('Mulai onboarding terlebih dahulu.');

    const today = new Date();
    const key = toKey(today);
    const day = currentDayNumber();

    // Read form values
    const smoked = (el.logForm.querySelector('input[name="smoked"][value="no"]')?.checked) ? false : true;
    const cigsVal = Number(el.cigs.value || 0);
    const mood = el.mood.value || 'Neutral';
    const shared = !!el.shareToday.checked;
    const replacements = Array.from(el.logForm.querySelectorAll('.checks input[type="checkbox"]:checked')).map(i => i.value);
    const notesEl = document.getElementById('notes');
    const notes = (notesEl && notesEl.value) ? String(notesEl.value).slice(0, 500) : '';

    const log = {
      day,
      smoked,
      cigarettes: smoked ? cigsVal : 0,
      mood,
      replacementActions: replacements,
      shared,
      notes,
      pointsEarned: 0,
      savingsAdded: 0
    };

    // Calculate points & savings
    const basePoints = calculatePointsForLog(log);
    log.pointsEarned = basePoints;

    if (smoked === false) {
      const price = Number(state.settings.cigarettePrice || 0);
      const baseline = Number(cigsVal || 0);
      if (price > 0 && baseline > 0) {
        log.savingsAdded = price * baseline;
      } else {
        log.savingsAdded = 0; // jika pengguna tidak isi jumlah, tabungan 0 hari itu
      }
    }

    // Persist log for today
    state.logs[key] = log;

    // Add daily points
    state.totalPoints = Number(state.totalPoints || 0) + log.pointsEarned;

    // Award badges & level rewards
    applyLevelRewardsIfNeeded(day);
    applyDynamicBadges();

    saveState();
    renderDashboard();
    showToast('Log harian disimpan.');

    // Share if checked
    if (shared) shareProgress();

    // Completion at Day 30
    if (day >= 30) showCompletionModal();
  }

  function applyLevelRewardsIfNeeded(day) {
    const L = getLevelByDay(day);
    if (day !== L.end) return; // reward saat selesai level
    if (state.claimedLevels.includes(L.id)) return;

    // Validasi khusus level
    let eligible = true;
    if (L.id === 2) {
      // Days 4-7 semuanya tidak merokok
      eligible = rangeOK(4, 7, (d) => getLogByDay(d)?.smoked === false);
    } else if (L.id === 3) {
      // Days 8-14 melakukan replacement minimal 1 hari
      eligible = rangeOK(8, 14, (d) => (getLogByDay(d)?.replacementActions || []).length > 0);
    } else if (L.id === 4) {
      // Days 15-21 share minimal 1 hari
      eligible = rangeOK(15, 21, (d) => getLogByDay(d)?.shared === true);
    }
    // Level 1 & 5: tanpa syarat tambahan berat

    if (eligible) {
      state.totalPoints += L.rewardPoints;
      if (L.badge) awardBadge(L.badge);
      state.claimedLevels.push(L.id);
      showToast(`Bonus ${L.rewardPoints} poin — ${L.name}`);
      showConfetti(60);
    }
  }

  function getLogByDay(day) {
    if (!state.startDate) return null;
    const start = parseKey(state.startDate);
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    d.setDate(d.getDate() + (day - 1));
    return state.logs[toKey(d)] || null;
  }

  function rangeOK(startDay, endDay, predicate) {
    for (let d = startDay; d <= endDay; d++) {
      const ok = predicate(d);
      if (!ok) return false;
    }
    return true;
  }

  function ensureBadge(id) {
    if (!state.badges.includes(id)) {
      state.badges.push(id);
      showToast(`Badge didapat: ${id}`);
      showConfetti(36);
    }
  }

  function awardBadge(id) {
    ensureBadge(id);
    saveState();
    renderBadges();
  }

  function applyDynamicBadges() {
    const stats = computeStatsObj();
    if (Object.keys(state.logs).length >= 1) ensureBadge('First Step');
    if (stats.bestStreak >= 3) ensureBadge('Streak 3+');
    if (stats.bestStreak >= 7) ensureBadge('Streak 7+');
    if (stats.savings >= 100000) ensureBadge('Saver 100k+');
  }

  function showCompletionModal() {
    const stats = computeStatsObj();
    el.compPoints.textContent = String(state.totalPoints || 0);
    el.compSavings.textContent = formatCurrency(stats.savings);
    el.completeModal.classList.add('show');
    document.body.classList.add('modal-open');
  }

  // ===== Share / Export / Import =====
  function shareProgress() {
    const day = currentDayNumber();
    const stats = computeStatsObj();
    const text = `No Smoke Quest — Day ${day}/30 — ${state.totalPoints} poin — ${stats.smokeFreeDays} hari bebas asap. Bergabunglah!`;
    if (navigator.share) {
      navigator.share({ title: 'No Smoke Quest', text, url: location.href }).catch(() => {});
      showToast('Membuka dialog bagikan...');
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => showToast('Teks progres disalin ke clipboard.'));
    } else {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); showToast('Teks progres disalin.'); } catch {}
      ta.remove();
    }
  }

  function exportData() {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    const ts = toKey(new Date()).replaceAll('-', '');
    a.download = `no-smoke-quest-${ts}.json`;
    a.href = URL.createObjectURL(blob);
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  function importData(evt) {
    const file = evt.target.files && evt.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const obj = JSON.parse(String(reader.result));
        // Validasi minimal struktur
        if (!obj || typeof obj !== 'object') throw new Error('Struktur tidak valid.');
        if (!obj.settings || !('cigarettePrice' in obj.settings)) throw new Error('Settings tidak lengkap.');
        if (!obj.logs || typeof obj.logs !== 'object') throw new Error('Logs tidak valid.');
        // Terapkan
        state = Object.assign(defaultState(), obj);
        state.badges = Array.isArray(state.badges) ? state.badges : [];
        state.claimedLevels = Array.isArray(state.claimedLevels) ? state.claimedLevels : [];
        saveState();
        setTheme(state.settings.theme || 'light');
        renderDashboard();
        showToast('Import berhasil.');
      } catch (e) {
        console.error(e);
        alert('Gagal import: file JSON tidak valid.');
      } finally {
        evt.target.value = '';
      }
    };
    reader.onerror = () => alert('Gagal membaca berkas.');
    reader.readAsText(file);
  }

  // ===== UI Utils =====
  function showToast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.add('show');
    setTimeout(() => el.toast.classList.remove('show'), 2200);
  }

  function showConfetti(count = 40) {
    const layer = document.createElement('div');
    layer.className = 'confetti';
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'piece';
      p.style.setProperty('--i', String(Math.random().toFixed(2)));
      p.style.setProperty('--x', `${Math.round((Math.random() - 0.5) * 120)}px`);
      p.style.setProperty('--r', `${Math.round((Math.random() - 0.5) * 180)}deg`);
      p.style.left = `${Math.round(Math.random() * 100)}vw`;
      layer.appendChild(p);
    }
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), 3500);
  }

  // Certificate
  if (document.getElementById('btnCertificate')) {
    document.getElementById('btnCertificate').addEventListener('click', () => {
      const stats = computeStatsObj();
      const cert = `<!doctype html><html><head><meta charset="utf-8"><title>No Smoke Quest Certificate</title>
        <style>
          :root { --ink: #0f172a; --acc: #4BA3C3; --bg: #ffffff; }
          body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial; color: var(--ink); background: var(--bg); padding: 2rem; }
          .card { width: min(900px, 92vw); margin: 0 auto; border: 2px solid var(--acc); padding: 2rem; border-radius: 16px; }
          h1 { margin: 0; font-size: 2rem; color: var(--acc); }
          .muted { color: #475569; }
          .row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; }
          .box { border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; }
          .footer { margin-top: 1.25rem; font-size: .9rem; color: #475569; }
          @media print { button { display:none; } }
        </style>
      </head><body>
      <div class="card">
        <h1>Sertifikat Penyelesaian — No Smoke Quest</h1>
        <p class="muted">Menyelesaikan tantangan 30 hari bebas asap rokok.</p>
        <div class="row">
          <div class="box"><strong>Total Poin</strong><div>${state.totalPoints}</div></div>
          <div class="box"><strong>Total Tabungan</strong><div>${formatCurrency(stats.savings)}</div></div>
        </div>
        <div class="footer">Tanggal: ${toKey(new Date())}</div>
        <button onclick="print()">Cetak</button>
      </div>
      </body></html>`;
      const w = window.open('', '_blank');
      if (!w) return alert('Popup diblokir. Izinkan popup untuk mengunduh sertifikat.');
      w.document.write(cert);
      w.document.close();
    });
  }

  // ===== Start =====
  document.addEventListener('DOMContentLoaded', initApp);

  // ===== Expose (for debug/manual tests in console) =====
  window.NoSmokeQuest = {
    get state() { return state; },
    loadState, saveState, resetState, calculatePointsForLog,
    initApp, renderDashboard, awardBadge, showConfetti,
  };

  /*
    ===== Manual Test Cases =====
    1) StartDate = hari ini, isi log tanpa merokok 3 hari berturut-turut:
       - Poin harian: +20/hari minimal; Level 1 selesai (day 3) -> +50 poin. Level berubah sesuai hari.
    2) Export data -> Import data kembali:
       - State setelah import identik (totalPoints, logs, badges) dan UI ter-update.
    3) Atur harga rokok di onboarding (mis. 3000) -> log hari tanpa merokok dengan cigs=5:
       - Tabungan bertambah 15000 pada hari itu; total savings di Statistik bertambah.
    4) Navigasi keyboard:
       - Gunakan Tab untuk pindah antar input dan Enter untuk submit form; fokus terlihat jelas.
    5) Edge case import JSON rusak:
       - Import file malformed -> muncul alert error yang ramah.
  */
})();
