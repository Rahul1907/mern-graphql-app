import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

const rawUrl = process.env.REACT_APP_BACKEND_SERVER_URL || 'http://localhost:5000/graphql';
const wsUrl = rawUrl.replace(/^http/, 'ws');

const httpLink = createHttpLink({
  uri: rawUrl,
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: wsUrl,
    connectionParams: () => {
      const token = localStorage.getItem('token');
      return {
        authorization: token ? `Bearer ${token}` : '',
      };
    },
  })
);

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  authLink.concat(httpLink)
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          posts: {
            keyArgs: false,
            merge(existing, incoming, { args }) {
              const existingPosts = existing ? existing.posts : [];
              const incomingPosts = incoming ? incoming.posts : [];
              
              const mergedPosts = !args || !args.cursor
                ? incomingPosts
                : [...existingPosts, ...incomingPosts];
                
              const uniquePosts = mergedPosts.reduce((acc: any[], post: any) => {
                if (!acc.some(p => p.__ref === post.__ref)) {
                  acc.push(post);
                }
                return acc;
              }, []);

              return {
                ...incoming,
                posts: uniquePosts,
              };
            },
          },
        },
      },
    },
  }),
});

export default client;
