import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answers: [{ type: String, required: true }],
  correct: { type: Number, required: true },
});

const gameSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['quiz', 'wheel'],
      required: [true, 'Loại trò chơi là bắt buộc'],
    },
    title: {
      type: String,
      required: [true, 'Tiêu đề là bắt buộc'],
      trim: true,
    },
    // Quiz fields
    subject: { type: String },
    duration: { type: Number, default: 10 },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    questions: [questionSchema],

    // Wheel fields
    items: [{ type: String }],
    wheelQuestions: [{ type: String }],
    wheelMCQs: [questionSchema],
    color: {
      type: String,
      enum: ['blue', 'green', 'purple', 'red', 'orange'],
      default: 'blue',
    },

    // Shared stats
    plays: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    lastPlayed: { type: Date },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

gameSchema.index({ teacher: 1, type: 1 });

gameSchema.virtual('avgScore').get(function () {
  if (this.plays === 0) return 0;
  return Math.round((this.totalScore / this.plays) * 10) / 10;
});

gameSchema.set('toJSON', { virtuals: true });

const Game = mongoose.model('Game', gameSchema);
export default Game;
