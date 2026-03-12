import { useState } from 'react';
import { FiMoreVertical } from 'react-icons/fi';
import { MdOutlineClass } from 'react-icons/md';
import ClassActionsPopup from './ClassActionsPopup';

const ClassCard = ({ cls, onEdit, onDelete, onAddMember, onRemoveMember, onSetHomeroom }) => {
  const [showActions, setShowActions] = useState(false);

  const homeroomId = cls.homeroomTeacher?._id || cls.homeroomTeacher;
  const homeroomTeacher = cls.teachers?.find(
    (t) => t._id === homeroomId || t._id?.toString() === homeroomId?.toString()
  );

  return (
    <>
      <div
        className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setShowActions(true)}
      >
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <MdOutlineClass className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-800 truncate">{cls.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {cls.teachers?.length || 0} giáo viên · {cls.students?.length || 0} học sinh
              </p>
              {homeroomTeacher && (
                <p className="text-xs text-emerald-600 mt-0.5 font-medium truncate">
                  CN: {homeroomTeacher.name}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setShowActions(true); }}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex-shrink-0"
            title="Thao tác"
          >
            <FiMoreVertical size={16} />
          </button>
        </div>
      </div>

      {showActions && (
        <ClassActionsPopup
          cls={cls}
          onClose={() => setShowActions(false)}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddMember={onAddMember}
          onRemoveMember={onRemoveMember}
          onSetHomeroom={onSetHomeroom}
        />
      )}
    </>
  );
};

export default ClassCard;
