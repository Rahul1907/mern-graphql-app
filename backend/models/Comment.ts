import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  content: string;
  post: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  parentComment?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema: Schema<IComment> = new Schema({
  content: {
    type: String,
    required: true,
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    required: false,
  },
}, {
  timestamps: true
});

export default mongoose.model<IComment>('Comment', CommentSchema);
