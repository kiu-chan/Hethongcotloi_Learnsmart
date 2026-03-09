import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiCheckCircle,
  FiUsers,
  FiAward,
  FiTrendingUp,
  FiZap
} from 'react-icons/fi';
import {
  IoBookOutline,
  IoDocumentTextOutline,
  IoGameControllerOutline,
  IoCreateOutline,
  IoSparklesOutline,
  IoBulbOutline,
  IoSchoolOutline,
  IoClipboardOutline,
  IoPeopleOutline,
  IoFlaskOutline
} from 'react-icons/io5';

const API = '/api';

const features = [
  {
    icon: IoDocumentTextOutline,
    title: 'Tóm tắt tài liệu',
    description: 'Tự động tóm tắt theo danh sách, bảng, gạch đầu dòng, lên khung, gợi ý hoạt động',
    color: 'from-blue-500 to-cyan-500',
    items: ['Danh sách', 'Bảng', 'Gạch đầu dòng', 'Lên khung']
  },
  {
    icon: IoCreateOutline,
    title: 'Tạo câu hỏi thông minh',
    description: 'Tạo câu hỏi đa dạng theo các mức độ: Nhận biết, Thông hiểu, Vận dụng',
    color: 'from-emerald-500 to-teal-500',
    items: ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao']
  },
  {
    icon: IoClipboardOutline,
    title: 'Gợi ý đề thi',
    description: 'Tạo đề thi hoàn chỉnh với đáp án và bảng ma trận',
    color: 'from-purple-500 to-pink-500',
    items: ['Đề + đáp án', 'Ma trận', 'Đề sát thực tế']
  },
  {
    icon: IoGameControllerOutline,
    title: 'Tạo quiz & trò chơi',
    description: 'Thiết kế quiz, trò chơi học tập, nhiệm vụ nhóm, thẻ học tập',
    color: 'from-orange-500 to-red-500',
    items: ['Quiz', 'Trò chơi', 'Nhiệm vụ nhóm', 'Thẻ học tập']
  },
  {
    icon: IoSparklesOutline,
    title: 'Gợi ý nhận xét',
    description: 'Nhận xét học sinh theo tiêu chí, mức độ một cách chuyên nghiệp',
    color: 'from-indigo-500 to-purple-500',
    items: ['Theo tiêu chí', 'Theo mức độ', 'Cá nhân hóa']
  },
  {
    icon: IoSchoolOutline,
    title: 'Công cụ giáo viên',
    description: 'Bộ công cụ toàn diện hỗ trợ công việc giảng dạy hàng ngày',
    color: 'from-pink-500 to-rose-500',
    items: ['SGK', 'Soạn giáo án', 'Ra câu hỏi', 'Làm đề', 'Kế hoạch']
  }
];

const teacherTools = [
  { icon: IoDocumentTextOutline, title: 'Tóm tắt tài liệu/SGK', color: '#3B82F6' },
  { icon: IoCreateOutline, title: 'Soạn giáo án', color: '#10B981' },
  { icon: IoBulbOutline, title: 'Ra câu hỏi theo mức độ', color: '#F59E0B' },
  { icon: IoClipboardOutline, title: 'Làm đề kiểm tra', color: '#8B5CF6' },
  { icon: IoGameControllerOutline, title: 'Thiết kế trò chơi/hoạt động', color: '#EC4899' },
  { icon: IoSparklesOutline, title: 'Viết nhận xét', color: '#06B6D4' },
  { icon: IoSchoolOutline, title: 'Làm kế hoạch dạy học', color: '#EF4444' },
];

const formatStatValue = (value) => {
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace('.0', '')}K+`;
  return `${value}+`;
};

function Home() {
  const [siteStats, setSiteStats] = useState({
    teachers: 0,
    students: 0,
    documents: 0,
    exams: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API}/public/stats`);
        const data = await res.json();
        if (data.success) {
          setSiteStats(data.stats);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    { icon: FiUsers, value: formatStatValue(siteStats.teachers), label: 'Giáo viên' },
    { icon: IoSchoolOutline, value: formatStatValue(siteStats.students), label: 'Học sinh' },
    { icon: IoDocumentTextOutline, value: formatStatValue(siteStats.documents), label: 'Tài liệu' },
    { icon: FiAward, value: formatStatValue(siteStats.exams), label: 'Đề thi' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full text-emerald-600 text-sm font-medium mb-6">
              <FiZap className="w-4 h-4" />
              <span>Powered by AI</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold text-gray-800 leading-tight mb-6">
              Notebook thông minh cho
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500"> giáo viên hiện đại</span>
            </h1>

            <p className="text-lg lg:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Tự động hóa công việc giảng dạy với AI: Tóm tắt tài liệu, tạo câu hỏi, thiết kế đề thi, và nhiều hơn nữa
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full transition-all shadow-lg shadow-emerald-500/25"
              >
                Bắt đầu miễn phí
                <FiArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-full border border-gray-200 transition-all"
              >
                Tìm hiểu thêm
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow-md mb-2">
                      <Icon className="w-6 h-6 text-emerald-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
              Tính năng nổi bật
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Bộ công cụ AI toàn diện giúp giáo viên tiết kiệm thời gian và nâng cao chất lượng giảng dạy
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-xl transition-all group"
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{feature.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {feature.items.map((item, j) => (
                      <span key={j} className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Teacher Tools Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Công cụ giáo viên
            </h2>
            <p className="text-gray-600">Hỗ trợ toàn diện cho công việc giảng dạy</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {teacherTools.map((tool, i) => {
              const Icon = tool.icon;
              return (
                <div
                  key={i}
                  className="p-6 bg-white rounded-xl hover:shadow-lg transition-all group cursor-pointer"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: `${tool.color}15` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: tool.color }} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{tool.title}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-500 to-teal-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Sẵn sàng trải nghiệm?
          </h2>
          <p className="text-emerald-50 mb-8 text-lg">
            Tham gia cùng hàng nghìn giáo viên đang sử dụng Learn Smart mỗi ngày
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-600 font-semibold rounded-full hover:bg-gray-50 transition-all shadow-xl"
            >
              Đăng ký miễn phí
              <FiArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white font-semibold rounded-full hover:bg-emerald-700 transition-all"
            >
              Tìm hiểu thêm
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -30px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(30px, 10px) scale(1.05); }
        }

        .animate-blob {
          animation: blob 8s infinite ease-in-out;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}

export default Home;
