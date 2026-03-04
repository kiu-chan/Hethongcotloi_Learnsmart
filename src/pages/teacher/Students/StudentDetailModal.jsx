import { useState, useEffect } from 'react';
import {
  FiX,
  FiTrash2,
  FiMail,
  FiPhone,
  FiMapPin,
  FiEdit3,
  FiSave,
  FiLoader,
  FiPlus,
  FiRefreshCw,
} from 'react-icons/fi';
import {
  IoPersonOutline,
  IoCalendarOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
} from 'react-icons/io5';

const API_URL = '/api/students';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

const formatDate = (date) =>
  new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

const StudentDetailModal = ({ show, student, onClose, onDelete, onUpdate, semesterStartDate }) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Absent dates state
  const [absentDates, setAbsentDates] = useState([]);
  const [addingAbsent, setAddingAbsent] = useState(false);
  const [newAbsentDate, setNewAbsentDate] = useState('');
  const [absentLoading, setAbsentLoading] = useState(false);

  // Recalculate state
  const [recalcLoading, setRecalcLoading] = useState(false);

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || '',
        gender: student.gender || 'Nam',
        dateOfBirth: student.dateOfBirth || '',
        className: Array.isArray(student.className) ? [...student.className] : [student.className].filter(Boolean),
        phone: student.phone || '',
        address: student.address || '',
        parentName: student.parentName || '',
        parentPhone: student.parentPhone || '',
        notes: student.notes || '',
        status: student.status || 'active',
      });
      setAbsentDates(
        Array.isArray(student.absentDates)
          ? student.absentDates.map((d) => new Date(d).toISOString().split('T')[0]).sort().reverse()
          : []
      );
      setEditing(false);
      setError('');
      setAddingAbsent(false);
      setNewAbsentDate('');
    }
  }, [student]);

  if (!show || !student) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Họ tên không được để trống');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/${student._id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Có lỗi xảy ra');
        setSaving(false);
        return;
      }

      setEditing(false);
      if (onUpdate) onUpdate();
    } catch {
      setError('Lỗi kết nối server');
    }
    setSaving(false);
  };

  const handleClose = () => {
    setEditing(false);
    setError('');
    setAddingAbsent(false);
    setNewAbsentDate('');
    onClose();
  };

  const handleAddAbsent = async () => {
    if (!newAbsentDate) return;
    setAbsentLoading(true);
    try {
      const res = await fetch(`${API_URL}/${student._id}/absent`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ date: newAbsentDate, action: 'add' }),
      });
      const data = await res.json();
      if (data.success) {
        setAbsentDates(
          Array.isArray(data.student.absentDates)
            ? data.student.absentDates.map((d) => new Date(d).toISOString().split('T')[0]).sort().reverse()
            : []
        );
        setNewAbsentDate('');
        setAddingAbsent(false);
        if (onUpdate) onUpdate();
      }
    } catch {
      console.error('Error adding absent date');
    }
    setAbsentLoading(false);
  };

  const handleRemoveAbsent = async (dateStr) => {
    setAbsentLoading(true);
    try {
      const res = await fetch(`${API_URL}/${student._id}/absent`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ date: dateStr, action: 'remove' }),
      });
      const data = await res.json();
      if (data.success) {
        setAbsentDates(
          Array.isArray(data.student.absentDates)
            ? data.student.absentDates.map((d) => new Date(d).toISOString().split('T')[0]).sort().reverse()
            : []
        );
        if (onUpdate) onUpdate();
      }
    } catch {
      console.error('Error removing absent date');
    }
    setAbsentLoading(false);
  };

  const handleRecalculate = async () => {
    setRecalcLoading(true);
    try {
      const res = await fetch(`${API_URL}/${student._id}/recalculate`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && onUpdate) onUpdate();
    } catch {
      console.error('Error recalculating');
    }
    setRecalcLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="relative h-32 bg-gradient-to-br from-emerald-400 to-teal-500">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                title="Chỉnh sửa"
              >
                <FiEdit3 className="w-5 h-5 text-white" />
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="absolute -bottom-16 left-8">
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-xl">
              <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-4xl">
                {(editing ? formData.name : student.name)?.charAt(0) || '?'}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-20 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          {editing ? (
            /* ============ EDIT MODE ============ */
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giới tính</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ngày sinh</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="active">Đang học</option>
                    <option value="inactive">Nghỉ học</option>
                  </select>
                </div>
              </div>

              {/* Class - read only (managed by admin) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lớp</label>
                <div className="flex flex-wrap gap-1.5 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 min-h-[48px]">
                  {formData.className.length > 0 ? formData.className.map((cn) => (
                    <span key={cn} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg">
                      {cn}
                    </span>
                  )) : (
                    <span className="text-sm text-gray-400 italic">Chưa được phân công lớp nào</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">Lớp học được quản lý bởi quản trị viên</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0912345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Nhập địa chỉ"
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-800 mb-4">Thông tin phụ huynh</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Họ tên phụ huynh</label>
                    <input
                      type="text"
                      name="parentName"
                      value={formData.parentName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Nhập họ tên phụ huynh"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SĐT phụ huynh</label>
                    <input
                      type="tel"
                      name="parentPhone"
                      value={formData.parentPhone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="0987654321"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú / Đánh giá</label>
                <textarea
                  rows="3"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Nhập ghi chú, đánh giá về học sinh..."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setEditing(false);
                    setError('');
                    setFormData({
                      name: student.name || '',
                      gender: student.gender || 'Nam',
                      dateOfBirth: student.dateOfBirth || '',
                      className: Array.isArray(student.className) ? [...student.className] : [student.className].filter(Boolean),
                      phone: student.phone || '',
                      address: student.address || '',
                      parentName: student.parentName || '',
                      parentPhone: student.parentPhone || '',
                      notes: student.notes || '',
                      status: student.status || 'active',
                    });
                  }}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <FiLoader className="w-4 h-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <FiSave className="w-4 h-4" />
                      Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* ============ VIEW MODE ============ */
            <>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">{student.name}</h2>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(student.className) ? student.className : [student.className]).map((cn) => (
                        <span key={cn} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-sm font-medium rounded">
                          {cn}
                        </span>
                      ))}
                    </div>
                    <span className="text-gray-400">&bull;</span>
                    <span className="text-gray-600">{student.gender}</span>
                  </div>
                </div>
                {student.status === 'active' ? (
                  <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 text-sm font-medium rounded-full">
                    <IoCheckmarkCircleOutline className="w-4 h-4" />
                    Đang học
                  </span>
                ) : (
                  <span className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 text-sm font-medium rounded-full">
                    <IoCloseCircleOutline className="w-4 h-4" />
                    Nghỉ học
                  </span>
                )}
              </div>

              {/* Stats: score, attendance, assignments */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {student.score > 0 ? student.score : '—'}
                  </div>
                  <div className="text-sm text-gray-600">Điểm trung bình</div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-emerald-600 mb-1">{student.attendance}%</div>
                  <div className="text-sm text-gray-600">Tỷ lệ đi học</div>
                  {absentDates.length > 0 && (
                    <div className="text-xs text-red-500 mt-1">Nghỉ {absentDates.length} buổi</div>
                  )}
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {student.assignmentsCompleted}/{student.assignmentsTotal}
                  </div>
                  <div className="text-sm text-gray-600">Bài đã nộp</div>
                </div>
              </div>

              {/* Recalculate button */}
              <div className="mb-6">
                <button
                  onClick={handleRecalculate}
                  disabled={recalcLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  {recalcLoading ? (
                    <FiLoader className="w-4 h-4 animate-spin" />
                  ) : (
                    <FiRefreshCw className="w-4 h-4" />
                  )}
                  Cập nhật điểm & bài tập từ bài thi
                </button>
              </div>

              <div className="space-y-6">
                {/* Ngày nghỉ học */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <IoCalendarOutline className="w-5 h-5 text-red-500" />
                      Ngày nghỉ học
                      {absentDates.length > 0 && (
                        <span className="text-sm font-normal text-red-500">({absentDates.length} buổi)</span>
                      )}
                    </h3>
                    {!addingAbsent && (
                      <button
                        onClick={() => setAddingAbsent(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg transition-colors"
                      >
                        <FiPlus className="w-3.5 h-3.5" />
                        Thêm ngày nghỉ
                      </button>
                    )}
                  </div>

                  {!semesterStartDate && (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                      Chưa đặt ngày đầu học kỳ — tỷ lệ đi học sẽ không tự động cập nhật.
                    </p>
                  )}

                  {addingAbsent && (
                    <div className="flex items-center gap-2 mb-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <input
                        type="date"
                        value={newAbsentDate}
                        onChange={(e) => setNewAbsentDate(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                        max={new Date().toISOString().split('T')[0]}
                      />
                      <button
                        onClick={handleAddAbsent}
                        disabled={!newAbsentDate || absentLoading}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        {absentLoading ? <FiLoader className="w-4 h-4 animate-spin" /> : 'Lưu'}
                      </button>
                      <button
                        onClick={() => { setAddingAbsent(false); setNewAbsentDate(''); }}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm transition-colors"
                      >
                        Hủy
                      </button>
                    </div>
                  )}

                  {absentDates.length > 0 ? (
                    <div className="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                      {absentDates.map((dateStr) => (
                        <div
                          key={dateStr}
                          className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                        >
                          <span className="text-sm font-medium text-gray-700">
                            {formatDate(dateStr)}
                          </span>
                          <button
                            onClick={() => handleRemoveAbsent(dateStr)}
                            disabled={absentLoading}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                            title="Xóa ngày nghỉ"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Chưa có ngày nghỉ nào được ghi nhận.</p>
                  )}
                </div>

                {/* Thông tin cá nhân */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <IoPersonOutline className="w-5 h-5" />
                    Thông tin cá nhân
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <FiMail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="text-sm font-medium text-gray-800">{student.email}</span>
                    </div>
                    {student.phone && (
                      <div className="flex items-center gap-3">
                        <FiPhone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">SĐT:</span>
                        <span className="text-sm font-medium text-gray-800">{student.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <IoCalendarOutline className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Ngày sinh:</span>
                      <span className="text-sm font-medium text-gray-800">{student.dateOfBirth}</span>
                    </div>
                    {student.address && (
                      <div className="flex items-center gap-3">
                        <FiMapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Địa chỉ:</span>
                        <span className="text-sm font-medium text-gray-800">{student.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {(student.parentName || student.parentPhone) && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <IoPersonOutline className="w-5 h-5" />
                      Thông tin phụ huynh
                    </h3>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      {student.parentName && (
                        <div className="flex items-center gap-3">
                          <IoPersonOutline className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Họ tên:</span>
                          <span className="text-sm font-medium text-gray-800">{student.parentName}</span>
                        </div>
                      )}
                      {student.parentPhone && (
                        <div className="flex items-center gap-3">
                          <FiPhone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">SĐT:</span>
                          <span className="text-sm font-medium text-gray-800">{student.parentPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Ghi chú / Đánh giá */}
                {student.notes && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3">Ghi chú / Đánh giá</h3>
                    <div className="bg-amber-50 border-l-4 border-amber-400 rounded-xl p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{student.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-8 pt-6 border-t">
                <button
                  onClick={() => onDelete(student._id)}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-50 hover:bg-red-100 rounded-xl font-semibold text-red-600 transition-colors"
                >
                  <FiTrash2 className="w-4 h-4" />
                  Xóa
                </button>
                <button
                  onClick={() => setEditing(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all"
                >
                  <FiEdit3 className="w-4 h-4" />
                  Chỉnh sửa
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDetailModal;
