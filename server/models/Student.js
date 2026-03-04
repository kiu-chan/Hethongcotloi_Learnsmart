import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Họ tên là bắt buộc'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: ['Nam', 'Nữ'],
    },
    dateOfBirth: {
      type: String,
    },
    className: {
      type: [String],
      required: [true, 'Lớp là bắt buộc'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Phải có ít nhất một lớp',
      },
    },
    address: {
      type: String,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    attendance: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    assignmentsCompleted: {
      type: Number,
      default: 0,
    },
    assignmentsTotal: {
      type: Number,
      default: 0,
    },
    parentName: {
      type: String,
    },
    parentPhone: {
      type: String,
    },
    notes: {
      type: String,
    },
    absentDates: {
      type: [Date],
      default: [],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

studentSchema.index({ teacher: 1, className: 1 });

const Student = mongoose.model('Student', studentSchema);
export default Student;
