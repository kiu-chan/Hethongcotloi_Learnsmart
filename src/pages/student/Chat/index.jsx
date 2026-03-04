import { useState, useRef, useEffect } from 'react';
import OpenAI from 'openai';
import { useAuth } from '../../../contexts/AuthContext';
import MathDisplay from '../../../components/MathDisplay';
import {
  FiSend,
  FiBook,
  FiHelpCircle,
  FiTrash2,
  FiPaperclip,
  FiX,
  FiFileText,
} from 'react-icons/fi';
import { IoSparkles } from 'react-icons/io5';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

const SYSTEM_INSTRUCTION = `Bạn là trợ lý học tập AI thân thiện dành cho học sinh phổ thông Việt Nam. Tên bạn là "Trợ lý Learn Smart".

QUY TẮC BẮT BUỘC:
1. TUYỆT ĐỐI KHÔNG giải bài tập, bài kiểm tra, hay làm bài hộ học sinh. Nếu học sinh gửi bài tập và yêu cầu giải, hãy từ chối lịch sự và hướng dẫn phương pháp để học sinh TỰ giải.
2. Khi học sinh hỏi về một bài toán/bài tập cụ thể, hãy:
   - Phân tích đề bài và chỉ ra các dữ kiện quan trọng
   - Gợi ý phương pháp/công thức cần dùng
   - Đặt câu hỏi gợi mở để học sinh tự suy nghĩ bước tiếp theo
   - KHÔNG đưa ra đáp án cuối cùng
3. Giải thích khái niệm, định lý, công thức một cách rõ ràng, dễ hiểu khi được hỏi.
4. Luôn trả lời bằng tiếng Việt.
5. Sử dụng $...$ cho công thức toán inline và $$...$$ cho công thức block khi cần thiết.
6. Khuyến khích và động viên học sinh, tạo không khí tích cực.
7. Nếu học sinh hỏi ngoài lề (không liên quan học tập), nhẹ nhàng chuyển hướng về chủ đề học tập.
8. Trả lời ngắn gọn, súc tích, chia thành các bước/mục rõ ràng. Dùng **bold** cho từ khóa quan trọng.

BẠN HỖ TRỢ CÁC MÔN: Toán, Vật lý, Hóa học, Sinh học, Ngữ văn, Lịch sử, Địa lý, Tiếng Anh và các môn học khác ở bậc phổ thông.`;

const SUGGESTIONS = [
  {
    icon: FiBook,
    text: 'Giải thích định lý Pythagore',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: FiHelpCircle,
    text: 'Phản ứng oxi hóa khử là gì?',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: FiBook,
    text: 'Cách phân tích đề văn nghị luận',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: FiHelpCircle,
    text: 'Phân biệt thì hiện tại đơn và hiện tại tiếp diễn',
    color: 'from-green-500 to-teal-500',
  },
];

const StudentChat = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const chatRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const readFileAsText = (file) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = (e) => res(e.target.result);
      r.onerror = () => rej(new Error('Lỗi đọc file'));
      r.readAsText(file, 'UTF-8');
    });

  const readFileAsDataUrl = (file) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = (e) => res(e.target.result);
      r.onerror = () => rej(new Error('Lỗi đọc file'));
      r.readAsDataURL(file);
    });

  const readFileAsArrayBuffer = (file) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = (e) => res(e.target.result);
      r.onerror = () => rej(new Error('Lỗi đọc file'));
      r.readAsArrayBuffer(file);
    });

  const extractPdfText = async (file) => {
    const ab = await readFileAsArrayBuffer(file);
    const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item) => item.str).join(' ') + '\n';
    }
    return text;
  };

  const handleFileSelect = async (e) => {
    const selected = Array.from(e.target.files);
    if (!selected.length) return;
    e.target.value = '';

    const processed = await Promise.all(
      selected.map(async (file) => {
        const name = file.name;
        const ext = name.split('.').pop().toLowerCase();
        try {
          if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) {
            const dataUrl = await readFileAsDataUrl(file);
            return { name, kind: 'image', dataUrl, preview: dataUrl };
          }
          if (['txt', 'md', 'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'html', 'css', 'json', 'csv'].includes(ext)) {
            const textContent = await readFileAsText(file);
            return { name, kind: 'text', textContent, preview: null };
          }
          if (ext === 'pdf') {
            const textContent = await extractPdfText(file);
            return { name, kind: 'pdf', textContent, preview: null };
          }
          if (ext === 'docx') {
            const ab = await readFileAsArrayBuffer(file);
            const result = await mammoth.extractRawText({ arrayBuffer: ab });
            return { name, kind: 'docx', textContent: result.value, preview: null };
          }
          if (['xlsx', 'xls'].includes(ext)) {
            const ab = await readFileAsArrayBuffer(file);
            const wb = XLSX.read(ab, { type: 'array' });
            const text = wb.SheetNames.map((sn) => {
              const csv = XLSX.utils.sheet_to_csv(wb.Sheets[sn]);
              return `[Sheet: ${sn}]\n${csv}`;
            }).join('\n\n');
            return { name, kind: 'xlsx', textContent: text, preview: null };
          }
          const textContent = await readFileAsText(file);
          return { name, kind: 'text', textContent, preview: null };
        } catch {
          return { name, kind: 'error', textContent: '', preview: null };
        }
      }),
    );

    setAttachedFiles((prev) => [...prev, ...processed.filter((f) => f.kind !== 'error')]);
  };

  const removeAttachment = (index) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async (text, files = []) => {
    if ((!text.trim() && files.length === 0) || isLoading) return;

    const userMessage = {
      role: 'user',
      text: text.trim(),
      attachments: files.map((f) => ({ name: f.name, kind: f.kind, preview: f.preview })),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setAttachedFiles([]);
    if (inputRef.current) {
      inputRef.current.style.height = '44px';
    }
    setIsLoading(true);

    try {
      const history = messages
        .filter((m) => m.role === 'user' || m.role === 'ai')
        .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));

      const hasImages = files.some((f) => f.kind === 'image');
      const textDocs = files.filter((f) => f.kind !== 'image');

      let fullText = text.trim();
      if (textDocs.length > 0) {
        const docBlock = textDocs
          .map((f) => `\n---\n**File đính kèm: ${f.name}**\n\`\`\`\n${f.textContent}\n\`\`\``)
          .join('\n');
        fullText = (fullText ? fullText + '\n' : 'Hãy giúp mình hiểu nội dung file đính kèm sau:\n') + docBlock;
      }

      let lastContent;
      if (hasImages) {
        lastContent = [{ type: 'text', text: fullText || 'Hãy giúp mình hiểu hình ảnh đính kèm.' }];
        files
          .filter((f) => f.kind === 'image')
          .forEach((f) => {
            lastContent.push({ type: 'image_url', image_url: { url: f.dataUrl } });
          });
      } else {
        lastContent = fullText;
      }

      const openAIMessages = [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        ...history,
        { role: 'user', content: lastContent },
      ];
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: openAIMessages,
      });
      const aiText = response.choices[0].message.content;

      setMessages((prev) => [...prev, { role: 'ai', text: aiText, timestamp: Date.now() }]);
    } catch (error) {
      console.error('AI Chat error:', error);
      let errorText = 'Xin lỗi, mình gặp sự cố khi xử lý câu hỏi. Bạn thử hỏi lại nhé!';
      if (error?.message?.includes('429') || error?.message?.includes('quota')) {
        errorText = 'Hệ thống AI đang quá tải hoặc đã hết lượt sử dụng trong ngày. Bạn vui lòng thử lại sau vài phút nhé!';
      }
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: errorText, timestamp: Date.now(), isError: true },
      ]);
      chatRef.current = null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input, attachedFiles);
  };

  const handleSuggestionClick = (text) => {
    sendMessage(text, []);
  };

  const handleClearChat = () => {
    setMessages([]);
    setAttachedFiles([]);
    chatRef.current = null;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <IoSparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">
                Trợ lý học tập AI
              </h1>
              <p className="text-xs text-gray-500">
                Hỏi bất kỳ thắc mắc nào về bài học
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Xóa lịch sử chat"
            >
              <FiTrash2 size={16} />
              <span className="hidden sm:inline">Cuộc trò chuyện mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto bg-gray-50 px-4 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4">
              <IoSparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Xin chào {currentUser?.name || 'bạn'}!
            </h2>
            <p className="text-gray-500 mb-8 max-w-md">
              Mình là trợ lý học tập AI. Mình sẽ giúp bạn hiểu bài tốt hơn bằng cách giải thích và hướng dẫn phương pháp. Hãy hỏi mình bất cứ điều gì!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {SUGGESTIONS.map((suggestion, index) => {
                const Icon = suggestion.icon;
                return (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left group"
                  >
                    <div
                      className={`w-8 h-8 bg-gradient-to-br ${suggestion.color} rounded-lg flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                      {suggestion.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex gap-3 max-w-[85%] min-w-0 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-sm font-bold'
                        : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      currentUser?.name?.charAt(0) || 'H'
                    ) : (
                      <IoSparkles className="w-4 h-4 text-white" />
                    )}
                  </div>

                  {/* Message bubble */}
                  <div
                    className={`rounded-2xl px-4 py-3 min-w-0 overflow-hidden ${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : msg.isError
                          ? 'bg-red-50 border border-red-200 text-red-700'
                          : 'bg-white border border-gray-200 text-gray-800'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <div>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {msg.attachments.map((att, ai) => (
                              <div key={ai} className="flex items-center gap-1 bg-blue-400/40 rounded-lg px-2 py-1 text-xs max-w-[180px]">
                                {att.kind === 'image' ? (
                                  <img src={att.preview} alt={att.name} className="w-16 h-16 object-cover rounded-md" />
                                ) : (
                                  <>
                                    <FiFileText className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{att.name}</span>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {msg.text && <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>}
                      </div>
                    ) : (
                      <div className="text-sm leading-relaxed overflow-x-auto max-w-full">
                        <MathDisplay text={msg.text} block />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <IoSparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0"
      >
        {/* Attached file chips */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachedFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 max-w-[200px]">
                {f.kind === 'image' ? (
                  <img src={f.preview} alt={f.name} className="w-5 h-5 rounded object-cover flex-shrink-0" />
                ) : (
                  <FiFileText className="w-3 h-3 flex-shrink-0" />
                )}
                <span className="truncate">{f.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="ml-0.5 text-gray-400 hover:text-red-500 flex-shrink-0"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* File attach button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex items-center justify-center w-10 h-10 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors flex-shrink-0 disabled:opacity-40"
            title="Đính kèm file (ảnh, PDF, Word, Excel, văn bản)"
          >
            <FiPaperclip size={18} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,.pdf,.docx,.xlsx,.xls,.txt,.md,.csv,.js,.ts,.jsx,.tsx,.py,.java,.html,.css,.json"
            multiple
            className="hidden"
          />

          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi hoặc đính kèm file..."
              rows={1}
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32"
              style={{ minHeight: '44px' }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
              }}
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}
            className="flex items-center justify-center w-11 h-11 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
          >
            <FiSend size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          AI chỉ hướng dẫn phương pháp, không giải bài tập hộ bạn
        </p>
      </form>
    </div>
  );
};

export default StudentChat;
