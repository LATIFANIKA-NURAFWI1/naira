import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import HealthTracking from '../models/HealthTracking.js';
import MoneyTracking from '../models/MoneyTracking.js';
import Challenge from '../models/Challenge.js';

const router = Router();

// Canonical milestone catalog (medical references simplified)
const CATALOG = [
  { key: '20min', label: 'Detak jantung & tekanan darah mulai normal', dueAtHours: 0.33, color: 'red', icon: 'heart' , tip: 'Tarik napas dalam, jalan kaki 10 menit.' },
  { key: '24h', label: 'Kadar karbon monoksida menurun', dueAtHours: 24, color: 'orange', icon: 'lungs', tip: 'Minum air putih, hindari asap rokok.' },
  { key: '3d', label: 'Indra penciuman & perasa membaik', dueAtDays: 3, color: 'yellow', icon: 'nose', tip: 'Perbanyak buah & sayur.' },
  { key: '2w', label: 'Sirkulasi mulai membaik', dueAtDays: 14, color: 'green', icon: 'artery', tip: 'Mulai olahraga ringan teratur.' },
  { key: '3m', label: 'Fungsi paru membaik', dueAtDays: 60, color: 'green', icon: 'lungs', tip: 'Latihan kardio ringan, pantau napas.' },
  { key: '1y', label: 'Risiko penyakit jantung turun signifikan', dueAtDays: 365, color: 'emerald', icon: 'heart', tip: 'Pertahankan pola hidup sehat.' },
];

function diffSince(startDate) {
  if (!startDate) return { hours: 0, days: 0 };
  const ms = Date.now() - new Date(startDate).getTime();
  const hours = Math.max(0, ms / 36e5);
  const days = Math.max(0, Math.floor(hours / 24));
  return { hours, days };
}

async function resolveStartDate(userId) {
  // Priority: MoneyTracking.startDate -> active Challenge.startDate -> null
  const mt = await MoneyTracking.findOne({ userId });
  if (mt?.startDate) return mt.startDate;
  const ch = await Challenge.findOne({ userId, status: 'active' }).sort({ createdAt: -1 });
  if (ch?.startDate) return ch.startDate;
  return null;
}

function computeProgress(startDate) {
  const { hours, days } = diffSince(startDate);
  const items = CATALOG.map(m => {
    const dueH = m.dueAtHours ?? (m.dueAtDays ? m.dueAtDays * 24 : 0);
    const achieved = hours >= dueH;
    const pct = Math.max(0, Math.min(100, Math.round((hours / dueH) * 100)));
    return { key: m.key, label: m.label, achieved, dueAtHours: dueH, color: m.color, icon: m.icon, tip: m.tip, progressPercent: isFinite(pct) ? pct : achieved ? 100 : 0 };
  });
  // overall percent: ratio of achieved milestones
  const achievedCount = items.filter(i => i.achieved).length;
  const overall = Math.round((achievedCount / items.length) * 100);
  return { startDate, hoursSince: hours, daysSince: days, items, overallPercent: overall };
}

function isSameDay(a, b){
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

// Backwards compatible: get or create document (raw)
router.get('/health/:id', authRequired, async (req, res) => {
  try {
    const { id } = req.params; // userId
    let doc = await HealthTracking.findOne({ userId: id });
    if (!doc) {
      // initialize with catalog labels only
      doc = await HealthTracking.create({ userId: id, milestones: CATALOG.map(m => ({ label: m.label, tip: m.tip })) });
    }
    return res.json(doc);
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// New: computed progress based on start date
router.get('/health/:id/progress', authRequired, async (req, res) => {
  try {
    const { id } = req.params; // userId
    const startDate = await resolveStartDate(id);
    const progress = computeProgress(startDate);
    return res.json(progress);
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// Record a daily progress update (success) with duplicate protection per calendar day
router.post('/health/:id/progress', authRequired, async (req, res) => {
  try {
    const { id } = req.params; // userId
    const now = new Date();

    // Ensure doc exists
    let doc = await HealthTracking.findOne({ userId: id });
    if (!doc) doc = await HealthTracking.create({ userId: id, milestones: [] });

    // Block duplicate updates for same calendar day
    const hasToday = (doc.logs||[]).some(l => isSameDay(new Date(l.dateUpdated), now));
    if (hasToday) {
      return res.status(409).json({ error: 'already_updated_today' });
    }

    // Determine day number from startDate (via MoneyTracking/Challenge)
    const startDate = await resolveStartDate(id);
    const { daysSince } = computeProgress(startDate);
    const dayNum = Math.max(1, (daysSince||0));

    // Append log
    doc.logs = doc.logs || [];
    doc.logs.push({ day: dayNum, progressStatus: 'success', dateUpdated: now });
    doc.lastUpdated = now;
    await doc.save();

    // Summarize
    const successCount = doc.logs.filter(l=> l.progressStatus==='success').length;
    // Estimate saved based on MoneyTracking
    const mt = await MoneyTracking.findOne({ userId: id });
    let estimatedSaved = 0;
    if (mt?.startDate && mt?.dailyCigarettes && mt?.cigarettesPerPack && mt?.pricePerPack) {
      const { daysSince: d } = computeProgress(mt.startDate);
      const packsPerDay = mt.dailyCigarettes / mt.cigarettesPerPack;
      estimatedSaved = Math.round((d||0) * packsPerDay * mt.pricePerPack);
    }

    return res.json({ ok: true, logs: doc.logs, successCount, estimatedSaved, day: dayNum });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// Facts and tips (static for now; could be DB-driven later)
router.get('/health/facts', async (_req, res) => {
  const facts = [
    'Merokok 1 bungkus sehari meningkatkan risiko kanker paru secara signifikan.',
    'Berhenti merokok selama 1 tahun dapat menurunkan risiko penyakit jantung koroner sekitar 50%.',
    'Paparan asap rokok pasif juga berbahaya dan meningkatkan risiko penyakit pernapasan.',
  ];
  res.json({ facts });
});

router.get('/health/tips', async (_req, res) => {
  const tipsByDay = [
    { day: 1, tip: 'Minum banyak air untuk membantu detoksifikasi.' },
    { day: 3, tip: 'Lakukan olahraga ringan untuk mengurangi stres.' },
    { day: 7, tip: 'Perbanyak konsumsi buah dan sayur.' },
    { day: 14, tip: 'Coba meditasi/relaksasi untuk menjaga konsistensi.' },
  ];
  res.json({ tips: tipsByDay });
});

// Update milestones (manual override)
router.post('/health/:id', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const { milestones } = req.body;
    let doc = await HealthTracking.findOneAndUpdate(
      { userId: id },
      { milestones, lastUpdated: new Date() },
      { new: true, upsert: true }
    );
    return res.json(doc);
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
