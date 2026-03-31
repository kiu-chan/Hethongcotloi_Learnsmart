import { useState, useEffect, useRef } from 'react';
import { FiX, FiPlus, FiTrash2, FiUsers, FiLoader, FiZap, FiEye, FiEyeOff, FiUpload, FiDownload } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { API_URL, getAuthHeaders } from './utils';
import MathDisplay from '../../../components/MathDisplay';

const callAI = async (prompt) => {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('authToken')}` },
    body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Lỗi server');
  return data.content;
};

const CreateGameModal = ({ type, onClose, onCreated, editGame = null }) => {
  const isEdit = !!editGame;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [quizForm, setQuizForm] = useState(() => {
    if (editGame && type === 'quiz') {
      return {
        title: editGame.title || '',
        subject: editGame.subject || '',
        duration: editGame.duration || 10,
        difficulty: editGame.difficulty || 'medium',
        questions: editGame.questions?.length > 0
          ? editGame.questions.map((q) => ({
              question: q.question || '',
              answers: Array.isArray(q.answers) && q.answers.length === 4
                ? q.answers.map((a) => String(a))
                : ['', '', '', ''],
              correct: typeof q.correct === 'number' ? q.correct : 0,
            }))
          : [{ question: '', answers: ['', '', '', ''], correct: 0 }],
      };
    }
    return {
      title: '',
      subject: '',
      duration: 10,
      difficulty: 'medium',
      questions: [{ question: '', answers: ['', '', '', ''], correct: 0 }],
    };
  });

  const [wheelForm, setWheelForm] = useState(() => {
    if (editGame && type === 'wheel') {
      return {
        title: editGame.title || '',
        color: editGame.color || 'blue',
        items: editGame.items?.length > 0 ? [...editGame.items] : ['', ''],
        wheelQuestions: editGame.wheelQuestions?.length > 0 ? [...editGame.wheelQuestions] : [],
        wheelMCQs: editGame.wheelMCQs?.length > 0
          ? editGame.wheelMCQs.map((q) => ({
              question: q.question || '',
              answers: Array.isArray(q.answers) && q.answers.length === 4 ? q.answers.map(String) : ['', '', '', ''],
              correct: typeof q.correct === 'number' ? q.correct : 0,
            }))
          : [],
      };
    }
    return {
      title: '',
      color: 'blue',
      items: ['', ''],
      wheelQuestions: [],
      wheelMCQs: [],
    };
  });

  const [wheelQuestionMode, setWheelQuestionMode] = useState(
    () => editGame && type === 'wheel'
      ? (editGame.wheelQuestions?.length || 0) > 0 || (editGame.wheelMCQs?.length || 0) > 0
      : false
  );
  const [wheelQuestionTab, setWheelQuestionTab] = useState('open');

  // File import state
  const quizFileInputRef = useRef(null);
  const [fileImporting, setFileImporting] = useState(false);
  const [fileImportError, setFileImportError] = useState('');

  const readAsArrayBuffer = (file) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = (e) => res(e.target.result);
      r.onerror = () => rej(new Error('Lỗi đọc file'));
      r.readAsArrayBuffer(file);
    });

  const parseQuestionsFromExcel = async (file) => {
    const ab = await readAsArrayBuffer(file);
    const wb = XLSX.read(ab, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
    // Skip rows until we find one that looks like questions (has at least 6 cells)
    const dataRows = rows.filter((r) => r.length >= 6 && r[0]);
    // Detect header row and skip it
    const start = /câu hỏi|question/i.test(String(dataRows[0]?.[0] ?? '')) ? 1 : 0;
    return dataRows.slice(start).map((row) => {
      const answers = [String(row[1] ?? ''), String(row[2] ?? ''), String(row[3] ?? ''), String(row[4] ?? '')];
      const correctLetter = String(row[5] ?? 'A').trim().toUpperCase();
      const correct = Math.max(0, correctLetter.charCodeAt(0) - 65);
      return { question: String(row[0] ?? ''), answers, correct: correct < 4 ? correct : 0 };
    }).filter((q) => q.question.trim());
  };

  const parseQuestionsFromWord = async (file) => {
    const ab = await readAsArrayBuffer(file);
    const result = await mammoth.extractRawText({ arrayBuffer: ab });
    const lines = result.value.split('\n').map((l) => l.trim()).filter(Boolean);
    const questions = [];
    let i = 0;
    while (i < lines.length) {
      const match = lines[i].match(/^câu\s*(\d+)\s*[:.)]\s*(.*)/i);
      if (!match) { i++; continue; }
      let questionText = match[2].trim();
      i++;
      const answers = [];
      let correct = 0;
      while (i < lines.length && !/^câu\s*\d+/i.test(lines[i])) {
        const ansMatch = lines[i].match(/^([A-Da-d])[.)\s]\s*(.+)/);
        const correctMatch = lines[i].match(/^đáp\s*án\s*[:.)]?\s*([A-Da-d])/i);
        if (ansMatch) { answers.push(ansMatch[2].trim()); }
        else if (correctMatch) { correct = correctMatch[1].toUpperCase().charCodeAt(0) - 65; }
        i++;
      }
      if (answers.length === 4) {
        questions.push({ question: questionText, answers, correct: correct < 4 ? correct : 0 });
      } else if (answers.length >= 2) {
        while (answers.length < 4) answers.push('');
        questions.push({ question: questionText, answers, correct: correct < 4 ? correct : 0 });
      }
    }
    return questions;
  };

  const parseQuestionsFromCsv = (text) => {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const start = /câu hỏi|question/i.test(lines[0]) ? 1 : 0;
    return lines.slice(start).map((line) => {
      const cols = line.split(',');
      const answers = [cols[1] ?? '', cols[2] ?? '', cols[3] ?? '', cols[4] ?? ''].map((c) => c.trim());
      const correctLetter = (cols[5] ?? 'A').trim().toUpperCase();
      const correct = Math.max(0, correctLetter.charCodeAt(0) - 65);
      return { question: (cols[0] ?? '').trim(), answers, correct: correct < 4 ? correct : 0 };
    }).filter((q) => q.question);
  };

  const handleQuizFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setFileImporting(true);
    setFileImportError('');
    try {
      const ext = file.name.split('.').pop().toLowerCase();
      let imported = [];
      if (['xlsx', 'xls'].includes(ext)) {
        imported = await parseQuestionsFromExcel(file);
      } else if (ext === 'docx') {
        imported = await parseQuestionsFromWord(file);
      } else if (ext === 'csv') {
        const text = await new Promise((res, rej) => {
          const r = new FileReader(); r.onload = (e) => res(e.target.result); r.onerror = rej; r.readAsText(file, 'UTF-8');
        });
        imported = parseQuestionsFromCsv(text);
      } else {
        setFileImportError('Chỉ hỗ trợ file .xlsx, .xls, .docx hoặc .csv');
        setFileImporting(false);
        return;
      }
      if (imported.length === 0) {
        setFileImportError('Không tìm thấy câu hỏi nào. Vui lòng kiểm tra định dạng file.');
      } else {
        setQuizForm((prev) => ({ ...prev, questions: imported }));
        setShowPreview(false);
        setFileImportError('');
      }
    } catch {
      setFileImportError('Lỗi đọc file. Vui lòng kiểm tra định dạng file.');
    }
    setFileImporting(false);
  };

  const downloadQuizSampleExcel = () => {
    const rows = [
      ['Câu hỏi', 'Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D', 'Đáp án đúng (A/B/C/D)'],
      ['2 + 2 = ?', '3', '4', '5', '6', 'B'],
      ['Thủ đô Việt Nam là?', 'TP.HCM', 'Đà Nẵng', 'Hà Nội', 'Huế', 'C'],
      ['$x^2 = 9$, nghiệm dương của x?', '2', '3', '4', '9', 'B'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 40 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 22 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Quiz');
    XLSX.writeFile(wb, 'quiz_mau.xlsx');
  };

  // AI generation state (quiz)
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState('medium');
  const [aiLoading, setAiLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // AI generation state (wheel questions)
  const [aiWheelTopic, setAiWheelTopic] = useState('');
  const [aiWheelCount, setAiWheelCount] = useState(10);
  const [aiWheelLoading, setAiWheelLoading] = useState(false);

  const addQuestion = () => {
    setQuizForm((prev) => ({
      ...prev,
      questions: [...prev.questions, { question: '', answers: ['', '', '', ''], correct: 0 }],
    }));
  };

  const removeQuestion = (index) => {
    if (quizForm.questions.length <= 1) return;
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const updateQuestion = (qIndex, field, value) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === qIndex ? { ...q, [field]: value } : q)),
    }));
  };

  const updateAnswer = (qIndex, aIndex, value) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === qIndex ? { ...q, answers: q.answers.map((a, j) => (j === aIndex ? value : a)) } : q
      ),
    }));
  };

  const addWheelItem = () => {
    setWheelForm((prev) => ({ ...prev, items: [...prev.items, ''] }));
  };

  const removeWheelItem = (index) => {
    if (wheelForm.items.length <= 2) return;
    setWheelForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const addWheelQuestion = () => {
    setWheelForm((prev) => ({ ...prev, wheelQuestions: [...prev.wheelQuestions, ''] }));
  };

  const removeWheelQuestion = (index) => {
    setWheelForm((prev) => ({ ...prev, wheelQuestions: prev.wheelQuestions.filter((_, i) => i !== index) }));
  };

  const updateWheelQuestion = (index, value) => {
    setWheelForm((prev) => ({
      ...prev,
      wheelQuestions: prev.wheelQuestions.map((q, i) => (i === index ? value : q)),
    }));
  };

  const addWheelMCQ = () => {
    setWheelForm((prev) => ({
      ...prev,
      wheelMCQs: [...prev.wheelMCQs, { question: '', answers: ['', '', '', ''], correct: 0 }],
    }));
  };

  const removeWheelMCQ = (index) => {
    setWheelForm((prev) => ({ ...prev, wheelMCQs: prev.wheelMCQs.filter((_, i) => i !== index) }));
  };

  const updateWheelMCQ = (index, field, value) => {
    setWheelForm((prev) => ({
      ...prev,
      wheelMCQs: prev.wheelMCQs.map((q, i) => (i === index ? { ...q, [field]: value } : q)),
    }));
  };

  const updateWheelMCQAnswer = (qIndex, aIndex, value) => {
    setWheelForm((prev) => ({
      ...prev,
      wheelMCQs: prev.wheelMCQs.map((q, i) =>
        i === qIndex ? { ...q, answers: q.answers.map((a, j) => (j === aIndex ? value : a)) } : q
      ),
    }));
  };

  // AI generation state (wheel MCQs)
  const [aiWheelMCQTopic, setAiWheelMCQTopic] = useState('');
  const [aiWheelMCQCount, setAiWheelMCQCount] = useState(5);
  const [aiWheelMCQLoading, setAiWheelMCQLoading] = useState(false);

  const generateWheelMCQsWithAI = async () => {
    if (!aiWheelMCQTopic.trim()) return;
    setAiWheelMCQLoading(true);
    setError('');
    try {
      const prompt = `Tạo ${aiWheelMCQCount} câu hỏi trắc nghiệm ngắn gọn về chủ đề "${aiWheelMCQTopic}" để dùng trong trò chơi vòng quay lớp học.
Mỗi câu hỏi có 4 đáp án (A, B, C, D), chỉ 1 đáp án đúng. Câu hỏi nên ngắn gọn, phù hợp với lớp học.
Trả về mảng JSON (KHÔNG có markdown, KHÔNG có \`\`\`json):
[{"question":"Câu hỏi?","answers":["Đáp án A","Đáp án B","Đáp án C","Đáp án D"],"correct":0}]
Trong đó "correct" là index (0-3) của đáp án đúng. Chỉ trả về JSON thuần túy.`;
      const text = await callAI(prompt);
      const generated = JSON.parse(sanitizeJSONText(text));
      if (Array.isArray(generated) && generated.length > 0) {
        const valid = generated.map((q) => ({
          question: q.question || '',
          answers: Array.isArray(q.answers) && q.answers.length === 4 ? q.answers.map(String) : ['', '', '', ''],
          correct: typeof q.correct === 'number' && q.correct >= 0 && q.correct <= 3 ? q.correct : 0,
        }));
        setWheelForm((prev) => ({ ...prev, wheelMCQs: valid }));
      }
    } catch {
      setError('Không thể tạo câu hỏi bằng AI. Vui lòng thử lại.');
    } finally {
      setAiWheelMCQLoading(false);
    }
  };

  const generateWheelQuestionsWithAI = async () => {
    if (!aiWheelTopic.trim()) return;
    setAiWheelLoading(true);
    setError('');
    try {
      const prompt = `Tạo ${aiWheelCount} câu hỏi ngắn dạng mở về chủ đề "${aiWheelTopic}" để giáo viên đặt câu hỏi trực tiếp cho học sinh trong lớp (không phải trắc nghiệm).
Câu hỏi nên ngắn gọn, rõ ràng, kích thích tư duy.
Trả về mảng JSON các chuỗi câu hỏi (KHÔNG có markdown, KHÔNG có \`\`\`json):
["Câu hỏi 1?","Câu hỏi 2?"...]
Chỉ trả về JSON thuần túy, không thêm bất kỳ text nào khác.`;
      const text = await callAI(prompt);
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const generated = JSON.parse(cleaned);
      if (Array.isArray(generated) && generated.length > 0) {
        const wheelQuestions = generated.map((q) => String(q)).filter((q) => q.trim());
        setWheelForm((prev) => ({ ...prev, wheelQuestions }));
      }
    } catch (err) {
      setError('Không thể tạo câu hỏi bằng AI. Vui lòng thử lại.');
      console.error('AI generate wheel questions error:', err);
    } finally {
      setAiWheelLoading(false);
    }
  };

  // Import students
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    if (type !== 'wheel') return;
    const fetchClasses = async () => {
      try {
        const res = await fetch('/api/students/stats', { headers: getAuthHeaders() });
        const data = await res.json();
        if (data.success) setClasses(data.stats.classes || []);
      } catch {
        // ignore
      }
    };
    fetchClasses();
  }, [type]);

  const importStudents = async () => {
    setLoadingStudents(true);
    try {
      const url = selectedClass
        ? `/api/students/names?className=${encodeURIComponent(selectedClass)}`
        : '/api/students/names';
      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success && data.students.length > 0) {
        const names = data.students.map((s) => s.name);
        const existing = new Set(wheelForm.items.filter((i) => i.trim()));
        const newNames = names.filter((n) => !existing.has(n));
        setWheelForm((prev) => ({
          ...prev,
          items: [...prev.items.filter((i) => i.trim()), ...newNames].length >= 2
            ? [...prev.items.filter((i) => i.trim()), ...newNames]
            : [...prev.items.filter((i) => i.trim()), ...newNames, ''],
        }));
      } else {
        setError('Không tìm thấy học sinh nào');
      }
    } catch {
      setError('Lỗi khi tải danh sách học sinh');
    }
    setLoadingStudents(false);
  };

  // Sanitize JSON text từ AI - loại bỏ ký tự điều khiển trong string literals
  const sanitizeJSONText = (text) => {
    let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    cleaned = cleaned.replace(/"((?:[^"\\]|\\.)*)"/g, (_match, content) => {
      const sanitized = content
        .replace(/[\x00-\x1F]/g, (ch) => {
          switch (ch) {
            case '\n': return '\\n';
            case '\r': return '\\r';
            case '\t': return '\\t';
            default: return '';
          }
        });
      return `"${sanitized}"`;
    });
    return cleaned;
  };

  // AI generate quiz questions
  const generateWithAI = async () => {
    if (!aiTopic.trim()) return;
    setAiLoading(true);
    setError('');
    try {
      const difficultyText = aiDifficulty === 'easy' ? 'dễ' : aiDifficulty === 'medium' ? 'trung bình' : 'khó';
      const prompt = `Tạo ${aiCount} câu hỏi trắc nghiệm về chủ đề "${aiTopic}" cho học sinh, độ khó ${difficultyText}.
Mỗi câu hỏi có 4 đáp án (A, B, C, D), chỉ 1 đáp án đúng.

QUAN TRỌNG - CÔNG THỨC TOÁN/HÓA/LÝ: Sử dụng cú pháp LaTeX với ký hiệu $ để bao quanh công thức.
- Công thức inline: $công_thức$ (VD: $x^{2}+1$, $\\frac{a}{b}$, $\\sqrt{x}$, $\\alpha$)
- Công thức block (căn giữa): $$công_thức$$ (VD: $$\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$)
- VD câu hỏi: "Tìm nghiệm của phương trình $x^{2} - 5x + 6 = 0$"
- VD đáp án: "$x = 2$ hoặc $x = 3$"
- Hóa học: "$H_2SO_4$", "$Fe + 2HCl \\rightarrow FeCl_2 + H_2\\uparrow$"
- Vật lý: "$F = ma$", "$E = mc^{2}$", "$v = \\frac{s}{t}$"
- Lưu ý: trong JSON, ký tự \\ phải được escape thành \\\\ (VD: "\\\\frac", "\\\\sqrt")

ĐỊNH DẠNG TRẢ VỀ (JSON):
Trả về một mảng JSON với định dạng sau (KHÔNG có markdown, KHÔNG có \`\`\`json):
[{"question":"Câu hỏi?","answers":["Đáp án A","Đáp án B","Đáp án C","Đáp án D"],"correct":0}]
Trong đó "correct" là index (0-3) của đáp án đúng.

CHÚ Ý: Chỉ trả về JSON thuần túy, không thêm bất kỳ text nào khác.`;

      const text = await callAI(prompt);
      const generated = JSON.parse(sanitizeJSONText(text));

      if (Array.isArray(generated) && generated.length > 0) {
        const validQuestions = generated.map((q) => ({
          question: q.question || '',
          answers: Array.isArray(q.answers) && q.answers.length === 4
            ? q.answers.map((a) => String(a))
            : ['', '', '', ''],
          correct: typeof q.correct === 'number' && q.correct >= 0 && q.correct <= 3 ? q.correct : 0,
        }));
        setQuizForm((prev) => ({
          ...prev,
          questions: validQuestions,
          difficulty: aiDifficulty,
        }));
        if (!quizForm.title.trim()) {
          setQuizForm((prev) => ({ ...prev, title: aiTopic }));
        }
        if (!quizForm.subject.trim()) {
          setQuizForm((prev) => ({ ...prev, subject: aiTopic }));
        }
        setShowPreview(true);
      }
    } catch (err) {
      setError('Không thể tạo câu hỏi bằng AI. Vui lòng thử lại.');
      console.error('AI generate error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const body = type === 'quiz'
        ? { type: 'quiz', ...quizForm }
        : {
            type: 'wheel',
            ...wheelForm,
            items: wheelForm.items.filter((i) => i.trim()),
            wheelQuestions: wheelQuestionMode ? wheelForm.wheelQuestions.filter((q) => q.trim()) : [],
            wheelMCQs: wheelQuestionMode ? wheelForm.wheelMCQs.filter((q) => q.question.trim()) : [],
          };

      if (type === 'quiz') {
        const emptyQ = quizForm.questions.find((q) => !q.question.trim() || q.answers.some((a) => !a.trim()));
        if (emptyQ) {
          setError('Vui lòng điền đầy đủ câu hỏi và đáp án');
          setSubmitting(false);
          return;
        }
      } else {
        const validItems = wheelForm.items.filter((i) => i.trim());
        if (validItems.length < 2) {
          setError('Vòng quay cần ít nhất 2 phần tử');
          setSubmitting(false);
          return;
        }
      }

      const url = isEdit ? `${API_URL}/${editGame._id}` : API_URL;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Có lỗi xảy ra');
        setSubmitting(false);
        return;
      }

      onCreated();
    } catch {
      setError('Lỗi kết nối server');
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {isEdit
              ? (type === 'quiz' ? 'Sửa Quiz' : 'Sửa Vòng quay')
              : (type === 'quiz' ? 'Tạo Quiz mới' : 'Tạo Vòng quay mới')}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <FiX className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {type === 'quiz' ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={quizForm.title}
                    onChange={(e) => setQuizForm((p) => ({ ...p, title: e.target.value }))}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: Ôn tập Hàm số"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Môn học</label>
                  <input
                    type="text"
                    value={quizForm.subject}
                    onChange={(e) => setQuizForm((p) => ({ ...p, subject: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: Toán học"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian (phút)</label>
                  <input
                    type="number"
                    min="1"
                    value={quizForm.duration}
                    onChange={(e) => setQuizForm((p) => ({ ...p, duration: Number(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Độ khó</label>
                  <select
                    value={quizForm.difficulty}
                    onChange={(e) => setQuizForm((p) => ({ ...p, difficulty: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="easy">Dễ</option>
                    <option value="medium">Trung bình</option>
                    <option value="hard">Khó</option>
                  </select>
                </div>
              </div>

              {/* Import from file */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-emerald-700 font-medium">
                    <FiUpload className="w-4 h-4" />
                    Nhập câu hỏi từ file
                  </div>
                  <button
                    type="button"
                    onClick={downloadQuizSampleExcel}
                    className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    <FiDownload className="w-3.5 h-3.5" />
                    Tải file mẫu (.xlsx)
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => quizFileInputRef.current?.click()}
                    disabled={fileImporting}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {fileImporting
                      ? <FiLoader className="w-4 h-4 animate-spin" />
                      : <FiUpload className="w-4 h-4" />}
                    {fileImporting ? 'Đang đọc...' : 'Chọn file'}
                  </button>
                  <span className="text-xs text-emerald-600">Hỗ trợ: .xlsx, .xls, .docx, .csv</span>
                  <input
                    type="file"
                    ref={quizFileInputRef}
                    onChange={handleQuizFileImport}
                    accept=".xlsx,.xls,.docx,.csv"
                    className="hidden"
                  />
                </div>
                {fileImportError && (
                  <p className="mt-2 text-sm text-red-600">{fileImportError}</p>
                )}
                <div className="mt-2 text-xs text-emerald-700 space-y-0.5">
                  <p><strong>Excel/CSV:</strong> Cột 1: Câu hỏi | Cột 2–5: Đáp án A–D | Cột 6: Đáp án đúng (A/B/C/D)</p>
                  <p><strong>Word:</strong> Câu 1: ... → A. ... B. ... C. ... D. ... → Đáp án: B</p>
                </div>
              </div>

              {/* AI Generate */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center gap-2 text-blue-700 font-medium mb-3">
                  <FiZap className="w-4 h-4" />
                  Tạo câu hỏi bằng AI
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="Nhập chủ đề, VD: Phương trình bậc 2"
                    className="flex-1 px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  />
                  <input
                    type="number"
                    min={2}
                    max={20}
                    value={aiCount}
                    onChange={(e) => setAiCount(Number(e.target.value))}
                    className="w-16 px-3 py-2 border border-blue-200 rounded-lg text-sm text-center outline-none"
                    title="Số câu hỏi"
                  />
                  <select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value)}
                    className="px-3 py-2 border border-blue-200 rounded-lg text-sm outline-none bg-white"
                    title="Độ khó"
                  >
                    <option value="easy">Dễ</option>
                    <option value="medium">TB</option>
                    <option value="hard">Khó</option>
                  </select>
                  <button
                    type="button"
                    onClick={generateWithAI}
                    disabled={aiLoading || !aiTopic.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors text-sm whitespace-nowrap"
                  >
                    {aiLoading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiZap className="w-4 h-4" />}
                    Tạo
                  </button>
                </div>
              </div>

              <div className="border-t pt-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">Câu hỏi ({quizForm.questions.length})</h3>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                        showPreview ? 'text-blue-600 hover:text-blue-700' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {showPreview ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                      {showPreview ? 'Ẩn xem trước' : 'Xem trước'}
                    </button>
                    <button type="button" onClick={addQuestion} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
                      <FiPlus className="w-4 h-4" /> Thêm câu hỏi
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {quizForm.questions.map((q, qIndex) => (
                    <div key={qIndex} className="p-4 bg-gray-50 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-600">Câu {qIndex + 1}</span>
                        {quizForm.questions.length > 1 && (
                          <button type="button" onClick={() => removeQuestion(qIndex)} className="text-red-500 hover:text-red-600">
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {showPreview ? (
                        /* Preview mode - render LaTeX */
                        <div>
                          <p className="font-medium text-gray-800 mb-3">
                            <MathDisplay text={q.question} />
                          </p>
                          <div className="space-y-2">
                            {q.answers.map((a, aIndex) => {
                              const isCorrect = aIndex === q.correct;
                              return (
                                <div
                                  key={aIndex}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                                    isCorrect ? 'bg-green-50 border border-green-300' : 'bg-white border border-gray-200'
                                  }`}
                                >
                                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    isCorrect ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                                  }`}>
                                    {String.fromCharCode(65 + aIndex)}
                                  </span>
                                  <MathDisplay text={a} />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        /* Edit mode - input fields */
                        <>
                          <input
                            type="text"
                            value={q.question}
                            onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                            placeholder="Nhập câu hỏi..."
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            {q.answers.map((a, aIndex) => (
                              <div key={aIndex} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correct-${qIndex}`}
                                  checked={q.correct === aIndex}
                                  onChange={() => updateQuestion(qIndex, 'correct', aIndex)}
                                  className="text-blue-500 focus:ring-blue-500"
                                />
                                <input
                                  type="text"
                                  value={a}
                                  onChange={(e) => updateAnswer(qIndex, aIndex, e.target.value)}
                                  placeholder={`Đáp án ${String.fromCharCode(65 + aIndex)}`}
                                  className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                                    q.correct === aIndex ? 'border-green-400 bg-green-50' : 'border-gray-200'
                                  }`}
                                />
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500">Chọn radio để đánh dấu đáp án đúng</p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={wheelForm.title}
                  onChange={(e) => setWheelForm((p) => ({ ...p, title: e.target.value }))}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="VD: Vòng quay kiến thức"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Màu sắc</label>
                <div className="flex gap-3">
                  {[
                    { value: 'blue', bg: 'bg-blue-500' },
                    { value: 'green', bg: 'bg-green-500' },
                    { value: 'purple', bg: 'bg-purple-500' },
                    { value: 'red', bg: 'bg-red-500' },
                    { value: 'orange', bg: 'bg-orange-500' },
                  ].map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setWheelForm((p) => ({ ...p, color: c.value }))}
                      className={`w-10 h-10 rounded-full ${c.bg} transition-all ${
                        wheelForm.color === c.value ? 'ring-4 ring-offset-2 ring-gray-300 scale-110' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Import students */}
              <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <FiUsers className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-800">Thêm học sinh từ danh sách</span>
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="flex-1 px-3 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="">Tất cả lớp</option>
                    {classes.map((c) => (
                      <option key={c.name} value={c.name}>{c.name} ({c.count} HS)</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={importStudents}
                    disabled={loadingStudents}
                    className="flex items-center gap-1.5 px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 disabled:opacity-50 transition-colors"
                  >
                    {loadingStudents ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiUsers className="w-4 h-4" />}
                    <span>Thêm</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Các phần tử ({wheelForm.items.filter((i) => i.trim()).length})</label>
                  <button type="button" onClick={addWheelItem} className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium">
                    <FiPlus className="w-4 h-4" /> Thêm
                  </button>
                </div>
                <div className="space-y-2">
                  {wheelForm.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-500">{index + 1}</span>
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => setWheelForm((p) => ({ ...p, items: p.items.map((v, i) => (i === index ? e.target.value : v)) }))}
                        placeholder={`Phần tử ${index + 1}`}
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      {wheelForm.items.length > 2 && (
                        <button type="button" onClick={() => removeWheelItem(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                          <FiX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Question Mode */}
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <FiZap className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-semibold text-orange-800">Chế độ câu hỏi</span>
                    </div>
                    <p className="text-xs text-orange-600 mt-0.5">Hiển thị câu hỏi ngẫu nhiên sau khi quay chọn người</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setWheelQuestionMode((prev) => {
                        if (!prev && wheelForm.wheelQuestions.length === 0) {
                          setWheelForm((f) => ({ ...f, wheelQuestions: [''] }));
                        }
                        return !prev;
                      });
                    }}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                      wheelQuestionMode ? 'bg-orange-500' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      wheelQuestionMode ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {wheelQuestionMode && (
                  <div className="mt-4 space-y-3">
                    {/* Tabs */}
                    <div className="flex gap-1 bg-orange-100 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => setWheelQuestionTab('open')}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          wheelQuestionTab === 'open'
                            ? 'bg-white text-orange-700 shadow-sm'
                            : 'text-orange-600 hover:text-orange-700'
                        }`}
                      >
                        Câu hỏi mở ({wheelForm.wheelQuestions.filter((q) => q.trim()).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setWheelQuestionTab('mcq')}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          wheelQuestionTab === 'mcq'
                            ? 'bg-white text-orange-700 shadow-sm'
                            : 'text-orange-600 hover:text-orange-700'
                        }`}
                      >
                        Trắc nghiệm ({wheelForm.wheelMCQs.length})
                      </button>
                    </div>

                    {wheelQuestionTab === 'open' ? (
                      <>
                        {/* AI generate open questions */}
                        <div className="bg-white rounded-lg p-3 border border-orange-100">
                          <div className="flex items-center gap-2 text-orange-700 font-medium mb-2 text-sm">
                            <FiZap className="w-3.5 h-3.5" />
                            Tạo câu hỏi mở bằng AI
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={aiWheelTopic}
                              onChange={(e) => setAiWheelTopic(e.target.value)}
                              placeholder="Nhập chủ đề, VD: Địa lý Việt Nam"
                              className="flex-1 px-3 py-2 border border-orange-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-400"
                            />
                            <input
                              type="number"
                              min={2}
                              max={30}
                              value={aiWheelCount}
                              onChange={(e) => setAiWheelCount(Number(e.target.value))}
                              className="w-16 px-3 py-2 border border-orange-200 rounded-lg text-sm text-center outline-none"
                              title="Số câu hỏi"
                            />
                            <button
                              type="button"
                              onClick={generateWheelQuestionsWithAI}
                              disabled={aiWheelLoading || !aiWheelTopic.trim()}
                              className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors whitespace-nowrap"
                            >
                              {aiWheelLoading ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiZap className="w-3.5 h-3.5" />}
                              Tạo
                            </button>
                          </div>
                        </div>

                        {/* Open question list */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              Danh sách ({wheelForm.wheelQuestions.filter((q) => q.trim()).length})
                            </span>
                            <button
                              type="button"
                              onClick={addWheelQuestion}
                              className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-medium"
                            >
                              <FiPlus className="w-4 h-4" /> Thêm
                            </button>
                          </div>
                          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {wheelForm.wheelQuestions.map((question, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <span className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center text-xs font-bold text-orange-600 flex-shrink-0">
                                  {index + 1}
                                </span>
                                <input
                                  type="text"
                                  value={question}
                                  onChange={(e) => updateWheelQuestion(index, e.target.value)}
                                  placeholder={`Câu hỏi ${index + 1}...`}
                                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeWheelQuestion(index)}
                                  className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded flex-shrink-0"
                                >
                                  <FiX className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* AI generate MCQs */}
                        <div className="bg-white rounded-lg p-3 border border-orange-100">
                          <div className="flex items-center gap-2 text-orange-700 font-medium mb-2 text-sm">
                            <FiZap className="w-3.5 h-3.5" />
                            Tạo trắc nghiệm bằng AI
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={aiWheelMCQTopic}
                              onChange={(e) => setAiWheelMCQTopic(e.target.value)}
                              placeholder="Nhập chủ đề, VD: Lịch sử Việt Nam"
                              className="flex-1 px-3 py-2 border border-orange-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-400"
                            />
                            <input
                              type="number"
                              min={2}
                              max={20}
                              value={aiWheelMCQCount}
                              onChange={(e) => setAiWheelMCQCount(Number(e.target.value))}
                              className="w-16 px-3 py-2 border border-orange-200 rounded-lg text-sm text-center outline-none"
                              title="Số câu hỏi"
                            />
                            <button
                              type="button"
                              onClick={generateWheelMCQsWithAI}
                              disabled={aiWheelMCQLoading || !aiWheelMCQTopic.trim()}
                              className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors whitespace-nowrap"
                            >
                              {aiWheelMCQLoading ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiZap className="w-3.5 h-3.5" />}
                              Tạo
                            </button>
                          </div>
                        </div>

                        {/* MCQ list */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              Danh sách ({wheelForm.wheelMCQs.length})
                            </span>
                            <button
                              type="button"
                              onClick={addWheelMCQ}
                              className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-medium"
                            >
                              <FiPlus className="w-4 h-4" /> Thêm câu
                            </button>
                          </div>
                          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                            {wheelForm.wheelMCQs.map((q, qIndex) => (
                              <div key={qIndex} className="bg-orange-50 rounded-lg p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-orange-600">Câu {qIndex + 1}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeWheelMCQ(qIndex)}
                                    className="text-red-400 hover:text-red-500"
                                  >
                                    <FiTrash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  value={q.question}
                                  onChange={(e) => updateWheelMCQ(qIndex, 'question', e.target.value)}
                                  placeholder="Nhập câu hỏi..."
                                  className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                />
                                <div className="grid grid-cols-2 gap-1.5">
                                  {q.answers.map((a, aIndex) => (
                                    <div key={aIndex} className="flex items-center gap-1.5">
                                      <input
                                        type="radio"
                                        name={`wheel-mcq-correct-${qIndex}`}
                                        checked={q.correct === aIndex}
                                        onChange={() => updateWheelMCQ(qIndex, 'correct', aIndex)}
                                        className="text-orange-500 focus:ring-orange-400"
                                      />
                                      <input
                                        type="text"
                                        value={a}
                                        onChange={(e) => updateWheelMCQAnswer(qIndex, aIndex, e.target.value)}
                                        placeholder={`Đáp án ${String.fromCharCode(65 + aIndex)}`}
                                        className={`flex-1 px-2 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-orange-400 ${
                                          q.correct === aIndex ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'
                                        }`}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors">
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 ${
                type === 'quiz'
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-purple-500 hover:bg-purple-600'
              }`}
            >
              {submitting
                ? (isEdit ? 'Đang lưu...' : 'Đang tạo...')
                : isEdit
                  ? 'Lưu thay đổi'
                  : (type === 'quiz' ? 'Tạo Quiz' : 'Tạo Vòng quay')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGameModal;
