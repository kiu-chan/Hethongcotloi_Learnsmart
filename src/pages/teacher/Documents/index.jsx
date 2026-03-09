import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FiFile,
  FiFolder,
  FiSearch,
  FiTrash2,
  FiDownload,
  FiShare2,
  FiPlus,
  FiGrid,
  FiList,
  FiClock,
  FiStar,
  FiX
} from 'react-icons/fi';
import {
  IoDocumentTextOutline,
  IoFolderOutline,
  IoCloudUploadOutline,
} from 'react-icons/io5';

const API = '/api';
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

const getAuthHeadersMultipart = () => {
  const token = localStorage.getItem('authToken');
  return {
    Authorization: `Bearer ${token}`,
  };
};

const TeacherDocuments = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [documents, setDocuments] = useState([]);
  const [statsData, setStatsData] = useState({
    total: 0,
    totalSize: '0 B',
    totalShared: 0,
    favorites: 0,
    categories: {},
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState('references');
  const [uploadName, setUploadName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareDocId, setShareDocId] = useState(null);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedShareClasses, setSelectedShareClasses] = useState([]);
  const [sharing, setSharing] = useState(false);

  const categoriesList = [
    { id: 'lesson-plans', name: 'Giáo án' },
    { id: 'presentations', name: 'Bài giảng' },
    { id: 'worksheets', name: 'Bài tập' },
    { id: 'exams', name: 'Đề thi' },
    { id: 'references', name: 'Tài liệu tham khảo' },
  ];

  const categories = [
    { id: 'all', name: 'Tất cả', icon: FiFolder, color: 'gray' },
    { id: 'lesson-plans', name: 'Giáo án', icon: IoDocumentTextOutline, color: 'blue' },
    { id: 'presentations', name: 'Bài giảng', icon: IoDocumentTextOutline, color: 'green' },
    { id: 'worksheets', name: 'Bài tập', icon: IoDocumentTextOutline, color: 'purple' },
    { id: 'exams', name: 'Đề thi', icon: IoDocumentTextOutline, color: 'orange' },
    { id: 'references', name: 'Tài liệu tham khảo', icon: IoDocumentTextOutline, color: 'pink' },
  ];

  const fetchDocuments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`${API}/documents?${params}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setDocuments(data.documents);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API}/documents/stats`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setStatsData(data.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('category', uploadCategory);
      if (uploadName) formData.append('name', uploadName);

      const res = await fetch(`${API}/documents/upload`, {
        method: 'POST',
        headers: getAuthHeadersMultipart(),
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadName('');
      setUploadCategory('references');
      fetchDocuments();
      fetchStats();
    } catch (err) {
      alert('Lỗi tải lên: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) return;
    try {
      const res = await fetch(`${API}/documents/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        fetchDocuments();
        fetchStats();
      }
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  const toggleFavorite = async (id) => {
    try {
      const res = await fetch(`${API}/documents/${id}/favorite`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setDocuments((prev) =>
          prev.map((d) => (d._id === id ? { ...d, isFavorite: data.document.isFavorite } : d))
        );
        fetchStats();
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleDownload = async (id) => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API}/documents/${id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const contentDisposition = res.headers.get('Content-Disposition');
      let filename = 'download';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/);
        if (match) filename = match[1];
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading:', err);
    }
  };

  const handleFileSelect = (docId) => {
    setSelectedFiles((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const openShareModal = async (doc) => {
    setShareDocId(doc._id);
    // Pre-select existing shared classes if available
    setSelectedShareClasses(doc.sharedClasses || []);
    setShowShareModal(true);
    // Fetch available classes
    try {
      const res = await fetch(`${API}/students/class-view`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        const classNames = (data.stats?.classes || []).map((c) => c.name);
        setAvailableClasses(classNames);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const handleShare = async () => {
    if (!shareDocId) return;
    setSharing(true);
    try {
      const res = await fetch(`${API}/documents/${shareDocId}/share`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ classNames: selectedShareClasses }),
      });
      const data = await res.json();
      if (data.success) {
        setShowShareModal(false);
        setShareDocId(null);
        setSelectedShareClasses([]);
        fetchDocuments();
        fetchStats();
      } else {
        alert(data.message || 'Lỗi chia sẻ tài liệu');
      }
    } catch (err) {
      alert('Lỗi chia sẻ: ' + err.message);
    } finally {
      setSharing(false);
    }
  };

  const toggleShareClass = (className) => {
    setSelectedShareClasses((prev) =>
      prev.includes(className) ? prev.filter((c) => c !== className) : [...prev, className]
    );
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadFile(e.dataTransfer.files[0]);
      setUploadName(e.dataTransfer.files[0].name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
      setUploadName(e.target.files[0].name.replace(/\.[^.]+$/, ''));
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN');
  };

  const stats = [
    { label: 'Tổng tài liệu', value: statsData.total, icon: IoDocumentTextOutline, color: 'blue' },
    { label: 'Dung lượng', value: statsData.totalSize, icon: IoCloudUploadOutline, color: 'green' },
    { label: 'Chia sẻ', value: statsData.totalShared, icon: FiShare2, color: 'purple' },
    { label: 'Yêu thích', value: statsData.favorites, icon: FiStar, color: 'yellow' },
  ];

  const getCategoryCount = (catId) => {
    if (catId === 'all') return statsData.total;
    return statsData.categories?.[catId] || 0;
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'docx':
      case 'doc':
        return { icon: FiFile, color: 'text-blue-500', bg: 'bg-blue-50' };
      case 'pdf':
        return { icon: FiFile, color: 'text-red-500', bg: 'bg-red-50' };
      case 'pptx':
      case 'ppt':
        return { icon: FiFile, color: 'text-orange-500', bg: 'bg-orange-50' };
      case 'xlsx':
      case 'xls':
        return { icon: FiFile, color: 'text-green-500', bg: 'bg-green-50' };
      default:
        return { icon: FiFile, color: 'text-gray-500', bg: 'bg-gray-50' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Tài liệu của tôi</h1>
          <p className="text-gray-600">Quản lý và chia sẻ tài liệu giảng dạy</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25"
        >
          <FiPlus className="w-5 h-5" />
          <span>Tải lên</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 bg-${stat.color}-50 rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm tài liệu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 rounded-xl transition-colors ${
                viewMode === 'grid'
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FiGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 rounded-xl transition-colors ${
                viewMode === 'list'
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FiList className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mt-4">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-500'
                    : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{category.name}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-emerald-100' : 'bg-gray-200'
                  }`}
                >
                  {getCategoryCount(category.id)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Documents Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {documents.map((doc) => {
            const fileIcon = getFileIcon(doc.type);
            const Icon = fileIcon.icon;
            const isSelected = selectedFiles.includes(doc._id);

            return (
              <div
                key={doc._id}
                className={`bg-white rounded-xl border-2 transition-all cursor-pointer group ${
                  isSelected
                    ? 'border-emerald-500 shadow-lg'
                    : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                }`}
              >
                {/* Thumbnail */}
                <div className={`relative h-32 ${fileIcon.bg} rounded-t-xl flex items-center justify-center`}>
                  <Icon className={`w-12 h-12 ${fileIcon.color}`} />

                  {/* Actions Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-t-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownload(doc._id)}
                        className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                        title="Tải xuống"
                      >
                        <FiDownload className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        onClick={() => openShareModal(doc)}
                        className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                        title="Chia sẻ cho lớp"
                      >
                        <FiShare2 className="w-4 h-4 text-emerald-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc._id)}
                        className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                        title="Xóa"
                      >
                        <FiTrash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Checkbox */}
                  <div className="absolute top-2 left-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleFileSelect(doc._id)}
                      className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Favorite */}
                  <button
                    onClick={() => toggleFavorite(doc._id)}
                    className="absolute top-2 right-2 p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <FiStar
                      className={`w-4 h-4 ${
                        doc.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
                      }`}
                    />
                  </button>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 truncate mb-2" title={doc.name}>
                    {doc.name}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>{doc.formattedSize}</span>
                    <span className="uppercase font-medium">{doc.type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FiClock className="w-3 h-3" />
                    <span>{formatDate(doc.createdAt)}</span>
                  </div>
                  {doc.sharedClasses?.length > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600">
                      <FiShare2 className="w-3 h-3" />
                      <span className="truncate" title={doc.sharedClasses.join(', ')}>
                        {doc.sharedClasses.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Tên tài liệu
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Kích thước
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Chia sẻ
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documents.map((doc) => {
                const fileIcon = getFileIcon(doc.type);
                const Icon = fileIcon.icon;
                const isSelected = selectedFiles.includes(doc._id);

                return (
                  <tr key={doc._id} className={`hover:bg-gray-50 ${isSelected ? 'bg-emerald-50' : ''}`}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleFileSelect(doc._id)}
                        className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${fileIcon.bg} rounded-lg flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${fileIcon.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{doc.name}</p>
                        </div>
                        {doc.isFavorite && (
                          <FiStar className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded uppercase">
                        {doc.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{doc.formattedSize}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(doc.createdAt)}</td>
                    <td className="px-6 py-4">
                      {doc.sharedClasses?.length > 0 ? (
                        <span className="text-sm text-emerald-600" title={doc.sharedClasses.join(', ')}>
                          {doc.sharedClasses.join(', ')}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Chưa chia sẻ</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownload(doc._id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Tải xuống"
                        >
                          <FiDownload className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => openShareModal(doc)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Chia sẻ cho lớp"
                        >
                          <FiShare2 className="w-4 h-4 text-emerald-600" />
                        </button>
                        <button
                          onClick={() => toggleFavorite(doc._id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <FiStar
                            className={`w-4 h-4 ${
                              doc.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'
                            }`}
                          />
                        </button>
                        <button
                          onClick={() => handleDelete(doc._id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {documents.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <IoFolderOutline className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Không tìm thấy tài liệu</h3>
          <p className="text-gray-500 mb-6">Thử thay đổi bộ lọc hoặc tải lên tài liệu mới</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all"
          >
            Tải lên tài liệu
          </button>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Chia sẻ tài liệu</h2>
                <p className="text-sm text-gray-500 mt-1">Chọn lớp học để chia sẻ tài liệu này</p>
              </div>
              <button
                onClick={() => { setShowShareModal(false); setShareDocId(null); setSelectedShareClasses([]); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {availableClasses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Chưa có lớp học nào. Vui lòng liên hệ quản trị viên.</p>
              </div>
            ) : (
              <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
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
                        onChange={() => toggleShareClass(cls)}
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
                onClick={() => { setShowShareModal(false); setShareDocId(null); setSelectedShareClasses([]); }}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleShare}
                disabled={sharing || availableClasses.length === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50"
              >
                {sharing ? 'Đang chia sẻ...' : selectedShareClasses.length === 0 ? 'Bỏ chia sẻ' : 'Chia sẻ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Tải tài liệu lên</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                  setUploadName('');
                  setUploadCategory('references');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Upload Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors mb-6 ${
                dragActive
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-300 hover:border-emerald-500'
              }`}
            >
              {uploadFile ? (
                <div>
                  <div className="w-16 h-16 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <FiFile className="w-8 h-8 text-emerald-600" />
                  </div>
                  <p className="text-gray-800 font-medium mb-1">{uploadFile.name}</p>
                  <p className="text-sm text-gray-500 mb-3">
                    {(uploadFile.size / 1048576).toFixed(1)} MB
                  </p>
                  <button
                    onClick={() => setUploadFile(null)}
                    className="text-sm text-red-500 hover:text-red-600"
                  >
                    Chọn file khác
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-20 h-20 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <IoCloudUploadOutline className="w-10 h-10 text-emerald-600" />
                  </div>
                  <p className="text-gray-700 font-medium mb-2">Kéo thả file vào đây</p>
                  <p className="text-sm text-gray-500 mb-4">hoặc</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
                  >
                    Chọn file từ máy
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".doc,.docx,.pdf,.ppt,.pptx,.xls,.xlsx,.txt"
                    onChange={handleFileInputChange}
                  />
                  <p className="text-xs text-gray-400 mt-4">
                    Hỗ trợ: DOC, DOCX, PDF, PPT, PPTX, XLS, XLSX (Tối đa 50MB)
                  </p>
                </>
              )}
            </div>

            {/* Name */}
            {uploadFile && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên tài liệu
                </label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="Nhập tên tài liệu"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            {/* Category Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {categoriesList.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                  setUploadName('');
                  setUploadCategory('references');
                }}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleUpload}
                disabled={!uploadFile || uploading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50"
              >
                {uploading ? 'Đang tải lên...' : 'Tải lên'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDocuments;
