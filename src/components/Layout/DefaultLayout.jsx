import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  FiMenu,
  FiX,
  FiSearch,
  FiHome,
  FiInfo,
  FiMail,
  FiLogIn,
  FiLogOut,
  FiUser,
  FiHelpCircle,
  FiFileText,
  FiGrid
} from 'react-icons/fi';
import {
  IoBookOutline,
  IoSparklesOutline,
  IoPricetagsOutline
} from 'react-icons/io5';

// Đổi menuItems thành các mục cho landing page
const menuItems = [
  { name: 'Trang chủ', icon: FiHome, path: '/' },
  { name: 'Giới thiệu', icon: FiInfo, path: '/about' },
  { name: 'Tính năng', icon: IoSparklesOutline, path: '/features' },
  { name: 'Hướng dẫn', icon: FiHelpCircle, path: '/guide' },
  { name: 'Liên hệ', icon: FiMail, path: '/contact' },
];

function DefaultLayout({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const isLoggedIn = !!currentUser;
  const dashboardPath = currentUser?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      await logout();
      setShowLogoutConfirm(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white shadow-md' : 'bg-white/95'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center shadow-lg">
                <IoBookOutline className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Learn Smart</h1>
                <p className="text-[10px] text-gray-500 -mt-1">Học tập thông minh, phát triển toàn diện</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Auth Buttons */}
            <div className="hidden lg:flex items-center gap-2">
              {isLoggedIn ? (
                <>
                  <Link
                    to={dashboardPath}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <FiGrid className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                    <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {currentUser?.name?.charAt(0) || 'U'}
                    </div>
                    <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
                      {currentUser?.name || 'User'}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <FiLogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <FiLogIn className="w-4 h-4" />
                    <span>Đăng nhập</span>
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-full text-sm font-medium text-white transition-colors shadow-md"
                  >
                    <FiUser className="w-4 h-4" />
                    <span>Đăng ký</span>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 shadow-lg">
            <div className="px-4 py-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
              
              <div className="pt-3 border-t border-gray-100">
                {isLoggedIn ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                        {currentUser?.name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {currentUser?.name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        to={dashboardPath}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
                      >
                        <FiGrid className="w-5 h-5" />
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <FiLogOut className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Link
                      to="/login"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      <FiLogIn className="w-5 h-5" />
                      Đăng nhập
                    </Link>
                    <Link
                      to="/register"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
                    >
                      <FiUser className="w-5 h-5" />
                      Đăng ký
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="pt-16">
        {children}
      </main>

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

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center">
                  <IoBookOutline className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">Learn Smart</span>
              </Link>
              <p className="text-sm text-gray-400 mb-4">
                Nền tảng học tập thông minh với AI hỗ trợ giáo viên và học sinh. 
                Tiết kiệm thời gian, nâng cao chất lượng giảng dạy.
              </p>
            </div>
            
            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-white mb-4">Về chúng tôi</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="hover:text-emerald-400 transition-colors">Giới thiệu</Link></li>
                <li><Link to="/features" className="hover:text-emerald-400 transition-colors">Tính năng</Link></li>
                <li><Link to="/guide" className="hover:text-emerald-400 transition-colors">Hướng dẫn</Link></li>
              </ul>
            </div>
            
            {/* Support */}
            <div>
              <h3 className="font-semibold text-white mb-4">Hỗ trợ</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/contact" className="hover:text-emerald-400 transition-colors">Liên hệ</Link></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Câu hỏi thường gặp</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Điều khoản sử dụng</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Chính sách bảo mật</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © 2025 Learn Smart. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default DefaultLayout;