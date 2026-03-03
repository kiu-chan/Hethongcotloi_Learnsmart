import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IoBookOutline } from 'react-icons/io5';
import { FiMail, FiArrowRight, FiCheckCircle } from 'react-icons/fi';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Có lỗi xảy ra');
      }

      // Nếu có resetToken (chế độ development), tự động chuyển sang trang reset
      if (data.resetToken) {
        navigate(`/reset-password?token=${data.resetToken}`);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Kiểm tra email của bạn</h2>
            <p className="text-gray-600 mb-6">
              Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu tới <strong>{email}</strong>. Vui lòng kiểm tra hộp thư.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
            >
              ← Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
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
          <h2 className="text-2xl font-bold text-gray-800 mt-6">Quên mật khẩu</h2>
          <p className="text-gray-600 mt-2">
            Nhập email của bạn để nhận link đặt lại mật khẩu
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-700"
                  placeholder="Nhập email tài khoản"
                  required
                />
              </div>
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
                  <span>Gửi link đặt lại mật khẩu</span>
                  <FiArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              ← Quay lại đăng nhập
            </Link>
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

export default ForgotPasswordPage;
