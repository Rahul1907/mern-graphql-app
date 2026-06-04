import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { LOGIN_USER, REGISTER_USER } from '../graphql/mutations';
import { User } from '../types';

interface LoginProps {
  onAuthSuccess: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [login, { loading: loginLoading }] = useMutation(LOGIN_USER, {
    onCompleted: (data: any) => {
      localStorage.setItem('token', data.login.token);
      onAuthSuccess(data.login.user);
    },
    onError: (err) => {
      setErrorMsg(err.message);
    },
  });

  const [register, { loading: regLoading }] = useMutation(REGISTER_USER, {
    onCompleted: (data: any) => {
      localStorage.setItem('token', data.register.token);
      onAuthSuccess(data.register.user);
    },
    onError: (err) => {
      setErrorMsg(err.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (isLogin) {
      await login({ variables: { email, password } });
    } else {
      if (!name) {
        setErrorMsg('Name is required');
        return;
      }
      await register({ variables: { name, email, password } });
    }
  };

  const handleTabSwitch = (val: boolean) => {
    setIsLogin(val);
    setErrorMsg('');
    setName('');
    setEmail('');
    setPassword('');
  };

  return (
    <div style={{ maxWidth: '420px', margin: '40px auto' }} className="glass-card">
      <div className="form-tabs">
        <button
          className={`tab-btn ${isLogin ? 'active' : ''}`}
          onClick={() => handleTabSwitch(true)}
        >
          Sign In
        </button>
        <button
          className={`tab-btn ${!isLogin ? 'active' : ''}`}
          onClick={() => handleTabSwitch(false)}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-title">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid var(--danger-color)',
              color: '#fca5a5',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '16px',
            }}
          >
            {errorMsg}
          </div>
        )}

        {!isLogin && (
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              placeholder="Your Name"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            placeholder="you@example.com"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ marginTop: '10px' }}
          disabled={loginLoading || regLoading}
        >
          {loginLoading || regLoading
            ? 'Processing...'
            : isLogin
              ? 'Sign In'
              : 'Register'}
        </button>
      </form>
    </div>
  );
};

export default Login;
