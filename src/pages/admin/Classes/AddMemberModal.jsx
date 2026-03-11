import React, { useState, useEffect, useCallback } from 'react';
import { FiX, FiLoader, FiSearch, FiUserPlus } from 'react-icons/fi';
import { API_BASE, getToken, avatarColor } from './constants';

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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
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
            {[{ key: 'student', label: 'Học sinh' }, { key: 'teacher', label: 'Giáo viên' }].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setRole(key); setSearch(''); }}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                  role === key ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
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
                <div key={user.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className={`w-9 h-9 bg-gradient-to-br ${avatarColor[user.role] || 'from-gray-400 to-gray-600'} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
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
                    {adding === user.id ? <FiLoader size={12} className="animate-spin" /> : <FiUserPlus size={12} />}
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

export default AddMemberModal;
