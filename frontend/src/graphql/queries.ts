import { gql } from '@apollo/client';

export const GET_USERS = gql`
  query GetUsers {
    users {
      id
      name
      email
      posts {
        id
        title
        content
      }
    }
  }
`;

export const GET_ME = gql`
  query GetMe {
    me {
      id
      name
      email
    }
  }
`;

export const GET_POSTS = gql`
  query GetPosts {
    posts {
      id
      title
      content
      author {
        id
        name
        email
      }
      comments {
        id
        content
        createdAt
        author {
          id
          name
          email
        }
        replies {
          id
          content
          createdAt
          author {
            id
            name
            email
          }
          replies {
            id
            content
            createdAt
            author {
              id
              name
              email
            }
          }
        }
      }
    }
  }
`;
