import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import User from '../models/User.js';
import Exam from '../models/Exam.js';
import Game from '../models/Game.js';
import Document from '../models/Document.js';
import Notebook from '../models/Notebook.js';
import ExamSubmission from '../models/ExamSubmission.js';
import Class from '../models/Class.js';
import protect from '../middleware/auth.js';
import authorize from '../middleware/role.js';

const uploadMemory = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// Tất cả routes yêu cầu admin
router.use(protect, authorize('admin'));

const formatUser = (user) => ({
  id: user._id,
  email: user.email,
  name: user.name,
  role: user.role,
  avatar: user.avatar,
  createdAt: user.createdAt,
});

// GET /api/admin/users - Lấy danh sách người dùng
router.get('/users', async (req, res) => {
  try {
    const { role, search } = req.query;

    const filter = {};
    if (role && ['teacher', 'student'].includes(role)) {
      filter.role = role;
    } else if (!role || role === 'all') {
      filter.role = { $in: ['teacher', 'student'] };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).sort({ createdAt: -1 }).select('-password');

    res.json({ success: true, users: users.map(formatUser) });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// POST /api/admin/users - Tạo tài khoản mới
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    if (!['teacher', 'student'].includes(role)) {
      return res.status(400).json({ message: 'Vai trò không hợp lệ' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    const user = await User.create({
      email: email.toLowerCase(),
      password,
      name,
      role,
    });

    res.status(201).json({ success: true, user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// PUT /api/admin/users/:id - Cập nhật thông tin người dùng
router.put('/users/:id', async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Không thể chỉnh sửa tài khoản admin' });
    }

    if (name) user.name = name;

    if (email && email.toLowerCase() !== user.email) {
      const exists = await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } });
      if (exists) {
        return res.status(400).json({ message: 'Email đã được sử dụng bởi tài khoản khác' });
      }
      user.email = email.toLowerCase();
    }

    if (role && ['teacher', 'student'].includes(role)) {
      user.role = role;
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
      }
      user.password = password;
    }

    await user.save();

    res.json({ success: true, message: 'Cập nhật thành công', user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// DELETE /api/admin/users/:id - Xóa người dùng
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Không thể xóa tài khoản admin' });
    }

    await user.deleteOne();

    res.json({ success: true, message: 'Đã xóa người dùng thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// ─── DASHBOARD ROUTE ─────────────────────────────────────────

// GET /api/admin/dashboard - Dữ liệu tổng quan cho admin dashboard
router.get('/dashboard', async (req, res) => {
  try {
    // Thống kê nhanh
    const [
      totalUsers,
      totalTeachers,
      totalStudents,
      totalDocuments,
      totalExams,
      totalGames,
      pendingSubmissions,
    ] = await Promise.all([
      User.countDocuments({ role: { $in: ['teacher', 'student'] } }),
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: 'student' }),
      Document.countDocuments(),
      Exam.countDocuments(),
      Game.countDocuments(),
      ExamSubmission.countDocuments({ status: 'submitted' }),
    ]);

    // Hoạt động gần đây (10 item mới nhất từ exams + documents + games)
    const [recentExams, recentDocs, recentGames] = await Promise.all([
      Exam.find().sort({ createdAt: -1 }).limit(4)
        .populate('teacher', 'name')
        .select('title subject teacher createdAt'),
      Document.find().sort({ createdAt: -1 }).limit(3)
        .populate('teacher', 'name')
        .select('name teacher createdAt'),
      Game.find().sort({ createdAt: -1 }).limit(3)
        .populate('teacher', 'name')
        .select('title teacher createdAt'),
    ]);

    const activities = [
      ...recentExams.map((e) => ({
        id: e._id,
        type: 'exam',
        user: e.teacher?.name || 'Giáo viên',
        action: 'tạo đề thi',
        subject: e.subject || e.title,
        time: e.createdAt,
      })),
      ...recentDocs.map((d) => ({
        id: d._id,
        type: 'document',
        user: d.teacher?.name || 'Giáo viên',
        action: 'tải lên tài liệu',
        subject: d.name,
        time: d.createdAt,
      })),
      ...recentGames.map((g) => ({
        id: g._id,
        type: 'game',
        user: g.teacher?.name || 'Giáo viên',
        action: 'tạo trò chơi',
        subject: g.title,
        time: g.createdAt,
      })),
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalTeachers,
        totalStudents,
        totalDocuments,
        totalExams,
        totalGames,
        pendingSubmissions,
      },
      activities,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// ─── REPORT ROUTES ───────────────────────────────────────────

// GET /api/admin/reports - Thống kê tổng quan toàn hệ thống
router.get('/reports', async (req, res) => {
  try {
    // ── Tổng số lượng song song ──────────────────────────────
    const [
      totalUsers,
      totalTeachers,
      totalStudentAccounts,
      totalExams,
      totalGames,
      totalDocuments,
      totalNotebooks,
      totalSubmissions,
    ] = await Promise.all([
      User.countDocuments({ role: { $in: ['teacher', 'student'] } }),
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: 'student' }),
      Exam.countDocuments(),
      Game.countDocuments(),
      Document.countDocuments(),
      Notebook.countDocuments(),
      ExamSubmission.countDocuments(),
    ]);

    // ── Trạng thái đề thi ────────────────────────────────────
    const examStatusResult = await Exam.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const examByStatus = { draft: 0, published: 0, completed: 0 };
    examStatusResult.forEach((r) => { examByStatus[r._id] = r.count; });

    // ── Top môn học (theo số đề thi) ─────────────────────────
    const subjectResult = await Exam.aggregate([
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);
    const topSubjects = subjectResult.map((r) => ({ subject: r._id || 'Khác', count: r.count }));

    // ── Loại đề thi ──────────────────────────────────────────
    const examTypeResult = await Exam.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);
    const examByType = {};
    examTypeResult.forEach((r) => { examByType[r._id] = r.count; });

    // ── Top giáo viên hoạt động nhất ─────────────────────────
    const teacherActivityResult = await Exam.aggregate([
      { $group: { _id: '$teacher', examCount: { $sum: 1 } } },
      { $sort: { examCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'teacher',
        },
      },
      { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: true } },
    ]);

    const topTeachers = teacherActivityResult.map((r) => ({
      name: r.teacher?.name || 'Không xác định',
      email: r.teacher?.email || '',
      examCount: r.examCount,
    }));

    // ── Tài khoản mới theo 6 tháng gần nhất ─────────────────
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const userGrowthResult = await User.aggregate([
      { $match: { role: { $in: ['teacher', 'student'] }, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            role: '$role',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Tạo mảng 6 tháng
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
    }

    const MONTH_VI = ['', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

    const userGrowth = months.map(({ year, month }) => {
      const teacherEntry = userGrowthResult.find(
        (r) => r._id.year === year && r._id.month === month && r._id.role === 'teacher'
      );
      const studentEntry = userGrowthResult.find(
        (r) => r._id.year === year && r._id.month === month && r._id.role === 'student'
      );
      return {
        label: MONTH_VI[month],
        teachers: teacherEntry?.count || 0,
        students: studentEntry?.count || 0,
      };
    });

    // ── Đề thi được tạo theo 6 tháng ────────────────────────
    const examGrowthResult = await Exam.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const examGrowth = months.map(({ year, month }) => {
      const entry = examGrowthResult.find(
        (r) => r._id.year === year && r._id.month === month
      );
      return { label: MONTH_VI[month], count: entry?.count || 0 };
    });

    // ── Kết quả bài nộp ──────────────────────────────────────
    const submissionStatusResult = await ExamSubmission.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const submissionByStatus = { submitted: 0, graded: 0, in_progress: 0 };
    submissionStatusResult.forEach((r) => {
      if (r._id in submissionByStatus) submissionByStatus[r._id] = r.count;
    });

    res.json({
      success: true,
      overview: {
        totalUsers,
        totalTeachers,
        totalStudentAccounts,
        totalExams,
        totalGames,
        totalDocuments,
        totalNotebooks,
        totalSubmissions,
      },
      examByStatus,
      examByType,
      topSubjects,
      topTeachers,
      userGrowth,
      examGrowth,
      submissionByStatus,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// ─── EXAM ROUTES ─────────────────────────────────────────────

// GET /api/admin/exams/stats - Thống kê toàn bộ đề thi
router.get('/exams/stats', async (req, res) => {
  try {
    const result = await Exam.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const counts = {};
    result.forEach((r) => { counts[r._id] = r.count; });

    const total = (counts.draft || 0) + (counts.published || 0) + (counts.completed || 0);

    res.json({
      success: true,
      stats: {
        total,
        draft: counts.draft || 0,
        published: counts.published || 0,
        completed: counts.completed || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// GET /api/admin/exams - Lấy tất cả đề thi (toàn hệ thống)
router.get('/exams', async (req, res) => {
  try {
    const { status, search, teacherId } = req.query;

    const filter = {};
    if (status && ['draft', 'published', 'completed'].includes(status)) {
      filter.status = status;
    }
    if (teacherId) {
      filter.teacher = teacherId;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }

    const exams = await Exam.find(filter)
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 })
      .select('title subject type difficulty duration status questions students submitted graded teacher createdAt totalPoints');

    res.json({ success: true, exams });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// GET /api/admin/exams/:id - Chi tiết đề thi
router.get('/exams/:id', async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('teacher', 'name email');
    if (!exam) {
      return res.status(404).json({ message: 'Không tìm thấy đề thi' });
    }
    res.json({ success: true, exam });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// ─── CLASS ROUTES ─────────────────────────────────────────────

// GET /api/admin/classes - Lấy danh sách lớp học
router.get('/classes', async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' };

    const classes = await Class.find(filter)
      .populate('teachers', 'name email avatar')
      .populate('students', 'name email avatar')
      .populate('homeroomTeacher', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, classes });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// POST /api/admin/classes - Tạo lớp học mới
router.post('/classes', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Tên lớp là bắt buộc' });
    }

    const existing = await Class.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: 'Tên lớp đã tồn tại' });
    }

    const cls = await Class.create({ name: name.trim() });
    await cls.populate('teachers', 'name email avatar');
    await cls.populate('students', 'name email avatar');
    await cls.populate('homeroomTeacher', 'name email avatar');

    res.status(201).json({ success: true, class: cls });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// PUT /api/admin/classes/:id - Đổi tên lớp
router.put('/classes/:id', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Tên lớp là bắt buộc' });
    }

    const existing = await Class.findOne({ name: name.trim(), _id: { $ne: req.params.id } });
    if (existing) {
      return res.status(400).json({ message: 'Tên lớp đã tồn tại' });
    }

    const cls = await Class.findByIdAndUpdate(
      req.params.id,
      { name: name.trim() },
      { new: true }
    )
      .populate('teachers', 'name email avatar')
      .populate('students', 'name email avatar')
      .populate('homeroomTeacher', 'name email avatar');

    if (!cls) return res.status(404).json({ message: 'Không tìm thấy lớp học' });

    res.json({ success: true, class: cls });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// DELETE /api/admin/classes/:id - Xóa lớp học
router.delete('/classes/:id', async (req, res) => {
  try {
    const cls = await Class.findByIdAndDelete(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Không tìm thấy lớp học' });
    res.json({ success: true, message: 'Đã xóa lớp học' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// POST /api/admin/classes/:id/members - Thêm thành viên vào lớp (student hoặc teacher)
router.post('/classes/:id/members', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId là bắt buộc' });

    const user = await User.findById(userId).select('name email role avatar');
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Không tìm thấy lớp học' });

    if (user.role === 'teacher') {
      if (cls.teachers.some((t) => t.toString() === userId)) {
        return res.status(400).json({ message: 'Giáo viên đã có trong lớp này' });
      }
      cls.teachers.push(userId);
      // Giáo viên đầu tiên được thêm vào lớp sẽ tự động là giáo viên chủ nhiệm
      if (cls.teachers.length === 1 && !cls.homeroomTeacher) {
        cls.homeroomTeacher = userId;
      }
    } else if (user.role === 'student') {
      if (cls.students.some((s) => s.toString() === userId)) {
        return res.status(400).json({ message: 'Học sinh đã có trong lớp này' });
      }
      cls.students.push(userId);
    } else {
      return res.status(400).json({ message: 'Chỉ có thể thêm giáo viên hoặc học sinh' });
    }

    await cls.save();
    await cls.populate('teachers', 'name email avatar');
    await cls.populate('students', 'name email avatar');
    await cls.populate('homeroomTeacher', 'name email avatar');

    res.json({ success: true, class: cls });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// DELETE /api/admin/classes/:id/members/:userId - Xóa thành viên khỏi lớp
router.delete('/classes/:id/members/:userId', async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Không tìm thấy lớp học' });

    const { userId } = req.params;
    cls.teachers = cls.teachers.filter((t) => t.toString() !== userId);
    cls.students = cls.students.filter((s) => s.toString() !== userId);

    // Nếu giáo viên chủ nhiệm bị xóa thì xóa trường này
    if (cls.homeroomTeacher && cls.homeroomTeacher.toString() === userId) {
      cls.homeroomTeacher = null;
    }

    await cls.save();
    await cls.populate('teachers', 'name email avatar');
    await cls.populate('students', 'name email avatar');
    await cls.populate('homeroomTeacher', 'name email avatar');

    res.json({ success: true, class: cls });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// PUT /api/admin/classes/:id/homeroom - Đổi giáo viên chủ nhiệm
router.put('/classes/:id/homeroom', async (req, res) => {
  try {
    const { teacherId } = req.body;
    if (!teacherId) return res.status(400).json({ message: 'teacherId là bắt buộc' });

    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Không tìm thấy lớp học' });

    if (!cls.teachers.some((t) => t.toString() === teacherId)) {
      return res.status(400).json({ message: 'Giáo viên không thuộc lớp này' });
    }

    cls.homeroomTeacher = teacherId;
    await cls.save();
    await cls.populate('teachers', 'name email avatar');
    await cls.populate('students', 'name email avatar');
    await cls.populate('homeroomTeacher', 'name email avatar');

    res.json({ success: true, class: cls });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// GET /api/admin/classes/export - Xuất danh sách lớp học ra Excel
router.get('/classes/export', async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('teachers', 'name email')
      .populate('students', 'name email')
      .sort({ name: 1 });

    const rows = [];
    for (const cls of classes) {
      const teachers = cls.teachers || [];
      const students = cls.students || [];
      if (teachers.length === 0 && students.length === 0) {
        rows.push({ 'Tên lớp': cls.name, 'Vai trò': '', 'Email': '', 'Họ và tên': '' });
      } else {
        for (const t of teachers) {
          rows.push({ 'Tên lớp': cls.name, 'Vai trò': 'teacher', 'Email': t.email, 'Họ và tên': t.name });
        }
        for (const s of students) {
          rows.push({ 'Tên lớp': cls.name, 'Vai trò': 'student', 'Email': s.email, 'Họ và tên': s.name });
        }
      }
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 30 }, { wch: 25 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách lớp học');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="danh_sach_lop_hoc.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// POST /api/admin/classes/import - Nhập lớp học từ file Excel
router.post('/classes/import', uploadMemory.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng chọn file Excel' });
    }

    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

    if (rows.length === 0) {
      return res.status(400).json({ message: 'File Excel không có dữ liệu' });
    }

    const stats = { classesCreated: 0, membersAdded: 0, usersCreated: 0, skipped: 0, errors: [] };
    // Cache to avoid re-fetching same classes
    const classCache = {};

    const normalizeRole = (val) => {
      const v = String(val).trim().toLowerCase();
      if (v === 'teacher' || v === 'giáo viên' || v === 'gv') return 'teacher';
      if (v === 'student' || v === 'học sinh' || v === 'hs') return 'student';
      return null;
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel row (header = 1)

      const className = String(row['Tên lớp'] || '').trim();
      const role = normalizeRole(row['Vai trò'] || '');
      const email = String(row['Email'] || '').trim().toLowerCase();
      const name = String(row['Họ và tên'] || '').trim();
      const password = String(row['Mật khẩu'] || '').trim() || '12345678';

      if (!className) {
        stats.errors.push(`Dòng ${rowNum}: thiếu tên lớp`);
        continue;
      }
      if (!email && !role) {
        // Row có tên lớp nhưng không có thành viên → tạo lớp trống
      } else {
        if (!email) { stats.errors.push(`Dòng ${rowNum}: thiếu email`); continue; }
        if (!role) { stats.errors.push(`Dòng ${rowNum}: vai trò không hợp lệ (dùng teacher/student)`); continue; }
      }

      // Tìm hoặc tạo lớp
      if (!classCache[className]) {
        let cls = await Class.findOne({ name: className });
        if (!cls) {
          cls = await Class.create({ name: className });
          stats.classesCreated++;
        }
        classCache[className] = cls;
      }
      const cls = classCache[className];

      if (!email) {
        // Chỉ tạo lớp, không thêm thành viên
        stats.skipped++;
        continue;
      }

      // Tìm hoặc tạo user
      let user = await User.findOne({ email });
      if (!user) {
        if (!name) {
          stats.errors.push(`Dòng ${rowNum}: cần cột "Họ và tên" cho email mới ${email}`);
          continue;
        }
        user = await User.create({ email, name, role, password });
        stats.usersCreated++;
      }

      // Thêm thành viên vào lớp nếu chưa có
      const uid = user._id.toString();
      const inTeachers = cls.teachers.some((t) => t.toString() === uid);
      const inStudents = cls.students.some((s) => s.toString() === uid);

      if (role === 'teacher' && !inTeachers) {
        cls.teachers.push(user._id);
        await cls.save();
        classCache[className] = cls;
        stats.membersAdded++;
      } else if (role === 'student' && !inStudents) {
        cls.students.push(user._id);
        await cls.save();
        classCache[className] = cls;
        stats.membersAdded++;
      } else {
        stats.skipped++;
      }
    }

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

export default router;
