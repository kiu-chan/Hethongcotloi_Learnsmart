import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FiPlus,
  FiLoader,
  FiTrash2,
  FiEye,
  FiSend,
  FiPaperclip,
  FiX,
  FiFile,
  FiDownload,
  FiMessageSquare,
  FiCheck,
  FiClock,
  FiUsers,
} from 'react-icons/fi';
import { IoSchoolOutline, IoDocumentTextOutline } from 'react-icons/io5';

const API_URL = '/api/homework';
const STUDENT_API = '/api/homework';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return { Authorization: `Bearer ${token}` };
};

const getJsonHeaders = () => {
  const token = localStorage.getItem('authToken');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
};

const formatDate = (d) => {
  if (!d) return 'Không giới hạn';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const FileIcon = ({ mimeType }) => {
  if (mimeType?.startsWith('image/')) return <span className="text-blue-500">🖼️</span>;
  if (mimeType === 'application/pdf') return <span className="text-red-500">📄</span>;
  return <span className="text-indigo-500">📝</span>;
};

// ==================== CREATE HOMEWORK MODAL ====================
const CreateHomeworkModal = ({ show, onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Assignment
  const [assigning, setAssigning] = useState(false);
  const [assignTab, setAssignTab] = useState('class'); // 'class' | 'student'
  const [classes, setClasses] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [studentsForClass, setStudentsForClass] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [classForStudents, setClassForStudents] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (show) {
      setTitle(''); setDescription(''); setDeadline(''); setFiles([]);
      setError(''); setAssigning(false); setSelectedClasses([]); setSelectedStudents([]);
      fetchClasses();
    }
  }, [show]);

  const fetchClasses = async () => {
    try {
      const res = await fetch(`${API_URL}/classes`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setClasses(data.classes);
    } catch {/* ignore */}
  };

  const fetchStudentsForClass = async (className) => {
    if (!className) return;
    setLoadingStudents(true);
    try {
      const res = await fetch(`${API_URL}/students-by-class?className=${encodeURIComponent(className)}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setStudentsForClass(data.students);
    } catch {/* ignore */}
    setLoadingStudents(false);
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...newFiles].slice(0, 5));
    e.target.value = '';
  };

  const handleSubmit = async (publish) => {
    if (!title.trim()) { setError('Vui lòng nhập tiêu đề'); return; }
    if (publish && assignTab === 'class' && selectedClasses.length === 0) {
      setError('Vui lòng chọn ít nhất một lớp'); return;
    }
    if (publish && assignTab === 'student' && selectedStudents.length === 0) {
      setError('Vui lòng chọn ít nhất một học sinh'); return;
    }
    setSaving(true); setError('');

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description);
      if (deadline) formData.append('deadline', new Date(deadline).toISOString());
      files.forEach((f) => formData.append('files', f));

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Lỗi tạo bài tập');

      const homeworkId = data.homework._id;

      if (publish) {
        const assignRes = await fetch(`${API_URL}/${homeworkId}/assign`, {
          method: 'POST',
          headers: getJsonHeaders(),
          body: JSON.stringify({
            assignmentType: assignTab,
            assignedClasses: assignTab === 'class' ? selectedClasses : [],
            assignedStudents: assignTab === 'student' ? selectedStudents : [],
            deadline: deadline ? new Date(deadline).toISOString() : undefined,
          }),
        });
        const assignData = await assignRes.json();
        if (!assignData.success) throw new Error(assignData.message || 'Lỗi giao bài');
      }

      onCreated();
      onClose();
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Tạo bài tập mới</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tiêu đề <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề bài tập..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả / Nội dung</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập nội dung, yêu cầu bài tập..."
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Hạn nộp bài</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">File đính kèm (tối đa 5 file)</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
            >
              <FiPaperclip className="w-6 h-6 text-gray-400 mx-auto mb-1" />
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

          {/* Assignment Section */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setAssigning(!assigning)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
            >
              <div className="flex items-center gap-2">
                <FiSend className="w-4 h-4 text-blue-500" />
                <span>Giao bài ngay</span>
              </div>
              <span className="text-gray-400 text-xs">{assigning ? '▲' : '▼'}</span>
            </button>

            {assigning && (
              <div className="p-4 space-y-3">
                {/* Assign type tabs */}
                <div className="flex gap-2">
                  {[{ key: 'class', label: 'Theo lớp' }, { key: 'student', label: 'Theo học sinh' }].map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setAssignTab(t.key)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${assignTab === t.key ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {assignTab === 'class' && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Chọn lớp để giao bài:</p>
                    {classes.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">Chưa được phân công lớp nào</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {classes.map((c) => (
                          <button
                            key={c.name}
                            onClick={() => setSelectedClasses((prev) => prev.includes(c.name) ? prev.filter((x) => x !== c.name) : [...prev, c.name])}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${selectedClasses.includes(c.name) ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            <IoSchoolOutline className="w-3.5 h-3.5" />
                            {c.name} <span className="opacity-70">({c.count})</span>
                            {selectedClasses.includes(c.name) && <FiCheck className="w-3 h-3" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {assignTab === 'student' && (
                  <div>
                    <select
                      value={classForStudents}
                      onChange={(e) => { setClassForStudents(e.target.value); fetchStudentsForClass(e.target.value); setSelectedStudents([]); }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Chọn lớp...</option>
                      {classes.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                    {loadingStudents && <p className="text-sm text-gray-400">Đang tải...</p>}
                    {studentsForClass.length > 0 && (
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {studentsForClass.map((s) => (
                          <label key={s._id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(s._id)}
                              onChange={(e) => setSelectedStudents((prev) => e.target.checked ? [...prev, s._id] : prev.filter((x) => x !== s._id))}
                              className="w-4 h-4 accent-blue-500"
                            />
                            <span className="text-sm text-gray-700">{s.name}</span>
                            <span className="text-xs text-gray-400">{s.email}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            Hủy
          </button>
          {!assigning && (
            <button
              onClick={() => handleSubmit(false)}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? <FiLoader className="w-4 h-4 animate-spin" /> : null}
              Lưu nháp
            </button>
          )}
          <button
            onClick={() => handleSubmit(assigning)}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors disabled:opacity-50"
          >
            {saving && <FiLoader className="w-4 h-4 animate-spin" />}
            {assigning ? 'Tạo & Giao bài' : 'Tạo bài tập'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== HOMEWORK SUBMISSIONS MODAL ====================
const HomeworkSubmissionsModal = ({ show, homework, onClose }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [commenting, setCommenting] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [savingComment, setSavingComment] = useState(false);

  useEffect(() => {
    if (show && homework?._id) {
      fetchSubmissions();
    }
  }, [show, homework]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/${homework._id}/submissions`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setSubmissions(data.submissions);
    } catch {/* ignore */}
    setLoading(false);
  };

  const handleGrade = async (sid) => {
    setSavingComment(true);
    try {
      const res = await fetch(`${API_URL}/${homework._id}/submissions/${sid}/grade`, {
        method: 'PATCH',
        headers: getJsonHeaders(),
        body: JSON.stringify({ teacherComment: commentText }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmissions((prev) => prev.map((s) => s._id === sid ? { ...s, teacherComment: commentText, status: 'graded' } : s));
        setCommenting(null);
        setCommentText('');
      }
    } catch {/* ignore */}
    setSavingComment(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Bài nộp</h2>
            <p className="text-sm text-gray-500 mt-0.5">{homework?.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <FiLoader className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12">
              <IoDocumentTextOutline className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Chưa có học sinh nộp bài</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((sub) => (
                <div key={sub._id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-800">{sub.student?.name || 'Học sinh'}</p>
                      <p className="text-xs text-gray-400">{sub.student?.email}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Nộp lúc: {formatDate(sub.submittedAt)}</p>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${sub.status === 'graded' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                      {sub.status === 'graded' ? 'Đã nhận xét' : 'Chờ nhận xét'}
                    </span>
                  </div>

                  {/* Files */}
                  {sub.files?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {sub.files.map((f, i) => (
                        <a
                          key={i}
                          href={`/uploads/homework/${f.filePath}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                        >
                          <FileIcon mimeType={f.mimeType} />
                          <span className="max-w-[120px] truncate">{f.originalName}</span>
                          <FiDownload className="w-3 h-3 flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Student note */}
                  {sub.note && (
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mb-3 italic">"{sub.note}"</p>
                  )}

                  {/* Teacher comment */}
                  {sub.teacherComment && commenting !== sub._id && (
                    <div className="flex items-start gap-2 bg-blue-50 rounded-lg px-3 py-2 mb-2">
                      <FiMessageSquare className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-700">{sub.teacherComment}</p>
                    </div>
                  )}

                  {/* Comment form */}
                  {commenting === sub._id ? (
                    <div className="flex gap-2 mt-2">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Nhập nhận xét..."
                        rows={2}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => handleGrade(sub._id)}
                          disabled={savingComment}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg disabled:opacity-50 transition-colors"
                        >
                          {savingComment ? <FiLoader className="w-3 h-3 animate-spin" /> : <FiCheck className="w-3 h-3" />}
                          Lưu
                        </button>
                        <button
                          onClick={() => { setCommenting(null); setCommentText(''); }}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded-lg transition-colors"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setCommenting(sub._id); setCommentText(sub.teacherComment || ''); }}
                      className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium mt-1"
                    >
                      <FiMessageSquare className="w-3.5 h-3.5" />
                      {sub.teacherComment ? 'Sửa nhận xét' : 'Viết nhận xét'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN HOMEWORK TAB ====================
const HomeworkTab = () => {
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState('');
  const [classes, setClasses] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [viewSubmissions, setViewSubmissions] = useState(null);

  const fetchHomeworks = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterClass) params.append('className', filterClass);
      const res = await fetch(`${API_URL}?${params}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setHomeworks(data.homeworks);
    } catch {/* ignore */}
  }, [filterClass]);

  const fetchClasses = async () => {
    try {
      const res = await fetch(`${API_URL}/classes`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setClasses(data.classes);
    } catch {/* ignore */}
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchHomeworks(), fetchClasses()]);
      setLoading(false);
    };
    load();
  }, [fetchHomeworks]);

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài tập này? Tất cả bài nộp cũng sẽ bị xóa.')) return;
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      setHomeworks((prev) => prev.filter((h) => h._id !== id));
    } catch {/* ignore */}
  };

  const isOverdue = (deadline) => deadline && new Date(deadline) < new Date();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <FiLoader className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả lớp</option>
            {classes.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          Tạo bài tập
        </button>
      </div>

      {/* Homework list */}
      {homeworks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <IoDocumentTextOutline className="w-10 h-10 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Chưa có bài tập nào</h3>
          <p className="text-gray-500 mb-6">Tạo bài tập mới và giao cho học sinh</p>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors mx-auto"
          >
            <FiPlus className="w-4 h-4" />
            Tạo bài tập đầu tiên
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {homeworks.map((hw) => (
            <div key={hw._id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-gray-800 text-base">{hw.title}</h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-lg ${hw.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {hw.status === 'published' ? 'Đã giao' : 'Nháp'}
                    </span>
                    {hw.status === 'published' && isOverdue(hw.deadline) && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-lg bg-red-50 text-red-600">Hết hạn</span>
                    )}
                  </div>

                  {hw.description && (
                    <p className="text-sm text-gray-500 mb-2 line-clamp-2">{hw.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <FiClock className="w-3.5 h-3.5" />
                      {formatDate(hw.deadline)}
                    </span>
                    {hw.assignedClasses?.length > 0 && (
                      <span className="flex items-center gap-1">
                        <IoSchoolOutline className="w-3.5 h-3.5" />
                        {hw.assignedClasses.join(', ')}
                      </span>
                    )}
                    {hw.attachments?.length > 0 && (
                      <span className="flex items-center gap-1">
                        <FiPaperclip className="w-3.5 h-3.5" />
                        {hw.attachments.length} file
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <FiUsers className="w-3.5 h-3.5" />
                      <span className="font-medium text-blue-600">{hw.submittedCount || 0}</span> đã nộp
                      {hw.gradedCount > 0 && <span className="text-green-600 ml-1">({hw.gradedCount} nhận xét)</span>}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setViewSubmissions(hw)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <FiEye className="w-4 h-4" />
                    Bài nộp
                  </button>
                  <button
                    onClick={() => handleDelete(hw._id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateHomeworkModal
        show={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => fetchHomeworks()}
      />
      <HomeworkSubmissionsModal
        show={!!viewSubmissions}
        homework={viewSubmissions}
        onClose={() => setViewSubmissions(null)}
      />
    </div>
  );
};

export default HomeworkTab;
