import { useState, useEffect, useCallback } from 'react';
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
  FiLink,
  FiImage,
  FiExternalLink,
  FiTag,
} from 'react-icons/fi';
import {
  IoDocumentTextOutline,
  IoFolderOutline,
  IoCloudUploadOutline,
} from 'react-icons/io5';
import ShareModal from './ShareModal';
import UploadModal from './UploadModal';

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
  return { Authorization: `Bearer ${token}` };
};

const categories = [
  { id: 'all', name: 'Tất cả', icon: FiFolder },
  { id: 'lesson-plans', name: 'Giáo án', icon: IoDocumentTextOutline },
  { id: 'presentations', name: 'Bài giảng', icon: IoDocumentTextOutline },
  { id: 'worksheets', name: 'Bài tập', icon: IoDocumentTextOutline },
  { id: 'exams', name: 'Đề thi', icon: IoDocumentTextOutline },
  { id: 'references', name: 'Tài liệu tham khảo', icon: IoDocumentTextOutline },
];

const isImageType = (type) => ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(type);

const getFileIcon = (type) => {
  switch (type) {
    case 'docx': case 'doc': return { icon: FiFile, color: 'text-blue-500', bg: 'bg-blue-50' };
    case 'pdf': return { icon: FiFile, color: 'text-red-500', bg: 'bg-red-50' };
    case 'pptx': case 'ppt': return { icon: FiFile, color: 'text-orange-500', bg: 'bg-orange-50' };
    case 'xlsx': case 'xls': return { icon: FiFile, color: 'text-green-500', bg: 'bg-green-50' };
    case 'jpg': case 'jpeg': case 'png': case 'gif': case 'webp':
      return { icon: FiImage, color: 'text-purple-500', bg: 'bg-purple-50' };
    case 'link': return { icon: FiLink, color: 'text-sky-500', bg: 'bg-sky-50' };
    default: return { icon: FiFile, color: 'text-gray-500', bg: 'bg-gray-50' };
  }
};

const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('vi-VN');

const TeacherDocuments = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [statsData, setStatsData] = useState({ total: 0, totalSize: '0 B', totalShared: 0, favorites: 0, categories: {} });
  const [loading, setLoading] = useState(true);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState('references');
  const [uploadName, setUploadName] = useState('');
  const [uploadType, setUploadType] = useState('file');
  const [uploadUrl, setUploadUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareDocId, setShareDocId] = useState(null);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedShareClasses, setSelectedShareClasses] = useState([]);
  const [shareLabel, setShareLabel] = useState('');
  const [sharing, setSharing] = useState(false);

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

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  // ---- Upload ----
  const resetUploadModal = () => {
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadName('');
    setUploadCategory('references');
    setUploadType('file');
    setUploadUrl('');
  };

  const handleUpload = async () => {
    setUploading(true);
    try {
      let res;
      if (uploadType === 'link') {
        if (!uploadUrl || !uploadName) throw new Error('Vui lòng nhập tên và URL');
        res = await fetch(`${API}/documents/link`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ name: uploadName, url: uploadUrl, category: uploadCategory }),
        });
      } else {
        if (!uploadFile) throw new Error('Vui lòng chọn file');
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('category', uploadCategory);
        if (uploadName) formData.append('name', uploadName);
        res = await fetch(`${API}/documents/upload`, {
          method: 'POST',
          headers: getAuthHeadersMultipart(),
          body: formData,
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      resetUploadModal();
      fetchDocuments();
      fetchStats();
    } catch (err) {
      alert('Lỗi tải lên: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (file) => {
    setUploadFile(file);
    if (file) setUploadName(file.name.replace(/\.[^.]+$/, ''));
  };

  // ---- Share ----
  const openShareModal = async (doc) => {
    setShareDocId(doc._id);
    setSelectedShareClasses(doc.sharedClasses || []);
    setShareLabel(doc.label || '');
    setShowShareModal(true);
    try {
      const res = await fetch(`${API}/students/class-view`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setAvailableClasses((data.stats?.classes || []).map((c) => c.name));
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const closeShareModal = () => {
    setShowShareModal(false);
    setShareDocId(null);
    setSelectedShareClasses([]);
    setShareLabel('');
  };

  const handleShare = async () => {
    if (!shareDocId) return;
    setSharing(true);
    try {
      const res = await fetch(`${API}/documents/${shareDocId}/share`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ classNames: selectedShareClasses, label: shareLabel }),
      });
      const data = await res.json();
      if (data.success) {
        closeShareModal();
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

  // ---- Other actions ----
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) return;
    try {
      const res = await fetch(`${API}/documents/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) { fetchDocuments(); fetchStats(); }
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  const toggleFavorite = async (id) => {
    try {
      const res = await fetch(`${API}/documents/${id}/favorite`, { method: 'PATCH', headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setDocuments((prev) => prev.map((d) => (d._id === id ? { ...d, isFavorite: data.document.isFavorite } : d)));
        fetchStats();
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleDownload = async (id) => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API}/documents/${id}/download`, { headers: { Authorization: `Bearer ${token}` } });
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
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading:', err);
    }
  };

  const handleFileSelect = (docId) => {
    setSelectedFiles((prev) => prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]);
  };

  const getCategoryCount = (catId) => catId === 'all' ? statsData.total : (statsData.categories?.[catId] || 0);

  const stats = [
    { label: 'Tổng tài liệu', value: statsData.total, icon: IoDocumentTextOutline, color: 'blue' },
    { label: 'Dung lượng', value: statsData.totalSize, icon: IoCloudUploadOutline, color: 'green' },
    { label: 'Chia sẻ', value: statsData.totalShared, icon: FiShare2, color: 'purple' },
    { label: 'Yêu thích', value: statsData.favorites, icon: FiStar, color: 'yellow' },
  ];

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
              className={`p-3 rounded-xl transition-colors ${viewMode === 'grid' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
            >
              <FiGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 rounded-xl transition-colors ${viewMode === 'list' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
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
                <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-emerald-100' : 'bg-gray-200'}`}>
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
                  isSelected ? 'border-emerald-500 shadow-lg' : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                }`}
              >
                {/* Thumbnail */}
                <div className={`relative h-32 ${isImageType(doc.type) ? '' : fileIcon.bg} rounded-t-xl flex items-center justify-center overflow-hidden`}>
                  {isImageType(doc.type) ? (
                    <img src={`/uploads/${doc.filePath}`} alt={doc.name} className="w-full h-full object-cover rounded-t-xl" />
                  ) : (
                    <Icon className={`w-12 h-12 ${fileIcon.color}`} />
                  )}

                  {/* Actions Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-t-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      {doc.type === 'link' ? (
                        <a href={doc.url} target="_blank" rel="noopener noreferrer"
                          className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors" title="Mở link">
                          <FiExternalLink className="w-4 h-4 text-sky-600" />
                        </a>
                      ) : (
                        <button onClick={() => handleDownload(doc._id)}
                          className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors" title="Tải xuống">
                          <FiDownload className="w-4 h-4 text-gray-700" />
                        </button>
                      )}
                      <button onClick={() => openShareModal(doc)}
                        className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors" title="Chia sẻ / Gán nhãn">
                        <FiShare2 className="w-4 h-4 text-emerald-600" />
                      </button>
                      <button onClick={() => handleDelete(doc._id)}
                        className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors" title="Xóa">
                        <FiTrash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Checkbox */}
                  <div className="absolute top-2 left-2">
                    <input type="checkbox" checked={isSelected} onChange={() => handleFileSelect(doc._id)}
                      className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500" />
                  </div>

                  {/* Favorite */}
                  <button onClick={() => toggleFavorite(doc._id)}
                    className="absolute top-2 right-2 p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors">
                    <FiStar className={`w-4 h-4 ${doc.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                  </button>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 truncate mb-2" title={doc.name}>{doc.name}</h3>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>{doc.formattedSize}</span>
                    <span className="uppercase font-medium">{doc.type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FiClock className="w-3 h-3" />
                    <span>{formatDate(doc.createdAt)}</span>
                  </div>
                  {/* Label badge */}
                  {doc.label && (
                    <div className="flex items-center gap-1 mt-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-full">
                        <FiTag className="w-3 h-3" />
                        {doc.label}
                      </span>
                    </div>
                  )}
                  {doc.sharedClasses?.length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-emerald-600">
                      <FiShare2 className="w-3 h-3" />
                      <span className="truncate" title={doc.sharedClasses.join(', ')}>{doc.sharedClasses.join(', ')}</span>
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
                  <input type="checkbox" className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tên tài liệu</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Loại</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Kích thước</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nhãn</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ngày tạo</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Chia sẻ</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Thao tác</th>
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
                      <input type="checkbox" checked={isSelected} onChange={() => handleFileSelect(doc._id)}
                        className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${fileIcon.bg} rounded-lg flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${fileIcon.color}`} />
                        </div>
                        <p className="font-medium text-gray-800 truncate">{doc.name}</p>
                        {doc.isFavorite && <FiStar className="w-4 h-4 fill-yellow-400 text-yellow-400" />}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded uppercase">{doc.type}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{doc.formattedSize}</td>
                    <td className="px-6 py-4">
                      {doc.label ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-full">
                          <FiTag className="w-3 h-3" />{doc.label}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Chung</span>
                      )}
                    </td>
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
                        {doc.type === 'link' ? (
                          <a href={doc.url} target="_blank" rel="noopener noreferrer"
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Mở link">
                            <FiExternalLink className="w-4 h-4 text-sky-600" />
                          </a>
                        ) : (
                          <button onClick={() => handleDownload(doc._id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Tải xuống">
                            <FiDownload className="w-4 h-4 text-gray-600" />
                          </button>
                        )}
                        <button onClick={() => openShareModal(doc)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Chia sẻ / Gán nhãn">
                          <FiShare2 className="w-4 h-4 text-emerald-600" />
                        </button>
                        <button onClick={() => toggleFavorite(doc._id)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <FiStar className={`w-4 h-4 ${doc.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
                        </button>
                        <button onClick={() => handleDelete(doc._id)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
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
        <ShareModal
          availableClasses={availableClasses}
          selectedShareClasses={selectedShareClasses}
          shareLabel={shareLabel}
          existingLabels={[...new Set(documents.map((d) => d.label).filter(Boolean))]}
          sharing={sharing}
          onToggleClass={(cls) =>
            setSelectedShareClasses((prev) =>
              prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
            )
          }
          onLabelChange={setShareLabel}
          onShare={handleShare}
          onClose={closeShareModal}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          uploadType={uploadType}
          uploadFile={uploadFile}
          uploadName={uploadName}
          uploadCategory={uploadCategory}
          uploadUrl={uploadUrl}
          uploading={uploading}
          dragActive={dragActive}
          onTypeChange={(type) => { setUploadType(type); setUploadFile(null); setUploadName(''); setUploadUrl(''); }}
          onFileChange={handleFileChange}
          onNameChange={setUploadName}
          onCategoryChange={setUploadCategory}
          onUrlChange={setUploadUrl}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]); }}
          onUpload={handleUpload}
          onClose={resetUploadModal}
        />
      )}
    </div>
  );
};

export default TeacherDocuments;
