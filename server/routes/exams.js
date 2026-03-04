import express from 'express';
import Exam from '../models/Exam.js';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import ExamSubmission from '../models/ExamSubmission.js';
import protect from '../middleware/auth.js';
import authorize from '../middleware/role.js';

const router = express.Router();

router.use(protect, authorize('teacher', 'admin'));

// GET /api/exams - Lấy danh sách đề thi
router.get('/', async (req, res) => {
  try {
    const { status, subject, search } = req.query;
    const filter = { teacher: req.user._id };

    if (status) filter.status = status;
    if (subject) filter.subjectId = subject;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }

    const exams = await Exam.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, exams });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// GET /api/exams/stats - Thống kê
router.get('/stats', async (req, res) => {
  try {
    const teacherId = req.user._id;

    const result = await Exam.aggregate([
      { $match: { teacher: teacherId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
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

// GET /api/exams/classes - Lấy danh sách lớp của giáo viên
router.get('/classes', async (req, res) => {
  try {
    const classes = await Class.find({ teachers: req.user._id })
      .select('name students')
      .sort({ name: 1 });
    res.json({
      success: true,
      classes: classes.map((c) => ({ name: c.name, count: c.students.length })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// GET /api/exams/students-by-class - Lấy học sinh theo lớp
router.get('/students-by-class', async (req, res) => {
  try {
    const { className } = req.query;
    if (!className) {
      return res.status(400).json({ message: 'className là bắt buộc' });
    }
    const cls = await Class.findOne({ name: className, teachers: req.user._id });
    if (!cls) {
      return res.json({ success: true, students: [] });
    }
    const students = await Student.find({
      user: { $in: cls.students },
      teacher: req.user._id,
    }).select('name email className');
    res.json({ success: true, students });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// GET /api/exams/:id - Chi tiết đề thi
router.get('/:id', async (req, res) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!exam) {
      return res.status(404).json({ message: 'Không tìm thấy đề thi' });
    }
    res.json({ success: true, exam });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// POST /api/exams - Tạo đề thi mới
router.post('/', async (req, res) => {
  try {
    const body = { ...req.body, teacher: req.user._id };
    if (body.questions && Array.isArray(body.questions)) {
      body.questions = body.questions
        .filter((q) => q.question && String(q.question).trim())
        .map((q) => ({
          question: String(q.question).trim(),
          type: q.type || 'multiple-choice',
          answers: q.answers || [],
          correct: q.correct,
          points: q.points || 1,
        }));
    }
    const exam = await Exam.create(body);
    res.status(201).json({ success: true, exam });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// PUT /api/exams/:id - Cập nhật đề thi
router.put('/:id', async (req, res) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!exam) {
      return res.status(404).json({ message: 'Không tìm thấy đề thi' });
    }

    const { title, subject, subjectId, type, difficulty, duration, questions, topics, showAnswerAfterSubmit } = req.body;
    if (title !== undefined) exam.title = title;
    if (subject !== undefined) exam.subject = subject;
    if (subjectId !== undefined) exam.subjectId = subjectId;
    if (type !== undefined) exam.type = type;
    if (difficulty !== undefined) exam.difficulty = difficulty;
    if (duration !== undefined) exam.duration = duration;
    if (topics !== undefined) exam.topics = topics;
    if (showAnswerAfterSubmit !== undefined) exam.showAnswerAfterSubmit = showAnswerAfterSubmit;
    if (questions !== undefined) {
      exam.questions = questions
        .filter((q) => q.question && String(q.question).trim())
        .map((q) => ({
          question: String(q.question).trim(),
          type: q.type || 'multiple-choice',
          answers: q.answers || [],
          correct: q.correct,
          points: q.points || 1,
        }));
      exam.markModified('questions');
    }

    await exam.save();
    res.json({ success: true, exam });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// PATCH /api/exams/:id/status - Thay đổi trạng thái
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['draft', 'published', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    const exam = await Exam.findOneAndUpdate(
      { _id: req.params.id, teacher: req.user._id },
      { status },
      { new: true }
    );
    if (!exam) {
      return res.status(404).json({ message: 'Không tìm thấy đề thi' });
    }
    res.json({ success: true, exam });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// POST /api/exams/:id/assign - Giao đề thi
router.post('/:id/assign', async (req, res) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!exam) {
      return res.status(404).json({ message: 'Không tìm thấy đề thi' });
    }

    const { assignmentType, assignedClasses, assignedStudents, deadline, showAnswerAfterSubmit } = req.body;

    if (showAnswerAfterSubmit !== undefined) {
      exam.showAnswerAfterSubmit = showAnswerAfterSubmit;
    }

    if (!['class', 'student'].includes(assignmentType)) {
      return res.status(400).json({ message: 'Loại giao đề không hợp lệ' });
    }

    let studentCount = 0;

    if (assignmentType === 'class') {
      if (!assignedClasses || !assignedClasses.length) {
        return res.status(400).json({ message: 'Chưa chọn lớp nào' });
      }
      exam.assignmentType = 'class';
      exam.assignedClasses = assignedClasses;
      exam.assignedStudents = [];
      exam.className = assignedClasses.join(', ');

      const assignedClassDocs = await Class.find({ name: { $in: assignedClasses }, teachers: req.user._id }).select('students');
      studentCount = assignedClassDocs.reduce((sum, c) => sum + c.students.length, 0);
    } else {
      if (!assignedStudents || !assignedStudents.length) {
        return res.status(400).json({ message: 'Chưa chọn học sinh nào' });
      }
      exam.assignmentType = 'student';
      exam.assignedStudents = assignedStudents;
      exam.assignedClasses = [];

      // Get class names from selected students for display
      const students = await Student.find({
        _id: { $in: assignedStudents },
        teacher: req.user._id,
      }).select('className');
      const classNames = [...new Set(students.flatMap((s) => Array.isArray(s.className) ? s.className : [s.className]))];
      exam.className = classNames.join(', ');
      studentCount = assignedStudents.length;
    }

    exam.students = studentCount;
    exam.deadline = deadline ? new Date(deadline) : null;
    // Tự động publish khi giao đề
    if (exam.status === 'draft') {
      exam.status = 'published';
    }
    await exam.save();

    res.json({ success: true, exam });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// GET /api/exams/:id/assignment - Lấy thông tin giao đề
router.get('/:id/assignment', async (req, res) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, teacher: req.user._id })
      .populate('assignedStudents', 'name email className');
    if (!exam) {
      return res.status(404).json({ message: 'Không tìm thấy đề thi' });
    }

    res.json({
      success: true,
      assignment: {
        assignmentType: exam.assignmentType,
        assignedClasses: exam.assignedClasses,
        assignedStudents: exam.assignedStudents,
        studentCount: exam.students,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// GET /api/exams/:id/submissions - Danh sách bài nộp của đề thi
router.get('/:id/submissions', async (req, res) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!exam) {
      return res.status(404).json({ message: 'Không tìm thấy đề thi' });
    }

    const submissions = await ExamSubmission.find({ exam: exam._id })
      .populate('student', 'name email className')
      .sort({ submittedAt: -1 });

    const submissionList = submissions.map((s) => ({
      _id: s._id,
      student: s.student,
      status: s.status,
      score: s.score,
      mcScore: s.mcScore || 0,
      essayScore: s.essayScore || 0,
      totalPoints: s.totalPoints,
      totalEssayQuestions: s.totalEssayQuestions || 0,
      gradedEssayQuestions: s.gradedEssayQuestions || 0,
      timeSpent: s.timeSpent,
      submittedAt: s.submittedAt,
    }));

    res.json({ success: true, submissions: submissionList, exam: { title: exam.title, subject: exam.subject, totalPoints: exam.totalPoints } });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// GET /api/exams/:id/submissions/:submissionId - Chi tiết bài nộp (để chấm)
router.get('/:id/submissions/:submissionId', async (req, res) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!exam) {
      return res.status(404).json({ message: 'Không tìm thấy đề thi' });
    }

    const submission = await ExamSubmission.findOne({
      _id: req.params.submissionId,
      exam: exam._id,
    }).populate('student', 'name email className');

    if (!submission) {
      return res.status(404).json({ message: 'Không tìm thấy bài nộp' });
    }

    // Ghép câu hỏi với câu trả lời
    const questionsWithAnswers = exam.questions.map((q, index) => {
      const studentAnswer = submission.answers.find((a) => a.questionIndex === index);
      return {
        index,
        question: q.question,
        type: q.type,
        answers: q.answers,
        correct: q.correct,
        points: q.points || 1,
        studentAnswer: studentAnswer?.answer,
        studentEssay: studentAnswer?.essayAnswer,
        essayScore: studentAnswer?.essayScore,
        essayFeedback: studentAnswer?.essayFeedback,
        isCorrect: q.type === 'multiple-choice' ? studentAnswer?.answer === q.correct : null,
      };
    });

    res.json({
      success: true,
      submission: {
        _id: submission._id,
        student: submission.student,
        status: submission.status,
        score: submission.score,
        mcScore: submission.mcScore || 0,
        essayScore: submission.essayScore || 0,
        totalPoints: submission.totalPoints,
        totalEssayQuestions: submission.totalEssayQuestions || 0,
        gradedEssayQuestions: submission.gradedEssayQuestions || 0,
        timeSpent: submission.timeSpent,
        submittedAt: submission.submittedAt,
      },
      questions: questionsWithAnswers,
      exam: { title: exam.title, subject: exam.subject, totalPoints: exam.totalPoints },
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// PATCH /api/exams/:id/submissions/:submissionId/grade - Chấm bài tự luận
router.patch('/:id/submissions/:submissionId/grade', async (req, res) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!exam) {
      return res.status(404).json({ message: 'Không tìm thấy đề thi' });
    }

    const submission = await ExamSubmission.findOne({
      _id: req.params.submissionId,
      exam: exam._id,
    });

    if (!submission) {
      return res.status(404).json({ message: 'Không tìm thấy bài nộp' });
    }

    const { grades } = req.body;
    // grades: [{ questionIndex, score, feedback }]

    if (!grades || !Array.isArray(grades)) {
      return res.status(400).json({ message: 'Dữ liệu chấm điểm không hợp lệ' });
    }

    let totalEssayScore = 0;
    let gradedCount = 0;

    grades.forEach(({ questionIndex, score, feedback }) => {
      const answerIdx = submission.answers.findIndex((a) => a.questionIndex === questionIndex);
      if (answerIdx !== -1) {
        submission.answers[answerIdx].essayScore = score;
        submission.answers[answerIdx].essayFeedback = feedback || '';
        totalEssayScore += score;
        gradedCount++;
      }
    });

    // Tính lại tổng điểm tự luận theo thang totalPoints
    const totalQuestionPoints = exam.questions.reduce((sum, q) => sum + (q.points || 1), 0);
    const essayScoreScaled = totalQuestionPoints > 0
      ? Math.round((totalEssayScore / totalQuestionPoints) * exam.totalPoints * 100) / 100
      : 0;

    submission.essayScore = essayScoreScaled;
    submission.gradedEssayQuestions = gradedCount;
    submission.score = Math.round(((submission.mcScore || 0) + essayScoreScaled) * 100) / 100;
    submission.markModified('answers');

    // Nếu tất cả câu tự luận đã chấm → graded
    if (gradedCount >= submission.totalEssayQuestions) {
      submission.status = 'graded';
      // Cập nhật exam graded count
      await Exam.findByIdAndUpdate(exam._id, { $inc: { graded: 1 } });
    }

    await submission.save();

    res.json({ success: true, submission: {
      _id: submission._id,
      score: submission.score,
      mcScore: submission.mcScore,
      essayScore: submission.essayScore,
      status: submission.status,
      gradedEssayQuestions: submission.gradedEssayQuestions,
    }});
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// PATCH /api/exams/:id/settings - Cập nhật cài đặt đề thi (không cần chỉnh sửa toàn bộ)
router.patch('/:id/settings', async (req, res) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!exam) {
      return res.status(404).json({ message: 'Không tìm thấy đề thi' });
    }

    const { showAnswerAfterSubmit } = req.body;
    if (showAnswerAfterSubmit !== undefined) {
      exam.showAnswerAfterSubmit = showAnswerAfterSubmit;
    }

    await exam.save();
    res.json({ success: true, exam });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// POST /api/exams/:id/duplicate - Sao chép đề thi
router.post('/:id/duplicate', async (req, res) => {
  try {
    const original = await Exam.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!original) {
      return res.status(404).json({ message: 'Không tìm thấy đề thi' });
    }

    const copy = await Exam.create({
      title: `${original.title} (Bản sao)`,
      subject: original.subject,
      subjectId: original.subjectId,
      type: original.type,
      difficulty: original.difficulty,
      duration: original.duration,
      totalPoints: original.totalPoints,
      questions: original.questions,
      topics: original.topics,
      status: 'draft',
      teacher: req.user._id,
    });

    res.status(201).json({ success: true, exam: copy });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// DELETE /api/exams/:id - Xóa đề thi
router.delete('/:id', async (req, res) => {
  try {
    const exam = await Exam.findOneAndDelete({ _id: req.params.id, teacher: req.user._id });
    if (!exam) {
      return res.status(404).json({ message: 'Không tìm thấy đề thi' });
    }
    res.json({ success: true, message: 'Đã xóa đề thi' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

export default router;
