const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const cors = require('cors');

const authRoutes = require('./routes/auth.js');
const jobRoutes = require('./routes/jobRoutes.js');
const statsRoutes = require('./routes/statsRoutes.js');
const notesRoutes = require('./routes/notesRoutes.js');
const resumeRoutes = require('./routes/resumeRoutes');
const userRoutes = require('./routes/userRoutes');
dotenv.config();
connectDB();

const app = express();

const ALLOWED_ORIGINS = [process.env.FRONTEND_URL || 'http://localhost:5173'];
const corsOptions = { origin: ALLOWED_ORIGINS, credentials: true };

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: false }));

function sanitizeInPlace(obj) {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj)) return obj.forEach(sanitizeInPlace);
  for (const k of Object.keys(obj)) {
    if (k.startsWith('$') || k.includes('.')) { delete obj[k]; continue; }
    sanitizeInPlace(obj[k]);
  }
}
app.use((req, _res, next) => {
  sanitizeInPlace(req.body);
  sanitizeInPlace(req.params);
  sanitizeInPlace(req.query);
  next();
});

app.use(compression());
app.use(cors(corsOptions));
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));

app.head('/', (_req, res) => res.status(200).end());
app.get('/', (_req, res) => res.send('Job tracker app is running.✅'));
app.get('/health', (_req, res) => res.json({ ok: true }));

console.log('LOADED ENV — SMTP_HOST:', process.env.SMTP_HOST ? 'SET' : 'UNSET',
            'SMTP_USER:', process.env.SMTP_USER ? 'SET' : 'UNSET',
            'EMAIL_FROM:', process.env.EMAIL_FROM || 'EMPTY');
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/stats', statsRoutes);
app.use('/api/v1/jobs/:jobId/notes', notesRoutes);
app.use('/api/v1/jobs/:jobId/resume', resumeRoutes);
app.use('/api/v1/user', userRoutes);
const errorMiddleware = require('./middleware/errorMiddleware');
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT} 🚀`));
