import { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash2, FiZap, FiLoader } from 'react-icons/fi';
import OpenAI from 'openai';

const API = '/api';
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
};

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

const CreateGameModal = ({ game, defaultType, onClose, onSaved }) => {
  const isEditing = !!game;
  const [title, setTitle] = useState('');
  const [type, setType] = useState(defaultType || 'flip');
  const [cards, setCards] = useState([{ front: '', back: '' }, { front: '', back: '' }]);
  const [gridSize, setGridSize] = useState(4);
  const [saving, setSaving] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(6);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (game) {
      setTitle(game.title);
      setType(game.type);
      setCards(game.cards?.map((c) => ({ front: c.front, back: c.back })) || []);
      setGridSize(game.gridSize || 4);
    }
  }, [game]);

  const addCard = () => setCards([...cards, { front: '', back: '' }]);

  const removeCard = (index) => {
    if (cards.length <= 2) return;
    setCards(cards.filter((_, i) => i !== index));
  };

  const updateCard = (index, field, value) => {
    const updated = [...cards];
    updated[index] = { ...updated[index], [field]: value };
    setCards(updated);
  };

  const generateWithAI = async () => {
    if (!aiTopic.trim()) return;
    setAiLoading(true);
    setError('');
    try {
      const prompt = type === 'sequence'
        ? `Tạo ${aiCount} bước theo thứ tự về chủ đề "${aiTopic}" cho học sinh.
Mỗi bước gồm tên bước (front) và mô tả ngắn (back). Các bước phải theo đúng thứ tự logic.
QUAN TRỌNG: KHÔNG được đánh số thứ tự trong nội dung (không viết "Bước 1:", "1.", "B1:" hay bất kỳ số thứ tự nào). Chỉ viết nội dung bước.
Trả về JSON array, KHÔNG kèm markdown:
[{"front":"Tên bước...","back":"Mô tả..."}]`
        : `Tạo ${aiCount} cặp thẻ flashcard về chủ đề "${aiTopic}" cho học sinh.
Mỗi cặp gồm mặt trước (front) là câu hỏi/thuật ngữ và mặt sau (back) là đáp án/giải thích ngắn gọn.
Trả về JSON array, KHÔNG kèm markdown:
[{"front":"...","back":"..."}]`;

      const result = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
      });
      const text = result.choices[0].message.content;
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const generated = JSON.parse(cleaned);

      if (Array.isArray(generated) && generated.length > 0) {
        setCards(generated.map((c) => ({ front: c.front || '', back: c.back || '' })));
        if (!title.trim()) setTitle(aiTopic);
      }
    } catch (err) {
      setError('Không thể tạo thẻ bằng AI. Vui lòng thử lại.');
      console.error('AI generate error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) { setError('Vui lòng nhập tiêu đề'); return; }
    const validCards = type === 'sequence'
      ? cards.filter((c) => c.front.trim()).map((c) => ({ front: c.front, back: c.back || '' }))
      : cards.filter((c) => c.front.trim() && c.back.trim());
    if (validCards.length < 2) { setError(type === 'sequence' ? 'Cần ít nhất 2 bước có nội dung' : 'Cần ít nhất 2 cặp thẻ có nội dung'); return; }

    setSaving(true);
    setError('');
    try {
      const url = isEditing
        ? `${API}/student-portal/games/${game._id}`
        : `${API}/student-portal/games`;
      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title, type, cards: validCards, gridSize }),
      });
      const data = await res.json();
      if (data.success) {
        onSaved();
      } else {
        setError(data.message || 'Lỗi lưu trò chơi');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            {isEditing ? 'Chỉnh sửa bộ thẻ' : 'Tạo bộ thẻ mới'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tiêu đề</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Từ vựng Tiếng Anh Unit 1"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Type */}
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Loại trò chơi</label>
              <div className="flex gap-3">
                {[
                  { id: 'flip', label: 'Lật thẻ tìm cặp' },
                  { id: 'memory', label: 'Thẻ nhớ' },
                  { id: 'sequence', label: 'Thứ tự' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setType(t.id)}
                    className={`flex-1 px-4 py-2.5 rounded-xl border-2 font-medium transition-all ${
                      type === t.id
                        ? 'border-purple-500 bg-purple-50 text-purple-600'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Grid size for flip */}
          {type === 'flip' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Kích thước lưới</label>
              <div className="flex gap-2">
                {[2, 4, 6].map((size) => (
                  <button
                    key={size}
                    onClick={() => setGridSize(size)}
                    className={`px-4 py-2 rounded-xl border-2 font-medium transition-all ${
                      gridSize === size
                        ? 'border-purple-500 bg-purple-50 text-purple-600'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {size}x{size}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Cần ít nhất {(gridSize * gridSize) / 2} cặp thẻ cho lưới {gridSize}x{gridSize}
              </p>
            </div>
          )}

          {/* AI Generate */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
            <div className="flex items-center gap-2 text-purple-700 font-medium mb-3">
              <FiZap className="w-4 h-4" />
              Tạo bằng AI
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="Nhập chủ đề, VD: Công thức Hóa học lớp 10"
                className="flex-1 px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
              />
              <input
                type="number"
                min={2}
                max={20}
                value={aiCount}
                onChange={(e) => setAiCount(Number(e.target.value))}
                className="w-16 px-3 py-2 border border-purple-200 rounded-lg text-sm text-center outline-none"
              />
              <button
                onClick={generateWithAI}
                disabled={aiLoading || !aiTopic.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 disabled:opacity-50 transition-colors text-sm whitespace-nowrap"
              >
                {aiLoading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiZap className="w-4 h-4" />}
                Tạo
              </button>
            </div>
          </div>

          {/* Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                {type === 'sequence' ? `Danh sách bước (${cards.length})` : `Danh sách thẻ (${cards.length})`}
              </label>
              <button
                onClick={addCard}
                className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                <FiPlus className="w-4 h-4" />
                Thêm thẻ
              </button>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {cards.map((card, index) => (
                <div key={index} className="flex items-center gap-2 group">
                  <span className="text-xs text-gray-400 w-6 text-right">{index + 1}</span>
                  <input
                    type="text"
                    value={card.front}
                    onChange={(e) => updateCard(index, 'front', e.target.value)}
                    placeholder={type === 'sequence' ? `Bước ${index + 1}` : 'Mặt trước'}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                  />
                  <input
                    type="text"
                    value={card.back}
                    onChange={(e) => updateCard(index, 'back', e.target.value)}
                    placeholder={type === 'sequence' ? 'Mô tả (tùy chọn)' : 'Mặt sau'}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                  />
                  <button
                    onClick={() => removeCard(index)}
                    disabled={cards.length <= 2}
                    className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-purple-500 text-white rounded-xl hover:bg-purple-600 disabled:opacity-50 font-medium transition-colors"
          >
            {saving ? 'Đang lưu...' : isEditing ? 'Cập nhật' : 'Tạo bộ thẻ'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGameModal;
