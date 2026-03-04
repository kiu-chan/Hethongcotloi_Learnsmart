import mongoose from 'mongoose';

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export default mongoose.model('Class', classSchema);
