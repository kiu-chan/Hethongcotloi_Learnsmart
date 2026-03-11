import { useState, useEffect, useCallback, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import {
  IoTrophyOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoTimeOutline,
  IoStar,
  IoSparkles,
} from 'react-icons/io5';
import MathDisplay from '../../../components/MathDisplay';

const CONFETTI_COLORS = [
  '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1',
  '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#FF9FF3', '#54A0FF',
];

/* -------- Hiệu ứng TRẢ LỜI ĐÚNG -------- */
const CorrectEffect = ({ onDone }) => {
  const confetti = Array.from({ length: 70 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: `${2 + Math.random() * 96}%`,
    delay: `${Math.random() * 0.6}s`,
    duration: `${0.9 + Math.random() * 0.8}s`,
    size: `${7 + Math.floor(Math.random() * 10)}px`,
    shape: i % 4 === 0 ? 'circle' : i % 4 === 1 ? 'square' : i % 4 === 2 ? 'star' : 'diamond',
  }));

  // Các tia sao bùng nổ từ tâm
  const stars = Array.from({ length: 14 }, (_, i) => {
    const angle = (i / 14) * 360;
    const dist = 80 + Math.random() * 120;
    const dx = Math.cos((angle * Math.PI) / 180) * dist;
    const dy = Math.sin((angle * Math.PI) / 180) * dist;
    return { id: i, dx, dy, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length], size: 10 + Math.floor(Math.random() * 12) };
  });

  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[70] pointer-events-none overflow-hidden">
      {/* Flash trắng vàng rực rỡ */}
      <div
        className="absolute inset-0"
        style={{ animation: 'flashOverlay 0.5s ease-out forwards', background: 'radial-gradient(circle at center, rgba(255,215,0,0.45) 0%, rgba(255,165,0,0.15) 50%, transparent 80%)' }}
      />
      {/* Flash trắng chớp */}
      <div
        className="absolute inset-0"
        style={{ animation: 'flashOverlay 0.25s ease-out forwards', background: 'rgba(255,255,255,0.35)' }}
      />

      {/* Confetti mưa */}
      {confetti.map((p) => (
        <div
          key={p.id}
          className="absolute top-0"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.shape !== 'star' ? p.color : 'transparent',
            borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'diamond' ? '0' : p.shape === 'square' ? '2px' : '0',
            transform: p.shape === 'diamond' ? 'rotate(45deg)' : undefined,
            animation: `confettiFall ${p.duration} ${p.delay} ease-in forwards`,
          }}
        >
          {p.shape === 'star' && (
            <IoStar style={{ color: p.color, width: p.size, height: p.size }} />
          )}
        </div>
      ))}

      {/* Tia sao bùng nổ từ tâm */}
      <div className="absolute" style={{ top: '45%', left: '50%' }}>
        {stars.map((s) => (
          <div
            key={s.id}
            className="absolute"
            style={{
              '--dx': `${s.dx}px`,
              '--dy': `${s.dy}px`,
              '--rot': `${Math.random() * 720}deg`,
              animation: `starBurst 0.9s ${Math.random() * 0.2}s ease-out forwards`,
              width: s.size,
              height: s.size,
            }}
          >
            <IoStar style={{ color: s.color, width: s.size, height: s.size }} />
          </div>
        ))}
      </div>

      {/* Nhãn "Chính xác!" */}
      <div
        className="absolute"
        style={{
          top: '42%', left: '50%',
          animation: 'popBounce 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards, fadeOutUp 0.4s 1.5s ease-in forwards',
        }}
      >
        <div
          className="px-8 py-4 rounded-2xl text-white font-black text-4xl select-none"
          style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 50%, #FF6B6B 100%)',
            boxShadow: '0 0 40px rgba(255,215,0,0.8), 0 0 80px rgba(255,140,0,0.4)',
            textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            whiteSpace: 'nowrap',
          }}
        >
          ✨ Chính xác! ✨
        </div>
      </div>
    </div>
  );
};

/* -------- Hiệu ứng TRẢ LỜI SAI -------- */
const WrongEffect = ({ onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 1000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[70] pointer-events-none overflow-hidden"
      style={{ animation: 'wrongShake 0.5s ease-out' }}
    >
      {/* Flash đỏ */}
      <div
        className="absolute inset-0"
        style={{ animation: 'wrongFlash 0.6s ease-out forwards', background: 'rgba(239,68,68,0.25)' }}
      />
      {/* Viền đỏ nhấp nháy */}
      <div
        className="absolute inset-0 border-8 border-red-500 rounded-none"
        style={{ animation: 'wrongFlash 0.8s ease-out forwards' }}
      />
      {/* Nhãn "Sai rồi!" */}
      <div
        className="absolute"
        style={{
          top: '42%', left: '50%',
          animation: 'popBounce 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards, fadeOutUp 0.4s 0.5s ease-in forwards',
        }}
      >
        <div
          className="px-8 py-4 rounded-2xl text-white font-black text-4xl select-none"
          style={{
            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            boxShadow: '0 0 30px rgba(239,68,68,0.7)',
            textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            whiteSpace: 'nowrap',
          }}
        >
          ❌ Sai rồi!
        </div>
      </div>
    </div>
  );
};

/* -------- Modal chính -------- */
const QuizGameModal = ({ quiz, onClose, onRecordPlay }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isAnswered, setIsAnswered] = useState(false);
  const [answerEffect, setAnswerEffect] = useState(null); // 'correct' | 'wrong' | null

  const questions = quiz.questions || [];

  const currentQuestionRef = useRef(currentQuestion);
  const scoreRef = useRef(score);
  const isAnsweredRef = useRef(isAnswered);

  currentQuestionRef.current = currentQuestion;
  scoreRef.current = score;
  isAnsweredRef.current = isAnswered;

  const handleNextQuestion = useCallback(() => {
    setAnswerEffect(null);
    if (currentQuestionRef.current < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setTimeLeft(30);
    } else {
      setShowResult(true);
      const finalScore = (scoreRef.current / questions.length) * 10;
      onRecordPlay(quiz._id, finalScore);
    }
  }, [questions.length, quiz._id, onRecordPlay]);

  useEffect(() => {
    if (showResult || isAnswered || timeLeft <= 0) return;
    const timer = setTimeout(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimeout(() => handleNextQuestion(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, showResult, isAnswered, handleNextQuestion]);

  const handleAnswer = useCallback((index) => {
    if (isAnsweredRef.current) return;
    setSelectedAnswer(index);
    setIsAnswered(true);
    const isCorrect = index === questions[currentQuestionRef.current].correct;
    if (isCorrect) {
      setScore((prev) => prev + 1);
      setAnswerEffect('correct');
    } else {
      setAnswerEffect('wrong');
    }
    setTimeout(() => handleNextQuestion(), isCorrect ? 2000 : 1500);
  }, [questions, handleNextQuestion]);

  const handleReplay = useCallback(() => {
    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);
    setTimeLeft(30);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setAnswerEffect(null);
  }, []);

  if (questions.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
          <p className="text-gray-600 mb-4">Quiz này chưa có câu hỏi nào.</p>
          <button onClick={onClose} className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700">Đóng</button>
        </div>
      </div>
    );
  }

  if (showResult) {
    const finalScore = (score / questions.length) * 10;
    const isPerfect = score === questions.length;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center relative overflow-hidden">
          {isPerfect && (
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at center, rgba(255,215,0,0.08) 0%, transparent 70%)' }} />
          )}
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${isPerfect ? 'animate-bounce' : ''}`}
            style={{ background: isPerfect ? 'linear-gradient(135deg, #FFD700, #FF8C00)' : 'linear-gradient(135deg, #10B981, #0D9488)', boxShadow: isPerfect ? '0 0 30px rgba(255,215,0,0.5)' : undefined }}
          >
            {isPerfect
              ? <IoSparkles className="w-12 h-12 text-white" />
              : <IoTrophyOutline className="w-12 h-12 text-white" />
            }
          </div>
          <h2 className="text-3xl font-black text-gray-800 mb-1">
            {isPerfect ? '🎉 Xuất sắc!' : 'Hoàn thành!'}
          </h2>
          <p className="text-gray-500 mb-6">{isPerfect ? 'Bạn trả lời đúng tất cả!' : `Bạn đã trả lời đúng ${score}/${questions.length} câu`}</p>
          <div
            className="rounded-2xl p-6 mb-6"
            style={{ background: isPerfect ? 'linear-gradient(135deg, #FFF9C4, #FFF3CD)' : 'linear-gradient(135deg, #ECFDF5, #D1FAE5)' }}
          >
            <p className={`text-6xl font-black mb-2 ${isPerfect ? 'text-amber-500' : 'text-emerald-600'}`}>{score}/{questions.length}</p>
            <p className="text-gray-600 font-semibold">Điểm số: {finalScore.toFixed(1)}/10</p>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors">Đóng</button>
            <button onClick={handleReplay} className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-semibold text-white transition-colors">Chơi lại</button>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[currentQuestion];

  return (
    <>
      {/* Hiệu ứng đúng/sai overlay */}
      {answerEffect === 'correct' && <CorrectEffect onDone={() => setAnswerEffect(null)} />}
      {answerEffect === 'wrong' && <WrongEffect onDone={() => setAnswerEffect(null)} />}

      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl max-w-2xl w-full p-8 transition-all duration-300"
          style={
            isAnswered && selectedAnswer === q.correct
              ? { boxShadow: '0 0 0 3px rgba(34,197,94,0.5), 0 20px 60px rgba(0,0,0,0.15)', animation: 'pulseGlow 0.6s ease-out' }
              : isAnswered && selectedAnswer !== q.correct
              ? { boxShadow: '0 0 0 3px rgba(239,68,68,0.5), 0 20px 60px rgba(0,0,0,0.15)', animation: 'wrongPulse 0.6s ease-out' }
              : { boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }
          }
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800">{quiz.title}</h3>
              <p className="text-sm text-gray-500">Câu {currentQuestion + 1}/{questions.length}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <FiX className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Tiến độ</span>
              <span className="font-semibold text-gray-800">{Math.round((currentQuestion / questions.length) * 100)}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500" style={{ width: `${(currentQuestion / questions.length) * 100}%` }} />
            </div>
          </div>

          {/* Timer */}
          <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2">
              <IoTimeOutline className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600">Thời gian còn lại:</span>
            </div>
            <span
              className={`text-2xl font-bold transition-all ${timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}
            >
              {timeLeft}s
            </span>
          </div>

          {/* Question */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">
              <MathDisplay text={q.question} />
            </h4>
            <div className="space-y-3">
              {q.answers.map((answer, index) => {
                const isCorrect = index === q.correct;
                const isSelected = index === selectedAnswer;

                let style = {};
                let btnClass = 'w-full p-4 rounded-xl border-2 text-left font-medium transition-all duration-300 ';

                if (isAnswered) {
                  if (isCorrect) {
                    btnClass += 'border-green-500 bg-green-50 text-green-700';
                    style = { animation: 'correctFlash 0.5s ease-out, pulseGlow 1s 0.5s ease-out' };
                  } else if (isSelected) {
                    btnClass += 'border-red-500 bg-red-50 text-red-700';
                    style = { animation: 'wrongShake 0.4s ease-out, wrongPulse 1s 0.4s ease-out' };
                  } else {
                    btnClass += 'border-gray-200 text-gray-400 opacity-60';
                  }
                } else {
                  btnClass += 'border-gray-200 hover:border-blue-500 hover:bg-blue-50 text-gray-700 hover:scale-[1.01] hover:shadow-md';
                }

                return (
                  <button key={index} onClick={() => handleAnswer(index)} disabled={isAnswered} className={btnClass} style={style}>
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                          isAnswered && isCorrect
                            ? 'bg-green-500 text-white'
                            : isAnswered && isSelected && !isCorrect
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {String.fromCharCode(65 + index)}
                      </span>
                      <MathDisplay text={answer} />
                      {isAnswered && isCorrect && (
                        <IoCheckmarkCircleOutline className="w-7 h-7 text-green-600 ml-auto shrink-0" />
                      )}
                      {isAnswered && isSelected && !isCorrect && (
                        <IoCloseCircleOutline className="w-7 h-7 text-red-600 ml-auto shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Score */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
            <span className="text-sm font-medium text-gray-700">Điểm hiện tại:</span>
            <span className="text-2xl font-bold text-emerald-600">{score}/{currentQuestion + (isAnswered ? 1 : 0)}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuizGameModal;
