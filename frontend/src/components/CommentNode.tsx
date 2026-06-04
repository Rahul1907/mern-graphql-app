import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { ADD_COMMENT } from '../graphql/mutations';
import { GET_POSTS } from '../graphql/queries';
import { Comment, User } from '../types';

interface CommentNodeProps {
  comment: Comment;
  postId: string;
  currentUser: User | null;
}

const CommentNode: React.FC<CommentNodeProps> = ({ comment, postId, currentUser }) => {
  const [showReplyBox, setShowReplyBox] = useState<boolean>(false);
  const [replyContent, setReplyContent] = useState<string>('');

  const [addReply, { loading }] = useMutation(ADD_COMMENT, {
    refetchQueries: [{ query: GET_POSTS }],
    onCompleted: () => {
      setReplyContent('');
      setShowReplyBox(false);
    }
  });

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    await addReply({
      variables: {
        postId,
        content: replyContent,
        parentCommentId: comment.id
      }
    });
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(isNaN(Number(dateStr)) ? dateStr : Number(dateStr));
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '';
    }
  };

  return (
    <div style={{ marginTop: '12px' }}>
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          borderRadius: '10px',
          padding: '12px 16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.75rem',
              color: 'white',
              boxShadow: '0 2px 5px rgba(52, 211, 153, 0.2)'
            }}
          >
            {getInitials(comment.author?.name)}
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {comment.author?.name || 'Anonymous'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>
              {formatDate(comment.createdAt)}
            </span>
          </div>
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginLeft: '38px', lineHeight: 1.4 }}>
          {comment.content}
        </p>

        {currentUser && (
          <div style={{ marginLeft: '38px', marginTop: '6px' }}>
            <button
              className="tab-btn"
              onClick={() => setShowReplyBox(!showReplyBox)}
              style={{ padding: '2px 0', fontSize: '0.75rem', fontWeight: 500, width: 'auto', display: 'inline-block' }}
            >
              {showReplyBox ? 'Cancel Reply' : 'Reply'}
            </button>
          </div>
        )}

        {showReplyBox && (
          <form onSubmit={handleReplySubmit} style={{ marginLeft: '38px', marginTop: '10px' }}>
            <div className="form-group" style={{ marginBottom: '8px' }}>
              <input
                type="text"
                placeholder={`Reply to ${comment.author?.name || 'comment'}...`}
                className="input-field"
                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary btn-small" disabled={loading} style={{ padding: '4px 10px', fontSize: '0.75rem', width: 'auto' }}>
                {loading ? 'Replying...' : 'Submit'}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => setShowReplyBox(false)}
                style={{ padding: '4px 10px', fontSize: '0.75rem', width: 'auto' }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div
          style={{
            marginLeft: '20px',
            borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
            paddingLeft: '12px'
          }}
        >
          {comment.replies.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              postId={postId}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentNode;
