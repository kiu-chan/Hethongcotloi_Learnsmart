import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useAuth } from '../../../contexts/AuthContext';
import MathDisplay from '../../../components/MathDisplay';
import {
  FiSend,
  FiBook,
  FiHelpCircle,
  FiTrash2,
} from 'react-icons/fi';
import { IoSparkles } from 'react-icons/io5';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

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
    if (inputRef.current) {
      inputRef.current.style.height = '44px';
    }
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
      let errorText = 'Xin lỗi, mình gặp sự cố khi xử lý câu hỏi. Bạn thử hỏi lại nhé!';
      if (error?.message?.includes('429') || error?.message?.includes('quota')) {
        errorText = 'Hệ thống AI đang quá tải hoặc đã hết lượt sử dụng trong ngày. Bạn vui lòng thử lại sau vài phút nhé!';
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
      // Reset chat để lần sau tạo lại với history đầy đủ
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
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
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
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi của bạn..."
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
            disabled={!input.trim() || isLoading}
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
