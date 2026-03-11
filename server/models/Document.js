import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên tài liệu là bắt buộc'],
      trim: true,
    },
    originalName: { type: String },
    type: {
      type: String,
      enum: ['doc', 'docx', 'pdf', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'link', 'other'],
      default: 'other',
    },
    category: {
      type: String,
      enum: ['lesson-plans', 'presentations', 'worksheets', 'exams', 'references'],
      default: 'references',
    },
    size: { type: Number, default: 0 },
    filePath: { type: String, default: '' },
    url: { type: String, default: '' },
    isFavorite: { type: Boolean, default: false },
    sharedWith: { type: Number, default: 0 },
    sharedClasses: { type: [String], default: [] },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

documentSchema.index({ teacher: 1, category: 1 });

documentSchema.virtual('formattedSize').get(function () {
  if (this.size >= 1048576) {
    return (this.size / 1048576).toFixed(1) + ' MB';
  }
  if (this.size >= 1024) {
    return (this.size / 1024).toFixed(0) + ' KB';
  }
  return this.size + ' B';
});

documentSchema.set('toJSON', { virtuals: true });

const Document = mongoose.model('Document', documentSchema);
export default Document;
