import React, { useState } from 'react';
import {
  FiTrash2, FiX, FiLoader, FiEdit2, FiUserPlus, FiUsers, FiChevronDown, FiChevronUp,
} from 'react-icons/fi';
import { IoSchoolOutline } from 'react-icons/io5';
import { MdOutlineClass } from 'react-icons/md';
import { API_BASE, getToken } from './constants';

const ClassCard = ({ cls, onEdit, onDelete, onAddMember, onRemoveMember, onSetHomeroom }) => {
  const [expanded, setExpanded] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [settingHomeroom, setSettingHomeroom] = useState(null);

  const homeroomId = cls.homeroomTeacher?._id || cls.homeroomTeacher;

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

  const handleSetHomeroom = async (teacherId) => {
    setSettingHomeroom(teacherId);
    try {
      const res = await fetch(`${API_BASE}/classes/${cls._id}/homeroom`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ teacherId }),
      });
      const data = await res.json();
      if (res.ok) onSetHomeroom(data.class);
    } catch {
      // silent
    } finally {
      setSettingHomeroom(null);
    }
  };

  const homeroomTeacher = cls.teachers?.find(
    (t) => t._id === homeroomId || t._id?.toString() === homeroomId?.toString()
  );

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
            {homeroomTeacher && (
              <p className="text-xs text-emerald-600 mt-0.5 font-medium">
                CN: {homeroomTeacher.name}
              </p>
            )}
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
          {/* Teachers */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <IoSchoolOutline size={14} />
              Giáo viên ({cls.teachers?.length || 0})
            </p>
            {cls.teachers?.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Chưa có giáo viên</p>
            ) : (
              <div className="space-y-2">
                {cls.teachers.map((t) => {
                  const isHomeroom = t._id === homeroomId || t._id?.toString() === homeroomId?.toString();
                  return (
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
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-gray-700">{t.name}</p>
                            {isHomeroom && (
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-md">
                                Chủ nhiệm
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{t.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {/* Nút đặt làm chủ nhiệm — chỉ hiện khi có 2+ GV và GV này chưa là chủ nhiệm */}
                        {!isHomeroom && cls.teachers.length >= 2 && (
                          <button
                            onClick={() => handleSetHomeroom(t._id)}
                            disabled={settingHomeroom === t._id}
                            title="Đặt làm giáo viên chủ nhiệm"
                            className="flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                          >
                            {settingHomeroom === t._id ? (
                              <FiLoader size={11} className="animate-spin" />
                            ) : (
                              <IoSchoolOutline size={11} />
                            )}
                            CN
                          </button>
                        )}
                        <button
                          onClick={() => handleRemove(t._id)}
                          disabled={removingId === t._id}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {removingId === t._id ? <FiLoader size={12} className="animate-spin" /> : <FiX size={12} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Students */}
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

export default ClassCard;
