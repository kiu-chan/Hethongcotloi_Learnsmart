import { useState, useRef } from 'react';
import { FiX, FiUpload, FiFileText, FiCheck, FiAlertCircle, FiDownload, FiChevronDown } from 'react-icons/fi';
import { parseExamFromExcel, parseExamFromWord, downloadExcelSample, downloadWordSample } from './examExcel';

const API = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

const ImportExamModal = ({ onClose, onImported }) => {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [showSampleMenu, setShowSampleMenu] = useState(false);

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const isExcel = selectedFile.name.match(/\.xlsx?$/i);
    const isWord = selectedFile.name.match(/\.docx$/i);

    if (!isExcel && !isWord) {
      setError('Vui lòng chọn file Excel (.xlsx) hoặc Word (.docx)');
      return;
    }

    setFile(selectedFile);
    setError('');
    setParsing(true);

    try {
      const data = isExcel
        ? await parseExamFromExcel(selectedFile)
        : await parseExamFromWord(selectedFile);
      setParsedData(data);
    } catch (err) {
      setError(err.message);
      setParsedData(null);
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (!parsedData) return;

    setImporting(true);
    setError('');

    try {
      const res = await fetch(`${API}/exams`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: parsedData.info.title,
          subject: parsedData.info.subject,
          subjectId: parsedData.info.subjectId,
          type: parsedData.info.type,
          difficulty: parsedData.info.difficulty,
          duration: parsedData.info.duration,
          topics: parsedData.info.topics,
          questions: parsedData.questions,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onImported();
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const fakeEvent = { target: { files: [droppedFile] } };
      handleFileSelect(fakeEvent);
    }
  };

  const handleDownloadExcel = () => {
    downloadExcelSample();
    setShowSampleMenu(false);
  };

  const handleDownloadWord = async () => {
    await downloadWordSample();
    setShowSampleMenu(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowSampleMenu(false)}>
      <div className="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Tải đề thi lên</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <FiX className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Sample Download Button */}
        <div className="mb-5 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-medium text-blue-800">Chưa có file mẫu?</p>
            <p className="text-xs text-blue-600">Tải file mẫu về, điền thông tin và tải lên</p>
          </div>
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowSampleMenu((v) => !v); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <FiDownload className="w-4 h-4" />
              Tải file mẫu
              <FiChevronDown className="w-4 h-4" />
            </button>
            {showSampleMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-10 overflow-hidden">
                <button
                  onClick={handleDownloadExcel}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-green-600 font-bold text-xs bg-green-100 px-1.5 py-0.5 rounded">XLS</span>
                  File mẫu Excel (.xlsx)
                </button>
                <button
                  onClick={handleDownloadWord}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-blue-600 font-bold text-xs bg-blue-100 px-1.5 py-0.5 rounded">DOC</span>
                  File mẫu Word (.docx)
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
            <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Upload Area */}
        {!parsedData && (
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-emerald-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".xlsx,.xls,.docx"
              className="hidden"
            />

            {parsing ? (
              <div>
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-600">Đang đọc file...</p>
              </div>
            ) : (
              <>
                <FiUpload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-700 font-medium mb-1">
                  {file ? file.name : 'Kéo thả hoặc nhấn để chọn file'}
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">.xlsx</span>
                  <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">.docx</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Hỗ trợ file Excel và Word — Dùng file mẫu để đảm bảo định dạng đúng
                </p>
              </>
            )}
          </div>
        )}

        {/* Preview */}
        {parsedData && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <FiCheck className="w-5 h-5" />
                <span className="font-semibold">Đọc file thành công</span>
              </div>
              <p className="text-sm text-green-600">{file?.name}</p>
            </div>

            {/* Info Preview */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <h3 className="font-semibold text-gray-800 mb-3">Thông tin đề thi</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Tên đề:</span>
                  <span className="ml-2 font-medium text-gray-800">{parsedData.info.title || '(Trống)'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Môn học:</span>
                  <span className="ml-2 font-medium text-gray-800">{parsedData.info.subject || '(Trống)'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Loại đề:</span>
                  <span className="ml-2 font-medium text-gray-800">
                    {{ 'multiple-choice': 'Trắc nghiệm', essay: 'Tự luận', mixed: 'Hỗn hợp' }[parsedData.info.type]}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Độ khó:</span>
                  <span className="ml-2 font-medium text-gray-800">
                    {{ easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' }[parsedData.info.difficulty]}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Thời gian:</span>
                  <span className="ml-2 font-medium text-gray-800">{parsedData.info.duration} phút</span>
                </div>
                <div>
                  <span className="text-gray-500">Số câu hỏi:</span>
                  <span className="ml-2 font-medium text-gray-800">{parsedData.questions.length}</span>
                </div>
              </div>
            </div>

            {/* Questions Preview */}
            {parsedData.questions.length > 0 && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Xem trước câu hỏi ({parsedData.questions.length})
                </h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {parsedData.questions.slice(0, 5).map((q, i) => (
                    <div key={i} className="p-3 bg-white rounded-lg border border-gray-200 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-700 rounded flex items-center justify-center text-xs font-semibold">
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-gray-800">{q.question}</p>
                          {q.type === 'multiple-choice' && q.answers && (
                            <div className="mt-1 space-y-1">
                              {q.answers.map((a, ai) => (
                                <span
                                  key={ai}
                                  className={`inline-block mr-3 text-xs ${
                                    ai === q.correct ? 'text-green-700 font-medium' : 'text-gray-500'
                                  }`}
                                >
                                  {String.fromCharCode(65 + ai)}. {a}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {parsedData.questions.length > 5 && (
                    <p className="text-center text-sm text-gray-500">
                      ... và {parsedData.questions.length - 5} câu hỏi khác
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setParsedData(null);
                  setFile(null);
                  setError('');
                }}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors"
              >
                Chọn file khác
              </button>
              <button
                onClick={handleImport}
                disabled={importing || !parsedData.info.title || !parsedData.info.subject}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50"
              >
                {importing ? 'Đang nhập...' : 'Nhập đề thi'}
              </button>
            </div>

            {(!parsedData.info.title || !parsedData.info.subject) && (
              <p className="text-sm text-orange-600 text-center">
                File thiếu thông tin bắt buộc (Tên đề thi, Môn học). Vui lòng kiểm tra lại file.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportExamModal;
