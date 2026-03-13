import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiMail, FiPhone, FiMapPin, FiArrowRight, FiCheckCircle, FiZap, FiSend,
} from 'react-icons/fi';
import { IoBookOutline, IoTimeOutline, IoChatbubbleEllipsesOutline } from 'react-icons/io5';

const contactInfo = [
  {
    icon: FiMail,
    title: 'Email hỗ trợ',
    value: 'support@learn-smart.vn',
    desc: 'Phản hồi trong vòng 24 giờ làm việc',
    color: 'bg-blue-50',
    iconColor: 'text-blue-500',
  },
  {
    icon: FiPhone,
    title: 'Điện thoại',
    value: '0968 123 456',
    desc: 'Thứ 2 – Thứ 6, 8:00 – 17:00',
    color: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
  },
  {
    icon: FiMapPin,
    title: 'Địa chỉ',
    value: 'Tỉnh Tuyên Quang, Việt Nam',
    desc: 'Sở Giáo dục & Đào tạo Tuyên Quang',
    color: 'bg-purple-50',
    iconColor: 'text-purple-500',
  },
  {
    icon: IoTimeOutline,
    title: 'Giờ hỗ trợ',
    value: '8:00 – 17:00',
    desc: 'Thứ 2 đến Thứ 6 (trừ lễ tết)',
    color: 'bg-orange-50',
    iconColor: 'text-orange-500',
  },
];

const subjects = [
  'Hỗ trợ kỹ thuật',
  'Báo lỗi hệ thống',
  'Góp ý tính năng',
  'Hợp tác & Đối tác',
  'Tư vấn sử dụng',
  'Khác',
];

function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setError('Vui lòng điền đầy đủ tất cả các trường');
      return;
    }

    setIsLoading(true);
    // Simulate API call (replace with actual API when available)
    await new Promise((r) => setTimeout(r, 1200));
    setIsLoading(false);
    setSuccess(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

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
            <IoChatbubbleEllipsesOutline className="w-4 h-4" />
            <span>Liên hệ với chúng tôi</span>
          </div>
          <h1 className="animate-slide-up delay-100 text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
            Chúng tôi luôn sẵn sàng
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500"> hỗ trợ bạn</span>
          </h1>
          <p className="animate-slide-up delay-200 text-lg text-gray-600 max-w-2xl mx-auto">
            Hãy để lại tin nhắn, chúng tôi sẽ phản hồi trong thời gian sớm nhất.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {contactInfo.map((info, i) => {
              const Icon = info.icon;
              return (
                <div key={i} className={`${info.color} rounded-2xl p-5 border border-gray-100 hover:-translate-y-1 hover:shadow-md transition-all duration-300`}>
                  <div className="flex items-center gap-3 mb-3">
                    <Icon className={`w-5 h-5 ${info.iconColor}`} />
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{info.title}</span>
                  </div>
                  <p className="font-semibold text-gray-800 text-sm mb-0.5">{info.value}</p>
                  <p className="text-xs text-gray-500">{info.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-10 items-start">
            {/* Left: Info & Social */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <Link to="/" className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center shadow-lg">
                    <IoBookOutline className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Learn Smart</h2>
                    <p className="text-xs text-gray-500">Học tập thông minh</p>
                  </div>
                </Link>
                <p className="text-gray-600 leading-relaxed">
                  Nền tảng học tập AI hỗ trợ giáo viên và học sinh tỉnh Tuyên Quang.
                  Chúng tôi cam kết hỗ trợ nhanh chóng và nhiệt tình.
                </p>
              </div>

              {/* Why contact */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Lý do liên hệ</h3>
                <ul className="space-y-3">
                  {[
                    'Báo lỗi hoặc sự cố kỹ thuật',
                    'Góp ý cải thiện tính năng',
                    'Hỗ trợ sử dụng hệ thống',
                    'Hợp tác và đối tác',
                    'Đăng ký tài khoản giáo viên',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <FiCheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick Links */}
              <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-3">Khám phá thêm</h3>
                <div className="space-y-2">
                  <Link to="/features" className="flex items-center justify-between text-sm text-emerald-700 hover:text-emerald-800 py-1.5">
                    <span>Xem tất cả tính năng</span>
                    <FiArrowRight className="w-4 h-4" />
                  </Link>
                  <Link to="/guide" className="flex items-center justify-between text-sm text-emerald-700 hover:text-emerald-800 py-1.5 border-t border-emerald-100">
                    <span>Hướng dẫn sử dụng</span>
                    <FiArrowRight className="w-4 h-4" />
                  </Link>
                  <Link to="/register" className="flex items-center justify-between text-sm text-emerald-700 hover:text-emerald-800 py-1.5 border-t border-emerald-100">
                    <span>Đăng ký tài khoản</span>
                    <FiArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Right: Contact Form */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                {success ? (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiCheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Gửi thành công!</h3>
                    <p className="text-gray-600 mb-6">
                      Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.
                    </p>
                    <button
                      onClick={() => setSuccess(false)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all"
                    >
                      Gửi tin nhắn khác
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Gửi tin nhắn</h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid sm:grid-cols-2 gap-5">
                        {/* Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Họ và tên <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Nguyễn Văn A"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-700 text-sm"
                            required
                          />
                        </div>
                        {/* Email */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Email <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="email@example.com"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-700 text-sm"
                            required
                          />
                        </div>
                      </div>

                      {/* Subject */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Chủ đề <span className="text-red-400">*</span>
                        </label>
                        <select
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-700 text-sm bg-white"
                          required
                        >
                          <option value="">-- Chọn chủ đề --</option>
                          {subjects.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      {/* Message */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Nội dung <span className="text-red-400">*</span>
                        </label>
                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          rows={5}
                          placeholder="Mô tả chi tiết vấn đề hoặc câu hỏi của bạn..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-700 text-sm resize-none"
                          required
                        />
                        <p className="text-xs text-gray-400 mt-1">{formData.message.length}/1000 ký tự</p>
                      </div>

                      {/* Error */}
                      {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          {error}
                        </div>
                      )}

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3.5 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span>Đang gửi...</span>
                          </>
                        ) : (
                          <>
                            <FiSend className="w-5 h-5" />
                            <span>Gửi tin nhắn</span>
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-emerald-500 to-teal-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Chưa có tài khoản?</h2>
          <p className="text-emerald-50 mb-8">
            Đăng ký miễn phí và trải nghiệm ngay hôm nay!
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-600 font-semibold rounded-full hover:bg-gray-50 transition-all shadow-xl"
          >
            Đăng ký ngay <FiArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default ContactPage;
