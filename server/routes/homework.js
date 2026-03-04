import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Homework from '../models/Homework.js';
import HomeworkSubmission from '../models/HomeworkSubmission.js';
import Class from '../models/Class.js';
import User from '../models/User.js';
import protect from '../middleware/auth.js';
import authorize from '../middleware/role.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '..', 'uploads', 'homework');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ hỗ trợ ảnh, PDF, DOC/DOCX'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

const router = express.Router();
router.use(protect, authorize('teacher', 'admin'));

// GET /api/homework - Danh sách bài tập
router.get('/', async (req, res) => {
  try {
    const { status, className, search } = req.query;
    const filter = { teacher: req.user._id };
    if (status) filter.status = status;
    if (className) filter.assignedClasses = className;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const homeworks = await Homework.find(filter).sort({ createdAt: -1 });

    // Đếm số bài đã nộp cho mỗi bài tập
    const counts = await HomeworkSubmission.aggregate([
      { $match: { homework: { $in: homeworks.map((h) => h._id) } } },
      { $group: { _id: '$homework', submitted: { $sum: 1 }, graded: { $sum: { $cond: [{ $eq: ['$status', 'graded'] }, 1, 0] } } } },
    ]);
    const countMap = {};
    counts.forEach((c) => { countMap[c._id.toString()] = c; });

    const list = homeworks.map((h) => ({
      ...h.toObject(),
      submittedCount: countMap[h._id.toString()]?.submitted || 0,
      gradedCount: countMap[h._id.toString()]?.graded || 0,
    }));

    res.json({ success: true, homeworks: list });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// POST /api/homework - Tạo bài tập (multipart)
router.post('/', upload.array('files', 5), async (req, res) => {
  try {
    const { title, description, deadline } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ message: 'Tiêu đề là bắt buộc' });
    }

    const attachments = (req.files || []).map((f) => ({
      originalName: f.originalname,
      filePath: f.filename,
      mimeType: f.mimetype,
      size: f.size,
    }));

    const homework = await Homework.create({
      title: title.trim(),
      description: description || '',
      attachments,
      teacher: req.user._id,
      deadline: deadline ? new Date(deadline) : null,
    });

    res.status(201).json({ success: true, homework });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// PUT /api/homework/:id - Cập nhật bài tập
router.put('/:id', upload.array('files', 5), async (req, res) => {
  try {
    const homework = await Homework.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!homework) return res.status(404).json({ message: 'Không tìm thấy bài tập' });

    const { title, description, deadline, removeFiles } = req.body;
    if (title !== undefined) homework.title = title.trim();
    if (description !== undefined) homework.description = description;
    if (deadline !== undefined) homework.deadline = deadline ? new Date(deadline) : null;

    // Xóa file cũ theo yêu cầu
    if (removeFiles) {
      const toRemove = JSON.parse(removeFiles);
      toRemove.forEach((fp) => {
        const fullPath = path.join(uploadDir, fp);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      });
      homework.attachments = homework.attachments.filter((a) => !toRemove.includes(a.filePath));
    }

    // Thêm file mới
    const newFiles = (req.files || []).map((f) => ({
      originalName: f.originalname,
      filePath: f.filename,
      mimeType: f.mimetype,
      size: f.size,
    }));
    homework.attachments.push(...newFiles);

    await homework.save();
    res.json({ success: true, homework });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// DELETE /api/homework/:id - Xóa bài tập
router.delete('/:id', async (req, res) => {
  try {
    const homework = await Homework.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!homework) return res.status(404).json({ message: 'Không tìm thấy bài tập' });

    // Xóa các file đính kèm
    homework.attachments.forEach((a) => {
      const fullPath = path.join(uploadDir, a.filePath);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    });

    await HomeworkSubmission.deleteMany({ homework: homework._id });
    await homework.deleteOne();

    res.json({ success: true, message: 'Đã xóa bài tập' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// POST /api/homework/:id/assign - Giao bài tập
router.post('/:id/assign', async (req, res) => {
  try {
    const homework = await Homework.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!homework) return res.status(404).json({ message: 'Không tìm thấy bài tập' });

    const { assignmentType, assignedClasses, assignedStudents, deadline } = req.body;

    if (!['class', 'student'].includes(assignmentType)) {
      return res.status(400).json({ message: 'Loại giao bài không hợp lệ' });
    }

    if (assignmentType === 'class') {
      if (!assignedClasses?.length) return res.status(400).json({ message: 'Chưa chọn lớp nào' });
      homework.assignmentType = 'class';
      homework.assignedClasses = assignedClasses;
      homework.assignedStudents = [];
    } else {
      if (!assignedStudents?.length) return res.status(400).json({ message: 'Chưa chọn học sinh nào' });
      homework.assignmentType = 'student';
      homework.assignedStudents = assignedStudents;
      homework.assignedClasses = [];
    }

    if (deadline) homework.deadline = new Date(deadline);
    homework.status = 'published';
    await homework.save();

    res.json({ success: true, homework });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// GET /api/homework/:id/submissions - Xem bài nộp
router.get('/:id/submissions', async (req, res) => {
  try {
    const homework = await Homework.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!homework) return res.status(404).json({ message: 'Không tìm thấy bài tập' });

    const submissions = await HomeworkSubmission.find({ homework: homework._id })
      .populate('student', 'name email')
      .sort({ submittedAt: -1 });

    res.json({ success: true, submissions, homework });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// PATCH /api/homework/:id/submissions/:sid/grade - Nhận xét bài nộp
router.patch('/:id/submissions/:sid/grade', async (req, res) => {
  try {
    const homework = await Homework.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!homework) return res.status(404).json({ message: 'Không tìm thấy bài tập' });

    const submission = await HomeworkSubmission.findOne({ _id: req.params.sid, homework: homework._id });
    if (!submission) return res.status(404).json({ message: 'Không tìm thấy bài nộp' });

    const { teacherComment } = req.body;
    submission.teacherComment = teacherComment || '';
    submission.status = 'graded';
    submission.gradedAt = new Date();
    await submission.save();

    res.json({ success: true, submission });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// GET /api/homework/classes - Lấy danh sách lớp của giáo viên (dùng cho assign modal)
router.get('/classes', async (req, res) => {
  try {
    const classes = await Class.find({ teachers: req.user._id }).select('name students').sort({ name: 1 });
    res.json({ success: true, classes: classes.map((c) => ({ name: c.name, count: c.students.length })) });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// GET /api/homework/students-by-class - Học sinh theo lớp (dùng cho assign modal)
router.get('/students-by-class', async (req, res) => {
  try {
    const { className } = req.query;
    if (!className) return res.status(400).json({ message: 'className là bắt buộc' });

    const cls = await Class.findOne({ name: className, teachers: req.user._id });
    if (!cls) return res.json({ success: true, students: [] });

    const students = await User.find({ _id: { $in: cls.students } }).select('name email');
    res.json({ success: true, students });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

export default router;
