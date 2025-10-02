import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import MoneyTracking from '../models/MoneyTracking.js';

const router = Router();

router.post('/money/save', authRequired, async (req, res) => {
  try {
    const { dailyCigarettes, pricePerPack, cigarettesPerPack, startDate } = req.body;

    let mt = await MoneyTracking.findOne({ userId: req.user.id });
    if (!mt) {
      mt = await MoneyTracking.create({ userId: req.user.id, dailyCigarettes, pricePerPack, cigarettesPerPack, startDate });
    } else {
      mt.dailyCigarettes = dailyCigarettes ?? mt.dailyCigarettes;
      mt.pricePerPack = pricePerPack ?? mt.pricePerPack;
      mt.cigarettesPerPack = cigarettesPerPack ?? mt.cigarettesPerPack;
      mt.startDate = startDate ? new Date(startDate) : mt.startDate;
      await mt.save();
    }

    // compute auto totalSaved
    if (mt.startDate && mt.dailyCigarettes && mt.pricePerPack && mt.cigarettesPerPack) {
      const days = Math.max(0, Math.floor((Date.now() - new Date(mt.startDate).getTime()) / (1000 * 60 * 60 * 24)));
      const packsPerDay = mt.dailyCigarettes / mt.cigarettesPerPack;
      mt.totalSaved = Math.round(days * packsPerDay * mt.pricePerPack);
      await mt.save();
    }

    return res.json(mt);
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
