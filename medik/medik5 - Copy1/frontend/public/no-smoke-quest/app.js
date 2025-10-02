(function(){
  'use strict';

  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
  const store = {
    get(k, d){
      try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; }
    },
    set(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
  };

  const KEY = 'nsq_state_v1';
  function defaultState(){
    return {
      started: false,
      startDate: '',
      pricePerStick: 0,
      day: 0,
      totalPoints: 0,
      smokeFreeDays: 0,
      savings: 0,
      bestStreak: 0,
      streak: 0,
      badges: [],
      logs: []
    };
  }

  function save(state){ store.set(KEY, state); }
  function load(){ return store.get(KEY, defaultState()); }

  function toast(msg){
    const el = $('#toast'); if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(()=> el.classList.remove('show'), 1800);
  }

  function show(el){ if (el) el.classList.add('show'); }
  function hide(el){ if (el) el.classList.remove('show'); }

  function byId(id){ return document.getElementById(id); }

  function fmtIDR(n){ try { return Number(n).toLocaleString('id-ID'); } catch { return String(n); } }

  function computeLevel(points){
    // Simple: every 50 points is a new level, max level 6 in 30 days
    const level = Math.min(6, Math.floor(points / 50) + 1);
    const cur = points % 50;
    const pct = Math.min(100, Math.round(cur * 2));
    return { label: `Level ${level}`, pct };
  }

  function awardBadges(state){
    const out = new Set(state.badges);
    if (state.smokeFreeDays >= 1) out.add('Starter');
    if (state.smokeFreeDays >= 3) out.add('Streak 3');
    if (state.smokeFreeDays >= 7) out.add('Streak 7');
    if (state.smokeFreeDays >= 14) out.add('Streak 14');
    if (state.smokeFreeDays >= 30) out.add('Streak 30');
    if (state.savings >= 100000) out.add('Hemat 100k');
    state.badges = Array.from(out);
  }

  function render(state){
    const dNow = byId('dayNow'); if (dNow) dNow.textContent = Math.max(1, Math.min(30, state.day || 1));
    const pts = byId('pointsTotal'); if (pts) pts.textContent = state.totalPoints;
    const sf = byId('statsSmokeFree'); if (sf) sf.textContent = state.smokeFreeDays;
    const sv = byId('statsSavings'); if (sv) sv.textContent = fmtIDR(state.savings);
    const bs = byId('statsBestStreak'); if (bs) bs.textContent = state.bestStreak;

    const { label, pct } = computeLevel(state.totalPoints);
    const lv = byId('levelNow'); if (lv) lv.textContent = label;
    const lp = byId('levelProgress'); if (lp) { lp.style.width = pct + '%'; lp.setAttribute('aria-valuenow', String(pct)); }

    const badgesList = byId('badgesList');
    if (badgesList) {
      badgesList.innerHTML='';
      state.badges.forEach(b => {
        const el = document.createElement('span');
        el.className = 'badge';
        el.innerHTML = `<span class="dot" aria-hidden="true"></span>${b}`;
        badgesList.appendChild(el);
      });
    }

    // Completion modal
    if (state.day >= 30) {
      const comp = byId('completeModal');
      if (comp) {
        const p = byId('compPoints'); if (p) p.textContent = state.totalPoints;
        const s = byId('compSavings'); if (s) s.textContent = fmtIDR(state.savings);
        show(comp);
      }
    }

    const sum = byId('statsSummary');
    if (sum) {
      if (state.logs.length === 0) sum.textContent = 'Tidak ada data statistik yang tersedia.';
      else sum.textContent = `Total log: ${state.logs.length}. Hari tanpa rokok: ${state.smokeFreeDays}. Tabungan: Rp ${fmtIDR(state.savings)}.`;
    }
  }

  function addConfetti(){
    // lightweight confetti using CSS pieces
    const root = document.createElement('div');
    root.className = 'confetti';
    for (let i=0; i<60; i++){
      const d = document.createElement('div');
      d.className = 'piece';
      d.style.setProperty('--i', String(Math.random().toFixed(2)));
      d.style.setProperty('--x', (Math.random()*200-100).toFixed(0)+'px');
      d.style.setProperty('--r', (Math.random()*360).toFixed(0)+'deg');
      root.appendChild(d);
    }
    document.body.appendChild(root);
    setTimeout(()=> root.remove(), 3500);
  }

  function startFromOnboarding(e){
    e.preventDefault();
    const state = load();
    const startDate = byId('onbStartDate')?.value || '';
    const price = Number(byId('onbPrice')?.value || 0);
    const theme = byId('onbTheme')?.value || 'light';
    if (!startDate || !price) return;
    state.started = true;
    state.startDate = startDate;
    state.pricePerStick = price;
    save(state);
    document.documentElement.setAttribute('data-theme', theme);
    hide(byId('onboarding'));
    byId('app')?.classList.remove('hidden');
    render(state);
    toast('Selamat memulai tantangan!');
  }

  function logTodaySubmit(e){
    e.preventDefault();
    const state = load();
    if (!state.started){ show(byId('onboarding')); return; }

    const smoked = ($('input[name="smoked"]:checked')?.value || 'no') === 'yes';
    const cigs = Number(byId('cigs')?.value || 0);
    const notes = byId('notes')?.value?.trim() || '';
    const share = byId('shareToday')?.checked || false;

    const day = Math.min(30, state.day + 1);
    state.day = day;

    let points = 0;
    if (!smoked) {
      state.smokeFreeDays += 1;
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      points += 10;
      const saved = (cigs > 0 ? cigs : 10) * (state.pricePerStick || 0);
      state.savings += saved;
    } else {
      state.streak = 0;
      points += 2; // still gets minor points for logging
    }
    state.totalPoints += points;

    state.logs.push({
      day,
      smoked: smoked ? 'yes' : 'no',
      cigs,
      notes,
      at: new Date().toISOString()
    });

    awardBadges(state);
    save(state);
    render(state);

    if (share && navigator.share) {
      navigator.share({ title: 'No Smoke Quest', text: `Hari ${day}: ${smoked? 'belum berhasil' : 'berhasil tanpa rokok'} • Tabungan total Rp ${fmtIDR(state.savings)}` }).catch(()=>{});
    }

    toast('Log hari ini disimpan. Tetap semangat!');
    // Small celebration on milestones
    if (!smoked && [1,3,7,14,30].includes(state.smokeFreeDays)) addConfetti();
  }

  function exportData(){
    const data = JSON.stringify(load(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'no-smoke-quest.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importData(file){
    const r = new FileReader();
    r.onload = () => {
      try {
        const obj = JSON.parse(r.result);
        save({ ...defaultState(), ...obj });
        render(load());
        toast('Import berhasil');
      } catch {
        toast('Import gagal');
      }
    };
    r.readAsText(file);
  }

  function resetAll(){
    if (!confirm('Reset semua data challenge?')) return;
    save(defaultState());
    render(load());
    toast('Data direset');
  }

  function scrollToSection(id){
    const el = byId(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const state = load();
    if (!state.started) { show(byId('onboarding')); }
    else { byId('app')?.classList.remove('hidden'); }

    // Events
    byId('onboardingForm')?.addEventListener('submit', startFromOnboarding);
    byId('btnLogToday')?.addEventListener('click', () => scrollToSection('logSection'));
    byId('btnOpenLog')?.addEventListener('click', () => scrollToSection('logSection'));
    byId('btnViewStats')?.addEventListener('click', () => scrollToSection('statsSection'));
    byId('btnExport')?.addEventListener('click', exportData);
    byId('btnReset')?.addEventListener('click', resetAll);
    byId('btnShare')?.addEventListener('click', () => {
      const s = load();
      const text = `No Smoke Quest — Poin: ${s.totalPoints}, Hemat: Rp ${fmtIDR(s.savings)}`;
      if (navigator.share) navigator.share({ title: 'No Smoke Quest', text }).catch(()=>{});
      else {
        navigator.clipboard?.writeText(text).then(()=> toast('Teks dibagikan ke clipboard')); 
      }
    });
    byId('btnClaimSavings')?.addEventListener('click', () => toast('Ingat: gunakan tabungan untuk hal positif!'));
    byId('inputImport')?.addEventListener('change', (e) => {
      const f = e.target.files?.[0]; if (f) importData(f);
      e.target.value = '';
    });

    byId('logForm')?.addEventListener('submit', logTodaySubmit);

    // Close completion modal
    $$('[data-close-complete]').forEach(b => b.addEventListener('click', ()=> hide(byId('completeModal'))));

    render(state);
  });
})();
