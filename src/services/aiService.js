import OpenAI from 'openai';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

// Khởi tạo OpenAI
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

/**
 * Sanitize JSON text từ AI - loại bỏ ký tự điều khiển trong string literals
 */
const sanitizeJSONText = (text) => {
  // Loại bỏ markdown code block
  let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  // Thay thế ký tự điều khiển bên trong string literals
  // Regex: tìm mọi string literal "..." và escape control chars bên trong
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

/**
 * Tạo câu hỏi trắc nghiệm từ nội dung
 */
export const generateMultipleChoiceQuestions = async ({
  content,
  numberOfQuestions = 10,
  difficulty = 'medium',
  subject = '',
  topics = [],
  instructions = ''
}) => {
  try {
    const difficultyMap = {
      easy: 'dễ',
      medium: 'trung bình',
      hard: 'khó'
    };

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

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
    });
    let text = response.choices[0].message.content;

    const questions = JSON.parse(sanitizeJSONText(text));
    return {
      success: true,
      questions,
      totalQuestions: questions.length
    };
  } catch (error) {
    console.error('Error generating questions:', error);
    return {
      success: false,
      error: error.message || 'Không thể tạo câu hỏi từ AI',
      questions: []
    };
  }
};

/**
 * Tạo câu hỏi tự luận từ nội dung
 */
export const generateEssayQuestions = async ({
  content,
  numberOfQuestions = 5,
  difficulty = 'medium',
  subject = '',
  topics = [],
  instructions = ''
}) => {
  try {
    const difficultyMap = {
      easy: 'dễ',
      medium: 'trung bình',
      hard: 'khó'
    };

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

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
    });
    let text = response.choices[0].message.content;

    const questions = JSON.parse(sanitizeJSONText(text));
    return {
      success: true,
      questions,
      totalQuestions: questions.length
    };
  } catch (error) {
    console.error('Error generating essay questions:', error);
    return {
      success: false,
      error: error.message || 'Không thể tạo câu hỏi từ AI',
      questions: []
    };
  }
};

/**
 * Trích xuất text từ file PDF
 */
const extractTextFromPDF = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    // Đọc từng trang
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText.trim();
  } catch (error) {
    console.error('Error extracting PDF:', error);
    throw new Error('Không thể đọc file PDF. Vui lòng thử file khác hoặc copy-paste nội dung.');
  }
};

/**
 * Trích xuất text từ file DOCX
 */
const extractTextFromDOCX = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  } catch (error) {
    console.error('Error extracting DOCX:', error);
    throw new Error('Không thể đọc file DOCX. Vui lòng thử file khác hoặc copy-paste nội dung.');
  }
};

/**
 * Trích xuất text từ file
 * Hỗ trợ: .txt, .pdf, .docx
 */
export const extractTextFromFile = async (file) => {
  try {
    // Text file
    if (file.type === 'text/plain') {
      return await file.text();
    }

    // PDF file
    if (file.type === 'application/pdf') {
      return await extractTextFromPDF(file);
    }

    // DOCX file
    if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.endsWith('.docx')
    ) {
      return await extractTextFromDOCX(file);
    }

    // DOC file (old format - not fully supported)
    if (file.type === 'application/msword' || file.name.endsWith('.doc')) {
      throw new Error('File .doc không được hỗ trợ. Vui lòng chuyển sang .docx hoặc copy-paste nội dung.');
    }

    throw new Error('Định dạng file không được hỗ trợ. Chỉ hỗ trợ: .txt, .pdf, .docx');
  } catch (error) {
    throw error;
  }
};

/**
 * Tóm tắt tài liệu với AI
 */
export const summarizeDocument = async ({
  content,
  summaryType = 'list',
  subject = '',
  additionalInstructions = ''
}) => {
  try {
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

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
    });
    let text = response.choices[0].message.content;

    // Loại bỏ markdown code block nếu AI vẫn wrap
    text = text.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

    return {
      success: true,
      content: text
    };
  } catch (error) {
    console.error('Error summarizing document:', error);
    return {
      success: false,
      error: error.message || 'Không thể tóm tắt tài liệu. Vui lòng thử lại.',
      content: ''
    };
  }
};

/**
 * Tạo đề thi hỗn hợp (trắc nghiệm + tự luận)
 */
export const generateMixedExam = async ({
  content,
  multipleChoiceCount = 20,
  essayCount = 5,
  difficulty = 'medium',
  subject = '',
  topics = [],
  instructions = ''
}) => {
  try {
    // Gọi tuần tự để tránh rate-limit từ Gemini API
    const mcResult = await generateMultipleChoiceQuestions({
      content,
      numberOfQuestions: multipleChoiceCount,
      difficulty,
      subject,
      topics,
      instructions
    });

    const essayResult = await generateEssayQuestions({
      content,
      numberOfQuestions: essayCount,
      difficulty,
      subject,
      topics,
      instructions
    });

    if (!mcResult.success && !essayResult.success) {
      return {
        success: false,
        error: 'Không thể tạo câu hỏi từ AI. ' + (mcResult.error || '') + ' ' + (essayResult.error || ''),
        questions: []
      };
    }

    // Nếu một trong hai thất bại, retry lần nữa
    let finalMc = mcResult;
    let finalEssay = essayResult;

    if (!mcResult.success && essayResult.success) {
      console.log('MC failed, retrying...');
      finalMc = await generateMultipleChoiceQuestions({
        content,
        numberOfQuestions: multipleChoiceCount,
        difficulty,
        subject,
        topics,
        instructions
      });
    }

    if (mcResult.success && !essayResult.success) {
      console.log('Essay failed, retrying...');
      finalEssay = await generateEssayQuestions({
        content,
        numberOfQuestions: essayCount,
        difficulty,
        subject,
        topics,
        instructions
      });
    }

    return {
      success: true,
      multipleChoiceQuestions: finalMc.questions || [],
      essayQuestions: finalEssay.questions || [],
      totalQuestions: (finalMc.questions?.length || 0) + (finalEssay.questions?.length || 0)
    };
  } catch (error) {
    console.error('Error generating mixed exam:', error);
    return {
      success: false,
      error: error.message || 'Không thể tạo đề thi',
      questions: []
    };
  }
};
