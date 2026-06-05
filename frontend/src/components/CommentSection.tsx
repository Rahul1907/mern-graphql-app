import React, { useState, useEffect } from 'react';
import { useMutation, useSubscription, useApolloClient } from '@apollo/client';
import { ADD_COMMENT } from '../graphql/mutations';
import { GET_SINGLE_POST } from '../graphql/queries';
import { COMMENT_ADDED_SUBSCRIPTION } from '../graphql/subscriptions';
import CommentNode from './CommentNode';
import { Comment, User } from '../types';

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  currentUser: User | null;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId, comments = [], currentUser }) => {
  const [commentContent, setCommentContent] = useState<string>('');
  const client = useApolloClient();

  // Subscribe to comments on this post
  const { data: subData } = useSubscription(COMMENT_ADDED_SUBSCRIPTION, {
    variables: { postId }
  });

  // When a comment or reply is added, fetch the updated single post to rebuild the nested tree
  useEffect(() => {
    if (subData) {
      client.query({
        query: GET_SINGLE_POST,
        variables: { id: postId },
        fetchPolicy: 'network-only'
      });
    }
  }, [subData, client, postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    await addComment({
      variables: {
        postId,
        content: commentContent,
        parentCommentId: null
      }
    });
  };

  const [addComment, { loading }] = useMutation(ADD_COMMENT, {
    refetchQueries: [{ query: GET_SINGLE_POST, variables: { id: postId } }],
    onCompleted: () => {
      setCommentContent('');
    }
  });

  return (
    <div className="posts-section" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', marginTop: '20px', paddingTop: '16px' }}>
      <div className="posts-header" style={{ marginBottom: '12px', fontSize: '0.85rem' }}>
        Comments ({comments.length})
      </div>

      {currentUser ? (
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
          <div className="form-group" style={{ display: 'flex', gap: '10px', marginBottom: '0' }}>
            <input
              type="text"
              placeholder="Add to the discussion..."
              className="input-field"
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              required
              style={{ flex: 1, padding: '10px 14px', fontSize: '0.9rem' }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: 'auto', padding: '10px 20px', fontSize: '0.9rem' }}
            >
              {loading ? 'Sending...' : 'Comment'}
            </button>
          </div>
        </form>
      ) : (
        <div style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
          Please sign in to join the conversation.
        </div>
      )}

      {comments.length === 0 ? (
        <div className="no-posts" style={{ padding: '10px 0', fontSize: '0.85rem' }}>
          No comments yet. Start the conversation!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {comments.map((comment) => (
            <CommentNode
              key={comment.id}
              comment={comment}
              postId={postId}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
