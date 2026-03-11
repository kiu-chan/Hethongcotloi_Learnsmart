import React, { useState, useRef } from 'react';
import { FiX, FiLoader, FiUpload, FiFileText, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { API_BASE, getToken } from './constants';
import { downloadTemplate } from './excelHelpers';

const ImportModal = ({ onClose, onImported }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError('');

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const { read, utils } = await import('xlsx');
        const data = new Uint8Array(evt.target.result);
        const wb = read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = utils.sheet_to_json(ws, { defval: '' });
        setPreview(rows.slice(0, 8));
      } catch {
        setError('Không thể đọc file. Vui lòng chọn file Excel (.xlsx).');
        setFile(null);
      }
    };
    reader.readAsArrayBuffer(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_BASE}/classes/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Có lỗi xảy ra');
      setResult(data.stats);
      onImported();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = (r) => {
    if (r === 'teacher') return <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">Giáo viên</span>;
    if (r === 'student') return <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">Học sinh</span>;
    return <span className="text-gray-400 text-xs">{r}</span>;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Nhập lớp học từ Excel</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Phân biệt theo email · Tự tạo tài khoản nếu chưa có (mật khẩu mặc định: <code className="bg-gray-100 px-1 rounded">12345678</code>)
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <FiX size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-800">
            <p className="font-semibold mb-1">Định dạng file Excel:</p>
            <p>Các cột bắt buộc: <strong>Tên lớp</strong> · <strong>Vai trò</strong> (teacher/student) · <strong>Email</strong> · <strong>Họ và tên</strong></p>
            <p className="mt-0.5">Cột tuỳ chọn: <strong>Mật khẩu</strong> (để trống sẽ dùng <code className="bg-indigo-100 px-1 rounded">12345678</code>)</p>
            <button onClick={downloadTemplate} className="mt-2 flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-medium">
              <FiFileText size={14} />
              Tải file mẫu
            </button>
          </div>

          {!result && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all"
            >
              <FiUpload className="mx-auto text-gray-400 mb-3" size={32} />
              {file ? (
                <div>
                  <p className="font-medium text-gray-700">{file.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB · Click để đổi file</p>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-gray-700">Chọn file Excel (.xlsx)</p>
                  <p className="text-sm text-gray-400 mt-1">hoặc kéo thả vào đây</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
            </div>
          )}

          {preview.length > 0 && !result && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Xem trước ({preview.length} dòng đầu):</p>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {Object.keys(preview[0]).map((col) => (
                        <th key={col} className="px-3 py-2 text-left text-xs font-semibold text-gray-600">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0">
                        {Object.entries(row).map(([k, v]) => (
                          <td key={k} className="px-3 py-2 text-gray-700">
                            {k === 'Vai trò' ? roleLabel(v) : String(v)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-green-700 font-semibold">
                <FiCheckCircle size={20} />
                Nhập dữ liệu thành công!
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white rounded-lg p-3 border border-green-100">
                  <p className="text-2xl font-bold text-gray-800">{result.classesCreated}</p>
                  <p className="text-gray-500">Lớp học được tạo mới</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-green-100">
                  <p className="text-2xl font-bold text-gray-800">{result.usersCreated}</p>
                  <p className="text-gray-500">Tài khoản mới được tạo</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-green-100">
                  <p className="text-2xl font-bold text-gray-800">{result.membersAdded}</p>
                  <p className="text-gray-500">Thành viên được thêm vào lớp</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-green-100">
                  <p className="text-2xl font-bold text-gray-800">{result.skipped}</p>
                  <p className="text-gray-500">Bỏ qua (đã tồn tại)</p>
                </div>
              </div>
              {result.errors?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-amber-700 font-medium text-sm mb-1 flex items-center gap-1">
                    <FiAlertCircle size={14} /> {result.errors.length} cảnh báo:
                  </p>
                  <ul className="text-xs text-amber-700 space-y-0.5 max-h-24 overflow-y-auto">
                    {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-2">
              <FiAlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            {result ? 'Đóng' : 'Hủy'}
          </button>
          {!result && (
            <button
              onClick={handleSubmit}
              disabled={!file || loading}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {loading && <FiLoader className="animate-spin" size={16} />}
              {loading ? 'Đang nhập...' : 'Nhập dữ liệu'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
