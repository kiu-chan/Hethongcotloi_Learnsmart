import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useAuth } from '../../../contexts/AuthContext';
import MathDisplay from '../../../components/MathDisplay';
import {
  FiSend,
  FiBook,
  FiHelpCircle,
  FiTrash2,
  FiFileText,
  FiDownload,
} from 'react-icons/fi';
import { IoSparkles } from 'react-icons/io5';
import html2pdf from 'html2pdf.js';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

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
  const chatRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

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

  const getOrCreateChat = useCallback((historyMessages) => {
    if (chatRef.current) return chatRef.current;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
    });
    const geminiHistory = historyMessages
      .filter((msg) => msg.role === 'user' || msg.role === 'ai')
      .map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      }));
    chatRef.current = model.startChat({ history: geminiHistory });
    return chatRef.current;
  }, []);

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMessage = { role: 'user', text: text.trim(), timestamp: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const chat = getOrCreateChat(messages);
      const result = await chat.sendMessage(text.trim());
      const response = await result.response;
      const aiText = response.text();

      const aiMessage = { role: 'ai', text: aiText, timestamp: Date.now() };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI Chat error:', error);
      let errorText = 'Xin lỗi, có sự cố khi xử lý yêu cầu. Vui lòng thử lại!';
      if (error?.message?.includes('429') || error?.message?.includes('quota')) {
        errorText = 'Hệ thống AI đang quá tải hoặc đã hết lượt sử dụng trong ngày. Vui lòng thử lại sau vài phút!';
      }
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: errorText,
          timestamp: Date.now(),
          isError: true,
        },
      ]);
      chatRef.current = null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestionClick = (text) => {
    sendMessage(text);
  };

  const handleClearChat = () => {
    setMessages([]);
    chatRef.current = null;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
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
                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
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
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi của bạn..."
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
            disabled={!input.trim() || isLoading}
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
