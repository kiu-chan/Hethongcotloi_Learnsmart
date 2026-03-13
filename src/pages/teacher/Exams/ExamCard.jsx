import {
  FiEdit2,
  FiTrash2,
  FiCopy,
  FiEye,
  FiDownload,
  FiShare2,
  FiClock,
  FiUsers,
  FiCheckCircle,
  FiMoreVertical,
  FiCalendar,
  FiFileText,
  FiEyeOff,
} from 'react-icons/fi';
import {
  IoDocumentTextOutline,
  IoCreateOutline,
  IoCheckmarkCircleOutline,
  IoPeopleOutline,
} from 'react-icons/io5';

const examTypes = [
  { id: 'multiple-choice', name: 'Trắc nghiệm', icon: IoCheckmarkCircleOutline },
  { id: 'essay', name: 'Tự luận', icon: IoDocumentTextOutline },
  { id: 'mixed', name: 'Trắc nghiệm + Tự luận', icon: IoCreateOutline },
];

const getStatusBadge = (status) => {
  switch (status) {
    case 'published':
      return { text: 'Đang mở', color: 'bg-green-100 text-green-700 border-green-200' };
    case 'completed':
      return { text: 'Đã hoàn thành', color: 'bg-purple-100 text-purple-700 border-purple-200' };
    case 'draft':
      return { text: 'Nháp', color: 'bg-orange-100 text-orange-700 border-orange-200' };
    default:
      return { text: 'Khác', color: 'bg-gray-100 text-gray-700 border-gray-200' };
  }
};

const getDifficultyBadge = (difficulty) => {
  switch (difficulty) {
    case 'easy':
      return { text: 'Dễ', color: 'bg-green-50 text-green-700' };
    case 'medium':
      return { text: 'Trung bình', color: 'bg-yellow-50 text-yellow-700' };
    case 'hard':
      return { text: 'Khó', color: 'bg-red-50 text-red-700' };
    default:
      return { text: '', color: '' };
  }
};

const ExamCard = ({ exam, onEdit, onDelete, onDuplicate, onStatusChange, onViewDetail, onDownload, onAssign, onGrade, onToggleAnswer }) => {
  const statusBadge = getStatusBadge(exam.status);
  const difficultyBadge = getDifficultyBadge(exam.difficulty);
  const typeInfo = examTypes.find((t) => t.id === exam.type);
  const TypeIcon = typeInfo ? typeInfo.icon : IoDocumentTextOutline;
  const progressPercentage = exam.students > 0 ? Math.round((exam.submitted / exam.students) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-100 hover:shadow-lg transition-all">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-800">{exam.title}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusBadge.color}`}>
                {statusBadge.text}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${difficultyBadge.color}`}>
                {difficultyBadge.text}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <FiFileText className="w-4 h-4" />
                {exam.subject}
              </span>
              <span className="flex items-center gap-1">
                <TypeIcon className="w-4 h-4" />
                {typeInfo?.name}
              </span>
              <span className="flex items-center gap-1">
                <FiClock className="w-4 h-4" />
                {exam.duration} phút
              </span>
              <span className="flex items-center gap-1">
                <FiFileText className="w-4 h-4" />
                {exam.totalQuestions} câu
              </span>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <FiMoreVertical className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Topics */}
        {exam.topics && exam.topics.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {exam.topics.map((topic, index) => (
              <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                {topic}
              </span>
            ))}
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {exam.scheduledDate && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <FiCalendar className="w-4 h-4" />
                <span className="text-xs font-medium">Lịch thi</span>
              </div>
              <p className="text-sm font-semibold text-blue-900">{exam.scheduledDate}</p>
              <p className="text-xs text-blue-600">{exam.scheduledTime}</p>
            </div>
          )}

          {exam.assignmentType && exam.assignmentType !== 'none' ? (
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 text-purple-700 mb-1">
                <FiUsers className="w-4 h-4" />
                <span className="text-xs font-medium">
                  {exam.assignmentType === 'class' ? 'Lớp được giao' : 'Giao theo học sinh'}
                </span>
              </div>
              <p className="text-sm font-semibold text-purple-900">
                {exam.assignmentType === 'class'
                  ? (exam.assignedClasses || []).join(', ')
                  : `${exam.students} học sinh`}
              </p>
            </div>
          ) : exam.className ? (
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 text-purple-700 mb-1">
                <FiUsers className="w-4 h-4" />
                <span className="text-xs font-medium">Lớp</span>
              </div>
              <p className="text-sm font-semibold text-purple-900">{exam.className}</p>
            </div>
          ) : null}

          {exam.deadline && (
            <div className="p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 mb-1">
                <FiClock className="w-4 h-4" />
                <span className="text-xs font-medium">Hạn nộp</span>
              </div>
              <p className="text-sm font-semibold text-red-900">
                {new Date(exam.deadline).toLocaleDateString('vi-VN')}
              </p>
              <p className="text-xs text-red-600">
                {new Date(exam.deadline).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}

          {exam.students > 0 && (
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 mb-1">
                <IoPeopleOutline className="w-4 h-4" />
                <span className="text-xs font-medium">Học sinh</span>
              </div>
              <p className="text-sm font-semibold text-green-900">{exam.students} người</p>
            </div>
          )}

          {exam.status !== 'draft' && (
            <div className="p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2 text-orange-700 mb-1">
                <FiCheckCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Đã nộp</span>
              </div>
              <p className="text-sm font-semibold text-orange-900">
                {exam.submitted}/{exam.students}
              </p>
            </div>
          )}
        </div>

        {/* Answer visibility toggle */}
        <div className="flex items-center justify-between py-2 px-3 mb-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {exam.showAnswerAfterSubmit !== false ? (
              <FiEye className="w-4 h-4 text-emerald-500" />
            ) : (
              <FiEyeOff className="w-4 h-4 text-gray-400" />
            )}
            <span>
              {exam.showAnswerAfterSubmit !== false ? 'Học sinh xem được đáp án' : 'Ẩn đáp án với học sinh'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onToggleAnswer(exam._id, !(exam.showAnswerAfterSubmit !== false))}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              exam.showAnswerAfterSubmit !== false ? 'bg-emerald-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                exam.showAnswerAfterSubmit !== false ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Progress Bar */}
        {exam.status !== 'draft' && exam.students > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Tiến độ nộp bài</span>
              <span className="font-semibold text-gray-800">{progressPercentage}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
              <span>Đã chấm: {exam.graded}/{exam.submitted}</span>
              <span>Còn lại: {exam.students - exam.submitted}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
          {exam.status === 'draft' ? (
            <>
              <button
                onClick={() => onAssign(exam)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                <FiShare2 className="w-4 h-4" />
                <span>Giao đề</span>
              </button>
              <button
                onClick={() => onEdit(exam)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <FiEdit2 className="w-4 h-4" />
                <span>Chỉnh sửa</span>
              </button>
              <button
                onClick={() => onDownload(exam)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <FiDownload className="w-4 h-4" />
                <span>Tải xuống</span>
              </button>
              <button
                onClick={() => onDuplicate(exam._id)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <FiCopy className="w-4 h-4" />
                <span>Sao chép</span>
              </button>
              <button
                onClick={() => onDelete(exam._id)}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <FiTrash2 className="w-4 h-4" />
                <span>Xóa</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onViewDetail(exam)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <FiEye className="w-4 h-4" />
                <span>Xem chi tiết</span>
              </button>
              {exam.submitted > 0 && (
                <button
                  onClick={() => onGrade(exam)}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                  <FiCheckCircle className="w-4 h-4" />
                  <span>Chấm bài ({exam.submitted})</span>
                </button>
              )}
              {exam.status === 'published' && (
                <>
                  <button
                    onClick={() => onAssign(exam)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    <FiShare2 className="w-4 h-4" />
                    <span>Giao đề</span>
                  </button>
                  <button
                    onClick={() => onStatusChange(exam._id, 'completed')}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    <FiCheckCircle className="w-4 h-4" />
                    <span>Kết thúc</span>
                  </button>
                </>
              )}
              <button
                onClick={() => onDownload(exam)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <FiDownload className="w-4 h-4" />
                <span>Tải xuống</span>
              </button>
              <button
                onClick={() => onDuplicate(exam._id)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <FiCopy className="w-4 h-4" />
                <span>Sao chép</span>
              </button>
              <button
                onClick={() => onDelete(exam._id)}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <FiTrash2 className="w-4 h-4" />
                <span>Xóa</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export { examTypes, getStatusBadge, getDifficultyBadge };
export default ExamCard;
