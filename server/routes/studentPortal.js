import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import Exam from '../models/Exam.js';
import ExamSubmission from '../models/ExamSubmission.js';
import StudentGame from '../models/StudentGame.js';
import Homework from '../models/Homework.js';
import HomeworkSubmission from '../models/HomeworkSubmission.js';
import User from '../models/User.js';
import Document from '../models/Document.js';
import protect from '../middleware/auth.js';
import authorize from '../middleware/role.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const homeworkUploadDir = path.join(__dirname, '..', 'uploads', 'homework');
if (!fs.existsSync(homeworkUploadDir)) {
  fs.mkdirSync(homeworkUploadDir, { recursive: true });
}

const homeworkStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, homeworkUploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const homeworkFileFilter = (req, file, cb) => {
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

const uploadHomework = multer({
  storage: homeworkStorage,
  fileFilter: homeworkFileFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
});

const router = express.Router();

router.use(protect, authorize('student'));

// Helper: tìm Student document từ User._id
const getStudent = async (userId) => {
  return Student.findOne({ user: userId, status: 'active' });
};

// Helper: lấy danh sách lớp học của học sinh từ Class model
const getStudentClasses = async (userId) => {
  return Class.find({ students: userId })
    .populate('teachers', 'name email avatar')
    .populate('homeroomTeacher', 'name email avatar')
    .sort({ name: 1 });
};

// GET /api/student-portal/classroom - Thông tin lớp học
router.get('/classroom', async (req, res) => {
  try {
    const classes = await getStudentClasses(req.user._id);

    if (classes.length === 0) {
      return res.status(404).json({ message: 'Chưa được thêm vào lớp nào' });
    }

    const classNames = classes.map((c) => c.name);

    // Lấy tên học sinh từ User model
    const studentUser = await User.findById(req.user._id).select('name email');

    // Gom tất cả User ID của bạn cùng lớp (trừ bản thân)
    const classmateIds = [
      ...new Set(classes.flatMap((c) => c.students.map((id) => id.toString()))),
    ].filter((id) => id !== req.user._id.toString());

    // Lấy thông tin bạn cùng lớp kèm className
    const classmateUsers = await User.find({ _id: { $in: classmateIds } }).select('name email');
    const classmates = classmateUsers.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      className: classes
        .filter((c) => c.students.some((s) => s.toString() === u._id.toString()))
        .map((c) => c.name),
    }));

    // Lấy giáo viên chủ nhiệm từ lớp đầu tiên có giáo viên chủ nhiệm
    let homeroomTeacher = null;
    for (const c of classes) {
      if (c.homeroomTeacher) {
        homeroomTeacher = c.homeroomTeacher;
        break;
      }
    }
    const teacher = homeroomTeacher
      ? { name: homeroomTeacher.name, email: homeroomTeacher.email, avatar: homeroomTeacher.avatar }
      : null;

    res.json({
      success: true,
      classroom: {
        className: classNames,
        studentName: studentUser?.name || '',
        studentId: req.user._id,
        teacher,
        classmates,
        totalStudents: classmateIds.length + 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// GET /api/student-portal/exams - Danh sách bài tập được giao
router.get('/exams', async (req, res) => {
  try {
    const classes = await getStudentClasses(req.user._id);
    const classNames = classes.map((c) => c.name);
    const teacherIds = [...new Set(classes.flatMap((c) => c.teachers.map((t) => t._id.toString())))];

    const student = await getStudent(req.user._id);

    if (classNames.length === 0 && !student) {
      return res.json({ success: true, exams: [] });
    }

    const orConditions = [];
    if (classNames.length > 0) {
      orConditions.push({ assignmentType: 'class', assignedClasses: { $in: classNames } });
    }
    if (student) {
      orConditions.push({ assignmentType: 'student', assignedStudents: student._id });
    }

    const exams = await Exam.find({
      status: 'published',
      ...(teacherIds.length > 0 && { teacher: { $in: teacherIds } }),
      $or: orConditions,
    })
      .select('title subject type difficulty duration totalPoints deadline questions assignmentType assignedClasses scheduledDate scheduledTime')
      .sort({ createdAt: -1 });

    // Lấy submissions của học sinh (nếu có profile)
    const examIds = exams.map((e) => e._id);
    const submissions = student
      ? await ExamSubmission.find({ exam: { $in: examIds }, student: student._id }).select(
          'exam status score mcScore essayScore totalPoints submittedAt totalEssayQuestions gradedEssayQuestions'
        )
      : [];

    const submissionMap = {};
    submissions.forEach((s) => { submissionMap[s.exam.toString()] = s; });

    const examList = exams.map((exam) => {
      const submission = submissionMap[exam._id.toString()];
      return {
        _id: exam._id,
        title: exam.title,
        subject: exam.subject,
        type: exam.type,
        difficulty: exam.difficulty,
        duration: exam.duration,
        totalPoints: exam.totalPoints,
        totalQuestions: exam.questions?.length || 0,
        deadline: exam.deadline,
        scheduledDate: exam.scheduledDate,
        scheduledTime: exam.scheduledTime,
        assignmentType: exam.assignmentType,
        assignedClasses: exam.assignedClasses,
        submission: submission
          ? {
              status: submission.status,
              score: submission.score,
              mcScore: submission.mcScore || 0,
              essayScore: submission.essayScore || 0,
              totalPoints: submission.totalPoints,
              submittedAt: submission.submittedAt,
              totalEssayQuestions: submission.totalEssayQuestions || 0,
              gradedEssayQuestions: submission.gradedEssayQuestions || 0,
            }
          : null,
      };
    });

    res.json({ success: true, exams: examList });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// GET /api/student-portal/exams/:id - Chi tiết đề thi (để làm bài)
router.get('/exams/:id', async (req, res) => {
  try {
    const student = await getStudent(req.user._id);
    if (!student) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin học sinh' });
    }

    const classes = await getStudentClasses(req.user._id);
    const classNames = classes.map((c) => c.name);
    const teacherIds = [...new Set(classes.flatMap((c) => c.teachers.map((t) => t._id.toString())))];

    const exam = await Exam.findOne({
      _id: req.params.id,
      status: 'published',
      ...(teacherIds.length > 0 && { teacher: { $in: teacherIds } }),
      $or: [
        { assignmentType: 'class', assignedClasses: { $in: classNames } },
        { assignmentType: 'student', assignedStudents: student._id },
      ],
    });

    if (!exam) {
      return res.status(404).json({ message: 'Không tìm thấy đề thi' });
    }

    // Kiểm tra hạn nộp
    if (exam.deadline && new Date(exam.deadline) < new Date()) {
      return res.status(400).json({ message: 'Đã hết hạn nộp bài' });
    }

    // Kiểm tra đã nộp chưa
    const existingSubmission = await ExamSubmission.findOne({
      exam: exam._id,
      student: student._id,
    });

    if (existingSubmission && ['submitted', 'graded'].includes(existingSubmission.status)) {
      return res.status(400).json({ message: 'Bạn đã nộp bài thi này rồi' });
    }

    // Trả về questions KHÔNG kèm correct answer
    const questions = exam.questions.map((q, index) => ({
      index,
      question: q.question,
      type: q.type,
      answers: q.answers,
      points: q.points,
    }));

    // Tạo hoặc lấy submission đang làm
    let submission = existingSubmission;
    if (!submission) {
      submission = await ExamSubmission.create({
        exam: exam._id,
        student: student._id,
        totalPoints: exam.totalPoints,
        startedAt: new Date(),
      });
    }

    res.json({
      success: true,
      exam: {
        _id: exam._id,
        title: exam.title,
        subject: exam.subject,
        type: exam.type,
        duration: exam.duration,
        totalPoints: exam.totalPoints,
        showAnswerAfterSubmit: exam.showAnswerAfterSubmit !== false,
        questions,
      },
      submission: {
        _id: submission._id,
        startedAt: submission.startedAt,
        answers: submission.answers,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// POST /api/student-portal/exams/:id/submit - Nộp bài
router.post('/exams/:id/submit', async (req, res) => {
  try {
    const student = await getStudent(req.user._id);
    if (!student) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin học sinh' });
    }

    const classes = await getStudentClasses(req.user._id);
    const teacherIds = [...new Set(classes.flatMap((c) => c.teachers.map((t) => t._id.toString())))];

    const exam = await Exam.findOne({
      _id: req.params.id,
      status: 'published',
      ...(teacherIds.length > 0 && { teacher: { $in: teacherIds } }),
    });

    if (!exam) {
      return res.status(404).json({ message: 'Không tìm thấy đề thi' });
    }

    const submission = await ExamSubmission.findOne({
      exam: exam._id,
      student: student._id,
    });

    if (!submission) {
      return res.status(400).json({ message: 'Chưa bắt đầu làm bài' });
    }

    if (submission.status === 'submitted') {
      return res.status(400).json({ message: 'Bạn đã nộp bài rồi' });
    }

    const { answers, timeSpent } = req.body;

    // Tự động chấm điểm trắc nghiệm
    let mcRawScore = 0;
    const totalPoints = exam.totalPoints;
    let totalEssayQuestions = 0;

    if (answers && Array.isArray(answers)) {
      answers.forEach((ans) => {
        const question = exam.questions[ans.questionIndex];
        if (!question) return;

        if (question.type === 'multiple-choice' && ans.answer !== undefined) {
          if (ans.answer === question.correct) {
            mcRawScore += question.points || 1;
          }
        } else if (question.type === 'essay') {
          totalEssayQuestions++;
        }
      });
    }

    // Tính điểm trắc nghiệm theo thang totalPoints
    const totalQuestionPoints = exam.questions.reduce((sum, q) => sum + (q.points || 1), 0);
    const mcScore = totalQuestionPoints > 0
      ? Math.round((mcRawScore / totalQuestionPoints) * totalPoints * 100) / 100
      : 0;

    const hasEssay = totalEssayQuestions > 0;

    submission.answers = answers || [];
    submission.mcScore = mcScore;
    submission.essayScore = 0;
    submission.score = mcScore; // tạm = mcScore, sẽ cộng essayScore khi chấm
    submission.totalPoints = totalPoints;
    submission.totalEssayQuestions = totalEssayQuestions;
    submission.gradedEssayQuestions = 0;
    submission.timeSpent = timeSpent || 0;
    submission.submittedAt = new Date();
    submission.status = hasEssay ? 'submitted' : 'graded';
    await submission.save();

    // Cập nhật exam submitted count
    await Exam.findByIdAndUpdate(exam._id, { $inc: { submitted: 1 } });

    // Trả về kết quả
    const showAnswer = exam.showAnswerAfterSubmit !== false;
    const results = exam.questions.map((q, index) => {
      const studentAnswer = (answers || []).find((a) => a.questionIndex === index);
      return {
        index,
        question: q.question,
        type: q.type,
        answers: q.answers,
        correct: showAnswer && q.type === 'multiple-choice' ? q.correct : null,
        studentAnswer: studentAnswer?.answer,
        studentEssay: studentAnswer?.essayAnswer,
        isCorrect: showAnswer && q.type === 'multiple-choice'
          ? studentAnswer?.answer === q.correct
          : null,
        points: q.points || 1,
      };
    });

    res.json({
      success: true,
      result: {
        score: mcScore,
        totalPoints,
        status: submission.status,
        showAnswerAfterSubmit: showAnswer,
        results,
        timeSpent: submission.timeSpent,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// GET /api/student-portal/dashboard - Tổng quan trang chủ học sinh
router.get('/dashboard', async (req, res) => {
  try {
    const classes = await getStudentClasses(req.user._id);
    const classNames = classes.map((c) => c.name);
    const teacherIds = [...new Set(classes.flatMap((c) => c.teachers.map((t) => t._id.toString())))];
    const student = await getStudent(req.user._id);

    // Tài khoản mới chưa được thêm vào lớp
    if (classNames.length === 0 && !student) {
      return res.json({
        success: true,
        newAccount: true,
        student: {
          name: req.user.name || req.user.email,
          className: [],
          teacher: null,
        },
        stats: { totalExams: 0, completedExams: 0, pendingExams: 0, avgScore: null },
        upcomingExams: [],
        recentSubmissions: [],
      });
    }

    const firstTeacher = classes[0]?.teachers?.[0];
    const teacherName = firstTeacher?.name || null;

    const orConditions = [];
    if (classNames.length > 0) {
      orConditions.push({ assignmentType: 'class', assignedClasses: { $in: classNames } });
    }
    if (student) {
      orConditions.push({ assignmentType: 'student', assignedStudents: student._id });
    }

    const exams = orConditions.length > 0
      ? await Exam.find({
          status: 'published',
          ...(teacherIds.length > 0 && { teacher: { $in: teacherIds } }),
          $or: orConditions,
        }).select('_id title subject type difficulty duration totalPoints deadline scheduledDate scheduledTime').lean()
      : [];

    const examIds = exams.map((e) => e._id);

    const submissions = student
      ? await ExamSubmission.find({ student: student._id, exam: { $in: examIds } })
          .select('exam status score totalPoints submittedAt').lean()
      : [];

    const submissionMap = {};
    submissions.forEach((s) => { submissionMap[s.exam.toString()] = s; });

    const completedSubmissions = submissions.filter((s) => s.status === 'submitted' || s.status === 'graded');
    const pendingExams = exams.filter((e) => !submissionMap[e._id.toString()]);

    const gradedSubmissions = submissions.filter((s) => s.status === 'graded' && s.totalPoints > 0);
    const avgScore =
      gradedSubmissions.length > 0
        ? Math.round(
            (gradedSubmissions.reduce((sum, s) => sum + (s.score / s.totalPoints) * 10, 0) /
              gradedSubmissions.length) * 10
          ) / 10
        : null;

    const now = new Date();
    const upcoming = pendingExams
      .filter((e) => !e.deadline || new Date(e.deadline) > now)
      .sort((a, b) => {
        const da = a.deadline ? new Date(a.deadline) : new Date('2099-01-01');
        const db = b.deadline ? new Date(b.deadline) : new Date('2099-01-01');
        return da - db;
      })
      .slice(0, 5)
      .map((e) => ({
        _id: e._id, title: e.title, subject: e.subject, type: e.type,
        difficulty: e.difficulty, duration: e.duration, totalPoints: e.totalPoints, deadline: e.deadline,
      }));

    const recentSubmissions = student
      ? await ExamSubmission.find({ student: student._id, status: { $in: ['submitted', 'graded'] } })
          .sort({ submittedAt: -1 }).limit(5)
          .populate('exam', 'title subject totalPoints')
          .select('exam status score totalPoints submittedAt').lean()
      : [];

    res.json({
      success: true,
      student: {
        name: student?.name || req.user.name,
        className: classNames,
        teacher: teacherName,
      },
      stats: {
        totalExams: exams.length,
        completedExams: completedSubmissions.length,
        pendingExams: pendingExams.length,
        avgScore,
      },
      upcomingExams: upcoming,
      recentSubmissions: recentSubmissions.map((s) => ({
        _id: s._id,
        examTitle: s.exam?.title || 'Đề thi',
        subject: s.exam?.subject || '',
        status: s.status,
        score: s.score,
        totalPoints: s.totalPoints || s.exam?.totalPoints || 10,
        submittedAt: s.submittedAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// PATCH /api/student-portal/exams/:id/save-progress - Lưu tiến trình làm bài (chưa nộp)
router.patch('/exams/:id/save-progress', async (req, res) => {
  try {
    const student = await getStudent(req.user._id);
    if (!student) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin học sinh' });
    }

    const submission = await ExamSubmission.findOne({
      exam: req.params.id,
      student: student._id,
      status: { $nin: ['submitted', 'graded'] },
    });

    if (!submission) {
      return res.status(400).json({ message: 'Không tìm thấy bài làm hoặc đã nộp' });
    }

    const { answers } = req.body;
    if (answers && Array.isArray(answers)) {
      submission.answers = answers;
      await submission.save();
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// ==================== GAMES ====================

// GET /api/student-portal/games - Danh sách bộ thẻ
router.get('/games', async (req, res) => {
  try {
    const { type } = req.query;
    const filter = { student: req.user._id };
    if (type) filter.type = type;

    const games = await StudentGame.find(filter).sort({ updatedAt: -1 });
    const totalPlays = games.reduce((sum, g) => sum + g.plays, 0);

    res.json({ success: true, games, stats: { total: games.length, totalPlays } });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// POST /api/student-portal/games - Tạo bộ thẻ mới
router.post('/games', async (req, res) => {
  try {
    const { title, type, cards, gridSize } = req.body;
    const game = await StudentGame.create({
      student: req.user._id,
      title,
      type,
      cards,
      gridSize: gridSize || 4,
    });
    res.status(201).json({ success: true, game });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tạo trò chơi', error: error.message });
  }
});

// PUT /api/student-portal/games/:id - Sửa bộ thẻ
router.put('/games/:id', async (req, res) => {
  try {
    const game = await StudentGame.findOneAndUpdate(
      { _id: req.params.id, student: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!game) return res.status(404).json({ message: 'Không tìm thấy trò chơi' });
    res.json({ success: true, game });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật', error: error.message });
  }
});

// DELETE /api/student-portal/games/:id - Xóa bộ thẻ
router.delete('/games/:id', async (req, res) => {
  try {
    const game = await StudentGame.findOneAndDelete({ _id: req.params.id, student: req.user._id });
    if (!game) return res.status(404).json({ message: 'Không tìm thấy trò chơi' });
    res.json({ success: true, message: 'Đã xóa trò chơi' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi xóa', error: error.message });
  }
});

// POST /api/student-portal/games/:id/play - Lưu kết quả chơi
router.post('/games/:id/play', async (req, res) => {
  try {
    const { time, score } = req.body;
    const game = await StudentGame.findOne({ _id: req.params.id, student: req.user._id });
    if (!game) return res.status(404).json({ message: 'Không tìm thấy trò chơi' });

    game.plays += 1;
    if (time && (game.bestTime === null || time < game.bestTime)) game.bestTime = time;
    if (score !== undefined && (game.bestScore === null || score > game.bestScore)) game.bestScore = score;
    await game.save();

    res.json({ success: true, game });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lưu kết quả', error: error.message });
  }
});

// ==================== HOMEWORK ====================

// GET /api/student-portal/homework - Danh sách bài tập được giao
router.get('/homework', async (req, res) => {
  try {
    const classes = await getStudentClasses(req.user._id);
    const classNames = classes.map((c) => c.name);
    const teacherIds = [...new Set(classes.flatMap((c) => c.teachers.map((t) => t._id.toString())))];

    if (classNames.length === 0 && teacherIds.length === 0) {
      return res.json({ success: true, homeworks: [] });
    }

    const homeworks = await Homework.find({
      status: 'published',
      ...(teacherIds.length > 0 && { teacher: { $in: teacherIds } }),
      $or: [
        { assignmentType: 'class', assignedClasses: { $in: classNames } },
        { assignmentType: 'student', assignedStudents: req.user._id },
      ],
    })
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 });

    // Lấy submission của học sinh
    const submissionMap = {};
    const submissions = await HomeworkSubmission.find({
      student: req.user._id,
      homework: { $in: homeworks.map((h) => h._id) },
    }).select('homework status teacherComment submittedAt gradedAt');
    submissions.forEach((s) => { submissionMap[s.homework.toString()] = s; });

    const list = homeworks.map((h) => ({
      ...h.toObject(),
      submission: submissionMap[h._id.toString()] || null,
    }));

    res.json({ success: true, homeworks: list });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// POST /api/student-portal/homework/:id/submit - Nộp bài tập
router.post('/homework/:id/submit', uploadHomework.array('files', 5), async (req, res) => {
  try {
    const classes = await getStudentClasses(req.user._id);
    const classNames = classes.map((c) => c.name);
    const teacherIds = [...new Set(classes.flatMap((c) => c.teachers.map((t) => t._id.toString())))];

    const homework = await Homework.findOne({
      _id: req.params.id,
      status: 'published',
      ...(teacherIds.length > 0 && { teacher: { $in: teacherIds } }),
      $or: [
        { assignmentType: 'class', assignedClasses: { $in: classNames } },
        { assignmentType: 'student', assignedStudents: req.user._id },
      ],
    });

    if (!homework) {
      return res.status(404).json({ message: 'Không tìm thấy bài tập' });
    }

    if (homework.deadline && new Date(homework.deadline) < new Date()) {
      return res.status(400).json({ message: 'Đã hết hạn nộp bài' });
    }

    const existing = await HomeworkSubmission.findOne({ homework: homework._id, student: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'Bạn đã nộp bài tập này rồi' });
    }

    const files = (req.files || []).map((f) => ({
      originalName: f.originalname,
      filePath: f.filename,
      mimeType: f.mimetype,
      size: f.size,
    }));

    const submission = await HomeworkSubmission.create({
      homework: homework._id,
      student: req.user._id,
      files,
      note: req.body.note || '',
    });

    res.status(201).json({ success: true, submission });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// GET /api/student-portal/homework/:id/submission - Xem bài nộp của bản thân
router.get('/homework/:id/submission', async (req, res) => {
  try {
    const submission = await HomeworkSubmission.findOne({
      homework: req.params.id,
      student: req.user._id,
    });

    if (!submission) {
      return res.json({ success: true, submission: null });
    }

    res.json({ success: true, submission });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// ==================== DOCUMENTS ====================

// GET /api/student-portal/documents - Tài liệu được chia sẻ cho lớp
router.get('/documents', async (req, res) => {
  try {
    const classes = await getStudentClasses(req.user._id);
    const classNames = classes.map((c) => c.name);
    const teacherIds = [...new Set(classes.flatMap((c) => c.teachers.map((t) => t._id.toString())))];

    if (classNames.length === 0) {
      return res.json({ success: true, documents: [] });
    }

    const documents = await Document.find({
      ...(teacherIds.length > 0 && { teacher: { $in: teacherIds } }),
      sharedClasses: { $in: classNames },
    })
      .select('name originalName type size formattedSize sharedClasses label createdAt filePath url')
      .sort({ createdAt: -1 });

    res.json({ success: true, documents });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// GET /api/student-portal/documents/:id/download - Tải tài liệu được chia sẻ
router.get('/documents/:id/download', async (req, res) => {
  try {
    const classes = await getStudentClasses(req.user._id);
    const classNames = classes.map((c) => c.name);
    const teacherIds = [...new Set(classes.flatMap((c) => c.teachers.map((t) => t._id.toString())))];

    const doc = await Document.findOne({
      _id: req.params.id,
      ...(teacherIds.length > 0 && { teacher: { $in: teacherIds } }),
      sharedClasses: { $in: classNames },
    });

    if (!doc) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu hoặc chưa được chia sẻ' });
    }

    // Link type: trả về URL để client mở
    if (doc.type === 'link') {
      return res.json({ success: true, url: doc.url });
    }

    const uploadDir = path.join(__dirname, '..', 'uploads');
    const filePath = path.join(uploadDir, doc.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File không tồn tại' });
    }

    res.download(filePath, doc.originalName || doc.name);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

export default router;

