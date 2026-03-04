import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  filePath: { type: String, required: true },
  mimeType: { type: String },
  size: { type: Number },
}, { _id: false });

const homeworkSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    attachments: [attachmentSchema],
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignmentType: {
      type: String,
      enum: ['none', 'class', 'student'],
      default: 'none',
    },
    assignedClasses: [{ type: String }],
    assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    deadline: { type: Date },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

homeworkSchema.index({ teacher: 1, status: 1 });

export default mongoose.model('Homework', homeworkSchema);
