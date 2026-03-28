import { useState, useRef, useEffect } from 'react';
import { FiX, FiTag, FiChevronDown } from 'react-icons/fi';

const ShareModal = ({
  availableClasses,
  selectedShareClasses,
  shareLabel,
  existingLabels,
  sharing,
  onToggleClass,
  onLabelChange,
  onShare,
  onClose,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const filtered = existingLabels.filter(
    (l) => l.toLowerCase().includes(shareLabel.toLowerCase()) && l !== shareLabel
  );
  const showDropdown = showSuggestions && (filtered.length > 0 || (shareLabel === '' && existingLabels.length > 0));
  const suggestions = shareLabel === '' ? existingLabels : filtered;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!inputRef.current?.contains(e.target) && !suggestionsRef.current?.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectLabel = (label) => {
    onLabelChange(label);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Chia sẻ tài liệu</h2>
            <p className="text-sm text-gray-500 mt-1">Chọn lớp học và gán nhãn cho tài liệu</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <FiX className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Label input with autocomplete */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="flex items-center gap-1.5">
              <FiTag className="w-4 h-4" />
              Nhãn tài liệu
            </span>
          </label>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={shareLabel}
              onChange={(e) => { onLabelChange(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Ví dụ: Chương 1, Bài tập HK1... (để trống = Chung)"
              className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
            {existingLabels.length > 0 && (
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); setShowSuggestions((v) => !v); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FiChevronDown className={`w-4 h-4 transition-transform ${showSuggestions ? 'rotate-180' : ''}`} />
              </button>
            )}

            {/* Suggestions dropdown */}
            {showDropdown && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
              >
                <div className="max-h-44 overflow-y-auto">
                  {suggestions.map((label) => (
                    <button
                      key={label}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); selectLabel(label); }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-emerald-50 transition-colors ${
                        shareLabel === label ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      <FiTag className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      {label}
                    </button>
                  ))}
                </div>
                {shareLabel && !existingLabels.includes(shareLabel) && (
                  <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400">
                    Nhấn Enter hoặc tiếp tục để tạo nhãn mới: <span className="font-medium text-gray-600">"{shareLabel}"</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Existing label chips */}
          {existingLabels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {existingLabels.slice(0, 6).map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => onLabelChange(shareLabel === label ? '' : label)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    shareLabel === label
                      ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-400'
                      : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                  }`}
                >
                  <FiTag className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-1.5">Học sinh sẽ thấy tài liệu gom nhóm theo nhãn này</p>
        </div>

        {/* Classes */}
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Chia sẻ với lớp</label>
        </div>

        {availableClasses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">Chưa có lớp học nào. Vui lòng liên hệ quản trị viên.</p>
          </div>
        ) : (
          <div className="space-y-2 mb-6 max-h-44 overflow-y-auto">
            {availableClasses.map((cls) => {
              const isChecked = selectedShareClasses.includes(cls);
              return (
                <label
                  key={cls}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all ${
                    isChecked ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleClass(cls)}
                    className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                  />
                  <span className="font-medium text-gray-700">{cls}</span>
                </label>
              );
            })}
          </div>
        )}

        {selectedShareClasses.length > 0 && (
          <p className="text-sm text-emerald-600 mb-4">
            Đã chọn: {selectedShareClasses.join(', ')}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onShare}
            disabled={sharing || availableClasses.length === 0}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50"
          >
            {sharing ? 'Đang chia sẻ...' : selectedShareClasses.length === 0 ? 'Bỏ chia sẻ' : 'Chia sẻ'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
