import {
  FiTarget,
  FiHeart,
  FiUsers,
  FiAward,
  FiMail,
  FiMapPin,
  FiPhone,
} from 'react-icons/fi';
import {
  IoSchoolOutline,
  IoSparklesOutline,
  IoRocketOutline,
  IoBookOutline,
} from 'react-icons/io5';

const teamMembers = [
  {
    name: 'Nguyễn Văn A',
    role: 'Trưởng nhóm nghiên cứu',
    description: 'Chuyên gia về AI trong giáo dục',
    avatar: '👨‍🔬',
  },
  {
    name: 'Trần Thị B',
    role: 'Phát triển phần mềm',
    description: 'Kỹ sư phần mềm full-stack',
    avatar: '👩‍💻',
  },
  {
    name: 'Lê Văn C',
    role: 'Nghiên cứu giáo dục',
    description: 'Chuyên gia phương pháp giảng dạy',
    avatar: '👨‍🏫',
  },
  {
    name: 'Phạm Thị D',
    role: 'Thiết kế UX/UI',
    description: 'Thiết kế trải nghiệm người dùng',
    avatar: '👩‍🎨',
  },
];

const milestones = [
  { year: '2024', title: 'Khởi động dự án', description: 'Bắt đầu nghiên cứu ứng dụng AI trong giáo dục tại Tuyên Quang' },
  { year: '2024', title: 'Phát triển MVP', description: 'Hoàn thành phiên bản đầu tiên với các tính năng cốt lõi' },
  { year: '2025', title: 'Ra mắt beta', description: 'Triển khai thử nghiệm tại các trường học trong tỉnh' },
  { year: '2025', title: 'Mở rộng', description: 'Phát triển thêm tính năng và mở rộng phạm vi sử dụng' },
];

const values = [
  {
    icon: IoSparklesOutline,
    title: 'Đổi mới sáng tạo',
    description: 'Ứng dụng công nghệ AI tiên tiến nhất vào giáo dục',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: FiHeart,
    title: 'Tận tâm',
    description: 'Luôn đặt lợi ích của giáo viên và học sinh lên hàng đầu',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: FiUsers,
    title: 'Cộng đồng',
    description: 'Xây dựng cộng đồng giáo viên chia sẻ và hỗ trợ lẫn nhau',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: FiAward,
    title: 'Chất lượng',
    description: 'Cam kết mang đến sản phẩm chất lượng cao và đáng tin cậy',
    color: 'from-purple-500 to-indigo-500',
  },
];

function About() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full text-emerald-600 text-sm font-medium mb-6">
              <IoSchoolOutline className="w-4 h-4" />
              <span>Về chúng tôi</span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 leading-tight mb-6">
              Nâng tầm giáo dục với
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500"> trí tuệ nhân tạo</span>
            </h1>

            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Learn Smart là dự án nghiên cứu khoa học ứng dụng AI vào giáo dục,
              được phát triển tại tỉnh Tuyên Quang với mục tiêu hỗ trợ giáo viên
              trong công tác giảng dạy và quản lý học sinh.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 rounded-full text-emerald-600 text-sm font-medium mb-4">
                <FiTarget className="w-4 h-4" />
                <span>Sứ mệnh</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                Giúp giáo viên tập trung vào điều quan trọng nhất
              </h2>
              <p className="text-gray-600 mb-4">
                Chúng tôi tin rằng giáo viên nên dành thời gian cho việc truyền cảm hứng
                và kết nối với học sinh, thay vì bị cuốn vào các công việc hành chính lặp đi lặp lại.
              </p>
              <p className="text-gray-600 mb-6">
                Learn Smart được xây dựng để tự động hóa các tác vụ như tóm tắt tài liệu,
                tạo câu hỏi kiểm tra, thiết kế đề thi, và viết nhận xét học sinh -
                giúp giáo viên tiết kiệm hàng giờ mỗi ngày.
              </p>
              <div className="flex flex-wrap gap-3">
                {['Tiết kiệm thời gian', 'Nâng cao chất lượng', 'Dễ sử dụng'].map((tag) => (
                  <span key={tag} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-sm font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-6">
                {[
                  { icon: IoBookOutline, label: 'Tóm tắt tài liệu', value: 'AI' },
                  { icon: IoRocketOutline, label: 'Tạo đề thi', value: 'Tự động' },
                  { icon: IoSparklesOutline, label: 'Nhận xét HS', value: 'Thông minh' },
                  { icon: IoSchoolOutline, label: 'Soạn giáo án', value: 'Nhanh chóng' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="bg-white rounded-xl p-4 text-center shadow-sm">
                      <Icon className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-800">{item.label}</p>
                      <p className="text-xs text-emerald-500 font-semibold">{item.value}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Giá trị cốt lõi</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Những giá trị định hướng cho mọi hoạt động của chúng tôi
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, i) => {
              const Icon = value.icon;
              return (
                <div key={i} className="bg-white rounded-2xl p-6 text-center hover:shadow-lg transition-all">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${value.color} flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{value.title}</h3>
                  <p className="text-sm text-gray-600">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Hành trình phát triển</h2>
            <p className="text-gray-600">Các cột mốc quan trọng trong quá trình xây dựng dự án</p>
          </div>

          <div className="space-y-8">
            {milestones.map((milestone, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-20 text-right">
                  <span className="text-sm font-bold text-emerald-500">{milestone.year}</span>
                </div>
                <div className="relative">
                  <div className="w-4 h-4 bg-emerald-500 rounded-full mt-1"></div>
                  {i < milestones.length - 1 && (
                    <div className="absolute top-5 left-1.5 w-0.5 h-16 bg-emerald-200"></div>
                  )}
                </div>
                <div className="pb-8">
                  <h3 className="text-lg font-semibold text-gray-800">{milestone.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Đội ngũ phát triển</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Những người đứng sau Learn Smart
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 text-center hover:shadow-lg transition-all">
                <div className="text-5xl mb-4">{member.avatar}</div>
                <h3 className="text-lg font-semibold text-gray-800">{member.name}</h3>
                <p className="text-sm text-emerald-500 font-medium mb-2">{member.role}</p>
                <p className="text-sm text-gray-600">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-500 to-teal-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Liên hệ với chúng tôi</h2>
          <p className="text-emerald-50 mb-8">
            Bạn có câu hỏi hoặc muốn hợp tác? Hãy liên hệ ngay!
          </p>

          <div className="flex flex-wrap justify-center gap-6 mb-8">
            {[
              { icon: FiMail, text: 'contact@learnsmart.vn' },
              { icon: FiPhone, text: '0123 456 789' },
              { icon: FiMapPin, text: 'Tuyên Quang, Việt Nam' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-center gap-2 text-white">
                  <Icon className="w-5 h-5" />
                  <span>{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
