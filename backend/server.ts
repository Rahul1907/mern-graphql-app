import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import jwt from 'jsonwebtoken';

import connectDB from './config/db';
import typeDefs from './graphql/typeDefs';
import resolvers, { AuthUser, ResolverContext } from './graphql/resolvers';
import { createLoaders } from './graphql/loaders';

const startServer = async (): Promise<void> => {
  const app = express();
  const httpServer = createServer(app);

  app.use(cors());

  connectDB();

  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // Set up WebSocket server
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  const serverCleanup = useServer(
    {
      schema,
      context: (ctx): ResolverContext => {
        const connectionParams = ctx.connectionParams || {};
        const authHeader = (connectionParams.authorization || '') as string;
        let user: AuthUser | undefined = undefined;
        if (authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          try {
            user = jwt.verify(token, process.env.JWT_SECRET || 'secret_key') as AuthUser;
          } catch (e) {
            // Proceed without user
          }
        }
        return { user, loaders: createLoaders() };
      },
    },
    wsServer
  );

  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
    context: ({ req }): ResolverContext => {
      const authHeader = (req.headers.authorization || '') as string;
      let user: AuthUser | undefined = undefined;
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          user = jwt.verify(token, process.env.JWT_SECRET || 'secret_key') as AuthUser;
        } catch (error) {
          // Proceed without user
        }
      }
      return { user, loaders: createLoaders() };
    },
  });

  await server.start();

  server.applyMiddleware({
    app: app as any,
    path: '/graphql',
  });

  // Serve static assets in production
  if (process.env.NODE_ENV === 'production') {
    const path = await import('path');
    app.use(express.static(path.join(__dirname, '../frontend/build')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
    });
  }

  const PORT = process.env.PORT || 5000;

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`GraphQL Endpoint: http://localhost:${PORT}/graphql`);
    console.log(`GraphQL Subscriptions: ws://localhost:${PORT}/graphql`);
  });
};

startServer();
