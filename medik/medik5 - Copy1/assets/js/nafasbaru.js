// Utilities
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const store = {
  get(k, d){ try{ return JSON.parse(localStorage.getItem(k)) ?? d }catch{ return d } },
  set(k, v){ localStorage.setItem(k, JSON.stringify(v)) }
};

// Active nav by path
(function setActiveByPath(){
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('#navDesktop a, #mobileMenu a').forEach(a=>{
    const href = a.getAttribute('href');
    a.classList.toggle('active', href===path);
  });
})();

// Theme toggle
const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
const savedTheme = store.get('nb_theme', prefersDark ? 'dark' : 'light');
setTheme(savedTheme);
$('#darkToggle')?.addEventListener('click', ()=> setTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark'));
function setTheme(mode){
  document.documentElement.classList.toggle('dark', mode==='dark');
  document.documentElement.classList.toggle('light', mode!=='dark');
  document.body.classList.toggle('dark-mode', mode==='dark');
  $$('.theme-icon').forEach(el=>{ 
    const t=el.getAttribute('data-theme'); 
    const show=(t==='dark'&&mode==='dark')||(t==='light'&&mode!=='dark'); 
    el.classList.toggle('hidden', !show); 
  });
  store.set('nb_theme', mode);
}

// Mobile menu
(function(){ 
  const btn=$('#menuBtn'), panel=$('#mobileMenu'); 
  if(!btn||!panel) return; 
  btn.addEventListener('click', ()=>{ 
    const willOpen=panel.classList.contains('hidden'); 
    panel.classList.toggle('hidden'); 
    panel.classList.toggle('open', willOpen); 
    btn.setAttribute('aria-expanded', willOpen? 'true':'false'); 
  }); 
})();

$$('#mobileMenu a').forEach(a=> a.addEventListener('click', ()=>{ 
  const btn=$('#menuBtn'), panel=$('#mobileMenu'); 
  if(panel && !panel.classList.contains('hidden')){ 
    panel.classList.add('hidden'); 
    panel.classList.remove('open'); 
  } 
  if(btn) btn.setAttribute('aria-expanded','false'); 
}));

// Scroll reveal
const observer = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){ 
      e.target.classList.add('active'); 
      observer.unobserve(e.target); 
    }
  })
}, { threshold: 0.12 });
$$('.reveal').forEach(el=> observer.observe(el));

// Challenge
const DUR = [1,3,5,7,14,30];
let challenge = store.get('nb_challenge', { durationDays: 0, progressDays: 0, badges: [] });
let selected = challenge.durationDays || 7;

function renderDur(){ 
  const wrap = document.getElementById('durationWrap'); 
  if(!wrap) return; 
  wrap.innerHTML=''; 
  DUR.forEach(d=>{ 
    const btn=document.createElement('button'); 
    btn.className='px-4 py-2 rounded-xl border bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 '+(selected===d?'ring-2 ring-sky-400':''); 
    btn.textContent=d+' hari'; 
    btn.onclick=()=>{ selected=d; updateChallengeUI(); }; 
    wrap.appendChild(btn); 
  }); 
}

function start(){ 
  challenge={ durationDays:selected, progressDays:0, badges:[] }; 
  store.set('nb_challenge', challenge); 
  updateChallengeUI(); 
}

function progressCh(){ 
  if(!challenge.durationDays) return; 
  if(challenge.progressDays>=challenge.durationDays) return; 
  challenge.progressDays++; 
  if(challenge.progressDays%5===0) challenge.badges.push('milestone-'+challenge.progressDays); 
  store.set('nb_challenge', challenge); 
  updateChallengeUI(); 
}

function reset(){ 
  challenge={ durationDays:0, progressDays:0, badges:[] }; 
  store.set('nb_challenge', challenge); 
  selected=7; 
  updateChallengeUI(); 
}

function updateChallengeUI(){ 
  if(!document.getElementById('durText')) return; 
  document.getElementById('durText').textContent = challenge.durationDays? (challenge.durationDays+' hari') : selected+' (belum mulai)'; 
  document.getElementById('progText').textContent = challenge.durationDays? `${challenge.progressDays}/${challenge.durationDays} hari` : '0/0 hari'; 
  document.getElementById('badgeText').textContent = challenge.badges?.length? challenge.badges.join(', ') : '-'; 
  const pct = challenge.durationDays? Math.min(100, Math.round(challenge.progressDays*100/challenge.durationDays)) : 0; 
  document.getElementById('progFill').style.width = pct + '%'; 
}

// Money
let chart; 

function calcMoney(){
  const daily = Number($('#daily')?.value || 0);
  const price = Number($('#price')?.value || 0);
  const cppRaw = Number($('#cpp')?.value || 20);
  const cpp = cppRaw > 0 ? cppRaw : 20;
  const dateVal = $('#qdate')?.value;

  let days = 0, saved = 0;
  if (dateVal) {
    const diff = Date.now() - new Date(dateVal).getTime();
    days = Math.max(0, Math.floor(diff / 86400000));
    const packs = cpp ? (daily / cpp) : 0;
    saved = Math.round(days * packs * price);
  }

  if ($('#days')) $('#days').textContent = days;
  if ($('#saved')) $('#saved').textContent = saved.toLocaleString('id-ID');

  const labels = Array.from({ length: Math.min(30, Math.max(1, days || 7)) }, (_, i) => 'Hari ' + (i + 1));
  const perDay = cpp ? (daily / cpp) * price : 0;
  const data = labels.map((_, i) => Math.round(perDay * (i + 1)));
  const ctx = document.getElementById('moneyChart');
  if (ctx) {
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
      type: 'line',
      data: { 
        labels, 
        datasets: [{ 
          label: 'Hemat (IDR)', 
          data, 
          fill: true, 
          borderColor: '#4CAF50', 
          backgroundColor: 'rgba(76,175,80,.15)', 
          tension: .25 
        }] 
      },
      options: { 
        responsive: true, 
        plugins: { legend: { display: true } }, 
        scales: { 
          y: { 
            ticks: { 
              callback: v => v.toLocaleString('id-ID') 
            } 
          } 
        } 
      }
    });
  }

  store.set('nb_money', { daily, price, cpp, date: dateVal, qdate: dateVal });
}

function loadMoney(){
  const s = store.get('nb_money', null);
  if (!s) return;
  if ($('#daily')) $('#daily').value = s.daily || '';
  if ($('#price')) $('#price').value = s.price || '';
  if ($('#cpp')) $('#cpp').value = s.cpp || 20;
  const effectiveDate = s.date || s.qdate || '';
  if (!s.date && s.qdate) {
    store.set('nb_money', { ...s, date: s.qdate });
  }
  if (effectiveDate && $('#qdate')) $('#qdate').value = effectiveDate;
}

// Health Tracking
const IMPACTS = [ 
  { day:1, text:'Hari 1: Kadar CO dalam darah mulai menurun.' }, 
  { day:3, text:'Hari 3: Pernapasan terasa lebih lega.' }, 
  { day:14, text:'Hari 14: Sirkulasi darah mulai meningkat.' }, 
  { day:365, text:'1 Tahun: Risiko penyakit jantung menurun.' } 
];

function healthTarget(){ 
  const ch = store.get('nb_challenge', null); 
  return ch?.durationDays || 30; 
}

function calcDaysSinceQuit(){
  const m = store.get('nb_money', null);
  const dt = m?.date || m?.qdate;
  if (dt) {
    const diff = Date.now() - new Date(dt).getTime();
    return Math.max(0, Math.floor(diff / 86400000));
  }
  return store.get('ht_manualDays', 0);
}

function setManualDays(d){ 
  store.set('ht_manualDays', d); 
}

function simpleTip(day){
  if (day>=14) return 'Coba meditasi singkat untuk jaga konsistensi.';
  if (day>=7) return 'Olahraga ringan bantu paru-paru makin kuat.';
  if (day>=3) return 'Minum air hangat dan peregangan ringan.';
  if (day>=1) return 'Tarik napas dalam dan jalan 10 menit.';
  return 'Minum banyak air hari ini.';
}

function estimateSavedFromLocal(days){
  const m = store.get('nb_money', null);
  if (!m) return 0;
  const daily = Number(m.daily||0), price = Number(m.price||0), cpp = Number(m.cpp||20)||20;
  const perDay = cpp ? (daily/cpp)*price : 0;
  return Math.round(perDay * days);
}

function showToast(text){ 
  const t=document.getElementById('toast'); 
  if(!t) return; 
  t.textContent=text; 
  t.classList.remove('hidden'); 
  setTimeout(()=> t.classList.add('hidden'), 1800); 
}

async function renderHealth(){
  let days = calcDaysSinceQuit();
  const target = healthTarget();
  const pct = Math.max(0, Math.min(100, Math.round((days/target)*100)));
  
  if ($('#ht_days')) $('#ht_days').textContent = days;
  if ($('#ht_bar')) $('#ht_bar').style.width = pct+'%';
  if ($('#ht_message')) $('#ht_message').textContent = days>=3? 'Pernapasan lebih lega' : days>=1? 'Detak jantung mulai normal' : 'Mulai hari ini lebih baik';
  if ($('#ht_tip')) $('#ht_tip').textContent = simpleTip(days);
  if ($('#ht_target')) $('#ht_target').textContent = target;
  if ($('#ht_saved')) $('#ht_saved').textContent = estimateSavedFromLocal(days).toLocaleString('id-ID');

  // Fill logs
  const fillLogs = (logs)=>{
    const ul = document.getElementById('ht_log'); 
    if (!ul) return; 
    ul.innerHTML='';
    (logs||[]).slice().reverse().forEach(l=>{
      const li=document.createElement('li');
      const d = new Date(l.dateUpdated||Date.now());
      li.textContent = `Hari ${l.day} → ${l.progressStatus==='success'?'berhasil':'skip'} (${d.toLocaleDateString('id-ID')})`;
      ul.appendChild(li);
    });
    const succ = (logs||[]).filter(x=> x.progressStatus==='success').length;
    const se = document.getElementById('ht_success'); 
    if (se) se.textContent = succ;
  };

  let logs = store.get('ht_logs', []);
  fillLogs(logs);

  const up = document.getElementById('ht_update');
  if (up) {
    up.onclick = async () => {
      const m = store.get('nb_money', null);
      if (!m?.date) { 
        const cur = store.get('ht_manualDays', 0); 
        setManualDays(cur+1); 
      }
      
      const localLogs = store.get('ht_logs', []);
      const nextDay = (localLogs[localLogs.length-1]?.day||0)+1;
      const today = new Date().toDateString();
      const hasToday = localLogs.some(x=> new Date(x.dateUpdated).toDateString()===today);
      
      if (hasToday) { 
        showToast('⚠️ Anda sudah mengupdate progres hari ini.'); 
        return; 
      }
      
      localLogs.push({ 
        day: nextDay, 
        progressStatus:'success', 
        dateUpdated: new Date().toISOString() 
      });
      store.set('ht_logs', localLogs);
      showToast('✅ Progress hari ini berhasil diperbarui!');
      await renderHealth();
    };
  }
}

// Contact form
function initContactForm(){ 
  const form=document.getElementById('contactForm'); 
  if(!form) return; 
  form.addEventListener('submit',(e)=>{ 
    e.preventDefault(); 
    const name=$('#cf_name').value.trim(); 
    const email=$('#cf_email').value.trim(); 
    const msg=$('#cf_msg').value.trim(); 
    if(!name||!email||!msg) return; 
    const all=store.get('nb_contacts', []); 
    all.push({ name, email, msg, at:new Date().toISOString() }); 
    store.set('nb_contacts', all); 
    const status=$('#cf_status'); 
    if(status) status.classList.remove('hidden'); 
    form.reset(); 
  }); 
}

// Login simulation - Perbaikan
function simulateLogin() {
  store.set('nb_user', { 
    loggedIn: true, 
    name: 'User',
    avatar: 'U'
  });
  updateNavbar();
  showToast('Berhasil login!');
}

function simulateLogout() {
  store.set('nb_user', { loggedIn: false });
  updateNavbar();
  showToast('Berhasil logout!');
}

function updateNavbar() {
  const user = store.get('nb_user', { loggedIn: false });
  const isHomePage = window.location.pathname.endsWith('index.html') || 
                     window.location.pathname.endsWith('/');
// Update desktop navbar
  const authSection = document.getElementById('authSection');
  const userSection = document.getElementById('userSection');
  
  if (authSection && userSection) {
    if (user.loggedIn) {
      authSection.classList.add('hidden');
      userSection.classList.remove('hidden');
      
      // Update user info
      const userName = document.getElementById('userName');
      const userAvatar = document.getElementById('userAvatar');
      if (userName) userName.textContent = user.name;
      if (userAvatar) userAvatar.textContent = user.avatar || 'P';
    } else {
      authSection.classList.remove('hidden');
      userSection.classList.add('hidden');
    }
    
    // Show auth section only on home page
    if (!isHomePage) {
      authSection.classList.add('hidden');
    }
  }

// Update mobile navbar
  const mobileAuthSection = document.getElementById('mobileAuthSection');
  const mobileUserSection = document.getElementById('mobileUserSection');
  
  if (mobileAuthSection && mobileUserSection) {
    if (user.loggedIn) {
      mobileAuthSection.classList.add('hidden');
      mobileUserSection.classList.remove('hidden');
      
      // Update user info
      const mobileUserName = document.getElementById('mobileUserName');
      const mobileUserAvatar = document.getElementById('mobileUserAvatar');
      if (mobileUserName) mobileUserName.textContent = user.name;
      if (mobileUserAvatar) mobileUserAvatar.textContent = user.avatar || 'P';
    } else {
      mobileAuthSection.classList.remove('hidden');
      mobileUserSection.classList.add('hidden');
    }
    
    // Show auth section only on home page
    if (!isHomePage && mobileAuthSection) {
      mobileAuthSection.classList.add('hidden');
    }
  }
} 

// Update initPage function to include navbar updates
const originalInitPage = initPage;
initPage = function() {
  originalInitPage();
  updateNavbar();
  
  // Add event listeners for login/logout buttons
  const loginBtn = document.getElementById('loginBtn');
  const mobileLoginBtn = document.getElementById('mobileLoginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
  
  if (loginBtn) {
    loginBtn.addEventListener('click', simulateLogin);
  }
  
  if (mobileLoginBtn) {
    mobileLoginBtn.addEventListener('click', simulateLogin);
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', simulateLogout);
  }

  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener('click', simulateLogout);
  }
};

// Page-specific initialization
function initPage(){
  // Set year
  document.getElementById('year') && (document.getElementById('year').textContent=new Date().getFullYear());
  
  // Initialize components based on page
  if(document.getElementById('durationWrap')) {
    renderDur();
    updateChallengeUI();
  }
  
  if(document.getElementById('daily')) {
    loadMoney();
    $('#calcBtn')?.addEventListener('click', calcMoney);
  }
  
  if(document.getElementById('contactForm')) {
    initContactForm();
  }
  
  if(document.getElementById('ht_days')) {
    renderHealth();
  }
}

// Initialize when DOM is loaded
window.addEventListener('DOMContentLoaded', initPage);