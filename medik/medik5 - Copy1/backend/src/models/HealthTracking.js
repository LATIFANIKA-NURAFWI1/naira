import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema(
  {
    label: String,
    achieved: { type: Boolean, default: false },
    dueAtHours: Number,
    dueAtDays: Number,
    tip: String
  },
  { _id: false }
);

const dailyLogSchema = new mongoose.Schema(
  {
    day: { type: Number, required: true },
    progressStatus: { type: String, enum: ['success', 'skipped'], default: 'success' },
    dateUpdated: { type: Date, default: Date.now }
  },
  { _id: false }
);

const healthTrackingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    milestones: [milestoneSchema],
    logs: [dailyLogSchema],
    lastUpdated: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model('HealthTracking', healthTrackingSchema);
