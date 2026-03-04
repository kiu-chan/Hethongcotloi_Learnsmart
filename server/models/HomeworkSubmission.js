import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  filePath: { type: String, required: true },
  mimeType: { type: String },
  size: { type: Number },
}, { _id: false });

const homeworkSubmissionSchema = new mongoose.Schema(
  {
    homework: { type: mongoose.Schema.Types.ObjectId, ref: 'Homework', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    files: [fileSchema],
    note: { type: String, default: '' },
    status: {
      type: String,
      enum: ['submitted', 'graded'],
      default: 'submitted',
    },
    teacherComment: { type: String, default: '' },
    submittedAt: { type: Date, default: Date.now },
    gradedAt: { type: Date },
  },
  { timestamps: true }
);

homeworkSubmissionSchema.index({ homework: 1, student: 1 }, { unique: true });

export default mongoose.model('HomeworkSubmission', homeworkSubmissionSchema);
