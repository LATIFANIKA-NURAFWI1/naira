import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.js';
import challengeRoutes from './routes/challenge.js';
import moneyRoutes from './routes/money.js';
import healthRoutes from './routes/health.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*' }));
app.use(express.json());
app.use(morgan('dev'));

const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI || '';

// DB connect
if (!MONGODB_URI) {
  console.warn('MONGODB_URI not set. Set it in environment for production.');
} else {
  mongoose
    .connect(MONGODB_URI, { dbName: 'nafasbaru' })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error', err));
}

app.get('/', (_, res) => {
  res.json({ name: 'NafasBaru API', status: 'ok' });
});

app.use('/api', authRoutes);
app.use('/api', challengeRoutes);
app.use('/api', moneyRoutes);
app.use('/api', healthRoutes);

app.use((_, res) => res.status(404).json({ error: 'Not Found' }));

app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
