import { useState } from 'react';
import { FiX, FiUserPlus, FiEdit2, FiTrash2, FiUsers, FiLoader } from 'react-icons/fi';
import { IoSchoolOutline } from 'react-icons/io5';
import { MdOutlineClass } from 'react-icons/md';
import { API_BASE, getToken } from './constants';

const ClassActionsPopup = ({ cls, onClose, onEdit, onDelete, onAddMember, onRemoveMember, onSetHomeroom }) => {
  const [removingId, setRemovingId] = useState(null);
  const [settingHomeroom, setSettingHomeroom] = useState(null);

  const homeroomId = cls.homeroomTeacher?._id || cls.homeroomTeacher;
  const homeroomTeacher = cls.teachers?.find(
    (t) => t._id === homeroomId || t._id?.toString() === homeroomId?.toString()
  );

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <MdOutlineClass className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-gray-800 truncate">{cls.name}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {cls.teachers?.length || 0} giáo viên · {cls.students?.length || 0} học sinh
              </p>
            </div>
          </div>
          {/* Action icons + close */}
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            <button
              onClick={() => { onAddMember(cls); onClose(); }}
              title="Thêm thành viên"
              className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <FiUserPlus size={16} />
            </button>
            <button
              onClick={() => { onEdit(cls); onClose(); }}
              title="Đổi tên lớp"
              className="p-2 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
            >
              <FiEdit2 size={16} />
            </button>
            <button
              onClick={() => { onDelete(cls); onClose(); }}
              title="Xóa lớp học"
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <FiTrash2 size={16} />
            </button>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <FiX size={16} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Members content */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Homeroom info */}
          {homeroomTeacher && (
            <div className="px-3 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
              <IoSchoolOutline className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-emerald-700 font-semibold">Giáo viên chủ nhiệm</p>
                <p className="text-xs text-emerald-600">{homeroomTeacher.name}</p>
              </div>
            </div>
          )}

          {/* Teachers */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <IoSchoolOutline size={14} />
              Giáo viên ({cls.teachers?.length || 0})
            </p>
            {!cls.teachers?.length ? (
              <p className="text-xs text-gray-400 italic">Chưa có giáo viên</p>
            ) : (
              <div className="space-y-2">
                {cls.teachers.map((t) => {
                  const isHomeroom = t._id === homeroomId || t._id?.toString() === homeroomId?.toString();
                  return (
                    <div key={t._id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {t.avatar ? (
                          <img src={t.avatar} alt={t.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {t.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-sm font-medium text-gray-700">{t.name}</p>
                            {isHomeroom && (
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-md whitespace-nowrap">
                                Chủ nhiệm
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 truncate">{t.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
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
            {!cls.students?.length ? (
              <p className="text-xs text-gray-400 italic">Chưa có học sinh</p>
            ) : (
              <div className="space-y-2">
                {cls.students.map((s) => (
                  <div key={s._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {s.avatar ? (
                        <img src={s.avatar} alt={s.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-700">{s.name}</p>
                        <p className="text-xs text-gray-400 truncate">{s.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(s._id)}
                      disabled={removingId === s._id}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      {removingId === s._id ? <FiLoader size={12} className="animate-spin" /> : <FiX size={12} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassActionsPopup;
