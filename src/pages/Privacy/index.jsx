import { Link } from 'react-router-dom';
import { FiShield, FiChevronRight } from 'react-icons/fi';

const sections = [
  {
    id: 1,
    title: '1. Thông tin chúng tôi thu thập',
    content: `Chúng tôi thu thập các thông tin sau khi bạn sử dụng Learn Smart:

Thông tin bạn cung cấp:
• Họ tên, địa chỉ email, mật khẩu khi đăng ký tài khoản.
• Thông tin hồ sơ như ảnh đại diện, trường/lớp học (nếu có).
• Nội dung bạn tạo ra: bài kiểm tra, tài liệu, ghi chú, tin nhắn trong lớp học.

Thông tin thu thập tự động:
• Dữ liệu sử dụng: trang bạn truy cập, thời gian sử dụng, kết quả bài kiểm tra.
• Thông tin thiết bị: loại trình duyệt, hệ điều hành, địa chỉ IP (ở dạng ẩn danh).`,
  },
  {
    id: 2,
    title: '2. Mục đích sử dụng thông tin',
    content: `Thông tin thu thập được sử dụng để:
• Cung cấp và vận hành dịch vụ học tập, giảng dạy trên nền tảng.
• Cá nhân hóa trải nghiệm học tập (gợi ý bài học, theo dõi tiến độ).
• Gửi thông báo về hoạt động lớp học, bài kiểm tra, kết quả học tập.
• Cải thiện chất lượng dịch vụ thông qua phân tích dữ liệu tổng hợp, ẩn danh.
• Đảm bảo an ninh hệ thống và phòng chống gian lận.
• Liên hệ hỗ trợ khi bạn gặp vấn đề kỹ thuật.`,
  },
  {
    id: 3,
    title: '3. Bảo vệ thông tin học sinh (FERPA)',
    content: `Learn Smart cam kết bảo vệ thông tin của học sinh theo các nguyên tắc sau:
• Thông tin cá nhân của học sinh chỉ được truy cập bởi giáo viên và quản trị viên có thẩm quyền.
• Chúng tôi không bán, cho thuê hoặc chia sẻ thông tin học sinh với bên thứ ba vì mục đích thương mại.
• Dữ liệu học tập (điểm số, kết quả kiểm tra) chỉ được chia sẻ giữa học sinh và giáo viên phụ trách.
• Phụ huynh/người giám hộ có thể yêu cầu xem xét và xóa thông tin của học sinh dưới 13 tuổi.`,
  },
  {
    id: 4,
    title: '4. Chia sẻ thông tin',
    content: `Chúng tôi không bán thông tin cá nhân của bạn. Thông tin chỉ được chia sẻ trong các trường hợp:
• Nhà cung cấp dịch vụ đám mây (lưu trữ dữ liệu) với hợp đồng bảo mật nghiêm ngặt.
• Tuân thủ yêu cầu pháp lý từ cơ quan có thẩm quyền theo quy định pháp luật Việt Nam.
• Bảo vệ quyền lợi hợp pháp của Learn Smart, người dùng hoặc công chúng trong trường hợp khẩn cấp.`,
  },
  {
    id: 5,
    title: '5. Lưu trữ và bảo mật dữ liệu',
    content: `• Dữ liệu được lưu trữ trên máy chủ bảo mật với mã hóa SSL/TLS.
• Mật khẩu được mã hóa bằng thuật toán băm một chiều, không ai có thể đọc mật khẩu gốc của bạn.
• Chúng tôi thực hiện kiểm tra bảo mật định kỳ và cập nhật hệ thống để phòng chống lỗ hổng.
• Dữ liệu tài khoản đã xóa sẽ được xóa khỏi hệ thống sau tối đa 90 ngày.`,
  },
  {
    id: 6,
    title: '6. Quyền của bạn',
    content: `Bạn có các quyền sau đối với dữ liệu cá nhân:
• Quyền truy cập: xem thông tin cá nhân đang được lưu trữ.
• Quyền chỉnh sửa: cập nhật thông tin hồ sơ không chính xác.
• Quyền xóa: yêu cầu xóa tài khoản và dữ liệu liên quan.
• Quyền phản đối: phản đối một số hoạt động xử lý dữ liệu nhất định.
• Để thực hiện các quyền này, liên hệ qua trang Liên hệ của chúng tôi.`,
  },
  {
    id: 7,
    title: '7. Cookie và công nghệ theo dõi',
    content: `Learn Smart sử dụng cookie cần thiết để:
• Duy trì phiên đăng nhập của bạn.
• Ghi nhớ tùy chọn giao diện (chế độ sáng/tối, ngôn ngữ).
• Đảm bảo bảo mật phiên làm việc.

Chúng tôi không sử dụng cookie quảng cáo hoặc theo dõi hành vi ngoài phạm vi nền tảng.`,
  },
  {
    id: 8,
    title: '8. Thay đổi chính sách',
    content: `Chúng tôi có thể cập nhật chính sách bảo mật để phản ánh thay đổi trong dịch vụ hoặc pháp luật. Khi có thay đổi đáng kể, bạn sẽ được thông báo qua email hoặc thông báo trên nền tảng ít nhất 7 ngày trước khi thay đổi có hiệu lực.`,
  },
  {
    id: 9,
    title: '9. Liên hệ về quyền riêng tư',
    content: `Nếu bạn có câu hỏi hoặc lo ngại về chính sách bảo mật, hoặc muốn thực hiện quyền về dữ liệu cá nhân, vui lòng liên hệ với chúng tôi qua trang Liên hệ. Chúng tôi sẽ phản hồi trong vòng 5 ngày làm việc.`,
  },
];

function PrivacyPage() {
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
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 text-white py-16">
        <div className="absolute top-4 left-8 w-64 h-64 bg-white/10 rounded-full filter blur-3xl animate-blob" />
        <div className="absolute bottom-4 right-8 w-64 h-64 bg-indigo-300/20 rounded-full filter blur-3xl animate-blob animation-delay-2000" />
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
            <FiShield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Chính sách bảo mật</h1>
          <p className="text-blue-100 text-lg">Cập nhật lần cuối: 01/01/2025</p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-emerald-600 transition-colors">Trang chủ</Link>
          <FiChevronRight className="w-4 h-4" />
          <span className="text-gray-700 font-medium">Chính sách bảo mật</span>
        </nav>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Intro card */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
          <p className="text-blue-800 text-sm leading-relaxed">
            <strong>Learn Smart</strong> cam kết bảo vệ quyền riêng tư của người dùng, đặc biệt là học sinh và giáo viên.
            Chính sách này mô tả cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn khi sử dụng nền tảng học tập.
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
          <Link to="/terms" className="text-emerald-600 hover:underline font-medium">
            Điều khoản sử dụng
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

export default PrivacyPage;
