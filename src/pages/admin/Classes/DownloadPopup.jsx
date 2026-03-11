import React from 'react';
import { FiX, FiDownload, FiFileText } from 'react-icons/fi';
import { exportClassesToExcel, downloadTemplate } from './excelHelpers';

const DownloadPopup = ({ onClose, classes }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-lg font-bold text-gray-800">Tải xuống</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <FiX size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-3">
          <button
            onClick={() => { exportClassesToExcel(classes); onClose(); }}
            className="w-full flex items-center gap-4 px-4 py-4 border border-gray-100 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all text-left group"
          >
            <div className="w-10 h-10 bg-indigo-100 group-hover:bg-indigo-200 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
              <FiDownload size={18} className="text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Tải danh sách lớp học</p>
              <p className="text-xs text-gray-400 mt-0.5">Xuất dữ liệu hiện tại ra file .xlsx</p>
            </div>
          </button>

          <button
            onClick={() => { downloadTemplate(); onClose(); }}
            className="w-full flex items-center gap-4 px-4 py-4 border border-gray-100 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all text-left group"
          >
            <div className="w-10 h-10 bg-emerald-100 group-hover:bg-emerald-200 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
              <FiFileText size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Tải file mẫu</p>
              <p className="text-xs text-gray-400 mt-0.5">Mẫu để nhập dữ liệu (.xlsx)</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadPopup;
