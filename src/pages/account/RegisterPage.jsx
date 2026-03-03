import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { IoBookOutline } from 'react-icons/io5';
import { FiMail, FiLock, FiUser, FiArrowRight } from 'react-icons/fi';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const Register = () => {
  const navigate = useNavigate();
  const { register, googleLogin } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleGoogleResponse = useCallback(async (response) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await googleLogin(response.credential);
      if (result.success) {
        navigateByRole(result.user.role);
      }
    } catch (err) {
      setError(err.message || 'Đăng ký Google thất bại');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById('google-register-btn'),
        { theme: 'outline', size: 'large', width: '100%', text: 'signup_with', locale: 'vi' }
      );
    };
    document.body.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) existingScript.remove();
    };
  }, [handleGoogleResponse]);

  const navigateByRole = (role) => {
    switch (role) {
      case 'admin':
        navigate('/admin', { replace: true });
        break;
      case 'teacher':
        navigate('/teacher/dashboard', { replace: true });
        break;
      case 'student':
        navigate('/student/dashboard', { replace: true });
        break;
      default:
        navigate('/', { replace: true });
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      setIsLoading(false);
      return;
    }

    if (!agreedToTerms) {
      setError('Vui lòng đồng ý với điều khoản sử dụng');
      setIsLoading(false);
      return;
    }

    try {
      const result = await register(formData);

      if (result.success) {
        navigate('/student/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center shadow-lg">
              <IoBookOutline className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-800">Learn Smart</h1>
              <p className="text-xs text-gray-500 -mt-1">Học tập thông minh</p>
            </div>
          </Link>
          <h2 className="text-2xl font-bold text-gray-800 mt-6">Tạo tài khoản</h2>
          <p className="text-gray-600 mt-2">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Đăng nhập ngay
            </Link>
          </p>
        </div>

        {/* Register Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Họ và tên
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiUser className="text-gray-400 w-5 h-5" />
                </div>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-700"
                  placeholder="Nhập họ và tên"
                  required
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiMail className="text-gray-400 w-5 h-5" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-700"
                  placeholder="example@email.com"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400 w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-700"
                  placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400 w-5 h-5" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-700"
                  placeholder="Nhập lại mật khẩu"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 mt-1"
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                Tôi đồng ý với{' '}
                <Link to="/terms" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  Điều khoản sử dụng
                </Link>
                {' '}và{' '}
                <Link to="/privacy" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  Chính sách bảo mật
                </Link>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span>Đăng ký</span>
                  <FiArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">hoặc đăng ký với</span>
            </div>
          </div>

          {/* Google Register */}
          <div className="flex justify-center">
            <div id="google-register-btn"></div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-gray-600 hover:text-emerald-600 font-medium text-sm transition-colors inline-flex items-center gap-1"
          >
            ← Quay về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
