import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import Challenge from '../models/Challenge.js';

/**
 * Deprecated (frontend):
 * Frontend challenge has migrated to a fully client-side app (No Smoke Quest)
 * that stores progress in localStorage. These endpoints are retained for
 * backward compatibility and optional authenticated flows. They are not
 * required by the new client-only experience.
 */
const router = Router();

router.post('/challenge', authRequired, async (req, res) => {
  try {
    const { durationDays } = req.body;
    if (![1, 3, 5, 7, 14, 30].includes(Number(durationDays))) {
      return res.status(400).json({ error: 'Invalid duration' });
    }
    const challenge = await Challenge.create({ userId: req.user.id, durationDays });
    return res.status(201).json(challenge);
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/challenge/:id', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const challenge = await Challenge.findOne({ _id: id, userId: req.user.id });
    if (!challenge) return res.status(404).json({ error: 'Not found' });
    return res.json(challenge);
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/challenge/:id/progress', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const { progressDays, status, badge } = req.body;
    const update = {};
    if (progressDays != null) update.progressDays = progressDays;
    if (status) update.status = status;
    if (badge) update.$addToSet = { badges: badge };

    const challenge = await Challenge.findOneAndUpdate({ _id: id, userId: req.user.id }, update, { new: true });
    if (!challenge) return res.status(404).json({ error: 'Not found' });
    return res.json(challenge);
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
