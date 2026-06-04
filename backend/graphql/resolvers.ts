import jwt from 'jsonwebtoken';
import { PubSub } from 'graphql-subscriptions';
import User, { IUser } from '../models/User';
import Post, { IPost } from '../models/Post';
import Comment, { IComment } from '../models/Comment';

export interface AuthUser {
  id: string;
  email: string;
}

export interface ResolverContext {
  user?: AuthUser;
}

const pubsub = new PubSub();

const resolvers = {
  Query: {
    users: async (): Promise<IUser[]> => {
      return await User.find();
    },

    user: async (_: any, { id }: { id: string }): Promise<IUser | null> => {
      return await User.findById(id);
    },

    posts: async (): Promise<IPost[]> => {
      return await Post.find().sort({ createdAt: -1 });
    },

    post: async (_: any, { id }: { id: string }): Promise<IPost | null> => {
      return await Post.findById(id);
    },

    me: async (_: any, __: any, context: ResolverContext): Promise<IUser | null> => {
      if (!context.user) return null;
      return await User.findById(context.user.id);
    },
  },

  User: {
    posts: async (parent: IUser): Promise<IPost[]> => {
      return await Post.find({ author: parent.id });
    },
  },

  Post: {
    author: async (parent: IPost): Promise<IUser | null> => {
      return await User.findById(parent.author);
    },
    comments: async (parent: IPost): Promise<IComment[]> => {
      // Return top-level comments for this post
      return await Comment.find({ post: parent.id, parentComment: { $exists: false } }).sort({ createdAt: 1 });
    },
  },

  Comment: {
    post: async (parent: IComment): Promise<IPost | null> => {
      return await Post.findById(parent.post);
    },
    author: async (parent: IComment): Promise<IUser | null> => {
      return await User.findById(parent.author);
    },
    parentComment: async (parent: IComment): Promise<IComment | null> => {
      if (!parent.parentComment) return null;
      return await Comment.findById(parent.parentComment);
    },
    replies: async (parent: IComment): Promise<IComment[]> => {
      return await Comment.find({ parentComment: parent.id }).sort({ createdAt: 1 });
    },
  },

  Subscription: {
    postAdded: {
      subscribe: () => pubsub.asyncIterator(['POST_ADDED']),
    },
    commentAdded: {
      subscribe: (_: any, { postId }: { postId: string }) => {
        return pubsub.asyncIterator([`COMMENT_ADDED_${postId}`]);
      },
    },
  },

  Mutation: {
    addUser: async (_: any, { name, email }: { name: string; email: string }): Promise<IUser> => {
      const user = new User({ name, email, password: 'defaultpassword123' });
      return await user.save();
    },

    updateUser: async (
      _: any,
      { id, name, email }: { id: string; name?: string; email?: string },
      context: ResolverContext
    ): Promise<IUser | null> => {
      if (!context.user) throw new Error("Authentication required");
      const updates: Record<string, any> = {};
      if (name !== undefined) updates.name = name;
      if (email !== undefined) updates.email = email;
      return await User.findByIdAndUpdate(id, updates, { new: true });
    },

    deleteUser: async (_: any, { id }: { id: string }, context: ResolverContext): Promise<string> => {
      if (!context.user) throw new Error("Authentication required");
      
      const userPosts = await Post.find({ author: id });
      const postIds = userPosts.map(p => p.id);
      
      // Cascade delete comments on user's posts
      await Comment.deleteMany({ post: { $in: postIds } });
      // Cascade delete comments authored by the user
      await Comment.deleteMany({ author: id });
      // Cascade delete posts authored by the user
      await Post.deleteMany({ author: id });
      // Delete the user
      await User.findByIdAndDelete(id);
      
      return "User and their posts/comments deleted successfully";
    },

    addPost: async (
      _: any,
      { title, content }: { title: string; content: string },
      context: ResolverContext
    ): Promise<IPost> => {
      if (!context.user) throw new Error("Authentication required to publish");
      const post = new Post({ title, content, author: context.user.id });
      await post.save();
      
      // Publish event
      pubsub.publish('POST_ADDED', { postAdded: post });
      
      return post;
    },

    deletePost: async (_: any, { id }: { id: string }, context: ResolverContext): Promise<string> => {
      if (!context.user) throw new Error("Authentication required");
      const post = await Post.findById(id);
      if (!post) throw new Error("Post not found");
      
      if (post.author.toString() !== context.user.id) {
        throw new Error("Unauthorized to delete this post");
      }
      
      // Cascade delete comments on this post
      await Comment.deleteMany({ post: id });
      await Post.findByIdAndDelete(id);
      return "Post and its comments deleted successfully";
    },

    addComment: async (
      _: any,
      { postId, content, parentCommentId }: { postId: string; content: string; parentCommentId?: string },
      context: ResolverContext
    ): Promise<IComment> => {
      if (!context.user) throw new Error("Authentication required to comment");
      const comment = new Comment({
        content,
        post: postId,
        author: context.user.id,
        parentComment: parentCommentId || undefined,
      });
      await comment.save();
      
      // Publish event
      pubsub.publish(`COMMENT_ADDED_${postId}`, { commentAdded: comment });
      
      return comment;
    },

    register: async (
      _: any,
      { name, email, password }: { name: string; email: string; password: string }
    ): Promise<{ token: string; user: IUser }> => {
      const existing = await User.findOne({ email });
      if (existing) {
        throw new Error("Email is already in use");
      }

      const user = new User({ name, email, password });
      await user.save();

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'secret_key',
        { expiresIn: '7d' }
      );

      return { token, user };
    },

    login: async (
      _: any,
      { email, password }: { email: string; password: string }
    ): Promise<{ token: string; user: IUser }> => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error("Invalid email or password");
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new Error("Invalid email or password");
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'secret_key',
        { expiresIn: '7d' }
      );

      return { token, user };
    },
  },
};

export default resolvers;
