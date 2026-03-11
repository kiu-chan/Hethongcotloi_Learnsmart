import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Document from '../models/Document.js';
import protect from '../middleware/auth.js';
import authorize from '../middleware/role.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Định dạng file không được hỗ trợ'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const router = express.Router();

router.use(protect, authorize('teacher', 'admin'));

const getFileType = (filename) => {
  const ext = path.extname(filename).toLowerCase().replace('.', '');
  const supported = ['doc', 'docx', 'pdf', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'webp'];
  return supported.includes(ext) ? ext : 'other';
};

// GET /api/documents - Lấy danh sách tài liệu
router.get('/', async (req, res) => {
  try {
    const { category, search, favorite } = req.query;
    const filter = { teacher: req.user._id };
    if (category && category !== 'all') filter.category = category;
    if (favorite === 'true') filter.isFavorite = true;
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const documents = await Document.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, documents });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// GET /api/documents/stats - Thống kê
router.get('/stats', async (req, res) => {
  try {
    const teacherId = req.user._id;

    const [totalResult, favoriteCount, sizeResult, shareResult, categoryResult] = await Promise.all([
      Document.countDocuments({ teacher: teacherId }),
      Document.countDocuments({ teacher: teacherId, isFavorite: true }),
      Document.aggregate([
        { $match: { teacher: teacherId } },
        { $group: { _id: null, totalSize: { $sum: '$size' } } },
      ]),
      Document.countDocuments({ teacher: teacherId, 'sharedClasses.0': { $exists: true } }),
      Document.aggregate([
        { $match: { teacher: teacherId } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
    ]);

    const totalSize = sizeResult[0]?.totalSize || 0;
    const totalShared = shareResult || 0;

    const categoryCounts = {};
    categoryResult.forEach((c) => {
      categoryCounts[c._id] = c.count;
    });

    let formattedSize;
    if (totalSize >= 1073741824) {
      formattedSize = (totalSize / 1073741824).toFixed(1) + ' GB';
    } else if (totalSize >= 1048576) {
      formattedSize = (totalSize / 1048576).toFixed(0) + ' MB';
    } else if (totalSize >= 1024) {
      formattedSize = (totalSize / 1024).toFixed(0) + ' KB';
    } else {
      formattedSize = totalSize + ' B';
    }

    res.json({
      success: true,
      stats: {
        total: totalResult,
        totalSize: formattedSize,
        totalShared,
        favorites: favoriteCount,
        categories: categoryCounts,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// POST /api/documents/upload - Tải lên tài liệu
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng chọn file' });
    }

    const { category, name } = req.body;
    const doc = await Document.create({
      name: name || req.file.originalname.replace(/\.[^.]+$/, ''),
      originalName: req.file.originalname,
      type: getFileType(req.file.originalname),
      category: category || 'references',
      size: req.file.size,
      filePath: req.file.filename,
      teacher: req.user._id,
    });

    res.status(201).json({ success: true, document: doc });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// POST /api/documents/link - Tạo tài liệu dạng link
router.post('/link', async (req, res) => {
  try {
    const { name, url, category } = req.body;
    if (!url) return res.status(400).json({ message: 'Vui lòng nhập URL' });
    if (!name) return res.status(400).json({ message: 'Vui lòng nhập tên tài liệu' });

    const doc = await Document.create({
      name,
      type: 'link',
      url,
      category: category || 'references',
      size: 0,
      filePath: '',
      teacher: req.user._id,
    });
    res.status(201).json({ success: true, document: doc });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// PUT /api/documents/:id - Cập nhật tài liệu
router.put('/:id', async (req, res) => {
  try {
    const doc = await Document.findOneAndUpdate(
      { _id: req.params.id, teacher: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!doc) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }
    res.json({ success: true, document: doc });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// PATCH /api/documents/:id/share - Chia sẻ tài liệu cho lớp học
router.patch('/:id/share', async (req, res) => {
  try {
    const { classNames } = req.body;
    if (!Array.isArray(classNames)) {
      return res.status(400).json({ message: 'classNames phải là mảng' });
    }
    const doc = await Document.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!doc) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }
    doc.sharedClasses = classNames;
    doc.sharedWith = classNames.length;
    await doc.save();
    res.json({ success: true, document: doc });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// PATCH /api/documents/:id/favorite - Toggle yêu thích
router.patch('/:id/favorite', async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!doc) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }
    doc.isFavorite = !doc.isFavorite;
    await doc.save();
    res.json({ success: true, document: doc });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// GET /api/documents/:id/download - Tải xuống
router.get('/:id/download', async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!doc) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }
    const filePath = path.join(uploadDir, doc.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File không tồn tại' });
    }
    res.download(filePath, doc.originalName || doc.name);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// DELETE /api/documents/:id - Xóa tài liệu
router.delete('/:id', async (req, res) => {
  try {
    const doc = await Document.findOneAndDelete({ _id: req.params.id, teacher: req.user._id });
    if (!doc) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }
    // Xóa file vật lý (nếu có)
    if (doc.filePath) {
      const filePath = path.join(uploadDir, doc.filePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res.json({ success: true, message: 'Đã xóa tài liệu' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

export default router;
