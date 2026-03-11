import React from 'react';
import { FiX, FiUserPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { IoSchoolOutline } from 'react-icons/io5';
import { MdOutlineClass } from 'react-icons/md';

const ClassActionsPopup = ({ cls, onClose, onEdit, onDelete, onAddMember }) => {
  const homeroomTeacher = cls.homeroomTeacher
    ? (cls.teachers || []).find(
        (t) =>
          t._id === (cls.homeroomTeacher?._id || cls.homeroomTeacher) ||
          t._id?.toString() === (cls.homeroomTeacher?._id || cls.homeroomTeacher)?.toString()
      )
    : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <MdOutlineClass className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">{cls.name}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {cls.teachers?.length || 0} giáo viên · {cls.students?.length || 0} học sinh
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <FiX size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Homeroom info (if exists) */}
        {homeroomTeacher && (
          <div className="mx-6 mt-4 px-3 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
            <IoSchoolOutline className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-xs text-emerald-700 font-semibold">Giáo viên chủ nhiệm</p>
              <p className="text-xs text-emerald-600">{homeroomTeacher.name}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-4 space-y-2">
          <button
            onClick={() => { onAddMember(cls); onClose(); }}
            className="w-full flex items-center gap-4 px-4 py-3.5 border border-gray-100 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all text-left group"
          >
            <div className="w-9 h-9 bg-indigo-100 group-hover:bg-indigo-200 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
              <FiUserPlus size={16} className="text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Thêm thành viên</p>
              <p className="text-xs text-gray-400 mt-0.5">Thêm giáo viên hoặc học sinh</p>
            </div>
          </button>

          <button
            onClick={() => { onEdit(cls); onClose(); }}
            className="w-full flex items-center gap-4 px-4 py-3.5 border border-gray-100 rounded-xl hover:bg-amber-50 hover:border-amber-200 transition-all text-left group"
          >
            <div className="w-9 h-9 bg-amber-100 group-hover:bg-amber-200 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
              <FiEdit2 size={16} className="text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Đổi tên lớp</p>
              <p className="text-xs text-gray-400 mt-0.5">Chỉnh sửa tên lớp học</p>
            </div>
          </button>

          <button
            onClick={() => { onDelete(cls); onClose(); }}
            className="w-full flex items-center gap-4 px-4 py-3.5 border border-gray-100 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all text-left group"
          >
            <div className="w-9 h-9 bg-red-100 group-hover:bg-red-200 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
              <FiTrash2 size={16} className="text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Xóa lớp học</p>
              <p className="text-xs text-gray-400 mt-0.5">Không thể hoàn tác</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassActionsPopup;
