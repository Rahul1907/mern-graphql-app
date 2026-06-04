import React from 'react';
import { User } from '../types';

interface AddUserProps {
  currentUser: User | null;
  onLogout: () => void;
}

const AddUser: React.FC<AddUserProps> = ({ currentUser, onLogout }) => {
  const getInitials = (name: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {currentUser && (
        <div className="glass-card">
          <div className="form-title">Logged In As</div>
          <div className="user-card-header" style={{ marginBottom: '16px' }}>
            <div className="user-avatar">{getInitials(currentUser?.name || '')}</div>
            <div className="user-info">
              <div className="user-name">{currentUser?.name}</div>
              <div className="user-email">{currentUser?.email}</div>
            </div>
          </div>
          <button className="btn btn-danger" onClick={onLogout} style={{ width: '100%' }}>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default AddUser;
