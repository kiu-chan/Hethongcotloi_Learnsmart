import express from 'express';
import OpenAI from 'openai';
import protect from '../middleware/auth.js';
import authorize from '../middleware/role.js';

const router = express.Router();

router.use(protect);

// /multiple-choice, /essay, /summarize chỉ dành cho teacher và admin
router.use(['/multiple-choice', '/essay', '/summarize'], authorize('teacher', 'admin'));

let openai;
const getOpenAI = () => {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
};

/**
 * Sanitize JSON text từ AI
 */
const sanitizeJSONText = (text) => {
  let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  cleaned = cleaned.replace(/"((?:[^"\\]|\\.)*)"/g, (_match, content) => {
    const sanitized = content.replace(/[\x00-\x1F]/g, (ch) => {
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

// POST /api/ai/multiple-choice - Tạo câu hỏi trắc nghiệm
router.post('/multiple-choice', async (req, res) => {
  try {
    const { content, numberOfQuestions = 10, difficulty = 'medium', subject = '', topics = [], instructions = '' } = req.body;

    const difficultyMap = { easy: 'dễ', medium: 'trung bình', hard: 'khó' };

    const prompt = `
Bạn là một giáo viên chuyên nghiệp. Hãy tạo ${numberOfQuestions} câu hỏi trắc nghiệm từ nội dung sau:

THÔNG TIN:
- Môn học: ${subject || 'Tổng hợp'}
- Chủ đề: ${topics.length > 0 ? topics.join(', ') : 'Tổng hợp'}
- Độ khó: ${difficultyMap[difficulty]}
- Số câu hỏi: ${numberOfQuestions}

NỘI DUNG TÀI LIỆU:
${content}
${instructions ? `\nHƯỚNG DẪN BỔ SUNG TỪ GIÁO VIÊN:\n${instructions}\n` : ''}
YÊU CẦU:
1. Mỗi câu hỏi phải có 4 đáp án (A, B, C, D)
2. Chỉ có 1 đáp án đúng
3. Câu hỏi phải rõ ràng, chính xác và phù hợp với độ khó đã chọn
4. Đáp án phải hợp lý và có tính nhiễu cao
5. Phải có giải thích ngắn gọn cho đáp án đúng
6. QUAN TRỌNG - CÔNG THỨC TOÁN/HÓA/LÝ: Sử dụng cú pháp LaTeX với ký hiệu $ để bao quanh công thức.
   - Công thức inline: $công_thức$ (VD: $x^{2}+1$, $\\frac{a}{b}$, $\\sqrt{x}$, $\\alpha$)
   - Công thức block (căn giữa): $$công_thức$$ (VD: $$\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$)
   - VD câu hỏi: "Tìm nghiệm của phương trình $x^{2} - 5x + 6 = 0$"
   - VD đáp án: "$x = 2$ hoặc $x = 3$"
   - Hóa học: "$H_2SO_4$", "$Fe + 2HCl \\rightarrow FeCl_2 + H_2\\uparrow$"
   - Vật lý: "$F = ma$", "$E = mc^{2}$", "$v = \\frac{s}{t}$"
   - Lưu ý: trong JSON, ký tự \\ phải được escape thành \\\\ (VD: "\\\\frac", "\\\\sqrt")

ĐỊNH DẠNG TRẢ VỀ (JSON):
Trả về một mảng JSON với định dạng sau (KHÔNG có markdown, KHÔNG có \`\`\`json):
[
  {
    "question": "Nội dung câu hỏi (dùng $...$ cho công thức)?",
    "options": [
      {"label": "A", "text": "Đáp án A (dùng $...$ cho công thức)"},
      {"label": "B", "text": "Đáp án B"},
      {"label": "C", "text": "Đáp án C"},
      {"label": "D", "text": "Đáp án D"}
    ],
    "correctAnswer": "A",
    "explanation": "Giải thích tại sao đáp án này đúng",
    "points": 1,
    "difficulty": "${difficulty}",
    "topic": "Tên chủ đề cụ thể"
  }
]

CHÚ Ý: Chỉ trả về JSON thuần túy, không thêm bất kỳ text nào khác.
`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
    });
    const text = response.choices[0].message.content;
    const questions = JSON.parse(sanitizeJSONText(text));

    res.json({ success: true, questions, totalQuestions: questions.length });
  } catch (error) {
    console.error('Error generating multiple choice questions:', error);
    res.status(500).json({ success: false, error: error.message || 'Không thể tạo câu hỏi từ AI' });
  }
});

// POST /api/ai/essay - Tạo câu hỏi tự luận
router.post('/essay', async (req, res) => {
  try {
    const { content, numberOfQuestions = 5, difficulty = 'medium', subject = '', topics = [], instructions = '' } = req.body;

    const difficultyMap = { easy: 'dễ', medium: 'trung bình', hard: 'khó' };

    const prompt = `
Bạn là một giáo viên chuyên nghiệp. Hãy tạo ${numberOfQuestions} câu hỏi tự luận từ nội dung sau:

THÔNG TIN:
- Môn học: ${subject || 'Tổng hợp'}
- Chủ đề: ${topics.length > 0 ? topics.join(', ') : 'Tổng hợp'}
- Độ khó: ${difficultyMap[difficulty]}
- Số câu hỏi: ${numberOfQuestions}

NỘI DUNG TÀI LIỆU:
${content}
${instructions ? `\nHƯỚNG DẪN BỔ SUNG TỪ GIÁO VIÊN:\n${instructions}\n` : ''}
YÊU CẦU:
1. Câu hỏi phải yêu cầu học sinh phân tích, giải thích hoặc trình bày
2. Phù hợp với độ khó đã chọn
3. Có đáp án mẫu chi tiết
4. Có tiêu chí chấm điểm rõ ràng
5. QUAN TRỌNG - CÔNG THỨC TOÁN/HÓA/LÝ: Sử dụng cú pháp LaTeX với ký hiệu $ để bao quanh công thức.
   - Công thức inline: $công_thức$ (VD: $x^{2}+1$, $\\frac{a}{b}$, $\\sqrt{x}$)
   - Công thức block (căn giữa): $$công_thức$$
   - VD: "Giải phương trình $x^{2} - 5x + 6 = 0$"
   - Hóa học: "$H_2SO_4$", "$2H_2 + O_2 \\rightarrow 2H_2O$"
   - Vật lý: "$F = ma$", "$v = \\frac{s}{t}$"
   - Lưu ý: trong JSON, ký tự \\ phải được escape thành \\\\ (VD: "\\\\frac", "\\\\sqrt")

ĐỊNH DẠNG TRẢ VỀ (JSON):
Trả về một mảng JSON với định dạng sau (KHÔNG có markdown, KHÔNG có \`\`\`json):
[
  {
    "question": "Nội dung câu hỏi tự luận (dùng $...$ cho công thức)",
    "sampleAnswer": "Đáp án mẫu chi tiết (dùng $...$ cho công thức)",
    "rubric": [
      "Tiêu chí 1 (2 điểm)",
      "Tiêu chí 2 (3 điểm)"
    ],
    "points": 5,
    "difficulty": "${difficulty}",
    "topic": "Tên chủ đề cụ thể"
  }
]

CHÚ Ý: Chỉ trả về JSON thuần túy, không thêm bất kỳ text nào khác.
`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
    });
    const text = response.choices[0].message.content;
    const questions = JSON.parse(sanitizeJSONText(text));

    res.json({ success: true, questions, totalQuestions: questions.length });
  } catch (error) {
    console.error('Error generating essay questions:', error);
    res.status(500).json({ success: false, error: error.message || 'Không thể tạo câu hỏi từ AI' });
  }
});

// POST /api/ai/summarize - Tóm tắt tài liệu
router.post('/summarize', async (req, res) => {
  try {
    const { content, summaryType = 'list', subject = '', additionalInstructions = '' } = req.body;

    const summaryTypeMap = {
      list: {
        name: 'Danh sách có số thứ tự',
        format: 'Sử dụng thẻ <ol> và <li> với phân cấp rõ ràng bằng <ul> lồng nhau cho các mục con'
      },
      table: {
        name: 'Bảng',
        format: 'Trình bày dưới dạng thẻ <table> với <thead>, <tbody>, <tr>, <th>, <td>. Bảng phải có viền và header rõ ràng'
      },
      bullets: {
        name: 'Gạch đầu dòng',
        format: 'Sử dụng thẻ <ul> và <li> để tổ chức thông tin theo cấp bậc với <ul> lồng nhau'
      },
      framework: {
        name: 'Khung sườn bài giảng',
        format: `Tạo khung sườn giáo án đầy đủ bao gồm:
I. MỤC TIÊU BÀI HỌC (Kiến thức, Kỹ năng, Thái độ)
II. CHUẨN BỊ (Giáo viên, Học sinh)
III. TIẾN TRÌNH DẠY HỌC (Hoạt động khởi động, Hình thành kiến thức, Luyện tập, Vận dụng, Tổng kết)
IV. HƯỚNG DẪN VỀ NHÀ
Sử dụng các thẻ <h2>, <h3>, <ul>, <ol>, <li>, <strong>, <em>, <p> để cấu trúc nội dung`
      }
    };

    const typeInfo = summaryTypeMap[summaryType] || summaryTypeMap.list;

    const prompt = `
Bạn là một giáo viên chuyên nghiệp. Hãy tóm tắt nội dung tài liệu sau theo dạng "${typeInfo.name}".

${subject ? `MÔN HỌC: ${subject}\n` : ''}
DẠNG TÓM TẮT: ${typeInfo.name}

NỘI DUNG TÀI LIỆU:
${content}

${additionalInstructions ? `\nYÊU CẦU BỔ SUNG:\n${additionalInstructions}\n` : ''}

ĐỊNH DẠNG TRẢ VỀ: HTML
Trả về nội dung dưới dạng HTML thuần túy (KHÔNG bọc trong \`\`\`html, KHÔNG thêm <!DOCTYPE>, <html>, <head>, <body>).
Chỉ trả về các thẻ HTML nội dung bên trong như <h2>, <h3>, <p>, <ul>, <ol>, <li>, <table>, <strong>, <em>, <br>.

YÊU CẦU CHUNG:
1. ${typeInfo.format}
2. Nội dung phải chính xác, súc tích, dễ hiểu
3. Giữ lại các thông tin quan trọng: khái niệm, định nghĩa, công thức, ví dụ
4. Tổ chức logic, có cấu trúc rõ ràng
5. Sử dụng tiếng Việt chuẩn, chuyên ngành (nếu có)
6. Độ dài phù hợp: không quá ngắn cũng không quá dài

${summaryType === 'framework' ? `
LƯU Ý ĐẶC BIỆT CHO KHUNG SƯỜN GIÁO ÁN:
- Ước lượng thời gian cho từng hoạt động (tổng 45 phút)
- Đề xuất phương pháp dạy học phù hợp
- Gợi ý câu hỏi, bài tập cụ thể
- Liên hệ với thực tế cuộc sống
` : ''}

CHÚ Ý: Chỉ trả về HTML thuần túy, không bọc trong markdown code block, không thêm giải thích.
`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
    });
    let text = response.choices[0].message.content;
    text = text.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

    res.json({ success: true, content: text });
  } catch (error) {
    console.error('Error summarizing document:', error);
    res.status(500).json({ success: false, error: error.message || 'Không thể tóm tắt tài liệu. Vui lòng thử lại.' });
  }
});

// POST /api/ai/chat - Chat với AI assistant
router.post('/chat', async (req, res) => {
  try {
    const { messages, systemInstruction } = req.body;
    if (!Array.isArray(messages)) {
      return res.status(400).json({ success: false, error: 'messages phải là mảng' });
    }

    const openAIMessages = [];
    if (systemInstruction) {
      openAIMessages.push({ role: 'system', content: systemInstruction });
    }
    openAIMessages.push(...messages);

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: openAIMessages,
    });

    res.json({ success: true, content: response.choices[0].message.content });
  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({ success: false, error: error.message || 'Không thể xử lý yêu cầu' });
  }
});

export default router;
