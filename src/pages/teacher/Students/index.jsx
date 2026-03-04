import { useState, useEffect, useCallback } from 'react';
import {
  FiSearch,
  FiGrid,
  FiList,
  FiDownload,
  FiAward,
  FiTrendingUp,
  FiLoader,
  FiCalendar,
  FiEdit3,
  FiSave,
} from 'react-icons/fi';
import {
  IoPersonOutline,
  IoSchoolOutline,
  IoCheckmarkCircleOutline,
} from 'react-icons/io5';

import StudentCard from './StudentCard';
import StudentTable from './StudentTable';
import StudentDetailModal from './StudentDetailModal';
import HomeworkTab from './HomeworkTab';

const API_URL = '/api/students';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

const TeacherStudents = () => {
  const [activeTab, setActiveTab] = useState('students'); // 'students' | 'homework'
  const [viewMode, setViewMode] = useState('grid');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [students, setStudents] = useState([]);
  const [statsData, setStatsData] = useState(null);
  const [classes, setClasses] = useState([{ id: 'all', name: 'Tất cả', count: 0 }]);
  const [loading, setLoading] = useState(true);

  const [exportLoading, setExportLoading] = useState(false);

  // Semester settings
  const [semesterStartDate, setSemesterStartDate] = useState('');
  const [editingSemester, setEditingSemester] = useState(false);
  const [semesterInput, setSemesterInput] = useState('');
  const [semesterSaving, setSemesterSaving] = useState(false);

  const fetchClassView = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedClass !== 'all') params.append('className', selectedClass);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`${API_URL}/class-view?${params}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
        setStatsData(data.stats);
        const classItems = [
          { id: 'all', name: 'Tất cả', count: data.stats.total },
          ...(data.stats.classes || []).map((c) => ({ id: c.name, name: c.name, count: c.count })),
        ];
        setClasses(classItems);
      }
    } catch (err) {
      console.error('Error fetching class view:', err);
    }
  }, [selectedClass, selectedStatus, searchQuery]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/settings`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success && data.semesterStartDate) {
        const dateStr = new Date(data.semesterStartDate).toISOString().split('T')[0];
        setSemesterStartDate(dateStr);
        setSemesterInput(dateStr);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  }, []);

  const handleSaveSemester = async () => {
    setSemesterSaving(true);
    try {
      const res = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ semesterStartDate: semesterInput || null }),
      });
      const data = await res.json();
      if (data.success) {
        const dateStr = data.semesterStartDate
          ? new Date(data.semesterStartDate).toISOString().split('T')[0]
          : '';
        setSemesterStartDate(dateStr);
        setSemesterInput(dateStr);
        setEditingSemester(false);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    }
    setSemesterSaving(false);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchClassView(), fetchSettings()]);
      setLoading(false);
    };
    load();
  }, [fetchClassView, fetchSettings]);

  const refreshData = async () => {
    await fetchClassView();
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa học sinh này?')) return;

    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        await refreshData();
        if (showDetailModal) setShowDetailModal(false);
      }
    } catch (err) {
      console.error('Error deleting student:', err);
    }
  };

  const handleViewDetail = (student) => {
    setSelectedStudent(student);
    setShowDetailModal(true);
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedClass !== 'all') params.append('className', selectedClass);

      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `danh_sach_hoc_sinh${selectedClass !== 'all' ? '_' + selectedClass : ''}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Có lỗi khi xuất file. Vui lòng thử lại.');
    }
    setExportLoading(false);
  };

  const stats = [
    {
      label: 'Tổng học sinh',
      value: statsData?.total ?? '-',
      icon: IoPersonOutline,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: 'Học sinh xuất sắc',
      value: statsData?.excellent ?? '-',
      icon: FiAward,
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      label: 'Điểm TB chung',
      value: statsData?.avgScore ?? '-',
      icon: FiTrendingUp,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      label: 'Tỷ lệ đi học',
      value: statsData ? `${statsData.avgAttendance}%` : '-',
      icon: IoCheckmarkCircleOutline,
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
  ];

  // Kiểm tra giáo viên đã được phân công lớp chưa (sau khi load xong)
  const hasNoClasses = !loading && classes.length <= 1 && students.length === 0 && !searchQuery && selectedClass === 'all' && selectedStatus === 'all';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FiLoader className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (hasNoClasses) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Quản lý học sinh</h1>
          <p className="text-gray-600">Theo dõi và quản lý thông tin học sinh</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <IoSchoolOutline className="w-10 h-10 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Chưa được phân công lớp nào</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            Bạn chưa được thêm vào lớp học nào. Vui lòng liên hệ quản trị viên để được phân công lớp.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Quản lý học sinh</h1>
          <p className="text-gray-600">Theo dõi và quản lý thông tin học sinh</p>
        </div>
        {activeTab === 'students' && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={exportLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              {exportLoading ? (
                <FiLoader className="w-4 h-4 animate-spin" />
              ) : (
                <FiDownload className="w-4 h-4" />
              )}
              <span>Tải về Excel</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[{ key: 'students', label: 'Học sinh' }, { key: 'homework', label: 'Bài tập' }].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Homework Tab */}
      {activeTab === 'homework' && <HomeworkTab />}

      {/* Students Tab Content */}
      {activeTab === 'students' && <>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Semester Start Date */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-4">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <FiCalendar className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700">Ngày đầu học kỳ (dùng tính tỷ lệ đi học)</p>
          {editingSemester ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="date"
                value={semesterInput}
                onChange={(e) => setSemesterInput(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSaveSemester}
                disabled={semesterSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {semesterSaving ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiSave className="w-3.5 h-3.5" />}
                Lưu
              </button>
              <button
                onClick={() => { setEditingSemester(false); setSemesterInput(semesterStartDate); }}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm rounded-lg transition-colors"
              >
                Hủy
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-gray-500">
                {semesterStartDate
                  ? new Date(semesterStartDate).toLocaleDateString('vi-VN')
                  : 'Chưa đặt'}
              </span>
              <button
                onClick={() => setEditingSemester(true)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                <FiEdit3 className="w-3 h-3" />
                {semesterStartDate ? 'Sửa' : 'Đặt ngày'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm học sinh theo tên, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang học</option>
            <option value="inactive">Nghỉ học</option>
          </select>

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

        {/* Class Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          {classes.map((classItem) => {
            const isActive = selectedClass === classItem.id;
            return (
              <button
                key={classItem.id}
                onClick={() => setSelectedClass(classItem.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-500'
                    : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
                }`}
              >
                <IoSchoolOutline className="w-4 h-4" />
                <span>{classItem.name}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-emerald-100' : 'bg-gray-200'
                  }`}
                >
                  {classItem.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Students Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {students.map((student) => (
            <StudentCard key={student._id} student={student} onClick={handleViewDetail} />
          ))}
        </div>
      ) : (
        <StudentTable
          students={students}
          onViewDetail={handleViewDetail}
          onDelete={handleDeleteStudent}
        />
      )}

      {/* Empty State */}
      {students.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <IoPersonOutline className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Không tìm thấy học sinh</h3>
          <p className="text-gray-500 mb-6">Thử thay đổi bộ lọc hoặc tìm kiếm</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedClass('all');
              setSelectedStatus('all');
            }}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}

      {/* Student Detail Modal */}
      <StudentDetailModal
        show={showDetailModal}
        student={selectedStudent}
        onClose={() => setShowDetailModal(false)}
        onDelete={handleDeleteStudent}
        onUpdate={refreshData}
        classes={classes}
        semesterStartDate={semesterStartDate}
      />
      </>}

    </div>
  );
};

export default TeacherStudents;
