import { Link } from 'react-router-dom';
import {
  FiArrowRight, FiCheckCircle, FiZap, FiUsers, FiAward, FiBarChart2, FiShield, FiClock
} from 'react-icons/fi';
import {
  IoDocumentTextOutline,
  IoCreateOutline,
  IoClipboardOutline,
  IoGameControllerOutline,
  IoSparklesOutline,
  IoSchoolOutline,
  IoBulbOutline,
  IoPeopleOutline,
  IoStatsChartOutline,
  IoChatbubbleEllipsesOutline,
  IoCloudUploadOutline,
  IoShieldCheckmarkOutline,
} from 'react-icons/io5';

const mainFeatures = [
  {
    icon: IoDocumentTextOutline,
    title: 'Tóm tắt tài liệu thông minh',
    description: 'AI tự động phân tích và tóm tắt tài liệu, SGK theo nhiều định dạng: danh sách, bảng, gạch đầu dòng, lên khung ý tưởng.',
    color: 'from-blue-500 to-cyan-500',
    items: ['Tóm tắt theo danh sách', 'Tóm tắt dạng bảng', 'Lên khung ý tưởng', 'Gợi ý hoạt động dạy học'],
  },
  {
    icon: IoCreateOutline,
    title: 'Tạo câu hỏi theo mức độ',
    description: 'Tự động tạo câu hỏi đa dạng theo thang Bloom: Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao, có hỗ trợ công thức toán học.',
    color: 'from-emerald-500 to-teal-500',
    items: ['Nhận biết & Thông hiểu', 'Vận dụng & Sáng tạo', 'Công thức LaTeX', 'Câu hỏi trắc nghiệm & tự luận'],
  },
  {
    icon: IoClipboardOutline,
    title: 'Gợi ý đề kiểm tra',
    description: 'Tạo đề kiểm tra hoàn chỉnh kèm đáp án chi tiết và bảng ma trận đề thi đúng chuẩn Bộ Giáo dục.',
    color: 'from-purple-500 to-pink-500',
    items: ['Đề + đáp án chi tiết', 'Bảng ma trận chuẩn', 'Phân bố mức độ', 'Xuất file PDF/Word'],
  },
  {
    icon: IoGameControllerOutline,
    title: 'Trò chơi học tập',
    description: 'Thiết kế quiz tương tác, trò chơi ghi nhớ, game sắp xếp từ ngữ giúp học sinh học tập vui vẻ, hiệu quả hơn.',
    color: 'from-orange-500 to-red-500',
    items: ['Quiz tương tác', 'Game ghi nhớ', 'Game sắp xếp', 'Bảng xếp hạng'],
  },
  {
    icon: IoSparklesOutline,
    title: 'Nhận xét học sinh',
    description: 'Gợi ý nhận xét học sinh theo tiêu chí đánh giá, mức độ năng lực một cách chuyên nghiệp và cá nhân hóa.',
    color: 'from-indigo-500 to-purple-500',
    items: ['Theo tiêu chí', 'Cá nhân hóa', 'Đa dạng phong cách', 'Xuất hàng loạt'],
  },
  {
    icon: IoChatbubbleEllipsesOutline,
    title: 'Chat & Hỏi đáp',
    description: 'Hệ thống chat nội bộ giữa giáo viên và học sinh, hỗ trợ giải đáp thắc mắc và trao đổi bài học.',
    color: 'from-teal-500 to-emerald-500',
    items: ['Chat thời gian thực', 'Đính kèm tài liệu', 'Lịch sử trò chuyện', 'Thông báo tin nhắn'],
  },
  {
    icon: IoStatsChartOutline,
    title: 'Thống kê & Báo cáo',
    description: 'Theo dõi tiến độ học tập của từng học sinh qua biểu đồ trực quan, phân tích điểm số và xác định điểm yếu.',
    color: 'from-cyan-500 to-blue-500',
    items: ['Biểu đồ tiến độ', 'Phân tích điểm số', 'Báo cáo chi tiết', 'So sánh lớp học'],
  },
  {
    icon: IoCloudUploadOutline,
    title: 'Quản lý tài liệu',
    description: 'Upload, lưu trữ và phân loại tài liệu dạy học dễ dàng. Hỗ trợ PDF, Word, Excel và nhiều định dạng khác.',
    color: 'from-rose-500 to-pink-500',
    items: ['PDF, DOCX, XLSX', 'Phân loại thư mục', 'Tìm kiếm nhanh', 'Chia sẻ với học sinh'],
  },
  {
    icon: IoShieldCheckmarkOutline,
    title: 'Phân quyền theo vai trò',
    description: 'Hệ thống phân quyền 3 cấp: Admin, Giáo viên, Học sinh với giao diện và tính năng phù hợp từng vai trò.',
    color: 'from-gray-600 to-gray-800',
    items: ['Admin toàn quyền', 'Giáo viên quản lý lớp', 'Học sinh làm bài', 'Đăng nhập Google'],
  },
];

const highlights = [
  { icon: FiZap, title: 'Powered by ChatGPT', desc: 'Sử dụng ChatGPT – mô hình AI tiên tiến nhất của OpenAI' },
  { icon: FiClock, title: 'Tiết kiệm 70% thời gian', desc: 'Tự động hóa các công việc soạn thảo lặp đi lặp lại' },
  { icon: FiShield, title: 'Bảo mật dữ liệu', desc: 'Dữ liệu được mã hóa và bảo vệ an toàn tuyệt đối' },
  { icon: FiUsers, title: 'Đa người dùng', desc: 'Hỗ trợ hàng nghìn giáo viên và học sinh đồng thời' },
];

const roles = [
  {
    title: 'Dành cho Giáo viên',
    color: 'from-emerald-500 to-teal-500',
    icon: IoSchoolOutline,
    items: [
      'Tóm tắt SGK và tài liệu',
      'Soạn giáo án tự động',
      'Tạo câu hỏi & đề kiểm tra',
      'Thiết kế trò chơi học tập',
      'Nhận xét học sinh hàng loạt',
      'Thống kê kết quả lớp học',
    ],
  },
  {
    title: 'Dành cho Học sinh',
    color: 'from-blue-500 to-indigo-500',
    icon: IoBulbOutline,
    items: [
      'Làm bài kiểm tra trực tuyến',
      'Tham gia trò chơi học tập',
      'Xem kết quả & phân tích',
      'Chat hỏi đáp với giáo viên',
      'Truy cập tài liệu học tập',
      'Theo dõi tiến độ bản thân',
    ],
  },
  {
    title: 'Dành cho Admin',
    color: 'from-purple-500 to-pink-500',
    icon: FiShield,
    items: [
      'Quản lý tài khoản người dùng',
      'Phân quyền giáo viên/học sinh',
      'Xem báo cáo toàn hệ thống',
      'Quản lý đề thi & câu hỏi',
      'Cấu hình hệ thống',
      'Theo dõi hoạt động nền tảng',
    ],
  },
];

function FeaturesPage() {
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
        .delay-300 { animation-delay: 0.3s; }
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
            <span>Tính năng nổi bật</span>
          </div>
          <h1 className="animate-slide-up delay-100 text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
            Bộ công cụ AI toàn diện cho
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500"> giáo dục</span>
          </h1>
          <p className="animate-slide-up delay-200 text-lg text-gray-600 max-w-3xl mx-auto mb-10">
            Learn Smart cung cấp đầy đủ công cụ AI giúp giáo viên tiết kiệm thời gian soạn giảng và học sinh học tập hiệu quả hơn mỗi ngày.
          </p>
          <div className="animate-slide-up delay-300 flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full transition-all shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5"
            >
              Dùng thử miễn phí <FiArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/guide"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-full border border-gray-200 transition-all hover:-translate-y-0.5"
            >
              Xem hướng dẫn
            </Link>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map((h, i) => {
              const Icon = h.icon;
              return (
                <div key={i} className="flex items-start gap-4 p-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{h.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{h.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">Tất cả tính năng</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Mọi công cụ bạn cần để dạy và học hiệu quả, tất cả trong một nền tảng duy nhất.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mainFeatures.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
                  <p className="text-gray-500 text-sm mb-4 leading-relaxed">{feature.description}</p>
                  <ul className="space-y-1.5">
                    {feature.items.map((item, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                        <FiCheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Role-based Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">Phù hợp với mọi vai trò</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Giao diện và tính năng được thiết kế riêng biệt cho từng đối tượng người dùng.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {roles.map((role, i) => {
              const Icon = role.icon;
              return (
                <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className={`bg-gradient-to-br ${role.color} p-6 text-white`}>
                    <Icon className="w-10 h-10 mb-3" />
                    <h3 className="text-xl font-bold">{role.title}</h3>
                  </div>
                  <div className="bg-white p-6">
                    <ul className="space-y-3">
                      {role.items.map((item, j) => (
                        <li key={j} className="flex items-center gap-3 text-sm text-gray-700">
                          <FiCheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-emerald-500 to-teal-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Sẵn sàng trải nghiệm tất cả tính năng?
          </h2>
          <p className="text-emerald-50 mb-8 text-lg">
            Đăng ký miễn phí ngay hôm nay, không cần thẻ tín dụng.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-600 font-semibold rounded-full hover:bg-gray-50 transition-all shadow-xl"
            >
              Đăng ký miễn phí <FiArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white font-semibold rounded-full hover:bg-emerald-700 transition-all"
            >
              Liên hệ tư vấn
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default FeaturesPage;
