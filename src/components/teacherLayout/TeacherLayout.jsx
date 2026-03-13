import React, { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FiHome, 
  FiBook, 
  FiFileText, 
  FiCheckSquare,
  FiUsers,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiBell,
  FiSearch,
  FiMenu,
  FiX,
  FiMessageCircle
} from 'react-icons/fi';
import { 
  IoBookOutline,
  IoDocumentTextOutline,
  IoGameControllerOutline,
  IoCreateOutline,
  IoClipboardOutline,
  IoSparklesOutline
} from 'react-icons/io5';

const TeacherLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const menuItems = [
    { path: '/teacher/dashboard', icon: FiHome, label: 'Trang chủ' },
    { path: '/teacher/notebook', icon: IoBookOutline, label: 'Notebook' },
    { path: '/teacher/documents', icon: IoDocumentTextOutline, label: 'Tài liệu' },
    { path: '/teacher/exams', icon: IoCreateOutline, label: 'Đề thi' },
    { path: '/teacher/games', icon: IoGameControllerOutline, label: 'Trò chơi' },
    { path: '/teacher/chat', icon: FiMessageCircle, label: 'Hỏi AI' },
    { path: '/teacher/students', icon: FiUsers, label: 'Học sinh' },
    { path: '/teacher/statistics', icon: FiBarChart2, label: 'Thống kê' },
    { path: '/teacher/settings', icon: FiSettings, label: 'Cài đặt' }
  ];

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const notifications = [
    { id: 1, title: 'Học sinh nộp bài', message: 'Nguyễn Văn A đã nộp bài tập', time: '5 phút trước', unread: true },
    { id: 2, title: 'Nhắc nhở', message: 'Hạn nộp đề thi học kỳ I', time: '1 giờ trước', unread: true },
    { id: 3, title: 'Cập nhật', message: 'Tính năng mới đã có sẵn', time: '2 giờ trước', unread: false },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">Learn Smart</h1>
                <p className="text-xs text-emerald-600">Giáo viên</p>
              </div>
            </Link>
            <button
              onClick={toggleSidebar}
              className="md:hidden text-gray-600 hover:text-gray-800"
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-4">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                {currentUser?.name?.charAt(0) || 'G'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {currentUser?.name || 'Giáo viên'}
                </p>
                <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
            >
              <FiLogOut size={20} />
              <span className="font-medium">Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
              <FiLogOut className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 text-center mb-2">
              Xác nhận đăng xuất
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6 flex flex-col">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default TeacherLayout;