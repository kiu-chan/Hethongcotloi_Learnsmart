import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiTarget,
  FiHeart,
  FiUsers,
  FiAward,
} from 'react-icons/fi';
import {
  IoSchoolOutline,
  IoSparklesOutline,
  IoRocketOutline,
  IoBookOutline,
} from 'react-icons/io5';

/* ─── DATA ─────────────────────────────────────────────── */

const allMembers = [
  {
    name: 'Chẩu Văn Vụ',
    role: 'Giáo viên chủ chốt',
    description: 'Định hướng nghiên cứu và triển khai ứng dụng AI trong dạy học',
    avatar: '👨‍🏫',
    tag: 'Nghiên cứu viên',
    gradient: 'from-emerald-400 to-teal-500',
    ring: 'ring-emerald-400',
  },
  {
    name: 'Ma Thị Vinh',
    role: 'Giáo viên chủ chốt',
    description: 'Phụ trách nội dung chương trình, kiểm tra và đánh giá học sinh',
    avatar: '👩‍🏫',
    tag: 'Nghiên cứu viên',
    gradient: 'from-teal-400 to-cyan-500',
    ring: 'ring-teal-400',
  },
  {
    name: 'Ma Thị Thu Thuý',
    role: 'Giáo viên chủ chốt',
    subrole: 'Định hướng nghiên cứu',
    description: 'Định hướng nghiên cứu và thiết kế phương pháp giảng dạy tích hợp công nghệ vào lớp học',
    avatar: '👩‍🏫',
    tag: 'Nghiên cứu viên',
    gradient: 'from-cyan-400 to-blue-500',
    ring: 'ring-cyan-400',
  },
  {
    name: 'Hoàng Bảo Khanh',
    role: 'Cộng tác viên phát triển web',
    description: 'Thiết kế và xây dựng toàn bộ nền tảng Learn Smart từ giao diện đến back-end',
    avatar: '👨‍💻',
    tag: 'Developer',
    gradient: 'from-blue-400 to-indigo-500',
    ring: 'ring-blue-400',
  },
];

const milestones = [
  {
    year: 'Q1 2024',
    title: 'Khởi động dự án',
    description: 'Bắt đầu nghiên cứu ứng dụng AI trong giáo dục tại tỉnh Tuyên Quang',
    done: true,
  },
  {
    year: 'Q3 2024',
    title: 'Phát triển MVP',
    description: 'Hoàn thành phiên bản đầu tiên với các tính năng cốt lõi',
    done: true,
  },
  {
    year: 'Q1 2025',
    title: 'Ra mắt beta',
    description: 'Triển khai thử nghiệm tại các trường học trong tỉnh',
    done: true,
  },
  {
    year: 'Q3 2025',
    title: 'Triển khai chính thức',
    description: 'Mở rộng sử dụng rộng rãi tới nhiều trường, lớp học trên địa bàn',
    done: true,
  },
  {
    year: 'Q1 2026',
    title: 'Nâng cấp toàn diện',
    description: 'Bổ sung tính năng AI nâng cao, trò chơi học tập và hệ thống thống kê',
    done: true,
  },
  {
    year: 'Tiếp theo',
    title: 'Mở rộng toàn tỉnh',
    description: 'Đưa Learn Smart đến với tất cả giáo viên và học sinh tỉnh Tuyên Quang',
    done: false,
  },
];

const values = [
  {
    icon: IoSparklesOutline,
    title: 'Đổi mới sáng tạo',
    description: 'Ứng dụng AI tiên tiến nhất vào giáo dục hiện đại',
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

const stats = [
  { value: 4, suffix: '+', label: 'Giáo viên tham gia' },
  { value: 10, suffix: '+', label: 'Tính năng AI' },
  { value: 2, suffix: ' năm', label: 'Nghiên cứu & phát triển' },
  { value: 100, suffix: '%', label: 'Miễn phí cho giáo viên' },
];

/* ─── COUNTER HOOK ──────────────────────────────────────── */
function useCounter(target, duration = 1500, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

/* ─── STAT ITEM ─────────────────────────────────────────── */
function StatItem({ value, suffix, label, started }) {
  const count = useCounter(value, 1200, started);
  return (
    <div className="text-center">
      <div className="text-4xl font-extrabold text-white mb-1">
        {count}{suffix}
      </div>
      <div className="text-emerald-100 text-sm">{label}</div>
    </div>
  );
}

/* ─── MAIN COMPONENT ────────────────────────────────────── */
function About() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [statsStarted, setStatsStarted] = useState(false);
  const statsRef = useRef(null);
  const autoRef = useRef(null);

  /* Auto-slide */
  const resetAuto = () => {
    clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      setActiveIdx((i) => (i + 1) % allMembers.length);
    }, 2000);
  };

  useEffect(() => {
    resetAuto();
    return () => clearInterval(autoRef.current);
  }, []);

  /* IntersectionObserver for stats counter */
  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsStarted(true); },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-24 lg:py-32">
        {/* blobs */}
        <div className="absolute top-16 left-8 w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-8 right-8 w-80 h-80 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '3s' }} />

        {/* floating particles */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-emerald-400 rounded-full opacity-30"
            style={{
              left: `${8 + (i * 8)}%`,
              top: `${20 + (i % 4) * 20}%`,
              animation: `float ${3 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) scale(1); opacity: 0.3; }
            50% { transform: translateY(-18px) scale(1.3); opacity: 0.6; }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.92); }
            to   { opacity: 1; transform: scale(1); }
          }
          .animate-slide-up  { animation: slideUp  0.7s ease both; }
          .animate-fade-in   { animation: fadeIn   0.8s ease both; }
          .animate-scale-in  { animation: scaleIn  0.5s ease both; }
          .delay-100 { animation-delay: 0.1s; }
          .delay-200 { animation-delay: 0.2s; }
          .delay-300 { animation-delay: 0.3s; }
          .delay-400 { animation-delay: 0.4s; }
          .delay-500 { animation-delay: 0.5s; }
        `}</style>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-slide-up inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur border border-emerald-200 rounded-full text-emerald-600 text-sm font-medium mb-6 shadow-sm">
            <IoSchoolOutline className="w-4 h-4" />
            <span>Dự án nghiên cứu khoa học – Tuyên Quang 2024–2026</span>
          </div>

          <h1 className="animate-slide-up delay-100 text-4xl lg:text-6xl font-extrabold text-gray-800 leading-tight mb-6">
            Nâng tầm giáo dục với
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500">
              trí tuệ nhân tạo
            </span>
          </h1>

          <p className="animate-slide-up delay-200 text-lg text-gray-600 max-w-2xl mx-auto mb-10">
            Learn Smart là nền tảng ứng dụng AI hỗ trợ giáo viên và học sinh,
            được phát triển tại tỉnh Tuyên Quang nhằm nâng cao chất lượng dạy và học.
          </p>

          <div className="animate-slide-up delay-300 flex flex-wrap justify-center gap-4">
            {['AI hỗ trợ giáo viên', 'Tạo đề thi tự động', 'Trò chơi học tập', 'Thống kê thông minh'].map((t) => (
              <span key={t} className="px-4 py-2 bg-white/90 border border-emerald-200 text-emerald-600 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow">
                ✦ {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BANNER ── */}
      <section ref={statsRef} className="py-14 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <StatItem key={i} {...s} started={statsStarted} />
            ))}
          </div>
        </div>
      </section>

      {/* ── MISSION ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 rounded-full text-emerald-600 text-sm font-medium mb-4">
                <FiTarget className="w-4 h-4" />
                <span>Sứ mệnh</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-5">
                Giúp giáo viên tập trung vào điều quan trọng nhất
              </h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Chúng tôi tin rằng giáo viên nên dành thời gian cho việc truyền cảm hứng
                và kết nối với học sinh, thay vì bị cuốn vào các công việc hành chính lặp đi lặp lại.
              </p>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Learn Smart tự động hóa tác vụ như tóm tắt tài liệu, tạo câu hỏi kiểm tra,
                thiết kế đề thi và viết nhận xét học sinh — giúp giáo viên tiết kiệm hàng giờ mỗi ngày.
              </p>
              <div className="flex flex-wrap gap-3">
                {['Tiết kiệm thời gian', 'Nâng cao chất lượng', 'Dễ sử dụng'].map((tag) => (
                  <span key={tag} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-sm font-medium border border-emerald-200">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 shadow-inner">
              <div className="grid grid-cols-2 gap-5">
                {[
                  { icon: IoBookOutline, label: 'Tóm tắt tài liệu', value: 'AI' },
                  { icon: IoRocketOutline, label: 'Tạo đề thi', value: 'Tự động' },
                  { icon: IoSparklesOutline, label: 'Nhận xét HS', value: 'Thông minh' },
                  { icon: IoSchoolOutline, label: 'Soạn giáo án', value: 'Nhanh chóng' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="bg-white rounded-2xl p-5 text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                      <Icon className="w-9 h-9 text-emerald-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-800">{item.label}</p>
                      <p className="text-xs text-emerald-500 font-bold mt-0.5">{item.value}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Giá trị cốt lõi</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Những giá trị định hướng mọi hoạt động của chúng tôi</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <div
                  key={i}
                  className="group bg-white rounded-2xl p-6 text-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-default"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${v.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{v.title}</h3>
                  <p className="text-sm text-gray-500">{v.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section className="py-20 bg-gray-50 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Đội ngũ thực hiện</h2>
            <p className="text-gray-500 text-sm">3 giáo viên nghiên cứu chủ chốt và 1 cộng tác viên kỹ thuật</p>
          </div>

          {/* 3-column slide: side | main | side — framer-motion spring */}
          <div className="relative mx-auto" style={{ maxWidth: '700px', height: '340px' }}>
            {allMembers.map((m, i) => {
              const n = allMembers.length;
              let offset = i - activeIdx;
              if (offset > n / 2) offset -= n;
              if (offset < -n / 2) offset += n;

              const isMain = offset === 0;
              const isSide = Math.abs(offset) === 1;
              const CARD_W = 250; // px

              return (
                <motion.div
                  key={i}
                  onClick={() => { if (!isMain) { setActiveIdx(i); resetAuto(); } }}
                  animate={{
                    x: offset * 195,
                    scale: isMain ? 1 : 0.82,
                    opacity: isMain ? 1 : isSide ? 0.55 : 0,
                    zIndex: isMain ? 10 : isSide ? 5 : 0,
                  }}
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    marginLeft: `-${CARD_W / 2}px`,
                    width: `${CARD_W}px`,
                    pointerEvents: isMain || isSide ? 'auto' : 'none',
                    cursor: isSide ? 'pointer' : 'default',
                  }}
                  className="rounded-2xl bg-white border border-gray-100 shadow-sm text-center"
                >
                  <div className="p-5 pt-6">
                    <div className={`mx-auto mb-3 rounded-full bg-gradient-to-br ${m.gradient} flex items-center justify-center
                      ${isMain ? 'w-20 h-20 text-4xl shadow-lg' : 'w-12 h-12 text-2xl'}`}
                    >
                      {m.avatar}
                    </div>

                    <h3 className="font-semibold text-gray-900 text-base mb-0.5">{m.name}</h3>
                    <p className="text-emerald-500 font-medium text-sm">{m.role}</p>

                    <AnimatePresence mode="wait">
                      {isMain && (
                        <motion.div
                          key={`detail-${i}`}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.22 }}
                        >
                          {m.subrole && (
                            <p className="text-teal-400 text-xs font-medium mt-0.5">{m.subrole}</p>
                          )}
                          <p className="text-gray-500 text-xs leading-relaxed mt-2 mb-3">{m.description}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <span className={`inline-block font-medium px-2.5 py-0.5 rounded-full text-xs mt-1
                      ${isMain
                        ? `bg-gradient-to-r ${m.gradient} text-white`
                        : 'bg-gray-100 text-gray-400'
                      }`}>
                      {m.tag}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* dot indicators */}
          <div className="flex justify-center gap-1.5 mt-6">
            {allMembers.map((_, i) => (
              <button
                key={i}
                onClick={() => { setActiveIdx(i); resetAuto(); }}
                className={`rounded-full transition-all duration-300 ${
                  i === activeIdx
                    ? 'w-6 h-2 bg-emerald-400'
                    : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── TIMELINE ── */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Hành trình phát triển</h2>
            <p className="text-gray-500">Các cột mốc quan trọng từ khi dự án ra đời đến nay</p>
          </div>

          <div className="relative">
            {/* vertical line */}
            <div className="absolute left-[88px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-400 via-teal-400 to-gray-200" />

            <div className="space-y-10">
              {milestones.map((m, i) => (
                <div key={i} className="flex gap-6 items-start group">
                  {/* year label */}
                  <div className="flex-shrink-0 w-20 text-right pt-1">
                    <span className={`text-xs font-bold ${m.done ? 'text-emerald-500' : 'text-gray-400'}`}>
                      {m.year}
                    </span>
                  </div>

                  {/* dot */}
                  <div className="relative flex-shrink-0 flex items-center justify-center w-5 h-5 mt-0.5">
                    {m.done ? (
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md shadow-emerald-200 group-hover:scale-125 transition-transform" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 bg-white" />
                    )}
                    {m.done && (
                      <div className="absolute w-5 h-5 rounded-full bg-emerald-400 opacity-30 animate-ping" />
                    )}
                  </div>

                  {/* content */}
                  <div className={`flex-1 pb-2 rounded-2xl transition-all duration-300 group-hover:translate-x-1 ${
                    !m.done ? 'opacity-50' : ''
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-gray-800">{m.title}</h3>
                      {!m.done && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">Sắp tới</span>
                      )}
                      {m.year === 'Q1 2026' && (
                        <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full font-medium animate-pulse">Hiện tại</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">{m.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

export default About;
