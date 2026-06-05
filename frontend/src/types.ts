export interface Post {
  id: string;
  title: string;
  content: string;
  author?: User;
  comments?: Comment[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  posts?: Post[];
}

export interface Comment {
  id: string;
  content: string;
  post?: Post;
  author: User;
  parentComment?: Comment;
  replies: Comment[];
  createdAt: string;
}

declare global {
  const process: {
    env: {
      REACT_APP_BACKEND_SERVER_URL?: string;
      [key: string]: string | undefined;
    };
  };
}

