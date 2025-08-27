const express= require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const cors = require('cors');
const app = express();
const authRoutes = require('./routes/auth.js');
const jobRoutes = require('./routes/jobRoutes.js');
const statsRoutes = require('./routes/statsRoutes.js');
const notesRoutes = require('./routes/notesRoutes.js');
const resumeRoutes = require('./routes/resumeRoutes');

dotenv.config();
connectDB();

app.use(cors());
app.use(express.json());
app.get('/', (req, res)=> {
    res.send("Job tracker app is running.✅");
});
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/stats', statsRoutes);
app.use('/api/v1/jobs/:jobId/notes', notesRoutes);
app.use('/api/v1/jobs/:jobId/resume', resumeRoutes);
const errorMiddleware = require('./middleware/errorMiddleware');
app.use(errorMiddleware);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} 🚀`);
});
