import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight, FiChevronDown, FiZap,
} from 'react-icons/fi';
import {
  IoDocumentTextOutline,
  IoCreateOutline,
  IoGameControllerOutline,
  IoSchoolOutline,
  IoBulbOutline,
  IoLogInOutline,
  IoClipboardOutline,
  IoStatsChartOutline,
  IoChatbubbleEllipsesOutline,
} from 'react-icons/io5';

const steps = {
  teacher: [
    {
      step: 1,
      icon: IoLogInOutline,
      title: 'Đăng ký / Đăng nhập',
      desc: 'Tạo tài khoản giáo viên bằng email hoặc Google. Liên hệ admin để được cấp quyền giáo viên.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      step: 2,
      icon: IoDocumentTextOutline,
      title: 'Upload tài liệu',
      desc: 'Vào mục "Tài liệu" → Upload file PDF, Word, Excel hoặc nhập văn bản trực tiếp.',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      step: 3,
      icon: IoCreateOutline,
      title: 'Soạn đề & câu hỏi',
      desc: 'Vào mục "Đề thi" → Chọn "Tạo đề mới" → Dùng AI để tự động tạo câu hỏi từ tài liệu đã upload.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      step: 4,
      icon: IoGameControllerOutline,
      title: 'Tạo trò chơi học tập',
      desc: 'Vào mục "Trò chơi" → Chọn loại game (Quiz, Ghi nhớ, Sắp xếp) → Cấu hình và xuất bản.',
      color: 'from-orange-500 to-red-500',
    },
    {
      step: 5,
      icon: IoStatsChartOutline,
      title: 'Theo dõi kết quả',
      desc: 'Vào mục "Thống kê" để xem điểm số, tiến độ từng học sinh và phân tích kết quả lớp học.',
      color: 'from-indigo-500 to-purple-500',
    },
  ],
  student: [
    {
      step: 1,
      icon: IoLogInOutline,
      title: 'Đăng ký tài khoản',
      desc: 'Tạo tài khoản học sinh bằng email hoặc đăng nhập nhanh với Google.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      step: 2,
      icon: IoSchoolOutline,
      title: 'Vào lớp học',
      desc: 'Vào mục "Lớp học" để xem danh sách bài kiểm tra và tài liệu mà giáo viên đã chia sẻ.',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      step: 3,
      icon: IoClipboardOutline,
      title: 'Làm bài kiểm tra',
      desc: 'Chọn bài kiểm tra → Đọc kỹ đề → Trả lời và nộp bài. Kết quả hiển thị ngay lập tức.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      step: 4,
      icon: IoGameControllerOutline,
      title: 'Chơi game học tập',
      desc: 'Vào mục "Trò chơi" để tham gia các game quiz, ghi nhớ và cạnh tranh bảng xếp hạng.',
      color: 'from-orange-500 to-red-500',
    },
    {
      step: 5,
      icon: IoChatbubbleEllipsesOutline,
      title: 'Hỏi đáp với giáo viên',
      desc: 'Dùng tính năng "Chat" để đặt câu hỏi trực tiếp với giáo viên và nhận phản hồi nhanh chóng.',
      color: 'from-teal-500 to-emerald-500',
    },
  ],
};

const faqs = [
  {
    q: 'Learn Smart có miễn phí không?',
    a: 'Có! Learn Smart hoàn toàn miễn phí cho giáo viên và học sinh tham gia vào hệ thống. Bạn chỉ cần đăng ký tài khoản và bắt đầu sử dụng ngay.',
  },
  {
    q: 'Tôi cần cài đặt gì để sử dụng?',
    a: 'Không cần cài đặt bất kỳ phần mềm nào. Learn Smart hoạt động hoàn toàn trên trình duyệt web. Chỉ cần có kết nối Internet là bạn có thể sử dụng mọi tính năng.',
  },
  {
    q: 'AI tạo câu hỏi có chính xác không?',
    a: 'Learn Smart sử dụng ChatGPT của OpenAI – một trong những mô hình AI mạnh nhất hiện nay. Câu hỏi được tạo ra dựa trên nội dung tài liệu bạn cung cấp, đảm bảo độ chính xác và phù hợp với nội dung giảng dạy.',
  },
  {
    q: 'Tôi có thể upload loại file nào?',
    a: 'Hệ thống hỗ trợ PDF, Word (DOCX), Excel (XLSX) và file văn bản thuần (TXT). Kích thước tối đa mỗi file là 10MB.',
  },
  {
    q: 'Làm sao để học sinh tham gia lớp học?',
    a: 'Giáo viên tạo tài khoản cho học sinh hoặc học sinh tự đăng ký và liên hệ giáo viên để được thêm vào lớp. Admin có thể phân quyền và quản lý toàn bộ người dùng.',
  },
  {
    q: 'Dữ liệu của tôi có được bảo mật không?',
    a: 'Có. Tất cả dữ liệu được mã hóa và lưu trữ an toàn. Chúng tôi không chia sẻ thông tin cá nhân với bất kỳ bên thứ ba nào.',
  },
  {
    q: 'Tôi có thể xuất đề thi ra file không?',
    a: 'Có! Bạn có thể xuất đề thi ra định dạng PDF. Tính năng xuất Word đang được phát triển và sẽ ra mắt trong thời gian tới.',
  },
  {
    q: 'Hỗ trợ công thức toán học không?',
    a: 'Có. Hệ thống hỗ trợ đầy đủ công thức LaTeX cho Toán, Vật lý, Hóa học. Câu hỏi được hiển thị với công thức đúng định dạng khoa học.',
  },
];

function FAQItem({ faq }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden transition-shadow hover:shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-800">{faq.q}</span>
        <span className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
          <FiChevronDown className={`w-5 h-5 flex-shrink-0 ${open ? 'text-emerald-500' : 'text-gray-400'}`} />
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
        </div>
      </div>
    </div>
  );
}

function GuidePage() {
  const [activeRole, setActiveRole] = useState('teacher');

  return (
    <div className="min-h-screen">
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%  { transform: translate(20px, -24px) scale(1.08); }
          66%  { transform: translate(-16px, 16px) scale(0.94); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.3; }
          50% { transform: translateY(-18px) scale(1.3); opacity: 0.6; }
        }
        .animate-slide-up { animation: slideUp 0.65s ease both; }
        .animate-blob     { animation: blob 9s infinite ease-in-out; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .animation-delay-2000 { animation-delay: 2s; }
      `}</style>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-20 lg:py-28">
        <div className="absolute top-10 left-10 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-blob" />
        <div className="absolute top-40 right-10 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" style={{ animationDelay: '3s' }} />
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-emerald-400 rounded-full opacity-30"
            style={{
              left: `${8 + i * 8}%`,
              top: `${20 + (i % 4) * 20}%`,
              animation: `float ${3 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-slide-up inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full text-emerald-600 text-sm font-medium mb-6">
            <FiZap className="w-4 h-4" />
            <span>Hướng dẫn sử dụng</span>
          </div>
          <h1 className="animate-slide-up delay-100 text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
            Bắt đầu chỉ trong
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500"> vài phút</span>
          </h1>
          <p className="animate-slide-up delay-200 text-lg text-gray-600 max-w-2xl mx-auto">
            Hướng dẫn từng bước giúp bạn làm quen và sử dụng thành thạo Learn Smart nhanh chóng.
          </p>
        </div>
      </section>

      {/* Step-by-step Guide */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Hướng dẫn theo vai trò</h2>
            {/* Role Tabs */}
            <div className="inline-flex bg-gray-100 p-1 rounded-xl gap-1">
              <button
                onClick={() => setActiveRole('teacher')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeRole === 'teacher'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <IoSchoolOutline className="w-4 h-4" />
                Giáo viên
              </button>
              <button
                onClick={() => setActiveRole('student')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeRole === 'student'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <IoBulbOutline className="w-4 h-4" />
                Học sinh
              </button>
            </div>
          </div>

          {/* Steps */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 top-10 bottom-10 w-0.5 bg-gradient-to-b from-emerald-200 to-teal-200 hidden md:block"></div>

            <div className="space-y-6">
              {steps[activeRole].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.step} className="flex gap-6 items-start">
                    {/* Step circle */}
                    <div className={`relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br ${s.color} flex flex-col items-center justify-center flex-shrink-0 shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                      <span className="text-white text-[10px] font-bold mt-0.5">Bước {s.step}</span>
                    </div>
                    {/* Content */}
                    <div className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">{s.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full transition-all shadow-lg shadow-emerald-500/25"
            >
              Bắt đầu ngay <FiArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Mẹo sử dụng hiệu quả</h2>
            <p className="text-gray-600">Những gợi ý giúp bạn khai thác tối đa sức mạnh của Learn Smart</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: 'Tài liệu rõ ràng = Câu hỏi chất lượng',
                desc: 'Upload tài liệu có định dạng rõ ràng, đánh số trang và tiêu đề đầy đủ để AI tạo câu hỏi chính xác hơn.',
                color: 'bg-blue-50 border-blue-100',
                dot: 'bg-blue-500',
              },
              {
                title: 'Kiểm tra câu hỏi trước khi xuất bản',
                desc: 'Luôn xem lại câu hỏi do AI tạo ra và chỉnh sửa nếu cần trước khi xuất bản cho học sinh làm bài.',
                color: 'bg-emerald-50 border-emerald-100',
                dot: 'bg-emerald-500',
              },
              {
                title: 'Dùng game để ôn bài',
                desc: 'Tạo quiz và trò chơi sau mỗi chương học để học sinh ôn tập vui vẻ và ghi nhớ lâu hơn.',
                color: 'bg-purple-50 border-purple-100',
                dot: 'bg-purple-500',
              },
              {
                title: 'Phân tích thống kê định kỳ',
                desc: 'Xem báo cáo thống kê hàng tuần để phát hiện học sinh cần hỗ trợ và điều chỉnh phương pháp dạy.',
                color: 'bg-orange-50 border-orange-100',
                dot: 'bg-orange-500',
              },
              {
                title: 'Tổ chức tài liệu khoa học',
                desc: 'Đặt tên file rõ ràng theo môn học, lớp và chương để dễ tìm kiếm và tái sử dụng sau này.',
                color: 'bg-pink-50 border-pink-100',
                dot: 'bg-pink-500',
              },
              {
                title: 'Sử dụng chat để hỗ trợ kịp thời',
                desc: 'Khuyến khích học sinh dùng tính năng chat để hỏi bài. Phản hồi nhanh sẽ giúp học sinh tiến bộ hơn.',
                color: 'bg-teal-50 border-teal-100',
                dot: 'bg-teal-500',
              },
            ].map((tip, i) => (
              <div key={i} className={`p-6 rounded-2xl border ${tip.color} hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300`}>
                <div className="flex items-start gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${tip.dot} flex-shrink-0 mt-1.5`}></div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1.5">{tip.title}</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{tip.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Câu hỏi thường gặp</h2>
            <p className="text-gray-600">Giải đáp các thắc mắc phổ biến nhất từ người dùng</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FAQItem key={i} faq={faq} />
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-gray-600 mb-4">Vẫn còn câu hỏi? Liên hệ với chúng tôi!</p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full transition-all"
            >
              Gửi câu hỏi <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default GuidePage;
