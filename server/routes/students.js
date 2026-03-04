import express from 'express';
import XLSX from 'xlsx';
import Student from '../models/Student.js';
import User from '../models/User.js';
import Game from '../models/Game.js';
import Exam from '../models/Exam.js';
import ExamSubmission from '../models/ExamSubmission.js';
import TeacherSettings from '../models/TeacherSettings.js';
import Class from '../models/Class.js';
import protect from '../middleware/auth.js';
import authorize from '../middleware/role.js';

// Helper: tính số ngày học (thứ 2-6) từ ngày bắt đầu tới hôm nay
const countWeekdays = (startDate, endDate) => {
  let count = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
};

// Helper: tính lại tỷ lệ đi học dựa trên ngày bắt đầu học kỳ và ngày nghỉ
const recalcAttendance = (absentDates, semesterStartDate) => {
  if (!semesterStartDate) return null;
  const totalDays = countWeekdays(semesterStartDate, new Date());
  if (totalDays === 0) return 100;
  const absentCount = absentDates.filter((d) => new Date(d) >= new Date(semesterStartDate)).length;
  return Math.max(0, Math.round(((totalDays - absentCount) / totalDays) * 100));
};

const router = express.Router();

// All routes require auth + teacher role
router.use(protect, authorize('teacher', 'admin'));

// GET /api/students/settings - Lấy cài đặt học kỳ của giáo viên
router.get('/settings', async (req, res) => {
  try {
    const settings = await TeacherSettings.findOne({ teacher: req.user._id });
    res.json({
      success: true,
      semesterStartDate: settings?.semesterStartDate || null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// PUT /api/students/settings - Cập nhật ngày đầu học kỳ
router.put('/settings', async (req, res) => {
  try {
    const { semesterStartDate } = req.body;
    const settings = await TeacherSettings.findOneAndUpdate(
      { teacher: req.user._id },
      { semesterStartDate: semesterStartDate || null },
      { new: true, upsert: true }
    );
    res.json({ success: true, semesterStartDate: settings.semesterStartDate });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// GET /api/students/class-view - Lấy học sinh từ lớp được phân công (auto-sync Student profiles)
router.get('/class-view', async (req, res) => {
  try {
    const { className, status, search } = req.query;
    const teacherId = req.user._id;

    // Lấy tất cả lớp mà giáo viên được phân công
    const allMyClasses = await Class.find({ teachers: teacherId })
      .populate('students', 'name email avatar')
      .sort({ name: 1 });

    if (allMyClasses.length === 0) {
      return res.json({
        success: true,
        students: [],
        stats: { total: 0, excellent: 0, avgScore: 0, avgAttendance: 0, classes: [] },
      });
    }

    // Gom học sinh unique từ tất cả lớp: userId -> { user, classNames[] }
    const studentMap = new Map();
    allMyClasses.forEach((cls) => {
      cls.students.forEach((user) => {
        const key = user._id.toString();
        if (!studentMap.has(key)) {
          studentMap.set(key, { user, classNames: [cls.name] });
        } else {
          studentMap.get(key).classNames.push(cls.name);
        }
      });
    });

    // Auto-sync Student profiles: tạo mới nếu chưa có, cập nhật className
    const upsertOps = Array.from(studentMap.values()).map(({ user, classNames }) =>
      Student.findOneAndUpdate(
        { user: user._id, teacher: teacherId },
        {
          $setOnInsert: {
            name: user.name,
            email: user.email,
            status: 'active',
            user: user._id,
            teacher: teacherId,
          },
          $set: { className: classNames },
        },
        { upsert: true, new: false, runValidators: false }
      )
    );
    await Promise.all(upsertOps);

    // Lấy student IDs theo class filter
    const allUserIds = Array.from(studentMap.keys());
    let filteredUserIds = allUserIds;
    if (className) {
      const selectedClass = allMyClasses.find((c) => c.name === className);
      filteredUserIds = selectedClass
        ? selectedClass.students.map((s) => s._id.toString())
        : [];
    }

    // Truy vấn Student profiles với filter
    const filter = { user: { $in: filteredUserIds }, teacher: teacherId };
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const students = await Student.find(filter).sort({ createdAt: -1 });

    // Stats dựa trên toàn bộ học sinh trong các lớp
    const allStudents = await Student.find({ user: { $in: allUserIds }, teacher: teacherId });
    const total = allStudents.length;
    const excellent = allStudents.filter((s) => s.score >= 8.5).length;
    const avgScore =
      total > 0
        ? Math.round((allStudents.reduce((s, p) => s + (p.score || 0), 0) / total) * 10) / 10
        : 0;
    const avgAttendance =
      total > 0
        ? Math.round(allStudents.reduce((s, p) => s + (p.attendance || 0), 0) / total)
        : 0;

    const classStats = allMyClasses.map((c) => ({ name: c.name, count: c.students.length }));

    res.json({
      success: true,
      students,
      stats: { total, excellent, avgScore, avgAttendance, classes: classStats },
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// GET /api/students - Lấy danh sách học sinh của giáo viên
router.get('/', async (req, res) => {
  try {
    const { className, status, search } = req.query;
    const filter = { teacher: req.user._id };

    if (className) filter.className = className;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const students = await Student.find(filter).sort({ createdAt: -1 });

    res.json({ success: true, students });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// GET /api/students/stats - Thống kê
router.get('/stats', async (req, res) => {
  try {
    const teacherId = req.user._id;

    const total = await Student.countDocuments({ teacher: teacherId });
    const active = await Student.countDocuments({ teacher: teacherId, status: 'active' });

    const scoreAgg = await Student.aggregate([
      { $match: { teacher: teacherId, status: 'active' } },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$score' },
          avgAttendance: { $avg: '$attendance' },
          excellent: { $sum: { $cond: [{ $gte: ['$score', 8.5] }, 1, 0] } },
        },
      },
    ]);

    const stats = scoreAgg[0] || { avgScore: 0, avgAttendance: 0, excellent: 0 };

    // Lấy danh sách lớp (unwind vì className là array)
    const classes = await Student.aggregate([
      { $match: { teacher: teacherId } },
      { $unwind: '$className' },
      { $group: { _id: '$className', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        total,
        active,
        excellent: stats.excellent,
        avgScore: Math.round(stats.avgScore * 10) / 10,
        avgAttendance: Math.round(stats.avgAttendance),
        classes: classes.map((c) => ({ name: c._id, count: c.count })),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// GET /api/students/check-email - Kiểm tra email có tồn tại trong hệ thống
router.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email là bắt buộc' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('name email avatar role');

    if (user) {
      res.json({ success: true, exists: true, user: { name: user.name, email: user.email, role: user.role } });
    } else {
      res.json({ success: true, exists: false });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// GET /api/students/export - Xuất danh sách học sinh ra Excel
router.get('/export', async (req, res) => {
  try {
    const { className } = req.query;
    const filter = { teacher: req.user._id };
    if (className) filter.className = className;

    const students = await Student.find(filter).sort({ className: 1, name: 1 });

    const headers = ['STT', 'Họ tên', 'Giới tính', 'Ngày sinh', 'Lớp', 'Email', 'SĐT', 'Địa chỉ', 'Phụ huynh', 'SĐT phụ huynh', 'Điểm TB', 'Đi học (%)', 'Trạng thái', 'Ghi chú'];

    const data = students.map((s, idx) => [
      idx + 1,
      s.name || '',
      s.gender || '',
      s.dateOfBirth || '',
      Array.isArray(s.className) ? s.className.join('; ') : (s.className || ''),
      s.email || '',
      s.phone || '',
      s.address || '',
      s.parentName || '',
      s.parentPhone || '',
      s.score ?? 0,
      s.attendance ?? 0,
      s.status === 'active' ? 'Đang học' : 'Nghỉ học',
      s.notes || '',
    ]);

    const wsData = [headers, ...data];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Căn chỉnh độ rộng cột
    ws['!cols'] = [
      { wch: 5 },   // STT
      { wch: 25 },  // Họ tên
      { wch: 10 },  // Giới tính
      { wch: 14 },  // Ngày sinh
      { wch: 14 },  // Lớp
      { wch: 28 },  // Email
      { wch: 14 },  // SĐT
      { wch: 30 },  // Địa chỉ
      { wch: 22 },  // Phụ huynh
      { wch: 14 },  // SĐT phụ huynh
      { wch: 10 },  // Điểm TB
      { wch: 12 },  // Đi học
      { wch: 12 },  // Trạng thái
      { wch: 30 },  // Ghi chú
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách học sinh');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const fileName = `danh_sach_hoc_sinh${className ? '_' + className : ''}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(fileName)}`);
    res.send(buf);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// POST /api/students/import - Nhập học sinh từ CSV
router.post('/import', async (req, res) => {
  try {
    const { students: rows } = req.body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: 'Không có dữ liệu học sinh' });
    }

    const results = { success: 0, failed: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        if (!row.name || !row.email || !row.className || !row.gender || !row.dateOfBirth) {
          results.failed++;
          results.errors.push(`Dòng ${i + 1}: Thiếu thông tin bắt buộc (tên, email, lớp, giới tính, ngày sinh)`);
          continue;
        }

        const email = row.email.toLowerCase().trim();

        // Tìm hoặc tạo User
        let user = await User.findOne({ email });
        if (!user) {
          const password = row.password || email.split('@')[0] + '123';
          user = await User.create({
            email,
            password,
            name: row.name.trim(),
            role: 'student',
          });
        }

        // Kiểm tra trùng
        const existing = await Student.findOne({ email, teacher: req.user._id });
        if (existing) {
          results.failed++;
          results.errors.push(`Dòng ${i + 1}: ${row.name} (${email}) đã tồn tại`);
          continue;
        }

        await Student.create({
          name: row.name.trim(),
          email,
          gender: row.gender || 'Nam',
          dateOfBirth: row.dateOfBirth || '',
          className: row.className.includes(';')
            ? row.className.split(';').map((c) => c.trim()).filter(Boolean)
            : [row.className.trim()],
          phone: row.phone || '',
          address: row.address || '',
          parentName: row.parentName || '',
          parentPhone: row.parentPhone || '',
          notes: row.notes || '',
          status: 'active',
          user: user._id,
          teacher: req.user._id,
        });

        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Dòng ${i + 1}: ${err.message}`);
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// POST /api/students/add-to-wheel - Thêm học sinh vào vòng quay
router.post('/add-to-wheel', async (req, res) => {
  try {
    const { gameId, className, studentIds, mode = 'append' } = req.body;

    if (!gameId) {
      return res.status(400).json({ message: 'gameId là bắt buộc' });
    }

    // Kiểm tra game thuộc về giáo viên và là wheel
    const game = await Game.findOne({
      _id: gameId,
      teacher: req.user._id,
      type: 'wheel',
    });

    if (!game) {
      return res.status(404).json({ message: 'Không tìm thấy vòng quay' });
    }

    // Lấy danh sách học sinh
    const filter = { teacher: req.user._id, status: 'active' };
    if (className) filter.className = className;
    if (studentIds && studentIds.length > 0) {
      filter._id = { $in: studentIds };
    }

    const students = await Student.find(filter).select('name').sort({ name: 1 });

    if (students.length === 0) {
      return res.status(400).json({ message: 'Không tìm thấy học sinh nào' });
    }

    const studentNames = students.map((s) => s.name);

    // mode: 'replace' = thay thế toàn bộ, 'append' = thêm vào (bỏ trùng)
    if (mode === 'replace') {
      game.items = studentNames;
    } else {
      const existing = new Set(game.items);
      const newItems = studentNames.filter((name) => !existing.has(name));
      game.items = [...game.items, ...newItems];
    }

    await game.save();

    res.json({
      success: true,
      game,
      addedCount: studentNames.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// GET /api/students/names - Lấy danh sách tên học sinh (dùng cho vòng quay)
router.get('/names', async (req, res) => {
  try {
    const { className } = req.query;
    const filter = { teacher: req.user._id, status: 'active' };
    if (className) filter.className = className;

    const students = await Student.find(filter).select('name className').sort({ name: 1 });

    res.json({ success: true, students });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// PATCH /api/students/:id/absent - Thêm hoặc xóa ngày nghỉ
router.patch('/:id/absent', async (req, res) => {
  try {
    const { date, action } = req.body; // action: 'add' | 'remove'
    if (!date || !['add', 'remove'].includes(action)) {
      return res.status(400).json({ message: 'Thiếu date hoặc action không hợp lệ' });
    }

    const student = await Student.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Không tìm thấy học sinh' });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    if (action === 'add') {
      const exists = student.absentDates.some(
        (d) => new Date(d).toDateString() === targetDate.toDateString()
      );
      if (!exists) student.absentDates.push(targetDate);
    } else {
      student.absentDates = student.absentDates.filter(
        (d) => new Date(d).toDateString() !== targetDate.toDateString()
      );
    }

    // Tính lại tỷ lệ đi học nếu có ngày bắt đầu học kỳ
    const settings = await TeacherSettings.findOne({ teacher: req.user._id });
    if (settings?.semesterStartDate) {
      const newAttendance = recalcAttendance(student.absentDates, settings.semesterStartDate);
      if (newAttendance !== null) student.attendance = newAttendance;
    }

    await student.save();
    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// POST /api/students/:id/recalculate - Tính lại điểm và bài tập từ ExamSubmission
router.post('/:id/recalculate', async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Không tìm thấy học sinh' });
    }

    // Tìm tất cả bài nộp của học sinh này (cho các đề của giáo viên)
    const submissions = await ExamSubmission.find({
      student: student._id,
      status: { $in: ['submitted', 'graded'] },
    }).populate({ path: 'exam', select: 'teacher totalPoints' });

    const teacherSubmissions = submissions.filter(
      (s) => s.exam && s.exam.teacher.toString() === req.user._id.toString()
    );

    // Tính điểm trung bình từ các bài đã chấm
    const gradedSubs = teacherSubmissions.filter(
      (s) => s.status === 'graded' && s.totalPoints > 0
    );
    let avgScore = 0;
    if (gradedSubs.length > 0) {
      const total = gradedSubs.reduce((sum, s) => sum + (s.score / s.totalPoints) * 10, 0);
      avgScore = Math.round((total / gradedSubs.length) * 10) / 10;
    }

    // Tổng số đề được giao cho học sinh
    const assignedTotal = await Exam.countDocuments({
      teacher: req.user._id,
      status: { $ne: 'draft' },
      $or: [
        { assignedStudents: student._id },
        { assignedClasses: { $in: student.className } },
      ],
    });

    student.score = avgScore;
    student.assignmentsCompleted = teacherSubmissions.length;
    student.assignmentsTotal = assignedTotal;
    await student.save();

    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// GET /api/students/:id - Lấy chi tiết 1 học sinh
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.id,
      teacher: req.user._id,
    });

    if (!student) {
      return res.status(404).json({ message: 'Không tìm thấy học sinh' });
    }

    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// POST /api/students - Thêm học sinh mới (liên kết hoặc tạo tài khoản User)
router.post('/', async (req, res) => {
  try {
    const { email, name, password, ...rest } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email là bắt buộc' });
    }

    // Tìm hoặc tạo tài khoản User
    let user = await User.findOne({ email: email.toLowerCase() });
    let isNewAccount = false;

    if (!user) {
      // Tạo tài khoản mới với mật khẩu do giáo viên cung cấp
      if (!password || password.length < 6) {
        return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
      }
      user = await User.create({
        email: email.toLowerCase(),
        password,
        name,
        role: 'student',
      });
      isNewAccount = true;
    }

    // Kiểm tra học sinh đã được giáo viên này thêm chưa
    const existingStudent = await Student.findOne({
      email: email.toLowerCase(),
      teacher: req.user._id,
    });
    if (existingStudent) {
      return res.status(400).json({ message: 'Học sinh với email này đã tồn tại trong danh sách của bạn' });
    }

    // Đảm bảo className luôn là array
    if (rest.className && typeof rest.className === 'string') {
      rest.className = [rest.className];
    }

    const student = await Student.create({
      ...rest,
      name,
      email: email.toLowerCase(),
      user: user._id,
      teacher: req.user._id,
    });

    res.status(201).json({ success: true, student, isNewAccount });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// PUT /api/students/:id - Cập nhật học sinh
router.put('/:id', async (req, res) => {
  try {
    if (req.body.className && typeof req.body.className === 'string') {
      req.body.className = [req.body.className];
    }

    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, teacher: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ message: 'Không tìm thấy học sinh' });
    }

    res.json({ success: true, student });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// DELETE /api/students/:id - Xóa học sinh
router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({
      _id: req.params.id,
      teacher: req.user._id,
    });

    if (!student) {
      return res.status(404).json({ message: 'Không tìm thấy học sinh' });
    }

    res.json({ success: true, message: 'Đã xóa học sinh' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

export default router;
