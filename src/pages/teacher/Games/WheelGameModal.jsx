import { useState, useRef, useEffect } from 'react';
import { FiX, FiRefreshCw } from 'react-icons/fi';
import { IoSparklesOutline, IoTrophyOutline, IoCheckmarkCircle, IoCloseCircle, IoStar } from 'react-icons/io5';

const WHEEL_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
];

const CONFETTI_COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE'];

const CorrectOverlay = ({ onDone }) => {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: `${5 + Math.random() * 90}%`,
    delay: `${Math.random() * 0.5}s`,
    duration: `${0.8 + Math.random() * 0.6}s`,
    size: `${6 + Math.floor(Math.random() * 8)}px`,
    shape: i % 3 === 0 ? 'circle' : i % 3 === 1 ? 'square' : 'star',
    rotate: `${Math.random() * 720}deg`,
  }));

  useEffect(() => {
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden">
      {/* Flash overlay */}
      <div className="absolute inset-0 animate-[flashOverlay_0.4s_ease-out]" style={{ background: 'radial-gradient(circle at center, rgba(255,215,0,0.25) 0%, transparent 70%)' }} />
      {/* Confetti particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute top-0"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.shape !== 'star' ? p.color : 'transparent',
            borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'square' ? '2px' : '0',
            animation: `confettiFall ${p.duration} ${p.delay} ease-in forwards`,
          }}
        >
          {p.shape === 'star' && (
            <IoStar style={{ color: p.color, width: p.size, height: p.size }} />
          )}
        </div>
      ))}
    </div>
  );
};

const WheelGameModal = ({ wheel, onClose, onRecordPlay }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [spinCount, setSpinCount] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [answerEffect, setAnswerEffect] = useState(null); // 'correct' | 'wrong' | null
  const [showCorrectOverlay, setShowCorrectOverlay] = useState(false);

  const wheelRef = useRef(null);
  const currentRotationRef = useRef(0);
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio('/audio.mp3');
    audioRef.current.loop = true;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const items = wheel.items || [];
  const segmentAngle = 360 / items.length;

  const pickRandomQuestion = () => {
    const openQs = (wheel.wheelQuestions || []).map((text) => ({ type: 'open', text }));
    const mcqQs = (wheel.wheelMCQs || []).map((q) => ({ type: 'mcq', ...q }));
    const all = [...openQs, ...mcqQs];
    if (all.length === 0) return null;
    return all[Math.floor(Math.random() * all.length)];
  };

  const spinWheel = () => {
    if (isSpinning || items.length === 0) return;
    setIsSpinning(true);
    setShowResult(false);
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setAnswerEffect(null);

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }

    // Pick a random winning index directly
    const winningIndex = Math.floor(Math.random() * items.length);

    // Calculate the angle needed so that the winning segment lands at the pointer (top/12 o'clock)
    // conic-gradient: segment i occupies [i*segmentAngle, (i+1)*segmentAngle], starting from 12 o'clock clockwise
    // Pointer is at top. After rotating wheel by R degrees clockwise, the original angle at the top is (360 - R%360) % 360
    // We want (360 - finalRotation%360) % 360 to land in the middle of segment winningIndex
    // targetOriginalAngle = winningIndex * segmentAngle + segmentAngle / 2
    // (360 - finalRotation%360) % 360 = targetOriginalAngle
    // finalRotation%360 = (360 - targetOriginalAngle) % 360
    const targetOriginalAngle = winningIndex * segmentAngle + segmentAngle / 2;
    const targetMod = (360 - targetOriginalAngle + 360) % 360;

    // Add full spins (5-8 random) for visual effect
    const extraSpins = (5 + Math.floor(Math.random() * 4)) * 360;
    // Calculate how much to add from current position to reach targetMod
    const currentMod = currentRotationRef.current % 360;
    let delta = targetMod - currentMod;
    if (delta < 0) delta += 360;

    const totalAdd = extraSpins + delta;
    const newRotation = currentRotationRef.current + totalAdd;
    currentRotationRef.current = newRotation;

    if (wheelRef.current) {
      wheelRef.current.style.transition = 'transform 10s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
      wheelRef.current.style.transform = `rotate(${newRotation}deg)`;
    }

    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setResult(items[winningIndex]);
      setShowResult(true);
      setIsSpinning(false);
      setSpinCount((prev) => prev + 1);
      onRecordPlay(wheel._id);
      setCurrentQuestion(pickRandomQuestion());
    }, 10100);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {showCorrectOverlay && <CorrectOverlay onDone={() => setShowCorrectOverlay(false)} />}
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <IoSparklesOutline className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{wheel.title}</h3>
                <p className="text-sm text-white/70">Lượt quay: {spinCount}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
              <FiX className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="p-8 overflow-y-auto flex-1">
          {/* Wheel */}
          <div className="relative mb-8">
            <div className="w-72 h-72 sm:w-80 sm:h-80 mx-auto relative">
              {/* Pointer */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 drop-shadow-lg">
                <svg width="32" height="40" viewBox="0 0 32 40">
                  <polygon points="16,40 0,0 32,0" fill="#DC2626" />
                  <polygon points="16,36 4,4 28,4" fill="#EF4444" />
                </svg>
              </div>

              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 p-2 shadow-[0_0_40px_rgba(0,0,0,0.3)]">
                {/* Decorative dots on ring */}
                <div className="absolute inset-0">
                  {Array.from({ length: 24 }).map((_, i) => {
                    const angle = (i * 360) / 24;
                    const rad = (angle * Math.PI) / 180;
                    const r = 49;
                    const x = 50 + r * Math.sin(rad);
                    const y = 50 - r * Math.cos(rad);
                    return (
                      <div
                        key={i}
                        className={`absolute w-2 h-2 rounded-full ${
                          isSpinning
                            ? i % 2 === 0 ? 'bg-yellow-300' : 'bg-white/40'
                            : 'bg-yellow-400/80'
                        } transition-colors`}
                        style={{
                          left: `${x}%`,
                          top: `${y}%`,
                          transform: 'translate(-50%, -50%)',
                          animation: isSpinning ? `pulse 0.5s ease-in-out ${i * 0.05}s infinite alternate` : undefined,
                        }}
                      />
                    );
                  })}
                </div>

                {/* Wheel surface */}
                <div
                  ref={wheelRef}
                  className="w-full h-full rounded-full overflow-hidden"
                  style={{
                    transform: `rotate(${currentRotationRef.current}deg)`,
                  }}
                >
                  {/* Segments via SVG for cleaner look */}
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    {items.map((item, index) => {
                      const startAngle = index * segmentAngle - 90;
                      const endAngle = (index + 1) * segmentAngle - 90;
                      const startRad = (startAngle * Math.PI) / 180;
                      const endRad = (endAngle * Math.PI) / 180;
                      const r = 100;
                      const cx = 100;
                      const cy = 100;
                      const x1 = cx + r * Math.cos(startRad);
                      const y1 = cy + r * Math.sin(startRad);
                      const x2 = cx + r * Math.cos(endRad);
                      const y2 = cy + r * Math.sin(endRad);
                      const largeArc = segmentAngle > 180 ? 1 : 0;

                      const midAngleRad = ((startAngle + endAngle) / 2) * Math.PI / 180;
                      const textR = r * 0.65;
                      const textX = cx + textR * Math.cos(midAngleRad);
                      const textY = cy + textR * Math.sin(midAngleRad);
                      const textRotation = (startAngle + endAngle) / 2;

                      return (
                        <g key={index}>
                          <path
                            d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                            fill={WHEEL_COLORS[index % WHEEL_COLORS.length]}
                            stroke="rgba(255,255,255,0.3)"
                            strokeWidth="0.5"
                          />
                          <text
                            x={textX}
                            y={textY}
                            fill="white"
                            fontSize={items.length > 8 ? '7' : items.length > 5 ? '8' : '10'}
                            fontWeight="bold"
                            textAnchor="middle"
                            dominantBaseline="central"
                            transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                          >
                            {item.length > 12 ? item.slice(0, 11) + '…' : item}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Center button */}
              <button
                onClick={spinWheel}
                disabled={isSpinning}
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full z-10 flex items-center justify-center transition-all shadow-lg ${
                  isSpinning
                    ? 'bg-gray-200 cursor-not-allowed'
                    : 'bg-white hover:bg-gray-50 hover:scale-110 cursor-pointer active:scale-95'
                }`}
              >
                <FiRefreshCw className={`w-6 h-6 text-gray-700 ${isSpinning ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Result */}
          {showResult && (
            <div className="mb-6 space-y-3">
              <div className="p-6 bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 border border-purple-100 rounded-2xl text-center animate-[fadeIn_0.5s_ease-out]">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <IoTrophyOutline className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm text-gray-500 mb-1 font-medium">Kết quả</p>
                <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {result}
                </p>
              </div>

              {currentQuestion && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl animate-[fadeIn_0.4s_ease-out]">
                  <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-2">
                    Câu hỏi cho {result}
                  </p>

                  {currentQuestion.type === 'open' ? (
                    <p className="text-base font-semibold text-gray-800 leading-snug">{currentQuestion.text}</p>
                  ) : (
                    <div>
                      <p className="text-base font-semibold text-gray-800 leading-snug mb-3">{currentQuestion.question}</p>
                      {answerEffect === 'correct' && (
                        <div className="relative mb-3 rounded-2xl overflow-hidden animate-[bounceIn_0.45s_cubic-bezier(0.34,1.56,0.64,1)]">
                          {/* Glowing background */}
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 animate-[shimmer_1.5s_ease-in-out_infinite]" />
                          <div className="absolute inset-0 bg-gradient-to-r from-yellow-300/30 via-transparent to-yellow-300/30 animate-[shimmer_1.5s_ease-in-out_0.75s_infinite]" />
                          <div className="relative flex items-center gap-3 px-4 py-3">
                            <div className="w-10 h-10 bg-white/25 rounded-full flex items-center justify-center flex-shrink-0 animate-[spinPop_0.5s_ease-out]">
                              <IoCheckmarkCircle className="w-7 h-7 text-white drop-shadow" />
                            </div>
                            <div>
                              <p className="text-white font-extrabold text-base leading-tight drop-shadow">Chính xác! 🎉</p>
                              <p className="text-white/90 text-xs font-medium">Tuyệt vời, câu trả lời đúng rồi!</p>
                            </div>
                            <div className="ml-auto flex gap-1">
                              {['⭐','✨','🌟'].map((s, i) => (
                                <span key={i} className="text-lg animate-[starPop_0.3s_ease-out_forwards]" style={{ animationDelay: `${0.1 + i * 0.1}s`, opacity: 0 }}>{s}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      {answerEffect === 'wrong' && (
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-3 font-semibold text-sm bg-red-100 border border-red-300 text-red-700 animate-[bounceIn_0.4s_ease-out]">
                          <IoCloseCircle className="w-5 h-5 text-red-500 flex-shrink-0" /> Chưa đúng! Xem lại đáp án nhé.
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        {currentQuestion.answers.map((ans, idx) => {
                          const isCorrect = idx === currentQuestion.correct;
                          const isSelected = selectedAnswer === idx;
                          let cls = 'border-gray-200 bg-white text-gray-700 hover:bg-orange-50';
                          let animation = '';
                          if (showAnswer) {
                            if (isCorrect) {
                              cls = 'border-green-400 bg-green-50 text-green-700';
                              animation = 'animate-[correctPulse_0.5s_ease-out]';
                            } else if (isSelected) {
                              cls = 'border-red-300 bg-red-50 text-red-600';
                              animation = 'animate-[wrongShake_0.4s_ease-out]';
                            }
                          } else if (isSelected) {
                            cls = 'border-orange-400 bg-orange-100 text-orange-700';
                          }
                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                if (showAnswer) return;
                                setSelectedAnswer(idx);
                                setShowAnswer(true);
                                const effect = idx === currentQuestion.correct ? 'correct' : 'wrong';
                                setAnswerEffect(effect);
                                if (effect === 'correct') setShowCorrectOverlay(true);
                              }}
                              className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-sm font-medium transition-all text-left ${cls} ${animation}`}
                            >
                              <span className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                                showAnswer && isCorrect ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                              }`}>
                                {String.fromCharCode(65 + idx)}
                              </span>
                              {ans}
                            </button>
                          );
                        })}
                      </div>
                      {!showAnswer && (
                        <button
                          onClick={() => { setShowAnswer(true); setAnswerEffect(null); }}
                          className="mt-2 text-xs text-orange-500 hover:text-orange-600 font-medium"
                        >
                          Hiện đáp án
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setCurrentQuestion(pickRandomQuestion());
                      setSelectedAnswer(null);
                      setShowAnswer(false);
                      setAnswerEffect(null);
                      setShowCorrectOverlay(false);
                    }}
                    className="mt-3 flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors"
                  >
                    <FiRefreshCw className="w-3.5 h-3.5" /> Câu hỏi khác
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={spinWheel}
              disabled={isSpinning}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-white transition-all shadow-lg shadow-purple-500/25"
            >
              <FiRefreshCw className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>{isSpinning ? 'Đang quay...' : 'Quay ngay!'}</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounceIn {
          0% { opacity: 0; transform: scale(0.6); }
          55% { transform: scale(1.12); }
          75% { transform: scale(0.96); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes correctPulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34,197,94,0.6); }
          40% { transform: scale(1.06); box-shadow: 0 0 0 10px rgba(34,197,94,0.15); }
          70% { box-shadow: 0 0 0 16px rgba(34,197,94,0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }
        @keyframes wrongShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-7px) rotate(-1deg); }
          40% { transform: translateX(7px) rotate(1deg); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(100vh) rotate(var(--rotate, 720deg)); opacity: 0; }
        }
        @keyframes flashOverlay {
          0% { opacity: 0; }
          30% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.75; }
        }
        @keyframes spinPop {
          0% { transform: scale(0) rotate(-180deg); }
          70% { transform: scale(1.2) rotate(10deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes starPop {
          0% { opacity: 0; transform: scale(0) translateY(4px); }
          70% { transform: scale(1.3) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default WheelGameModal;
