import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiPlus, FiSearch, FiX, FiLoader, FiDownload, FiUpload, FiTrash2, FiFileText, FiChevronDown } from 'react-icons/fi';
import { MdOutlineClass } from 'react-icons/md';
import { API_BASE, getToken } from './constants';
import { exportClassesToExcel, downloadTemplate } from './excelHelpers';
import ClassCard from './ClassCard';
import ClassModal from './ClassModal';
import AddMemberModal from './AddMemberModal';
import ImportModal from './ImportModal';

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
  const [showDownload, setShowDownload] = useState(false);
  const downloadRef = useRef(null);

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

  useEffect(() => {
    if (!showDownload) return;
    const handleClickOutside = (e) => {
      if (downloadRef.current && !downloadRef.current.contains(e.target)) {
        setShowDownload(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDownload]);

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

  const handleHomeroomUpdate = (updatedCls) => {
    setClasses((prev) => prev.map((c) => (c._id === updatedCls._id ? updatedCls : c)));
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
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            <FiUpload size={16} />
            Nhập từ Excel
          </button>

          {/* Download dropdown */}
          <div className="relative" ref={downloadRef}>
            <button
              onClick={() => setShowDownload((v) => !v)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              <FiDownload size={16} />
              Tải xuống
              <FiChevronDown size={14} className={`transition-transform ${showDownload ? 'rotate-180' : ''}`} />
            </button>
            {showDownload && (
              <div className="absolute right-0 mt-1.5 w-52 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                <button
                  onClick={() => { exportClassesToExcel(classes); setShowDownload(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 text-left transition-colors"
                >
                  <FiDownload size={15} className="text-indigo-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Danh sách lớp học</p>
                    <p className="text-xs text-gray-400">Xuất file .xlsx</p>
                  </div>
                </button>
                <button
                  onClick={() => { downloadTemplate(); setShowDownload(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-emerald-50 text-left transition-colors"
                >
                  <FiFileText size={15} className="text-emerald-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">File mẫu nhập liệu</p>
                    <p className="text-xs text-gray-400">Template .xlsx</p>
                  </div>
                </button>
              </div>
            )}
          </div>

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
          <button onClick={fetchClasses} className="mt-2 text-sm text-indigo-600 underline">Thử lại</button>
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
              onSetHomeroom={handleHomeroomUpdate}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onImported={fetchClasses} />}
      {modalCls !== undefined && <ClassModal cls={modalCls} onClose={() => setModalCls(undefined)} onSaved={handleSaved} />}
      {addMemberCls && <AddMemberModal cls={addMemberCls} onClose={() => setAddMemberCls(null)} onAdded={handleMemberUpdate} />}

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
                <span className="font-semibold text-gray-800">{deleteTarget.name}</span>? Hành động này không thể hoàn tác.
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
