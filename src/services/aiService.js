import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const API = '/api/ai';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('authToken')}`,
});

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
    const res = await fetch(`${API}/multiple-choice`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content, numberOfQuestions, difficulty, subject, topics, instructions }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể tạo câu hỏi từ AI');
    return data;
  } catch (error) {
    console.error('Error generating questions:', error);
    return { success: false, error: error.message || 'Không thể tạo câu hỏi từ AI', questions: [] };
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
    const res = await fetch(`${API}/essay`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content, numberOfQuestions, difficulty, subject, topics, instructions }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể tạo câu hỏi từ AI');
    return data;
  } catch (error) {
    console.error('Error generating essay questions:', error);
    return { success: false, error: error.message || 'Không thể tạo câu hỏi từ AI', questions: [] };
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
    if (file.type === 'text/plain') {
      return await file.text();
    }

    if (file.type === 'application/pdf') {
      return await extractTextFromPDF(file);
    }

    if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.endsWith('.docx')
    ) {
      return await extractTextFromDOCX(file);
    }

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
    const res = await fetch(`${API}/summarize`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content, summaryType, subject, additionalInstructions }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể tóm tắt tài liệu. Vui lòng thử lại.');
    return data;
  } catch (error) {
    console.error('Error summarizing document:', error);
    return { success: false, error: error.message || 'Không thể tóm tắt tài liệu. Vui lòng thử lại.', content: '' };
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
    const mcResult = await generateMultipleChoiceQuestions({
      content, numberOfQuestions: multipleChoiceCount, difficulty, subject, topics, instructions
    });

    const essayResult = await generateEssayQuestions({
      content, numberOfQuestions: essayCount, difficulty, subject, topics, instructions
    });

    if (!mcResult.success && !essayResult.success) {
      return {
        success: false,
        error: 'Không thể tạo câu hỏi từ AI. ' + (mcResult.error || '') + ' ' + (essayResult.error || ''),
        questions: []
      };
    }

    let finalMc = mcResult;
    let finalEssay = essayResult;

    if (!mcResult.success && essayResult.success) {
      console.log('MC failed, retrying...');
      finalMc = await generateMultipleChoiceQuestions({
        content, numberOfQuestions: multipleChoiceCount, difficulty, subject, topics, instructions
      });
    }

    if (mcResult.success && !essayResult.success) {
      console.log('Essay failed, retrying...');
      finalEssay = await generateEssayQuestions({
        content, numberOfQuestions: essayCount, difficulty, subject, topics, instructions
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
    return { success: false, error: error.message || 'Không thể tạo đề thi', questions: [] };
  }
};
