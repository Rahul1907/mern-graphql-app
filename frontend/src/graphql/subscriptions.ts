import { gql } from '@apollo/client';

export const POST_ADDED_SUBSCRIPTION = gql`
  subscription OnPostAdded {
    postAdded {
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
        }
      }
    }
  }
`;

export const COMMENT_ADDED_SUBSCRIPTION = gql`
  subscription OnCommentAdded($postId: ID!) {
    commentAdded(postId: $postId) {
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
`;
