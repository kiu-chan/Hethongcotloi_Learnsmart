import { useRef } from 'react';
import { FiFile, FiImage, FiLink, FiX } from 'react-icons/fi';
import { IoCloudUploadOutline } from 'react-icons/io5';

const categoriesList = [
  { id: 'lesson-plans', name: 'Giáo án' },
  { id: 'presentations', name: 'Bài giảng' },
  { id: 'worksheets', name: 'Bài tập' },
  { id: 'exams', name: 'Đề thi' },
  { id: 'references', name: 'Tài liệu tham khảo' },
];

const UploadModal = ({
  uploadType,
  uploadFile,
  uploadName,
  uploadCategory,
  uploadUrl,
  uploading,
  dragActive,
  onTypeChange,
  onFileChange,
  onNameChange,
  onCategoryChange,
  onUrlChange,
  onDragOver,
  onDragLeave,
  onDrop,
  onUpload,
  onClose,
}) => {
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Thêm tài liệu</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <FiX className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Type Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
          {[
            { key: 'file', label: 'Tài liệu', icon: FiFile },
            { key: 'image', label: 'Hình ảnh', icon: FiImage },
            { key: 'link', label: 'Link URL', icon: FiLink },
          ].map(({ key, label, icon: TabIcon }) => (
            <button
              key={key}
              onClick={() => onTypeChange(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                uploadType === key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* File / Image Upload Area */}
        {(uploadType === 'file' || uploadType === 'image') && (
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors mb-6 ${
              dragActive ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-500'
            }`}
          >
            {uploadFile ? (
              <div>
                {uploadType === 'image' ? (
                  <img
                    src={URL.createObjectURL(uploadFile)}
                    alt="preview"
                    className="w-32 h-32 object-cover rounded-xl mx-auto mb-3"
                  />
                ) : (
                  <div className="w-16 h-16 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <FiFile className="w-8 h-8 text-emerald-600" />
                  </div>
                )}
                <p className="text-gray-800 font-medium mb-1">{uploadFile.name}</p>
                <p className="text-sm text-gray-500 mb-3">{(uploadFile.size / 1048576).toFixed(1)} MB</p>
                <button onClick={() => onFileChange(null)} className="text-sm text-red-500 hover:text-red-600">
                  Chọn file khác
                </button>
              </div>
            ) : (
              <>
                <div className="w-20 h-20 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  {uploadType === 'image'
                    ? <FiImage className="w-10 h-10 text-emerald-600" />
                    : <IoCloudUploadOutline className="w-10 h-10 text-emerald-600" />
                  }
                </div>
                <p className="text-gray-700 font-medium mb-2">Kéo thả file vào đây</p>
                <p className="text-sm text-gray-500 mb-4">hoặc</p>
                <button
                  onClick={() => uploadType === 'image' ? imageInputRef.current?.click() : fileInputRef.current?.click()}
                  className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
                >
                  Chọn file từ máy
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".doc,.docx,.pdf,.ppt,.pptx,.xls,.xlsx,.txt"
                  onChange={(e) => e.target.files?.[0] && onFileChange(e.target.files[0])}
                />
                <input
                  ref={imageInputRef}
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={(e) => e.target.files?.[0] && onFileChange(e.target.files[0])}
                />
                <p className="text-xs text-gray-400 mt-4">
                  {uploadType === 'image'
                    ? 'Hỗ trợ: JPG, PNG, GIF, WEBP (Tối đa 50MB)'
                    : 'Hỗ trợ: DOC, DOCX, PDF, PPT, PPTX, XLS, XLSX (Tối đa 50MB)'
                  }
                </p>
              </>
            )}
          </div>
        )}

        {/* Link Input */}
        {uploadType === 'link' && (
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên tài liệu <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={uploadName}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Ví dụ: Tài liệu học tập chương 1"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL tài liệu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiLink className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="url"
                  value={uploadUrl}
                  onChange={(e) => onUrlChange(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Google Drive, YouTube, website tài liệu...</p>
            </div>
          </div>
        )}

        {/* Name (for file/image only) */}
        {(uploadType === 'file' || uploadType === 'image') && uploadFile && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tên tài liệu</label>
            <input
              type="text"
              value={uploadName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Nhập tên tài liệu"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        )}

        {/* Category */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
          <select
            value={uploadCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {categoriesList.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onUpload}
            disabled={uploading || (uploadType === 'link' ? (!uploadUrl || !uploadName) : !uploadFile)}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50"
          >
            {uploading ? 'Đang lưu...' : uploadType === 'link' ? 'Thêm link' : 'Tải lên'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
