import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
} from 'docx';

const difficultyMap = { easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' };
const typeMap = { 'multiple-choice': 'Trắc nghiệm', essay: 'Tự luận', mixed: 'Hỗn hợp' };
const reverseDifficultyMap = { 'Dễ': 'easy', 'Trung bình': 'medium', 'Khó': 'hard' };
const reverseTypeMap = { 'Trắc nghiệm': 'multiple-choice', 'Tự luận': 'essay', 'Hỗn hợp': 'mixed' };

/**
 * Export an exam to an Excel file (.xlsx)
 * Format is designed to be re-importable
 */
export function exportExamToExcel(exam) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Exam Info
  const infoData = [
    ['Thông tin đề thi'],
    ['Tên đề thi', exam.title],
    ['Môn học', exam.subject],
    ['Mã môn', exam.subjectId || ''],
    ['Loại đề', typeMap[exam.type] || exam.type],
    ['Độ khó', difficultyMap[exam.difficulty] || exam.difficulty],
    ['Thời gian (phút)', exam.duration],
    ['Chủ đề', (exam.topics || []).join(', ')],
  ];
  const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
  wsInfo['!cols'] = [{ wch: 20 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsInfo, 'Thông tin');

  // Sheet 2: Questions
  const questionHeaders = ['STT', 'Câu hỏi', 'Loại', 'Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D', 'Đáp án đúng', 'Điểm'];
  const questionRows = (exam.questions || []).map((q, i) => {
    const answers = q.answers || [];
    const correctLetter = q.correct != null ? String.fromCharCode(65 + q.correct) : '';
    return [
      i + 1,
      q.question,
      q.type === 'multiple-choice' ? 'Trắc nghiệm' : 'Tự luận',
      answers[0] || '',
      answers[1] || '',
      answers[2] || '',
      answers[3] || '',
      q.type === 'multiple-choice' ? correctLetter : '',
      q.points || 1,
    ];
  });

  const wsQuestions = XLSX.utils.aoa_to_sheet([questionHeaders, ...questionRows]);
  wsQuestions['!cols'] = [
    { wch: 5 }, { wch: 50 }, { wch: 15 },
    { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 30 },
    { wch: 12 }, { wch: 8 },
  ];
  XLSX.utils.book_append_sheet(wb, wsQuestions, 'Câu hỏi');

  const fileName = `${exam.title.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF ]/g, '_')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Parse an uploaded Excel file into exam data
 * Returns { info, questions } or throws error
 */
export function parseExamFromExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });

        // Parse info sheet
        const infoSheet = wb.Sheets[wb.SheetNames[0]];
        const infoRows = XLSX.utils.sheet_to_json(infoSheet, { header: 1 });

        const getValue = (label) => {
          const row = infoRows.find((r) => r[0] === label);
          return row ? (row[1] || '') : '';
        };

        const info = {
          title: getValue('Tên đề thi'),
          subject: getValue('Môn học'),
          subjectId: getValue('Mã môn'),
          type: reverseTypeMap[getValue('Loại đề')] || 'multiple-choice',
          difficulty: reverseDifficultyMap[getValue('Độ khó')] || 'medium',
          duration: parseInt(getValue('Thời gian (phút)')) || 90,
          topics: getValue('Chủ đề') ? getValue('Chủ đề').split(',').map((t) => t.trim()).filter(Boolean) : [],
        };

        // Parse questions sheet
        const questionsSheet = wb.Sheets[wb.SheetNames[1]];
        if (!questionsSheet) {
          resolve({ info, questions: [] });
          return;
        }

        const questionRows = XLSX.utils.sheet_to_json(questionsSheet, { header: 1 });
        // Skip header row
        const questions = questionRows.slice(1)
          .filter((row) => row[1]) // must have question text
          .map((row) => {
            const qType = row[2] === 'Tự luận' ? 'essay' : 'multiple-choice';
            const answers = qType === 'multiple-choice'
              ? [row[3] || '', row[4] || '', row[5] || '', row[6] || ''].filter(Boolean)
              : [];

            let correct = 0;
            if (qType === 'multiple-choice' && row[7]) {
              const letter = String(row[7]).trim().toUpperCase();
              correct = letter.charCodeAt(0) - 65;
              if (correct < 0 || correct >= answers.length) correct = 0;
            }

            return {
              question: String(row[1]),
              type: qType,
              answers,
              correct: qType === 'multiple-choice' ? correct : undefined,
              points: parseInt(row[8]) || 1,
            };
          });

        resolve({ info, questions });
      } catch (err) {
        reject(new Error('Không thể đọc file Excel. Vui lòng kiểm tra định dạng file.'));
      }
    };
    reader.onerror = () => reject(new Error('Lỗi đọc file'));
    reader.readAsArrayBuffer(file);
  });
}

// ─────────────────────────────────────────────
// Word (.docx) support
// ─────────────────────────────────────────────

/**
 * Generate a sample Word template (.docx) for downloading
 */
export async function downloadWordSample() {
  const sampleQuestions = [
    {
      no: 1, type: 'Trắc nghiệm',
      question: 'Nội dung câu hỏi trắc nghiệm số 1?',
      answers: ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'],
      correct: 'A', points: 1,
    },
    {
      no: 2, type: 'Trắc nghiệm',
      question: 'Nội dung câu hỏi trắc nghiệm số 2?',
      answers: ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'],
      correct: 'B', points: 1,
    },
    {
      no: 3, type: 'Tự luận',
      question: 'Nội dung câu hỏi tự luận số 3?',
      answers: [], correct: '', points: 5,
    },
  ];

  const bold = (text) => new TextRun({ text, bold: true });
  const normal = (text) => new TextRun({ text });

  const infoSection = [
    new Paragraph({ text: 'THÔNG TIN ĐỀ THI', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
    new Paragraph({ children: [bold('Tên đề thi: '), normal('Đề thi mẫu')] }),
    new Paragraph({ children: [bold('Môn học: '), normal('Toán học')] }),
    new Paragraph({ children: [bold('Mã môn: '), normal('MATH001')] }),
    new Paragraph({ children: [bold('Loại đề: '), normal('Trắc nghiệm')] }),
    new Paragraph({ children: [bold('Độ khó: '), normal('Trung bình')] }),
    new Paragraph({ children: [bold('Thời gian (phút): '), normal('45')] }),
    new Paragraph({ children: [bold('Chủ đề: '), normal('Đại số, Hình học')] }),
    new Paragraph({ text: '' }),
  ];

  const questionSection = [
    new Paragraph({ text: 'CÂU HỎI', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
    new Paragraph({ text: '' }),
  ];

  for (const q of sampleQuestions) {
    questionSection.push(
      new Paragraph({ children: [bold(`Câu ${q.no}: `), normal(q.question)] }),
    );
    if (q.type === 'Trắc nghiệm') {
      const letters = ['A', 'B', 'C', 'D'];
      for (let i = 0; i < q.answers.length; i++) {
        questionSection.push(new Paragraph({ text: `${letters[i]}. ${q.answers[i]}` }));
      }
      questionSection.push(new Paragraph({ children: [bold('Đáp án: '), normal(q.correct)] }));
    } else {
      questionSection.push(new Paragraph({ text: '[Tự luận]' }));
    }
    questionSection.push(new Paragraph({ children: [bold('Điểm: '), normal(String(q.points))] }));
    questionSection.push(new Paragraph({ text: '' }));
  }

  const noteSection = [
    new Paragraph({ text: 'HƯỚNG DẪN ĐỊNH DẠNG', heading: HeadingLevel.HEADING_2 }),
    new Paragraph({ text: '• Giữ đúng tiêu đề "Câu N:" để hệ thống nhận diện câu hỏi.' }),
    new Paragraph({ text: '• Đáp án trắc nghiệm dùng A. / B. / C. / D. (viết thường cũng được).' }),
    new Paragraph({ text: '• Câu tự luận: không cần lựa chọn, ghi [Tự luận] hoặc bỏ trống dòng đáp án.' }),
    new Paragraph({ text: '• Trường "Đáp án:" ghi chữ cái đáp án đúng (A, B, C hoặc D).' }),
    new Paragraph({ text: '• Trường "Điểm:" ghi số nguyên.' }),
    new Paragraph({ text: '• Các trường thông tin đề thi phải nằm trước phần CÂU HỎI.' }),
  ];

  const doc = new Document({
    sections: [{
      children: [...infoSection, ...questionSection, ...noteSection],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'de_thi_mau.docx';
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Parse an uploaded Word (.docx) file into exam data
 * Expected format: see sample template
 * Returns { info, questions } or throws error
 */
export function parseExamFromWord(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;
        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = result.value;

        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

        // ── Parse info block ─────────────────────────
        const getField = (label) => {
          const line = lines.find((l) => l.toLowerCase().startsWith(label.toLowerCase()));
          if (!line) return '';
          return line.slice(label.length).replace(/^:\s*/, '').trim();
        };

        const info = {
          title: getField('Tên đề thi'),
          subject: getField('Môn học'),
          subjectId: getField('Mã môn'),
          type: reverseTypeMap[getField('Loại đề')] || 'multiple-choice',
          difficulty: reverseDifficultyMap[getField('Độ khó')] || 'medium',
          duration: parseInt(getField('Thời gian (phút)')) || 90,
          topics: getField('Chủ đề')
            ? getField('Chủ đề').split(',').map((t) => t.trim()).filter(Boolean)
            : [],
        };

        // ── Parse questions ───────────────────────────
        // Find start of question section
        const qStartIdx = lines.findIndex(
          (l) => /^câu\s+1\s*:/i.test(l) || /^câu hỏi\s*$/i.test(l),
        );

        const questions = [];
        if (qStartIdx !== -1) {
          let i = qStartIdx;
          while (i < lines.length) {
            const cauhMatch = lines[i].match(/^câu\s+(\d+)\s*:(.*)/i);
            if (!cauhMatch) { i++; continue; }

            let questionText = cauhMatch[2].trim();
            i++;

            const answers = [];
            let correct = 0;
            let points = 1;
            let isEssay = false;

            while (i < lines.length && !/^câu\s+\d+\s*:/i.test(lines[i])) {
              const line = lines[i];
              const ansMatch = line.match(/^([A-Da-d])[.\s)]\s*(.+)/);
              const answerMatch = line.match(/^đáp\s+án\s*:\s*([A-Da-d])/i);
              const pointMatch = line.match(/^điểm\s*:\s*(\d+)/i);
              const essayMatch = /^\[tự luận\]$/i.test(line);

              if (essayMatch) {
                isEssay = true;
              } else if (ansMatch && !answerMatch) {
                answers.push(ansMatch[2].trim());
              } else if (answerMatch) {
                const letter = answerMatch[1].toUpperCase();
                correct = letter.charCodeAt(0) - 65;
                if (correct < 0) correct = 0;
              } else if (pointMatch) {
                points = parseInt(pointMatch[1]) || 1;
              } else if (!questionText && line) {
                questionText += ' ' + line;
              }
              i++;
            }

            const qType = isEssay || answers.length === 0 ? 'essay' : 'multiple-choice';
            questions.push({
              question: questionText,
              type: qType,
              answers: qType === 'multiple-choice' ? answers : [],
              correct: qType === 'multiple-choice' ? correct : undefined,
              points,
            });
          }
        }

        if (!info.title && !info.subject && questions.length === 0) {
          throw new Error('Không tìm thấy nội dung đề thi. Vui lòng kiểm tra định dạng file.');
        }

        resolve({ info, questions });
      } catch (err) {
        reject(new Error(err.message || 'Không thể đọc file Word. Vui lòng kiểm tra định dạng file.'));
      }
    };
    reader.onerror = () => reject(new Error('Lỗi đọc file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generate a sample Excel template and trigger download
 */
export function downloadExcelSample() {
  const sampleExam = {
    title: 'Đề thi mẫu',
    subject: 'Toán học',
    subjectId: 'MATH001',
    type: 'multiple-choice',
    difficulty: 'medium',
    duration: 45,
    topics: ['Đại số', 'Hình học'],
    questions: [
      {
        question: 'Nội dung câu hỏi trắc nghiệm số 1?',
        type: 'multiple-choice',
        answers: ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'],
        correct: 0,
        points: 1,
      },
      {
        question: 'Nội dung câu hỏi trắc nghiệm số 2?',
        type: 'multiple-choice',
        answers: ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'],
        correct: 1,
        points: 1,
      },
      {
        question: 'Nội dung câu hỏi tự luận số 3?',
        type: 'essay',
        answers: [],
        correct: undefined,
        points: 5,
      },
    ],
  };
  exportExamToExcel(sampleExam);
}
