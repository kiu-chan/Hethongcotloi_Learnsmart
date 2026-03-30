import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import MathDisplay from '../../../components/MathDisplay';
import {
  FiSend,
  FiBook,
  FiHelpCircle,
  FiTrash2,
  FiFileText,
  FiDownload,
  FiPaperclip,
  FiX,
  FiImage,
} from 'react-icons/fi';
import { IoSparkles } from 'react-icons/io5';
import html2pdf from 'html2pdf.js';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();


const SYSTEM_INSTRUCTION = `Bạn là trợ lý AI thông minh dành cho giáo viên phổ thông Việt Nam. Tên bạn là "Trợ lý Learn Smart".

VAI TRÒ:
Bạn hỗ trợ giáo viên trong mọi hoạt động giảng dạy: soạn bài, lên kế hoạch, giải đáp chuyên môn, gợi ý phương pháp dạy học, tạo bài tập/đề thi, và tư vấn sư phạm.

QUY TẮC:
1. Luôn trả lời bằng tiếng Việt, chuyên nghiệp và chi tiết.
2. Sử dụng $...$ cho công thức toán inline và $$...$$ cho công thức block khi cần thiết.
3. Trả lời có cấu trúc rõ ràng, chia thành các mục/bước. Dùng **bold** cho từ khóa quan trọng.
4. Khi được hỏi soạn giáo án, cung cấp đầy đủ: mục tiêu, nội dung, hoạt động, thời lượng.
5. Khi gợi ý bài tập/đề thi, đảm bảo chính xác về mặt kiến thức và phù hợp trình độ.
6. Sẵn sàng giải đáp chuyên sâu về nội dung các môn học ở bậc phổ thông.
7. Gợi ý phương pháp dạy học tích cực, sáng tạo khi được hỏi.

BẠN HỖ TRỢ CÁC MÔN: Toán, Vật lý, Hóa học, Sinh học, Ngữ văn, Lịch sử, Địa lý, Tiếng Anh, GDCD, Tin học và các môn học khác ở bậc phổ thông.`;

const SUGGESTIONS = [
  {
    icon: FiFileText,
    text: 'Soạn giáo án bài Phương trình bậc 2 lớp 9',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: FiHelpCircle,
    text: 'Phương pháp dạy học tích cực cho môn Hóa',
    color: 'from-teal-500 to-cyan-500',
  },
  {
    icon: FiBook,
    text: 'Gợi ý 5 câu hỏi tự luận về Chiến tranh thế giới thứ 2',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: FiHelpCircle,
    text: 'Cách giải thích khái niệm tích phân cho học sinh dễ hiểu',
    color: 'from-purple-500 to-pink-500',
  },
];

const TeacherChat = () => {
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
    const html = document.documentElement;
    const body = document.body;
    const main = document.querySelector('main');
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    if (main) main.style.overflow = 'hidden';
    return () => {
      html.style.overflow = '';
      body.style.overflow = '';
      if (main) main.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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
    setIsLoading(true);

    try {
      const history = messages
        .filter((m) => m.role === 'user' || m.role === 'ai')
        .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));

      // Build the last user message content
      const hasImages = files.some((f) => f.kind === 'image');
      const textDocs = files.filter((f) => f.kind !== 'image');

      // Compose full text prompt
      let fullText = text.trim();
      if (textDocs.length > 0) {
        const docBlock = textDocs
          .map((f) => `\n---\n**File đính kèm: ${f.name}**\n\`\`\`\n${f.textContent}\n\`\`\``)
          .join('\n');
        fullText = (fullText ? fullText + '\n' : 'Hãy phân tích file đính kèm sau:\n') + docBlock;
      }

      let lastContent;
      if (hasImages) {
        lastContent = [{ type: 'text', text: fullText || 'Hãy phân tích hình ảnh đính kèm.' }];
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

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ messages: openAIMessages.slice(1), systemInstruction: openAIMessages[0].content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi server');
      const aiText = data.content;
      setMessages((prev) => [...prev, { role: 'ai', text: aiText, timestamp: Date.now() }]);
    } catch (error) {
      console.error('AI Chat error:', error);
      let errorText = 'Xin lỗi, có sự cố khi xử lý yêu cầu. Vui lòng thử lại!';
      if (error?.message?.includes('429') || error?.message?.includes('quota')) {
        errorText = 'Hệ thống AI đang quá tải hoặc đã hết lượt sử dụng trong ngày. Vui lòng thử lại sau vài phút!';
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
          // Fallback: try reading as text
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

  const fileKindIcon = (kind) => {
    if (kind === 'image') return <FiImage className="w-3 h-3" />;
    return <FiFileText className="w-3 h-3" />;
  };

  const generatePdfFromHtml = (container, filename) => {
    html2pdf()
      .set({
        margin: [15, 15, 15, 15],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      })
      .from(container)
      .save();
  };

  const handleDownloadResponse = (msg) => {
    const container = document.createElement('div');
    container.style.cssText = 'padding:20px;font-family:Arial,sans-serif;color:#1f2937;max-width:700px;';
    container.innerHTML = `
      <div style="border-bottom:2px solid #10b981;padding-bottom:12px;margin-bottom:16px;">
        <h2 style="margin:0;color:#065f46;font-size:18px;">Trợ lý AI - Learn Smart</h2>
        <p style="margin:4px 0 0;color:#6b7280;font-size:12px;">${new Date(msg.timestamp).toLocaleString('vi-VN')}</p>
      </div>
      <div style="font-size:14px;line-height:1.8;">${document.querySelector(`[data-msg-id="msg-${msg.timestamp}"]`)?.innerHTML || msg.text}</div>
    `;
    generatePdfFromHtml(container, `ai-response-${Date.now()}.pdf`);
  };

  const handleDownloadConversation = () => {
    const container = document.createElement('div');
    container.style.cssText = 'padding:20px;font-family:Arial,sans-serif;color:#1f2937;max-width:700px;';

    let html = `
      <div style="border-bottom:2px solid #10b981;padding-bottom:12px;margin-bottom:20px;">
        <h2 style="margin:0;color:#065f46;font-size:20px;">Cuộc trò chuyện với Trợ lý AI</h2>
        <p style="margin:4px 0 0;color:#6b7280;font-size:12px;">Giáo viên: ${currentUser?.name || 'N/A'} | Xuất ngày: ${new Date().toLocaleString('vi-VN')}</p>
        <p style="margin:2px 0 0;color:#6b7280;font-size:12px;">Tổng: ${messages.length} tin nhắn</p>
      </div>
    `;

    messages.forEach((msg) => {
      const time = new Date(msg.timestamp).toLocaleString('vi-VN');
      if (msg.role === 'user') {
        html += `
          <div style="margin-bottom:16px;padding:12px 16px;background:#ecfdf5;border-radius:10px;border-left:4px solid #10b981;">
            <p style="margin:0 0 4px;font-weight:bold;color:#065f46;font-size:13px;">Bạn <span style="font-weight:normal;color:#6b7280;font-size:11px;">· ${time}</span></p>
            <p style="margin:0;font-size:14px;white-space:pre-wrap;">${msg.text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          </div>
        `;
      } else {
        const renderedEl = document.querySelector(`[data-msg-id="msg-${msg.timestamp}"]`);
        const content = renderedEl ? renderedEl.innerHTML : msg.text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html += `
          <div style="margin-bottom:16px;padding:12px 16px;background:#f9fafb;border-radius:10px;border-left:4px solid #6b7280;">
            <p style="margin:0 0 4px;font-weight:bold;color:#374151;font-size:13px;">Trợ lý AI <span style="font-weight:normal;color:#6b7280;font-size:11px;">· ${time}</span></p>
            <div style="font-size:14px;line-height:1.8;">${content}</div>
          </div>
        `;
      }
    });

    container.innerHTML = html;
    generatePdfFromHtml(container, `conversation-${Date.now()}.pdf`);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 -m-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <IoSparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">
                Trợ lý AI cho Giáo viên
              </h1>
              <p className="text-xs text-gray-500">
                Hỗ trợ soạn bài, giải đáp chuyên môn, gợi ý phương pháp dạy học
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadConversation}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Tải cuộc trò chuyện (PDF)"
              >
                <FiDownload size={16} />
                <span className="hidden sm:inline">Tải PDF</span>
              </button>
              <button
                onClick={handleClearChat}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Xóa lịch sử chat"
              >
                <FiTrash2 size={16} />
                <span className="hidden sm:inline">Cuộc trò chuyện mới</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto bg-gray-50 px-4 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4">
              <IoSparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Xin chào {currentUser?.name || 'thầy/cô'}!
            </h2>
            <p className="text-gray-500 mb-8 max-w-md">
              Tôi là trợ lý AI dành cho giáo viên. Tôi có thể hỗ trợ soạn giáo án, tạo bài tập, giải đáp chuyên môn và gợi ý phương pháp dạy học. Hãy hỏi tôi bất cứ điều gì!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {SUGGESTIONS.map((suggestion, index) => {
                const Icon = suggestion.icon;
                return (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all text-left group"
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
                  className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-sm font-bold'
                        : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      currentUser?.name?.charAt(0) || 'G'
                    ) : (
                      <IoSparkles className="w-4 h-4 text-white" />
                    )}
                  </div>

                  {/* Message bubble */}
                  <div className="flex flex-col gap-1">
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-emerald-500 text-white'
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
                                <div key={ai} className="flex items-center gap-1 bg-emerald-400/40 rounded-lg px-2 py-1 text-xs max-w-[180px]">
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
                          {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
                        </div>
                      ) : (
                        <div data-msg-id={`msg-${msg.timestamp}`} className="text-sm leading-relaxed overflow-x-auto">
                          <MathDisplay text={msg.text} block />
                        </div>
                      )}
                    </div>
                    {msg.role === 'ai' && !msg.isError && (
                      <button
                        onClick={() => handleDownloadResponse(msg)}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-600 transition-colors self-start ml-1"
                        title="Tải câu trả lời (PDF)"
                      >
                        <FiDownload size={12} />
                        <span>Tải về</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
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
                  fileKindIcon(f.kind)
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
            className="flex items-center justify-center w-10 h-10 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors flex-shrink-0 disabled:opacity-40"
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
              placeholder="Nhập câu hỏi hoặc đính kèm file để phân tích..."
              rows={1}
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent max-h-32"
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
            className="flex items-center justify-center w-11 h-11 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
          >
            <FiSend size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeacherChat;
