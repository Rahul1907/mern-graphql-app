import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_ME } from './graphql/queries';
import AddUser from './components/AddUser';
import PostList from './components/PostList';
import Login from './components/Login';
import { User } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const token = localStorage.getItem('token');
  const { data, loading, refetch } = useQuery(GET_ME, {
    skip: !token,
  });

  useEffect(() => {
    if (data?.me) {
      setCurrentUser(data.me);
    }
  }, [data]);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    refetch();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  if (loading) {
    return <div className="status-message">Verifying authentication session...</div>;
  }

  if (!currentUser) {
    return (
      <div className="app-container">
        <h1 className="app-title">MERN + GraphQL Platform</h1>
        <Login onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <h1 className="app-title">MERN + GraphQL Platform</h1>

      <div className="dashboard-grid">
        <aside>
          <AddUser currentUser={currentUser} onLogout={handleLogout} />
        </aside>

        <main>
          <PostList currentUser={currentUser} />
        </main>
      </div>
    </div>
  );
};

export default App;
