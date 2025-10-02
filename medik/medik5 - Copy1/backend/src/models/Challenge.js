import mongoose from 'mongoose';

const challengeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    type: { type: String, enum: ['stop-smoking'], default: 'stop-smoking' },
    durationDays: { type: Number, enum: [1, 3, 5, 7, 14, 30], required: true },
    startDate: { type: Date, default: Date.now },
    progressDays: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'completed', 'failed'], default: 'active' },
    badges: [{ type: String }]
  },
  { timestamps: true }
);

export default mongoose.model('Challenge', challengeSchema);
