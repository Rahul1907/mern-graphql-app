import DataLoader from 'dataloader';
import User, { IUser } from '../models/User';
import Post, { IPost } from '../models/Post';
import Comment, { IComment } from '../models/Comment';

export interface DataLoaders {
  userLoader: DataLoader<string, IUser | null>;
  userPostsLoader: DataLoader<string, IPost[]>;
  postCommentsLoader: DataLoader<string, IComment[]>;
  commentRepliesLoader: DataLoader<string, IComment[]>;
}

export const createLoaders = (): DataLoaders => {
  return {
    // Batch loader for single User lookups by User ID
    userLoader: new DataLoader<string, IUser | null>(async (keys: readonly string[]) => {
      const users = await User.find({ _id: { $in: keys } });
      const userMap = new Map<string, IUser>();
      users.forEach(user => userMap.set(user.id, user));
      return keys.map(key => userMap.get(key) || null);
    }),

    // Batch loader for Posts list grouped by Author User ID
    userPostsLoader: new DataLoader<string, IPost[]>(async (keys: readonly string[]) => {
      const posts = await Post.find({ author: { $in: keys } });
      const postsMap = new Map<string, IPost[]>();
      posts.forEach(post => {
        const authorId = post.author.toString();
        if (!postsMap.has(authorId)) {
          postsMap.set(authorId, []);
        }
        postsMap.get(authorId)!.push(post);
      });
      return keys.map(key => postsMap.get(key) || []);
    }),

    // Batch loader for top-level Comments grouped by Post ID
    postCommentsLoader: new DataLoader<string, IComment[]>(async (keys: readonly string[]) => {
      const comments = await Comment.find({
        post: { $in: keys },
        parentComment: { $exists: false },
      }).sort({ createdAt: 1 });

      const commentsMap = new Map<string, IComment[]>();
      comments.forEach(comment => {
        const postId = comment.post.toString();
        if (!commentsMap.has(postId)) {
          commentsMap.set(postId, []);
        }
        commentsMap.get(postId)!.push(comment);
      });
      return keys.map(key => commentsMap.get(key) || []);
    }),

    // Batch loader for reply Comments grouped by Parent Comment ID
    commentRepliesLoader: new DataLoader<string, IComment[]>(async (keys: readonly string[]) => {
      const replies = await Comment.find({
        parentComment: { $in: keys },
      }).sort({ createdAt: 1 });

      const repliesMap = new Map<string, IComment[]>();
      replies.forEach(reply => {
        if (reply.parentComment) {
          const parentId = reply.parentComment.toString();
          if (!repliesMap.has(parentId)) {
            repliesMap.set(parentId, []);
          }
          repliesMap.get(parentId)!.push(reply);
        }
      });
      return keys.map(key => repliesMap.get(key) || []);
    }),
  };
};
