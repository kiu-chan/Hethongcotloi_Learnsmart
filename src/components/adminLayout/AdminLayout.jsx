import React, { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  FiHome,
  FiUsers,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiSearch,
  FiBell
} from 'react-icons/fi';
import {
  IoStatsChartOutline,
  IoDocumentTextOutline
} from 'react-icons/io5';
import { MdOutlineClass } from 'react-icons/md';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const menuItems = [
    { path: '/admin', icon: FiHome, label: 'Tổng quan', exact: true },
    { path: '/admin/users', icon: FiUsers, label: 'Người dùng' },
    { path: '/admin/classes', icon: MdOutlineClass, label: 'Lớp học' },
    { path: '/admin/exams', icon: IoDocumentTextOutline, label: 'Bài kiểm tra' },
    { path: '/admin/reports', icon: IoStatsChartOutline, label: 'Báo cáo' },
    { path: '/admin/settings', icon: FiSettings, label: 'Cài đặt' }
  ];

  const notifications = [
    { id: 1, type: 'warning', message: '5 người dùng mới chờ phê duyệt', time: '5 phút trước' },
    { id: 2, type: 'info', message: 'Báo cáo tuần đã sẵn sàng', time: '1 giờ trước' },
    { id: 3, type: 'success', message: 'Hệ thống đã được cập nhật', time: '2 giờ trước' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    handleLogout();
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-indigo-600 via-indigo-700 to-indigo-800 text-white transition-transform duration-300 ease-in-out shadow-2xl`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-indigo-500">
            <Link to="/admin" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
              </div>
              <div>
                <span className="text-xl font-bold">Admin Panel</span>
                <p className="text-xs text-indigo-200">Learn Smart</p>
              </div>
            </Link>
            <button
              onClick={toggleSidebar}
              className="md:hidden text-white hover:text-indigo-200"
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6">
            <ul className="space-y-2 px-4">
              {menuItems.map((item) => {
                const active = isActive(item.path, item.exact);
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        active
                          ? 'bg-white text-indigo-600 shadow-lg scale-105'
                          : 'text-indigo-100 hover:bg-indigo-500 hover:text-white'
                      }`}
                    >
                      <item.icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-indigo-500">
            <div className="flex items-center gap-3 mb-3 p-3 bg-indigo-500 bg-opacity-50 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                A
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {currentUser?.name || 'Administrator'}
                </p>
                <p className="text-xs text-indigo-200 truncate">Super Admin</p>
              </div>
            </div>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center justify-center space-x-2 w-full px-4 py-3 text-indigo-100 hover:bg-indigo-500 rounded-xl transition-all duration-200"
            >
              <FiLogOut size={20} />
              <span className="font-medium">Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-center w-14 h-14 bg-red-100 rounded-full mx-auto mb-4">
              <FiLogOut className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 text-center mb-2">Xác nhận đăng xuất</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;