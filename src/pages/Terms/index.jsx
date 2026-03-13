import { Link } from 'react-router-dom';
import { FiFileText, FiChevronRight } from 'react-icons/fi';

const sections = [
  {
    id: 1,
    title: '1. Giới thiệu & Phạm vi áp dụng',
    content: `Learn Smart là nền tảng học tập trực tuyến được xây dựng nhằm hỗ trợ giáo viên và học sinh trong việc dạy và học. Các điều khoản này áp dụng cho tất cả người dùng truy cập và sử dụng dịch vụ tại hệ thống Learn Smart, bao gồm giáo viên, học sinh và quản trị viên.

Bằng cách đăng ký tài khoản hoặc sử dụng dịch vụ, bạn đồng ý ràng buộc với các điều khoản được quy định dưới đây.`,
  },
  {
    id: 2,
    title: '2. Tài khoản người dùng',
    content: `• Mỗi người dùng chỉ được đăng ký một tài khoản. Việc tạo nhiều tài khoản để lách quy định là vi phạm điều khoản.
• Bạn có trách nhiệm bảo mật thông tin đăng nhập. Không chia sẻ mật khẩu với bất kỳ ai.
• Thông tin đăng ký phải trung thực, chính xác. Tài khoản sử dụng thông tin giả mạo có thể bị khóa.
• Tài khoản học sinh chỉ được cấp bởi giáo viên/quản trị viên có thẩm quyền trong hệ thống.`,
  },
  {
    id: 3,
    title: '3. Quy tắc sử dụng',
    content: `Người dùng cam kết:
• Chỉ sử dụng nền tảng cho mục đích học tập, giảng dạy và nghiên cứu giáo dục.
• Không sao chép, phân phối, hoặc thương mại hóa nội dung trên nền tảng khi chưa có sự cho phép.
• Không đăng tải nội dung vi phạm pháp luật, xúc phạm, phân biệt đối xử hoặc có nội dung không phù hợp với lứa tuổi học sinh.
• Không cố tình phá hoại hoặc làm gián đoạn hệ thống, máy chủ, hoặc mạng lưới liên quan đến dịch vụ.
• Không sử dụng công cụ tự động, bot hoặc crawler để truy cập hệ thống trái phép.`,
  },
  {
    id: 4,
    title: '4. Quyền sở hữu nội dung',
    content: `• Nội dung do Learn Smart cung cấp (giao diện, tính năng, tài liệu mẫu) là tài sản của nền tảng và được bảo hộ quyền tác giả.
• Nội dung do giáo viên/học sinh tạo ra (bài kiểm tra, tài liệu, ghi chú) thuộc quyền sở hữu của người tạo. Tuy nhiên, người dùng cấp cho Learn Smart quyền lưu trữ và hiển thị nội dung trong phạm vi cung cấp dịch vụ.
• Khi xóa tài khoản, nội dung của bạn sẽ được xóa theo chính sách lưu trữ của hệ thống.`,
  },
  {
    id: 5,
    title: '5. Trách nhiệm của giáo viên',
    content: `• Giáo viên chịu trách nhiệm quản lý lớp học, danh sách học sinh được thêm vào hệ thống.
• Tài liệu, bài kiểm tra, trò chơi học tập do giáo viên tạo ra phải phù hợp với chương trình giảng dạy và lứa tuổi học sinh.
• Giáo viên không được thu thập thông tin cá nhân của học sinh ngoài phạm vi dịch vụ.`,
  },
  {
    id: 6,
    title: '6. Giới hạn trách nhiệm',
    content: `• Learn Smart cung cấp dịch vụ "nguyên trạng" (as-is). Chúng tôi không đảm bảo dịch vụ hoạt động liên tục không gián đoạn.
• Chúng tôi không chịu trách nhiệm về thiệt hại gián tiếp phát sinh từ việc sử dụng hoặc không thể sử dụng dịch vụ.
• Mọi tranh chấp liên quan đến nội dung học tập thuộc trách nhiệm của giáo viên và học sinh liên quan.`,
  },
  {
    id: 7,
    title: '7. Thay đổi điều khoản',
    content: `Learn Smart có quyền cập nhật điều khoản sử dụng bất kỳ lúc nào. Người dùng sẽ được thông báo qua email hoặc thông báo trên nền tảng khi có thay đổi quan trọng. Việc tiếp tục sử dụng dịch vụ sau khi thay đổi có nghĩa là bạn chấp nhận điều khoản mới.`,
  },
  {
    id: 8,
    title: '8. Liên hệ',
    content: `Nếu bạn có câu hỏi hoặc thắc mắc về điều khoản sử dụng, vui lòng liên hệ với chúng tôi qua trang Liên hệ trên nền tảng.`,
  },
];

function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%  { transform: translate(20px, -24px) scale(1.08); }
          66%  { transform: translate(-16px, 16px) scale(0.94); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.3; }
          50% { transform: translateY(-18px) scale(1.3); opacity: 0.6; }
        }
        .animate-blob { animation: blob 9s infinite ease-in-out; }
        .animation-delay-2000 { animation-delay: 2s; }
      `}</style>

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 text-white py-16">
        <div className="absolute top-4 left-8 w-64 h-64 bg-white/10 rounded-full filter blur-3xl animate-blob" />
        <div className="absolute bottom-4 right-8 w-64 h-64 bg-teal-300/20 rounded-full filter blur-3xl animate-blob animation-delay-2000" />
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-30"
            style={{
              left: `${8 + i * 8}%`,
              top: `${20 + (i % 4) * 20}%`,
              animation: `float ${3 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiFileText className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Điều khoản sử dụng</h1>
          <p className="text-emerald-100 text-lg">Cập nhật lần cuối: 01/01/2025</p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-emerald-600 transition-colors">Trang chủ</Link>
          <FiChevronRight className="w-4 h-4" />
          <span className="text-gray-700 font-medium">Điều khoản sử dụng</span>
        </nav>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Intro card */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-8">
          <p className="text-emerald-800 text-sm leading-relaxed">
            Vui lòng đọc kỹ các điều khoản dưới đây trước khi sử dụng nền tảng <strong>Learn Smart</strong>.
            Các điều khoản này điều chỉnh quyền và nghĩa vụ của bạn khi sử dụng dịch vụ học tập, giảng dạy và nghiên cứu trên hệ thống.
          </p>
        </div>

        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">{section.title}</h2>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{section.content}</p>
            </div>
          ))}
        </div>

        {/* Footer links */}
        <div className="mt-10 text-center text-sm text-gray-500">
          Xem thêm:{' '}
          <Link to="/privacy" className="text-emerald-600 hover:underline font-medium">
            Chính sách bảo mật
          </Link>
          {' '}·{' '}
          <Link to="/contact" className="text-emerald-600 hover:underline font-medium">
            Liên hệ hỗ trợ
          </Link>
        </div>
      </div>
    </div>
  );
}

export default TermsPage;
