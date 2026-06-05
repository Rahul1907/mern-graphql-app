import { gql } from 'apollo-server-express';

const typeDefs = gql`
  type Comment {
    id: ID!
    content: String!
    post: Post!
    author: User!
    parentComment: Comment
    replies: [Comment!]!
    createdAt: String!
  }

  type Post {
    id: ID!
    title: String!
    content: String!
    author: User!
    comments: [Comment!]!
  }

  type PostConnection {
    posts: [Post!]!
    cursor: String
    hasMore: Boolean!
  }

  type User {
    id: ID!
    name: String!
    email: String!
    posts: [Post]
  }

  type AuthResponse {
    token: String!
    user: User!
  }

  type Query {
    users: [User]
    user(id: ID!): User
    posts(limit: Int, cursor: String): PostConnection!
    post(id: ID!): Post
    me: User
  }

  type Subscription {
    postAdded: Post!
    commentAdded(postId: ID!): Comment!
  }

  type Mutation {
    updateUser(id: ID!, name: String, email: String): User
    deleteUser(id: ID!): String
    addPost(title: String!, content: String!): Post
    deletePost(id: ID!): String
    addComment(postId: ID!, content: String!, parentCommentId: ID): Comment!
    register(name: String!, email: String!, password: String!): AuthResponse!
    login(email: String!, password: String!): AuthResponse!
  }
`;

export default typeDefs;
