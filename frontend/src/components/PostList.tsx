import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_POSTS } from '../graphql/queries';
import { ADD_POST, DELETE_POST } from '../graphql/mutations';
import { POST_ADDED_SUBSCRIPTION } from '../graphql/subscriptions';
import CommentSection from './CommentSection';
import { User, Post } from '../types';

interface PostListProps {
  currentUser: User | null;
}

const PostList: React.FC<PostListProps> = ({ currentUser }) => {
  const { loading, error, data, subscribeToMore, fetchMore } = useQuery(GET_POSTS, {
    variables: { limit: 5, cursor: null },
    notifyOnNetworkStatusChange: true,
  });

  // Post form state
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');

  // Mutations
  const [addPost, { loading: addLoading }] = useMutation(ADD_POST, {
    refetchQueries: [{ query: GET_POSTS, variables: { limit: 5, cursor: null } }],
  });

  const [deletePost] = useMutation(DELETE_POST, {
    refetchQueries: [{ query: GET_POSTS, variables: { limit: 5, cursor: null } }],
  });

  // Subscribe to real-time posts
  useEffect(() => {
    const unsubscribe = subscribeToMore({
      document: POST_ADDED_SUBSCRIPTION,
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        const newPost = subscriptionData.data.postAdded;

        // Prevent duplicates
        if (prev.posts.posts.find((p: Post) => p.id === newPost.id)) {
          return prev;
        }

        return {
          ...prev,
          posts: {
            ...prev.posts,
            posts: [newPost, ...prev.posts.posts],
          },
        };
      },
    });
    return () => unsubscribe();
  }, [subscribeToMore]);

  // Intersection Observer for Infinite Scroll
  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const sensorRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && data?.posts.hasMore) {
          fetchMore({
            variables: {
              cursor: data.posts.cursor,
            },
          });
        }
      });

      observerRef.current.observe(node);
    },
    [loading, data?.posts.hasMore, data?.posts.cursor, fetchMore]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    await addPost({
      variables: { title, content }
    });

    setTitle('');
    setContent('');
  };

  if (loading && !data) return <div className="status-message">Loading publication feed...</div>;
  if (error) return <div className="status-message">Error fetching publications: {error.message}</div>;

  const posts: Post[] = data?.posts.posts || [];

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

      {currentUser && (
        <div className="glass-card">
          <form onSubmit={handleSubmit}>
            <div className="form-title">Publish an Article</div>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input
                type="text"
                placeholder="What's on your mind?"
                className="input-field"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Content</label>
              <textarea
                placeholder="Write your article body here..."
                className="input-field"
                style={{ minHeight: '120px', resize: 'vertical' }}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={addLoading}>
              {addLoading ? 'Publishing...' : 'Publish'}
            </button>
          </form>
        </div>
      )}

      <div>
        <h2 style={{ marginBottom: '20px', fontWeight: 700, fontSize: '1.5rem' }}>Publication Feed</h2>
        {posts.length === 0 ? (
          <p className="no-posts">No publications found. Be the first to share your thoughts!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {posts.map((post) => {
              const isAuthor = currentUser && post.author?.id === currentUser.id;
              return (
                <div key={post.id} className="glass-card" style={{ padding: '20px' }}>
                  <div className="user-card-header" style={{ marginBottom: '12px' }}>
                    <div className="user-avatar" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                      {getInitials(post.author?.name)}
                    </div>
                    <div className="user-info">
                      <div className="user-name" style={{ fontSize: '1rem' }}>
                        {post.author?.name || 'Unknown Author'}
                      </div>
                      <div className="user-email" style={{ fontSize: '0.8rem' }}>
                        {post.author?.email || ''}
                      </div>
                    </div>
                    {isAuthor && (
                      <button
                        className="btn btn-danger btn-small"
                        onClick={() => deletePost({ variables: { id: post.id } })}
                        style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px' }}
                      >
                        Delete Post
                      </button>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                    {post.title}
                  </h3>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                    {post.content}
                  </p>

                  <CommentSection
                    postId={post.id}
                    comments={post.comments || []}
                    currentUser={currentUser}
                  />
                </div>
              );
            })}

            {/* Infinite Scroll Sensor */}
            <div ref={sensorRef} style={{ height: '20px', margin: '10px 0' }} />

            {/* Fetching more loading indicator */}
            {loading && (
              <div className="status-message" style={{ padding: '10px 0', fontSize: '0.9rem' }}>
                Loading more articles...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostList;
