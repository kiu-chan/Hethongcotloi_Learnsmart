import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import gameRoutes from './routes/games.js';
import examRoutes from './routes/exams.js';
import documentRoutes from './routes/documents.js';
import notebookRoutes from './routes/notebooks.js';
import statisticsRoutes from './routes/statistics.js';
import publicRoutes from './routes/public.js';
import dashboardRoutes from './routes/dashboard.js';
import studentPortalRoutes from './routes/studentPortal.js';
import adminRoutes from './routes/admin.js';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: './server/.env' });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notebooks', notebookRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/student-portal', studentPortalRoutes);
app.use('/api/admin', adminRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get(/(.*)/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Seed demo users
const seedUsers = async () => {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      await User.create([
        {
          email: 'admin@notebooklm.vn',
          password: 'admin123',
          name: 'Administrator',
          role: 'admin',
        },
        {
          email: 'giaovien@notebooklm.vn',
          password: 'teacher123',
          name: 'Nguyễn Văn Giáo',
          role: 'teacher',
        },
        {
          email: 'hocsinh@notebooklm.vn',
          password: 'student123',
          name: 'Trần Thị Học',
          role: 'student',
        },
      ]);
      console.log('Demo users seeded successfully');
    }
  } catch (error) {
    console.error('Error seeding users:', error.message);
  }
};

// Start server
const start = async () => {
  await connectDB();
  await seedUsers();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();
