import mongoose from 'mongoose';

const moneyTrackingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    totalSaved: { type: Number, default: 0 },
    currency: { type: String, default: 'IDR' },
    dailyCigarettes: { type: Number, default: 0 },
    pricePerPack: { type: Number, default: 0 },
    cigarettesPerPack: { type: Number, default: 20 },
    startDate: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model('MoneyTracking', moneyTrackingSchema);
