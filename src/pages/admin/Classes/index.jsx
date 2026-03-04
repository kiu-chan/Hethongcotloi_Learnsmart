import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  FiPlus,
  FiTrash2,
  FiSearch,
  FiX,
  FiLoader,
  FiEdit2,
  FiUserPlus,
  FiUsers,
  FiChevronDown,
  FiChevronUp,
  FiDownload,
  FiUpload,
  FiCheckCircle,
  FiAlertCircle,
  FiFileText,
} from 'react-icons/fi';
import { IoSchoolOutline } from 'react-icons/io5';
import { MdOutlineClass } from 'react-icons/md';

const API_BASE = '/api/admin';
const getToken = () => localStorage.getItem('authToken');

const avatarColor = {
  teacher: 'from-emerald-500 to-teal-600',
  student: 'from-blue-500 to-indigo-600',
};

// ── Xuất Excel danh sách lớp học (client-side) ────────────────
const exportClassesToExcel = (classes) => {
  const rows = [];
  for (const cls of classes) {
    const teachers = cls.teachers || [];
    const students = cls.students || [];
    if (teachers.length === 0 && students.length === 0) {
      rows.push({ 'Tên lớp': cls.name, 'Vai trò': '', 'Email': '', 'Họ và tên': '' });
    } else {
      for (const t of teachers) {
        rows.push({ 'Tên lớp': cls.name, 'Vai trò': 'teacher', 'Email': t.email, 'Họ và tên': t.name });
      }
      for (const s of students) {
        rows.push({ 'Tên lớp': cls.name, 'Vai trò': 'student', 'Email': s.email, 'Họ và tên': s.name });
      }
    }
  }
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 30 }, { wch: 25 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Danh sách lớp học');
  XLSX.writeFile(wb, 'danh_sach_lop_hoc.xlsx');
};

// ── Tải file mẫu Excel ────────────────────────────────────────
const downloadTemplate = () => {
  const rows = [
    { 'Tên lớp': 'Lớp 10A1', 'Vai trò': 'teacher', 'Email': 'giaovien@example.com', 'Họ và tên': 'Nguyễn Văn A', 'Mật khẩu': '12345678' },
    { 'Tên lớp': 'Lớp 10A1', 'Vai trò': 'student', 'Email': 'hocsinh1@example.com', 'Họ và tên': 'Trần Thị B', 'Mật khẩu': '' },
    { 'Tên lớp': 'Lớp 10A1', 'Vai trò': 'student', 'Email': 'hocsinh2@example.com', 'Họ và tên': 'Lê Văn C', 'Mật khẩu': '' },
    { 'Tên lớp': 'Lớp 10A2', 'Vai trò': 'teacher', 'Email': 'giaovien2@example.com', 'Họ và tên': 'Phạm Thị D', 'Mật khẩu': '' },
    { 'Tên lớp': 'Lớp 10A2', 'Vai trò': 'student', 'Email': 'hocsinh3@example.com', 'Họ và tên': 'Hoàng Văn E', 'Mật khẩu': '' },
  ];
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 30 }, { wch: 25 }, { wch: 15 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Mẫu nhập liệu');
  XLSX.writeFile(wb, 'mau_nhap_lop_hoc.xlsx');
};

// ── Modal nhập từ Excel ───────────────────────────────────────
const ImportModal = ({ onClose, onImported }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        setPreview(rows.slice(0, 8));
      } catch {
        setError('Không thể đọc file. Vui lòng chọn file Excel (.xlsx).');
        setFile(null);
      }
    };
    reader.readAsArrayBuffer(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_BASE}/classes/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Có lỗi xảy ra');
      setResult(data.stats);
      onImported();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = (r) => {
    if (r === 'teacher') return <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">Giáo viên</span>;
    if (r === 'student') return <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">Học sinh</span>;
    return <span className="text-gray-400 text-xs">{r}</span>;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Nhập lớp học từ Excel</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Phân biệt theo email · Tự tạo tài khoản nếu chưa có (mật khẩu mặc định: <code className="bg-gray-100 px-1 rounded">12345678</code>)
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <FiX size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Cột yêu cầu */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-800">
            <p className="font-semibold mb-1">Định dạng file Excel:</p>
            <p>Các cột bắt buộc: <strong>Tên lớp</strong> · <strong>Vai trò</strong> (teacher/student) · <strong>Email</strong> · <strong>Họ và tên</strong></p>
            <p className="mt-0.5">Cột tuỳ chọn: <strong>Mật khẩu</strong> (để trống sẽ dùng <code className="bg-indigo-100 px-1 rounded">12345678</code>)</p>
            <button onClick={downloadTemplate} className="mt-2 flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-medium">
              <FiFileText size={14} />
              Tải file mẫu
            </button>
          </div>

          {/* Upload area */}
          {!result && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all"
            >
              <FiUpload className="mx-auto text-gray-400 mb-3" size={32} />
              {file ? (
                <div>
                  <p className="font-medium text-gray-700">{file.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB · Click để đổi file</p>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-gray-700">Chọn file Excel (.xlsx)</p>
                  <p className="text-sm text-gray-400 mt-1">hoặc kéo thả vào đây</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && !result && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Xem trước ({preview.length} dòng đầu):
              </p>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {Object.keys(preview[0]).map((col) => (
                        <th key={col} className="px-3 py-2 text-left text-xs font-semibold text-gray-600">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0">
                        {Object.entries(row).map(([k, v]) => (
                          <td key={k} className="px-3 py-2 text-gray-700">
                            {k === 'Vai trò' ? roleLabel(v) : String(v)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Kết quả */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-green-700 font-semibold">
                <FiCheckCircle size={20} />
                Nhập dữ liệu thành công!
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white rounded-lg p-3 border border-green-100">
                  <p className="text-2xl font-bold text-gray-800">{result.classesCreated}</p>
                  <p className="text-gray-500">Lớp học được tạo mới</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-green-100">
                  <p className="text-2xl font-bold text-gray-800">{result.usersCreated}</p>
                  <p className="text-gray-500">Tài khoản mới được tạo</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-green-100">
                  <p className="text-2xl font-bold text-gray-800">{result.membersAdded}</p>
                  <p className="text-gray-500">Thành viên được thêm vào lớp</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-green-100">
                  <p className="text-2xl font-bold text-gray-800">{result.skipped}</p>
                  <p className="text-gray-500">Bỏ qua (đã tồn tại)</p>
                </div>
              </div>
              {result.errors?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-amber-700 font-medium text-sm mb-1 flex items-center gap-1">
                    <FiAlertCircle size={14} /> {result.errors.length} cảnh báo:
                  </p>
                  <ul className="text-xs text-amber-700 space-y-0.5 max-h-24 overflow-y-auto">
                    {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-2">
              <FiAlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            {result ? 'Đóng' : 'Hủy'}
          </button>
          {!result && (
            <button
              onClick={handleSubmit}
              disabled={!file || loading}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {loading && <FiLoader className="animate-spin" size={16} />}
              {loading ? 'Đang nhập...' : 'Nhập dữ liệu'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Modal tạo / đổi tên lớp ──────────────────────────────────
const ClassModal = ({ cls, onClose, onSaved }) => {
  const isEdit = Boolean(cls);
  const [name, setName] = useState(cls?.name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Vui lòng nhập tên lớp');
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        isEdit ? `${API_BASE}/classes/${cls._id}` : `${API_BASE}/classes`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ name: name.trim() }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Có lỗi xảy ra');
      onSaved(data.class, isEdit);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">
            {isEdit ? 'Đổi tên lớp' : 'Tạo lớp học mới'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <FiX size={20} className="text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên lớp <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              required
              placeholder="VD: Lớp 10A1"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
            />
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {loading && <FiLoader className="animate-spin" size={16} />}
              {isEdit ? 'Lưu' : 'Tạo lớp'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Modal thêm thành viên ──────────────────────────────────────
const AddMemberModal = ({ cls, onClose, onAdded }) => {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('student');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(null);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ role });
      if (search) params.append('search', search);
      const res = await fetch(`${API_BASE}/users?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) setUsers(data.users || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [role, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const existingIds = new Set([
    ...(cls.teachers || []).map((t) => t._id),
    ...(cls.students || []).map((s) => s._id),
  ]);
  const filtered = users.filter((u) => !existingIds.has(u.id));

  const handleAdd = async (userId) => {
    setAdding(userId);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/classes/${cls._id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Có lỗi xảy ra');
      onAdded(data.class);
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Thêm thành viên</h2>
            <p className="text-sm text-gray-500 mt-0.5">Lớp: {cls.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <FiX size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex gap-2">
            {[
              { key: 'student', label: 'Học sinh' },
              { key: 'teacher', label: 'Giáo viên' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setRole(key); setSearch(''); }}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                  role === key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-700"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="max-h-72 overflow-y-auto space-y-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <FiLoader className="animate-spin text-indigo-600" size={24} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                {search ? 'Không tìm thấy kết quả' : 'Không có người dùng nào để thêm'}
              </div>
            ) : (
              filtered.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div
                        className={`w-9 h-9 bg-gradient-to-br ${avatarColor[user.role] || 'from-gray-400 to-gray-600'} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-800">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAdd(user.id)}
                    disabled={adding === user.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {adding === user.id ? (
                      <FiLoader size={12} className="animate-spin" />
                    ) : (
                      <FiUserPlus size={12} />
                    )}
                    Thêm
                  </button>
                </div>
              ))
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Class Card ─────────────────────────────────────────────────
const ClassCard = ({ cls, onEdit, onDelete, onAddMember, onRemoveMember }) => {
  const [expanded, setExpanded] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const handleRemove = async (userId) => {
    if (!window.confirm('Xóa thành viên này khỏi lớp?')) return;
    setRemovingId(userId);
    try {
      const res = await fetch(`${API_BASE}/classes/${cls._id}/members/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) onRemoveMember(data.class);
    } catch {
      // silent
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <MdOutlineClass className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{cls.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {cls.teachers?.length || 0} giáo viên · {cls.students?.length || 0} học sinh
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onAddMember(cls)}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Thêm thành viên"
          >
            <FiUserPlus size={16} />
          </button>
          <button
            onClick={() => onEdit(cls)}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Đổi tên lớp"
          >
            <FiEdit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(cls)}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Xóa lớp"
          >
            <FiTrash2 size={16} />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {expanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <IoSchoolOutline size={14} />
              Giáo viên ({cls.teachers?.length || 0})
            </p>
            {cls.teachers?.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Chưa có giáo viên</p>
            ) : (
              <div className="space-y-2">
                {cls.teachers.map((t) => (
                  <div key={t._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {t.avatar ? (
                        <img src={t.avatar} alt={t.name} className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {t.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-700">{t.name}</p>
                        <p className="text-xs text-gray-400">{t.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(t._id)}
                      disabled={removingId === t._id}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {removingId === t._id ? <FiLoader size={12} className="animate-spin" /> : <FiX size={12} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FiUsers size={14} />
              Học sinh ({cls.students?.length || 0})
            </p>
            {cls.students?.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Chưa có học sinh</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {cls.students.map((s) => (
                  <div key={s._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {s.avatar ? (
                        <img src={s.avatar} alt={s.name} className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-700">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(s._id)}
                      disabled={removingId === s._id}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {removingId === s._id ? <FiLoader size={12} className="animate-spin" /> : <FiX size={12} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Trang chính ────────────────────────────────────────────────
const AdminClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalCls, setModalCls] = useState(undefined);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [addMemberCls, setAddMemberCls] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = useRef(null);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      const res = await fetch(`${API_BASE}/classes?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Không thể tải danh sách lớp');
      setClasses(data.classes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handler = (e) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target)) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSaved = (savedCls, isEdit) => {
    if (isEdit) {
      setClasses((prev) => prev.map((c) => (c._id === savedCls._id ? savedCls : c)));
    } else {
      setClasses((prev) => [savedCls, ...prev]);
    }
    setModalCls(undefined);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/classes/${deleteTarget._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setClasses((prev) => prev.filter((c) => c._id !== deleteTarget._id));
        setDeleteTarget(null);
      }
    } catch {
      // silent
    } finally {
      setDeleting(false);
    }
  };

  const handleMemberUpdate = (updatedCls) => {
    setClasses((prev) => prev.map((c) => (c._id === updatedCls._id ? updatedCls : c)));
    setAddMemberCls(updatedCls);
  };

  const totalTeachers = classes.reduce((sum, c) => sum + (c.teachers?.length || 0), 0);
  const totalStudents = classes.reduce((sum, c) => sum + (c.students?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Quản lý lớp học</h1>
          <p className="text-gray-600 mt-1">Tạo và quản lý lớp học, phân công giáo viên và học sinh</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Nút nhập từ Excel */}
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            <FiUpload size={16} />
            Nhập từ Excel
          </button>

          {/* Nút tải xuống với dropdown */}
          <div className="relative" ref={downloadMenuRef}>
            <button
              onClick={() => setShowDownloadMenu((v) => !v)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              <FiDownload size={16} />
              Tải xuống
              <FiChevronDown size={14} className={`transition-transform ${showDownloadMenu ? 'rotate-180' : ''}`} />
            </button>
            {showDownloadMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-10 min-w-52 py-1 overflow-hidden">
                <button
                  onClick={() => { exportClassesToExcel(classes); setShowDownloadMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  <FiDownload size={15} className="text-indigo-500" />
                  <div>
                    <p className="font-medium">Tải danh sách lớp học</p>
                    <p className="text-xs text-gray-400">Xuất dữ liệu hiện tại (.xlsx)</p>
                  </div>
                </button>
                <div className="border-t border-gray-50 mx-2" />
                <button
                  onClick={() => { downloadTemplate(); setShowDownloadMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  <FiFileText size={15} className="text-emerald-500" />
                  <div>
                    <p className="font-medium">Tải file mẫu</p>
                    <p className="text-xs text-gray-400">Mẫu để nhập dữ liệu (.xlsx)</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Nút tạo lớp */}
          <button
            onClick={() => setModalCls(null)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            <FiPlus size={20} />
            Tạo lớp học
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 text-center">
          <p className="text-3xl font-bold text-gray-800">{classes.length}</p>
          <p className="text-sm text-gray-500 mt-1">Tổng lớp học</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 text-center">
          <p className="text-3xl font-bold text-emerald-600">{totalTeachers}</p>
          <p className="text-sm text-gray-500 mt-1">Giáo viên được phân công</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 text-center">
          <p className="text-3xl font-bold text-blue-600">{totalStudents}</p>
          <p className="text-sm text-gray-500 mt-1">Học sinh đã vào lớp</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="relative max-w-md">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm lớp học..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FiX size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Class list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <FiLoader className="animate-spin text-indigo-600" size={32} />
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-500">
          <p className="font-medium">{error}</p>
          <button onClick={fetchClasses} className="mt-2 text-sm text-indigo-600 underline">
            Thử lại
          </button>
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <div className="w-20 h-20 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <MdOutlineClass className="w-10 h-10 text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {search ? 'Không tìm thấy lớp học' : 'Chưa có lớp học nào'}
          </h3>
          <p className="text-gray-500 mb-6">
            {search ? 'Thử tìm kiếm với từ khóa khác' : 'Tạo lớp học đầu tiên để bắt đầu'}
          </p>
          {!search && (
            <button
              onClick={() => setModalCls(null)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors mx-auto"
            >
              <FiPlus size={18} />
              Tạo lớp học
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <ClassCard
              key={cls._id}
              cls={cls}
              onEdit={(c) => setModalCls(c)}
              onDelete={(c) => setDeleteTarget(c)}
              onAddMember={(c) => setAddMemberCls(c)}
              onRemoveMember={handleMemberUpdate}
            />
          ))}
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={fetchClasses}
        />
      )}

      {/* Create/Edit Modal */}
      {modalCls !== undefined && (
        <ClassModal cls={modalCls} onClose={() => setModalCls(undefined)} onSaved={handleSaved} />
      )}

      {/* Add Member Modal */}
      {addMemberCls && (
        <AddMemberModal
          cls={addMemberCls}
          onClose={() => setAddMemberCls(null)}
          onAdded={handleMemberUpdate}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiTrash2 className="text-red-600 w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Xóa lớp học</h2>
              <p className="text-gray-600 text-sm">
                Bạn có chắc muốn xóa lớp{' '}
                <span className="font-semibold text-gray-800">{deleteTarget.name}</span>? Hành động
                này không thể hoàn tác.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {deleting && <FiLoader className="animate-spin" size={16} />}
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminClasses;
