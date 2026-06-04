import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_USERS } from '../graphql/queries';
import { DELETE_USER, UPDATE_USER, DELETE_POST } from '../graphql/mutations';
import { User, Post } from '../types';

const UserList: React.FC = () => {
  const { loading, error, data } = useQuery(GET_USERS);

  // Mutations
  const [deleteUser] = useMutation(DELETE_USER, {
    refetchQueries: [{ query: GET_USERS }],
  });

  const [updateUser] = useMutation(UPDATE_USER, {
    refetchQueries: [{ query: GET_USERS }],
  });

  const [deletePost] = useMutation(DELETE_POST, {
    refetchQueries: [{ query: GET_USERS }],
  });

  // Track editing state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');

  if (loading) return <div className="status-message">Loading dashboard database...</div>;
  if (error) return <div className="status-message">Error fetching data: {error.message}</div>;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleEditClick = (user: User) => {
    setEditingUserId(user.id);
    setEditName(user.name);
    setEditEmail(user.email);
  };

  const handleUpdateSubmit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    await updateUser({
      variables: {
        id,
        name: editName,
        email: editEmail,
      },
    });
    setEditingUserId(null);
  };

  const users: User[] = data?.users || [];

  return (
    <div>
      <h2 style={{ marginBottom: '20px', fontWeight: 700, fontSize: '1.5rem' }}>Active Accounts</h2>

      {users.length === 0 ? (
        <p className="no-posts">No users found. Create a user to get started.</p>
      ) : (
        <div className="user-grid">
          {users.map((user) => (
            <div key={user.id} className="glass-card">
              {editingUserId === user.id ? (
                <form onSubmit={(e) => handleUpdateSubmit(e, user.id)} className="edit-form">
                  <div className="form-group">
                    <label className="form-label">Edit Name</label>
                    <input
                      type="text"
                      className="input-field"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Edit Email</label>
                    <input
                      type="email"
                      className="input-field"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="btn btn-primary btn-small">
                      Save
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => setEditingUserId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="user-card-header">
                    <div className="user-avatar">{getInitials(user.name)}</div>
                    <div className="user-info">
                      <div className="user-name">{user.name}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                  </div>

                  <div className="user-actions">
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => handleEditClick(user)}
                    >
                      Edit Profile
                    </button>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => deleteUser({ variables: { id: user.id } })}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}

              <div className="posts-section">
                <div className="posts-header">Publications ({user.posts?.length || 0})</div>
                {user.posts && user.posts.length > 0 ? (
                  <div className="posts-list">
                    {user.posts.map((post: Post) => (
                      <div key={post.id} className="post-item">
                        <div className="post-title">{post.title}</div>
                        <div className="post-content">{post.content}</div>
                        <button
                          className="delete-post-btn"
                          onClick={() => deletePost({ variables: { id: post.id } })}
                          title="Delete Post"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-posts">No publications by this user yet.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserList;
