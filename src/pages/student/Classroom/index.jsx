import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUser,
  FiMail,
  FiClock,
  FiFileText,
  FiUsers,
  FiAlertCircle,
  FiCheckCircle,
  FiPlay,
  FiDownload,
  FiFile,
} from 'react-icons/fi';
import { IoSchoolOutline, IoDocumentTextOutline } from 'react-icons/io5';
import HomeworkSection from './HomeworkSection';

// ==================== SHARED DOCUMENTS SECTION ====================
const SharedDocumentsSection = ({ selectedClass }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch('/api/student-portal/documents', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setDocuments(data.documents);
      } catch (err) {
        console.error('Error fetching shared documents:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const handleDownload = async (id) => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`/api/student-portal/documents/${id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const contentDisposition = res.headers.get('Content-Disposition');
      let filename = 'download';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/);
        if (match) filename = match[1];
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading:', err);
    }
  };

  const getFileColor = (type) => {
    switch (type) {
      case 'pdf': return 'text-red-500 bg-red-50';
      case 'docx': case 'doc': return 'text-blue-500 bg-blue-50';
      case 'pptx': case 'ppt': return 'text-orange-500 bg-orange-50';
      case 'xlsx': case 'xls': return 'text-green-500 bg-green-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const filtered = selectedClass
    ? documents.filter((d) =>
        !d.sharedClasses?.length || d.sharedClasses.includes(selectedClass)
      )
    : documents;

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-10">
        <IoDocumentTextOutline className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-400">Giáo viên chưa chia sẻ tài liệu nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filtered.map((doc) => {
        const colorClass = getFileColor(doc.type);
        return (
          <div key={doc._id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                <FiFile className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-sm truncate">{doc.name}</p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                  <span className="uppercase font-medium">{doc.type}</span>
                  <span>{doc.formattedSize}</span>
                  <span>{new Date(doc.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
              <button
                onClick={() => handleDownload(doc._id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors flex-shrink-0"
              >
                <FiDownload className="w-3.5 h-3.5" />
                Tải về
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const API = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

const getDifficultyLabel = (d) => {
  switch (d) {
    case 'easy': return 'Dễ';
    case 'medium': return 'Trung bình';
    case 'hard': return 'Khó';
    default: return '';
  }
};

const getDifficultyColor = (d) => {
  switch (d) {
    case 'easy': return 'bg-green-100 text-green-700';
    case 'medium': return 'bg-yellow-100 text-yellow-700';
    case 'hard': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getTimeRemaining = (deadline) => {
  if (!deadline) return null;
  const now = new Date();
  const dl = new Date(deadline);
  const diff = dl - now;
  if (diff <= 0) return { text: 'Đã hết hạn', urgent: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return { text: `Còn ${days} ngày ${hours} giờ`, urgent: days <= 1 };
  if (hours > 0) return { text: `Còn ${hours} giờ ${minutes} phút`, urgent: hours <= 3 };
  return { text: `Còn ${minutes} phút`, urgent: true };
};

const getSubmissionStatus = (exam) => {
  if (!exam.submission) {
    if (exam.deadline && new Date(exam.deadline) < new Date()) {
      return { label: 'Quá hạn', color: 'bg-red-100 text-red-700', icon: FiAlertCircle };
    }
    return { label: 'Chưa làm', color: 'bg-blue-100 text-blue-700', icon: FiPlay };
  }
  switch (exam.submission.status) {
    case 'in_progress':
      return { label: 'Đang làm', color: 'bg-orange-100 text-orange-700', icon: FiClock };
    case 'submitted':
      return { label: 'Đã nộp', color: 'bg-purple-100 text-purple-700', icon: FiCheckCircle };
    case 'graded':
      return { label: 'Đã chấm', color: 'bg-green-100 text-green-700', icon: FiCheckCircle };
    default:
      return { label: 'Chưa làm', color: 'bg-blue-100 text-blue-700', icon: FiPlay };
  }
};

const StudentClassroom = () => {
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [contentTab, setContentTab] = useState('exams'); // 'exams' | 'homework' | 'documents'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classRes, examsRes] = await Promise.all([
          fetch(`${API}/student-portal/classroom`, { headers: getAuthHeaders() }),
          fetch(`${API}/student-portal/exams`, { headers: getAuthHeaders() }),
        ]);
        const classData = await classRes.json();
        const examsData = await examsRes.json();

        if (classData.success) {
          setClassroom(classData.classroom);
          const classes = Array.isArray(classData.classroom?.className)
            ? classData.classroom.className
            : [classData.classroom?.className].filter(Boolean);
          setSelectedClass(classes[0] || '');
        }
        if (examsData.success) setExams(examsData.exams);
      } catch (err) {
        console.error('Error fetching classroom data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTakeExam = (examId) => {
    navigate(`/student/exam/${examId}`);
  };

  const classNames = Array.isArray(classroom?.className)
    ? classroom.className
    : [classroom?.className].filter(Boolean);

  const filteredClassmates = selectedClass
    ? (classroom?.classmates || []).filter((m) =>
        Array.isArray(m.className) ? m.className.includes(selectedClass) : m.className === selectedClass
      )
    : classroom?.classmates || [];

  const filteredExams = selectedClass
    ? exams.filter(
        (e) => e.assignmentType === 'student' || (e.assignedClasses && e.assignedClasses.includes(selectedClass))
      )
    : exams;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <FiAlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Chưa được thêm vào lớp</h3>
        <p className="text-gray-500">Liên hệ giáo viên để được thêm vào lớp học.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Lớp học của tôi</h1>
        <p className="text-gray-600">Xem thông tin lớp và làm bài tập</p>
      </div>

      {/* Class Selector */}
      {classNames.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <IoSchoolOutline className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-600">Chọn lớp:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {classNames.map((cn) => (
              <button
                key={cn}
                onClick={() => setSelectedClass(cn)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedClass === cn
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cn}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Class Info + Teacher */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Class Info */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
              <IoSchoolOutline className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Lớp của tôi</h2>
              <p className="text-sm text-gray-500">{filteredClassmates.length + 1} học sinh</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {classNames.map((cn) => (
              <span
                key={cn}
                className={`px-3 py-1 text-sm font-medium rounded-lg ${
                  cn === selectedClass ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-700'
                }`}
              >
                {cn}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiUser className="w-4 h-4" />
            <span>Học sinh: <strong>{classroom.studentName}</strong></span>
          </div>
        </div>

        {/* Teacher Info */}
        {classroom.teacher && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                {classroom.teacher.name?.charAt(0) || 'G'}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Giáo viên</h2>
                <p className="text-sm text-gray-500">Thông tin liên hệ</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiUser className="w-4 h-4" />
                <span>{classroom.teacher.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiMail className="w-4 h-4" />
                <span>{classroom.teacher.email}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Classmates */}
      {filteredClassmates.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiUsers className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-bold text-gray-800">
              Bạn cùng lớp ({filteredClassmates.length})
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredClassmates.map((mate) => (
              <div key={mate._id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm">
                  {mate.name?.charAt(0)}
                </div>
                <span className="text-sm text-gray-700 truncate">{mate.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Tabs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            {[{ key: 'exams', label: 'Bài kiểm tra' }, { key: 'homework', label: 'Bài tập' }, { key: 'documents', label: 'Tài liệu' }].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setContentTab(tab.key)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${contentTab === tab.key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Homework Tab */}
        {contentTab === 'homework' && <HomeworkSection selectedClass={selectedClass} />}

        {/* Documents Tab */}
        {contentTab === 'documents' && <SharedDocumentsSection selectedClass={selectedClass} />}

        {/* Exams Tab */}
        {contentTab === 'exams' && <div>
        {filteredExams.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <FiFileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Chưa có bài kiểm tra</h3>
            <p className="text-gray-500">Giáo viên chưa giao bài kiểm tra nào cho bạn.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExams.map((exam) => {
              const status = getSubmissionStatus(exam);
              const StatusIcon = status.icon;
              const isOverdue = exam.deadline && new Date(exam.deadline) < new Date();
              const canTakeExam =
                !exam.submission ||
                (exam.submission.status === 'in_progress' && !isOverdue);

              return (
                <div
                  key={exam._id}
                  className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{exam.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          <StatusIcon className="w-3 h-3 inline mr-1" />
                          {status.label}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(exam.difficulty)}`}>
                          {getDifficultyLabel(exam.difficulty)}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <FiFileText className="w-4 h-4" />
                          {exam.subject}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiClock className="w-4 h-4" />
                          {exam.duration} phút
                        </span>
                        <span>{exam.totalQuestions} câu</span>
                        <span>{exam.totalPoints} điểm</span>
                      </div>

                      {exam.deadline && (() => {
                        const timeRemaining = getTimeRemaining(exam.deadline);
                        return (
                          <div className="flex items-center gap-3 text-sm mb-1">
                            <span className={isOverdue ? 'text-red-600' : 'text-gray-500'}>
                              <FiClock className="w-4 h-4 inline mr-1" />
                              Hạn nộp: {new Date(exam.deadline).toLocaleDateString('vi-VN')}{' '}
                              {new Date(exam.deadline).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {timeRemaining && (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                timeRemaining.urgent ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {timeRemaining.text}
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      {/* Điểm chi tiết */}
                      {exam.submission && (exam.submission.status === 'graded' || exam.submission.status === 'submitted') && (
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm text-gray-600">Tổng điểm:</span>
                            <span className="text-lg font-bold text-emerald-600">
                              {exam.submission.score}/{exam.submission.totalPoints}
                            </span>
                          </div>
                          {exam.submission.mcScore > 0 && (
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg font-medium">
                              Trắc nghiệm: {exam.submission.mcScore}
                            </span>
                          )}
                          {exam.submission.totalEssayQuestions > 0 && (
                            <span className={`px-2 py-1 text-xs rounded-lg font-medium ${
                              exam.submission.gradedEssayQuestions >= exam.submission.totalEssayQuestions
                                ? 'bg-green-50 text-green-700'
                                : 'bg-orange-50 text-orange-700'
                            }`}>
                              Tự luận: {exam.submission.gradedEssayQuestions >= exam.submission.totalEssayQuestions
                                ? exam.submission.essayScore
                                : `Chưa chấm ${exam.submission.totalEssayQuestions - exam.submission.gradedEssayQuestions} câu`}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      {canTakeExam && (
                        <button
                          onClick={() => handleTakeExam(exam._id)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-600 transition-all"
                        >
                          <FiPlay className="w-4 h-4" />
                          {exam.submission?.status === 'in_progress' ? 'Tiếp tục' : 'Làm bài'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>}
      </div>
    </div>
  );
};

export default StudentClassroom;
