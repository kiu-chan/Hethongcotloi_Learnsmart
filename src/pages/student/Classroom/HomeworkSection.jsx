import { useState, useEffect, useRef } from 'react';
import {
  FiLoader,
  FiPaperclip,
  FiX,
  FiFile,
  FiDownload,
  FiCheck,
  FiClock,
  FiMessageSquare,
  FiUpload,
} from 'react-icons/fi';
import { IoDocumentTextOutline } from 'react-icons/io5';

const API_URL = '/api/student-portal/homework';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return { Authorization: `Bearer ${token}` };
};

const formatDate = (d) => {
  if (!d) return 'Không giới hạn';
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const isOverdue = (deadline) => deadline && new Date(deadline) < new Date();

// ==================== SUBMIT HOMEWORK MODAL ====================
const SubmitHomeworkModal = ({ show, homework, onClose, onSubmitted }) => {
  const [files, setFiles] = useState([]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (show) { setFiles([]); setNote(''); setError(''); }
  }, [show]);

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...newFiles].slice(0, 5));
    e.target.value = '';
  };

  const handleSubmit = async () => {
    if (files.length === 0 && !note.trim()) {
      setError('Vui lòng đính kèm file hoặc ghi chú');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('note', note);
      files.forEach((f) => formData.append('files', f));

      const res = await fetch(`${API_URL}/${homework._id}/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Lỗi nộp bài');
      onSubmitted();
      onClose();
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Nộp bài tập</h2>
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{homework?.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
          )}

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">File bài làm (tối đa 5 file)</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
            >
              <FiUpload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
              <p className="text-sm text-gray-500">Nhấn để chọn file (ảnh, PDF, DOC/DOCX)</p>
              <p className="text-xs text-gray-400 mt-0.5">Tối đa 20MB/file</p>
            </div>
            <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />
            {files.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <FiFile className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate text-gray-700">{f.name}</span>
                      <span className="text-gray-400 flex-shrink-0">{formatFileSize(f.size)}</span>
                    </div>
                    <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="ml-2 p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500">
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ghi chú</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập ghi chú cho giáo viên (tuỳ chọn)..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors disabled:opacity-50"
          >
            {submitting && <FiLoader className="w-4 h-4 animate-spin" />}
            Nộp bài
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== HOMEWORK DETAIL MODAL ====================
const HomeworkDetailModal = ({ show, homework, onClose, onSubmit }) => {
  if (!show || !homework) return null;

  const sub = homework.submission;
  const overdue = isOverdue(homework.deadline);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 line-clamp-1">{homework.title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {homework.description && (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{homework.description}</p>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FiClock className="w-4 h-4" />
            <span>Hạn nộp: <span className={overdue && !sub ? 'text-red-500 font-medium' : ''}>{formatDate(homework.deadline)}</span></span>
          </div>

          {/* Teacher attachments */}
          {homework.attachments?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">File đính kèm từ giáo viên:</p>
              <div className="flex flex-wrap gap-2">
                {homework.attachments.map((f, i) => (
                  <a
                    key={i}
                    href={`/uploads/homework/${f.filePath}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-100 border border-gray-200 transition-colors"
                  >
                    <FiFile className="w-3.5 h-3.5 text-gray-400" />
                    <span className="max-w-[140px] truncate">{f.originalName}</span>
                    <FiDownload className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Submission status */}
          {sub ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <FiCheck className="w-4 h-4 text-green-600" />
                <p className="text-sm font-medium text-green-700">Đã nộp lúc {formatDate(sub.submittedAt)}</p>
              </div>

              {sub.files?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {sub.files.map((f, i) => (
                    <a
                      key={i}
                      href={`/uploads/homework/${f.filePath}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-50 border border-blue-200 transition-colors"
                    >
                      <FiFile className="w-3.5 h-3.5" />
                      <span className="max-w-[120px] truncate">{f.originalName}</span>
                    </a>
                  ))}
                </div>
              )}

              {sub.note && (
                <p className="text-sm text-gray-600 italic">"{sub.note}"</p>
              )}

              {sub.teacherComment && (
                <div className="bg-white border border-green-200 rounded-lg px-3 py-2.5">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <FiMessageSquare className="w-3 h-3" /> Nhận xét của giáo viên:
                  </p>
                  <p className="text-sm text-gray-700">{sub.teacherComment}</p>
                </div>
              )}
            </div>
          ) : overdue ? (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm text-red-600 font-medium">Đã hết hạn nộp bài</p>
            </div>
          ) : (
            <button
              onClick={() => { onClose(); onSubmit(homework); }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <FiUpload className="w-4 h-4" />
              Nộp bài
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN SECTION ====================
const HomeworkSection = ({ selectedClass }) => {
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailHw, setDetailHw] = useState(null);
  const [submitHw, setSubmitHw] = useState(null);

  const fetchHomeworks = async () => {
    try {
      const res = await fetch(API_URL, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setHomeworks(data.homeworks);
    } catch {/* ignore */}
    setLoading(false);
  };

  useEffect(() => {
    fetchHomeworks();
  }, []);

  const filtered = selectedClass
    ? homeworks.filter((h) =>
        !h.assignedClasses?.length ||
        h.assignedClasses.includes(selectedClass) ||
        h.assignmentType === 'student'
      )
    : homeworks;

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <FiLoader className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {filtered.length === 0 ? (
        <div className="text-center py-10">
          <IoDocumentTextOutline className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Chưa có bài tập nào được giao</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((hw) => {
            const sub = hw.submission;
            const overdue = isOverdue(hw.deadline);
            return (
              <div
                key={hw._id}
                onClick={() => setDetailHw(hw)}
                className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm cursor-pointer transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-medium text-gray-800 text-sm">{hw.title}</p>
                      {sub ? (
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-lg ${sub.status === 'graded' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                          {sub.status === 'graded' ? 'Đã nhận xét' : 'Đã nộp'}
                        </span>
                      ) : overdue ? (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-lg bg-red-50 text-red-600">Hết hạn</span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-lg bg-yellow-50 text-yellow-700">Chờ nộp</span>
                      )}
                    </div>

                    {hw.description && (
                      <p className="text-xs text-gray-500 line-clamp-1 mb-1">{hw.description}</p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <FiClock className="w-3 h-3" />
                        {formatDate(hw.deadline)}
                      </span>
                      {hw.attachments?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <FiPaperclip className="w-3 h-3" />
                          {hw.attachments.length} file
                        </span>
                      )}
                      {sub?.teacherComment && (
                        <span className="flex items-center gap-1 text-green-600">
                          <FiMessageSquare className="w-3 h-3" />
                          Có nhận xét
                        </span>
                      )}
                    </div>
                  </div>

                  {!sub && !overdue && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setSubmitHw(hw); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors flex-shrink-0"
                    >
                      <FiUpload className="w-3.5 h-3.5" />
                      Nộp bài
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <HomeworkDetailModal
        show={!!detailHw}
        homework={detailHw}
        onClose={() => setDetailHw(null)}
        onSubmit={(hw) => setSubmitHw(hw)}
      />
      <SubmitHomeworkModal
        show={!!submitHw}
        homework={submitHw}
        onClose={() => setSubmitHw(null)}
        onSubmitted={() => fetchHomeworks()}
      />
    </div>
  );
};

export default HomeworkSection;
